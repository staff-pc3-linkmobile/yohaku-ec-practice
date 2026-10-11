import { getVisitor } from "../../../lib/visitor";
import { database, loadCatalog } from "../../../lib/store";
import { catalog } from "../../../lib/catalog";
export async function POST(request: Request) {
  const user = await getVisitor();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const db = database();
    await loadCatalog(db, user.userId);
    await db.batch(
      catalog.map((p) =>
        db
          .prepare(
            "UPDATE practice_inventory SET stock=? WHERE product_id=? AND user_id=?",
          )
          .bind(p.initialStock, p.id, user.userId),
      ),
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
