/**
 * SlackからのWebhookリクエストを受け取るエントリーポイント
 */
// biome-ignore lint/correctness/noUnusedVariables: GAS entry point
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  try {
    const payload: SlackWebhookEvent = JSON.parse(e.postData.contents);

    // URL検証用（Slack App設定時の必須レスポンス）
    if (payload.type === 'url_verification') {
      return ContentService.createTextOutput(payload.challenge || '');
    }

    const event = payload.event;
    if (!event) return ContentService.createTextOutput('OK');

    // 重複実行を防ぐ
    if (Config.LAST_EVENT_ID === payload.event_id) {
      return ContentService.createTextOutput('OK');
    }
    if (payload.event_id) {
      Config.setLAST_EVENT_ID(payload.event_id);
    }

    // 特定のリアクションが付与された場合のみ処理
    const isTargetReaction = event.type === 'reaction_added' && event.reaction === Config.TARGET_REACTION;
    if (!isTargetReaction) {
      return ContentService.createTextOutput('OK');
    }

    if (event.item) {
      processTask(event.item.channel, event.item.ts);
    }

    return ContentService.createTextOutput('OK');
  } catch (error: any) {
    console.error('Webhook処理中にエラーが発生しました:', error.toString());
    return ContentService.createTextOutput('Internal Server Error').setMimeType(
      ContentService.MimeType.TEXT,
    );
  }
}

/**
 * タスク処理のメインロジック
 */
function processTask(channel: string, ts: string): void {
  try {
    // 1. メッセージ詳細を取得
    const data = SlackService.getMessageDetails(channel, ts);

    if (!data.ok || data.messages.length === 0) {
      console.warn('Slackメッセージの取得に失敗しました:', data.error);
      return;
    }

    const message = data.messages[0];
    const link = SlackService.getMessageLink(channel, ts);

    // 2. Notionへタスクを追加
    const isSuccess = NotionService.addTask(message.text, link);
    if (!isSuccess) return;

    // 3. 成功時にリアクションを追加
    SlackService.addReaction(channel, ts, Config.SUCCESS_REACTION);
  } catch (error: any) {
    console.error('タスクの処理中にエラーが発生しました:', error.toString());
  }
}
