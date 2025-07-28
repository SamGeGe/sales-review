# 销售复盘系统部署检查清单

## 📋 部署前检查

### 1. 系统要求
- [ ] Linux服务器（Ubuntu 18.04+ 或 CentOS 7+）
- [ ] 至少2GB内存
- [ ] 至少10GB可用磁盘空间
- [ ] 网络连接正常
- [ ] 域名已解析到服务器IP（可选）

### 2. 文件完整性检查
- [ ] `conf.yaml` 配置文件存在
- [ ] `deploy-linux.sh` 部署脚本存在
- [ ] `deploy-china.sh` 国内部署脚本存在
- [ ] `docker-compose.yml` 文件存在
- [ ] `Dockerfile` 文件存在
- [ ] `nginx.conf` 配置文件存在
- [ ] `setup-firewall.sh` 防火墙脚本存在

### 3. 配置文件检查
- [ ] `conf.yaml` 中的端口配置正确
- [ ] `conf.yaml` 中的LLM配置正确
- [ ] `nginx.conf` 中的域名配置已更新
- [ ] `docker-compose.yml` 中的端口映射正确

## 🚀 部署步骤

### 方案一：国内服务器部署（推荐）

```bash
# 1. 上传项目文件到服务器
scp -r sales-review/ user@your-server:/tmp/

# 2. 登录服务器
ssh user@your-server

# 3. 进入项目目录
cd /tmp/sales-review

# 4. 运行国内优化部署脚本
chmod +x deploy-china.sh
./deploy-china.sh
```

### 方案二：标准部署

```bash
# 1. 上传项目文件到服务器
scp -r sales-review/ user@your-server:/tmp/

# 2. 登录服务器
ssh user@your-server

# 3. 进入项目目录
cd /tmp/sales-review

# 4. 运行标准部署脚本
chmod +x deploy-linux.sh
./deploy-linux.sh
```

### 方案三：Docker Compose部署

```bash
# 1. 构建并启动服务
docker-compose build --no-cache
docker-compose up -d

# 2. 检查服务状态
docker-compose ps
docker-compose logs -f
```

## 🔧 部署后配置

### 1. 防火墙配置
```bash
# 配置防火墙规则
sudo ./setup-firewall.sh

# 检查防火墙状态
sudo ufw status
```

### 2. Nginx反向代理配置
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

### 3. SSL证书配置（可选）
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 服务验证

### 1. 健康检查
```bash
# 检查后端健康状态
curl http://localhost:6093/health

# 检查前端服务
curl http://localhost:6092

# 检查Docker容器状态
docker-compose ps
```

### 2. 日志检查
```bash
# 查看Docker容器日志
docker-compose logs -f

# 查看系统服务日志
sudo journalctl -u sales-review -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. 功能测试
- [ ] 前端页面可以正常访问
- [ ] 后端API可以正常调用
- [ ] AI报告生成功能正常
- [ ] PDF/Word下载功能正常
- [ ] 用户管理功能正常
- [ ] 历史数据查看功能正常

## 🔒 安全配置

### 1. 防火墙设置
- [ ] SSH端口（22）已开放
- [ ] HTTP端口（80）已开放
- [ ] HTTPS端口（443）已开放
- [ ] 应用端口（6092/6093）已配置

### 2. SSH安全配置
- [ ] 禁用root直接登录
- [ ] 配置密钥认证
- [ ] 禁用密码认证
- [ ] 更改默认SSH端口（可选）

### 3. 系统安全
- [ ] 定期更新系统
- [ ] 配置日志轮转
- [ ] 设置备份策略
- [ ] 监控系统资源

## 🛠️ 故障排除

### 1. 常见问题

#### 端口被占用
```bash
# 查看端口占用
sudo netstat -tlnp | grep :6092
sudo netstat -tlnp | grep :6093

# 杀死进程
sudo kill -9 <PID>
```

#### Docker容器启动失败
```bash
# 查看容器日志
docker-compose logs

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

#### Nginx配置错误
```bash
# 测试配置
sudo nginx -t

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

#### 数据库问题
```bash
# 检查数据库文件
ls -la /opt/sales-review/backend/data/

# 备份数据库
cp /opt/sales-review/backend/data/sales_review.db backup.db
```

### 2. 国内服务器特殊问题

#### 网络连接问题
```bash
# 配置DNS
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 114.114.114.114" | sudo tee -a /etc/resolv.conf

# 测试网络连接
ping -c 3 registry.npmmirror.com
```

#### 镜像源问题
```bash
# 重新配置npm镜像
npm config set registry https://registry.npmmirror.com

# 重新配置Docker镜像
sudo systemctl restart docker
```

## 📈 性能优化

### 1. 系统优化
- [ ] 配置swap分区
- [ ] 优化文件描述符限制
- [ ] 配置内核参数
- [ ] 启用日志轮转

### 2. 应用优化
- [ ] 配置Nginx缓存
- [ ] 启用gzip压缩
- [ ] 配置静态文件缓存
- [ ] 优化数据库查询

### 3. 监控配置
- [ ] 配置系统监控
- [ ] 设置告警规则
- [ ] 配置日志分析
- [ ] 设置备份策略

## 🔄 更新部署

### 1. 代码更新
```bash
# 停止服务
sudo systemctl stop sales-review

# 更新代码
git pull origin main

# 重新构建
docker-compose build --no-cache

# 启动服务
sudo systemctl start sales-review
```

### 2. 配置更新
```bash
# 更新配置文件
sudo cp conf.yaml /opt/sales-review/conf.yaml

# 重启服务
sudo systemctl restart sales-review
```

### 3. 数据库备份
```bash
# 创建备份
cp /opt/sales-review/backend/data/sales_review.db backup_$(date +%Y%m%d_%H%M%S).db

# 恢复备份
cp backup_20250101_120000.db /opt/sales-review/backend/data/sales_review.db
```

## 📞 技术支持

### 1. 日志收集
```bash
# 收集系统信息
uname -a
cat /etc/os-release
free -h
df -h

# 收集应用日志
docker-compose logs > app.log
sudo journalctl -u sales-review > service.log
```

### 2. 问题报告
- 提供系统信息
- 提供错误日志
- 提供复现步骤
- 提供期望行为

## ✅ 部署完成检查

### 1. 基础功能
- [ ] 前端页面正常访问
- [ ] 后端API正常响应
- [ ] 数据库连接正常
- [ ] 文件上传下载正常

### 2. 核心功能
- [ ] 用户登录注册正常
- [ ] AI报告生成正常
- [ ] 历史数据查看正常
- [ ] PDF/Word下载正常

### 3. 安全功能
- [ ] 防火墙配置正确
- [ ] SSL证书配置正确
- [ ] 访问控制正常
- [ ] 日志记录正常

### 4. 性能指标
- [ ] 页面加载时间 < 3秒
- [ ] API响应时间 < 1秒
- [ ] 内存使用率 < 80%
- [ ] CPU使用率 < 70%

---

**注意**：部署完成后，请定期检查系统状态和日志，确保服务稳定运行。 