#!/bin/bash

# 数据库备份脚本
# 使用方法: ./backup-database.sh

set -e

# 配置
DB_PATH="backend/data/sales_review.db"
BACKUP_DIR="backend/data/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/sales_review.db.backup.${TIMESTAMP}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 数据库备份脚本 ===${NC}"

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    echo -e "${RED}错误: 数据库文件不存在: $DB_PATH${NC}"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份数据库
echo -e "${YELLOW}正在备份数据库...${NC}"
cp "$DB_PATH" "$BACKUP_FILE"

# 检查备份是否成功
if [ -f "$BACKUP_FILE" ]; then
    echo -e "${GREEN}✅ 备份成功: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📊 备份文件大小: $(du -h "$BACKUP_FILE" | cut -f1)${NC}"
else
    echo -e "${RED}❌ 备份失败${NC}"
    exit 1
fi

# 显示最近的备份文件
echo -e "${YELLOW}📋 最近的备份文件:${NC}"
ls -la "$BACKUP_DIR"/*.backup.* | tail -5

echo -e "${GREEN}✅ 数据库备份完成！${NC}" 