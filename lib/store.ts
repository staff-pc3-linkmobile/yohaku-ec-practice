import { env } from "cloudflare:workers";
import { catalog } from "./catalog";
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
export async function loadCatalog(db: D1Database) {
  await ensureCatalog(db);
  const { results } = await db
    .prepare("SELECT id,price,stock FROM products")
    .all<{ id: string; price: number; stock: number }>();
  return catalog.map((p) => {
    const row = results.find((r) => r.id === p.id);
    if (!row) throw new Error("PRODUCT_UNAVAILABLE");
    return { ...p, price: row.price, stock: row.stock };
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
