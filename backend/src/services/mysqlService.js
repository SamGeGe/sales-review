const mysql = require('mysql2/promise');
const Logger = require('../utils/logger');

class MySQLService {
  constructor() {
    this.connection = null;
    this.pool = null;
  }

  async initDatabase() {
    try {
      // 创建连接池
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'sales_review',
        charset: process.env.DB_CHARSET || 'utf8mb4',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // 测试连接
      this.connection = await this.pool.getConnection();
      Logger.info('MySQL数据库连接成功');
      
      // 创建数据库表
      await this.createTables();
      
      // 插入默认用户
      await this.insertDefaultUsers();
      
      // 插入模拟数据（如果表为空）
      await this.insertMockReviewReports();
      
      this.connection.release();
      
    } catch (error) {
      Logger.error('MySQL数据库初始化失败:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      // 创建用户表
      await this.pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 创建周数表
      await this.pool.execute(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // 创建复盘报告表
      await this.pool.execute(`
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      Logger.info('MySQL表创建成功');
    } catch (error) {
      Logger.error('创建MySQL表失败:', error);
      throw error;
    }
  }

  async insertDefaultUsers() {
    try {
      const defaultUsers = ['张三', '李四', '王五', '赵六'];
      
      for (const userName of defaultUsers) {
        try {
          await this.pool.execute(
            'INSERT IGNORE INTO users (name) VALUES (?)',
            [userName]
          );
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            Logger.error(`插入用户 ${userName} 失败:`, error);
          }
        }
      }
      
      Logger.info('默认用户插入完成');
    } catch (error) {
      Logger.error('插入默认用户失败:', error);
    }
  }

  async insertMockReviewReports() {
    try {
      const [rows] = await this.pool.execute('SELECT COUNT(*) as count FROM review_reports');
      const count = rows[0].count;
      
      if (count > 0) {
        Logger.info(`数据库中已有 ${count} 条复盘报告，跳过模拟数据插入`);
        return;
      }

      // 首先确保对应的周记录存在
      const weekEndDate = '2025-01-12';
      const weekNumber = this.calculateWeekNumber(weekEndDate);
      const year = 2025;
      
      // 创建或获取周记录
      const week = await this.createOrUpdateWeek(weekNumber, year, weekEndDate);
      
      // 插入模拟数据
      const mockData = [
        {
          user_id: 1,
          user_name: '张三',
          date_range_start: '2025-01-06',
          date_range_end: '2025-01-12',
          review_method: 'offline',
          last_week_plan: JSON.stringify([
            { task: '拜访客户A', expectedResult: '达成合作意向', completion: '完成' }
          ]),
          last_week_actions: JSON.stringify([
            { day: '周一', morningAction: '拜访客户A', morningResult: '客户满意', eveningAction: '无', eveningResult: '无' }
          ]),
          week_plan: JSON.stringify([
            { task: '跟进客户A项目', expectedResult: '签署合同' }
          ]),
          coordination_items: '需要领导协调项目审批',
          other_items: '本周重点推进客户A项目',
          ai_report: '模拟AI生成的复盘报告内容...',
          week_id: week.id,
          week_number: weekNumber,
          is_locked: false
        }
      ];

      for (const data of mockData) {
        await this.pool.execute(`
          INSERT INTO review_reports 
          (user_id, user_name, date_range_start, date_range_end, review_method,
           last_week_plan, last_week_actions, week_plan, coordination_items, other_items,
           ai_report, week_id, week_number, is_locked)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          data.user_id, data.user_name, data.date_range_start, data.date_range_end,
          data.review_method, data.last_week_plan, data.last_week_actions, data.week_plan,
          data.coordination_items, data.other_items, data.ai_report, data.week_id,
          data.week_number, data.is_locked
        ]);
      }

      // 更新周统计信息
      await this.updateWeekStatistics(week.id);

      Logger.info('模拟数据插入完成');
    } catch (error) {
      Logger.error('插入模拟数据失败:', error);
    }
  }

  async getAllUsers() {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM users ORDER BY id');
      return rows;
    } catch (error) {
      Logger.error('获取所有用户失败:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      Logger.error('根据ID获取用户失败:', error);
      throw error;
    }
  }

  async createUser(name) {
    try {
      const [result] = await this.pool.execute('INSERT INTO users (name) VALUES (?)', [name]);
      return { id: result.insertId, name };
    } catch (error) {
      Logger.error('创建用户失败:', error);
      throw error;
    }
  }

  async updateUser(id, name) {
    try {
      await this.pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, id]);
      return { id, name };
    } catch (error) {
      Logger.error('更新用户失败:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      Logger.error('删除用户失败:', error);
      throw error;
    }
  }

  async saveReviewReport(reportData) {
    try {
      const {
        selectedUser,
        selectedUserName,
        dateRange,
        reviewMethod,
        lastWeekPlan,
        lastWeekActions,
        weekPlan,
        coordinationItems,
        otherItems,
        aiReport
      } = reportData;

      const [startDate, endDate] = dateRange;
      const weekNumber = this.calculateWeekNumber(endDate);
      const year = new Date(endDate).getFullYear();

      // 创建或更新周数记录
      const weekId = await this.createOrUpdateWeek(weekNumber, year, endDate);

      // 保存报告
      const [result] = await this.pool.execute(`
        INSERT INTO review_reports 
        (user_id, user_name, date_range_start, date_range_end, review_method,
         last_week_plan, last_week_actions, week_plan, coordination_items, other_items,
         ai_report, week_id, week_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        selectedUser,
        selectedUserName,
        startDate,
        endDate,
        reviewMethod,
        JSON.stringify(lastWeekPlan),
        JSON.stringify(lastWeekActions),
        JSON.stringify(weekPlan),
        coordinationItems,
        otherItems,
        aiReport,
        weekId,
        weekNumber
      ]);

      const reportId = result.insertId;
      
      if (!reportId) {
        throw new Error('保存报告失败: 无法获取报告ID');
      }

      Logger.info(`报告保存成功，ID: ${reportId}`);

      // 保存报告内容到文件
      try {
        const fs = require('fs').promises;
        const path = require('path');
        const reportsDir = path.join(__dirname, '..', '..', 'reports');
        
        await fs.mkdir(reportsDir, { recursive: true });
        const reportPath = path.join(reportsDir, `${reportId}.txt`);
        await fs.writeFile(reportPath, aiReport, 'utf-8');
        
        Logger.info(`报告文件保存成功: ${reportPath}`);
      } catch (fileError) {
        Logger.error('保存报告文件失败:', fileError);
      }

      // 更新周数统计
      await this.updateWeekStatistics(weekId);

      return {
        id: reportId,
        weekId,
        weekNumber,
        year,
        ...reportData
      };

    } catch (error) {
      Logger.error('保存复盘报告失败:', error);
      throw error;
    }
  }

  calculateWeekNumber(endDate) {
    const dayjs = require('dayjs');
    const startOfYear = dayjs('2025-01-01');
    const targetDate = dayjs(endDate);
    const daysDiff = targetDate.diff(startOfYear, 'day');
    if (daysDiff < 5) {
      return 1; // 第一周
    } else {
      return Math.floor((daysDiff - 5) / 7) + 2;
    }
  }

  async createOrUpdateWeek(weekNumber, year, endDate) {
    try {
      // 检查周数是否存在
      const [existingWeeks] = await this.pool.execute(
        'SELECT id FROM weeks WHERE week_number = ? AND year = ?',
        [weekNumber, year]
      );

      if (existingWeeks.length > 0) {
        return existingWeeks[0].id;
      }

      // 创建新的周数记录
      const startDate = dayjs(endDate).subtract(6, 'day').format('YYYY-MM-DD');
      const [result] = await this.pool.execute(`
        INSERT INTO weeks (week_number, year, start_date, end_date)
        VALUES (?, ?, ?, ?)
      `, [weekNumber, year, startDate, endDate]);

      return result.insertId;
    } catch (error) {
      Logger.error('创建或更新周数失败:', error);
      throw error;
    }
  }

  async updateWeekStatistics(weekId) {
    try {
      const [reports] = await this.pool.execute(
        'SELECT COUNT(*) as total, SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) as locked FROM review_reports WHERE week_id = ?',
        [weekId]
      );

      const total = reports[0].total || 0;
      const locked = reports[0].locked || 0;
      const unlocked = total - locked;

      await this.pool.execute(`
        UPDATE weeks 
        SET report_count = ?, locked_count = ?, unlocked_count = ?
        WHERE id = ?
      `, [total, locked, unlocked, weekId]);

      Logger.info(`周数统计更新完成: weekId=${weekId}, total=${total}, locked=${locked}, unlocked=${unlocked}`);
    } catch (error) {
      Logger.error('更新周数统计失败:', error);
    }
  }

  async getAllReviewReports() {
    try {
      const [rows] = await this.pool.execute(`
        SELECT rr.*, u.name as user_name
        FROM review_reports rr
        LEFT JOIN users u ON rr.user_id = u.id
        ORDER BY rr.created_at DESC
      `);
      return rows;
    } catch (error) {
      Logger.error('获取所有复盘报告失败:', error);
      throw error;
    }
  }

  async getReviewReportById(id) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT rr.*, u.name as user_name
        FROM review_reports rr
        LEFT JOIN users u ON rr.user_id = u.id
        WHERE rr.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      Logger.error('根据ID获取复盘报告失败:', error);
      throw error;
    }
  }

  async deleteReviewReport(id) {
    try {
      await this.pool.execute('DELETE FROM review_reports WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      Logger.error('删除复盘报告失败:', error);
      throw error;
    }
  }

  async lockReviewReport(id) {
    try {
      await this.pool.execute('UPDATE review_reports SET is_locked = TRUE WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      Logger.error('锁定复盘报告失败:', error);
      throw error;
    }
  }

  async unlockReviewReport(id) {
    try {
      await this.pool.execute('UPDATE review_reports SET is_locked = FALSE WHERE id = ?', [id]);
      return { success: true };
    } catch (error) {
      Logger.error('解锁复盘报告失败:', error);
      throw error;
    }
  }

  async getAllWeeks() {
    try {
      const [rows] = await this.pool.execute(`
        SELECT w.*, 
               COUNT(rr.id) as report_count,
               SUM(CASE WHEN rr.is_locked = 1 THEN 1 ELSE 0 END) as locked_count,
               SUM(CASE WHEN rr.is_locked = 0 THEN 1 ELSE 0 END) as unlocked_count
        FROM weeks w
        LEFT JOIN review_reports rr ON w.id = rr.week_id
        GROUP BY w.id
        ORDER BY w.year DESC, w.week_number DESC
      `);
      return rows;
    } catch (error) {
      Logger.error('获取所有周数失败:', error);
      throw error;
    }
  }

  async getReportsByWeek(weekId) {
    try {
      const [rows] = await this.pool.execute(`
        SELECT rr.*, u.name as user_name
        FROM review_reports rr
        LEFT JOIN users u ON rr.user_id = u.id
        WHERE rr.week_id = ?
        ORDER BY rr.created_at DESC
      `, [weekId]);
      return rows;
    } catch (error) {
      Logger.error('根据周数获取报告失败:', error);
      throw error;
    }
  }

  async getWeekById(weekId) {
    try {
      const [rows] = await this.pool.execute('SELECT * FROM weeks WHERE id = ?', [weekId]);
      return rows[0] || null;
    } catch (error) {
      Logger.error('根据ID获取周数失败:', error);
      throw error;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      Logger.info('MySQL连接池已关闭');
    }
  }
}

module.exports = MySQLService; 