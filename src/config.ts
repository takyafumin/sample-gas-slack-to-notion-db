/**
 * プロジェクト設定と環境変数を管理するクラス
 */
class Config {
    private static properties = PropertiesService.getScriptProperties();

    static get DATABASE_ID(): string {
        return this.getRequiredProperty('DATABASE_ID');
    }

    static get NOTION_TOKEN(): string {
        return this.getRequiredProperty('NOTION_TOKEN');
    }

    static get SLACK_APP_TOKEN(): string {
        return this.getRequiredProperty('SLACK_APP_TOKEN');
    }

    static get LAST_EVENT_ID(): string {
        return this.properties.getProperty('LAST_EVENT_ID') || '';
    }

    static setLAST_EVENT_ID(id: string): void {
        this.properties.setProperty('LAST_EVENT_ID', id);
    }

    static get NOTION_PROP_NAME(): string {
        return '名前';
    }

    static get NOTION_PROP_DATE(): string {
        return '期日';
    }

    static get NOTION_PROP_URL(): string {
        return 'URL';
    }

    static get TARGET_REACTION(): string {
        return 'memo';
    }

    static get SUCCESS_REACTION(): string {
        return 'white_check_mark';
    }

    private static getRequiredProperty(key: string): string {
        const value = this.properties.getProperty(key);
        if (!value) {
            throw new Error(`環境変数 ${key} が設定されていません。`);
        }
        return value;
    }
}
