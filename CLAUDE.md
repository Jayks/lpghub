# CLAUDE.md — LPGHub

> Source of truth for Claude Code. Stack is locked — see Section 2.
>
> **Current build status:** App is **fully implemented and deployed** on Vercel. DB schema is live on Supabase. All pages for all three personas are complete. 203 tests passing, 0 TS errors. See `README.md` for known gaps.
>
> **Reference files (sub-directory CLAUDE.md files — load automatically):**
> `lib/db/CLAUDE.md` — schema, queries, algorithms · `components/CLAUDE.md` — design system, UI patterns · `app/CLAUDE.md` — routes, features, project structure

---

## 1. Project Overview

**LPGHub** is a commercial gas cylinder booking and delivery platform for distribution agencies. It handles B2B customer onboarding, cylinder inventory management, UPI payment collection, admin approval workflows, and last-mile delivery tracking — all deployed on Vercel + Supabase (free tier).

### Core Domain Concepts

| Entity | What it is | Lifecycle / Key Properties |
|---|---|---|
| **Customer** | A B2B business account registered with the agency | Business name, contact person, phone number, delivery address, caution deposit status, cylinder eligibility limit, active/inactive |
| **Cylinder Inventory** | Agency stock of commercial gas cylinders | Cylinder type (15 kg / 17 kg / 20 kg), total/available/reserved/delivered stock, adjustment history |
| **Booking Order** | A customer request to receive cylinders | Draft → Pending Payment → Payment Pending Confirmation → Confirmed → Assigned → Out for Delivery → Delivered → Cancelled/Rejected |
| **Payment** | A UPI payment attempt tied to an order | Order ref, amount, UPI link, payment reference ID, payer-reported status, admin confirmation status, timestamps |
| **Delivery Assignment** | Mapping of a confirmed order to a delivery person | Assigned person, assigned date, dispatch status, delivery remarks, delivery timestamp |
| **Caution Deposit** | Refundable onboarding deposit enabling a customer to order | Amount, date, payment mode, receipt/reference number, status, notes |

### Terminology — must stay consistent across UI copy and code

| Term | Meaning |
|---|---|
| Customer | A B2B business account — not a generic "user" |
| Booking | The customer action of requesting cylinders |
| Order | The system transaction record for a booking's full lifecycle |
| Cylinder Type | 15 kg, 17 kg, or 20 kg — the three stock-keeping variants |
| Eligibility Limit | Admin-defined max cylinders a specific customer may order |
| Caution Deposit | The onboarding deposit collected before a customer becomes active |
| Payment Pending Confirmation | Post-UPI-attempt state before admin/server verification |
| Confirmed | Payment verified; order approved for fulfillment |
| Delivery Assignment | Operational mapping of a confirmed order to a delivery person |
| Delivered | Final status updated by the assigned delivery person after handover |

---

## 2. Personas & Access

| Persona | Primary purpose | Core permissions |
|---|---|---|
| **Admin** | Manages customers, stock, orders, payments, delivery assignments | Full access: master data, approvals, inventory, reports, config |
| **Customer** | Places cylinder orders and tracks status | View stock, book cylinders, pay via UPI, track order & delivery status |
| **Delivery Person** | Marks assigned cylinders as delivered | View assigned deliveries, update delivery completion status |

**Authentication rules:**

| Persona | Method | Notes |
|---|---|---|
| Customer | Phone number + OTP (Supabase phone auth) | SMS OTP, 6-digit, 60s expiry |
| Delivery Person | Phone number + OTP (Supabase phone auth) | Same flow as customer; role resolved from `user_roles` table |
| Admin | Email + password (Supabase email auth) | Protected behind `/admin` routes; role stored as `admin` in `user_roles` |

After successful login, the auth action sets a `lpghub-role` cookie. `proxy.ts` reads this cookie to enforce route access per persona. `getCurrentUser()` (server-side, `cache()`-wrapped) validates the session with Supabase and looks up the role from `user_roles`. Unauthenticated requests to protected routes redirect to `/login`.

---

## 3. Feature Scope

### Customer-facing
- Login via mobile number + OTP (self-service)
- View available stock by cylinder type (15 kg, 17 kg, 20 kg)
- Place bookings within eligibility limit
- Initiate payment via UPI deep link (GPay-first)
- See payment status: Pending / Payment Pending Confirmation / Confirmed / Failed
- Track delivery status: Assigned / Out for Delivery / Delivered
- Receive web push notifications on key order status changes (payment confirmed, order assigned, out for delivery, delivered)

> **Architecture note — future self-registration:** Customer onboarding is **admin-only for now**. The onboarding form lives at `/admin/customers/new` and is guarded by the admin route matcher in `proxy.ts`. When the time comes to open it to customers, the change is: (1) extract the form to a public route (e.g. `/register`), (2) add a caution-deposit pending state for self-registered customers, (3) update `proxy.ts` matcher accordingly. Do not tightly couple the form to admin-only assumptions.

### Admin
- Manual customer onboarding and caution deposit management
- Configure max cylinders allowed per customer and per order
- Maintain inventory: add, reduce, adjust, audit stock
- Confirm or reject payments after customer reports payment
- Approve or reject bookings if needed
- Assign delivery personnel to confirmed orders
- View customer-wise order history and cylinder counts
- Receive web push notifications for payment confirmations, new orders, and delivery completions

### Delivery Person
- View assigned deliveries (phone OTP login, same flow as customers)
- Update delivery completion status after handover — **goes live immediately**, no admin validation step
- Capture completion timestamp and optional remarks

---

## 4. Order Status Model

| Status | Meaning |
|---|---|
| `draft` | Customer started but did not submit |
| `pending_payment` | Order created, awaiting UPI payment |
| `payment_pending_confirmation` | Customer paid; awaiting admin verification |
| `confirmed` | Admin verified payment; approved for fulfillment |
| `assigned` | Delivery person allocated |
| `out_for_delivery` | Delivery in progress |
| `delivered` | Cylinder delivered — final state |
| `cancelled` | Cancelled before completion |
| `rejected` | Rejected by admin |

---

## 5. Navigation Model

Route groups separate the three personas. See `app/CLAUDE.md` for the full page inventory.

| Route | Persona | Purpose |
|---|---|---|
| `/login` | All | Shared login — phone OTP (customer/delivery) or email+password (admin) |
| `/` | Customer | Home: greeting, book CTA, recent orders |
| `/orders`, `/orders/new`, `/orders/[id]` | Customer | Order history, booking form, order detail + timeline |
| `/payments/[orderId]` | Customer | UPI deep link, manual VPA, report-payment form |
| `/settings` | Customer | Notification toggle |
| `/delivery`, `/delivery/deliveries/[id]` | Delivery | Assigned deliveries, delivery detail + completion |
| `/delivery/settings` | Delivery | Notification toggle |
| `/admin` | Admin | KPI dashboard |
| `/admin/customers`, `/admin/customers/new`, `/admin/customers/[id]` | Admin | Customer management + onboarding |
| `/admin/orders`, `/admin/orders/[id]` | Admin | Order list + detail with payment/assignment controls |
| `/admin/payments` | Admin | Pending payment confirmation queue |
| `/admin/inventory` | Admin | Stock workspace with adjustment log |
| `/admin/deliveries`, `/admin/deliveries/persons/new` | Admin | Delivery pipeline + add delivery person |
| `/admin/settings` | Admin | Global config + notification toggle |

> **Note:** Customer onboarding lives at `/admin/customers/new` (admin-only). See §3 architecture note for how to open it to self-registration in future.

---

## 6. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Admin shall create customer accounts manually through a form | High |
| FR-02 | System shall store customer caution deposit amount and date | High |
| FR-03 | Customer shall log in using mobile number and OTP | High |
| FR-04 | Customer shall see available cylinder stock by type | High |
| FR-05 | Admin shall configure max cylinders allowed per customer | High |
| FR-06 | Customer shall book only within allowed quantity limits | High |
| FR-07 | System shall create an order record before payment | High |
| FR-08 | System shall generate a UPI deep link for payment | High |
| FR-09 | App shall return to booking app after payment attempt | High |
| FR-10 | Order shall remain pending until admin confirmation | High |
| FR-11 | Admin shall confirm or reject payment | High |
| FR-12 | Delivery person shall update delivery completion | High |
| FR-13 | Customer shall see order status changes in real time or near real time | High |
| FR-14 | Admin shall manage inventory quantities and adjustments | High |
| FR-15 | Admin shall view customer-wise order history and cylinder counts | Medium |

---

## 7. Business Rules

- A customer can order only within their admin-configured eligibility limit
- A booking must not exceed available inventory
- A caution deposit must be recorded before the customer becomes active for ordering
- Payment marked confirmed only after admin verification or trusted server-side confirmation
- Delivery can be marked completed only by the assigned delivery person or admin
- **Delivery status goes live immediately** when the delivery person marks it — no secondary admin confirmation required
- Inventory must be adjusted consistently with booking, cancellation, and delivery rules
- Customer order history must be preserved for audit and limit enforcement
- **Stock lifecycle:**
  - At booking creation → decrement `available_stock`, increment `reserved_stock`
  - At payment confirmation → no further stock change (already reserved)
  - At cancellation/rejection → restore `available_stock`, decrement `reserved_stock`
  - At delivery → decrement `reserved_stock`, increment `delivered_stock`

---

## 8. Payment Requirements

UPI intent flow (GPay-first):
1. System creates order in `pending_payment` state
2. System generates a UPI deep link with order reference, amount, and payee details
3. Customer is redirected to the UPI app (GPay / BHIM / any PSP)
4. After payment attempt, PSP returns customer to the merchant app
5. Order moves to `payment_pending_confirmation` — **not yet confirmed**
6. Admin reviews payment reference and confirms or rejects
7. On confirmation, order moves to `confirmed` and fulfillment begins

**Never trust the UPI app return state alone.** Final confirmation is always admin-driven or server-side verified.

---

## 9. Data Entities

| Entity | Key fields |
|---|---|
| `customers` | id, business_name, contact_person, phone, address, is_active, eligibility_limit, created_at |
| `caution_deposits` | id, customer_id, amount, paid_on, payment_mode, reference_no, status, notes |
| `otp_sessions` | id, phone, otp_hash, expires_at, verified_at |
| `cylinder_types` | id, label (15kg/17kg/20kg), unit_price |
| `inventory` | id, cylinder_type_id, total_stock, available_stock, reserved_stock, delivered_stock |
| `inventory_adjustments` | id, cylinder_type_id, delta, reason, adjusted_by, created_at |
| `orders` | id, customer_id, status, total_amount, notes, created_at, updated_at |
| `order_line_items` | id, order_id, cylinder_type_id, quantity, unit_price |
| `payments` | id, order_id, amount, upi_link, payment_ref, payer_reported_status, admin_confirmed_by, admin_confirmed_at, status |
| `delivery_assignments` | id, order_id, delivery_person_id, assigned_at, dispatched_at, delivered_at, remarks, status |
| `delivery_persons` | id, name, phone, is_active |
| `admin_settings` | key, value, updated_by, updated_at |
| `audit_log` | id, entity_type, entity_id, action, changed_by, meta, created_at |

Money fields: `numeric(12,2)`. Dates: `date`. Timestamps: `timestamptz`. All PKs: `uuid default gen_random_uuid()`.

---

## 10. Admin Configuration Settings

| Setting key | Purpose |
|---|---|
| `max_cylinders_per_order` | Global max cylinders per single order |
| `caution_deposit_amount` | Default caution deposit expected |
| `low_stock_threshold` | Alert when available stock drops below this value |
| `payment_confirmation_workflow` | `admin_only` or `auto` (for future webhook integration) |
| `delivery_assignment_mode` | `manual` or `auto_round_robin` |

---

## 11. Tech Stack (LOCKED — do not substitute without asking)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | |
| Styling | Tailwind CSS v4 | CSS-first config, no `tailwind.config.ts` |
| UI | shadcn/ui | Uses **@base-ui/react** (not Radix) — see gotchas |
| Animation | Framer Motion 12 | Subtle only |
| Charts | Recharts 3 | Admin dashboard pages only |
| Icons | lucide-react | |
| Database | Supabase Postgres | Free tier |
| Auth | Supabase Auth | Phone OTP (customers + delivery); email+password (admin) — `@supabase/ssr` v0.6 |
| Realtime | Supabase Realtime | `postgres_changes` → `router.refresh()` |
| ORM | Drizzle 0.45 / drizzle-kit 0.31 | |
| Validation | Zod 3 | |
| Forms | react-hook-form 7 + zodResolver | |
| Toasts | sonner 2 | |
| Date utils | date-fns 4 | |
| Theme | next-themes 0.4 | ThemeProvider in root layout |
| Deployment | Vercel | |
| Push notifications | `web-push 3.6.7` | Server-only, **dynamic import required** — see gotchas |

**Do NOT add**: NextAuth, Prisma, Redux, MUI, Chakra, Bootstrap, styled-components, tRPC, Pusher/Ably.

---

## 12. Critical Gotchas

> These are stack-level facts that have burned us in production. Read before touching any related code.

### shadcn/ui uses @base-ui/react, NOT Radix
- **No `asChild` prop** — use `render` prop instead: `<Button render={<Link href="..." />}>`
- Button as Link needs `nativeButton={false}`: `<Button render={<Link href="..." />} nativeButton={false}>`
- Prefer plain styled `<Link>` for nav buttons to avoid `nativeButton` complexity
- **`DropdownMenuLabel` must be inside `DropdownMenuGroup`** — use a plain `<p>` for non-interactive header text instead

### DB Singleton (prevents HMR connection exhaustion)
```typescript
// lib/db/client.ts
declare global { var _pgClient: postgres.Sql | undefined; }
const client = globalThis._pgClient ?? postgres(connectionString, { prepare: false, max: 3 });
if (process.env.NODE_ENV !== 'production') globalThis._pgClient = client;
```

### proxy.ts (Next.js 16 — replaces middleware.ts)
Next.js 16 renamed `middleware.ts` → `proxy.ts` with a `proxy` export (not `middleware`).
```typescript
// proxy.ts
export function proxy(request: NextRequest) { … }
export const config = { matcher: ['/dashboard/:path*', '/admin/:path*', '/orders/:path*', …] };
// Use an explicit route list — NOT the old catch-all regex.
```

### Auth pattern — always use `getCurrentUser()`, never raw `getUser()`
```typescript
// lib/db/queries/auth.ts
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
// ✅ correct — deduplicated, one validated network call per render
// ❌ wrong — calling supabase.auth.getUser() inline on every call site
```
Never switch to `getSession()` — cookie-only, no server validation.

### Turbopack — imports after module-level code crash the worker
Any `import` statement that appears **after** a `const`, `function`, or other module-level code causes Turbopack to abort the worker. Keep **all** `import` statements at the very top of every file.

Common trigger: `const X = dynamic(...)` or `const X = cache(...)` placed before a subsequent `import`.

Run `node scripts/find-bad-imports.mjs` to scan for this pattern.

### Windows dev — TLS certificate fix
Add to `.npmrc`:
```
node-options=--use-system-ca
```

### Supabase publishable key
`NEXT_PUBLIC_SUPABASE_ANON_KEY` uses `sb_publishable_*` format.

### Drizzle config needs dotenv on Windows
```typescript
// drizzle.config.ts
import { config } from "dotenv";
config({ path: ".env.local" });
```

### Inline `<Script>` — use `dangerouslySetInnerHTML`, not children
```tsx
// ✅ correct
<Script id="init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `…` }} />
```

### Error boundaries — boundaries vs toasts
- **Page-load failures** (RSC throws) → `error.tsx` boundary → `ErrorCard` component
- **Mutation failures** → server action returns `{ ok: false, error }` → `sonner` toast
- **Never mix the two**

Retry pattern:
```typescript
// error.tsx — retry must call BOTH router.refresh() AND reset()
const handleRetry = () => startTransition(() => { router.refresh(); reset(); });
```

### Back navigation — deterministic push, not `router.back()`
- **`BackButton`**: always pushes its known `href` via `router.push(href)`
- **Form save-handlers** for edit pages: call `router.back()` on success
- **New entity forms** navigating to a new URL: use `router.replace(newUrl)`

### Portal sheets — mount guard
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
return createPortal(<Sheet />, document.body);
// Never use typeof document !== "undefined" — causes hydration mismatch
```

### `web-push` — dynamic import only
Static `import webpush from "web-push"` causes a Turbopack worker crash (persistent 404). Always use dynamic import inside the function body:

```typescript
import type webpushType from "web-push";
export async function sendPushNotification(…) {
  const webpush = ((await import("web-push")) as unknown as { default: typeof webpushType }).default;
  webpush.setVapidDetails(…);
}
```

### Safe-area CSS utilities
Define **outside** `@layer` in `globals.css`:
```css
.h-nav-safe   { height: calc(4rem + env(safe-area-inset-bottom)); }
.pb-safe-nav  { padding-bottom: calc(5rem + env(safe-area-inset-bottom)); }
.bottom-nav-safe { bottom: calc(5rem + env(safe-area-inset-bottom)); }
```

---

## 13. Architecture Principles

1. **Server-first**: RSC by default. `"use client"` only for state, effects, browser APIs, charts.
2. **Server Actions for mutations**: `app/actions/*.ts`. No REST routes for internal CRUD.
3. **Drizzle only for DB reads/writes**. Supabase JS only for Auth + Realtime.
4. **RLS everywhere**: All tables. `drizzle/policies.sql` is the source of truth.
5. **Pure functions for domain math**: `lib/[domain]/compute.ts` — never touch DB inside these.
6. **Shared Zod schemas**: same schema for form (zodResolver), server action input, and DB insert.
7. **Optimistic UI via useState**: `removedIds: Set<string>` state, rolls back on server error.
8. **Realtime via router.refresh()**: subscribe to `postgres_changes` → call `router.refresh()`. **Gate with `process.env.NODE_ENV === "production"`** to protect Supabase free-tier CPU.
9. **Auth via shared `getCurrentUser()`**: React-`cache()`-wrapped, shared across RSC render tree.
10. **Role routing in proxy.ts**: after auth, check the user's role claim and redirect to the correct persona home.
11. **Error handling split**: boundaries for page-load failures, toasts for mutation failures.

---

## 14. Coding Conventions

### Server Actions
```typescript
// Return shape — always one of these two, never throw to client
{ ok: true, data: T }
{ ok: false, error: string }
```

### Cache invalidation
```typescript
revalidatePath(`/orders/${orderId}`, "layout");
revalidateTag(`orders-${customerId}`, "max"); // always two args in Next.js 16
```

### File naming
- kebab-case for all files
- No barrel files (`index.ts` re-exports)

### Money
- `numeric(12,2)` in DB, `number` in TypeScript
- Format with a shared `formatCurrency(amount, "INR")` utility
- Never do money arithmetic on floats — round at display only

### Dates
- `date` type in DB (no time unless needed)
- Format with a shared `formatDate(date)` utility

### Dark mode
- Every colour class needs a `dark:` counterpart
- Never use raw hex in JSX — go through Tailwind classes or CSS variables

### Typography
- Display font: `style={{ fontFamily: "var(--font-display)" }}`
- Body: Inter or system-ui via `--font-body`
- Numbers (amounts, cylinder counts): `font-variant-numeric: tabular-nums`

### Mobile tap targets
- Back/nav links: `min-h-[44px]`
- Icon buttons in lists: `w-11 h-11 sm:w-7 sm:h-7`

### Toast position
```tsx
// app/layout.tsx
<Toaster position="bottom-center" />
```

---

## 15. Design System

### Palette
```css
--primary: #0891B2; /* cyan-600 — brand colour */
.light body { background: linear-gradient(135deg, #EFF6FF, #ECFEFF, #F0FDFA, #ECFDF5); }
.dark  body { background: linear-gradient(135deg, #0D1B2A, #0A1F2C, #0A2228, #0C2024); }
```

### Glass utilities
```css
.glass     { background: rgba(236,243,250,0.55); backdrop-filter: blur(20px); border: 1px solid rgba(203,213,225,0.45); box-shadow: 0 8px 32px rgba(8,145,178,0.08), 0 1px 0 rgba(255,255,255,0.45) inset; }
.glass-sm  { background: rgba(236,243,250,0.45); backdrop-filter: blur(12px); border: 1px solid rgba(203,213,225,0.40); }
.glass-nav { background: rgba(255,255,255,0.88); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(255,255,255,0.9); }
.dark .glass     { background: rgba(15,23,42,0.75); border: 1px solid rgba(51,65,85,0.6); }
.dark .glass-sm  { background: rgba(15,23,42,0.65); border: 1px solid rgba(51,65,85,0.5); }
.dark .glass-nav { background: rgba(13,18,30,0.92); backdrop-filter: saturate(150%) blur(20px); }
```

### Dark mode conventions
```css
/* Labels */    text-slate-700 dark:text-slate-200
/* Body text */ text-slate-500 dark:text-slate-400
/* Inputs */    border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60
```

### Primary button
```tsx
className="bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
```

### Navigation
**Desktop**: collapsible left sidebar rail. Top = primary nav links → separator → secondary links. Logo links to Home. Avatar/theme toggle pinned at bottom.

**Mobile bottom nav**: 3–4 tabs with a Framer Motion spring pill (`layoutId="nav-pill"`, spring stiffness 500 / damping 35). Active tab: icon + label rendered `relative z-10` on top of the absolute-positioned pill.

**Active nav state**: `isNavItemActive(pathname, href, exact?)` helper — Home tab uses `exact: true`.

**App nav bars**: `backdrop-blur-sm`, no background. Marketing nav bars: `.glass-nav`. Never mix.

---

## 16. Database Patterns

### Schema conventions
- All tables: `id: uuid PK default gen_random_uuid()`, `created_at: timestamptz default now()`
- Foreign keys: `ON DELETE CASCADE` unless there's a specific reason not to
- Money: `numeric(12,2)` — never `float` or `integer cents`
- Enums: use `text` + Zod validation, not Postgres enums (hard to migrate)
- Soft delete: `is_archived: boolean default false` for user-visible entities

### RLS template
```sql
-- drizzle/policies.sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can only read their own orders
CREATE POLICY "customers read own orders" ON orders
  FOR SELECT USING (customer_id IN (
    SELECT id FROM customers WHERE auth_user_id = auth.uid()
  ));

-- Admins have full access (via service role or role claim)
CREATE POLICY "admins full access" ON orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

### Query caching pattern

Several read-heavy query functions are wrapped in `unstable_cache`. See `lib/db/CLAUDE.md` for the full tag → action invalidation matrix.

```typescript
// lib/db/queries/example.ts
export const getSomething = unstable_cache(
  async (): Promise<Row[]> => db.select()...,
  ["cache-key"],
  { tags: ["my-tag"], revalidate: 60 },
);

// lib/actions/example.ts — invalidate after mutation
import { revalidatePath, revalidateTag } from "next/cache";
revalidatePath("/admin/something");
revalidateTag("my-tag", "max"); // always two args in Next.js 16
```

**Active cached queries** (all admin-scoped, no user-level isolation needed):
- `getAdminStats` — tag `"admin-stats"`, 60 s
- `getAdminUrgentCounts` — tag `"admin-urgent"`, 30 s (called in admin layout on every nav)
- `getInventoryWithTypes` — tag `"inventory"`, 120 s
- `getCustomers` — tag `"customers-list"`, 120 s
- `getSettings` — tag `"settings"`, 3600 s

**Do not** wrap per-user queries (e.g. `getCustomerOrders`) in `unstable_cache` — use `revalidatePath` from actions instead (already done).

---

## 17. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=          # sb_publishable_* format
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=                           # Session Pooler URL (pooler.supabase.com:5432)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LPGHub

# Auth / Admin
PLATFORM_ADMIN_EMAIL=                   # comma-separated; guards /admin routes

# UPI Payment
NEXT_PUBLIC_UPI_VPA=                    # Agency's UPI VPA (e.g. agency@okicici)
NEXT_PUBLIC_UPI_MERCHANT_NAME=          # Display name shown in UPI app
UPI_MERCHANT_CODE=                      # Optional MCC code

# Web Push (VAPID) — for admin and customer notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=                            # mailto:you@yourdomain.com

# Add app-specific variables below as needed
```

---

## 18. Scripts & Commands

```bash
# Dev
pnpm dev                    # start dev server (Turbopack)
pnpm build                  # production build — do NOT run while dev server is live
pnpm typecheck              # tsc --noEmit

# Testing
pnpm test                   # vitest watch
pnpm test --run             # vitest single run (CI)

# Database
pnpm db:push                # push schema changes
pnpm db:studio              # Drizzle Studio GUI
pnpm db:seed                # seed cylinder_types + inventory (idempotent)
pnpm db:reseed              # DESTRUCTIVE: wipe customers/orders/deliveries + reseed demo data (3 customers, 2 delivery persons, 8 orders covering all lifecycle statuses)

# Utilities
node scripts/find-bad-imports.mjs   # find imports after module-level code (Turbopack crash risk)
```

> ⚠️ **Never run `pnpm build` while `pnpm dev` is live** — it corrupts the shared `.next` directory.

---

## 19. Working Style

- **Ask before scope creep** — new deps, new feature areas, skipping sections.
- **Run `pnpm typecheck && pnpm test --run` before declaring done.**
- **Read existing code first** — check `lib/utils.ts`, components, queries before writing new ones.
- **No silent failures** — every error path has a toast, boundary, or visible feedback.
- **Keep CLAUDE.md files updated** when decisions change (this file + sub-directory CLAUDE.md files).
- **Create test cases before implementing.** Run all automatically-testable cases and verify they pass.
- **For user validation, present manual test cases ONE AT A TIME.** Ask for Pass / Fail / Skip before moving on.

---

## 20. Web Push Notifications

Web push is used to notify **admins** and **customers** of key order lifecycle events. Delivery persons do not receive push; they see their queue directly in-app.

### Trigger matrix

| Event | Notify Admin | Notify Customer |
|---|---|---|
| New order placed | ✅ | — |
| Payment reported by customer | ✅ | — |
| Payment confirmed | — | ✅ |
| Payment rejected | — | ✅ |
| Order assigned to delivery person | — | ✅ |
| Order out for delivery | — | ✅ |
| Order delivered | ✅ (optional) | ✅ |
| Low stock threshold breached | ✅ | — |

### Push subscription schema
```sql
CREATE TABLE push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own subscriptions" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid());
```

### Send helper
```typescript
// lib/notifications/send-push.ts
import type webpushType from "web-push";
import { db } from "@/lib/db/client";
import { pushSubscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const webpush = ((await import("web-push")) as unknown as { default: typeof webpushType }).default;
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      )
    )
  );
}
```

### Client-side subscription
```typescript
// lib/notifications/subscribe.ts
export async function subscribeToPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
  // POST sub.toJSON() to /api/push/subscribe (server action or API route)
}
```

Generate VAPID keys once with: `npx web-push generate-vapid-keys`

---

## 21. Domain-Specific Notes

### Inventory Decrement Timing (summary)
At booking: decrement `available_stock`, increment `reserved_stock` (atomic DB transaction).
At cancellation/rejection: restore `available_stock`, decrement `reserved_stock`.
At delivery (marked by delivery person, effective immediately): decrement `reserved_stock`, increment `delivered_stock`.
Payment confirmation does not change stock — it was already reserved at booking creation.

### Authentication by Persona

**Customers and Delivery Persons — Phone OTP:**
Supabase phone auth requires a Twilio (or similar) SMS provider configured in the Supabase dashboard.
```typescript
// Send OTP
await supabase.auth.signInWithOtp({ phone: "+91XXXXXXXXXX" });
// Verify OTP
await supabase.auth.verifyOtp({ phone: "+91XXXXXXXXXX", token: "123456", type: "sms" });
```
OTP is a 6-digit code, 60-second expiry. After verification, Supabase creates/signs in the user automatically.

**Admins — Email + Password:**
```typescript
await supabase.auth.signInWithPassword({ email, password });
```
Admin accounts are created manually in the Supabase dashboard or via service-role seed script. There is no public admin sign-up route.

**Shared login page (`/login`):** Detect intent by the role card the user selects (Customer / Delivery / Admin). The Customer and Delivery cards show the phone OTP flow; the Admin card shows email + password. All three submit to the same Supabase Auth endpoints.

### Role Resolution
After login, resolve the user's role from the `user_roles` table (not JWT claims — Supabase free tier doesn't support custom JWT hooks on all plans). Cache the role server-side in `getCurrentUser()`:

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

`proxy.ts` reads `user.role` and enforces:
- `/admin/*` → `admin` only
- `/delivery/*` → `delivery_person` only
- `/orders`, `/payments`, `/deliveries` (customer view) → `customer` only
- `/login`, `/` → public

### UPI Deep Link Format
```
upi://pay?pa={VPA}&pn={MERCHANT_NAME}&am={AMOUNT}&tr={ORDER_ID}&tn={NOTE}&cu=INR
```
- `pa` = payee VPA (from `NEXT_PUBLIC_UPI_VPA` env)
- `tr` = transaction reference = internal order ID (for reconciliation)
- `tn` = short note, e.g. "LPGHub Order #1042"
- GPay intent URL: `intent://pay?...#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`
- Always store the full UPI link and the `tr` reference in the `payments` table before launching the deep link
