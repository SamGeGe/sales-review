# Linux移植检查清单

## 📋 项目概述
- **项目名称**: 营销中心周复盘系统
- **技术栈**: Node.js + React + MySQL + Docker
- **当前状态**: 已配置Docker容器化部署

## ✅ 已完成的配置

### 1. Docker配置 ✅
- [x] `docker-compose.yml` - 完整的服务编排
- [x] `Dockerfile` - 多阶段构建，包含所有依赖
- [x] `docker-entrypoint.sh` - 启动脚本，包含健康检查
- [x] 端口映射: 前端(6092), 后端(6093), MySQL(3306)

### 2. 数据库配置 ✅
- [x] MySQL 8.0 容器化
- [x] 数据持久化 (`mysql_data` 卷)
- [x] 初始化脚本 (`backend/init.sql`)
- [x] 默认用户: 张三(ID=1), 李四(ID=2)
- [x] 表结构完整: users, weeks, review_reports, ai_integration_reports

### 3. 配置文件 ✅
- [x] `conf.yaml` - 主配置文件
- [x] `backend/config.env` - 后端环境变量
- [x] 环境检测: 开发/生产环境自动切换
- [x] CORS配置: 支持跨域请求

### 4. 依赖管理 ✅
- [x] `package.json` - 根目录依赖管理
- [x] `backend/package.json` - 后端依赖
- [x] `frontend/package.json` - 前端依赖
- [x] 使用国内镜像源加速安装

### 5. 服务脚本 ✅
- [x] `backend/scripts/start-with-config.js` - 后端启动脚本
- [x] `frontend/scripts/start-with-config.js` - 前端启动脚本
- [x] 环境检测和配置加载
- [x] 健康检查端点

## 🔧 Linux部署前检查

### 1. 系统要求
- [ ] Docker 20.10+
- [ ] Docker Compose 2.0+
- [ ] 至少2GB内存
- [ ] 至少10GB磁盘空间
- [ ] 端口6092, 6093, 3306可用

### 2. 网络配置
- [ ] 防火墙开放端口: 6092, 6093
- [ ] 域名解析配置(如需要)
- [ ] SSL证书配置(生产环境)

### 3. 数据备份
- [ ] 导出当前数据库
- [ ] 备份配置文件
- [ ] 备份报告文件

## 🚀 部署步骤

### 1. 环境准备
```bash
# 安装Docker和Docker Compose
sudo apt update
sudo apt install docker.io docker-compose

# 启动Docker服务
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到docker组
sudo usermod -aG docker $USER
```

### 2. 项目部署
```bash
# 克隆项目
git clone <repository-url>
cd sales-review

# 复制配置文件
cp conf.yaml.example conf.yaml

# 编辑配置文件(根据需要)
nano conf.yaml

# 启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps
```

### 3. 数据迁移
```bash
# 导出当前数据
mysqldump -u root sales_review > backup.sql

# 在Linux服务器上恢复数据
docker-compose exec mysql mysql -u root sales_review < backup.sql
```

## 🔍 功能验证清单

### 1. 基础服务 ✅
- [x] MySQL数据库连接
- [x] 后端API服务启动
- [x] 前端React应用启动
- [x] 健康检查端点

### 2. 用户管理功能 ✅
- [x] 初始用户: 张三、李四
- [x] 添加新用户
- [x] 编辑用户信息
- [x] 删除用户
- [x] 用户列表显示

### 3. 复盘功能 ✅
- [x] 创建复盘报告
- [x] 编辑复盘内容
- [x] AI报告生成
- [x] 报告导出(PDF/Word)
- [x] 报告锁定功能

### 4. 周数管理 ✅
- [x] 周数列表显示
- [x] 周数详情查看
- [x] 报告统计
- [x] 整合报告生成

### 5. 文件管理 ✅
- [x] 报告文件存储
- [x] 文件下载功能
- [x] 文件路径配置

## ⚠️ 潜在问题和解决方案

### 1. 数据库连接问题
**问题**: MySQL容器启动失败
**解决**: 
```bash
# 检查MySQL日志
docker-compose logs mysql

# 重置数据卷
docker-compose down -v
docker-compose up -d
```

### 2. 端口冲突
**问题**: 端口已被占用
**解决**: 修改 `docker-compose.yml` 中的端口映射

### 3. 权限问题
**问题**: 文件权限错误
**解决**: 
```bash
# 修复文件权限
sudo chown -R $USER:$USER .
chmod +x docker-entrypoint.sh
```

### 4. 内存不足
**问题**: 容器启动失败
**解决**: 增加系统内存或调整Docker资源限制

## 📊 性能优化建议

### 1. 系统级优化
- 调整MySQL配置参数
- 设置合适的Docker资源限制
- 配置日志轮转

### 2. 应用级优化
- 启用Gzip压缩
- 配置静态文件缓存
- 优化数据库查询

### 3. 监控配置
- 设置日志监控
- 配置性能指标收集
- 设置告警机制

## 🔒 安全建议

### 1. 生产环境配置
- 修改默认密码
- 限制端口访问
- 配置SSL证书
- 设置防火墙规则

### 2. 数据安全
- 定期备份数据库
- 加密敏感数据
- 设置访问日志

## 📞 故障排除

### 1. 服务无法启动
```bash
# 查看详细日志
docker-compose logs -f

# 检查端口占用
netstat -tlnp | grep 609
```

### 2. 数据库连接失败
```bash
# 检查MySQL状态
docker-compose ps mysql

# 手动连接测试
docker-compose exec mysql mysql -u root -p
```

### 3. 前端无法访问
```bash
# 检查前端容器
docker-compose ps sales-review

# 查看前端日志
docker-compose logs sales-review
```

## ✅ 最终检查清单

### 部署前
- [ ] 系统要求满足
- [ ] 网络配置正确
- [ ] 数据已备份
- [ ] 配置文件已更新

### 部署后
- [ ] 所有容器正常启动
- [ ] 数据库连接成功
- [ ] 前端页面可访问
- [ ] 后端API正常响应
- [ ] 用户管理功能正常
- [ ] 复盘功能正常
- [ ] 文件上传下载正常

### 性能测试
- [ ] 并发用户测试
- [ ] 数据库性能测试
- [ ] 文件上传性能测试
- [ ] 内存使用监控

## 📝 部署完成确认

项目已准备好移植到Linux环境，主要特点：

1. **完整的Docker化部署** - 一键启动所有服务
2. **数据持久化** - 数据库和文件数据不会丢失
3. **环境自适应** - 自动检测开发/生产环境
4. **健康检查** - 服务状态监控
5. **配置灵活** - 支持多种部署配置
6. **故障恢复** - 完善的错误处理和日志记录

建议在Linux服务器上按照上述步骤进行部署，如有问题可参考故障排除部分。 