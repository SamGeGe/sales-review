# 销售复盘系统

一个基于AI的销售复盘管理系统，支持历史数据管理、AI报告生成和多格式导出功能。

## 🚀 功能特性

- **AI驱动报告生成** - 基于大语言模型的智能复盘报告
- **历史数据管理** - 完整的复盘历史记录和查询
- **多格式导出** - 支持Word和PDF格式的文档导出
- **用户管理** - 多用户支持和权限管理
- **Docker容器化** - 一键部署，支持本地和服务器环境
- **国内优化** - 针对国内服务器的镜像源和网络优化

## 📋 系统架构

```
销售复盘系统
├── 前端 (React + TypeScript + Ant Design)
│   ├── 复盘页面 - 数据录入和AI报告生成
│   ├── 历史页面 - 复盘记录查询和管理
│   ├── 用户管理 - 用户信息管理
│   └── 仪表板 - 数据统计和概览
├── 后端 (Node.js + Express + SQLite)
│   ├── API服务 - RESTful接口
│   ├── 数据库服务 - 数据持久化
│   ├── LLM服务 - AI报告生成
│   └── 文档生成 - Word/PDF导出
└── 部署 (Docker + Nginx)
    ├── 容器化部署
    ├── 反向代理配置
    └── SSL证书支持
```

## 🛠️ 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Docker (可选，用于容器化部署)

### 本地开发

1. **克隆项目**
```bash
   git clone https://github.com/your-username/sales-review.git
cd sales-review
```

2. **运行设置脚本**
```bash
   chmod +x setup-after-clone.sh
   ./setup-after-clone.sh
   ```

3. **配置系统**
   ```bash
   # 编辑配置文件
   nano conf.yaml
   nano frontend/public/conf.yaml
   ```

4. **启动开发环境**
```bash
   ./start-local.sh
```

5. **访问应用**
   - 前端: http://localhost:6090
   - 后端: http://localhost:6091

### Docker部署

1. **构建并启动容器**
```bash
docker-compose up -d
```

2. **访问应用**
   - 前端: http://localhost:6092
   - 后端: http://localhost:6093

## 📦 部署指南

### 本地部署

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置环境
cp conf.yaml.example conf.yaml
# 编辑 conf.yaml 填入您的配置

# 3. 启动服务
./start-local.sh
```

### Linux服务器部署

#### 标准部署
```bash
# 下载部署脚本
wget https://raw.githubusercontent.com/your-username/sales-review/main/deploy-linux.sh
chmod +x deploy-linux.sh
./deploy-linux.sh
```

#### 国内服务器优化部署
```bash
# 下载国内优化部署脚本
wget https://raw.githubusercontent.com/your-username/sales-review/main/deploy-china.sh
chmod +x deploy-china.sh
./deploy-china.sh
```

### 配置说明

#### 开发环境配置
```yaml
development:
  frontend:
    port: 6090
    backend_url: http://localhost:6091
  backend:
    port: 6091
    cors_origins:
      - http://localhost:6090
      - http://localhost:6091
```

#### 生产环境配置
```yaml
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
```

#### LLM配置
```yaml
llm:
  primary:
    base_url: "http://your-llm-server:8000/v1"
    model: "your-model-name"
    api_key: "your-api-key-here"
    timeout: 120000
    max_retries: 3
  backup:
    base_url: "https://openrouter.ai/api/v1"
    model: "your-backup-model"
    api_key: "your-backup-api-key"
    timeout: 120000
    max_retries: 3
```

## 🔧 管理命令

### 服务管理
```bash
# 启动开发环境
./start-local.sh

# 启动Docker环境
docker-compose up -d

# 停止Docker环境
docker-compose down

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

### 数据库管理
```bash
# 重置数据库
rm backend/data/sales_review.db

# 查看数据库
sqlite3 backend/data/sales_review.db ".tables"
```

### 配置测试
```bash
# 测试配置加载
./test-config.sh

# 测试部署环境
./test-deployment.sh
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

2. **依赖安装失败**
   ```bash
   # 清理缓存
   npm cache clean --force
   
   # 使用国内镜像
   npm config set registry https://registry.npmmirror.com
   ```

3. **Docker构建失败**
   ```bash
   # 清理Docker缓存
   docker system prune -a
   
   # 重新构建
   docker-compose build --no-cache
   ```

4. **配置文件错误**
```bash
   # 验证配置文件
   ./test-config.sh

   # 从模板重新创建
   cp conf.yaml.example conf.yaml
```

### 日志查看

```bash
# 后端日志
tail -f backend/logs/app.log

# Docker日志
docker-compose logs -f backend
docker-compose logs -f frontend

# Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🔒 安全配置

### 防火墙设置
```bash
# 运行防火墙配置脚本
./setup-firewall.sh
```

### SSL证书配置
```bash
# 使用Let's Encrypt
sudo certbot --nginx -d your-domain.com

# 或使用自签名证书
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

## 📊 性能优化

### 系统优化
```bash
# 增加文件描述符限制
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# 优化内核参数
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### 数据库优化
```bash
# SQLite优化
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA cache_size = 10000;
PRAGMA temp_store = MEMORY;
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 技术支持

- 项目文档: [DEPLOYMENT.md](DEPLOYMENT.md)
- 问题反馈: [GitHub Issues](https://github.com/your-username/sales-review/issues)
- 功能建议: [GitHub Discussions](https://github.com/your-username/sales-review/discussions)

---

**快速链接**:
- [部署详细指南](DEPLOYMENT.md)
- [架构文档](ARCHITECTURE.md)
- [网络配置](NETWORK_CONFIG.md) 