"use client";
import { useEffect, useRef, useState } from "react";
import {
  ShoppingBag,
  ArrowRight,
  X,
  Minus,
  Plus,
  Truck,
  Check,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import type { Product } from "../lib/catalog";
import { shippingFor, type CartLine, type PracticeMode } from "../lib/commerce";
import Training from "./training";
type Order = {
  id: string;
  customer: string;
  subtotal: number;
  shipping: number;
  total: number;
  createdAt: string;
  items: { name: string; price: number; quantity: number }[];
};
const yen = (n: number) => "¥" + n.toLocaleString("ja-JP");
const errors: Record<string, string> = {
  INSUFFICIENT_STOCK: "在庫が変わりました。カートの数量を確認してください。",
  INVALID_INPUT: "お名前と数量を確認してください。",
  KEY_CONFLICT: "注文内容が変わりました。一度カートに戻ってください。",
  UNAUTHORIZED: "ページを再読み込みして、練習を再開してください。",
  SERVICE_UNAVAILABLE:
    "注文を確認できませんでした。同じ内容のまま、もう一度お試しください。",
};
export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]),
    [category, setCategory] = useState("すべて"),
    [cart, setCart] = useState<CartLine[]>([]),
    [ready, setReady] = useState(false),
    [loadError, setLoadError] = useState(""),
    [panel, setPanel] = useState(""),
    [selected, setSelected] = useState<Product | null>(null),
    [customer, setCustomer] = useState("練習ユーザー"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<Order | null>(null),
    [orders, setOrders] = useState<Order[]>([]),
    [practice, setPractice] = useState<PracticeMode>("normal");
  const [cartStatus, setCartStatus] = useState("");
  const cartSave = useRef<Promise<void>>(Promise.resolve());
  const cartError = useRef(false);
  const initialized = useRef(false);
  const key = useRef(""),
    dialog = useRef<HTMLDialogElement>(null);
  async function refresh() {
    try {
      const session = await fetch("/api/session", {
        method: "POST",
        cache: "no-store",
      });
      if (!session.ok) throw Error();
      const r = await fetch("/api/products", { cache: "no-store" });
      if (!r.ok) throw Error();
      const data = (await r.json()) as {
        products: Product[];
        practice: PracticeMode;
      };
      setProducts(data.products);
      setPractice(data.practice);
      setLoadError("");
    } catch {
      setLoadError("商品を読み込めませんでした。再読み込みしてください。");
    }
  }
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    async function initialize() {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const token = fragment.get("continue");
      // Remove the secret before any request, link navigation or clipboard action.
      if (token !== null) window.history.replaceState(null, "", window.location.pathname + window.location.search);
      try {
        if (token !== null) {
          const r = await fetch("/api/learning-link", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body:JSON.stringify({action:"resume", token}),
          });
          if (!r.ok) { setLoadError("学習URLが無効か、期限が切れています。元のPCで新しいURLを作ってください。"); return; }
          setCartStatus("学習の続きを開きました。ログインは不要です。");
        }
        const session = await fetch("/api/session", {method:"POST", cache:"no-store"});
        if (!session.ok) throw Error();
        const saved = await fetch("/api/cart", {cache:"no-store"});
        if (!saved.ok) throw Error();
        const data = await saved.json() as {items:CartLine[] | null};
        let items = data.items;
        if (items === null && token === null) {
          try {
            const legacy = JSON.parse(localStorage.getItem("yohaku-cart") || "[]");
            if (Array.isArray(legacy)) items = legacy.filter((x:CartLine) => x && typeof x.productId === "string" && Number.isInteger(x.quantity) && x.quantity > 0 && x.quantity <= 10).slice(0,6);
            localStorage.removeItem("yohaku-cart");
          } catch {}
        }
        setCart(items || []);
        await refresh();
        setReady(true);
      } catch { setLoadError("学習データを読み込めませんでした。再読み込みしてください。"); }
    }
    void initialize();
  }, []);
  useEffect(() => {
    if (!ready) return;
    const items = cart;
    // Serialize this browser's writes so a slower response cannot restore an older cart.
    cartSave.current = cartSave.current.then(async () => {
      setCartStatus("カートを保存中…");
      try {
        const r = await fetch("/api/cart", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({items})});
        if (!r.ok) throw Error();
        cartError.current = false;
        setCartStatus("カート保存済み · 学習URLで別PCへ引き継げます");
      } catch { cartError.current = true; setCartStatus("カートを保存できませんでした。再読み込み前に数量を変更して再保存してください。"); }
    });
  }, [cart, ready]);
  async function beforeShare() {
    await cartSave.current;
    if (!ready || cartError.current) throw Error();
  }
  useEffect(() => {
    // Pasting a continuation URL into an already-open store can be fragment-only navigation.
    const openNotebook = () => {
      if (new URLSearchParams(window.location.hash.slice(1)).has("continue")) window.location.reload();
    };
    window.addEventListener("hashchange", openNotebook);
    return () => window.removeEventListener("hashchange", openNotebook);
  }, []);
  useEffect(() => {
    if (panel) {
      dialog.current?.showModal();
      setMessage("");
    } else dialog.current?.close();
  }, [panel]);
  const lines = cart
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.productId) }))
    .filter((l) => l.product);
  const count = cart.reduce((s, l) => s + l.quantity, 0),
    subtotal = lines.reduce((s, l) => s + l.product!.price * l.quantity, 0),
    shipping = shippingFor(subtotal, practice);
  function change(id: string, delta: number) {
    key.current = "";
    setCart((c) => {
      const p = products.find((p) => p.id === id);
      const current = c.find((l) => l.productId === id)?.quantity || 0;
      const quantity = Math.min(
        10,
        p?.stock ?? 0,
        Math.max(0, current + delta),
      );
      return [
        ...c.filter((l) => l.productId !== id),
        ...(quantity ? [{ productId: id, quantity }] : []),
      ];
    });
  }
  function add(p: Product) {
    change(p.id, 1);
    setPanel("cart");
  }
  async function history() {
    setPanel("orders");
    setBusy(true);
    try {
      const r = await fetch("/api/orders", { cache: "no-store" });
      if (!r.ok) throw Error();
      setOrders(((await r.json()) as { orders: Order[] }).orders);
    } catch {
      setMessage("注文履歴を読み込めませんでした。もう一度開いてください。");
    } finally {
      setBusy(false);
    }
  }
  async function checkout() {
    setBusy(true);
    setMessage("");
    key.current ||= crypto.randomUUID();
    try {
      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: cart,
          requestKey: key.current,
        }),
      });
      const b = (await r.json()) as {
        error: string;
        requestId?: string;
        order: Order;
      };
      if (!r.ok) {
        setMessage(
          (errors[b.error] || "注文できませんでした。") +
            (b.requestId ? " 確認番号: " + b.requestId.slice(0, 8) : ""),
        );
        await refresh();
        return;
      }
      setReceipt(b.order);
      setCart([]);
      key.current = "";
      setPanel("receipt");
      await refresh();
    } catch {
      setMessage(
        "通信が途切れました。内容を変えずに再送すると、二重注文を防げます。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function restock() {
    setBusy(true);
    try {
      const r = await fetch("/api/inventory", { method: "POST" });
      if (!r.ok) throw Error();
      await refresh();
      setMessage("練習用の在庫を補充しました。注文履歴は残っています。");
    } catch {
      setMessage("補充できませんでした。もう一度お試しください。");
    } finally {
      setBusy(false);
    }
  }
  function orderCard(o: Order) {
    return (
      <article className="order-card" key={o.id}>
        <div className="row">
          <strong>{o.id}</strong>
          <span className="chip">受付済み</span>
        </div>
        <p className="muted">{new Date(o.createdAt).toLocaleString("ja-JP")}</p>
        {o.items.map((l, i) => (
          <div className="row" key={i}>
            <span>
              {l.name} × {l.quantity}
            </span>
            <span>{yen(l.price * l.quantity)}</span>
          </div>
        ))}
        <div className="row">
          <span>送料</span>
          <span>{yen(o.shipping)}</span>
        </div>
        <div className="row order-total">
          <strong>合計</strong>
          <strong>{yen(o.total)}</strong>
        </div>
        <small>お名前：{o.customer} / 実際の請求・発送はありません</small>
      </article>
    );
  }
  return (
    <>
      <div className="announcement">
        {practice === "shipping-boundary"
          ? "送料のバグ練習中 · 学習・運用から修正できます"
          : "公開の学習ストア · 実際の請求・発送はありません"}
      </div>
      <header>
        <a href="/" className="brand" aria-label="余白ストア ホーム">
          余白<span>YOHAKU STORE</span>
        </a>
        <nav>
          <a href="#collection">商品一覧</a>
          <button onClick={() => void history()}>注文履歴</button>
          <button
            className="cart-button"
            onClick={() => setPanel("cart")}
            aria-label={"カート " + count + "点"}
          >
            <ShoppingBag size={19} />
            <span>カート</span>
            <b>{count}</b>
          </button>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">SMALL THINGS, SLOW DAYS.</p>
            <h1>
              毎日に、
              <br />
              少しの余白を。
            </h1>
            <p className="hero-description">
              手に取るたび、心地よい。
              <br />
              暮らしを整える、小さな道具を集めました。
            </p>
            <a className="primary" href="#collection">
              道具を見つける <ArrowRight size={17} />
            </a>
            <span className="hero-caption">
              長く使いたいものを、ひとつずつ。
            </span>
          </div>
          <div className="hero-art">
            <img
              src="/hero.svg"
              alt="マグカップとノートのある、穏やかな机の風景"
            />
            <span className="art-label">暮らしに、なじむ。</span>
            <span className="art-number">01 / THE EVERYDAY EDIT</span>
          </div>
        </section>
        <div className="benefits">
          <span>
            <Truck size={18} />
            5,000円以上で送料無料
          </span>
          <span>毎日に寄り添う、6つの道具</span>
          <span>気軽に試せるデモ注文</span>
        </div>
        <section id="collection" className="collection">
          <div className="section-top">
            <div>
              <p className="eyebrow">THE COLLECTION</p>
              <h2>暮らしの道具</h2>
            </div>
            <span className="collection-note">
              いつもの毎日を、ちょっと心地よく。
            </span>
          </div>
          <div className="filter-row">
            <div className="filters">
              {["すべて", "暮らし", "文具"].map((c) => (
                <button
                  key={c}
                  className={c === category ? "active" : ""}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <span className="muted">
              {
                products.filter(
                  (p) => category === "すべて" || p.category === category,
                ).length
              }{" "}
              ITEMS
            </span>
          </div>
          {loadError ? (
            <div className="empty">
              <p role="alert">{loadError}</p>
              <button className="primary" onClick={() => window.location.reload()}>
                再読み込み
              </button>
            </div>
          ) : !products.length ? (
            <p className="empty">商品を準備しています…</p>
          ) : (
            <div className="product-grid">
              {products
                .filter((p) => category === "すべて" || p.category === category)
                .map((p) => (
                  <article className="product" key={p.id}>
                    <button
                      className="product-image"
                      onClick={() => {
                        setSelected(p);
                        setPanel("detail");
                      }}
                      aria-label={p.name + "の詳細"}
                    >
                      <img src={p.image} alt={p.name} />
                      <span className="image-arrow">
                        <ArrowUpRight size={18} />
                      </span>
                      {p.stock === 0 && (
                        <span className="sold-out">SOLD OUT</span>
                      )}
                    </button>
                    <p className="product-english">{p.english}</p>
                    <div className="row product-title">
                      <button
                        onClick={() => {
                          setSelected(p);
                          setPanel("detail");
                        }}
                      >
                        {p.name}
                      </button>
                      <span>{yen(p.price)}</span>
                    </div>
                    <div className="row product-bottom">
                      <span>
                        {p.category}{" "}
                        <span className="stock">/ 在庫 {p.stock}</span>
                      </span>
                      <button
                        onClick={() => add(p)}
                        disabled={
                          !ready || !p.stock ||
                          (cart.find((l) => l.productId === p.id)?.quantity ||
                            0) >= Math.min(10, p.stock ?? 0)
                        }
                        aria-label={p.name + "をカートへ"}
                      >
                        <Plus size={16} />
                        カートへ
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </section>
        <section className="closing">
          <span className="closing-mark">余白</span>
          <div>
            <p className="eyebrow">LESS, BUT LOVELY.</p>
            <h2>お気に入りがある日常。</h2>
            <p>小さな道具から、暮らしをゆっくり整えてみませんか。</p>
          </div>
        </section>
      </main>
      <footer>
        <span>© 2026 YOHAKU STORE</span>
        <button
          onClick={() => {
            void refresh();
            setPanel("learning");
          }}
        >
          学習・運用 <ArrowUpRight size={13} />
        </button>
        <span>DEMO STORE / V1.3</span>
      </footer>
      <dialog
        ref={dialog}
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setPanel("");
        }}
        onClose={() => setPanel("")}
        className="drawer"
      >
        <div className="drawer-head">
          <span className="eyebrow">YOHAKU STORE</span>
          <button
            className="icon-button"
            onClick={() => setPanel("")}
            disabled={busy}
            aria-label="閉じる"
          >
            <X size={22} />
          </button>
        </div>
        <div className="drawer-body">
          {panel === "detail" && selected && (
            <>
              <img
                className="detail-image"
                src={selected.image}
                alt={selected.name}
              />
              <p className="eyebrow">{selected.english}</p>
              <h2>{selected.name}</h2>
              <p className="detail-description">{selected.description}</p>
              <p className="muted">{selected.material}</p>
              <div className="row">
                <strong className="large-price">{yen(selected.price)}</strong>
                <span>在庫 {selected.stock}</span>
              </div>
              <button
                className="primary full"
                disabled={!ready || !selected.stock}
                onClick={() => add(selected)}
              >
                カートに入れる <ShoppingBag size={17} />
              </button>
            </>
          )}
          {(panel === "cart" || panel === "checkout") && (
            <>
              <h2>{panel === "cart" ? "カート" : "注文内容の確認"}</h2>
              <p className="muted">{count} 点の商品</p>
              {!lines.length ? (
                <div className="empty">
                  <ShoppingBag size={34} />
                  <p>カートはまだ空です。</p>
                  <button className="primary" onClick={() => setPanel("")}>
                    商品を見つける
                  </button>
                </div>
              ) : (
                <>
                  {lines.map((l) => (
                    <div className="cart-line" key={l.productId}>
                      <img src={l.product!.image} alt="" />
                      <div>
                        <strong>{l.product!.name}</strong>
                        <p>{yen(l.product!.price)}</p>
                        <div className="quantity">
                          <button
                            disabled={busy}
                            onClick={() => change(l.productId, -1)}
                            aria-label={l.product!.name + "を減らす"}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{l.quantity}</span>
                          <button
                            disabled={
                              busy ||
                              l.quantity >= Math.min(10, l.product!.stock ?? 0)
                            }
                            onClick={() => change(l.productId, 1)}
                            aria-label={l.product!.name + "を増やす"}
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            className="remove"
                            disabled={busy}
                            onClick={() => {
                              key.current = "";
                              setCart((c) =>
                                c.filter((x) => x.productId !== l.productId),
                              );
                            }}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="summary">
                    <div className="row">
                      <span>小計</span>
                      <span>{yen(subtotal)}</span>
                    </div>
                    <div className="row">
                      <span>送料</span>
                      <span>{shipping ? yen(shipping) : "無料"}</span>
                    </div>
                    <div className="row order-total">
                      <strong>合計</strong>
                      <strong>{yen(subtotal + shipping)}</strong>
                    </div>
                  </div>
                  <p className="shipping-note">
                    <Truck size={16} />
                    {shipping
                      ? "あと " + yen(5000 - subtotal) + " で送料無料"
                      : "送料無料でお届けします"}
                  </p>
                  {panel === "checkout" ? (
                    <>
                      <label className="input-label">
                        練習用の呼び名（本名不要）
                        <input
                          maxLength={40}
                          value={customer}
                          disabled={busy}
                          onChange={(e) => {
                            setCustomer(e.target.value);
                            key.current = "";
                          }}
                          autoComplete="off"
                        />
                      </label>
                      <p className="demo-note">
                        デモ注文です。住所・カード情報は不要です。
                        <br />
                        実際のお金はかからず、商品も発送されません。
                      </p>
                      <button
                        className="primary full"
                        disabled={busy || !customer.trim()}
                        onClick={() => void checkout()}
                      >
                        {busy ? "注文を確認中…" : "デモ注文を確定する"}
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="text-button full"
                        disabled={busy}
                        onClick={() => {
                          key.current = "";
                          setPanel("cart");
                        }}
                      >
                        カートに戻る
                      </button>
                    </>
                  ) : (
                    <button
                      className="primary full"
                      onClick={() => setPanel("checkout")}
                    >
                      注文に進む <ArrowRight size={17} />
                    </button>
                  )}
                </>
              )}
            </>
          )}
          {panel === "receipt" && receipt && (
            <>
              <div className="success-icon">
                <Check size={27} />
              </div>
              <p className="eyebrow">THANK YOU</p>
              <h2>注文を受け付けました。</h2>
              <p className="detail-description">
                注文履歴に保存されました。
                <br />
                次に開いたときも確認できます。
              </p>
              {orderCard(receipt)}
              <button className="primary full" onClick={() => setPanel("")}>
                お買い物を続ける
                <ArrowRight size={17} />
              </button>
            </>
          )}
          {panel === "orders" && (
            <>
              <h2>注文履歴</h2>
              <p className="muted">最近の30件 · 自分の注文だけを表示</p>
              {busy ? (
                <p className="empty">読み込み中…</p>
              ) : orders.length ? (
                orders.map(orderCard)
              ) : (
                <p className="empty">まだ注文はありません。</p>
              )}
            </>
          )}
          {panel === "learning" && (
            <>
              <p className="eyebrow">LEARNING & OPERATIONS</p>
              <h2>小さなECを、育てる。</h2>
              <p className="detail-description">
                まずは正常な状態を体験しましょう。商品を選び、注文して、履歴と在庫の変化を確かめます。
              </p>
              <div className="lesson">
                <b>今日：1件、注文してみる</b>
                <p>
                  マグを1個注文 → 在庫が1個減る →
                  ページを開き直して注文履歴を確認。画面の裏で情報が保存される様子を体験します。
                </p>
              </div>
              <p className="muted" role="status">{cartStatus}</p>
              <Training mode={practice} onChange={refresh} beforeShare={beforeShare} />
              <div className="lesson">
                <b>次回：在庫・二重注文の調査</b>
                <p>
                  最後の1個や、注文ボタンを続けて押す場面を調べます。バグは次の練習で、一つずつ入れます。
                </p>
              </div>
              <button
                className="secondary full"
                disabled={busy}
                onClick={() => void restock()}
              >
                <RotateCcw size={16} />
                {busy ? "補充中…" : "練習用の在庫を補充"}
              </button>
              <p className="muted">補充しても注文履歴は残ります。</p>
            </>
          )}
          {message && (
            <div className="feedback" role="status">
              {message}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}
