/*
  モルックリケット レビュー送信バックエンド (Google Apps Script)

  使い方:
  1. Googleスプレッドシートを新規作成する(シート名はどれでもよい)
  2. 上部メニュー「拡張機能」→「Apps Script」を開く
  3. デフォルトで開かれるコードを全部削除し、このファイルの内容を貼り付ける
  4. 上の「デプロイ」→「新しいデプロイ」→種類の選択で「ウェブアプリ」を選ぶ
  5. 「アクセスできるユーザー」を「全員」に設定して「デプロイ」
  6. 初回は権限の承認を求められるので、自分のGoogleアカウントで許可する
  7. 発行された「ウェブアプリのURL」をコピーし、js/app.js の
     REVIEW_ENDPOINT_URL にそのまま貼り替える
  8. スプレッドシートを変更/再デプロイした場合は、URLは変わらないことが多いが、
     コードを直接編集した場合は再度「デプロイを管理」→「編集」→「新バージョン」で
     再デプロイする必要がある
*/

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // シートが空ならヘッダー行を作る
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['受信日時', '評価', 'バグ報告', 'アプリの改善点', 'ルールの改善点', '感想・その他']);
  }

  const data = JSON.parse(e.postData.contents);

  sheet.appendRow([
    new Date(),
    data.rating || '',
    data.bug || '',
    data.appImprovement || '',
    data.ruleImprovement || '',
    data.comment || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}
