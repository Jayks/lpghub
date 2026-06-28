# LPGHub

**Commercial gas cylinder booking and delivery platform for LPG distribution agencies.**

Handles B2B customer onboarding, cylinder inventory management, UPI payment collection, admin approval workflows, and last-mile delivery tracking — deployed as a PWA on Vercel + Supabase.

---

## Features

### Customer (phone OTP login)
- View available cylinder stock by type (15 kg / 17 kg / 20 kg)
- Place bookings within admin-configured eligibility limit
- Pay via UPI deep link (GPay-first) with manual reference entry fallback
- Track order lifecycle from booking through delivery (6-step status timeline)
- Web push notifications on key status changes (confirmed, assigned, out for delivery, delivered)

### Admin (email + password login)
- Onboard B2B customers and manage caution deposits
- Configure per-customer eligibility limits and global order caps
- Manage cylinder inventory: add, adjust, and audit stock
- Confirm or reject payments after customer reports payment attempt
- Assign delivery personnel to confirmed orders
- View order history, payment queue, and delivery pipeline
- Web push notifications for new orders, payment reports, and delivery completions

### Delivery Person (phone OTP login)
- View assigned deliveries
- Mark delivery as completed (effective immediately — no admin confirmation step)
- Capture completion timestamp and optional remarks

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 (CSS-first config) |
| UI | shadcn/ui with **@base-ui/react** (not Radix) |
| Animation | Framer Motion 12 |
| Icons | lucide-react |
| Database | Supabase Postgres (Drizzle ORM) |
| Auth | Supabase Auth — phone OTP (customers/delivery) + email+password (admin) |
| Realtime | Supabase Realtime (`postgres_changes` → `router.refresh()`) |
| Forms | react-hook-form 7 + Zod 3 |
| Charts | Recharts 3 (admin dashboard) |
| Toasts | sonner 2 |
| Push | web-push 3.6.7 (VAPID, dynamic import only) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 20+, pnpm 9+
- Supabase project (free tier works)
- Vercel account (for deployment)

### Local Setup

```bash
# Install dependencies
pnpm install

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local — see Environment Variables section below

# Push DB schema to Supabase
pnpm db:push

# Run the dev server
pnpm dev
```

> **Windows note:** Add `node-options=--use-system-ca` to `.npmrc` to fix TLS certificate errors with pnpm.

### Test Mode

Set `NEXT_PUBLIC_TEST_MODE=true` in `.env.local` to bypass real Supabase OTP (for local dev and CI):

- Phone OTP is bypassed — a fixed test code is accepted for any number
- Customer and Delivery phone fields are pre-filled with test numbers (auto-switches when changing role)
- Admin test credentials are shown on-screen in the login form
- **Never enable in production**

---

## Environment Variables

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
PLATFORM_ADMIN_EMAIL=                   # comma-separated list of admin email addresses

# UPI Payment
NEXT_PUBLIC_UPI_VPA=                    # Agency's UPI VPA (e.g. agency@okicici)
NEXT_PUBLIC_UPI_MERCHANT_NAME=          # Display name shown in the UPI app
UPI_MERCHANT_CODE=                      # Optional MCC code

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=                            # mailto:you@yourdomain.com

# Dev / Testing
NEXT_PUBLIC_TEST_MODE=false             # Set to "true" for local dev — never in production
```

Generate VAPID keys once: `npx web-push generate-vapid-keys`

---

## Commands

```bash
pnpm dev                        # Dev server (Turbopack)
pnpm build                      # Production build (don't run while dev is live)
pnpm typecheck                  # tsc --noEmit

pnpm test                       # vitest watch
pnpm test --run                 # vitest single run (CI)

pnpm db:push                    # Push schema to Supabase
pnpm db:studio                  # Drizzle Studio GUI

node scripts/generate-icons.mjs    # Regenerate PWA icons from public/icon.svg
node scripts/find-bad-imports.mjs  # Check for imports-after-module-code (Turbopack crash risk)
```

---

## Project Structure

```
lpghub/
├── app/
│   ├── (admin)/admin/          # Admin area: dashboard, customers, orders, payments, inventory, deliveries, settings
│   ├── (auth)/login/           # Shared login: phone OTP (customer/delivery) + email+password (admin)
│   ├── (customer)/             # Customer area: home, orders, payments, settings
│   ├── (delivery)/delivery/    # Delivery area: assignments, delivery detail, settings
│   ├── actions/                # Server actions (auth, customers, orders, payments, deliveries, inventory, push, settings)
│   ├── api/push/               # Web push API routes (subscribe / unsubscribe)
│   └── layout.tsx              # Root layout: ThemeProvider, Toaster, metadata, PWA manifest
│
├── components/
│   ├── admin/                  # Admin-only forms and controls
│   ├── auth/                   # Login form
│   ├── customer/               # Customer-facing forms and controls
│   ├── delivery/               # Delivery status buttons
│   ├── layout/                 # AppShell, sidebar, bottom nav, top bar, theme toggle
│   └── shared/                 # StatusBadge, ErrorCard, LoadingSkeleton, NotificationToggle, SignOutButton, etc.
│
├── lib/
│   ├── config/                 # order-filters config (shared between client and server)
│   ├── db/
│   │   ├── client.ts           # Drizzle postgres singleton
│   │   ├── schema.ts           # Full Drizzle schema (all tables)
│   │   └── queries/            # Per-domain read queries (admin-stats, orders, customers, inventory, etc.)
│   ├── inventory/compute.ts    # Pure inventory math (no DB calls)
│   ├── notifications/          # send-push.ts, subscribe.ts
│   ├── schemas/                # Zod schemas (shared: form validation + server action input + DB insert)
│   ├── supabase/               # createClient (server), createClient (browser), createAdminClient
│   └── utils/                  # cn, format-currency, format-date, format-order-number, format-phone, nav, upi, haptics
│
├── public/
│   ├── icon.svg                # Master SVG icon (3D cylinder with oval ring on pillars)
│   ├── icon-{192,512}.png      # PWA icons
│   ├── icon-maskable-{192,512}.png
│   ├── apple-touch-icon.png
│   ├── favicon.svg / favicon-{16,32}.png
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service worker (web push)
│
├── scripts/
│   ├── generate-icons.mjs      # SVG → PNG icon pipeline (uses sharp)
│   └── find-bad-imports.mjs    # Turbopack import-order linter
│
├── drizzle/
│   └── policies.sql            # RLS policies (source of truth)
│
├── proxy.ts                    # Next.js 16 auth/role middleware
└── drizzle.config.ts
```

---

## Route Overview

| Route | Persona | Purpose |
|---|---|---|
| `/login` | All | Phone OTP (customer/delivery) or email+password (admin) |
| `/` | Customer | Home: greeting, book CTA, recent orders |
| `/orders` | Customer | Order history |
| `/orders/new` | Customer | New booking form |
| `/orders/[id]` | Customer | Order detail + 6-step delivery timeline |
| `/payments/[orderId]` | Customer | UPI deep link, manual VPA, report payment |
| `/settings` | Customer | Notification toggle |
| `/delivery` | Delivery | Assigned deliveries list |
| `/delivery/deliveries/[id]` | Delivery | Delivery detail + completion |
| `/delivery/settings` | Delivery | Notification toggle |
| `/admin` | Admin | KPI dashboard: stats, low-stock alerts, quick actions |
| `/admin/customers` | Admin | Customer list |
| `/admin/customers/new` | Admin | Customer onboarding form |
| `/admin/customers/[id]` | Admin | Customer detail |
| `/admin/orders` | Admin | Order list with status filter pills |
| `/admin/orders/[id]` | Admin | Order detail + payment/assignment controls |
| `/admin/payments` | Admin | Pending payment confirmation queue |
| `/admin/inventory` | Admin | Stock workspace: adjust + adjustments log |
| `/admin/deliveries` | Admin | Delivery pipeline: unassigned → in-progress → team |
| `/admin/deliveries/persons/new` | Admin | Add delivery person |
| `/admin/settings` | Admin | Global settings + notification toggle |

---

## Order Lifecycle

```
pending_payment
  → payment_pending_confirmation  (customer reports payment)
  → confirmed                     (admin confirms)
  → assigned                      (admin assigns delivery person)
  → out_for_delivery              (delivery person dispatches)
  → delivered                     (delivery person marks complete — immediate)

Any stage → cancelled / rejected
```

**Inventory lifecycle:**
- Booking created → `available_stock ↓`, `reserved_stock ↑`
- Cancelled/rejected → `available_stock ↑`, `reserved_stock ↓`
- Delivered → `reserved_stock ↓`, `delivered_stock ↑`

---

## PWA & Icons

The app is installable as a PWA on Android and iOS (via Safari Add to Home Screen).

- Master icon: `public/icon.svg` — 3D LPG cylinder with an oval ring on two pillars
- Regenerate all PNG sizes: `node scripts/generate-icons.mjs` (requires `sharp`)
- Maskable icons use a solid `#0891B2` background for full-bleed adaptive icon shapes
- Service worker: `public/sw.js` — handles push notification display

> **Known gap:** `public/badge-72.png` (notification badge icon referenced in `sw.js`) is not yet generated. Run `node scripts/generate-icons.mjs` after adding a badge SVG to `public/`, or replace the reference in `sw.js` with `/icon-192.png` as a fallback.

---

## Known Gaps / TODO

| Item | Location | Notes |
|---|---|---|
| `badge-72.png` missing | `public/sw.js` | Notification badge icon; generate with `sharp` or use `/icon-192.png` as fallback |
| QR code placeholder | `app/(customer)/payments/[orderId]/page.tsx` | Static placeholder — dynamic QR not yet implemented |
| Self-registration flow | `CLAUDE.md §3` | Onboarding is admin-only for now; see architecture note in CLAUDE.md for how to open it |

---

## Deployment

Deployed on **Vercel** with environment variables set in the Vercel dashboard.

Database schema is **live on Supabase**. To push schema changes:
```bash
pnpm db:push
```

RLS policies live in `drizzle/policies.sql` — apply manually via Supabase SQL editor when they change.
