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
- `icons/icon-192.png` / `icons/icon-512.png` は2段階のスクリプトで生成している(どちらもSS=3倍の解像度で描いてから縮小するスーパーサンプリングで、輪郭のジャギーを抑えている)。
  1. `node scripts/gen-icons.js` — ホーム画面の6色を使った同心円+ぼかしの土台(`icon-*-base-ss.png`、3倍解像度)をNode標準の`zlib`だけで直接エンコード(外部依存なし)
  2. `scripts/gen-icons-add-text.ps1` をPowerShellでドットソース実行(`. scripts/gen-icons-add-text.ps1`、`&`呼び出しではなく`.`を使うこと) — 3倍解像度のまま「モルクリ！」の文字(Noto Sans JP Black、アプリ本体の見出しと同じフォント)をSystem.Drawingで合成し、最後にHighQualityBicubicで最終サイズへ縮小して`icon-192.png`/`icon-512.png`を書き出す
  デザインを変える場合は`gen-icons.js`の`drawIcon()`(色・ぼかし)と`gen-icons-add-text.ps1`(文字・フォント・配置)をそれぞれ編集して、この順で再実行する。中間ファイルの`icon-*-base-ss.png`はコミット不要(再生成可能)。
  注意: `.ps1`ファイル内に日本語コメントを書くと、この環境ではファイル実行時に後続行の解析が壊れる現象を確認しているため、コメントはASCIIのみにすること(文字列自体はUnicodeコードポイントから組み立てれば問題ない)。
- 効果音(mark/multi/open/close/miss)は `音声/` フォルダ内のmp3ファイルを使用する。フォルダ名やファイル名を変更・移動した場合は、`js/app.js` 先頭付近の `SOUND_DIR` / `SOUND_FILES` の2箇所だけ書き換えれば追従する(他の処理は変更不要)。

## 動作確認方法

ブラウザで `index.html` を直接開くか、ローカルサーバー（VSCodeのLive Server等）で配信して確認する。
