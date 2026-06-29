-- Performance indexes for LPGHub
-- Apply via Supabase SQL editor (Database → SQL Editor → Run)
-- All statements are idempotent — safe to re-run.

-- ─── orders ──────────────────────────────────────────────────────────────────
-- customer_id: every customer-facing query and admin order detail
CREATE INDEX IF NOT EXISTS idx_orders_customer_id   ON orders(customer_id);
-- status: filtered in admin stats (6 separate counts), order list, payment queries
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
-- created_at: ORDER BY on every list query; also filtered for date-range search
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON orders(created_at DESC);

-- ─── order_line_items ────────────────────────────────────────────────────────
-- order_id: joined on every order detail, summary, and eligibility check
CREATE INDEX IF NOT EXISTS idx_order_line_items_order_id ON order_line_items(order_id);

-- ─── payments ────────────────────────────────────────────────────────────────
-- order_id: joined in getAdminOrderDetail, getCustomerOrderDetail, getOrderPaymentDetail
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
-- status: filtered in getPendingPayments, getPaymentHistory, admin stats
CREATE INDEX IF NOT EXISTS idx_payments_status   ON payments(status);
-- admin_confirmed_at: ORDER BY in getPaymentHistory
CREATE INDEX IF NOT EXISTS idx_payments_admin_confirmed_at ON payments(admin_confirmed_at DESC);

-- ─── delivery_assignments ────────────────────────────────────────────────────
-- order_id: joined in stats (LEFT JOIN to check for no assignment), detail queries
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_order_id           ON delivery_assignments(order_id);
-- status: filtered in getActiveDeliveries, getMyDeliveries, admin stats
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_status             ON delivery_assignments(status);
-- delivered_at: 4 admin stat queries filter/sort on this
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivered_at       ON delivery_assignments(delivered_at DESC);
-- delivery_person_id: joined in getActiveDeliveries
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_delivery_person_id ON delivery_assignments(delivery_person_id);

-- ─── customers ───────────────────────────────────────────────────────────────
-- auth_user_id: HOT PATH — looked up on every customer page render
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);
-- is_active: filtered in admin stats activeCustomers count
CREATE INDEX IF NOT EXISTS idx_customers_is_active    ON customers(is_active);
-- created_at: filtered for newCustomersThisMonth stat, ORDER BY in customer list
CREATE INDEX IF NOT EXISTS idx_customers_created_at   ON customers(created_at DESC);

-- ─── delivery_persons ────────────────────────────────────────────────────────
-- auth_user_id: HOT PATH — looked up on every delivery person page render
CREATE INDEX IF NOT EXISTS idx_delivery_persons_auth_user_id ON delivery_persons(auth_user_id);

-- ─── user_roles ──────────────────────────────────────────────────────────────
-- user_id: looked up inside getCurrentUser() — runs on EVERY RSC render tree
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ─── push_subscriptions ──────────────────────────────────────────────────────
-- user_id: queried when sending push notifications to a user
-- (the unique (user_id, endpoint) constraint creates a composite index, but a
--  single-column index on user_id is faster for the "all subs for user" lookup)
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ─── inventory_adjustments ───────────────────────────────────────────────────
-- cylinder_type_id: joined in getRecentAdjustments
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_cylinder_type_id ON inventory_adjustments(cylinder_type_id);
-- created_at: ORDER BY DESC in getRecentAdjustments
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at DESC);
