#!/bin/bash

# 下载功能测试脚本
# 使用方法: ./test-download.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 下载功能测试 ===${NC}"

# 测试后端服务
echo -e "${YELLOW}1. 测试后端服务...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:6091/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✅ 后端服务正常${NC}"
else
    echo -e "${RED}❌ 后端服务异常${NC}"
    exit 1
fi

# 获取可用的报告ID
echo -e "${YELLOW}2. 获取可用报告ID...${NC}"
HISTORY_RESPONSE=$(curl -s http://localhost:6091/api/reports/history)
if echo "$HISTORY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 历史数据API正常${NC}"
    # 提取第一个报告的ID
    REPORT_ID=$(echo "$HISTORY_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    if [ -n "$REPORT_ID" ]; then
        echo -e "${GREEN}📊 使用报告ID: $REPORT_ID 进行测试${NC}"
    else
        echo -e "${RED}❌ 未找到可用的报告ID${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ 历史数据API异常${NC}"
    exit 1
fi

# 测试PDF下载
echo -e "${YELLOW}3. 测试PDF下载...${NC}"
PDF_RESPONSE=$(curl -s -I http://localhost:6091/api/reports/download/pdf/$REPORT_ID)
if echo "$PDF_RESPONSE" | grep -q "200 OK" && echo "$PDF_RESPONSE" | grep -q "application/pdf"; then
    echo -e "${GREEN}✅ PDF下载API正常${NC}"
    CONTENT_LENGTH=$(echo "$PDF_RESPONSE" | grep "Content-Length:" | cut -d' ' -f2)
    echo -e "${GREEN}📊 PDF文件大小: $CONTENT_LENGTH 字节${NC}"
else
    echo -e "${RED}❌ PDF下载API异常${NC}"
    echo "$PDF_RESPONSE"
fi

# 测试Word下载
echo -e "${YELLOW}4. 测试Word下载...${NC}"
WORD_RESPONSE=$(curl -s -I http://localhost:6091/api/reports/download/word/$REPORT_ID)
if echo "$WORD_RESPONSE" | grep -q "200 OK" && echo "$WORD_RESPONSE" | grep -q "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; then
    echo -e "${GREEN}✅ Word下载API正常${NC}"
    CONTENT_LENGTH=$(echo "$WORD_RESPONSE" | grep "Content-Length:" | cut -d' ' -f2)
    echo -e "${GREEN}📊 Word文件大小: $CONTENT_LENGTH 字节${NC}"
else
    echo -e "${RED}❌ Word下载API异常${NC}"
    echo "$WORD_RESPONSE"
fi

# 测试前端服务
echo -e "${YELLOW}5. 测试前端服务...${NC}"
FRONTEND_RESPONSE=$(curl -s -I http://localhost:6090 | head -1)
if echo "$FRONTEND_RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ 前端服务正常${NC}"
else
    echo -e "${RED}❌ 前端服务异常${NC}"
    exit 1
fi

echo -e "${BLUE}=== 测试完成 ===${NC}"
echo -e "${GREEN}🎉 下载功能测试完成！${NC}"
echo -e "${YELLOW}📝 现在可以访问以下地址测试下载功能：${NC}"
echo -e "${BLUE}   历史页面: http://localhost:6090/history${NC}"
echo -e "${BLUE}   复盘页面: http://localhost:6090/review${NC}"
echo -e "${YELLOW}💡 测试步骤：${NC}"
echo -e "${YELLOW}   1. 打开历史页面，点击任意报告的下载按钮${NC}"
echo -e "${YELLOW}   2. 检查是否能正常下载PDF和Word文件${NC}"
echo -e "${YELLOW}   3. 在复盘页面生成报告后，测试下载功能${NC}" 