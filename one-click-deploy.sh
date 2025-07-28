#!/bin/bash

# 一键部署脚本
# 使用方法: ./one-click-deploy.sh

set -e

echo "🚀 开始一键部署销售复盘系统..."

# 检查是否为root用户
if [ "$EUID" -eq 0 ]; then
    echo "❌ 请不要使用root用户运行此脚本"
    echo "💡 请使用普通用户运行，脚本会自动请求sudo权限"
    exit 1
fi

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    echo "📦 安装Git..."
    sudo apt update
    sudo apt install git -y
fi

# 配置Git（如果需要）
if [ -z "$(git config --global user.name)" ]; then
    echo "⚙️ 配置Git用户信息..."
    read -p "请输入您的姓名: " git_name
    read -p "请输入您的邮箱: " git_email
    git config --global user.name "$git_name"
    git config --global user.email "$git_email"
fi

# 创建部署目录
DEPLOY_DIR="/opt/sales-review"
echo "📁 创建部署目录: $DEPLOY_DIR"
sudo mkdir -p $DEPLOY_DIR
sudo chown $USER:$USER $DEPLOY_DIR

# 检查是否已经克隆
if [ -d "$DEPLOY_DIR/.git" ]; then
    echo "🔄 项目已存在，更新代码..."
    cd $DEPLOY_DIR
    git pull origin main
else
    echo "📋 克隆项目..."
    cd /tmp
    git clone https://github.com/SamGeGe/sales-review.git
    sudo cp -r sales-review/* $DEPLOY_DIR/
    sudo cp -r sales-review/.* $DEPLOY_DIR/ 2>/dev/null || true
    cd $DEPLOY_DIR
fi

# 设置文件权限
echo "🔐 设置文件权限..."
chmod +x deploy-linux.sh setup-firewall.sh test-public-access.sh

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "🐳 安装Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker安装完成，请重新登录以应用用户组权限"
    echo "💡 或者运行: newgrp docker"
    newgrp docker
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 运行部署脚本
echo "🚀 运行部署脚本..."
./deploy-linux.sh

# 配置防火墙
echo "🔥 配置防火墙..."
sudo ./setup-firewall.sh

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)
echo "🌐 服务器公网IP: $SERVER_IP"

# 测试部署
echo "🧪 测试部署..."
./test-public-access.sh

echo ""
echo "🎉 部署完成！"
echo ""
echo "📊 服务信息:"
echo "  前端地址: http://$SERVER_IP:6092"
echo "  后端地址: http://$SERVER_IP:6093"
echo "  健康检查: http://$SERVER_IP:6093/health"
echo ""
echo "🔧 管理命令:"
echo "  查看状态: sudo systemctl status sales-review"
echo "  重启服务: sudo systemctl restart sales-review"
echo "  查看日志: docker-compose logs -f"
echo ""
echo "🌐 配置Nginx反向代理（推荐）:"
echo "  1. sudo apt install nginx"
echo "  2. sudo cp nginx.conf /etc/nginx/sites-available/sales-review"
echo "  3. sudo nano /etc/nginx/sites-available/sales-review  # 编辑域名"
echo "  4. sudo ln -s /etc/nginx/sites-available/sales-review /etc/nginx/sites-enabled/"
echo "  5. sudo nginx -t && sudo systemctl restart nginx"
echo ""
echo "🔒 配置SSL证书（可选）:"
echo "  sudo apt install certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d your-domain.com" 