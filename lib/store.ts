import { env } from "cloudflare:workers";
import { catalog } from "./catalog";
import type { PracticeMode } from "./commerce";
export async function loadPractice(
  db: D1Database,
  userId: string,
): Promise<PracticeMode> {
  const row = await db
    .prepare("SELECT mode FROM practice_settings WHERE user_id=?")
    .bind(userId)
    .first<{ mode: string }>();
  return row?.mode === "shipping-boundary" ? "shipping-boundary" : "normal";
}
export function database(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db;
}
export async function ensureCatalog(db: D1Database) {
  await db.batch(
    catalog.map((p) =>
      db
        .prepare(
          "INSERT OR IGNORE INTO products (id,name,price,stock) VALUES (?,?,?,?)",
        )
        .bind(p.id, p.name, p.price, p.initialStock),
    ),
  );
}
export async function loadCatalog(db: D1Database, userId?: string) {
  await ensureCatalog(db);
  const { results } = await db
    .prepare("SELECT id,price,stock FROM products")
    .all<{ id: string; price: number; stock: number }>();
  let inventory: { product_id: string; stock: number }[] = [];
  if (userId) {
    const read = () =>
      db
        .prepare(
          "SELECT product_id,stock FROM practice_inventory WHERE user_id=?",
        )
        .bind(userId)
        .all<{ product_id: string; stock: number }>();
    inventory = (await read()).results;
    if (inventory.length < catalog.length) {
      await db.batch(
        catalog.map((p) =>
          db
            .prepare(
              "INSERT OR IGNORE INTO practice_inventory (user_id,product_id,stock) VALUES (?,?,?)",
            )
            .bind(userId, p.id, p.initialStock),
        ),
      );
      inventory = (await read()).results;
    }
  }
  return catalog.map((p) => {
    const row = results.find((r) => r.id === p.id);
    if (!row) throw new Error("PRODUCT_UNAVAILABLE");
    return {
      ...p,
      price: row.price,
      stock: userId
        ? inventory.find((i) => i.product_id === p.id)!.stock
        : p.initialStock,
    };
  });
}
export async function loadOrder(db: D1Database, id: string, userId: string) {
  const order = await db
    .prepare(
      "SELECT id,customer,subtotal,shipping,total,created_at AS createdAt FROM orders WHERE id=? AND user_id=?",
    )
    .bind(id, userId)
    .first();
  if (!order) return null;
  const { results: items } = await db
    .prepare(
      "SELECT product_id AS productId,name,price,quantity FROM order_items WHERE order_id=?",
    )
    .bind(id)
    .all();
  return { ...order, items };
}
