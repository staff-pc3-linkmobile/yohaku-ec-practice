import { getVisitor } from "../../../lib/visitor";
import { database } from "../../../lib/store";
import { validateCheckout } from "../../../lib/commerce";
import { catalog } from "../../../lib/catalog";
const headers = {"Cache-Control":"no-store"};
export async function GET() {
  const user = await getVisitor();
  if (!user) return Response.json({error:"UNAUTHORIZED"}, {status:401, headers});
  try {
    const saved = await database().prepare("SELECT items FROM learning_carts WHERE user_id = ?").bind(user.userId).first<{items: string}>();
    return Response.json({items: saved ? JSON.parse(saved.items) : null}, {headers});
  } catch { return Response.json({error:"SERVICE_UNAVAILABLE"}, {status:503, headers}); }
}
export async function POST(request: Request) {
  if ((request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin)
    || request.headers.get("sec-fetch-site") === "cross-site")
    return Response.json({error:"FORBIDDEN"}, {status:403, headers});
  const user = await getVisitor();
  if (!user) return Response.json({error:"UNAUTHORIZED"}, {status:401, headers});
  let items;
  try {
    const b = await request.json() as {items?:unknown};
    items = Array.isArray(b.items) && b.items.length === 0 ? [] :
      validateCheckout({items:b.items, customer:"cart", requestKey:"cart-validation-key"}).items;
    if (items.some(x => !catalog.some(p => p.id === x.productId))) throw Error();
  } catch { return Response.json({error:"INVALID_INPUT"}, {status:400, headers}); }
  try {
    await database().prepare("INSERT INTO learning_carts (user_id,items,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET items=excluded.items,updated_at=excluded.updated_at")
      .bind(user.userId, JSON.stringify(items), new Date().toISOString()).run();
    return Response.json({saved:true}, {headers});
  } catch { return Response.json({error:"SERVICE_UNAVAILABLE"}, {status:503, headers}); }
}
