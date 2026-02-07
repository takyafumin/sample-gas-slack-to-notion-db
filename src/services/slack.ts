/**
 * Slack API 操作を担当するサービス
 */
class SlackService {
    /**
     * 指定されたメッセージの詳細（スレッド返信を含む）を取得する
     */
    static getMessageDetails(channel: string, ts: string): SlackRepliesResponse {
        const url = `https://slack.com/api/conversations.replies?channel=${channel}&ts=${ts}&limit=1&inclusive=true`;
        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'get',
            headers: { Authorization: `Bearer ${Config.SLACK_APP_TOKEN}` },
        };

        const response = UrlFetchApp.fetch(url, options);
        return JSON.parse(response.getContentText());
    }

    /**
     * メッセージにリアクションを追加する
     */
    static addReaction(
        channel: string,
        ts: string,
        reactionName: string,
    ): GoogleAppsScript.URL_Fetch.HTTPResponse {
        const url = 'https://slack.com/api/reactions.add';
        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'post',
            headers: { Authorization: `Bearer ${Config.SLACK_APP_TOKEN}` },
            payload: {
                channel,
                timestamp: ts,
                name: reactionName,
            },
            muteHttpExceptions: true,
        };

        return UrlFetchApp.fetch(url, options);
    }

    /**
     * チーム固有のアーカイブURLではなく、汎用的なリンクを生成する
     */
    static getMessageLink(channel: string, ts: string): string {
        return `https://slack.com/archives/${channel}/p${ts.replace('.', '')}`;
    }
}
