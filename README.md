# Slack to Notion DB

Slackのメッセージに📝(memo)リアクションを付けると、自動的にNotionデータベースにタスクとして保存するGoogle Apps Scriptプロジェクトです。

## 機能概要

- Slackで📝(`:memo:`)リアクションを付けたメッセージをNotionに自動保存
- 保存成功時は✅(`:white_check_mark:`)リアクションで完了通知
- メッセージテキストとSlackへの直リンクを保存

## 必要な環境・ツール

- [Node.js](https://nodejs.org/) (v14以上推奨)
- [clasp](https://github.com/google/clasp) - Google Apps Script CLI
- Googleアカウント
- Slackワークスペース (管理者権限)
- Notionアカウント

## 開発環境セットアップ

### 1. プロジェクトのセットアップ

```bash
git clone <repository-url>
cd sample-gas-slack-to-notion-db
npm install
```

### 2. claspのセットアップ

```bash
npx clasp login
```

### 3. GASプロジェクトの作成（または既存プロジェクトの紐付け）

クローンした直後は `.clasp.json` がないため、以下のいずれかを行ってください。

#### A: 新規プロジェクト作成
```bash
npx clasp create --title "Slack to Notion DB" --type webapp
# 作成後、rootDirを "./dist" に設定してください
```

#### B: 既存プロジェクトを使用
```bash
npx clasp clone <scriptId>
# クローン後、rootDirを "./dist" に設定してください
```
※ `scriptId` は GASエディタ > プロジェクトの設定 > スクリプトID から確認できます。

### 4. 認証情報の設定（スクリプトプロパティ）

認証情報はセキュリティのため、コードには含めずGASのスクリプトプロパティに設定します。

#### 方法A: GASエディタから設定

1. `npm run open` でGASエディタを開く
2. **プロジェクトの設定** (歯車アイコン) をクリック
3. **スクリプト プロパティ** セクションで以下を追加：

| プロパティ | 値 |
|-----------|-----|
| `DATABASE_ID` | NotionデータベースID |
| `NOTION_TOKEN` | Notion Integration Token |
| `SLACK_APP_TOKEN` | Slack Bot User OAuth Token |

#### 方法B: claspから設定

GASエディタを開き、以下のコードをエディタで実行（一度だけ）：

```javascript
function setupProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    'DATABASE_ID': 'your-notion-database-id',
    'NOTION_TOKEN': 'your-notion-integration-token',
    'SLACK_APP_TOKEN': 'your-slack-bot-token'
  });
  console.log('プロパティを設定しました');
}
```

## 外部サービスの設定

### Slack App の設定

1. [Slack API](https://api.slack.com/apps)でAppを作成
2. **OAuth & Permissions** で以下のBot Token Scopesを追加:
   - `channels:history`
   - `reactions:read`
   - `reactions:write`
3. ワークスペースにインストールし、Bot User OAuth Tokenを取得
4. **Event Subscriptions** を有効化し、Request URLにデプロイ後のWebアプリURLを設定
5. Subscribe to bot events で `reaction_added` を追加

### Notion Integration の設定

1. [Notion Integrations](https://www.notion.so/my-integrations)でIntegrationを作成
2. Internal Integration Token を取得
3. 保存先のNotionデータベースにIntegrationを接続
4. データベースには以下のプロパティが必要：
   - `名前` (タイトル)
   - `期日` (日付)
   - `URL` (URL)

## デプロイ

以下のコマンドで、TypeScriptのビルドとGASへのプッシュ、デプロイメントの作成を自動で行います。

### 通常のデプロイ (Pushのみ)

```bash
npm run deploy
```
※このコマンドは `npm run build` (tsc compile) と `clasp push` を実行します。

### Webアプリとして公開

```bash
npx clasp deploy --description "バージョンの説明"
```

または、GASエディタから:

1. `npm run open` でGASエディタを開く
2. **デプロイ** > **新しいデプロイ** を選択
3. 種類は **ウェブアプリ** を選択
4. 実行するユーザー: **自分**
5. アクセスできるユーザー: **全員**
6. デプロイ後のURLをSlack Event SubscriptionsのRequest URLに設定

## ファイル構成

```
.
├── .clasp.json       # clasp設定 (rootDir: ./dist)
├── dist/             # ビルド成果物 (GASにプッシュされる)
├── src/              # ソースコード
│   ├── appsscript.json # GASプロジェクト設定
│   └── main.ts       # メインスクリプト (TypeScript)
├── package.json      # npm scripts, dependencies
├── tsconfig.json     # TypeScript設定
└── README.md         # このファイル
```

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run build` | TypeScriptをコンパイルし、appsscript.jsonをdistにコピー |
| `npm run deploy` | ビルドしてGASにプッシュ |
| `npm run lint` | Biomeでリント実行 |
| `npm run format` | Biomeでフォーマット実行 |
| `npx clasp open` | GASエディタをブラウザで開く |

## トラブルシューティング

### リアクションが反応しない

- Slack Event SubscriptionsのRequest URLが正しく設定されているか確認
- Slack Appに必要なスコープが付与されているか確認
- GASの実行ログ(`clasp logs`)でエラーを確認

### Notionに保存されない

- Notion IntegrationがデータベースにConnectされているか確認
- データベースIDが正しいか確認 (URLから取得可能)
- プロパティ名が一致しているか確認 (`名前`, `期日`, `URL`)

### 重複してタスクが作成される

- PropertiesServiceで重複防止処理をしているため、通常は発生しません
- 発生する場合はGASのスクリプトプロパティを確認
