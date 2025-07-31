-- MySQL初始化脚本
-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS sales_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE sales_review;

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建周数表
CREATE TABLE IF NOT EXISTS weeks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  week_number INT NOT NULL,
  year INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  report_count INT DEFAULT 0,
  locked_count INT DEFAULT 0,
  unlocked_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_week_year (week_number, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建复盘报告表
CREATE TABLE IF NOT EXISTS review_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  review_method ENUM('offline', 'online') NOT NULL,
  last_week_plan JSON,
  last_week_actions JSON,
  week_plan JSON,
  coordination_items TEXT,
  other_items TEXT,
  ai_report LONGTEXT,
  week_id INT,
  week_number INT,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入默认用户
INSERT IGNORE INTO users (name) VALUES 
('张三'),
('李四'),
('王五'),
('赵六'),
('熊维豪');

-- 插入一些示例周数数据
INSERT IGNORE INTO weeks (week_number, year, start_date, end_date) VALUES 
(29, 2025, '2025-07-14', '2025-07-20'),
(30, 2025, '2025-07-21', '2025-07-27'),
(31, 2025, '2025-07-28', '2025-08-03'); 