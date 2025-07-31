# 部署指南

## 🚀 快速部署

本指南提供销售复盘系统的简化部署方案，支持开发模式和Docker模式。

## 📋 部署方案

### 方案一：开发模式
- **适用场景**: 本地开发、功能测试
- **端口**: 前端 6090, 后端 6091
- **特点**: 快速启动、实时热重载

### 方案二：Docker模式
- **适用场景**: 生产环境、服务器部署
- **端口**: 前端 6092, 后端 6093
- **特点**: 环境一致、易于管理

## 🛠️ 开发模式部署

### Mac/Linux 环境准备

1. **安装Node.js**
   ```bash
   # Mac (使用Homebrew)
   brew install node
   
   # Linux (Ubuntu/Debian)
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

# 访问应用
# 前端: http://localhost:6090
# 后端: http://localhost:6091
```

## 🐳 Docker模式部署

### 环境准备

1. **安装Docker**
   ```bash
   # Mac
   # 下载并安装 Docker Desktop
   # https://www.docker.com/products/docker-desktop
   
   # Linux (Ubuntu/Debian)
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
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
       "https://hub-mirror.c.163.com"
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

### Docker镜像问题解决

如果遇到镜像拉取失败的问题，可以尝试以下解决方案：

#### 方案1：使用官方镜像（推荐）
```bash
# 当前Dockerfile已使用官方镜像
docker-compose build
```

#### 方案2：使用备用镜像源
如果官方镜像无法访问，可以修改Dockerfile：

```bash
# 编辑Dockerfile，将第一行改为：
# FROM ccr.ccs.tencentyun.com/library/node:18-alpine
# 或
# FROM registry.cn-hangzhou.aliyuncs.com/nodejs/node:18-alpine

# 然后重新构建
docker-compose build --no-cache
```

#### 方案3：手动拉取镜像
```bash
# 手动拉取Node.js镜像
docker pull node:18-alpine

# 然后构建
docker-compose build
```

#### 方案4：使用代理
```bash
# 设置Docker代理
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo tee /etc/systemd/system/docker.service.d/http-proxy.conf <<EOF
[Service]
Environment="HTTP_PROXY=http://your-proxy:port"
Environment="HTTPS_PROXY=http://your-proxy:port"
Environment="NO_PROXY=localhost,127.0.0.1"
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
```

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

## 🌐 公网访问配置

### 使用Nginx反向代理

1. **安装Nginx**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install nginx
   
   # Mac
   brew install nginx
   ```

2. **配置Nginx**
   ```bash
   # 复制配置文件
   sudo cp nginx.conf /etc/nginx/sites-available/sales-review
   
   # 编辑配置（替换your-domain.com为您的域名）
   sudo nano /etc/nginx/sites-available/sales-review
   
   # 启用站点
   sudo ln -s /etc/nginx/sites-available/sales-review /etc/nginx/sites-enabled/
   
   # 测试配置
   sudo nginx -t
   
   # 重启Nginx
   sudo systemctl restart nginx
   ```

3. **配置SSL证书（可选）**
   ```bash
   # 安装Certbot
   sudo apt install certbot python3-certbot-nginx
   
   # 获取证书
   sudo certbot --nginx -d your-domain.com
   ```

### 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔧 常用管理命令

### 开发模式管理

```bash
# 启动开发环境
./start-local.sh

# 停止服务
pkill -f "node.*backend"
pkill -f "react-scripts"

# 查看端口占用
lsof -i :6090
lsof -i :6091
```

### Docker模式管理

```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart
```

### 数据库管理

```bash
# ⚠️ 警告：以下命令会删除所有数据，请谨慎使用！

# 重置数据库（仅在需要清空所有数据时使用）
# rm backend/data/sales_review.db

# 查看数据库
mysql -u root -p sales_review -e "SHOW TABLES;"

# 备份数据库
cp backend/data/sales_review.db backend/data/sales_review.db.backup.$(date +%Y%m%d_%H%M%S)

# 恢复数据库
# cp backend/data/sales_review.db.backup.20250101_120000 backend/data/sales_review.db
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查看端口占用
   lsof -i :6090
   lsof -i :6091
   
   # 杀死进程
   kill -9 <PID>
   ```

2. **Docker容器启动失败**
   ```bash
   # 查看容器日志
   docker-compose logs
   
   # 重新构建
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Docker镜像拉取失败**
   ```bash
   # 清理Docker缓存
   docker system prune -a
   
   # 手动拉取镜像
   docker pull node:18-alpine
   
   # 使用备用镜像源
   # 编辑Dockerfile，更换FROM指令
   ```

4. **配置文件错误**
   ```bash
   # 从模板重新创建
   cp conf.yaml.example conf.yaml
   cp conf.yaml.example frontend/public/conf.yaml
   ```

5. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   
   # 使用国内镜像
   npm config set registry https://registry.npmmirror.com
   ```

### 日志查看

```bash
# 开发模式日志
tail -f backend/logs/app.log

# Docker日志
docker-compose logs -f

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📋 部署检查清单

### 开发模式
- [ ] Node.js 18+ 已安装
- [ ] 配置文件已创建并编辑
- [ ] 依赖已安装
- [ ] 服务正常启动
- [ ] 端口未被占用

### Docker模式
- [ ] Docker已安装
- [ ] Docker Compose已安装
- [ ] 镜像构建成功
- [ ] 容器正常启动
- [ ] 端口映射正确

### 公网访问
- [ ] Nginx已安装并配置
- [ ] 防火墙规则正确
- [ ] 域名解析正确
- [ ] SSL证书有效（如需要）

---

**提示**: 
- 开发模式适合本地开发和测试
- Docker模式适合生产环境部署
- 公网访问需要配置Nginx和防火墙
- 如果Docker镜像拉取失败，请尝试使用备用镜像源 