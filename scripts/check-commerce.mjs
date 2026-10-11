import assert from "node:assert/strict";
import { shippingFor, validateCheckout } from "../lib/commerce.ts";
assert.equal(shippingFor(4999), 500);
assert.equal(shippingFor(5000), 0);
assert.equal(shippingFor(5001), 0);
for (const quantity of [0, -1, 1.5, 11, "1", null])
  assert.throws(() =>
    validateCheckout({
      customer: "練習",
      requestKey: "test-key-12345678",
      items: [{ productId: "mug", quantity }],
    }),
  );
assert.throws(() =>
  validateCheckout({
    customer: "練習",
    requestKey: "test-key-12345678",
    items: [
      { productId: "mug", quantity: 1 },
      { productId: "mug", quantity: 1 },
    ],
  }),
);
console.log("PASS: shipping boundary and invalid quantity checks");
const base = "http://127.0.0.1:5173";
const headers = {
  Cookie: "__sites_local_auth=1",
  "Content-Type": "application/json",
  Origin: base,
};
async function api(path, body) {
  const r = await fetch(
    base + path,
    body
      ? { method: "POST", headers, body: JSON.stringify(body) }
      : { headers },
  );
  return { status: r.status, body: await r.json() };
}
assert.equal((await fetch(base + "/api/products")).status, 401);
assert.equal((await fetch(base + "/api/orders")).status, 401);
assert.equal(
  (await fetch(base + "/api/inventory", { method: "POST" })).status,
  401,
);
assert.equal(
  (
    await fetch(base + "/api/inventory", {
      method: "POST",
      headers: { ...headers, Origin: "https://another.example" },
    })
  ).status,
  403,
);
await api("/api/inventory", {});
const before = (await api("/api/products")).body.products.find(
  (p) => p.id === "mug",
).stock;
const request = {
  customer: "自動確認・練習注文",
  requestKey: crypto.randomUUID(),
  items: [{ productId: "mug", quantity: 1, price: 1 }],
  total: 1,
};
const [a, b] = await Promise.all([
  api("/api/orders", request),
  api("/api/orders", request),
]);
assert.deepEqual([a.status, b.status].sort(), [200, 201]);
assert.equal(a.body.order.id, b.body.order.id);
assert.equal(a.body.order.total, 2300);
assert.equal(
  (await api("/api/products")).body.products.find((p) => p.id === "mug").stock,
  before - 1,
);
const replay = await api("/api/orders", request);
assert.equal(replay.body.order.id, a.body.order.id);
assert.equal(
  (await api("/api/orders", { ...request, customer: "変えた名前" })).status,
  409,
);
const history = await api("/api/orders");
assert.equal(
  history.body.orders.filter((o) => o.id === a.body.order.id).length,
  1,
);
assert.equal(
  (
    await api("/api/orders", {
      ...request,
      requestKey: crypto.randomUUID(),
      items: [{ productId: "mug", quantity: -1 }],
    })
  ).status,
  400,
);
const free = await api("/api/orders", {
  customer: "送料無料の確認",
  requestKey: crypto.randomUUID(),
  items: [
    { productId: "mug", quantity: 1 },
    { productId: "bag", quantity: 1 },
  ],
});
assert.equal(free.status, 201);
assert.equal(free.body.order.subtotal, 5000);
assert.equal(free.body.order.shipping, 0);
// Leave one tray; two simultaneous buyers cannot both receive it.
await api("/api/orders", {
  customer: "在庫の確認",
  requestKey: crypto.randomUUID(),
  items: [{ productId: "tray", quantity: 7 }],
});
const stockOrders = await Promise.all(
  [1, 2].map(() =>
    api("/api/orders", {
      customer: "最後の1個の確認",
      requestKey: crypto.randomUUID(),
      items: [{ productId: "tray", quantity: 1 }],
    }),
  ),
);
assert.deepEqual(stockOrders.map((x) => x.status).sort(), [201, 409]);
assert.equal(
  (await api("/api/products")).body.products.find((p) => p.id === "tray").stock,
  0,
);
await api("/api/inventory", {});
console.log(
  "PASS: authentication, origin checks, authoritative price, double submit, changed replay, persisted history, free shipping, last-item contention, restock",
);
