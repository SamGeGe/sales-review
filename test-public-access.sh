#!/bin/bash

# 公网访问测试脚本
# 使用方法: ./test-public-access.sh

set -e

echo "🧪 测试公网访问配置..."

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 服务器公网IP: $SERVER_IP"

# 测试前端访问
echo "📋 测试前端访问..."
if curl -f http://$SERVER_IP:6092 > /dev/null 2>&1; then
    echo "✅ 前端服务可访问: http://$SERVER_IP:6092"
else
    echo "❌ 前端服务无法访问"
fi

# 测试后端健康检查
echo "🔍 测试后端健康检查..."
if curl -f http://$SERVER_IP:6093/health > /dev/null 2>&1; then
    echo "✅ 后端服务可访问: http://$SERVER_IP:6093/health"
else
    echo "❌ 后端服务无法访问"
fi

# 测试API调用
echo "🔧 测试API调用..."
if curl -f http://$SERVER_IP:6093/api/users > /dev/null 2>&1; then
    echo "✅ API调用成功: http://$SERVER_IP:6093/api/users"
else
    echo "❌ API调用失败"
fi

# 测试Nginx代理（如果配置了）
echo "🌐 测试Nginx代理..."
if curl -f http://$SERVER_IP/api/users > /dev/null 2>&1; then
    echo "✅ Nginx代理工作正常: http://$SERVER_IP/api/users"
else
    echo "⚠️ Nginx代理未配置或无法访问"
fi

echo ""
echo "📊 测试结果总结:"
echo "  1. 确保防火墙开放了必要端口"
echo "  2. 确保Docker容器正常运行"
echo "  3. 确保Nginx配置正确（如果使用）"
echo "  4. 确保域名解析正确（如果使用域名）"
echo ""
echo "🔧 故障排除命令:"
echo "  - 查看容器状态: docker-compose ps"
echo "  - 查看容器日志: docker-compose logs"
echo "  - 查看Nginx状态: sudo systemctl status nginx"
echo "  - 查看防火墙状态: sudo ufw status" 