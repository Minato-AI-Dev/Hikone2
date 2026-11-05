# Hikone2 外部サービス設定・実機検証手順

更新日：2026-11-06

## 現状

- Hikone2のGitHubリポジトリとVercelプロジェクトはHikone1から独立。
- [https://hikone2.vercel.app/](https://hikone2.vercel.app/) はVercel上で稼働。画面もAPIもHikone2のVercelで提供。
- `HIKONE_ALLOWED_ORIGIN=https://hikone2.vercel.app` は専用Vercelに設定済み。
- Google/OpenAI/Redisの秘密情報は未設定。料金が発生しうるAPIは停止（fail closed）。Hikone1の秘密情報はコピーしない。
- 集計・レート制限のRedisキーは `hikone2:`、ローカルストレージも `hikone2-` に分離済み。
- GitHub Actionsのlive-smokeは、ページ取得、Hikone1 Origin拒否、経路・AIの未設定503、店舗unknownを実通信で確認。
- モバイル操作はGitHub Actions上のPlaywright Chromium/iPhoneサイズで確認する。これは物理iPhoneでの実機確認ではない。

## 1. 独立したGoogle Cloud

1. Google Cloud ConsoleでHikone2専用プロジェクトを作成し、課金と予算アラートを設定する。
2. Routes APIおよびPlaces API (New)を有効化する。
3. **サーバー用のAPIキー**を新規作成する。API制限をRoutes APIとPlaces API (New)に限定し、運用するクォータを抑制する。Vercel Functionsは固定送信元IPではない場合があり、固定IPを仮定したIP制限は無闇に設定しない。Google Cloudの制限方法はデプロイ環境に適合させて検討する。
4. `hikone2` のVercel Environment Variablesに `GOOGLE_MAPS_API_KEY` を**Sensitive**・サーバー専用で登録。値を `VITE_` 接頭辞の変数に入れない。
5. 店舗名と住所を個別に照合したGoogle Place IDのみ `HIKONE_SHOP_PLACE_IDS_JSON` にJSONで登録。照合できない店舗は未登録のままにする。
6. 既存Hikone1のGoogle APIキー、Google Cloud課金プロジェクト、クォータを共用しない。

## 2. 独立したRedisとレート制限

1. Upstash等でHikone2**専用のRedisデータベース**を作成する。VercelのUpstash Marketplace連携はアカウントに存在するが、Hikone2へ新DBが接続されたことは未確認。
2. Vercelに `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` を**Sensitive**で登録。もしくはMarketplaceの `KV_REST_API_URL` / `KV_REST_API_TOKEN` を利用。両方式を混在させない。
3. `HIKONE_RATE_LIMIT_SALT` に**32文字以上のランダム値**をSensitiveで登録。Hikone1とは異なる値にする。
4. 予算に合わせて `HIKONE_ROUTES_DAILY_BUDGET`、`HIKONE_ROUTES_MINUTE_BUDGET` とGoogle CloudのAPIクォータを調整。サーバーのレート制限だけで課金上限を保証できない。
5. Redis接続情報は画面へ返さない。Vercelの環境変数だけで管理し、GitHubソースに直接記載しない。

**重要：** Redisを作らずGoogle APIキーだけ登録しても、有料経路APIは共有レート制限の不在により503となる設計。Googleへのリクエスト前に停止する。

## 3. AI API（必要な場合のみ）

1. Hikone2用にAPI利用量を区別できるOpenAIのプロジェクト・APIキーを用意する。
2. Vercelの `OPENAI_API_KEY` と `OPENAI_MODEL` をサーバー専用で設定。コスト上限と有効モデルの確認が必要。
3. Redisの共通レート制限がないとAI APIは503で停止する。
4. 自然文相談UIはAI未設定時も限定的なローカル解析で利用できる。ユーザーには個人情報を入力しないよう案内している。

## 4. フロントとCORS

Vercelの画面は同一ホストの `/api/walking-routes`、`/api/hikone-ai`、`/api/shop-hours`、`/api/analytics-collect` に送信する。したがってVercelに `VITE_*_ENDPOINT` を設定する必要はない。

`HIKONE_ALLOWED_ORIGIN` はHikone2のドメインに限定。Hikone1のドメインを許可しない。独自ドメインを設定する場合は、承認済みドメインを検証して明示する。

## 5. ブラウザ・実機の確認

自動化は `.github/workflows/mobile-smoke.yml` と `.github/workflows/live-smoke.yml` を参照。

物理端末ではiOS SafariとAndroid Chromeを各1台以上使用し、URL `https://hikone2.vercel.app/` を直接開いて以下を確認する。

- [ ] 初回の調査同意を「協力しない」で進められる
- [ ] 「寄り道を探す」で6つの質問を進められる
- [ ] AIと場所検索に行き、検索からホームへ戻れる
- [ ] 店舗の「営業状況未確認」を誤認せず、参照元リンクが開く
- [ ] Google API未設定時に経路推薦を無理に作らず、安全な説明が出る
- [ ] 外部API接続後に正常な経路が出ても、帰着時間の注意を表示する
- [ ] 「いってらっしゃい」「おかえりなさい」で本人申告の履歴が端末に残る
- [ ] タブ終了後に履歴が再表示される。プライベートモードでは保存されない場合があることを理解できる
- [ ] 屋外の低速通信・画面回転・文字拡大・位置情報拒否で画面が破綻しない
- [ ] Hikone1の既存QRコードのURLと画面に変更がない

## 判定

外部サービスの作成と機密情報の投入、物理端末操作は**この文書の作成だけでは完了しない**。動作済みと表現するのは実際に対応するテストの成功を確認した場合のみ。
