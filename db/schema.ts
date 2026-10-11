import {
  sqliteTable,
  text,
  integer,
  check,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
export const practiceInventory = sqliteTable(
  "practice_inventory",
  {
    userId: text("user_id").notNull(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    stock: integer("stock").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.productId] }),
    check("nonnegative_practice_stock", sql`${t.stock} >= 0`),
  ],
);
export const practiceSettings = sqliteTable(
  "practice_settings",
  {
    userId: text("user_id").primaryKey(),
    mode: text("mode").notNull().default("normal"),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    check(
      "valid_practice_mode",
      sql`${t.mode} IN ('normal', 'shipping-boundary')`,
    ),
  ],
);
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").notNull(),
  },
  (t) => [
    check("positive_price", sql`${t.price} > 0`),
    check("nonnegative_stock", sql`${t.stock} >= 0`),
  ],
);
export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    requestKey: text("request_key").notNull(),
    requestHash: text("request_hash").notNull(),
    customer: text("customer").notNull(),
    subtotal: integer("subtotal").notNull(),
    shipping: integer("shipping").notNull(),
    total: integer("total").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [uniqueIndex("order_idempotency").on(t.userId, t.requestKey)],
);
export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),
    price: integer("price").notNull(),
    quantity: integer("quantity").notNull(),
  },
  (t) => [check("positive_quantity", sql`${t.quantity} > 0`)],
);
