#!/bin/bash

# 文件扩展名测试脚本
# 使用方法: ./test-file-extensions.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 文件扩展名测试 ===${NC}"

# 获取可用的报告ID
echo -e "${YELLOW}1. 获取可用报告ID...${NC}"
HISTORY_RESPONSE=$(curl -s http://localhost:6091/api/reports/history)
if echo "$HISTORY_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ 历史数据API正常${NC}"
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

# 测试PDF下载的文件扩展名
echo -e "${YELLOW}2. 测试PDF下载的文件扩展名...${NC}"
PDF_RESPONSE=$(curl -s -I http://localhost:6091/api/reports/download/pdf/$REPORT_ID)
if echo "$PDF_RESPONSE" | grep -q "Content-Disposition.*\.pdf"; then
    echo -e "${GREEN}✅ PDF文件扩展名正确 (.pdf)${NC}"
    PDF_FILENAME=$(echo "$PDF_RESPONSE" | grep "Content-Disposition" | sed 's/.*filename="\([^"]*\)".*/\1/')
    echo -e "${GREEN}📄 PDF文件名: $PDF_FILENAME${NC}"
else
    echo -e "${RED}❌ PDF文件扩展名错误${NC}"
    echo "$PDF_RESPONSE" | grep "Content-Disposition"
fi

# 测试Word下载的文件扩展名
echo -e "${YELLOW}3. 测试Word下载的文件扩展名...${NC}"
WORD_RESPONSE=$(curl -s -I http://localhost:6091/api/reports/download/word/$REPORT_ID)
if echo "$WORD_RESPONSE" | grep -q "Content-Disposition.*\.docx"; then
    echo -e "${GREEN}✅ Word文件扩展名正确 (.docx)${NC}"
    WORD_FILENAME=$(echo "$WORD_RESPONSE" | grep "Content-Disposition" | sed 's/.*filename="\([^"]*\)".*/\1/')
    echo -e "${GREEN}📄 Word文件名: $WORD_FILENAME${NC}"
else
    echo -e "${RED}❌ Word文件扩展名错误${NC}"
    echo "$WORD_RESPONSE" | grep "Content-Disposition"
fi

# 测试Content-Type
echo -e "${YELLOW}4. 测试Content-Type...${NC}"
if echo "$PDF_RESPONSE" | grep -q "application/pdf"; then
    echo -e "${GREEN}✅ PDF Content-Type正确${NC}"
else
    echo -e "${RED}❌ PDF Content-Type错误${NC}"
fi

if echo "$WORD_RESPONSE" | grep -q "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; then
    echo -e "${GREEN}✅ Word Content-Type正确${NC}"
else
    echo -e "${RED}❌ Word Content-Type错误${NC}"
fi

echo -e "${BLUE}=== 测试完成 ===${NC}"
echo -e "${GREEN}🎉 文件扩展名测试完成！${NC}"
echo -e "${YELLOW}📝 现在可以访问以下地址测试下载功能：${NC}"
echo -e "${BLUE}   历史页面: http://localhost:6090/history${NC}"
echo -e "${BLUE}   复盘页面: http://localhost:6090/review${NC}"
echo -e "${YELLOW}💡 测试步骤：${NC}"
echo -e "${YELLOW}   1. 打开历史页面，点击Word下载按钮${NC}"
echo -e "${YELLOW}   2. 检查下载的文件名是否包含 .docx 扩展名${NC}"
echo -e "${YELLOW}   3. 检查PDF下载的文件名是否包含 .pdf 扩展名${NC}" 