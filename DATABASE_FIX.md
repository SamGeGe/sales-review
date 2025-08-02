# 数据库修复指南

## 问题描述

在 Linux 系统上启动应用时可能出现以下错误：

### 1. 数据库表不存在错误
```
Error: Table 'sales_review.ai_integration_reports' doesn't exist
```

### 2. dayjs 未定义错误
```
Error: dayjs is not defined
```

## 问题原因

### 1. 数据库表不存在错误
1. **缺少表创建语句**: 在 `mysqlService.js` 的 `createTables()` 方法中，缺少了 `ai_integration_reports` 表的创建语句
2. **数据库初始化不完整**: 在本地开发环境中，可能没有正确执行 `init.sql` 脚本

### 2. dayjs 未定义错误
1. **缺少导入语句**: 在 `mysqlService.js` 文件开头缺少 `dayjs` 的导入语句
2. **重复导入**: 在 `calculateWeekNumber` 方法中有重复的 `dayjs` 导入

## 解决方案

### 1. 自动修复（推荐）

运行以下命令来自动修复所有问题：

```bash
# 进入后端目录
cd backend

# 测试 dayjs 修复
npm run test-dayjs

# 初始化数据库（创建所有表）
npm run init-db

# 测试数据库修复
npm run test-db
```

### 2. 手动修复

如果自动修复失败，可以手动执行以下步骤：

#### 步骤 1: 确保 MySQL 服务运行
```bash
# 检查 MySQL 服务状态
sudo systemctl status mysql

# 如果未运行，启动 MySQL
sudo systemctl start mysql
```

#### 步骤 2: 手动执行 SQL 脚本
```bash
# 连接到 MySQL
mysql -u root -p

# 在 MySQL 中执行
source /path/to/your/project/backend/init.sql;
```

#### 步骤 3: 验证修复
```bash
# 进入后端目录
cd backend

# 运行测试脚本
npm run test-db
```

### 3. 使用 Docker（推荐用于生产环境）

如果使用 Docker 环境，数据库会自动初始化：

```bash
# 启动 Docker 服务
docker-compose up -d

# 检查服务状态
docker-compose ps
```

## 修复内容

### 1. 数据库表修复

在 `backend/src/services/mysqlService.js` 的 `createTables()` 方法中添加了 `ai_integration_reports` 表的创建语句：

```sql
CREATE TABLE IF NOT EXISTS ai_integration_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_id INT NOT NULL,
  week_number INT NOT NULL,
  date_range VARCHAR(100) NOT NULL,
  user_names TEXT NOT NULL,
  report_content LONGTEXT NOT NULL,
  file_path VARCHAR(255),
  is_locked TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE,
  INDEX idx_week_id (week_id),
  INDEX idx_week_number (week_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 2. dayjs 修复

在 `backend/src/services/mysqlService.js` 文件开头添加了 `dayjs` 的导入语句，并移除了重复的导入。

### 3. 新增脚本

- `backend/init-database.js`: 数据库初始化脚本
- `backend/test-database-fix.js`: 数据库修复测试脚本
- `backend/test-dayjs-fix.js`: dayjs 修复测试脚本
- 更新了 `start-local.sh`: 在启动前自动测试和初始化

### 4. 新增 npm 脚本

在 `backend/package.json` 中添加了：
- `npm run init-db`: 初始化数据库
- `npm run test-db`: 测试数据库修复
- `npm run test-dayjs`: 测试 dayjs 修复

## 验证修复

运行以下命令验证修复是否成功：

```bash
# 进入后端目录
cd backend

# 测试 dayjs 修复
npm run test-dayjs

# 测试数据库连接和表结构
npm run test-db
```

如果看到以下输出，说明修复成功：

**dayjs 测试输出:**
```
✅ dayjs 导入成功
📅 当前时间: 2025-08-01 17:52:46
📊 测试日期: 2025-01-12
📅 周开始日期: 2025-01-06
📈 从年初开始的天数: 11
📋 第2周
🎉 dayjs 功能测试完成
```

**数据库测试输出:**
```
✅ ai_integration_reports 表存在
📋 表结构:
   - id: int NOT NULL
   - week_id: int NOT NULL
   - week_number: int NOT NULL
   ...
📊 表中记录数: X
```

## 预防措施

1. **开发环境**: 使用 `./start-local.sh` 启动，会自动初始化数据库
2. **生产环境**: 使用 Docker Compose，数据库会自动初始化
3. **手动部署**: 确保在启动应用前运行 `npm run init-db`

## 常见问题

### Q: 初始化数据库时连接失败
A: 检查 MySQL 服务是否运行，以及连接配置是否正确

### Q: 表已存在但仍然报错
A: 可能是权限问题，确保数据库用户有足够的权限

### Q: Docker 环境中仍然有问题
A: 删除 Docker 卷重新创建：`docker-compose down -v && docker-compose up -d`

## 联系支持

如果问题仍然存在，请检查：
1. MySQL 服务状态
2. 数据库连接配置
3. 用户权限设置
4. 日志文件中的详细错误信息 