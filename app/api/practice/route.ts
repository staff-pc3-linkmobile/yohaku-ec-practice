import { getChatGPTUser } from "../../chatgpt-auth";
import { database, loadPractice } from "../../../lib/store";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    return Response.json(
      { mode: await loadPractice(database(), user.userId) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  let mode: string;
  try {
    const input = (await request.json()) as { mode?: unknown };
    if (input.mode !== "normal" && input.mode !== "shipping-boundary")
      throw Error();
    mode = input.mode;
  } catch {
    return Response.json({ error: "INVALID_MODE" }, { status: 400 });
  }
  try {
    await database()
      .prepare(
        "INSERT INTO practice_settings (user_id,mode,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET mode=excluded.mode,updated_at=excluded.updated_at",
      )
      .bind(user.userId, mode, new Date().toISOString())
      .run();
    console.log(JSON.stringify({ event: "practice_changed", mode }));
    return Response.json(
      { mode },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
  }
}
