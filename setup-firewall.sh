#!/bin/bash

# 防火墙配置脚本
# 使用方法: sudo ./setup-firewall.sh

set -e

echo "🔥 配置防火墙规则..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用sudo运行此脚本"
    exit 1
fi

# 检测防火墙类型
if command -v ufw &> /dev/null; then
    echo "📋 使用UFW防火墙..."
    
    # 启用UFW
    ufw --force enable
    
    # 允许SSH
    ufw allow ssh
    
    # 允许HTTP和HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # 允许应用端口（可选，如果直接暴露）
    ufw allow 6092/tcp
    ufw allow 6093/tcp
    
    # 设置默认策略
    ufw default deny incoming
    ufw default allow outgoing
    
    echo "✅ UFW防火墙配置完成"
    
elif command -v firewall-cmd &> /dev/null; then
    echo "📋 使用firewalld防火墙..."
    
    # 启动firewalld
    systemctl start firewalld
    systemctl enable firewalld
    
    # 配置默认区域
    firewall-cmd --set-default-zone=public
    
    # 允许SSH
    firewall-cmd --permanent --add-service=ssh
    
    # 允许HTTP和HTTPS
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    
    # 允许应用端口（可选，如果直接暴露）
    firewall-cmd --permanent --add-port=6092/tcp
    firewall-cmd --permanent --add-port=6093/tcp
    
    # 重新加载配置
    firewall-cmd --reload
    
    echo "✅ firewalld防火墙配置完成"
    
elif command -v iptables &> /dev/null; then
    echo "📋 使用iptables防火墙..."
    
    # 清除现有规则
    iptables -F
    iptables -X
    
    # 设置默认策略
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT ACCEPT
    
    # 允许本地回环
    iptables -A INPUT -i lo -j ACCEPT
    
    # 允许已建立的连接
    iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
    
    # 允许SSH
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    
    # 允许HTTP和HTTPS
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    
    # 允许应用端口（可选，如果直接暴露）
    iptables -A INPUT -p tcp --dport 6092 -j ACCEPT
    iptables -A INPUT -p tcp --dport 6093 -j ACCEPT
    
    # 保存规则
    if command -v iptables-save &> /dev/null; then
        mkdir -p /etc/iptables
        iptables-save > /etc/iptables/rules.v4
    fi
    
    echo "✅ iptables防火墙配置完成"
    
else
    echo "⚠️ 未检测到防火墙，请手动配置"
fi

# 配置系统安全设置
echo "🔒 配置系统安全设置..."

# 禁用不必要的服务
systemctl disable telnet 2>/dev/null || true
systemctl disable rsh 2>/dev/null || true
systemctl disable rlogin 2>/dev/null || true

# 配置SSH安全设置
if [ -f /etc/ssh/sshd_config ]; then
    echo "🔧 配置SSH安全设置..."
    
    # 备份原配置
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # 安全配置
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    
    # 重启SSH服务
    systemctl reload sshd
    
    echo "✅ SSH安全配置完成"
fi

echo ""
echo "🔒 防火墙配置完成！"
echo "📋 开放的端口:"
echo "  - 22 (SSH)"
echo "  - 80 (HTTP)"
echo "  - 443 (HTTPS)"
echo "  - 6092 (前端应用，可选)"
echo "  - 6093 (后端API，可选)"
echo ""
echo "💡 建议使用Nginx反向代理，只开放80和443端口"
echo "🔧 安全提示:"
echo "  - SSH已配置为密钥认证"
echo "  - 已禁用root直接登录"
echo "  - 建议定期更新系统和软件包" 