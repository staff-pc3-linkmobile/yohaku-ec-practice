import assert from "node:assert/strict";
const base = "http://127.0.0.1:5173";
async function session() {
  const r = await fetch(base + "/api/session", {
    method: "POST",
    headers: { Origin: base },
  });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).kind, "guest");
  const raw = r.headers.get("set-cookie");
  assert.ok(raw.includes("HttpOnly"));
  assert.ok(raw.includes("SameSite=Lax"));
  return raw.split(";")[0];
}
async function api(cookie, path, body) {
  const r = await fetch(base + path, {
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      Origin: base,
    },
    ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
  });
  return { status: r.status, body: await r.json() };
}
assert.equal((await fetch(base + "/")).status, 200);
assert.equal((await fetch(base + "/api/products")).status, 200);
assert.equal((await fetch(base + "/api/orders")).status, 401);
assert.equal(
  (
    await fetch(base + "/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "normal" }),
    })
  ).status,
  401,
);
const a = await session(),
  b = await session();
assert.notEqual(a, b);
await api(a, "/api/practice", { mode: "shipping-boundary" });
assert.equal(
  (await api(a, "/api/products")).body.practice,
  "shipping-boundary",
);
assert.equal((await api(b, "/api/products")).body.practice, "normal");
const payload = {
  customer: "公開練習の確認",
  requestKey: crypto.randomUUID(),
  items: [
    { productId: "mug", quantity: 1 },
    { productId: "bag", quantity: 1 },
  ],
};
const order = await api(a, "/api/orders", payload);
assert.equal(order.status, 201);
assert.equal(order.body.order.total, 5500);
assert.equal(
  (await api(a, "/api/products")).body.products.find((p) => p.id === "mug")
    .stock,
  11,
);
assert.equal(
  (await api(b, "/api/products")).body.products.find((p) => p.id === "mug")
    .stock,
  12,
);
assert.equal((await api(a, "/api/orders")).body.orders.length, 1);
assert.equal((await api(b, "/api/orders")).body.orders.length, 0);
await api(b, "/api/inventory", {});
assert.equal(
  (await api(a, "/api/products")).body.products.find((p) => p.id === "mug")
    .stock,
  11,
);
await api(a, "/api/practice", { mode: "normal" });
const fixed = await api(a, "/api/orders", {
  ...payload,
  requestKey: crypto.randomUUID(),
});
assert.equal(fixed.body.order.total, 5000);
assert.equal(
  (await api(a, "/api/orders", payload)).body.order.id,
  order.body.order.id,
);
assert.equal((await api("yohaku_guest=invalid", "/api/orders")).status, 401);
// An arbitrary account header cannot turn an anonymous visitor into the signed-in owner in dev.
const spoof = await fetch(base + "/api/orders", {
  headers: {
    "oai-authenticated-user-id": "local_seedy",
    "oai-authenticated-user-email": "seedy@sites.test",
  },
});
assert.equal(spoof.status, 401);
console.log(
  "PASS: no-login home/catalog, guest capability required for writes, separate histories/stock/modes, isolated refill, actual bug and repair, idempotent replay, invalid capability and forged identity rejection",
);
