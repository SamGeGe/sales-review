# 部署详细指南

## 📋 部署概览

本指南提供销售复盘系统的完整部署方案，支持本地开发、Docker容器化和Linux服务器部署。

## 🚀 部署方案

### 方案一：本地开发部署
- **适用场景**: 开发调试、功能测试
- **端口**: 前端 6090, 后端 6091
- **特点**: 快速启动、实时热重载

### 方案二：Docker容器化部署
- **适用场景**: 生产环境、服务器部署
- **端口**: 前端 6092, 后端 6093
- **特点**: 环境一致、易于管理

### 方案三：Linux服务器部署
- **适用场景**: 公网访问、企业环境
- **特点**: 完整的安全配置、SSL支持

## 🛠️ 本地开发部署

### 环境准备

1. **安装Node.js**
   ```bash
   # 下载并安装Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 验证安装
   node --version
   npm --version
   ```

2. **克隆项目**
   ```bash
   git clone https://github.com/your-username/sales-review.git
   cd sales-review
   ```

3. **运行设置脚本**
   ```bash
   chmod +x setup-after-clone.sh
   ./setup-after-clone.sh
   ```

### 配置系统

1. **创建配置文件**
   ```bash
   cp conf.yaml.example conf.yaml
   cp conf.yaml.example frontend/public/conf.yaml
   ```

2. **编辑配置**
   ```bash
   # 编辑主配置文件
   nano conf.yaml
   
   # 编辑前端配置文件
   nano frontend/public/conf.yaml
   ```

3. **配置LLM服务**
   ```yaml
   llm:
     primary:
       base_url: "http://your-llm-server:8000/v1"
       model: "your-model-name"
       api_key: "your-api-key-here"
     backup:
       base_url: "https://openrouter.ai/api/v1"
       model: "your-backup-model"
       api_key: "your-backup-api-key"
   ```

### 启动服务

```bash
# 启动开发环境
./start-local.sh

# 或手动启动
cd backend && npm start &
cd frontend && npm start &
```

### 验证部署

```bash
# 检查服务状态
curl http://localhost:6091/health
curl http://localhost:6090

# 查看日志
tail -f backend/logs/app.log
```

## 🐳 Docker容器化部署

### 环境准备

1. **安装Docker**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # 启动Docker服务
   sudo systemctl start docker
   sudo systemctl enable docker
   
   # 验证安装
   docker --version
   docker-compose --version
   ```

2. **配置国内镜像源（可选）**
   ```bash
   # 配置Docker镜像源
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
   
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

### 部署步骤

1. **构建并启动**
   ```bash
   # 构建镜像
   docker-compose build
   
   # 启动服务
   docker-compose up -d
   ```

2. **查看服务状态**
   ```bash
   # 查看容器状态
   docker-compose ps
   
   # 查看日志
   docker-compose logs -f
   ```

3. **访问应用**
   - 前端: http://localhost:6092
   - 后端: http://localhost:6093

### 管理命令

```bash
# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 更新部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 查看资源使用
docker stats
```

## 🖥️ Linux服务器部署

### 方案一：标准部署

1. **下载部署脚本**
   ```bash
   wget https://raw.githubusercontent.com/your-username/sales-review/main/deploy-linux.sh
   chmod +x deploy-linux.sh
   ```

2. **运行部署**
   ```bash
   ./deploy-linux.sh
   ```

3. **配置防火墙**
   ```bash
   sudo ./setup-firewall.sh
   ```

### 方案二：国内服务器优化部署

1. **下载优化脚本**
   ```bash
   wget https://raw.githubusercontent.com/your-username/sales-review/main/deploy-china.sh
   chmod +x deploy-china.sh
   ```

2. **运行部署**
   ```bash
   ./deploy-china.sh
   ```

### 部署脚本功能

- ✅ 自动安装Docker和Docker Compose
- ✅ 配置国内镜像源
- ✅ 创建系统服务
- ✅ 配置防火墙
- ✅ 设置Nginx反向代理
- ✅ 配置SSL证书（可选）

## 🌐 公网访问配置

### Nginx反向代理配置

1. **安装Nginx**
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **配置站点**
   ```bash
   # 复制配置文件
   sudo cp nginx.conf /etc/nginx/sites-available/sales-review
   
   # 编辑配置
   sudo nano /etc/nginx/sites-available/sales-review
   
   # 启用站点
   sudo ln -s /etc/nginx/sites-available/sales-review /etc/nginx/sites-enabled/
   
   # 测试配置
   sudo nginx -t
   
   # 重启Nginx
   sudo systemctl restart nginx
   ```

3. **配置SSL证书**
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d your-domain.com
   
   # 设置自动续期
   sudo crontab -e
   # 添加: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

### 防火墙配置

```bash
# 运行防火墙配置脚本
sudo ./setup-firewall.sh

# 手动配置（可选）
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔧 系统服务管理

### 创建系统服务

```bash
# 创建服务文件
sudo tee /etc/systemd/system/sales-review.service <<EOF
[Unit]
Description=Sales Review System
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/sales-review
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable sales-review
sudo systemctl start sales-review
```

### 服务管理命令

```bash
# 启动服务
sudo systemctl start sales-review

# 停止服务
sudo systemctl stop sales-review

# 重启服务
sudo systemctl restart sales-review

# 查看状态
sudo systemctl status sales-review

# 查看日志
sudo journalctl -u sales-review -f
```

## 📊 监控和日志

### 健康检查

```bash
# 检查后端健康状态
curl -f http://localhost:6093/health

# 检查前端服务
curl -f http://localhost:6092

# 检查数据库连接
sqlite3 backend/data/sales_review.db "SELECT COUNT(*) FROM users;"
```

### 日志管理

```bash
# 查看Docker日志
docker-compose logs -f

# 查看系统服务日志
sudo journalctl -u sales-review -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看应用日志
tail -f backend/logs/app.log
```

### 性能监控

```bash
# 查看系统资源
htop
df -h
free -h

# 查看Docker资源使用
docker stats

# 查看网络连接
netstat -tlnp
ss -tlnp
```

## 🔒 安全配置

### 基础安全设置

1. **SSH安全配置**
   ```bash
   # 编辑SSH配置
   sudo nano /etc/ssh/sshd_config
   
   # 禁用root登录
   PermitRootLogin no
   
   # 禁用密码认证
   PasswordAuthentication no
   
   # 启用密钥认证
   PubkeyAuthentication yes
   
   # 重启SSH服务
   sudo systemctl restart sshd
   ```

2. **防火墙配置**
   ```bash
   # 运行防火墙脚本
   sudo ./setup-firewall.sh
   
   # 查看防火墙状态
   sudo ufw status
   ```

3. **系统更新**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 设置自动更新
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

### SSL/TLS配置

1. **Let's Encrypt证书**
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d your-domain.com
   
   # 测试自动续期
   sudo certbot renew --dry-run
   ```

2. **自签名证书（开发环境）**
   ```bash
   # 生成自签名证书
   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout /etc/ssl/private/nginx-selfsigned.key \
     -out /etc/ssl/certs/nginx-selfsigned.crt
   ```

## 🚨 故障排除

### 常见问题解决

1. **端口被占用**
   ```bash
   # 查看端口占用
   sudo netstat -tlnp | grep :6092
   sudo netstat -tlnp | grep :6093
   
   # 杀死进程
   sudo kill -9 <PID>
   ```

2. **Docker容器启动失败**
   ```bash
   # 查看容器日志
   docker-compose logs
   
   # 重新构建
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **配置文件错误**
   ```bash
   # 验证配置文件
   ./test-config.sh
   
   # 从模板重新创建
   cp conf.yaml.example conf.yaml
   ```

4. **数据库问题**
   ```bash
   # 备份数据库
   cp backend/data/sales_review.db backup.db
   
   # 重置数据库
   rm backend/data/sales_review.db
   ```

5. **Nginx配置错误**
   ```bash
   # 测试配置
   sudo nginx -t
   
   # 查看错误日志
   sudo tail -f /var/log/nginx/error.log
   ```

### 性能优化

1. **系统优化**
   ```bash
   # 增加文件描述符限制
   echo "* soft nofile 65536" >> /etc/security/limits.conf
   echo "* hard nofile 65536" >> /etc/security/limits.conf
   
   # 优化内核参数
   echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
   echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Docker优化**
   ```bash
   # 配置Docker守护进程
   sudo tee /etc/docker/daemon.json <<EOF
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   EOF
   
   sudo systemctl restart docker
   ```

3. **Nginx优化**
   ```bash
   # 编辑Nginx配置
   sudo nano /etc/nginx/nginx.conf
   
   # 增加worker进程数
   worker_processes auto;
   
   # 优化连接数
   events {
     worker_connections 1024;
   }
   ```

## 📋 部署检查清单

### 部署前检查
- [ ] 服务器满足最低要求（2GB RAM, 10GB磁盘）
- [ ] 网络连接正常
- [ ] 域名解析正确（如果使用域名）
- [ ] SSL证书准备就绪（如果需要HTTPS）

### 部署后验证
- [ ] 前端服务可访问
- [ ] 后端API正常响应
- [ ] 数据库连接正常
- [ ] 文件上传功能正常
- [ ] AI报告生成功能正常
- [ ] 日志记录正常
- [ ] 监控告警配置正确

### 安全验证
- [ ] 防火墙规则正确
- [ ] SSH安全配置完成
- [ ] SSL证书有效
- [ ] 定期备份配置
- [ ] 监控系统运行

## 📞 技术支持

### 获取帮助
- 查看日志文件定位问题
- 运行诊断脚本收集信息
- 检查配置文件语法
- 验证网络连接状态

### 联系支持
- GitHub Issues: 提交问题报告
- GitHub Discussions: 功能讨论
- 文档更新: 查看最新部署指南

---

**提示**: 部署完成后，建议定期检查系统状态、更新安全补丁、备份重要数据。 