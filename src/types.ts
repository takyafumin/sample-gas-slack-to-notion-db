/**
 * Slack Webhook イベントの型定義
 */
interface SlackWebhookEvent {
    type: string;
    challenge?: string;
    event_id?: string;
    event?: {
        type: string;
        reaction?: string;
        item?: {
            channel: string;
            ts: string;
        };
    };
}

/**
 * Slack API レスポンスの型定義
 */
interface SlackRepliesResponse {
    ok: boolean;
    messages: Array<{
        text: string;
        ts: string;
    }>;
    error?: string;
}

/**
 * Notion API の成功レスポンス（簡易版）
 */
interface NotionPageResponse {
    id: string;
    object: string;
}
