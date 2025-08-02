#!/bin/bash

echo "🚀 启动本地开发环境..."

# 检查是否已安装依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 安装后端依赖..."
    cd backend && npm install && cd ..
fi

# 测试 dayjs 修复
echo "🔧 测试 dayjs 修复..."
cd backend && npm run test-dayjs
if [ $? -ne 0 ]; then
    echo "❌ dayjs 测试失败，请检查依赖安装"
    exit 1
fi

# 初始化数据库
echo "🗄️ 初始化数据库..."
cd backend && npm run init-db
if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败，请检查数据库连接"
    exit 1
fi

# 启动后端服务
echo "🔧 启动后端服务 (端口: 6091)..."
cd backend && npm start &
BACKEND_PID=$!

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 启动前端服务
echo "🌐 启动前端服务 (端口: 6090)..."
cd frontend && npm start &
FRONTEND_PID=$!

echo "✅ 本地开发环境启动完成！"
echo "📱 前端地址: http://localhost:6090"
echo "🔧 后端地址: http://localhost:6091"
echo "📊 健康检查: http://localhost:6091/health"
echo ""
echo "按 Ctrl+C 停止服务"

# 等待用户中断
wait $BACKEND_PID $FRONTEND_PID 