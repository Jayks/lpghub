# app/ — Routes, Features, Project Structure

> Claude Code reference for the `app/` directory.
> Parent file: `../CLAUDE.md`

---

## Route Groups

The app uses Next.js route groups to co-locate layouts, loading states, and error boundaries by persona:

| Group | URL prefix | Persona | Layout |
|---|---|---|---|
| `(admin)` | `/admin/*` | Admin | `AppShell` + `PushRegistrar` |
| `(auth)` | `/login` | All | Bare (no nav) |
| `(customer)` | `/`, `/orders/*`, `/payments/*`, `/settings` | Customer | `AppShell` + `PushRegistrar` |
| `(delivery)` | `/delivery/*` | Delivery Person | `AppShell` + `PushRegistrar` |

`AppShell` renders the role-appropriate navigation (sidebar on desktop, `BottomNav` on mobile). It reads the user's role from the cookie set by `proxy.ts`.

`PushRegistrar` is an invisible client component that registers the service worker and creates a push subscription silently in the background. It runs once per session after mount.

---

## All Pages

### Admin — `app/(admin)/admin/`

| File | URL | What it renders |
|---|---|---|
| `page.tsx` | `/admin` | KPI cards (active customers, pending payments, total orders, low stock items); low stock alert list; quick-action links |
| `customers/page.tsx` | `/admin/customers` | Paginated customer list with avatar, active badge, chevron → detail |
| `customers/new/page.tsx` | `/admin/customers/new` | `CustomerForm` for manual onboarding + caution deposit |
| `customers/[id]/page.tsx` | `/admin/customers/[id]` | Customer detail: info, caution deposit, order history |
| `orders/page.tsx` | `/admin/orders` | Filterable order list; uses `OrderFilterPills` client component + `searchParams` |
| `orders/[id]/page.tsx` | `/admin/orders/[id]` | Order detail via `getAdminOrderDetail`; payment actions; assignment form |
| `payments/page.tsx` | `/admin/payments` | Payment confirmation queue; `PaymentActionButtons` (confirm / reject) |
| `inventory/page.tsx` | `/admin/inventory` | Stock cards per cylinder type; `AdjustStockForm`; recent adjustments log |
| `deliveries/page.tsx` | `/admin/deliveries` | Three panels: unassigned orders, in-progress deliveries, delivery team toggle |
| `deliveries/persons/new/page.tsx` | `/admin/deliveries/persons/new` | Add delivery person form |
| `settings/page.tsx` | `/admin/settings` | `SettingsForm` (global config) + `NotificationToggle` |

### Auth — `app/(auth)/`

| File | URL | What it renders |
|---|---|---|
| `login/page.tsx` | `/login` | Three-tab login: Customer (phone OTP), Delivery (phone OTP), Admin (email+password). Uses `LoginForm` client component. |

### Customer — `app/(customer)/`

| File | URL | What it renders |
|---|---|---|
| `page.tsx` | `/` | Greeting, "Book Cylinders" CTA, recent orders list |
| `orders/page.tsx` | `/orders` | Full order history |
| `orders/new/page.tsx` | `/orders/new` | `NewOrderForm`: live stock + per-type quantity pickers, eligibility limit enforcement |
| `orders/[id]/page.tsx` | `/orders/[id]` | Order detail: 6-step delivery timeline, `CancelOrderButton`, pay CTA → `/payments/[orderId]` |
| `payments/[orderId]/page.tsx` | `/payments/[orderId]` | GPay intent deep link button; manual UPI VPA display; QR code placeholder; `ReportPaymentForm` |
| `settings/page.tsx` | `/settings` | `NotificationToggle` for web push opt-in |

### Delivery — `app/(delivery)/`

| File | URL | What it renders |
|---|---|---|
| `delivery/page.tsx` | `/delivery` | List of assigned deliveries with status and customer info |
| `delivery/deliveries/[id]/page.tsx` | `/delivery/deliveries/[id]` | Delivery detail + `DeliveryStatusButtons` (dispatch → delivered) |
| `delivery/settings/page.tsx` | `/delivery/settings` | `NotificationToggle` |

---

## Server Actions — `app/actions/`

All actions follow the shared return shape: `{ ok: true, data?: T }` or `{ ok: false, error: string }`. Never throw to the client.

| File | Key actions |
|---|---|
| `auth.ts` | `sendOtp`, `verifyOtp`, `adminSignIn`, `signOut` |
| `customers.ts` | `createCustomer`, `updateCustomer`, `toggleCustomerActive` |
| `deliveries.ts` | `assignDelivery`, `updateDeliveryStatus` (dispatch / delivered) |
| `delivery-persons.ts` | `createDeliveryPerson`, `toggleDeliveryPersonActive` |
| `inventory.ts` | `adjustInventory` |
| `orders.ts` | `createOrder`, `cancelOrder` |
| `payments.ts` | `reportPayment`, `confirmPayment`, `rejectPayment` |
| `push.ts` | `savePushSubscription`, `deletePushSubscription` |
| `settings.ts` | `updateSetting` |

---

## API Routes — `app/api/`

| Route | Method | Purpose |
|---|---|---|
| `/api/push/subscribe` | POST | Saves a `PushSubscription` to `push_subscriptions` (called by `PushRegistrar`) |
| `/api/push/unsubscribe` | POST | Removes a `PushSubscription` |

---

## Auth Flow

### Phone OTP (Customer + Delivery Person)

```
/login (Customer or Delivery tab)
  → sendOtp(phone)            # app/actions/auth.ts
  → [OTP input appears]
  → verifyOtp(phone, otp)     # supabase.auth.verifyOtp
  → ensureRole(userId, role)  # inserts into user_roles if first time
  → linkCustomerAccount()     # links auth user to customers.auth_user_id
  → sets lpghub-role cookie
  → proxy.ts redirects to role home (/ or /delivery)
```

**Test mode:** When `NEXT_PUBLIC_TEST_MODE=true`, `sendOtp` skips Supabase and `verifyOtp` accepts `"123456"` for any number. The login form shows test credentials on-screen.

### Admin (Email + Password)

```
/login (Admin tab)
  → adminSignIn(email, password)  # supabase.auth.signInWithPassword
  → sets lpghub-role cookie to "admin"
  → proxy.ts redirects to /admin
```

---

## Middleware — `proxy.ts`

Next.js 16 uses `proxy.ts` (not `middleware.ts`) with a `proxy` export:

```typescript
export function proxy(request: NextRequest) { … }
export const config = { matcher: ['/admin/:path*', '/delivery/:path*', …] };
```

**Role routing:**
- Reads `lpghub-role` cookie set at login
- `/admin/*` → requires `admin`; redirects others to `/login`
- `/delivery/*` → requires `delivery_person`; redirects others to `/login`
- Customer routes (`/`, `/orders/*`, `/payments/*`, `/settings`) → requires `customer`
- Unauthenticated → `/login`

---

## Realtime

Supabase Realtime subscribes to `postgres_changes` on tables (e.g. orders, payments) and calls `router.refresh()` when changes are received. **Gated with `process.env.NODE_ENV === "production"`** to avoid burning Supabase free-tier CPU in dev.

---

## Error Handling

- **Page-load errors** (RSC throws) → `error.tsx` boundary → `ErrorCard` component
- **Mutation errors** → server action returns `{ ok: false, error }` → `sonner` toast
- Retry pattern in `error.tsx`: `router.refresh()` AND `reset()` both called

---

## Loading States

Each route has a co-located `loading.tsx` that renders `LoadingSkeleton`. The skeleton matches the shape of the real content to prevent layout shift.

---

## Known Gaps

| Item | File | Notes |
|---|---|---|
| QR code placeholder | `(customer)/payments/[orderId]/page.tsx` | Static image placeholder, not dynamically generated |
| Self-registration | Not yet implemented | Onboarding is admin-only; see CLAUDE.md §3 architecture note |
