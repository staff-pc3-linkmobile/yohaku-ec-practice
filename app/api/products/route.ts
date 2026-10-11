import { getVisitor } from "../../../lib/visitor";
import { database, loadCatalog, loadPractice } from "../../../lib/store";
export async function GET() {
  const user = await getVisitor();
  try {
    return Response.json(
      {
        products: await loadCatalog(database(), user?.userId),
        practice: user ? await loadPractice(database(), user.userId) : "normal",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(JSON.stringify({ event: "catalog_failed", status: 503 }));
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
