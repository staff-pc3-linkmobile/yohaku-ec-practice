# 余白ストアの引き継ぎ

## 利用者の希望
- 初学者。コードを書く量より意味の理解を優先。専門用語はお店に例えて説明する。
- 同じ本人が複数のPCから学習する。公開範囲を広げたり、他人を招待したりしない。
- 実決済・実発送・カード情報登録は不要。
- GitHubリポジトリは必ずprivateを維持する。

## 公開先・ソース
- `.openai/hosting.json` の project_id を維持する。既存のSitesを新規作成しない。
- 本番URL: https://yohaku-ec-practice.link-mobile-1012.chatgpt.site
- GitHub: https://github.com/staff-pc3-linkmobile/yohaku-ec-practice (private)
- Sites公式ソースとGitHubの両方を確認し、最新の変更を保持してから編集する。
- 既存Sitesを開くときはSitesスキルの get_site / credential / source helper を使う。
- GitHub編集だけでは自動デプロイしない。リリース時はSitesの既存所有者限定アクセスを確認し、公式workflowとprivate操作で公開する。
- 完了した同じソースコミットをGitHubにもpushする。履歴をforce pushしない。競合時は両側の変更を保持して解決する。
- 認証情報はメモリと標準入力だけで扱い、ファイル・リポジトリ・コマンド引数に保存しない。

## 実装と検証
- Node.js >=22.13。Vinext + React + Cloudflare D1。`sites()` 統合を保持する。
- 本番はSitesによる所有者限定アクセス。APIでは `getChatGPTUser()` を確認し、注文・練習設定を本人に限定する。
- `practice_settings` は本人ごとの実際の送料判定条件。normalが初期状態。shipping-boundaryで「>」のバグを再現する。
- 数量・価格はサーバー側で検証する。金額はDBから計算し、注文の再送キーとD1トランザクションを維持する。
- Drizzleの既存migrationは改変しない。スキーマ変更は新しいmigrationを生成する。seedはmigration外で行う。
- データベースのテーブルをリクエスト処理中に作成しない。
- 意図的なバグは明示的に指定された練習だけで有効化し、正常に戻せる操作を残す。
- 検証: `tsc --noEmit`、`node scripts/check-commerce.mjs`、`node scripts/check-practice.mjs`（ローカル5173起動・DB準備済みが必要）。いずれも練習注文を作る。
- コードを変えたら本番用buildを実行してprivate公開する。公開時はローカルDB・認証情報・node_modulesを含めない。
- 2台からの練習設定は同じサーバーに保存される。別PCで変更後はページを再読み込みする。カートはブラウザー内だけ。

## Windowsの公式パッケージ処理
- NodeとGit Bashはインストール済みの適切な実行ファイルをPATHに置く。このPC固有のパスを別PCで流用しない。
- GNU tarがWindowsドライブのコロンをリモート接続と解釈した場合、パッケージ処理の環境変数 `TAR_OPTIONS=--force-local` を使う。
- GitHub CLIのkeyringをsandboxから読めない場合は、再認証の前に対応するapprovalフローでretryする。
- このPCの `windows.sandbox = unelevated` を変更しない。
