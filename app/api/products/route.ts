import { getChatGPTUser } from "../../chatgpt-auth";
import { database, loadCatalog, loadPractice } from "../../../lib/store";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    return Response.json(
      {
        products: await loadCatalog(database()),
        practice: await loadPractice(database(), user.userId),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(JSON.stringify({ event: "catalog_failed", status: 503 }));
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
