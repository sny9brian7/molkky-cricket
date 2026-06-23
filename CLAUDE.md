# モルックリケット (Mölkky Cricket)

モルック × ダーツクリケットを融合させたオリジナルルールの多人数対戦スコアラーアプリ。

## 技術構成

- 素のHTML/CSS/JS（フレームワーク無し）。将来的にPWA→ネイティブ化（Capacitor等）を想定。
- `index.html` … 画面構造（トップメニュー/セットアップ/ゲーム/ルール解説/テーマ設定の5画面をdata属性ではなくidの表示切替で管理）
- `css/style.css` … デザインシステム。PASTEL/NEON × LIGHT/DARK の4テーマをCSS変数 + `data-theme`属性で切替
- `js/app.js` … ゲームロジック一式（得点計算・オープン/クローズ判定・連続ミス失格・ハンディキャップ・UNDO等）
- `manifest.webmanifest` / `sw.js` … PWA化のための最小構成（オフラインキャッシュ）

## ルール・ロジックを変更する際の注意

- `js/app.js` 内のスコア計算・オープン/クローズ判定（`isOpen`, `isClosedGlobally`, `processSingle`, `processMulti`等）は
  ゲームルールそのものなので、ロジックを変える際はルール仕様の変更だと自覚して触ること。
  UI/デザインだけを変えたい場合はCSSとHTMLの構造側で完結させる。
- `icons/icon-192.png` / `icons/icon-512.png` は `scripts/gen-icons.js`(Node標準の`zlib`だけでPNGを直接エンコード、外部依存なし)で生成したターゲット柄のプレースホルダー。デザインを変えたい場合は同スクリプトの`drawIcon()`を編集して再実行(`node scripts/gen-icons.js`)すれば再生成できる。
- 効果音(mark/multi/open/close/miss)は `音声/` フォルダ内のmp3ファイルを使用する。フォルダ名やファイル名を変更・移動した場合は、`js/app.js` 先頭付近の `SOUND_DIR` / `SOUND_FILES` の2箇所だけ書き換えれば追従する(他の処理は変更不要)。

## 動作確認方法

ブラウザで `index.html` を直接開くか、ローカルサーバー（VSCodeのLive Server等）で配信して確認する。
