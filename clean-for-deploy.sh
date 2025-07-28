#!/bin/bash

echo "🧹 开始清理项目文件，准备部署到Linux服务器..."

# 删除node_modules目录
echo "🗑️  删除node_modules目录..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true

# 删除package-lock.json文件
echo "🗑️  删除package-lock.json文件..."
find . -name "package-lock.json" -type f -delete

# 删除.git目录
echo "🗑️  删除.git目录..."
find . -name ".git" -type d -exec rm -rf {} + 2>/dev/null || true

# 删除构建目录
echo "🗑️  删除构建目录..."
find . -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true

# 删除日志文件
echo "🗑️  删除日志文件..."
find . -name "*.log" -type f -delete

# 删除临时文件
echo "🗑️  删除临时文件..."
find . -name "*.tmp" -type f -delete
find . -name "*.temp" -type f -delete

# 删除缓存文件
echo "🗑️  删除缓存文件..."
find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "cache" -type d -exec rm -rf {} + 2>/dev/null || true

# 删除.DS_Store文件（macOS）
echo "🗑️  删除.DS_Store文件..."
find . -name ".DS_Store" -type f -delete

# 删除Thumbs.db文件（Windows）
echo "🗑️  删除Thumbs.db文件..."
find . -name "Thumbs.db" -type f -delete

# 删除IDE配置文件
echo "🗑️  删除IDE配置文件..."
find . -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".idea" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.swp" -type f -delete
find . -name "*.swo" -type f -delete

# 删除测试报告
echo "🗑️  删除测试报告..."
find . -name "coverage" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "test-results" -type d -exec rm -rf {} + 2>/dev/null || true

# 删除Docker缓存（可选）
echo "🗑️  删除Docker缓存..."
docker system prune -f 2>/dev/null || true

# 显示清理结果
echo ""
echo "📊 清理完成！"
echo ""
echo "📁 保留的重要文件:"
echo "  ✅ conf.yaml - 配置文件"
echo "  ✅ package.json - 依赖定义"
echo "  ✅ src/ - 源代码"
echo "  ✅ public/ - 静态文件"
echo "  ✅ Dockerfile - Docker配置"
echo "  ✅ docker-compose.yml - Docker编排"
echo "  ✅ nginx.conf - Nginx配置"
echo "  ✅ *.sh - 部署脚本"
echo "  ✅ *.md - 文档文件"
echo ""
echo "📋 部署到Linux服务器后需要执行的命令:"
echo "  1. 安装Node.js: sudo apt update && sudo apt install nodejs npm"
echo "  2. 安装Docker: curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
echo "  3. 安装依赖: cd frontend && npm install && cd ../backend && npm install"
echo "  4. 启动服务: ./deploy-linux.sh"
echo ""
echo "💡 提示: 项目已清理完成，可以直接复制到Linux服务器" 