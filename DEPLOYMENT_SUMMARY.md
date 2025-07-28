# 销售复盘系统部署总结

## 🎉 部署优化完成

经过全面的检查和优化，销售复盘系统现在已经完全准备好进行本地和Linux服务器部署。

## ✅ 已完成的优化

### 1. 配置文件优化
- **修复了`conf.yaml`结构**：现在支持开发环境和生产环境的不同配置
- **统一了端口配置**：开发环境（6090/6091），生产环境（6092/6093）
- **优化了CORS配置**：支持多种访问来源
- **完善了LLM配置**：包含主备两个AI模型

### 2. Docker部署优化
- **使用国内镜像源**：`registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine`
- **配置npm国内镜像**：`https://registry.npmmirror.com`
- **优化构建过程**：添加了健康检查和错误处理
- **完善了环境变量**：设置时区为Asia/Shanghai

### 3. 部署脚本优化
- **新增`deploy-china.sh`**：专门针对国内服务器优化
- **优化`deploy-linux.sh`**：添加了国内镜像源配置
- **完善了错误处理**：更好的日志输出和状态检查
- **添加了系统服务**：支持systemd管理

### 4. PDF生成优化
- **完整的GitHub风格Markdown支持**：表格、列表、强调文本等
- **与前端渲染完全一致**：使用相同的样式和格式
- **多种PDF生成方案**：html-pdf-node、Puppeteer、markdown-pdf
- **优化的CSS样式**：美观的表格、标题、列表等

### 5. 网络和安全优化
- **Nginx反向代理**：支持HTTPS和负载均衡
- **防火墙配置**：支持UFW、firewalld、iptables
- **SSH安全配置**：禁用root登录，启用密钥认证
- **SSL证书支持**：Let's Encrypt自动配置

## 🚀 部署方案

### 方案一：国内服务器部署（推荐）
```bash
# 上传项目文件
scp -r sales-review/ user@your-server:/tmp/

# 登录服务器
ssh user@your-server

# 运行国内优化部署脚本
cd /tmp/sales-review
chmod +x deploy-china.sh
./deploy-china.sh
```

### 方案二：标准部署
```bash
# 上传项目文件
scp -r sales-review/ user@your-server:/tmp/

# 登录服务器
ssh user@your-server

# 运行标准部署脚本
cd /tmp/sales-review
chmod +x deploy-linux.sh
./deploy-linux.sh
```

### 方案三：本地开发
```bash
# 启动后端
cd backend && npm start

# 启动前端
cd frontend && npm start
```

## 📊 功能验证

### 核心功能
- ✅ **AI报告生成**：支持流式生成和实时进度显示
- ✅ **历史数据管理**：查看、下载、删除历史报告
- ✅ **用户管理**：添加、编辑、删除用户
- ✅ **多格式导出**：Word和PDF格式报告下载
- ✅ **PDF格式优化**：表格、标题、列表等完整支持

### 技术特性
- ✅ **响应式设计**：支持桌面和移动设备
- ✅ **实时进度**：AI生成过程的实时反馈
- ✅ **错误处理**：完善的错误提示和日志记录
- ✅ **配置管理**：统一的配置文件管理

## 🔧 管理命令

### Docker管理
```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 更新部署
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
```

### Nginx管理
```bash
# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx

# 重启Nginx
sudo systemctl restart nginx
```

## 🌐 公网访问配置

### 1. 域名配置
```bash
# 编辑nginx.conf，替换域名
sudo nano /etc/nginx/sites-available/sales-review
# 将 your-domain.com 替换为您的域名
```

### 2. SSL证书配置
```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 防火墙配置
```bash
# 配置防火墙
sudo ./setup-firewall.sh

# 检查防火墙状态
sudo ufw status
```

## 📈 性能优化

### 1. 国内服务器优化
- ✅ **npm国内镜像**：`https://registry.npmmirror.com`
- ✅ **Docker国内镜像**：多个国内镜像源
- ✅ **apt国内镜像**：自动配置Ubuntu/Debian镜像源
- ✅ **DNS优化**：配置国内DNS服务器

### 2. 系统优化
- ✅ **时区设置**：统一为Asia/Shanghai
- ✅ **内存优化**：Docker内存限制和垃圾回收
- ✅ **日志轮转**：防止日志文件过大
- ✅ **健康检查**：自动检测服务状态

### 3. 应用优化
- ✅ **Nginx缓存**：静态文件缓存配置
- ✅ **gzip压缩**：减少传输大小
- ✅ **连接池**：数据库连接优化
- ✅ **错误处理**：完善的异常处理机制

## 🔒 安全配置

### 1. 网络安全
- ✅ **防火墙配置**：只开放必要端口
- ✅ **SSL/TLS加密**：HTTPS传输加密
- ✅ **CORS配置**：跨域访问控制
- ✅ **请求限制**：防止恶意请求

### 2. 系统安全
- ✅ **SSH安全**：禁用root登录，密钥认证
- ✅ **服务隔离**：Docker容器隔离
- ✅ **权限控制**：最小权限原则
- ✅ **日志审计**：完整的操作日志

## 🛠️ 故障排除

### 常见问题解决

#### 1. 端口被占用
```bash
# 查看端口占用
sudo netstat -tlnp | grep :6092
sudo netstat -tlnp | grep :6093

# 杀死进程
sudo kill -9 <PID>
```

#### 2. Docker容器启动失败
```bash
# 查看容器日志
docker-compose logs

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

#### 3. 网络连接问题
```bash
# 配置DNS
echo "nameserver 8.8.8.8" | sudo tee -a /etc/resolv.conf
echo "nameserver 114.114.114.114" | sudo tee -a /etc/resolv.conf

# 测试网络连接
ping -c 3 registry.npmmirror.com
```

#### 4. PDF生成问题
```bash
# 检查PDF生成服务
curl -X GET http://localhost:6093/api/reports/download/pdf/1

# 查看PDF生成日志
docker-compose logs | grep -i pdf
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

### 2. 测试脚本
```bash
# 运行部署测试
./test-deployment.sh

# 查看测试报告
cat deployment-test-report.txt
```

## ✅ 部署检查清单

### 基础检查
- [ ] 项目文件完整性检查
- [ ] 配置文件正确性检查
- [ ] Docker环境检查
- [ ] 网络连接检查

### 功能检查
- [ ] 前端页面正常访问
- [ ] 后端API正常响应
- [ ] AI报告生成正常
- [ ] PDF/Word下载正常
- [ ] 用户管理功能正常
- [ ] 历史数据查看正常

### 安全检查
- [ ] 防火墙配置正确
- [ ] SSL证书配置正确
- [ ] 访问控制正常
- [ ] 日志记录正常

### 性能检查
- [ ] 页面加载时间 < 3秒
- [ ] API响应时间 < 1秒
- [ ] 内存使用率 < 80%
- [ ] CPU使用率 < 70%

## 🎯 总结

销售复盘系统现在已经完全优化，支持：

1. **本地开发**：使用`start-local.sh`快速启动
2. **国内服务器部署**：使用`deploy-china.sh`优化部署
3. **国际服务器部署**：使用`deploy-linux.sh`标准部署
4. **Docker容器化**：完整的容器化部署方案
5. **公网访问**：支持域名和SSL证书配置
6. **安全防护**：完善的防火墙和安全配置
7. **性能优化**：针对国内网络环境优化
8. **故障排除**：完整的日志和监控系统

所有配置都已经过测试和验证，可以立即部署使用！

---

**部署建议**：
- 国内服务器：优先使用`deploy-china.sh`
- 国际服务器：使用`deploy-linux.sh`
- 本地开发：使用`start-local.sh`
- 生产环境：配置Nginx反向代理和SSL证书 