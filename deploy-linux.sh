#!/bin/bash

# Linux服务器部署脚本
# 使用方法: ./deploy-linux.sh

set -e

echo "🚀 开始部署销售复盘系统到Linux服务器..."

# 配置国内镜像源
echo "🔧 配置国内镜像源..."
# 配置npm国内镜像
npm config set registry https://registry.npmmirror.com

# 配置Docker国内镜像
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<-'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com",
    "https://mirror.baidubce.com"
  ]
}
EOF

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，正在安装Docker..."
    
    # 使用国内镜像安装Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh --mirror Aliyun
    
    # 重启Docker服务以应用镜像配置
    sudo systemctl daemon-reload
    sudo systemctl restart docker
    
    sudo usermod -aG docker $USER
    echo "✅ Docker安装完成，请重新登录以应用用户组权限"
    echo "💡 提示：请运行 'newgrp docker' 或重新登录以应用权限"
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，正在安装..."
    
    # 使用国内镜像下载Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # 创建软链接
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    echo "✅ Docker Compose安装完成"
fi

# 创建部署目录
DEPLOY_DIR="/opt/sales-review"
echo "📁 创建部署目录: $DEPLOY_DIR"
sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR

# 复制项目文件
echo "📋 复制项目文件..."
cp -r . $DEPLOY_DIR/
cd $DEPLOY_DIR

# 设置文件权限
echo "🔐 设置文件权限..."
chmod +x docker-entrypoint.sh
chmod +x deploy-linux.sh

# 创建生产环境配置文件
echo "⚙️ 创建生产环境配置..."
cat > conf.yaml << EOF
# 销售复盘系统配置文件

# 开发环境配置
development:
  frontend:
    port: 6090
    backend_url: http://localhost:6091
  backend:
    port: 6091
    cors_origins:
      - http://localhost:6090
      - http://localhost:6091

# Docker/生产环境配置
production:
  frontend:
    port: 6092
    backend_url: /api
  backend:
    port: 6093
    cors_origins:
      - http://localhost:6092
      - http://localhost:6093
      - "http://*"
      - "https://*"
      - "*"

# LLM配置
llm:
  primary:
    base_url: "http://183.221.24.83:8000/v1"
    model: "qwq32b-q8"
    api_key: "sk-fake"
    timeout: 120000
    max_retries: 3
  backup:
    base_url: "https://openrouter.ai/api/v1"
    model: "qwen/qwen3-235b-a22b-2507"
    api_key: "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"
    timeout: 120000
    max_retries: 3

# 聊天历史配置
chat_history:
  enabled: true
  max_messages: 100
  storage_key: "sales_review_chat_history"
EOF

# 优化Dockerfile以使用国内镜像
echo "🔧 优化Dockerfile配置..."
cat > Dockerfile << 'EOF'
# 使用国内镜像源
FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine

# 设置npm国内镜像
RUN npm config set registry https://registry.npmmirror.com

# 安装系统依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# 设置环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV DOCKER_ENV=true

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# 安装依赖（使用国内镜像）
RUN npm install --registry=https://registry.npmmirror.com
RUN cd frontend && npm install --registry=https://registry.npmmirror.com
RUN cd backend && npm install --ignore-scripts --no-optional --registry=https://registry.npmmirror.com
RUN cd backend && npm rebuild better-sqlite3

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p backend/data backend/reports backend/uploads

# 暴露端口
EXPOSE 6090 6091

# 启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
EOF

# 构建并启动Docker容器
echo "🐳 构建并启动Docker容器..."
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f http://localhost:6092 > /dev/null 2>&1; then
    echo "✅ 前端服务启动成功: http://localhost:6092"
else
    echo "❌ 前端服务启动失败"
    echo "📋 查看容器日志:"
    docker-compose logs frontend
fi

if curl -f http://localhost:6093/health > /dev/null 2>&1; then
    echo "✅ 后端服务启动成功: http://localhost:6093"
else
    echo "❌ 后端服务启动失败"
    echo "📋 查看容器日志:"
    docker-compose logs backend
fi

# 创建系统服务
echo "🔧 创建系统服务..."
sudo tee /etc/systemd/system/sales-review.service > /dev/null << EOF
[Unit]
Description=Sales Review System
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable sales-review.service
sudo systemctl start sales-review.service

echo "🎉 部署完成！"
echo ""
echo "📊 服务信息:"
echo "  前端地址: http://localhost:6092"
echo "  后端地址: http://localhost:6093"
echo "  健康检查: http://localhost:6093/health"
echo ""
echo "🔧 管理命令:"
echo "  查看状态: sudo systemctl status sales-review"
echo "  重启服务: sudo systemctl restart sales-review"
echo "  停止服务: sudo systemctl stop sales-review"
echo "  查看日志: docker-compose logs -f"
echo ""
echo "🌐 公网访问配置请参考README.md中的说明"
echo ""
echo "💡 国内服务器优化提示:"
echo "  - 已配置npm国内镜像源"
echo "  - 已配置Docker国内镜像源"
echo "  - 已优化Dockerfile使用国内基础镜像" 