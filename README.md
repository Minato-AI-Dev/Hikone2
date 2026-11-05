# Hikone2 — 次の彦根・完全版（独立開発）

元の [Hikone](https://github.com/Minato-AI-Dev/Hikone) の `feat/hikone-full-version` ブランチをもとに作成した、独立した新しいGitリポジトリです。元のHikoneは変更しません。

## 現在の機能
- 残り時間・現在地・目的地・興味に基づく徒歩寄り道推薦
- AIに自然文で相談（クラウド未接続時は限定的なローカル解釈）
- 観光スポット・店舗・映画ロケ地のカタログ
- 「いってらっしゃい／おかえりなさい」と端末内訪問履歴
- Google Placesの店舗営業状況確認（要設定、未確認は「営業未確認」）
- 任意参加の匿名利用集計

## 開発
Node.js 24 系で `npm ci` 、`npm test`、`npm run typecheck:api`、`npm run build`、`npm run dev` を使用。

## 独立運用の注意
- GitHub Pagesの公開ワークフローは初期状態では手動実行のみ。新しいAPI環境を検証するまで公開しません。
- Pagesベースパスは `/Hikone2/`。独立Vercelプロジェクト・APIキー・環境変数は別途設定します。
- `.env.example` は設定項目のみ。秘密情報・旧リポジトリのデプロイ設定は引き継ぎません。
- 店舗のPlace ID・営業時間・体験条件、徒歩入口と所要時間は未検証のため、正式観光案内として使う前に現地確認が必要です。
- この段階は「完全版開発用の土台」です。正式リリースではありません。

詳細：[完全版の開発ロードマップ](docs/full-version-roadmap.md)。
