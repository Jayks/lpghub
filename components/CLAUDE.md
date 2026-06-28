# components/ — Design System & UI Patterns

> Claude Code reference for the component library.
> Parent file: `../CLAUDE.md`

---

## Directory Map

```
components/
├── admin/          # Admin-only interactive components
├── auth/           # Login form
├── customer/       # Customer-facing interactive components
├── delivery/       # Delivery person interactive components
├── layout/         # Navigation shell: sidebar, bottom nav, top bar
└── shared/         # Persona-agnostic utility components
```

---

## Layout Components — `components/layout/`

### `AppShell`
Root layout wrapper for all authenticated personas. Renders the correct navigation based on the user's role cookie:
- **Desktop (≥ md):** collapsible left `Sidebar` rail
- **Mobile:** `TopBar` + `BottomNav`

Usage: wrap every authenticated layout group with `<AppShell>`.

### `Sidebar`
Desktop navigation. Structure:
- Logo (links to persona home)
- Primary nav links (role-aware)
- Separator
- Secondary nav links
- Avatar + `ThemeToggle` pinned at bottom

Uses `isNavItemActive(pathname, href, exact?)` from `lib/utils/nav.ts`.

### `BottomNav`
Mobile tab bar. 3–4 tabs per persona. Active state uses a Framer Motion spring pill (`layoutId="nav-pill"`, spring `stiffness: 500, damping: 35`). Active tab renders icon + label `relative z-10` over the absolute-positioned pill.

**Home tab always uses `exact: true`** in `isNavItemActive`.

### `TopBar`
Mobile top bar. Contains page title (passed as prop), back button (where applicable), and overflow menu.

`BackButton` always uses `router.push(href)` — **never `router.back()`** — for deterministic navigation history.

### `ThemeToggle`
Light / Dark / System toggle. Uses `next-themes`. Renders as an icon button in the sidebar footer.

---

## Shared Components — `components/shared/`

### `StatusBadge`
Renders a colour-coded pill for order status values. Maps each status string to a Tailwind colour pair:

| Status | Colour |
|---|---|
| `pending_payment` | yellow |
| `payment_pending_confirmation` | orange |
| `confirmed` | blue |
| `assigned` | indigo |
| `out_for_delivery` | violet |
| `delivered` | green |
| `cancelled` / `rejected` | red |

### `ErrorCard`
Used in `error.tsx` boundaries. Accepts `error: Error` and `reset: () => void`. Retry button calls both `router.refresh()` and `reset()`.

### `LoadingSkeleton`
Pulsing placeholder skeleton. Sized to match the shape of the page it covers so layout doesn't shift when content loads.

### `NotificationToggle`
Client component. Checks `Notification.permission`, subscribes or unsubscribes via `lib/notifications/subscribe.ts`, and calls `/api/push/subscribe` or `/api/push/unsubscribe`. Used in settings pages for all three personas.

### `PushRegistrar`
Invisible client component mounted in every authenticated layout. Registers the service worker (`/sw.js`) and calls `subscribeToPush()` silently on first load. No UI.

Mount guard pattern (all portal/client components that need the DOM):
```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
```

### `SignOutButton`
Calls `signOut()` server action, then `router.push("/login")`.

### `CopyButton`
Icon button that copies text to clipboard. Flips icon to checkmark for 2 seconds on success.

---

## Admin Components — `components/admin/`

### `CustomerForm`
react-hook-form + zodResolver form for customer onboarding. Fields: businessName, contactPerson, phone, address, eligibilityLimit, cautionDeposit (amount, paidOn, paymentMode, referenceNo). Calls `createCustomer` server action.

### `AdjustStockForm`
Inline form per cylinder type on the inventory page. Fields: delta (positive or negative), reason. Calls `adjustInventory` server action. Validates that delta doesn't push `available_stock` negative.

### `AssignDeliveryForm`
Dropdown of active delivery persons + submit. Calls `assignDelivery` server action. Rendered inside the admin order detail page.

### `OrderFilterPills`
Client component. Renders pill buttons for order status filters. Updates `?filter=` searchParam without full navigation (`router.replace`). The admin orders page reads `searchParams.filter` server-side to query the right statuses.

### `PaymentActionButtons`
Confirm / Reject buttons on the pending payment queue. Each button calls the respective server action, shows a loading spinner, and displays a sonner toast on result.

### `SettingsForm`
Key-value form for `admin_settings` table. Each field corresponds to a known settings key. Calls `updateSetting` per field on blur.

### `DeliveryPersonToggle`
Toggle switch to mark a delivery person active/inactive. Calls `toggleDeliveryPersonActive` server action. Renders in the delivery team panel.

### `AddDeliveryPersonForm`
react-hook-form form: name, phone. Calls `createDeliveryPerson` server action.

---

## Customer Components — `components/customer/`

### `NewOrderForm`
The booking form. Reads live inventory and the customer's eligibility limit from server props. Shows per-type quantity pickers capped at `min(available, eligibilityLimit)`. On submit: calls `createOrder` → redirects to `/payments/[orderId]`.

### `CancelOrderButton`
Danger button rendered on the order detail page for orders in `pending_payment` or `payment_pending_confirmation` status. Calls `cancelOrder` server action. Shows a confirmation dialog before proceeding.

### `ReportPaymentForm`
Short form on the payment page: payment reference ID input + submit. Calls `reportPayment` server action, which moves the order to `payment_pending_confirmation`.

---

## Delivery Components — `components/delivery/`

### `DeliveryStatusButtons`
Two-step button sequence on the delivery detail page:
1. "Mark Dispatched" → calls `updateDeliveryStatus("dispatched")`
2. "Mark Delivered" → calls `updateDeliveryStatus("delivered")`

Delivered status takes effect immediately — no admin confirmation needed. Captures `deliveredAt` timestamp server-side.

---

## Auth Components — `components/auth/`

### `LoginForm`
Three-tab form: Customer | Delivery | Admin.
- Customer + Delivery tabs: phone input → OTP input (appears after `sendOtp` succeeds)
- Admin tab: email + password

In test mode (`NEXT_PUBLIC_TEST_MODE=true`):
- Shows test credentials inline
- OTP input pre-filled with `123456`

---

## shadcn/ui with @base-ui/react — Critical Differences

This project uses **@base-ui/react**, not Radix. Several patterns differ:

```tsx
// ❌ Radix pattern — does NOT work
<Button asChild><Link href="/foo">Go</Link></Button>

// ✅ @base-ui pattern — use render prop
<Button render={<Link href="/foo" />} nativeButton={false}>Go</Button>

// ✅ Prefer plain <Link> for nav items to avoid nativeButton complexity
<Link href="/foo" className="btn-classes">Go</Link>
```

`DropdownMenuLabel` must be inside `DropdownMenuGroup`. For non-interactive header text in a dropdown, use a plain `<p>` instead.

---

## Design Conventions

### Glass cards (most list/detail cards)
```tsx
className="glass rounded-2xl p-4"   // standard card
className="glass-sm rounded-xl p-3" // compact card
```

### Primary action button
```tsx
className="bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-xl"
```

### Danger action button
```tsx
className="bg-gradient-to-br from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl"
```

### Dark mode — every colour class needs a `dark:` pair
```tsx
// Labels
className="text-slate-700 dark:text-slate-200"
// Body text
className="text-slate-500 dark:text-slate-400"
// Input borders
className="border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60"
```

### Mobile tap targets
```tsx
// Back/nav links
className="min-h-[44px] flex items-center"
// Icon buttons in lists
className="w-11 h-11 sm:w-7 sm:h-7"
```

### Numbers (amounts, cylinder counts)
```tsx
style={{ fontVariantNumeric: "tabular-nums" }}
```

### Toast position
```tsx
// Set in app/layout.tsx — don't override per-component
<Toaster position="bottom-center" richColors />
```

### Framer Motion — subtle only
```tsx
// Page entrance
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>

// Bottom nav pill
<motion.span layoutId="nav-pill" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
```

---

## "use client" Boundary Rules

| Needs client | Stays server |
|---|---|
| `useState`, `useEffect`, `useRouter` | Data fetching, DB queries |
| Browser APIs (clipboard, vibrate, push) | Form validation (zodResolver runs server-side too) |
| Framer Motion animations | Static lists, detail pages |
| Recharts charts | Table renders |
| `PushRegistrar`, `NotificationToggle` | All query calls (pass as props) |
| `OrderFilterPills` (reads URL, updates searchParams) | |

Lean toward server components. Extract the smallest possible client boundary.

---

## Portal Sheets / Drawers

Always use the mount guard (see `PushRegistrar` above). Never use `typeof document !== "undefined"` — it causes hydration mismatches.

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;
return createPortal(<Sheet />, document.body);
```
