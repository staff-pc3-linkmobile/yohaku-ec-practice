"use client";
import { useState } from "react";
import type { PracticeMode } from "../lib/commerce";
export default function Training({
  mode,
  onChange,
  beforeShare,
}: {
  mode: PracticeMode;
  onChange: () => Promise<void>;
  beforeShare: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [condition, setCondition] = useState(">=");
  const [resumeUrl, setResumeUrl] = useState("");
  async function createLink() {
    setBusy(true);
    setMessage("");
    try {
      await beforeShare();
      const r = await fetch("/api/learning-link", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"create"}),
      });
      if (!r.ok) throw Error();
      const data = await r.json() as {fragment:string};
      setResumeUrl(window.location.origin + "/" + data.fragment);
      setMessage("続きから開くURLを作りました。別PCで開くと、同じ学習の続きになります。");
    } catch { setMessage("引き継ぎURLを作れませんでした。保存を確認してもう一度お試しください。"); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(resumeUrl); setMessage("URLをコピーしました。別PCのブラウザーで開いてください。"); }
    catch { setMessage("下のURL欄を選択してコピーしてください。"); }
  }
  async function save(next: PracticeMode) {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      });
      if (!r.ok) throw Error();
      await onChange();
      setMessage(
        next === "normal"
          ? "正常な判定を保存しました。5,000円ちょうどで再確認しましょう。"
          : "送料のバグを有効にしました。マグ1個とトート1個をカートに入れてください。",
      );
    } catch {
      setMessage("設定を保存できませんでした。もう一度試してください。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="training">
      <div className="row">
        <b>送料のバグ練習</b>
        <span className="chip">
          {mode === "normal" ? "正常" : "バグ練習中"}
        </span>
      </div>
      <p className="detail-description">
        ログイン不要です。下の「続きから開くURL」を別PCで開くと、注文履歴・在庫・バグ設定・カートを引き継げます。
      </p>
      <button className="secondary full" disabled={busy} onClick={() => void createLink()}>
        {busy ? "保存中…" : "続きから開くURLを作る"}
      </button>
      {resumeUrl && <>
        <label className="input-label">別PCで開く学習URL
          <input readOnly value={resumeUrl} onFocus={e => e.target.select()} />
        </label>
        <button className="primary full" onClick={() => void copyLink()}>学習URLをコピー</button>
      </>}
      <p className="muted">このURLは学習ノートの合鍵です。持っている人は同じ練習を閲覧・修正できます。有効期限は作成から90日。別PCで変更したら、この画面を再読み込みしてください。</p>
      <ol className="training-steps">
        <li>「バグを起こす」を押す。</li>
        <li>
          マグ1個＋トート1個をカートに入れる。小計5,000円なのに送料500円になる。
        </li>
        <li>原因を読み、送料無料の条件を選んで修正する。</li>
        <li>カートに戻り、送料0円・合計5,000円を確認する。</li>
      </ol>
      <button
        className="secondary full"
        disabled={busy || mode === "shipping-boundary"}
        onClick={() => void save("shipping-boundary")}
      >
        送料のバグを起こす
      </button>
      <details className="cause">
        <summary>原因とコードを見る</summary>
        <p>
          「5,000円以上」は、5,000円ちょうども含みます。「5,000円より大きい」と勘違いすると、ちょうどの人だけ送料無料の仲間に入れません。
        </p>
        <pre>
          <code>
            {"// 今の送料判定\nsubtotal " +
              (mode === "normal" ? ">=" : ">") +
              " 5000 ? 0 : 500"}
          </code>
        </pre>
        <p>
          <code>subtotal</code> は商品代の合計、<code>?</code>{" "}
          の後の0は条件が合うときの送料、<code>:</code>{" "}
          の後の500はそれ以外の送料です。<code>&gt;</code> は「より大きい」、
          <code>&gt;=</code> は「以上」です。
        </p>
      </details>
      <label className="input-label">
        送料無料になる条件
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          disabled={busy}
        >
          <option value=">">小計 &gt; 5,000（より大きい）</option>
          <option value=">=">小計 &gt;= 5,000（以上）</option>
        </select>
      </label>
      <button
        className="primary full"
        disabled={busy}
        onClick={() =>
          void save(condition === ">=" ? "normal" : "shipping-boundary")
        }
      >
        {busy ? "保存中…" : "この条件で修正を保存"}
      </button>
      <button
        className="text-button full"
        disabled={busy || mode === "normal"}
        onClick={() => void save("normal")}
      >
        練習を終了して正常に戻す
      </button>
      <p className="muted">
        変更するのはこの学習ノートだけです。過去の注文金額は書き換えません。通常のストアURLだけでは別PCの続きは開けないため、専用の学習URLを保存してください。
      </p>
      {message && (
        <p className="feedback" role="status">
          {message}
        </p>
      )}
      <p className="detail-description">
        コード全体の閲覧・編集はこちら。GitHubへの保存だけではストアには反映されません。
      </p>
      <a
        className="secondary full"
        href="https://github.com/staff-pc3-linkmobile/yohaku-ec-practice"
        target="_blank"
        rel="noreferrer"
      >
        公開のコードと引き継ぎ手順を開く ↗
      </a>
    </section>
  );
}
