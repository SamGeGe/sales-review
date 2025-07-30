#!/bin/bash

# 日历同步功能测试脚本
# 使用方法: ./test-calendar-sync.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 日历同步功能测试 ===${NC}"

# 测试后端API
echo -e "${YELLOW}1. 测试后端历史数据API...${NC}"
HISTORY_RESPONSE=$(curl -s http://localhost:6091/api/reports/history)
if echo "$HISTORY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 后端历史数据API正常${NC}"
    REPORT_COUNT=$(echo "$HISTORY_RESPONSE" | grep -o '"id":[0-9]*' | wc -l)
    echo -e "${GREEN}📊 当前有 $REPORT_COUNT 条复盘报告${NC}"
else
    echo -e "${RED}❌ 后端历史数据API异常${NC}"
    exit 1
fi

# 测试前端服务
echo -e "${YELLOW}2. 测试前端服务...${NC}"
FRONTEND_RESPONSE=$(curl -s -I http://localhost:6090 | head -1)
if echo "$FRONTEND_RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ 前端服务正常${NC}"
else
    echo -e "${RED}❌ 前端服务异常${NC}"
    exit 1
fi

# 测试健康检查
echo -e "${YELLOW}3. 测试后端健康检查...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:6091/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ 后端健康检查正常${NC}"
else
    echo -e "${RED}❌ 后端健康检查异常${NC}"
    exit 1
fi

echo -e "${BLUE}=== 测试完成 ===${NC}"
echo -e "${GREEN}🎉 所有服务正常运行！${NC}"
echo -e "${YELLOW}📝 现在可以访问以下地址测试日历同步功能：${NC}"
echo -e "${BLUE}   前端应用: http://localhost:6090${NC}"
echo -e "${BLUE}   复盘页面: http://localhost:6090/review${NC}"
echo -e "${BLUE}   历史页面: http://localhost:6090/history${NC}"
echo -e "${YELLOW}💡 测试步骤：${NC}"
echo -e "${YELLOW}   1. 打开复盘页面，查看日历是否有高亮显示${NC}"
echo -e "${YELLOW}   2. 创建新的复盘报告并保存${NC}"
echo -e "${YELLOW}   3. 检查日历是否立即更新显示新的复盘数据${NC}" 