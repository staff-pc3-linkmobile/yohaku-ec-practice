"use client";
import { useState } from "react";
import type { PracticeMode } from "../lib/commerce";
export default function Training({
  mode,
  onChange,
}: {
  mode: PracticeMode;
  onChange: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [condition, setCondition] = useState(">=");
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
        ログインせずに練習できます。在庫・設定・注文履歴は利用者ごとに分かれます。ゲストの続きはこのブラウザーで保存され、Cookieを消すと引き継げません。
      </p>
      <a
        className="text-button full"
        href="/signin-with-chatgpt?return_to=%2F"
        target="_top"
      >
        ChatGPTでログインして別PCと共有
      </a>
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
        変更するのは自分の練習だけです。過去の注文金額は書き換えません。別PCと共有したい場合は練習前にChatGPTでログインしてください。ゲストの記録はログイン後には移りません。
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
