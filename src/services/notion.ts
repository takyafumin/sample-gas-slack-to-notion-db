/**
 * Notion API 操作を担当するサービス
 */
class NotionService {
    /**
     * Notion データベースに新しいページ（タスク）を追加する
     */
    static addTask(text: string, link: string): boolean {
        const url = 'https://api.notion.com/v1/pages';
        const properties: { [key: string]: any } = {};

        // Configからプロパティ名を取得し、動的に構築
        properties[Config.NOTION_PROP_NAME] = { title: [{ text: { content: text } }] };
        properties[Config.NOTION_PROP_DATE] = {
            date: { start: new Date().toISOString().split('T')[0] },
        };
        properties[Config.NOTION_PROP_URL] = { url: link };

        const payload = {
            parent: { database_id: Config.DATABASE_ID },
            properties,
        };

        const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
            method: 'post',
            headers: {
                Authorization: `Bearer ${Config.NOTION_TOKEN}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
            },
            payload: JSON.stringify(payload),
            muteHttpExceptions: true,
        };

        const response = UrlFetchApp.fetch(url, options);
        const responseCode = response.getResponseCode();

        if (responseCode !== 200) {
            console.error(`Notion保存エラー [${responseCode}]: ${response.getContentText()}`);
            return false;
        }

        return true;
    }
}
