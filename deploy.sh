#!/bin/bash
#
# deploy.sh - 既存デプロイを更新するためのスクリプト
#

set -e

# 色付きの出力
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 GAS デプロイを開始します...${NC}"
echo ""

# clasp がインストールされているか確認
if ! command -v clasp &> /dev/null; then
    echo -e "${RED}❌ clasp がインストールされていません${NC}"
    echo "以下のコマンドでインストールしてください:"
    echo "  npm install -g @google/clasp"
    exit 1
fi

# 1. プッシュ
echo -e "${GREEN}📤 ローカルの変更をGASにプッシュ中...${NC}"
clasp push

# 2. デプロイメントID を取得
echo ""
echo -e "${GREEN}🔍 デプロイメント一覧を取得中...${NC}"
DEPLOYMENT_INFO=$(clasp deployments)
echo "$DEPLOYMENT_INFO"

# 最新のデプロイメントID を取得 (HEAD は除く)
# フォーマット: - <deployment_id> @<version> - <description>
DEPLOYMENT_ID=$(echo "$DEPLOYMENT_INFO" | grep -v "@HEAD" | grep "^-" | head -1 | awk '{print $2}')

if [ -z "$DEPLOYMENT_ID" ]; then
    echo -e "${YELLOW}⚠️  既存のデプロイメントが見つかりません。新規デプロイを作成します...${NC}"
    clasp deploy --description "Initial deployment"
else
    echo ""
    echo -e "${GREEN}🔄 デプロイメントを更新中...${NC}"
    echo "Deployment ID: $DEPLOYMENT_ID"
    clasp deploy --deploymentId "$DEPLOYMENT_ID" --description "Updated: $(date '+%Y-%m-%d %H:%M:%S')"
fi

echo ""
echo -e "${GREEN}✅ デプロイが完了しました！${NC}"
