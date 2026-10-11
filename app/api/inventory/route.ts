import { getChatGPTUser } from "../../chatgpt-auth";
import { database, ensureCatalog } from "../../../lib/store";
import { catalog } from "../../../lib/catalog";
export async function POST(request: Request) {
  if (!(await getChatGPTUser()))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const db = database();
    await ensureCatalog(db);
    await db.batch(
      catalog.map((p) =>
        db
          .prepare("UPDATE products SET stock=? WHERE id=?")
          .bind(p.initialStock, p.id),
      ),
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
