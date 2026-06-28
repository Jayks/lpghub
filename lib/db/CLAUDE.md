# lib/db/ — Schema, Queries, Algorithms

> Claude Code reference for the database layer.
> Parent file: `../../CLAUDE.md`

---

## Schema — `lib/db/schema.ts`

All tables use:
- `id: uuid PK default gen_random_uuid()`
- `created_at: timestamptz default now()` (where applicable)
- Money fields: `numeric(12,2)` — never float or integer cents
- Statuses: `text` columns + Zod enum validation (not Postgres enums)
- Foreign keys: `ON DELETE CASCADE` unless otherwise noted

### Tables

#### `user_roles`
Maps Supabase auth `user_id` → role string. Role is resolved here, not from JWT claims.
```
id, userId, role ("admin" | "customer" | "delivery_person"), createdAt
```

#### `customers`
B2B business accounts. `authUserId` is set when the customer first logs in (links auth.users → customers).
```
id, businessName, contactPerson, phone (unique), address,
isActive (default false), eligibilityLimit (default 5),
authUserId (nullable — set on first OTP login), createdAt
```

#### `caution_deposits`
One-to-many with customers. A customer becomes active after a deposit is recorded.
```
id, customerId→customers, amount, paidOn (date),
paymentMode ("cash"|"upi"|"bank_transfer"|"cheque"),
referenceNo (nullable), status (default "received"), notes, createdAt
```

#### `cylinder_types`
Three rows seeded at schema push: 15kg, 17kg, 20kg.
```
id, label ("15kg"|"17kg"|"20kg"), unitPrice
```

#### `inventory`
One row per cylinder type. `totalStock = availableStock + reservedStock + deliveredStock` (maintained by application logic, not a generated column).
```
id, cylinderTypeId→cylinder_types,
totalStock, availableStock, reservedStock, deliveredStock,
updatedAt
```

#### `inventory_adjustments`
Audit log for every stock change made by admin.
```
id, cylinderTypeId→cylinder_types, delta (positive=add, negative=reduce),
reason, adjustedBy (user uuid), createdAt
```

#### `orders`
Core transaction record. `orderNumber` is a human-readable serial (e.g. 1042).
```
id, orderNumber (serial, unique), customerId→customers,
status (see order status model), totalAmount, notes, createdAt, updatedAt
```

#### `order_line_items`
One row per cylinder type per order.
```
id, orderId→orders, cylinderTypeId→cylinder_types, quantity, unitPrice
```

#### `payments`
One payment attempt per order. `status`: `"pending"` | `"payment_pending_confirmation"` | `"confirmed"` | `"failed"`.
```
id, orderId→orders, amount, upiLink, paymentRef,
payerReportedStatus, adminConfirmedBy (user uuid, nullable),
adminConfirmedAt (nullable), status, createdAt
```

#### `delivery_persons`
Separate from `customers`. Phone used for OTP login; role row in `user_roles` links them.
```
id, name, phone (unique), isActive (default true), createdAt
```

#### `delivery_assignments`
One assignment per order. `status`: `"assigned"` | `"dispatched"` | `"delivered"`.
```
id, orderId→orders, deliveryPersonId→delivery_persons,
assignedAt, dispatchedAt (nullable), deliveredAt (nullable),
remarks (nullable), status (default "assigned"), createdAt
```

#### `admin_settings`
Key-value store for global configuration. Key is a `text` primary key.
```
key (PK), value, updatedBy (user uuid), updatedAt
```

Known keys: `max_cylinders_per_order`, `caution_deposit_amount`, `low_stock_threshold`, `payment_confirmation_workflow`, `delivery_assignment_mode`

#### `audit_log`
Append-only event log for significant state changes.
```
id, entityType, entityId, action, changedBy (user uuid), meta (jsonb), createdAt
```

#### `push_subscriptions`
Web push endpoint per user per browser. `(userId, endpoint)` has a unique constraint.
```
id, userId (→auth.users), endpoint, p256dh, auth, createdAt
```

---

## DB Client — `lib/db/client.ts`

Drizzle + postgres.js singleton. Uses `globalThis._pgClient` to survive HMR in dev without exhausting connections.

```typescript
// Never import postgres() again — always import the default export from this file
import pgClient from "@/lib/db/client";
const db = drizzle(pgClient);
```

Connection: Session Pooler URL (`DATABASE_URL`). `max: 3` connections, `prepare: false` (required for PgBouncer).

---

## Queries — `lib/db/queries/`

All query functions are plain `async` functions (not `cache()`-wrapped by default). Wrap in `unstable_cache` at the call site when caching is needed.

| File | Key exports |
|---|---|
| `auth.ts` | `getCurrentUser()` — React `cache()`-wrapped; reads Supabase user + role from `user_roles` |
| `admin-stats.ts` | `getAdminStats()` — active customers count, pending payments count, total orders, low stock items |
| `admin-order-detail.ts` | `getAdminOrderDetail(orderId)` — joins order + line items + payment + delivery assignment |
| `customers.ts` | `getCustomers()`, `getCustomerById(id)`, `getCustomerByAuthUserId(userId)` |
| `customer-orders.ts` | `getCustomerOrders(customerId)` — orders + line items for the customer view |
| `deliveries.ts` | `getDeliveries()` — all assignments with order + customer; `getDeliveryById(id)` |
| `inventory.ts` | `getInventory()` — all cylinder types joined with inventory; `getRecentAdjustments()` |
| `orders.ts` | `getOrders(filters?)` — filterable order list for admin; `getOrderById(id)` |
| `payments.ts` | `getPendingPayments()` — orders in `payment_pending_confirmation` with payment row |
| `settings.ts` | `getSettings()` — all rows from `admin_settings` as a key→value map |

### `getCurrentUser()` — the canonical auth query

```typescript
// lib/db/queries/auth.ts
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [roleRow] = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));
  return { ...user, role: roleRow?.role ?? "customer" };
});
```

**Always use this. Never call `supabase.auth.getUser()` inline.** It is `cache()`-wrapped so it only makes one validated network call per RSC render tree, regardless of how many layouts and pages call it.

---

## Inventory Compute — `lib/inventory/compute.ts`

Pure functions for inventory math. **No DB calls inside.** Accept the raw inventory row and return computed values.

```typescript
// Check if a quantity can be fulfilled
canFulfill(inventory: InventoryRow, qty: number): boolean

// Compute what available_stock becomes after a booking
afterBooking(inventory: InventoryRow, qty: number): InventorySnapshot

// Compute what available_stock becomes after a cancellation
afterCancellation(inventory: InventoryRow, qty: number): InventorySnapshot

// Compute what reserved/delivered stock becomes after delivery
afterDelivery(inventory: InventoryRow, qty: number): InventorySnapshot
```

Tests: `lib/inventory/compute.test.ts`

---

## Zod Schemas — `lib/schemas/`

Schemas are **shared** across three uses: react-hook-form `zodResolver`, server action input validation, and Drizzle insert. Never duplicate validation logic.

| File | Schemas exported |
|---|---|
| `customer.ts` | `CustomerFormSchema`, `CreateCustomerSchema`, `UpdateCustomerSchema` |
| `inventory.ts` | `AdjustInventorySchema` |

Tests: `*.test.ts` alongside each schema file.

---

## Utility Functions — `lib/utils/`

| File | Exports | Notes |
|---|---|---|
| `cn.ts` | `cn(...classes)` | clsx + tailwind-merge |
| `format-currency.ts` | `formatCurrency(amount, "INR")` | Always pass `"INR"` explicitly |
| `format-date.ts` | `formatDate(date)` | date-fns, locale-aware |
| `format-order-number.ts` | `formatOrderNumber(n)` | Zero-pads to 4 digits: `#0042` |
| `format-phone.ts` | `formatPhone(phone)` | Normalises to `+91XXXXXXXXXX` |
| `nav.ts` | `isNavItemActive(pathname, href, exact?)` | Used by sidebar + bottom nav |
| `upi.ts` | `buildUpiLink(orderId, amount)`, `buildGPayIntentUrl(upiLink)` | Reads UPI env vars |
| `haptics.ts` | `hapticFeedback(type)` | Wraps `navigator.vibrate()` with a no-op fallback |

---

## Config — `lib/config/`

| File | Exports |
|---|---|
| `order-filters.ts` | `ORDER_FILTER_OPTIONS` — array of `{ label, value, statuses[] }` used by `OrderFilterPills` and admin order queries. Single source of truth so filter labels and status arrays stay in sync. |

---

## Supabase Clients — `lib/supabase/`

Three distinct clients — use the right one for the context:

| File | Export | When to use |
|---|---|---|
| `server.ts` | `createClient()` (async) | Server Components, Server Actions, Route Handlers — uses `@supabase/ssr` cookie store |
| `client.ts` | `createClient()` (sync) | Client Components only |
| `admin.ts` | `createAdminClient()` | Service role operations (e.g. admin creating Supabase auth users) — never in client code |

---

## Notifications — `lib/notifications/`

| File | Exports | Notes |
|---|---|---|
| `send-push.ts` | `sendPushToUser(userId, payload)` | Queries `push_subscriptions`, calls `web-push` for each endpoint. **Dynamic import** of `web-push` required — static import crashes Turbopack. |
| `subscribe.ts` | `subscribeToPush()` | Client-side: registers SW → calls `pushManager.subscribe()` → POSTs to `/api/push/subscribe` |

---

## RLS Policies

Source of truth: `drizzle/policies.sql`. Applied manually via Supabase SQL editor.

Pattern:
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers read only their own orders
CREATE POLICY "customers read own orders" ON orders
  FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Admins full access
CREATE POLICY "admins full access" ON orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

**Never rely on RLS alone** — server actions validate role via `getCurrentUser()` before mutating.

---

## Stock Lifecycle (summary)

| Event | `available_stock` | `reserved_stock` | `delivered_stock` |
|---|---|---|---|
| Booking created | `−qty` | `+qty` | — |
| Booking cancelled/rejected | `+qty` | `−qty` | — |
| Payment confirmed | — | — | — |
| Delivered | — | `−qty` | `+qty` |

All stock mutations are atomic DB transactions (Drizzle `db.transaction()`).
