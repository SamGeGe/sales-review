#!/bin/bash

# 设置错误处理
set -e

# 设置时区
export TZ=Asia/Shanghai

echo "🚀 启动销售复盘系统..."

# 检查配置文件
if [ ! -f "/app/conf.yaml" ]; then
    echo "❌ 配置文件不存在: /app/conf.yaml"
    exit 1
fi

# 创建必要的目录
mkdir -p /app/backend/data
mkdir -p /app/backend/reports
mkdir -p /app/backend/uploads

# 启动后端服务
echo "🔧 启动后端服务..."
cd /app/backend
npm start &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 10

# 检查后端是否启动成功
if ! curl -f http://localhost:6091/health > /dev/null 2>&1; then
    echo "❌ 后端服务启动失败"
    exit 1
fi
echo "✅ 后端服务启动成功"

# 启动前端服务
echo "🔧 启动前端服务..."
cd /app/frontend
npm start &
FRONTEND_PID=$!

# 等待前端启动
echo "⏳ 等待前端服务启动..."
sleep 10

# 检查前端是否启动成功
if ! curl -f http://localhost:6090 > /dev/null 2>&1; then
    echo "❌ 前端服务启动失败"
    exit 1
fi
echo "✅ 前端服务启动成功"

echo "🎉 销售复盘系统启动完成！"
echo "📊 服务信息:"
echo "  前端地址: http://localhost:6090"
echo "  后端地址: http://localhost:6091"
echo "  健康检查: http://localhost:6091/health"

# 等待进程
wait $BACKEND_PID $FRONTEND_PID 