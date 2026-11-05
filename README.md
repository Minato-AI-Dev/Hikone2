# Hikone2 — 次の彦根・完全版（独立開発）

[Hikone1](https://github.com/Minato-AI-Dev/Hikone) の完全版開発ブランチを起点に、**独立したGitリポジトリ**として作成したアプリです。Hikone1の本番サイトやAPIを変更せずに開発します。

## 機能
- 残り時間・現在地・目的地に合う徒歩寄り道推薦
- AIによる自然文相談（API未設定時は限定的なローカル解釈）
- 観光地・店舗・映画ロケ地カタログ
- 「いってらっしゃい／おかえりなさい」と端末内訪問履歴
- 任意操作のGoogle Places営業時間確認（未検証は不明として表示）
- 任意同意の匿名調査

## 開発

Node.js 24を使用します。

```sh
npm ci
npm test
npm run typecheck:api
npm run build
npm run dev
```

## Hikone1からの技術的な独立
- GitHubリポジトリ：`Minato-AI-Dev/Hikone2`
- Vercelプロジェクト：`hikone2`（Hikone1の `hikone-routes` とは別）
- Vercelは**画面とAPIを同一プロジェクトのルート（/）で提供**。フロントは自分自身の `/api/*` を呼び、Hikone1のAPI URLを使用しません。
- `HIKONE_ALLOWED_ORIGIN` 未設定時、APIのOrigin確認はVercelが提供する自プロジェクトのデプロイホスト名に限定します。
- Redisの保存キーは `hikone2:` に分離。ブラウザ内の保存キーも `hikone2-` 接頭辞を使用。
- Google Cloud・OpenAI・Redisの認証情報は自動コピーせず、独立した環境で用意します。未設定の有料APIは安全側に失敗します。
- GitHub Pagesは手動公開のまま。手動公開時のみ `/Hikone2/` のパスを使います。

## 正式公開前の制約
- Vercelのビルド・API存在確認と、Google API/Redisを用いた実動作は**別の検証**です。認証情報が未設定なら経路API・クラウドAIは使えません。
- 店舗のGoogle Place ID、営業時間、入口、体験の滞在時間や予約条件は未確認の部分があり、現地検証が必要です。
- 端末に残る訪問履歴は自己申告。現在配布済みQRのHikone1とは別のブラウザ保存領域です。
- これは完全版の開発用リポジトリです。正式な観光案内として完成したことを意味しません。

[未完了項目と受入基準](docs/full-version-roadmap.md)
