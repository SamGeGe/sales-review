# 使用官方镜像源（推荐）
FROM node:18-alpine

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
    ttf-freefont \
    curl \
    bash

# 设置环境变量
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production
ENV DOCKER_ENV=true
ENV TZ=Asia/Shanghai

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# 安装依赖（使用国内镜像）
RUN npm install --registry=https://registry.npmmirror.com --production=false
RUN cd frontend && npm install --registry=https://registry.npmmirror.com --production=false
RUN cd backend && npm install --ignore-scripts --no-optional --registry=https://registry.npmmirror.com --production=false
RUN cd backend && npm rebuild better-sqlite3

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p backend/data backend/reports backend/uploads

# 设置文件权限
RUN chmod +x docker-entrypoint.sh

# 暴露端口
EXPOSE 6090 6091

# 启动脚本
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:6091/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"] 