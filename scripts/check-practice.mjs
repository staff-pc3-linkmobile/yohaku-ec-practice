import assert from "node:assert/strict";
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
const setMode = (mode) => api("/api/practice", { mode });
const order = () =>
  api("/api/orders", {
    customer: "別PC継続の確認",
    requestKey: crypto.randomUUID(),
    items: [
      { productId: "mug", quantity: 1 },
      { productId: "bag", quantity: 1 },
    ],
  });
try {
  assert.equal((await fetch(base + "/api/practice")).status, 401);
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
  assert.equal(
    (
      await fetch(base + "/api/practice", {
        method: "POST",
        headers: { ...headers, Origin: "https://other.example" },
        body: JSON.stringify({ mode: "normal" }),
      })
    ).status,
    403,
  );
  assert.equal((await setMode("arbitrary-code")).status, 400);
  await api("/api/inventory", {});
  assert.equal((await setMode("shipping-boundary")).status, 200);
  // A fresh HTTP request, independent of any browser storage, sees the saved mode.
  const fresh = await api("/api/practice");
  assert.equal(fresh.body.mode, "shipping-boundary");
  assert.equal((await api("/api/products")).body.practice, "shipping-boundary");
  const faulty = await order();
  assert.equal(faulty.status, 201);
  assert.equal(faulty.body.order.shipping, 500);
  assert.equal(faulty.body.order.total, 5500);
  await setMode("normal");
  assert.equal((await api("/api/practice")).body.mode, "normal");
  const repaired = await order();
  assert.equal(repaired.status, 201);
  assert.equal(repaired.body.order.shipping, 0);
  assert.equal(repaired.body.order.total, 5000);
  const history = await api("/api/orders");
  assert.equal(
    history.body.orders.find((o) => o.id === faulty.body.order.id).shipping,
    500,
  );
  console.log(
    "PASS: authenticated saved mode, invalid mode rejection, cross-origin rejection, faulty real order, repair, historical totals unchanged",
  );
} finally {
  await setMode("normal");
  await api("/api/inventory", {});
}
