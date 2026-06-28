import { pgTable, uuid, text, boolean, integer, serial, numeric, date, timestamp, jsonb } from "drizzle-orm/pg-core";

// ─── Auth / Roles ─────────────────────────────────────────────────────────────

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull(), // "admin" | "customer" | "delivery_person"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Customers ────────────────────────────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  businessName: text("business_name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull().unique(),
  address: text("address").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  eligibilityLimit: integer("eligibility_limit").notNull().default(5),
  authUserId: uuid("auth_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const cautionDeposits = pgTable("caution_deposits", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paidOn: date("paid_on").notNull(),
  paymentMode: text("payment_mode").notNull(), // "cash" | "upi" | "bank_transfer" | "cheque"
  referenceNo: text("reference_no"),
  status: text("status").notNull().default("received"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Inventory ────────────────────────────────────────────────────────────────

export const cylinderTypes = pgTable("cylinder_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(), // "15kg" | "17kg" | "20kg"
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
});

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  cylinderTypeId: uuid("cylinder_type_id").notNull().references(() => cylinderTypes.id),
  totalStock: integer("total_stock").notNull().default(0),
  availableStock: integer("available_stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  deliveredStock: integer("delivered_stock").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  cylinderTypeId: uuid("cylinder_type_id").notNull().references(() => cylinderTypes.id),
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: uuid("adjusted_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: serial("order_number").notNull().unique(),
  customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending_payment"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const orderLineItems = pgTable("order_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  cylinderTypeId: uuid("cylinder_type_id").notNull().references(() => cylinderTypes.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
});

// ─── Payments ─────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  upiLink: text("upi_link"),
  paymentRef: text("payment_ref"),
  payerReportedStatus: text("payer_reported_status"), // "paid" | "failed"
  adminConfirmedBy: uuid("admin_confirmed_by"),
  adminConfirmedAt: timestamp("admin_confirmed_at", { withTimezone: true }),
  status: text("status").notNull().default("pending"), // "pending" | "confirmed" | "rejected"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Delivery ─────────────────────────────────────────────────────────────────

export const deliveryPersons = pgTable("delivery_persons", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  authUserId: uuid("auth_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const deliveryAssignments = pgTable("delivery_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  deliveryPersonId: uuid("delivery_person_id").notNull().references(() => deliveryPersons.id),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  remarks: text("remarks"),
  status: text("status").notNull().default("assigned"), // "assigned" | "out_for_delivery" | "delivered"
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Settings & Audit ─────────────────────────────────────────────────────────

export const adminSettings = pgTable("admin_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  action: text("action").notNull(),
  changedBy: uuid("changed_by"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Push Subscriptions ───────────────────────────────────────────────────────

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
