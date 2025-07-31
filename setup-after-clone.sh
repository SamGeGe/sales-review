#!/bin/bash

# 销售复盘系统克隆后设置脚本
# 使用方法: ./setup-after-clone.sh

set -e

echo "🚀 开始设置销售复盘系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 检查配置文件...${NC}"

# 检查配置文件是否存在
if [ ! -f "conf.yaml" ]; then
    echo -e "${YELLOW}⚠️ 未找到配置文件，从模板创建...${NC}"
    
    if [ -f "conf.yaml.example" ]; then
        cp conf.yaml.example conf.yaml
        echo -e "${GREEN}✅ 已从模板创建 conf.yaml${NC}"
        echo -e "${YELLOW}💡 请编辑 conf.yaml 文件，填入您的实际配置${NC}"
    else
        echo -e "${RED}❌ 未找到配置文件模板 conf.yaml.example${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 配置文件已存在${NC}"
fi

# 检查前端配置文件
if [ ! -f "frontend/public/conf.yaml" ]; then
    echo -e "${YELLOW}⚠️ 未找到前端配置文件，从模板创建...${NC}"
    
    if [ -f "conf.yaml.example" ]; then
        cp conf.yaml.example frontend/public/conf.yaml
        echo -e "${GREEN}✅ 已从模板创建 frontend/public/conf.yaml${NC}"
    else
        echo -e "${RED}❌ 未找到配置文件模板${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ 前端配置文件已存在${NC}"
fi

echo -e "${BLUE}📋 设置文件权限...${NC}"

# 设置脚本执行权限
chmod +x *.sh
chmod +x deploy-*.sh
chmod +x setup-*.sh
chmod +x start-*.sh
chmod +x test-*.sh
chmod +x clean-*.sh
chmod +x one-click-*.sh

echo -e "${GREEN}✅ 脚本权限设置完成${NC}"

echo -e "${BLUE}📋 检查依赖...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装${NC}"
    echo -e "${YELLOW}💡 请先安装 Node.js 18+${NC}"
    echo -e "${YELLOW}   下载地址: https://nodejs.org/${NC}"
    exit 1
else
    node_version=$(node --version | sed 's/v//')
    echo -e "${GREEN}✅ Node.js 已安装: $node_version${NC}"
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 未安装${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm 已安装${NC}"
fi

echo -e "${BLUE}📋 安装依赖...${NC}"

# 安装后端依赖
echo -e "${YELLOW}📦 安装后端依赖...${NC}"
cd backend
npm install
cd ..

# 安装前端依赖
echo -e "${YELLOW}📦 安装前端依赖...${NC}"
cd frontend
npm install
cd ..

echo -e "${GREEN}✅ 依赖安装完成${NC}"

echo -e "${BLUE}📋 创建必要目录...${NC}"

# 创建必要的目录
mkdir -p backend/reports
mkdir -p backend/uploads
mkdir -p backend/logs

echo -e "${GREEN}✅ 目录创建完成${NC}"

echo -e "${BLUE}📋 配置检查...${NC}"

# 运行配置测试
if [ -f "test-config.sh" ]; then
    echo -e "${YELLOW}🧪 运行配置测试...${NC}"
    ./test-config.sh
else
    echo -e "${YELLOW}⚠️ 未找到配置测试脚本${NC}"
fi

echo ""
echo -e "${GREEN}🎉 设置完成！${NC}"
echo ""
echo -e "${BLUE}📋 下一步操作:${NC}"
echo -e "${YELLOW}1. 编辑配置文件:${NC}"
echo -e "   nano conf.yaml"
echo -e "   nano frontend/public/conf.yaml"
echo ""
echo -e "${YELLOW}2. 启动开发环境:${NC}"
echo -e "   ./start-local.sh"
echo ""
echo -e "${YELLOW}3. 或者使用Docker部署:${NC}"
echo -e "   docker-compose up -d"
echo ""
echo -e "${YELLOW}4. 查看部署文档:${NC}"
echo -e "   cat README.md"
echo -e "   cat DEPLOYMENT_SUMMARY.md"
echo ""
echo -e "${BLUE}💡 提示:${NC}"
echo -e "- 请确保在 conf.yaml 中填入正确的API密钥"
echo -e "- 请确保MySQL服务已启动并配置正确"
echo -e "- 开发环境端口: 前端 6090, 后端 6091"
echo -e "- Docker环境端口: 前端 6092, 后端 6093"
echo -e "- 访问地址: http://localhost:6090 (开发) 或 http://localhost:6092 (Docker)"
echo -e "- 数据库迁移文档: cat DATABASE_MIGRATION.md" 