import { getVisitor, guestCookieName } from "../../../lib/visitor";
export async function POST(request: Request) {
  if (
    (request.headers.get("origin") &&
      request.headers.get("origin") !== new URL(request.url).origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json({ error: "FORBIDDEN" }, { status: 403 });
  const visitor = await getVisitor();
  if (visitor)
    return Response.json(
      { kind: visitor.kind },
      { headers: { "Cache-Control": "no-store" } },
    );
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (x) =>
    x.toString(16).padStart(2, "0"),
  ).join("");
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return Response.json(
    { kind: "guest" },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie":
          guestCookieName +
          "=" +
          token +
          "; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000" +
          secure,
      },
    },
  );
}
