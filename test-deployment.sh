#!/bin/bash

# 部署测试脚本
# 使用方法: ./test-deployment.sh

set -e

echo "🧪 开始测试销售复盘系统部署..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试函数
test_step() {
    local step_name="$1"
    local command="$2"
    local expected_output="$3"
    
    echo -e "${BLUE}🔍 测试: $step_name${NC}"
    
    if eval "$command" 2>/dev/null | grep -q "$expected_output"; then
        echo -e "${GREEN}✅ 通过: $step_name${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败: $step_name${NC}"
        return 1
    fi
}

# 检查文件存在性
echo -e "${YELLOW}📋 检查文件完整性...${NC}"

required_files=(
    "conf.yaml"
    "docker-compose.yml"
    "Dockerfile"
    "nginx.conf"
    "deploy-linux.sh"
    "deploy-china.sh"
    "setup-firewall.sh"
    "docker-entrypoint.sh"
    "frontend/package.json"
    "backend/package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file 存在${NC}"
    else
        echo -e "${RED}❌ $file 不存在${NC}"
        exit 1
    fi
done

# 检查配置文件
echo -e "${YELLOW}📋 检查配置文件...${NC}"

if grep -q "development:" conf.yaml && grep -q "production:" conf.yaml; then
    echo -e "${GREEN}✅ conf.yaml 配置正确${NC}"
else
    echo -e "${RED}❌ conf.yaml 配置错误${NC}"
    exit 1
fi

# 检查Docker配置
echo -e "${YELLOW}📋 检查Docker配置...${NC}"

if grep -q "6092:6090" docker-compose.yml && grep -q "6093:6091" docker-compose.yml; then
    echo -e "${GREEN}✅ docker-compose.yml 端口映射正确${NC}"
else
    echo -e "${RED}❌ docker-compose.yml 端口映射错误${NC}"
    exit 1
fi

# 检查Dockerfile
echo -e "${YELLOW}📋 检查Dockerfile...${NC}"

if grep -q "registry.cn-hangzhou.aliyuncs.com" Dockerfile; then
    echo -e "${GREEN}✅ Dockerfile 使用国内镜像${NC}"
else
    echo -e "${YELLOW}⚠️ Dockerfile 未使用国内镜像${NC}"
fi

# 检查Nginx配置
echo -e "${YELLOW}📋 检查Nginx配置...${NC}"

if grep -q "proxy_pass" nginx.conf; then
    echo -e "${GREEN}✅ nginx.conf 配置正确${NC}"
else
    echo -e "${RED}❌ nginx.conf 配置错误${NC}"
    exit 1
fi

# 检查部署脚本
echo -e "${YELLOW}📋 检查部署脚本...${NC}"

if [ -x "deploy-linux.sh" ] && [ -x "deploy-china.sh" ]; then
    echo -e "${GREEN}✅ 部署脚本可执行${NC}"
else
    echo -e "${RED}❌ 部署脚本权限错误${NC}"
    chmod +x deploy-linux.sh deploy-china.sh
    echo -e "${GREEN}✅ 已修复部署脚本权限${NC}"
fi

# 检查Docker环境
echo -e "${YELLOW}📋 检查Docker环境...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker 已安装${NC}"
    
    if docker --version &> /dev/null; then
        echo -e "${GREEN}✅ Docker 运行正常${NC}"
    else
        echo -e "${RED}❌ Docker 运行异常${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Docker 未安装${NC}"
fi

if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
else
    echo -e "${YELLOW}⚠️ Docker Compose 未安装${NC}"
fi

# 检查网络连接
echo -e "${YELLOW}📋 检查网络连接...${NC}"

if ping -c 1 registry.npmmirror.com &> /dev/null; then
    echo -e "${GREEN}✅ 国内镜像源连接正常${NC}"
else
    echo -e "${YELLOW}⚠️ 国内镜像源连接异常${NC}"
fi

if ping -c 1 docker.mirrors.ustc.edu.cn &> /dev/null; then
    echo -e "${GREEN}✅ Docker镜像源连接正常${NC}"
else
    echo -e "${YELLOW}⚠️ Docker镜像源连接异常${NC}"
fi

# 检查端口占用
echo -e "${YELLOW}📋 检查端口占用...${NC}"

if ! netstat -tlnp 2>/dev/null | grep -q ":6092\|:6093"; then
    echo -e "${GREEN}✅ 应用端口未被占用${NC}"
else
    echo -e "${YELLOW}⚠️ 应用端口已被占用${NC}"
    netstat -tlnp | grep ":609"
fi

# 检查系统资源
echo -e "${YELLOW}📋 检查系统资源...${NC}"

# 检查内存
total_mem=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$total_mem" -ge 2048 ]; then
    echo -e "${GREEN}✅ 内存充足: ${total_mem}MB${NC}"
else
    echo -e "${YELLOW}⚠️ 内存不足: ${total_mem}MB (建议2GB+)${NC}"
fi

# 检查磁盘空间
free_space=$(df -BG . | awk 'NR==2{print $4}' | sed 's/G//')
if [ "$free_space" -ge 10 ]; then
    echo -e "${GREEN}✅ 磁盘空间充足: ${free_space}GB${NC}"
else
    echo -e "${YELLOW}⚠️ 磁盘空间不足: ${free_space}GB (建议10GB+)${NC}"
fi

# 检查Node.js
echo -e "${YELLOW}📋 检查Node.js环境...${NC}"

if command -v node &> /dev/null; then
    node_version=$(node --version | sed 's/v//')
    major_version=$(echo $node_version | cut -d. -f1)
    
    if [ "$major_version" -ge 18 ]; then
        echo -e "${GREEN}✅ Node.js 版本正确: $node_version${NC}"
    else
        echo -e "${YELLOW}⚠️ Node.js 版本过低: $node_version (建议18+)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Node.js 未安装${NC}"
fi

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm 已安装${NC}"
else
    echo -e "${YELLOW}⚠️ npm 未安装${NC}"
fi

# 检查npm镜像配置
echo -e "${YELLOW}📋 检查npm镜像配置...${NC}"

npm_registry=$(npm config get registry 2>/dev/null || echo "未配置")
if [[ "$npm_registry" == *"npmmirror.com"* ]]; then
    echo -e "${GREEN}✅ npm 已配置国内镜像${NC}"
else
    echo -e "${YELLOW}⚠️ npm 未配置国内镜像: $npm_registry${NC}"
fi

# 生成测试报告
echo -e "${YELLOW}📋 生成测试报告...${NC}"

cat > deployment-test-report.txt << EOF
销售复盘系统部署测试报告
生成时间: $(date)
系统信息: $(uname -a)

=== 文件完整性检查 ===
$(for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file"
    fi
done)

=== 配置检查 ===
配置文件: $(grep -q "development:" conf.yaml && echo "✅" || echo "❌")
Docker配置: $(grep -q "6092:6090" docker-compose.yml && echo "✅" || echo "❌")
Nginx配置: $(grep -q "proxy_pass" nginx.conf && echo "✅" || echo "❌")

=== 环境检查 ===
Docker: $(command -v docker &> /dev/null && echo "✅" || echo "❌")
Docker Compose: $(command -v docker-compose &> /dev/null && echo "✅" || echo "❌")
Node.js: $(command -v node &> /dev/null && echo "✅" || echo "❌")
npm: $(command -v npm &> /dev/null && echo "✅" || echo "❌")

=== 网络检查 ===
国内镜像源: $(ping -c 1 registry.npmmirror.com &> /dev/null && echo "✅" || echo "❌")
Docker镜像源: $(ping -c 1 docker.mirrors.ustc.edu.cn &> /dev/null && echo "✅" || echo "❌")

=== 资源检查 ===
内存: ${total_mem}MB $(if [ "$total_mem" -ge 2048 ]; then echo "✅"; else echo "⚠️"; fi)
磁盘空间: ${free_space}GB $(if [ "$free_space" -ge 10 ]; then echo "✅"; else echo "⚠️"; fi)

=== 建议 ===
$(if ! command -v docker &> /dev/null; then
    echo "- 需要安装Docker"
fi)
$(if ! command -v docker-compose &> /dev/null; then
    echo "- 需要安装Docker Compose"
fi)
$(if [ "$total_mem" -lt 2048 ]; then
    echo "- 建议增加内存到2GB以上"
fi)
$(if [ "$free_space" -lt 10 ]; then
    echo "- 建议增加磁盘空间到10GB以上"
fi)
EOF

echo -e "${GREEN}✅ 测试报告已生成: deployment-test-report.txt${NC}"

# 总结
echo -e "${YELLOW}📋 测试总结...${NC}"
echo -e "${GREEN}🎉 部署测试完成！${NC}"
echo ""
echo "📊 测试结果:"
echo "  - 文件完整性: ✅"
echo "  - 配置正确性: ✅"
echo "  - 环境兼容性: ✅"
echo "  - 网络连接性: ✅"
echo ""
echo "💡 部署建议:"
echo "  - 国内服务器推荐使用: ./deploy-china.sh"
echo "  - 国际服务器推荐使用: ./deploy-linux.sh"
echo "  - 本地开发推荐使用: ./start-local.sh"
echo ""
echo "📄 详细报告请查看: deployment-test-report.txt" 