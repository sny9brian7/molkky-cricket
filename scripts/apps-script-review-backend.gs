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

  コードを直接編集した場合(このファイルを更新した場合)は、
  「デプロイ」→「デプロイを管理」→ 編集(鉛筆アイコン) →
  バージョン「新バージョン」を選んで「デプロイ」し直す必要がある。
  ウェブアプリのURL自体は変わらないので、js/app.js側の修正は不要。

  ---- レビューの削除について ----
  レビューを「削除してほしい」と頼まれた場合でも、行を完全には消さない。
  「レビュー」シートから該当行を取り除き、「削除済み」シート(無ければ自動作成)に
  そのまま移動させる。これにより誤って消したレビューも後から復元できる。
  削除は doPost に { action: 'delete', id: '対象のID' } をPOSTすることで行う。
*/

const REVIEW_SHEET_NAME = 'レビュー';
const DELETED_SHEET_NAME = '削除済み';
const HEADER_ROW = ['ID', '受信日時', '評価', 'バグ報告', 'アプリの改善点', 'ルールの改善点', '感想・その他'];

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);

  if (data.action === 'delete') {
    return jsonResponse(moveReviewToDeleted(ss, data.id));
  }

  const sheet = getOrCreateReviewSheet(ss);
  const id = Utilities.getUuid();

  sheet.appendRow([
    id,
    new Date(),
    data.rating || '',
    data.bug || '',
    data.appImprovement || '',
    data.ruleImprovement || '',
    data.comment || ''
  ]);

  return jsonResponse({ result: 'ok', id: id });
}

function getOrCreateReviewSheet(ss) {
  let sheet = ss.getSheetByName(REVIEW_SHEET_NAME);
  if (!sheet) {
    // 初回デプロイ時に既に存在するデフォルトシート(例:「シート1」)があれば、
    // それをそのまま「レビュー」にリネームして使う(無駄なシートを増やさない)
    const sheets = ss.getSheets();
    sheet = (sheets.length === 1 && sheets[0].getLastRow() <= 1) ? sheets[0] : ss.insertSheet(REVIEW_SHEET_NAME);
    sheet.setName(REVIEW_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER_ROW);
  }
  return sheet;
}

function getOrCreateDeletedSheet(ss) {
  let sheet = ss.getSheetByName(DELETED_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(DELETED_SHEET_NAME);
    sheet.appendRow(HEADER_ROW.concat(['削除日時']));
  }
  return sheet;
}

function moveReviewToDeleted(ss, id) {
  if (!id) return { result: 'error', message: 'idが指定されていません' };

  const sheet = getOrCreateReviewSheet(ss);
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      const deletedSheet = getOrCreateDeletedSheet(ss);
      deletedSheet.appendRow(values[i].concat([new Date()]));
      sheet.deleteRow(i + 1);
      return { result: 'deleted', id: id };
    }
  }
  return { result: 'not_found', id: id };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
