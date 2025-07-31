# 数据库迁移指南

## 📋 迁移概述

本系统已从SQLite数据库迁移到MySQL数据库，以提供更好的性能和扩展性。

## 🔄 迁移历史

### 原始架构
- **数据库**: SQLite3
- **文件位置**: `backend/data/sales_review.db`
- **特点**: 轻量级、文件型数据库

### 新架构
- **数据库**: MySQL 8.0+
- **配置**: 通过环境变量配置
- **特点**: 高性能、支持并发、更好的扩展性

## 🛠️ 迁移过程

### 1. 数据库结构迁移

#### 表结构
```sql
-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 周数表
CREATE TABLE weeks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    week_number INT NOT NULL,
    year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    report_count INT DEFAULT 0,
    locked_count INT DEFAULT 0,
    unlocked_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 复盘报告表
CREATE TABLE review_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    week_id INT,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    review_method ENUM('offline', 'online') DEFAULT 'offline',
    last_week_plan JSON,
    last_week_actions JSON,
    week_plan JSON,
    coordination_items TEXT,
    other_items TEXT,
    ai_report LONGTEXT,
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL
);
```

### 2. 数据迁移

#### 自动迁移脚本
系统启动时会自动执行数据迁移，包括：
- 创建必要的表结构
- 插入默认用户数据
- 迁移历史复盘数据

#### 手动迁移（如需要）
```bash
# 1. 启动MySQL服务
sudo systemctl start mysql

# 2. 创建数据库
mysql -u root -p -e "CREATE DATABASE sales_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 3. 启动后端服务（会自动执行迁移）
cd backend && npm start
```

### 3. 配置更新

#### 环境变量配置
```bash
# backend/config.env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sales_review
DB_CHARSET=utf8mb4
```

#### 依赖更新
```json
// backend/package.json
{
  "dependencies": {
    "mysql2": "^3.14.3",
    "dotenv": "^17.2.1"
  }
}
```

## 🔧 新功能特性

### 1. 连接池管理
- 自动管理数据库连接
- 提高并发性能
- 减少连接开销

### 2. 事务支持
- 确保数据一致性
- 支持复杂操作
- 错误回滚机制

### 3. 外键约束
- 数据完整性保证
- 级联删除支持
- 防止孤立数据

## 📊 性能对比

| 特性 | SQLite | MySQL |
|------|--------|-------|
| 并发性能 | 低 | 高 |
| 数据量支持 | 中小型 | 大型 |
| 备份恢复 | 文件复制 | 专业工具 |
| 扩展性 | 有限 | 优秀 |
| 管理复杂度 | 简单 | 中等 |

## 🚨 注意事项

### 1. 数据备份
```bash
# 备份MySQL数据库
mysqldump -u root -p sales_review > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复数据库
mysql -u root -p sales_review < backup_20250101_120000.sql
```

### 2. 权限配置
```sql
-- 创建专用用户（推荐）
CREATE USER 'sales_review'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON sales_review.* TO 'sales_review'@'localhost';
FLUSH PRIVILEGES;
```

### 3. 性能优化
```sql
-- 创建索引
CREATE INDEX idx_review_reports_user_id ON review_reports(user_id);
CREATE INDEX idx_review_reports_week_id ON review_reports(week_id);
CREATE INDEX idx_review_reports_date_range ON review_reports(date_range_start, date_range_end);
```

## 🔍 故障排除

### 1. 连接问题
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 检查端口监听
netstat -tlnp | grep 3306

# 测试连接
mysql -u root -p -e "SELECT 1;"
```

### 2. 权限问题
```bash
# 重置root密码
sudo mysql -u root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### 3. 数据迁移问题
```bash
# 查看迁移日志
tail -f backend/logs/app.log

# 手动执行迁移
curl -X POST http://localhost:6091/api/weeks/migrate
```

## 📝 更新清单

- [x] 数据库架构迁移
- [x] 数据迁移脚本
- [x] 配置文件更新
- [x] 依赖包更新
- [x] 文档更新
- [x] 性能优化
- [x] 错误处理

## 🎯 总结

成功完成从SQLite到MySQL的数据库迁移，主要改进包括：

1. **性能提升**: 更好的并发处理能力
2. **扩展性**: 支持更大规模的数据和用户
3. **可靠性**: 更强的数据一致性和事务支持
4. **管理性**: 更专业的数据库管理工具

迁移过程对用户透明，所有现有功能保持不变，同时为未来的功能扩展奠定了更好的基础。 