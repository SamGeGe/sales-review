# Linux系统部署指南

## 🚀 快速部署

### 1. 系统要求
- Docker 20.10+
- Docker Compose 2.0+
- 至少2GB内存
- 至少10GB磁盘空间

### 2. 克隆项目
```bash
git clone <your-repo-url>
cd sales-review
```

### 3. 配置环境
```bash
# 复制配置文件
cp conf.yaml.example conf.yaml

# 编辑配置文件（根据需要修改LLM配置）
nano conf.yaml
```

### 4. 启动服务
```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 5. 访问应用
- 前端地址: http://your-server-ip:6092
- 后端地址: http://your-server-ip:6093
- 健康检查: http://your-server-ip:6093/health

## 🔧 配置说明

### 数据库配置
- MySQL 8.0 容器化部署
- 数据持久化存储在 `mysql_data` 卷
- 默认数据库: `sales_review`
- 默认用户: `root` (无密码)

### 端口映射
- 前端: 6092 -> 6090
- 后端: 6093 -> 6091
- MySQL: 3306 -> 3306

### 文件持久化
- 报告文件: `./backend/reports`
- 上传文件: `./backend/uploads`
- 配置文件: `./conf.yaml`

## 🛠️ 管理命令

### 查看服务状态
```bash
docker-compose ps
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f sales-review
docker-compose logs -f mysql
```

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart sales-review
```

### 停止服务
```bash
docker-compose down
```

### 完全清理（包括数据）
```bash
docker-compose down -v
```

## 🔍 故障排除

### 1. 服务启动失败
```bash
# 查看详细日志
docker-compose logs sales-review

# 检查端口占用
netstat -tlnp | grep 609
```

### 2. MySQL连接失败
```bash
# 检查MySQL容器状态
docker-compose ps mysql

# 查看MySQL日志
docker-compose logs mysql

# 手动连接MySQL
docker-compose exec mysql mysql -u root -p
```

### 3. 前端无法访问
```bash
# 检查前端容器状态
docker-compose ps sales-review

# 查看前端日志
docker-compose logs sales-review | grep frontend
```

### 4. 后端API错误
```bash
# 检查后端健康状态
curl http://localhost:6093/health

# 查看后端日志
docker-compose logs sales-review | grep backend
```

## 📊 性能优化

### 1. 资源限制
在 `docker-compose.yml` 中添加资源限制：
```yaml
services:
  sales-review:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

### 2. MySQL优化
```yaml
services:
  mysql:
    command: >
      --default-authentication-plugin=mysql_native_password
      --innodb-buffer-pool-size=256M
      --max-connections=100
```

## 🔒 安全建议

### 1. 修改默认密码
```bash
# 修改MySQL root密码
docker-compose exec mysql mysql -u root -e "ALTER USER 'root'@'%' IDENTIFIED BY 'your-secure-password';"
```

### 2. 限制端口访问
```bash
# 只允许特定IP访问
iptables -A INPUT -p tcp --dport 6092 -s your-ip -j ACCEPT
iptables -A INPUT -p tcp --dport 6093 -s your-ip -j ACCEPT
```

### 3. 使用HTTPS
建议在生产环境中配置Nginx反向代理和SSL证书。

## 📝 更新部署

### 1. 更新代码
```bash
git pull origin main
docker-compose down
docker-compose up -d --build
```

### 2. 数据库迁移
```bash
# 备份数据
docker-compose exec mysql mysqldump -u root sales_review > backup.sql

# 恢复数据
docker-compose exec -T mysql mysql -u root sales_review < backup.sql
```

## 📞 技术支持

如果遇到问题，请检查：
1. Docker和Docker Compose版本
2. 系统资源使用情况
3. 网络连接状态
4. 防火墙设置
5. 日志文件中的错误信息 