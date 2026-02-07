// プロパティサービス
const properties = PropertiesService.getScriptProperties();

// 環境変数をスクリプトプロパティから取得
const DATABASE_ID = properties.getProperty('DATABASE_ID');
const NOTION_TOKEN = properties.getProperty('NOTION_TOKEN');
const SLACK_APP_TOKEN = properties.getProperty('SLACK_APP_TOKEN');

/**
 * SlackからのWebhookリクエストを受け取るエントリーポイント
 * @param {GoogleAppsScript.Events.DoPost} e - POSTリクエストイベント
 * @returns {GoogleAppsScript.Content.TextOutput} レスポンス
 */
// biome-ignore lint/correctness/noUnusedVariables: GAS entry point
function doPost(
  e: GoogleAppsScript.Events.DoPost,
): GoogleAppsScript.Content.TextOutput {
  // biome-ignore lint/suspicious/noExplicitAny: GAS type definition is incomplete
  const json = JSON.parse((e.postData as any).getDataAsString());

  // URL検証用（Slack App設定時の必須レスポンス）
  if (json.type === 'url_verification') {
    return ContentService.createTextOutput(json.challenge);
  }

  const event = json.event;
  if (!event) return ContentService.createTextOutput('OK');

  // 重複実行を防ぐ（同じイベントIDなら処理しない）
  const eventId = json.event_id;
  if (properties.getProperty('LAST_EVENT_ID') === eventId) {
    return ContentService.createTextOutput('OK');
  }
  properties.setProperty('LAST_EVENT_ID', eventId);

  // リアクションが 'memo' の場合のみ処理開始
  if (event.type === 'reaction_added' && event.reaction === 'memo') {
    // メインの司令塔を呼び出す
    processTask(event.item.channel, event.item.ts);
  }

  return ContentService.createTextOutput('OK');
}

/**
 * Slackメッセージを取得し、Notionに保存後、完了リアクションを付ける
 * @param {string} channel - SlackチャンネルID
 * @param {string} ts - メッセージのタイムスタンプ
 * @returns {void}
 */
function processTask(channel: string, ts: string): void {
  // ▼ Slackメッセージ取得用のURL（修正済み）
  const url =
    'https://slack.com/api/conversations.replies?channel=' +
    channel +
    '&ts=' +
    ts +
    '&limit=1&inclusive=true';

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'get',
    headers: { Authorization: 'Bearer ' + SLACK_APP_TOKEN },
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());

    if (data.ok && data.messages.length > 0) {
      const text = data.messages[0].text;

      // ▼ Slackメッセージへの直リンクを生成（修正済み）
      // ※チーム固有のURLが必要な場合は https://slack.com/archives/ を https://[your-team].slack.com/archives/ に変更してください
      const link =
        'https://slack.com/archives/' + channel + '/p' + ts.replace('.', '');

      // ★ここでNotionへ保存する関数を呼び出す
      const isSuccess = addTaskToNotion(text, link);

      // ★保存に成功したら、Slackに完了スタンプ(✅)を押す
      if (isSuccess) {
        addSlackReaction(channel, ts, 'white_check_mark');
      }
    }
    // biome-ignore lint/suspicious/noExplicitAny: error type is unknown
  } catch (e: any) {
    console.error('エラーが発生しました: ' + e.toString());
  }
}

/**
 * NotionデータベースにタスクをPOSTで新規作成する
 * @param {string} text - タスクのタイトル（メッセージテキスト）
 * @param {string} link - Slackメッセージへの直リンクURL
 * @returns {boolean} 保存成功時はtrue、失敗時はfalse
 */
function addTaskToNotion(text: string, link: string): boolean {
  // ▼ Notion APIのエンドポイント（修正済み）
  const post_url = 'https://api.notion.com/v1/pages';

  const json = {
    parent: { database_id: DATABASE_ID },
    properties: {
      名前: { title: [{ text: { content: text } }] },
      期日: { date: { start: new Date().toISOString().split('T')[0] } },
      URL: { url: link },
    },
  };

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + NOTION_TOKEN,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    payload: JSON.stringify(json),
    muteHttpExceptions: true,
  };

  const res = UrlFetchApp.fetch(post_url, options);

  // 成功(200 OK)ならtrueを返す
  const responseCode = res.getResponseCode();
  if (responseCode === 200) {
    return true;
  } else {
    console.error('Notion保存エラー: ' + res.getContentText());
    return false;
  }
}

/**
 * Slackメッセージにリアクション（絵文字）を追加する
 * @param {string} channel - SlackチャンネルID
 * @param {string} ts - メッセージのタイムスタンプ
 * @param {string} reactionName - リアクション名（例: "white_check_mark"）
 * @returns {void}
 */
function addSlackReaction(
  channel: string,
  ts: string,
  reactionName: string,
): void {
  // ▼ Slackリアクション追加用のURL（修正済み）
  const url = 'https://slack.com/api/reactions.add';

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    headers: { Authorization: 'Bearer ' + SLACK_APP_TOKEN }, // ここもHeader認証に統一しました
    payload: {
      channel: channel,
      timestamp: ts,
      name: reactionName,
    },
  };

  UrlFetchApp.fetch(url, options);
}
