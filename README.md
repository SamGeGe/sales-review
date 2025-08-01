# 销售复盘系统

一个基于AI的销售复盘管理系统，支持历史数据管理、AI报告生成和多格式导出功能。

## 🚀 功能特性

- **AI驱动报告生成** - 基于大语言模型的智能复盘报告
- **历史数据管理** - 完整的复盘历史记录和查询
- **多格式导出** - 支持Word和PDF格式的文档导出
- **用户管理** - 多用户支持和权限管理
- **Docker容器化** - 一键部署，支持本地和服务器环境
- **国内优化** - 针对国内服务器的镜像源和网络优化
- **AI整合报告** - 支持多用户复盘数据的智能整合分析
- **数据准确性保障** - 严格的数据约束，确保AI分析基于真实数据

## 📋 系统架构

```
销售复盘系统
├── 前端 (React + TypeScript + Ant Design)
│   ├── 复盘页面 - 数据录入和AI报告生成
│   ├── 历史页面 - 复盘记录查询和管理
│   ├── 用户管理 - 用户信息管理
│   └── 仪表板 - 数据统计和概览
├── 后端 (Node.js + Express + MySQL)
│   ├── API服务 - RESTful接口
│   ├── 数据库服务 - 数据持久化
│   ├── LLM服务 - AI报告生成
│   └── 文档生成 - Word/PDF导出
└── 部署 (Docker + Nginx)
    ├── 容器化部署
    ├── 反向代理配置
    └── SSL证书支持
```

## 🔧 最新更新

### 依赖更新 (2025-01-01)
- ✅ **并发运行支持** - 新增 `concurrently` 依赖，支持前后端服务并发启动
- ✅ **MySQL数据库支持** - 新增 `mysql2` 依赖，提供完整的MySQL数据库支持
- ✅ **Stagewise集成** - 新增 `@stagewise-plugins/react` 和 `@stagewise/toolbar-react` 依赖
- ✅ **Markdown渲染** - 新增 `react-markdown` 和 `remark-gfm` 依赖，支持富文本内容渲染

### AI整合报告优化 (2025-08-01)
- ✅ **数据传递完整性** - 修复了AI整合报告生成时原始数据传递不完整的问题
- ✅ **数据约束机制** - 添加了严格的数据约束条件，确保LLM只基于真实数据进行分析
- ✅ **格式统一性** - 优化了复盘历史页面的AI报告显示格式，与复盘明细页面保持一致
- ✅ **推测防范** - 防止LLM进行推测或虚构结论，提高报告准确性

### 技术改进
- **完整数据传递** - AI整合报告现在能够接收完整的原始复盘数据
- **严格数据约束** - LLM只能基于用户实际填写的数据进行分析
- **格式优化** - 统一的报告显示格式，提供更好的用户体验

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

2. **安装依赖**
```bash
# 安装根目录依赖（包括concurrently）
npm install

# 安装前端依赖
cd frontend && npm install && cd ..

# 安装后端依赖
cd backend && npm install && cd ..

# 或者使用一键安装
npm run install-all
```

3. **运行设置脚本**
```bash
chmod +x setup-after-clone.sh
./setup-after-clone.sh
```

4. **配置系统**
```bash
# 编辑配置文件
nano conf.yaml
nano frontend/public/conf.yaml
```

5. **启动开发环境**
```bash
./start-local.sh
```

6. **访问应用**
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
# 安装根目录依赖
npm install

# 安装前端依赖
cd frontend && npm install && cd ..

# 安装后端依赖
cd backend && npm install && cd ..

# 或者使用一键安装
npm run install-all

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
# ⚠️ 警告：以下命令会删除所有数据，请谨慎使用！

# 查看数据库
mysql -u root -p sales_review -e "SHOW TABLES;"

# 备份数据库
mysqldump -u root -p sales_review > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
# mysql -u root -p sales_review < backup_20250101_120000.sql

# 重置数据库（仅在需要清空所有数据时使用）
# mysql -u root -p -e "DROP DATABASE sales_review; CREATE DATABASE sales_review;"
```

### 配置测试
```bash
# 测试配置加载
./test-config.sh

# 测试部署环境
./test-deployment.sh

# 测试数据传递（新增）
cd backend && node test-data-passing.js
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
   # 清理npm缓存
   npm cache clean --force
   
   # 使用国内镜像
   npm config set registry https://registry.npmmirror.com
   
   # 重新安装依赖
   npm run install-all
   
   # 如果Stagewise依赖安装失败
   cd frontend && npm install @stagewise-plugins/react @stagewise/toolbar-react --registry=https://registry.npmmirror.com
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

5. **AI整合报告数据为空**（新增）
   ```bash
   # 检查数据传递
   cd backend && node test-data-passing.js
   
   # 检查数据库中的原始数据
   sqlite3 data/sales_review.db "SELECT user_name, last_week_actions, week_plan FROM review_reports WHERE week_number = 31;"
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
# MySQL优化
# 编辑MySQL配置文件 /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
max_connections = 200
query_cache_size = 128M
query_cache_type = 1
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
- AI整合报告优化文档: [AI_INTEGRATION_REPORT_IMPROVEMENTS.md](AI_INTEGRATION_REPORT_IMPROVEMENTS.md)

---

**快速链接**:
- [部署详细指南](DEPLOYMENT.md)
- [架构文档](ARCHITECTURE.md)
- [网络配置](NETWORK_CONFIG.md)
- [AI整合报告优化](AI_INTEGRATION_REPORT_IMPROVEMENTS.md)
- [依赖更新文档](DEPENDENCIES_UPDATE.md) 