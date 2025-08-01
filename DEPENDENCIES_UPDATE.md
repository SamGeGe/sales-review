# 依赖更新文档

## 📦 新增依赖说明

### 根目录依赖 (package.json)

#### 开发依赖
- **concurrently**: "^8.2.2"
  - 用途：并发运行前后端服务
  - 功能：支持 `npm start` 和 `npm run dev` 命令同时启动前后端
  - 安装：`npm install`

#### 生产依赖
- **mysql2**: "^3.14.3"
  - 用途：MySQL数据库驱动
  - 功能：提供完整的MySQL数据库连接和操作支持
  - 安装：`npm install`

### 前端依赖 (frontend/package.json)

#### Stagewise集成
- **@stagewise-plugins/react**: "^0.6.2"
  - 用途：Stagewise插件系统
  - 功能：提供可扩展的插件架构
  - 安装：`cd frontend && npm install @stagewise-plugins/react`

- **@stagewise/toolbar-react**: "^0.6.2"
  - 用途：Stagewise工具栏组件
  - 功能：提供统一的工具栏界面
  - 安装：`cd frontend && npm install @stagewise/toolbar-react`

#### Markdown渲染
- **react-markdown**: "^10.1.0"
  - 用途：React Markdown渲染组件
  - 功能：在React应用中渲染Markdown内容
  - 安装：`cd frontend && npm install react-markdown`

- **remark-gfm**: "^4.0.1"
  - 用途：GitHub风格Markdown支持
  - 功能：支持表格、删除线、任务列表等GitHub风格语法
  - 安装：`cd frontend && npm install remark-gfm`

## 🚀 安装指南

### 一键安装
```bash
# 安装所有依赖
npm run install-all
```

### 分步安装
```bash
# 1. 安装根目录依赖
npm install

# 2. 安装前端依赖
cd frontend && npm install && cd ..

# 3. 安装后端依赖
cd backend && npm install && cd ..
```

### 国内镜像安装
```bash
# 设置npm国内镜像
npm config set registry https://registry.npmmirror.com

# 安装依赖
npm run install-all
```

## 🔧 使用说明

### 并发启动服务
```bash
# 开发环境（使用concurrently）
npm run dev

# 生产环境
npm start
```

### Markdown渲染使用
```javascript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
}
```

### Stagewise组件使用
```javascript
import { StagewisePlugins } from '@stagewise-plugins/react';
import { StagewiseToolbar } from '@stagewise/toolbar-react';

function App() {
  return (
    <div>
      <StagewiseToolbar />
      <StagewisePlugins />
    </div>
  );
}
```

## 🚨 故障排除

### 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 删除node_modules
rm -rf node_modules frontend/node_modules backend/node_modules

# 重新安装
npm run install-all
```

### Stagewise依赖问题
```bash
# 单独安装Stagewise依赖
cd frontend && npm install @stagewise-plugins/react @stagewise/toolbar-react --registry=https://registry.npmmirror.com
```

### Markdown渲染问题
```bash
# 重新安装Markdown相关依赖
cd frontend && npm install react-markdown remark-gfm --registry=https://registry.npmmirror.com
```

### MySQL连接问题
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 测试连接
mysql -u root -p -e "SELECT 1;"
```

## 📋 版本兼容性

### Node.js版本要求
- 最低版本：18.0.0
- 推荐版本：18.17.0+

### React版本兼容性
- React: ^19.1.0
- React DOM: ^19.1.0
- TypeScript: ^4.9.5

### 数据库兼容性
- MySQL: 5.7+
- SQLite: 3.x (保留支持)

## 🔄 更新历史

### 2025-01-01
- ✅ 新增 `concurrently` 依赖
- ✅ 新增 `mysql2` 依赖
- ✅ 新增 Stagewise 相关依赖
- ✅ 新增 Markdown 渲染依赖

### 2024-12-01
- ✅ 更新 React 到 19.1.0
- ✅ 更新 TypeScript 到 4.9.5
- ✅ 更新 Ant Design 到 5.26.6

## 📞 技术支持

如果遇到依赖相关问题，请：

1. 检查 [故障排除](#故障排除) 部分
2. 查看 [README.md](README.md) 中的安装指南
3. 提交 [GitHub Issue](https://github.com/your-username/sales-review/issues)

---

**相关文档**:
- [README.md](README.md) - 项目主文档
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署指南
- [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) - 数据库迁移指南 