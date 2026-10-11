import { getChatGPTUser } from "../../chatgpt-auth";
import { database, loadCatalog, loadOrder } from "../../../lib/store";
import { validateCheckout, shippingFor } from "../../../lib/commerce";
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const db = database();
    const { results } = await db
      .prepare(
        "SELECT id FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 30",
      )
      .bind(user.userId)
      .all<{ id: string }>();
    return Response.json(
      {
        orders: await Promise.all(
          results.map((o) => loadOrder(db, o.id, user.userId)),
        ),
      },
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
  const requestId = crypto.randomUUID();
  let body: ReturnType<typeof validateCheckout>;
  try {
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new Error("INVALID_BODY");
    const raw = await request.text();
    if (raw.length > 8000) throw new Error("INVALID_BODY");
    body = validateCheckout(JSON.parse(raw));
  } catch {
    return Response.json(
      { error: "INVALID_INPUT", requestId },
      { status: 400 },
    );
  }
  const hash = JSON.stringify({ customer: body.customer, items: body.items });
  try {
    const db = database();
    const prior = await db
      .prepare(
        "SELECT id,request_hash AS hash FROM orders WHERE user_id=? AND request_key=?",
      )
      .bind(user.userId, body.requestKey)
      .first<{ id: string; hash: string }>();
    if (prior)
      return prior.hash === hash
        ? Response.json({
            order: await loadOrder(db, prior.id, user.userId),
            replayed: true,
            requestId,
          })
        : Response.json({ error: "KEY_CONFLICT", requestId }, { status: 409 });
    const products = await loadCatalog(db);
    const lines = body.items.map((l) => {
      const p = products.find((p) => p.id === l.productId);
      if (!p) throw new Error("UNKNOWN_PRODUCT");
      if (p.stock < l.quantity) throw new Error("INSUFFICIENT_STOCK");
      return { ...l, name: p.name, price: p.price };
    });
    const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0),
      shipping = shippingFor(subtotal);
    const id = "YH-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const statements = [
      db
        .prepare(
          "INSERT INTO orders (id,user_id,request_key,request_hash,customer,subtotal,shipping,total,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          user.userId,
          body.requestKey,
          hash,
          body.customer,
          subtotal,
          shipping,
          subtotal + shipping,
          new Date().toISOString(),
        ),
    ];
    for (const l of lines)
      statements.push(
        db
          .prepare("UPDATE products SET stock=stock-? WHERE id=?")
          .bind(l.quantity, l.productId),
        db
          .prepare(
            "INSERT INTO order_items (id,order_id,product_id,name,price,quantity) VALUES (?,?,?,?,?,?)",
          )
          .bind(
            crypto.randomUUID(),
            id,
            l.productId,
            l.name,
            l.price,
            l.quantity,
          ),
      );
    // batch is one transaction; stock CHECK rolls every change back if a competing order exhausts stock.
    await db.batch(statements);
    console.log(
      JSON.stringify({
        event: "order_created",
        requestId,
        orderId: id,
        status: 201,
      }),
    );
    return Response.json(
      { order: await loadOrder(db, id, user.userId), requestId },
      { status: 201 },
    );
  } catch (error) {
    const message = String(error);
    if (message.includes("UNIQUE constraint")) {
      try {
        const db = database();
        const p = await db
          .prepare(
            "SELECT id,request_hash AS hash FROM orders WHERE user_id=? AND request_key=?",
          )
          .bind(user.userId, body.requestKey)
          .first<{ id: string; hash: string }>();
        if (p)
          return p.hash === hash
            ? Response.json({
                order: await loadOrder(db, p.id, user.userId),
                replayed: true,
                requestId,
              })
            : Response.json(
                { error: "KEY_CONFLICT", requestId },
                { status: 409 },
              );
      } catch {}
    }
    const errorCode =
      message.includes("INSUFFICIENT_STOCK") ||
      message.includes("CHECK constraint")
        ? "INSUFFICIENT_STOCK"
        : message.includes("UNKNOWN_PRODUCT")
          ? "UNKNOWN_PRODUCT"
          : "SERVICE_UNAVAILABLE";
    const status =
      errorCode === "INSUFFICIENT_STOCK"
        ? 409
        : errorCode === "UNKNOWN_PRODUCT"
          ? 400
          : 503;
    console.error(
      JSON.stringify({
        event: "checkout_failed",
        error: errorCode,
        requestId,
        status,
      }),
    );
    return Response.json({ error: errorCode, requestId }, { status });
  }
}
