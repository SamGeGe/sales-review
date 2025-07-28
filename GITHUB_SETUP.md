# GitHub 推送指南

## 🚀 推送前准备

### 1. 检查文件状态
```bash
# 查看哪些文件会被上传
git status

# 查看被忽略的文件
git status --ignored
```

### 2. 确认重要文件已包含
以下文件应该被上传到GitHub：
- ✅ 所有源代码文件（`.js`, `.ts`, `.tsx`, `.css`, `.html`）
- ✅ 配置文件（`conf.yaml`, `docker-compose.yml`, `Dockerfile`）
- ✅ 部署脚本（`deploy-*.sh`, `setup-firewall.sh`）
- ✅ 文档文件（`README.md`, `*.md`）
- ✅ 依赖定义（`package.json`, `package-lock.json`）

### 3. 确认敏感文件已忽略
以下文件已被`.gitignore`忽略：
- ❌ 数据库文件（`*.db`, `backend/data/`）
- ❌ 日志文件（`*.log`, `logs/`）
- ❌ 临时文件（`*.tmp`, `*.temp`）
- ❌ 构建产物（`node_modules/`, `build/`, `dist/`）
- ❌ 环境变量文件（`.env*`）
- ❌ 系统文件（`.DS_Store`, `Thumbs.db`）
- ❌ 测试文件（`test-*.pdf`, `test-*.docx`）

## 📋 推送步骤

### 1. 初始化Git仓库（如果还没有）
```bash
# 初始化Git仓库
git init

# 添加远程仓库（替换为您的GitHub仓库URL）
git remote add origin https://github.com/your-username/sales-review.git
```

### 2. 添加文件到暂存区
```bash
# 添加所有文件（除了.gitignore中忽略的文件）
git add .

# 检查暂存区状态
git status
```

### 3. 创建首次提交
```bash
# 创建首次提交
git commit -m "Initial commit: 销售复盘系统

- 完整的销售复盘系统
- 支持AI报告生成
- 支持历史数据管理
- 支持多格式导出（Word/PDF）
- Docker容器化部署
- 国内服务器优化
- 完整的部署文档"
```

### 4. 推送到GitHub
```bash
# 推送到主分支
git push -u origin main

# 如果使用master分支
git push -u origin master
```

## 🔧 后续维护

### 1. 日常更新流程
```bash
# 查看修改状态
git status

# 添加修改的文件
git add .

# 提交修改
git commit -m "描述您的修改内容"

# 推送到远程仓库
git push
```

### 2. 分支管理（推荐）
```bash
# 创建开发分支
git checkout -b develop

# 在开发分支上工作
# ... 进行修改 ...

# 提交到开发分支
git add .
git commit -m "开发功能描述"
git push origin develop

# 合并到主分支
git checkout main
git merge develop
git push origin main
```

### 3. 版本标签
```bash
# 创建版本标签
git tag -a v1.0.0 -m "版本 1.0.0 - 初始发布"

# 推送标签
git push origin v1.0.0
```

## 📝 提交信息规范

### 1. 提交信息格式
```
类型(范围): 简短描述

详细描述（可选）

- 功能点1
- 功能点2
- 修复问题1
```

### 2. 类型说明
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 3. 示例
```bash
git commit -m "feat(部署): 添加国内服务器部署脚本

- 新增 deploy-china.sh 脚本
- 配置国内镜像源优化
- 添加完整的部署文档
- 优化Docker构建过程"
```

## 🔒 安全注意事项

### 1. 检查敏感信息
确保以下信息不会上传到GitHub：
- ❌ API密钥和密码
- ❌ 数据库连接字符串
- ❌ 服务器IP地址
- ❌ 个人身份信息

### 2. 使用环境变量
```bash
# 创建环境变量模板
cp conf.yaml conf.yaml.example

# 在conf.yaml.example中替换敏感信息
# 将真实的API密钥替换为占位符
```

### 3. 检查配置文件
确保`conf.yaml`中的敏感信息已处理：
```yaml
# 示例配置（已脱敏）
llm:
  primary:
    base_url: "http://your-llm-server:8000/v1"
    model: "your-model"
    api_key: "your-api-key"  # 生产环境应使用环境变量
```

## 📊 仓库结构

推送后的GitHub仓库结构应该如下：
```
sales-review/
├── 📁 backend/                    # 后端代码
│   ├── 📁 src/                   # 源代码
│   ├── 📁 scripts/               # 启动脚本
│   ├── 📁 templates/             # 模板文件
│   └── package.json              # 后端依赖
├── 📁 frontend/                  # 前端代码
│   ├── 📁 src/                   # 源代码
│   ├── 📁 public/                # 静态文件
│   ├── 📁 scripts/               # 启动脚本
│   └── package.json              # 前端依赖
├── 📄 conf.yaml                  # 主配置文件
├── 📄 docker-compose.yml         # Docker编排
├── 📄 Dockerfile                 # Docker镜像
├── 📄 nginx.conf                 # Nginx配置
├── 📄 deploy-*.sh                # 部署脚本
├── 📄 setup-firewall.sh          # 防火墙脚本
├── 📄 README.md                  # 主文档
├── 📄 *.md                       # 其他文档
├── 📄 .gitignore                 # Git忽略文件
└── 📄 package.json               # 根依赖文件
```

## 🚨 常见问题

### 1. 文件太大无法推送
```bash
# 检查大文件
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -nr -k2 | head -10

# 如果发现大文件，从历史中移除
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch 大文件路径' --prune-empty --tag-name-filter cat -- --all
```

### 2. 推送被拒绝
```bash
# 强制推送（谨慎使用）
git push --force-with-lease origin main

# 或者先拉取最新代码
git pull origin main
git push origin main
```

### 3. 分支冲突
```bash
# 解决冲突
git status
# 编辑冲突文件
git add .
git commit -m "解决冲突"
git push origin main
```

## ✅ 推送检查清单

推送前请确认：
- [ ] 所有源代码文件已包含
- [ ] 配置文件已包含（已脱敏）
- [ ] 部署脚本已包含
- [ ] 文档文件已包含
- [ ] 敏感信息已移除
- [ ] 大文件已处理
- [ ] 提交信息规范
- [ ] 分支策略确定

## 🎉 推送完成

推送成功后，您的销售复盘系统将可以在GitHub上公开访问，其他人可以：
1. 克隆仓库进行本地开发
2. 查看完整的部署文档
3. 使用提供的部署脚本
4. 贡献代码和改进建议

---

**提示**：推送完成后，建议在GitHub仓库的README.md中添加：
- 项目简介和功能特性
- 快速开始指南
- 部署说明
- 贡献指南
- 许可证信息 