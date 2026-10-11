import { getVisitor, hashToken, resumeCookieName, resolveLearningLink, validToken } from "../../../lib/visitor";
import { database } from "../../../lib/store";
const days90 = 90 * 24 * 60 * 60;
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
export async function POST(request: Request) {
  if ((request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin)
    || request.headers.get("sec-fetch-site") === "cross-site")
    return Response.json({error:"FORBIDDEN"}, {status:403, headers});
  let input: { action?: unknown; token?: unknown };
  try { input = await request.json(); if (!input || typeof input !== "object") throw Error(); }
  catch { return Response.json({error:"INVALID_INPUT"}, {status:400, headers}); }
  try {
    if (input.action === "resume") {
      if (!validToken(input.token)) return Response.json({error:"INVALID_LINK"}, {status:400, headers});
      const link = await resolveLearningLink(input.token);
      if (!link) return Response.json({error:"INVALID_LINK"}, {status:410, headers});
      const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
      return Response.json({kind:"link"}, {headers: {...headers, "Set-Cookie":
        resumeCookieName + "=" + input.token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + days90 + secure}});
    }
    if (input.action !== "create") return Response.json({error:"INVALID_INPUT"}, {status:400, headers});
    const visitor = await getVisitor();
    if (!visitor) return Response.json({error:"UNAUTHORIZED"}, {status:401, headers});
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2,"0")).join("");
    const expiresAt = Date.now() + days90 * 1000;
    await database().prepare("INSERT INTO learning_links (token_hash,user_id,expires_at) VALUES (?,?,?)")
      .bind(await hashToken(token), visitor.userId, expiresAt).run();
    // Fragment never travels in a URL request or Referer. Exchange only through same-origin POST.
    return Response.json({fragment: "#continue=" + token, expiresAt}, {headers});
  } catch { return Response.json({error:"SERVICE_UNAVAILABLE"}, {status:503, headers}); }
}
