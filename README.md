# 销售复盘系统

一个专业的政府客户营销复盘系统，支持AI驱动的报告生成、历史数据管理和团队协作。

## 🌟 功能特性

- **AI报告生成**：基于用户输入自动生成专业的复盘报告
- **历史数据管理**：查看、下载、删除历史复盘报告
- **用户管理**：维护被复盘人信息
- **多格式导出**：支持Word和PDF格式报告下载
- **实时进度**：AI生成过程的实时进度显示
- **响应式设计**：支持桌面和移动设备访问

## 🚀 快速开始

### 本地开发环境

#### 前置要求
- Node.js 18+
- npm 或 yarn

#### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd sales-review
```

2. **安装依赖**
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

3. **启动服务**
```bash
# 启动后端服务（端口6091）
cd backend
npm start

# 启动前端服务（端口6090）
cd frontend
npm start
```

4. **访问应用**
- 前端：http://localhost:6090
- 后端：http://localhost:6091

### Docker部署

#### 本地Docker部署

1. **构建并启动**
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

2. **访问应用**
- 前端：http://localhost:6092
- 后端：http://localhost:6093

#### Linux服务器部署

1. **上传项目文件**
```bash
# 将项目文件上传到服务器
scp -r sales-review/ user@your-server:/tmp/
```

2. **运行部署脚本**
```bash
# 登录服务器
ssh user@your-server

# 进入项目目录
cd /tmp/sales-review

# 运行部署脚本
chmod +x deploy-linux.sh
./deploy-linux.sh
```

3. **配置防火墙**
```bash
# 配置防火墙规则
sudo ./setup-firewall.sh
```

4. **配置Nginx反向代理（推荐）**
```bash
# 安装Nginx
sudo apt update
sudo apt install nginx

# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/sales-review

# 编辑配置文件，替换域名
sudo nano /etc/nginx/sites-available/sales-review

# 启用站点
sudo ln -s /etc/nginx/sites-available/sales-review /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

5. **配置SSL证书（可选）**
```bash
# 使用Let's Encrypt获取免费SSL证书
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌐 公网访问配置

### 方案一：Nginx反向代理（推荐）

1. **配置Nginx**
```bash
# 编辑nginx.conf文件，替换your-domain.com为您的域名
sudo nano /etc/nginx/sites-available/sales-review
```

2. **启用HTTPS**
```bash
# 获取SSL证书
sudo certbot --nginx -d your-domain.com
```

3. **访问地址**
- HTTP：http://your-domain.com
- HTTPS：https://your-domain.com

### 方案二：直接端口暴露

1. **开放端口**
```bash
# 配置防火墙开放端口
sudo ./setup-firewall.sh
```

2. **访问地址**
- 前端：http://your-server-ip:6092
- 后端：http://your-server-ip:6093

## 🔧 管理命令

### Docker管理
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新并重启
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 系统服务管理
```bash
# 查看服务状态
sudo systemctl status sales-review

# 启动服务
sudo systemctl start sales-review

# 停止服务
sudo systemctl stop sales-review

# 重启服务
sudo systemctl restart sales-review

# 查看日志
sudo journalctl -u sales-review -f
```

### Nginx管理
```bash
# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx

# 重启Nginx
sudo systemctl restart nginx

# 查看状态
sudo systemctl status nginx
```

## 📊 监控和日志

### 健康检查
```bash
# 检查后端健康状态
curl http://localhost:6093/health

# 检查前端服务
curl http://localhost:6092
```

### 日志查看
```bash
# Docker容器日志
docker-compose logs -f

# 系统服务日志
sudo journalctl -u sales-review -f

# Nginx访问日志
sudo tail -f /var/log/nginx/access.log

# Nginx错误日志
sudo tail -f /var/log/nginx/error.log
```

## 🔒 安全配置

### 防火墙设置
```bash
# 配置防火墙
sudo ./setup-firewall.sh

# 查看防火墙状态
sudo ufw status
```

### SSL证书管理
```bash
# 查看证书状态
sudo certbot certificates

# 手动续期
sudo certbot renew

# 删除证书
sudo certbot delete --cert-name your-domain.com
```

## 🧪 配置测试

### 验证配置读取
运行配置测试脚本验证所有配置是否正确读取：

```bash
# 运行配置测试
./test-config.sh
```

测试内容包括：
- ✅ conf.yaml文件存在性检查
- ✅ 前端配置读取测试
- ✅ 后端配置读取测试
- ✅ Docker配置验证
- ✅ Nginx配置验证

## 🛠️ 故障排除

### 常见问题

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
```

3. **Nginx配置错误**
```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

4. **数据库问题**
```bash
# 检查数据库文件
ls -la /opt/sales-review/backend/data/

# 备份数据库
cp /opt/sales-review/backend/data/sales_review.db backup.db
```

## 📝 配置说明

### 配置文件读取
**重要**：系统所有配置都从 `conf.yaml` 文件读取，支持开发环境和生产环境的不同配置。

### 配置文件结构
```yaml
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
```

### 环境变量（仅用于Docker环境标识）
- `NODE_ENV`：运行环境（development/production）
- `DOCKER_ENV`：Docker环境标识
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`：跳过Chromium下载
- `PUPPETEER_EXECUTABLE_PATH`：Chromium可执行文件路径

### 配置文件位置
- `conf.yaml`：主配置文件（根目录）
- `frontend/public/conf.yaml`：前端访问的配置文件副本
- `nginx.conf`：Nginx反向代理配置
- `docker-compose.yml`：Docker Compose配置

## 🇨🇳 国内服务器部署优化

### 1. 使用国内镜像源
```bash
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
sudo systemctl daemon-reload
sudo systemctl restart docker
```

### 2. 优化Docker构建
```bash
# 使用国内基础镜像
# 在Dockerfile中使用阿里云镜像
FROM registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine
```

### 3. 网络优化
```bash
# 配置DNS
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 114.114.114.114" | sudo tee -a /etc/resolv.conf
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件
- 微信群讨论

---

**注意**：在生产环境中部署时，请确保：
- 配置适当的防火墙规则
- 使用HTTPS加密传输
- 定期备份数据库
- 监控系统资源使用情况
- 设置日志轮转和清理策略 