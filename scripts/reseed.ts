/**
 * reseed.ts
 *
 * Wipes all customer / delivery-person / order / payment / delivery data,
 * resets inventory to the baseline, then inserts realistic demo records
 * covering every order status in the lifecycle.
 *
 * Safe for repeated runs — each run starts from a clean slate.
 *
 * Keeps intact: cylinder_types, admin_settings, user_roles,
 *               push_subscriptions, Supabase auth.users.
 *
 * Usage: pnpm db:reseed
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";
import {
  customers,
  cautionDeposits,
  deliveryPersons,
  orders,
  orderLineItems,
  payments,
  deliveryAssignments,
  cylinderTypes,
  inventory,
  inventoryAdjustments,
  auditLog,
} from "../lib/db/schema";

const pg = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1 });
const db = drizzle(pg);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Inventory targets ────────────────────────────────────────────────────────

const INVENTORY_RESET = {
  "15kg": { total: 100, available: 89, reserved: 8, delivered: 3 },
  "17kg": { total: 50,  available: 47, reserved: 2, delivered: 1 },
  "20kg": { total: 30,  available: 28, reserved: 2, delivered: 0 },
} as const;

// Explanation of inventory end-state (derived from seeded orders below):
//
//  15kg: total 100
//    delivered  → Order 1 (3 cyl)                                = 3
//    reserved   → Orders 2,3,4,5,6 (2+2+1+2+1)                  = 8
//    available  → 100 − 3 − 8                                    = 89
//
//  17kg: total 50
//    delivered  → Order 1 (1 cyl)                                = 1
//    reserved   → Orders 4,6 (1+1)                               = 2
//    available  → 50 − 1 − 2                                     = 47
//    (Orders 7 cancelled + Order 8 rejected → stock fully restored)
//
//  20kg: total 30
//    reserved   → Orders 2,5 (1+1)                               = 2
//    available  → 30 − 2                                         = 28

// ─── Main ─────────────────────────────────────────────────────────────────────

async function reseed() {
  console.log("🗑  Clearing existing data…\n");

  // 1. Delete customers — cascades to caution_deposits, orders,
  //    order_line_items, payments, delivery_assignments.
  await db.delete(customers);
  console.log("  ✅ customers (+ cascades) deleted");

  // 2. Delete delivery persons (delivery_assignments are already gone).
  await db.delete(deliveryPersons);
  console.log("  ✅ delivery_persons deleted");

  // 3. Clear audit & adjustment logs.
  await db.delete(inventoryAdjustments);
  await db.delete(auditLog);
  console.log("  ✅ inventory_adjustments + audit_log cleared");

  // 4. Reset the order_number serial so demo orders start from 1.
  try {
    await pg.unsafe("ALTER SEQUENCE orders_order_number_seq RESTART WITH 1");
    console.log("  ✅ order_number sequence reset to 1");
  } catch {
    console.log("  ⚠️  Could not reset order_number sequence (order numbers will continue from last value — harmless)");
  }

  // ── Reset inventory ──────────────────────────────────────────────────────────
  console.log("\n📦 Resetting inventory…\n");

  const cylRows = await db.select().from(cylinderTypes);
  for (const cyl of cylRows) {
    const target = INVENTORY_RESET[cyl.label as keyof typeof INVENTORY_RESET];
    if (!target) continue;
    await db
      .update(inventory)
      .set({
        totalStock:     target.total,
        availableStock: target.available,
        reservedStock:  target.reserved,
        deliveredStock: target.delivered,
      })
      .where(eq(inventory.cylinderTypeId, cyl.id));
    console.log(
      `  ✅ ${cyl.label}: total=${target.total}  available=${target.available}  reserved=${target.reserved}  delivered=${target.delivered}`
    );
  }

  // Build a label → id lookup for later use.
  const cylByLabel: Record<string, string> = {};
  const cylPriceByLabel: Record<string, string> = {};
  for (const c of cylRows) {
    cylByLabel[c.label] = c.id;
    cylPriceByLabel[c.label] = c.unitPrice;
  }

  // ── Delivery Persons ─────────────────────────────────────────────────────────
  console.log("\n🚚 Seeding delivery persons…\n");

  const [dp1] = await db
    .insert(deliveryPersons)
    .values({ name: "Suresh Kumar", phone: "+919999900001", isActive: true })
    .returning();
  console.log(`  ✅ ${dp1.name}  (${dp1.phone})`);

  const [dp2] = await db
    .insert(deliveryPersons)
    .values({ name: "Arjun Patel", phone: "+919999900002", isActive: true })
    .returning();
  console.log(`  ✅ ${dp2.name}  (${dp2.phone})`);

  // ── Customers + deposits ─────────────────────────────────────────────────────
  console.log("\n👥 Seeding customers…\n");

  const [c1] = await db
    .insert(customers)
    .values({
      businessName:     "Sunrise Bakery",
      contactPerson:    "Ravi Kumar",
      phone:            "+919876543210",
      address:          "14, Gandhi Nagar, 2nd Cross, Bengaluru — 560001",
      isActive:         true,
      eligibilityLimit: 10,
    })
    .returning();
  await db.insert(cautionDeposits).values({
    customerId:  c1.id,
    amount:      "5000.00",
    paidOn:      dateStr(daysAgo(30)),
    paymentMode: "cash",
    status:      "received",
    notes:       "Paid in full at onboarding",
  });
  console.log(`  ✅ ${c1.businessName}  (${c1.phone})`);

  const [c2] = await db
    .insert(customers)
    .values({
      businessName:     "Green Leaf Restaurant",
      contactPerson:    "Priya Sharma",
      phone:            "+919876500001",
      address:          "88, Indiranagar, 12th Main, Bengaluru — 560038",
      isActive:         true,
      eligibilityLimit: 8,
    })
    .returning();
  await db.insert(cautionDeposits).values({
    customerId:   c2.id,
    amount:       "4000.00",
    paidOn:       dateStr(daysAgo(20)),
    paymentMode:  "upi",
    referenceNo:  "UPI202506001234",
    status:       "received",
  });
  console.log(`  ✅ ${c2.businessName}  (${c2.phone})`);

  const [c3] = await db
    .insert(customers)
    .values({
      businessName:     "Metro Canteen",
      contactPerson:    "Suresh Nair",
      phone:            "+919876500002",
      address:          "22, Koramangala Block 4, Bengaluru — 560034",
      isActive:         true,
      eligibilityLimit: 5,
    })
    .returning();
  await db.insert(cautionDeposits).values({
    customerId:  c3.id,
    amount:      "3000.00",
    paidOn:      dateStr(daysAgo(15)),
    paymentMode: "bank_transfer",
    referenceNo: "NEFT2506987654",
    status:      "received",
  });
  console.log(`  ✅ ${c3.businessName}  (${c3.phone})`);

  // ── Fake admin UUID for payment confirmations ─────────────────────────────────
  // Used only as a placeholder in adminConfirmedBy — the actual admin user
  // UUID is not known at seed time. The UI reads this field for display only.
  const ADMIN_PLACEHOLDER = "00000000-0000-0000-0000-000000000001";

  // ── Orders ───────────────────────────────────────────────────────────────────
  console.log("\n📋 Seeding orders (8 orders, all lifecycle statuses)…\n");

  // ── Order 1: DELIVERED  ──────────────────────────────────────────────────────
  // Customer 1 · 3×15kg + 1×17kg · Suresh Kumar delivered 6 days ago
  {
    const total = 3 * 1200 + 1 * 1350; // ₹4,950
    const created = daysAgo(8);
    const [o] = await db.insert(orders).values({
      customerId:  c1.id,
      status:      "delivered",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(6),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 3, unitPrice: cylPriceByLabel["15kg"] },
      { orderId: o.id, cylinderTypeId: cylByLabel["17kg"], quantity: 1, unitPrice: cylPriceByLabel["17kg"] },
    ]);

    await db.insert(payments).values({
      orderId:             o.id,
      amount:              total.toString(),
      upiLink:             `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%231&cu=INR`,
      paymentRef:          "GPay-TXN-4450012345",
      payerReportedStatus: "paid",
      adminConfirmedBy:    ADMIN_PLACEHOLDER,
      adminConfirmedAt:    daysAgo(7),
      status:              "confirmed",
      createdAt:           created,
    });

    await db.insert(deliveryAssignments).values({
      orderId:          o.id,
      deliveryPersonId: dp1.id,
      assignedAt:       daysAgo(7),
      dispatchedAt:     daysAgo(6),
      deliveredAt:      daysAgo(6),
      status:           "delivered",
      remarks:          "Delivered successfully, all cylinders received",
    });

    console.log(`  ✅ Order #1 — DELIVERED  · ₹${total}  · ${c1.businessName}`);
  }

  // ── Order 2: OUT FOR DELIVERY  ───────────────────────────────────────────────
  // Customer 1 · 2×15kg + 1×20kg · Suresh Kumar dispatched 1 day ago
  {
    const total = 2 * 1200 + 1 * 1600; // ₹4,000
    const created = daysAgo(3);
    const [o] = await db.insert(orders).values({
      customerId:  c1.id,
      status:      "out_for_delivery",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(1),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 2, unitPrice: cylPriceByLabel["15kg"] },
      { orderId: o.id, cylinderTypeId: cylByLabel["20kg"], quantity: 1, unitPrice: cylPriceByLabel["20kg"] },
    ]);

    await db.insert(payments).values({
      orderId:             o.id,
      amount:              total.toString(),
      upiLink:             `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%232&cu=INR`,
      paymentRef:          "GPay-TXN-4450023456",
      payerReportedStatus: "paid",
      adminConfirmedBy:    ADMIN_PLACEHOLDER,
      adminConfirmedAt:    daysAgo(2),
      status:              "confirmed",
      createdAt:           created,
    });

    await db.insert(deliveryAssignments).values({
      orderId:          o.id,
      deliveryPersonId: dp1.id,
      assignedAt:       daysAgo(2),
      dispatchedAt:     daysAgo(1),
      status:           "out_for_delivery",
    });

    console.log(`  ✅ Order #2 — OUT FOR DELIVERY  · ₹${total}  · ${c1.businessName}`);
  }

  // ── Order 3: PENDING PAYMENT  ────────────────────────────────────────────────
  // Customer 1 · 2×15kg · just created, no payment yet
  {
    const total = 2 * 1200; // ₹2,400
    const created = daysAgo(0);
    const [o] = await db.insert(orders).values({
      customerId:  c1.id,
      status:      "pending_payment",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   created,
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 2, unitPrice: cylPriceByLabel["15kg"] },
    ]);

    await db.insert(payments).values({
      orderId:   o.id,
      amount:    total.toString(),
      upiLink:   `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%233&cu=INR`,
      status:    "pending",
      createdAt: created,
    });

    console.log(`  ✅ Order #3 — PENDING PAYMENT  · ₹${total}  · ${c1.businessName}`);
  }

  // ── Order 4: PAYMENT PENDING CONFIRMATION  ───────────────────────────────────
  // Customer 2 · 1×15kg + 1×17kg · customer reported payment, admin to review
  {
    const total = 1 * 1200 + 1 * 1350; // ₹2,550
    const created = daysAgo(2);
    const [o] = await db.insert(orders).values({
      customerId:  c2.id,
      status:      "payment_pending_confirmation",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(1),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 1, unitPrice: cylPriceByLabel["15kg"] },
      { orderId: o.id, cylinderTypeId: cylByLabel["17kg"], quantity: 1, unitPrice: cylPriceByLabel["17kg"] },
    ]);

    await db.insert(payments).values({
      orderId:             o.id,
      amount:              total.toString(),
      upiLink:             `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%234&cu=INR`,
      paymentRef:          "PhonePe-TXN-9981234567",
      payerReportedStatus: "paid",
      status:              "pending",
      createdAt:           created,
    });

    console.log(`  ✅ Order #4 — PAYMENT PENDING CONFIRMATION  · ₹${total}  · ${c2.businessName}`);
  }

  // ── Order 5: ASSIGNED  ───────────────────────────────────────────────────────
  // Customer 2 · 2×15kg + 1×20kg · Arjun Patel assigned, not dispatched yet
  {
    const total = 2 * 1200 + 1 * 1600; // ₹4,000
    const created = daysAgo(5);
    const [o] = await db.insert(orders).values({
      customerId:  c2.id,
      status:      "assigned",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(3),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 2, unitPrice: cylPriceByLabel["15kg"] },
      { orderId: o.id, cylinderTypeId: cylByLabel["20kg"], quantity: 1, unitPrice: cylPriceByLabel["20kg"] },
    ]);

    await db.insert(payments).values({
      orderId:             o.id,
      amount:              total.toString(),
      upiLink:             `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%235&cu=INR`,
      paymentRef:          "GPay-TXN-4450034567",
      payerReportedStatus: "paid",
      adminConfirmedBy:    ADMIN_PLACEHOLDER,
      adminConfirmedAt:    daysAgo(4),
      status:              "confirmed",
      createdAt:           created,
    });

    await db.insert(deliveryAssignments).values({
      orderId:          o.id,
      deliveryPersonId: dp2.id,
      assignedAt:       daysAgo(3),
      status:           "assigned",
    });

    console.log(`  ✅ Order #5 — ASSIGNED  · ₹${total}  · ${c2.businessName}`);
  }

  // ── Order 6: CONFIRMED  ─────────────────────────────────────────────────────
  // Customer 2 · 1×15kg + 1×17kg · payment confirmed, awaiting delivery assignment
  {
    const total = 1 * 1200 + 1 * 1350; // ₹2,550
    const created = daysAgo(6);
    const [o] = await db.insert(orders).values({
      customerId:  c2.id,
      status:      "confirmed",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(5),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 1, unitPrice: cylPriceByLabel["15kg"] },
      { orderId: o.id, cylinderTypeId: cylByLabel["17kg"], quantity: 1, unitPrice: cylPriceByLabel["17kg"] },
    ]);

    await db.insert(payments).values({
      orderId:             o.id,
      amount:              total.toString(),
      upiLink:             `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%236&cu=INR`,
      paymentRef:          "BHIM-TXN-7765432100",
      payerReportedStatus: "paid",
      adminConfirmedBy:    ADMIN_PLACEHOLDER,
      adminConfirmedAt:    daysAgo(5),
      status:              "confirmed",
      createdAt:           created,
    });

    console.log(`  ✅ Order #6 — CONFIRMED  · ₹${total}  · ${c2.businessName}`);
  }

  // ── Order 7: CANCELLED  ─────────────────────────────────────────────────────
  // Customer 3 · 1×17kg · cancelled before payment (stock restored)
  {
    const total = 1 * 1350; // ₹1,350
    const created = daysAgo(10);
    const [o] = await db.insert(orders).values({
      customerId:  c3.id,
      status:      "cancelled",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(10),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["17kg"], quantity: 1, unitPrice: cylPriceByLabel["17kg"] },
    ]);

    // Payment record created at order time, never progressed
    await db.insert(payments).values({
      orderId:   o.id,
      amount:    total.toString(),
      upiLink:   `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%237&cu=INR`,
      status:    "pending",
      createdAt: created,
    });

    console.log(`  ✅ Order #7 — CANCELLED  · ₹${total}  · ${c3.businessName}`);
  }

  // ── Order 8: REJECTED  ──────────────────────────────────────────────────────
  // Customer 3 · 1×15kg · customer reported payment, admin rejected (stock restored)
  {
    const total = 1 * 1200; // ₹1,200
    const created = daysAgo(12);
    const [o] = await db.insert(orders).values({
      customerId:  c3.id,
      status:      "rejected",
      totalAmount: total.toString(),
      createdAt:   created,
      updatedAt:   daysAgo(11),
    }).returning();

    await db.insert(orderLineItems).values([
      { orderId: o.id, cylinderTypeId: cylByLabel["15kg"], quantity: 1, unitPrice: cylPriceByLabel["15kg"] },
    ]);

    await db.insert(payments).values({
      orderId:             o.id,
      amount:              total.toString(),
      upiLink:             `upi://pay?pa=agency@okaxis&pn=LPGHub&am=${total}&tr=${o.id}&tn=LPGHub+Order+%238&cu=INR`,
      paymentRef:          "GPay-TXN-INVALID99",
      payerReportedStatus: "paid",
      adminConfirmedBy:    ADMIN_PLACEHOLDER,
      adminConfirmedAt:    daysAgo(11),
      status:              "rejected",
      createdAt:           created,
    });

    console.log(`  ✅ Order #8 — REJECTED  · ₹${total}  · ${c3.businessName}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Reseed complete!

  Delivery persons : 2
    • Suresh Kumar  +91 9999900001  (test login phone)
    • Arjun Patel   +91 9999900002

  Customers : 3
    • Sunrise Bakery      +91 9876543210  (test login phone)
    • Green Leaf Restaurant  +91 9876500001
    • Metro Canteen          +91 9876500002

  Orders : 8  (one of every lifecycle status)
    #1  DELIVERED              Sunrise Bakery    ₹4,950
    #2  OUT FOR DELIVERY       Sunrise Bakery    ₹4,000
    #3  PENDING PAYMENT        Sunrise Bakery    ₹2,400
    #4  PAYMENT PENDING CONF.  Green Leaf        ₹2,550
    #5  ASSIGNED               Green Leaf        ₹4,000
    #6  CONFIRMED              Green Leaf        ₹2,550
    #7  CANCELLED              Metro Canteen     ₹1,350
    #8  REJECTED               Metro Canteen     ₹1,200

  Inventory reset
    15kg : available 89 · reserved 8 · delivered 3 · total 100
    17kg : available 47 · reserved 2 · delivered 1 · total  50
    20kg : available 28 · reserved 2 · delivered 0 · total  30
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

  await pg.end();
}

reseed().catch((e) => {
  console.error("❌ Reseed failed:", e);
  process.exit(1);
});
