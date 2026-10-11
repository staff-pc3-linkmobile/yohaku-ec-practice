import assert from "node:assert/strict";
const base = process.env.EC_TEST_BASE || "http://127.0.0.1:5173";
async function request(cookie, path, body, origin = base) {
  const r = await fetch(base + path, {headers:{Cookie:cookie || "", Origin:origin, "Content-Type":"application/json"}, ...(body ? {method:"POST", body:JSON.stringify(body)} : {})});
  const text = await r.text();
  let data; try { data=JSON.parse(text); } catch { data={error:text}; }
  return {status:r.status, body:data, cookie:r.headers.get("set-cookie")};
}
async function guest() {
  const r = await request("", "/api/session", {});
  assert.equal(r.status,200);
  return r.cookie.split(";")[0];
}
assert.equal((await request("", "/api/learning-link", {action:"create"})).status,401);
assert.equal((await request("", "/api/learning-link", {action:"resume", token:"bad"})).status,400);
assert.equal((await request("", "/api/learning-link", {action:"resume", token:"a".repeat(64)})).status,410);
const a=await guest(), b=await guest();
await request(a, "/api/practice", {mode:"shipping-boundary"});
const cart=[{productId:"mug", quantity:1},{productId:"bag",quantity:1}];
assert.equal((await request(a, "/api/cart", {items:cart})).status,200);
assert.equal((await request(a, "/api/cart", {items:[{productId:"unknown",quantity:1}]})).status,400);
assert.equal((await request(a, "/api/cart", {items:[{productId:"mug",quantity:11}]})).status,400);
assert.equal((await request("", "/api/cart", {items:[]})).status,401);
const link=await request(a, "/api/learning-link", {action:"create"});
assert.equal(link.status,200);
assert.match(link.body.fragment,/^#continue=[a-f0-9]{64}$/);
const token=link.body.fragment.slice("#continue=".length);
assert.equal((await request("", "/api/learning-link", {action:"resume", token}, "https://other.example")).status,403);
const secondPC=await request("", "/api/learning-link", {action:"resume", token});
assert.equal(secondPC.status,200);
assert.ok(secondPC.cookie.includes("HttpOnly"));
assert.ok(secondPC.cookie.includes("SameSite=Lax"));
if (base.startsWith("https:")) assert.ok(secondPC.cookie.includes("Secure"));
const c=secondPC.cookie.split(";")[0];
assert.equal((await request(c,"/api/products")).body.practice,"shipping-boundary");
assert.deepEqual((await request(c,"/api/cart")).body.items, [...cart].sort((x,y)=>x.productId.localeCompare(y.productId)));
const order=await request(c,"/api/orders",{customer:"引き継ぎの確認",requestKey:crypto.randomUUID(),items:cart});
assert.equal(order.status,201);
assert.equal(order.body.order.total,5500);
assert.equal((await request(a,"/api/orders")).body.orders[0].id,order.body.order.id);
assert.equal((await request(a,"/api/products")).body.products.find(p=>p.id==="mug").stock,11);
await request(c,"/api/practice",{mode:"normal"});
assert.equal((await request(a,"/api/products")).body.practice,"normal");
await request(c,"/api/cart",{items:[]});
assert.deepEqual((await request(a,"/api/cart")).body.items,[]);
assert.equal((await request(b,"/api/orders")).body.orders.length,0);
assert.equal((await request(b,"/api/products")).body.products.find(p=>p.id==="mug").stock,12);
assert.equal((await request(b,"/api/cart")).body.items,null);
assert.equal((await request(a,"/api/cart",{items:[]},"https://other.example")).status,403);
assert.equal((await request("yohaku_resume=invalid","/api/orders")).status,401);
console.log("PASS: no-login learning-link transfer, real shared orders/stock/bug settings/cart, isolated unrelated visitor, invalid/unknown links and cross-origin rejection");
