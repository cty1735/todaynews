![](./screenshots/local/desktop.png)

[English](./README.md) | [简体中文](README.zh-CN.md) | 日本語

> [!NOTE]
> NewsNext, the next gen of NewsNow, is coming soon, join the [waitlist](https://tally.so/r/yPBBYg).

***リアルタイムで最新のニュースをエレガントに読む***

## 機能

- 浅いグリーンの「編集部ワークベンチ」レイアウト：左にカテゴリ/ソース索引、右にニュースカード
- ローカル Node サーバーが各プラットフォームを直接取得（サンプルデータなし、上流の集約 API 非依存）
- コラム/カードを個別に更新、表示中のページは 2 分ごとに新着を確認
- ソース検索・フォロー/解除・ドラッグ並べ替え（現在のブラウザに保存）
- `.data/` に SQLite キャッシュを自動保存、ローカルではログイン不要
- 取得間隔はソースの更新頻度に応じて自動調整（最短 2 分）
- モバイルは上部タブ、横スワイプのカード、縦スクロール

## デプロイ

### 基本デプロイ
ログインとキャッシュ機能なしでデプロイする場合：
1. このリポジトリをフォーク
2. Cloudflare PagesやVercelなどのプラットフォームにインポート

### Cloudflare Pages設定
- ビルドコマンド：`pnpm run build`
- 出力ディレクトリ：`dist/output/public`

### GitHub OAuth設定
1. [GitHub Appを作成](https://github.com/settings/applications/new)
2. 特別な権限は不要
3. コールバックURLを設定：`https://your-domain.com/api/oauth/github`（your-domainを実際のドメインに置き換え）
4. Client IDとClient Secretを取得

### 環境変数
`example.env.server`を参照。ローカル開発では、`.env.server`にリネームして以下を設定：

```env
# GitHub Client ID
G_CLIENT_ID=
# GitHub Client Secret
G_CLIENT_SECRET=
# JWT Secret（通常はClient Secretと同じ）
JWT_SECRET=
# データベース初期化（初回実行時はtrueに設定）
INIT_TABLE=true
# キャッシュを有効にするかどうか
ENABLE_CACHE=true
```

### データベースサポート
対応データベースコネクタ： https://db0.unjs.io/connectors Cloudflare D1 Database を推奨。

1. Cloudflare WorkerダッシュボードでD1データベースを作成
2. `wrangler.toml` に `database_id` と `database_name` を設定
3. `wrangler.toml` が存在しない場合、 `example.wrangler.toml` をリネームして設定を変更
4. 次回デプロイ時に変更が反映

### Dockerデプロイ
プロジェクトルートディレクトリで：

```sh
docker compose up
 ```

環境変数は `docker-compose.yml` でも設定可能。

## 開発
> [!TIP]
> Node.js >= 20が必要

```sh
corepack enable
pnpm i
pnpm dev
 ```

### データソースの追加
`shared/sources` と `server/sources` ディレクトリを参照。プロジェクトは完全な型定義とクリーンなアーキテクチャを提供します。

## ロードマップ
- **多言語サポート**の追加（英語、中国語、その他言語を順次対応）
- **パーソナライズオプション**の改善（カテゴリ別ニュース、保存された設定）
- **データソース**の拡充による多言語対応のグローバルニュースカバレッジ

## コントリビューション
~~コントリビューションを歓迎します！機能リクエストやバグレポートのために、プルリクエストやイシューの作成をお気軽にどうぞ。~~

新バージョンは近日公開予定のため、現在のバージョンではコントリビューションの受付を終了します。

## ライセンス
[MIT](./LICENSE) © ourongxing
