# 余白ストア — 自分専用のEC運用練習

商品6点、商品詳細、カート、デモ注文、注文履歴、在庫補充を備えた小さなECです。
実際の決済・請求・発送はありません。住所とカード情報は集めません。
Sitesの所有者限定公開を使います。公開範囲を変更しないでください。

## 別のPCから使う（ブラウザーだけでOK）

ストア：https://yohaku-ec-practice.link-mobile-1012.chatgpt.site

1. URLを開き、作成に使ったものと同じChatGPTアカウントでログインします。
2. ページ最下部の「学習・運用」を開きます。
3. 「送料のバグを起こす」→ マグ1個＋トート1個で5,000円にします。
4. 送料500円という症状を確認し、「原因とコードを見る」を読みます。
5. 送料無料の条件を「小計 >= 5,000（以上）」にして「この条件で修正を保存」を押します。
6. カートを開き直し、送料0円を確認します。

これはサーバーが実際に使う判定条件の変更です。説明だけのシミュレーションではありません。
設定・在庫・注文履歴はサーバーに保存されるので、別PCでも続きから練習できます。
ほかのPCでは再読み込みしてください。カートの中身はPC・ブラウザーごとです。
過去の注文金額は、後から条件を修正しても変わりません。
この送料練習には、新しいコードを書くことも開発環境のインストールも不要です。

コード：https://github.com/staff-pc3-linkmobile/yohaku-ec-practice （private）

同じGitHubアカウントでログインすると、コードと教材を閲覧できます。
ファイルを開いてGitHubの編集ボタンを使えば、ブラウザーからコードを編集・保存できます。
GitHubへの保存は「設計図の更新」、ストアへのリリースは「お店の更新」で、別の作業です。
GitHubを編集しただけでは、本番ストアは自動で更新されません。

## 別PCでコード全体の変更・リリースを続ける場合

開発ツールでこのprivateリポジトリを取得し、最初に `AGENTS.md` を読みます。
コードと公開先IDを保存してあるので、このPCのフォルダーは不要です。
開発ツールへの引き継ぎには次の依頼文を使えます。

> このprivateリポジトリの余白ストアを続けてください。最初にAGENTS.mdとREADME.mdを読み、GitHubとSitesの最新ソースを確認してください。.openai/hosting.jsonの既存project_idを維持し、サイトを新規作成せず、所有者限定でリリースしてください。学習はコードを書く量より意味の理解を優先し、専門用語はお店に例えて説明してください。変更後はGitHubにも同じソースを保存し、非公開を維持してください。

複数PCでコードを変更するときは、先に最新の変更を取得します。履歴を強制的に上書きしないでください。

## 今日のタスク（15〜20分）

1. マグを1個カートに入れ、小計1,800円・送料500円・合計2,300円を確認する。
2. 注文を確定する。マグの在庫が1個減ったことを確認する。
3. ページを開き直して「注文履歴」を見る。同じ注文が残る理由を自分の言葉で説明する。
4. マグ1個とトート1個を入れる。小計5,000円で送料が0円になることを確認する。
5. 「学習・運用」から在庫を補充する。注文履歴は消えないことを確認する。

分からない点は、このチャットで「タスク3の仕組みを例えで説明して」と聞いてください。
コードを自分で書く必要はありません。予想 → 操作 → 結果の確認 → 意味の理解、の順で進めます。

## 仕組みをお店に例えると

- ブラウザー：お店の売り場。商品を見て、買い物かごを持ちます。
- バックエンド：裏にいる店員。注文金額や在庫を確認して、帳簿に記録します。
- API：売り場から店員に渡す伝票の窓口。商品一覧・注文・履歴の依頼を運びます。
- データベース（D1）：お店の帳簿。画面を閉じても注文と在庫を覚えています。
- 認証：入口で本人を確認すること。公開先では所有者だけが入れます。
- トランザクション：注文記入と在庫引き落としを1組にする仕組み。片方が失敗したら両方取り消し、「在庫だけ減った」を防ぎます。
- 再送キー：伝票番号。同じ伝票が2回来ても同じ注文として扱います。
- リリース：準備したお店を、実際のサーバーで開ける状態にすること。
- ログ：店員の作業メモ。失敗時の確認番号から処理を追えます。

## 次の練習：1つずつバグを入れて直す

現在のv1.1は正常な判定を初期状態にし、送料のバグだけをブラウザーから有効化・修正できます。
それ以外のバグは、このチャットで指定した練習だけを別の変更として導入し、修正後に再公開します。
「不具合を出す → あなたが操作して発見 → 私が原因と該当コードを説明 → 修正を反映 → 同じ操作で確認」という進め方です。

|練習|症状|理解すること|修正できた目安|
|---|---|---|---|
|1. 送料の境目|5,000円ちょうどでも送料がつく|`>` と `>=` の違い。「以上」は同じ額を含む|4,999円・5,000円・5,001円で送料を確認|
|2. 在庫のずれ|注文後の画面に古い在庫が残る|売り場の表示と帳簿の値の違い、再読み込み|注文直後に正しい在庫が表示される|
|3. 二重注文|再送で注文が2件になる|通信が途切れても、店員側では処理済みの場合がある|同じ伝票番号なら履歴も在庫減少も1回|
|4. 保存失敗|注文ボタンを押すとエラーが出る|画面の症状・店員のログ・帳簿を順に見る|失敗時は在庫が減らず、修正後は保存される|

## コードの読み順

1. `lib/commerce.ts`：送料と数量のルール。いちばん短い入口です。
2. `app/api/orders/route.ts`：店員が注文を受け、金額を計算して保存する順番。
3. `db/schema.ts`：帳簿に記録する項目と、在庫をマイナスにしないルール。
4. `app/storefront.tsx`：売り場の操作と伝票の送信。

価格は画面からの申告を信じず、サーバーが帳簿から読み直します。
注文と在庫はD1のbatchでまとめて保存し、失敗すると全部取り消します。
注文履歴はログイン中のユーザーに限定します。公開先はSitesの所有者限定入口で守ります。
ローカル開発の疑似ログインは本番ビルドには含まれません。
在庫補充は商品の在庫だけを初期数に戻します。履歴は削除しません。

## 開発・確認

Node.js 22.13以上（このPCでは同梱Node 24を使用）。依存関係はインストール済みです。
`npm run dev` で http://127.0.0.1:5173 を起動し、
`/signin-with-chatgpt?return_to=/` でローカル練習用の本人確認を行います。
初回のDB準備はビルド後に下のstarter手順で行います。準備済みDBへSQLを再実行しないでください。
`node scripts/check-commerce.mjs` は起動中のローカルECだけに練習注文を作ります。
テスト後は在庫を補充し、注文履歴を残します。公開先のDBはローカルDBと別です。

公開はSitesの公式workflowでソース保存・ビルド・パッケージ化し、private操作で配信します。
認証情報、ローカルDB、node_modules、ビルド出力はソースリポジトリに保存しません。
以下は基盤の保守用説明です。

---

# vinext-starter

A clean full-stack starter running on [vinext](https://github.com/cloudflare/vinext), with optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`
- Portable: Windows, macOS, or Linux; no Bash required
- Managed Linux: managed Linux runtime with Bash, `flock`, `curl`, `sha256sum`, and GNU `timeout`
- Git is required only for publishing

## Sites Lifecycle

The Sites initializer copies the shared starter and selects managed-linux only when `SITES_MANAGED_LINUX_CONTAINER=1`; otherwise it selects portable. It saves the selection only in ignored `.sites-runtime/execution-profile.json`. Both profiles copy/configure first, then use the plugin's separate `install-dependencies.mjs` step to measure installation independently. Edit source under `app/` and follow the Sites skill for installation, preview, builds, and publishing.

Run `node <plugin-root>/scripts/configure-execution-profile.mjs` only when the profile is unknown for the current checkout and environment. Profile changes do not alter tracked source or require reinstalling otherwise-valid dependencies; restart an existing preview to use the new selection. Do not commit or upload `.sites-runtime/`.

This starter does not use `wrangler.jsonc`.

`install:ci` runs `npm ci` once against the shared lockfile, disables parent-workspace discovery, and includes required dev/optional dependencies despite production/omit settings. Sharp defaults to prebuilt binaries unless explicitly configured otherwise. Do not overlap installers.

- **Portable:** Preserve host HOME, npm cache, registry, proxy, temporary paths, retry/concurrency settings, and lifecycle-script policy. Use `--prefer-offline --no-audit --no-fund`.
- **Managed Linux:** Use the existing project-local HOME/cache/tmp setup and Linux install lock, tarball preflight, and timeout. Restore the image-seeded npm cache only when its lockfile hash matches; retain network fallback. Builds keep their existing timeout. These helpers are not invoked by the portable profile.

`scripts/sites-env.mjs` preserves the caller's HOME, npm cache, proxy, XDG, and temporary-directory configuration while defaulting Wrangler and Miniflare state to the checkout. If npm reports an unwritable cache, select a writable path with `npm_config_cache` for that install. The `dev` and `start` scripts also keep Wrangler logs inside the checkout. Generated `.sites-runtime/` and `.wrangler/` directories are disposable and ignored by Git.

On portable, `npm run dev` uses `vinext dev` with HMR, starting at port 5173. Vinext records the running server in ignored `.vinext/` state, rejects an ordinary duplicate launch, and recovers stale state after a stopped process; exactly simultaneous starts can race. Pass `--port <port>` or `--hostname <host>` after `npm run dev --` when needed; keep portable previews on loopback.

For browser QA on managed Linux, use `sites-preview start`. The project's dev script runs Vite and accepts the supervisor's `--host 0.0.0.0 --port 4173 --strictPort` arguments. The internal browser uses `http://terminal.local:4173/`; it is not a user-facing URL. The supervisor owns the preview lifecycle. The ignored local profile survives the supervisor's cleared process environment.

The portable profile simulates ChatGPT sign-in only for loopback development requests. Visit `/signin-with-chatgpt?return_to=/` to sign in as `local_seedy` (`seedy@sites.test`, display name `Seedy`) and `/signout-with-chatgpt?return_to=/` to sign out. The development cookie preserves that identity across server restarts. Mock auth is disabled in the managed-linux profile and is not included in production builds; hosted authentication remains dispatch-owned.

The Worker uses `vinext/server/fetch-handler`, including Vinext's config-aware image handling. After building, `npm start` runs that Worker locally through Wrangler on `127.0.0.1`, sharing `.wrangler/state` with dev preview and local D1 migrations; it does not deploy the site or simulate sign-in. Use the URL printed by the server. Pass `npm start -- --port <port>` to select a different built-preview port.

Local previews use Miniflare's placeholder `Request.cf` metadata without a network lookup. Set `CLOUDFLARE_CF_FETCH_ENABLED=true` to opt into fetching preview metadata; this setting does not change hosted request metadata.

Local tool usage metrics are disabled by default. Set `WRANGLER_SEND_METRICS=true` to opt in.

## Included Shape

- edit site code under `app/`
- `app/chatgpt-auth.ts` provides optional dispatch-owned ChatGPT sign-in helpers
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings
- `vite.config.ts` simulates declared bindings for local development
- `db/index.ts` reads the D1 binding from the Cloudflare Worker environment
- `db/schema.ts` starts intentionally empty
- `@cloudflare/workers-types` provides Worker types; `cloudflare-env.d.ts` declares optional `DB`/`BUCKET` bindings—update these declarations if binding names change
- `examples/d1/` contains an optional D1 example surface
- `drizzle.config.ts` supports local migration generation when needed

## Workspace Auth Headers

Signed-in visitors receive both `oai-authenticated-user-id` and `oai-authenticated-user-email`. Private Sites require every visitor to sign in; public Sites may also have anonymous visitors, for whom neither header is present.

The user ID is stable for the same user on the same Site and different across Sites. Use it as the durable user key; use email and name for display or contact purposes.

SIWC-authenticated workspace sites may also receive `oai-authenticated-user-full-name` when the user's SIWC profile has a non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is accompanied by `oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to email when it is absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the ready-to-use helpers from `app/chatgpt-auth.ts` when the site needs optional or required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use the returned `userId` as the stable user key for user-owned records; do not use email as a durable identifier.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send anonymous visitors through Sign in with ChatGPT.
- In a Server Component, start sign-in with `<a href={chatGPTSignInPath(returnTo)} target="_top">`. The auth helper module is server-only; do not import it into a Client Component.
- Do not use `fetch`, XHR, a client-side router, or a framework link that can prefetch the sign-in route. SIWC must start as a top-level navigation.
- Never request the AuthAPI authorization endpoint directly. The dispatch-owned `/signin-with-chatgpt` route must start the SIWC flow.
- Use `chatGPTSignOutPath(returnTo)` for browser sign-out links or actions.
- Pass a same-origin relative `returnTo` path for the destination after sign-in or sign-out. The helper validates and safely encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the OAuth cookies, and identity header injection. Do not implement app routes for those reserved paths. Routes that do not import and call the helper remain anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use the Sites hosting platform's access policy controls for workspace-wide restrictions, or enforce explicit server-side membership or allowlist checks.

Use SIWC for account pages, user-specific dashboards, saved records, and write actions tied to the current ChatGPT user. Leave public content anonymous.

## Local D1 migrations

For a D1-backed local preview, generate SQL with `npm run db:generate`. Build once through the Sites skill's build entrypoint (or `npm run build` for standalone use) to generate `dist/server/wrangler.json`, rebuilding if bindings change. From the project root, apply each pending migration in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_example.sql
```

Replace the filename with the pending migration and `DB` with your D1 binding name if different. Use `.wrangler/state`, not `.wrangler/state/v3`; Wrangler adds the versioned directories. Do not replay migrations already applied locally. This updates only the preview database; publishing applies production migrations separately.

## Diagnostic Commands

- `npm run install:ci`: perform the one locked dependency install
- `npm run dev`: start the Vite/Vinext development server
- `npm run build`: build the deployable Sites artifact
- `npm run start`: preview the built Worker locally with D1/R2 support
- `npm run db:generate`: generate Drizzle migrations after schema changes

When using the Sites plugin, follow its skill instructions for installation, builds, and publishing. These npm commands remain available for standalone use.

The portable build runs Vinext directly without a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
