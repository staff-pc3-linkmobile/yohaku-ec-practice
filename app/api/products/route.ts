import { getChatGPTUser } from "../../chatgpt-auth";
import { database, loadCatalog } from "../../../lib/store";
export async function GET() {
  if (!(await getChatGPTUser()))
    return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    return Response.json(
      { products: await loadCatalog(database()) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(JSON.stringify({ event: "catalog_failed", status: 503 }));
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
