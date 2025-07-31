const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const Logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.dbPath = path.join(__dirname, '..', '..', 'data', 'sales_review.db');
    this.initDatabase();
  }

  initDatabase() {
    try {
      // 确保数据目录存在
      const dataDir = path.dirname(this.dbPath);
      const fs = require('fs');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // 创建数据库连接
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          Logger.error('数据库连接失败:', err);
        } else {
          Logger.info('数据库连接成功', { dbPath: this.dbPath });
          this.createTables();
        }
      });
    } catch (error) {
      Logger.error('数据库初始化失败:', error);
    }
  }

  createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createWeeksTable = `
      CREATE TABLE IF NOT EXISTS weeks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_number INTEGER NOT NULL,
        year INTEGER NOT NULL,
        date_range_start TEXT NOT NULL,
        date_range_end TEXT NOT NULL,
        report_count INTEGER DEFAULT 0,
        locked_count INTEGER DEFAULT 0,
        unlocked_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(week_number, year)
      )
    `;

    const createReviewReportsTable = `
      CREATE TABLE IF NOT EXISTS review_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        user_name TEXT NOT NULL,
        date_range_start TEXT NOT NULL,
        date_range_end TEXT NOT NULL,
        review_method TEXT NOT NULL,
        last_week_plan TEXT,
        last_week_actions TEXT,
        week_plan TEXT,
        coordination_items TEXT,
        other_items TEXT,
        ai_report TEXT,
        is_locked BOOLEAN DEFAULT 0,
        week_id INTEGER,
        week_number INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (week_id) REFERENCES weeks (id)
      )
    `;

    this.db.serialize(() => {
      this.db.run(createUsersTable, (err) => {
        if (err) {
          Logger.error('创建用户表失败:', err);
        } else {
          Logger.info('用户表创建成功');
          // 检查是否需要添加 updated_at 字段
          this.db.get("PRAGMA table_info(users)", (err, rows) => {
            if (!err) {
              this.db.all("PRAGMA table_info(users)", (err, columns) => {
                if (!err) {
                  const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
                  if (!hasUpdatedAt) {
                    this.db.run("ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP", (err) => {
                      if (err) {
                        Logger.error('添加 updated_at 字段失败:', err);
                      } else {
                        Logger.info('成功添加 updated_at 字段');
                      }
                    });
                  }
                }
              });
            }
          });
          this.insertDefaultUsers();
        }
      });

      this.db.run(createWeeksTable, (err) => {
        if (err) {
          Logger.error('创建周数表失败:', err);
        } else {
          Logger.info('周数表创建成功');
        }
      });

      this.db.run(createReviewReportsTable, (err) => {
        if (err) {
          Logger.error('创建复盘报告表失败:', err);
        } else {
          Logger.info('复盘报告表创建成功');
          this.insertMockReviewReports();
          
          // 延迟执行数据迁移，确保表结构完全创建
          setTimeout(async () => {
            try {
              await this.migrateExistingReports();
            } catch (error) {
              Logger.error('数据迁移失败:', error);
            }
          }, 1000);
        }
      });
    });
  }

  insertDefaultUsers() {
    const defaultUsers = [
      { name: '张三' },
      { name: '李四' },
      { name: '王五' },
      { name: '赵六' }
    ];

    defaultUsers.forEach(user => {
      this.db.run(
        'INSERT OR IGNORE INTO users (name) VALUES (?)',
        [user.name],
        (err) => {
          if (err) {
            Logger.error(`插入默认用户失败: ${user.name}`, err);
          } else {
            Logger.info(`默认用户 ${user.name} 已存在，跳过`);
          }
        }
      );
    });
  }

  insertMockReviewReports() {
    // 检查是否已经有数据，如果有则不插入模拟数据
    this.db.get('SELECT COUNT(*) as count FROM review_reports', (err, row) => {
      if (err) {
        Logger.error('检查复盘报告数量失败:', err);
        return;
      }
      
      // 如果已经有数据，则不插入模拟数据
      if (row && row.count > 0) {
        Logger.info(`数据库中已有 ${row.count} 条复盘报告，跳过模拟数据插入`);
        return;
      }
      
      Logger.info('数据库为空，开始插入模拟复盘报告...');
      
      const mockReports = [
        {
          user_id: 1, // 张三
          user_name: '张三',
          date_range_start: '2025-07-14',
          date_range_end: '2025-07-20',
          review_method: 'offline',
          last_week_plan: JSON.stringify([
            { task: '拜访客户A', expectedResult: '达成初步合作意向' },
            { task: '准备项目方案', expectedResult: '完成技术方案设计' }
          ]),
          last_week_actions: JSON.stringify([
            { day: '周一', morningAction: '拜访客户A', morningResult: '客户有意向', eveningAction: '整理会议纪要', eveningResult: '完成' },
            { day: '周二', morningAction: '准备技术方案', morningResult: '方案初稿完成', eveningAction: '内部评审', eveningResult: '通过' },
            { day: '周三', morningAction: '客户B拜访', morningResult: '需求确认', eveningAction: '方案修改', eveningResult: '完成' },
            { day: '周四', morningAction: '项目推进会', morningResult: '达成共识', eveningAction: '合同起草', eveningResult: '初稿完成' },
            { day: '周五', morningAction: '合同谈判', morningResult: '条款确定', eveningAction: '庆祝签约', eveningResult: '成功' }
          ]),
          week_plan: JSON.stringify([
            { task: '项目启动', expectedResult: '团队组建完成' },
            { task: '技术开发', expectedResult: '核心功能实现' }
          ]),
          coordination_items: '需要技术部门支持，财务部门配合',
          other_items: '本周重点推进新项目落地',
          ai_report: `# 📊 营销周复盘报告\n\n## 📋 报告基本信息\n\n| 项目 | 内容 |\n|------|------|\n| **被复盘人** | 张三 |\n| **复盘时间区间** | 2025-07-14 至 2025-07-20 |\n| **复盘方式** | 线下复盘 |\n| **报告生成时间** | 2025-07-21T10:00:00.000Z |\n| **报告撰写人** | 营销复盘系统分析师 |\n\n## 🎯 一、上周工作成果总结\n\n### 1.1 主要成果与亮点\n\n**🏆 客户开发成果**\n- 成功拜访客户A，达成初步合作意向\n- 完成技术方案设计，获得客户认可\n- 与客户B确认需求，推进项目进展\n\n**📈 项目推进进展**\n- 项目启动准备工作就绪\n- 技术方案获得内部评审通过\n- 合同谈判进展顺利\n\n### 1.2 每日行动复盘\n\n| 日期 | 白天主要动作 | 白天结果 | 晚上主要动作 | 晚上结果 | 效果评估 |\n|------|--------------|----------|--------------|----------|----------|\n| **周一** | 拜访客户A | 客户有意向 | 整理会议纪要 | 完成 | 客户关系建立成功 |\n| **周二** | 准备技术方案 | 方案初稿完成 | 内部评审 | 通过 | 技术方案获得认可 |\n| **周三** | 客户B拜访 | 需求确认 | 方案修改 | 完成 | 需求理解准确 |\n| **周四** | 项目推进会 | 达成共识 | 合同起草 | 初稿完成 | 项目推进顺利 |\n| **周五** | 合同谈判 | 条款确定 | 庆祝签约 | 成功 | 项目成功签约 |\n\n## 🎯 二、本周行动计划\n\n### 2.1 重点任务安排\n\n| 序号 | 任务内容 | 期望结果 | 完成时间 | 所需资源 |\n|------|----------|----------|----------|----------|\n| **1** | 项目启动 | 团队组建完成 | 本周内 | 人力资源 |\n| **2** | 技术开发 | 核心功能实现 | 本周内 | 技术资源 |\n\n## 🎯 三、需协调事项\n\n- **技术部门支持**：提供技术方案支持\n- **财务部门配合**：协助合同财务条款\n\n**报告撰写人**：营销复盘系统分析师  \n**报告生成时间**：2025-07-21T10:00:00.000Z  \n© 2025 营销中心周复盘系统`,
          is_locked: 1,
          created_at: '2025-07-21 10:00:00'
        },
        {
          user_id: 4, // 李四
          user_name: '李四',
          date_range_start: '2025-07-07',
          date_range_end: '2025-07-13',
          review_method: 'online',
          last_week_plan: JSON.stringify([
            { task: '市场调研', expectedResult: '完成竞品分析报告' },
            { task: '产品推广', expectedResult: '增加10个潜在客户' }
          ]),
          last_week_actions: JSON.stringify([
            { day: '周一', morningAction: '市场调研', morningResult: '数据收集完成', eveningAction: '数据分析', eveningResult: '初步分析完成' },
            { day: '周二', morningAction: '竞品分析', morningResult: '分析报告初稿', eveningAction: '报告完善', eveningResult: '完成' },
            { day: '周三', morningAction: '产品推广', morningResult: '推广活动启动', eveningAction: '效果跟踪', eveningResult: '良好' },
            { day: '周四', morningAction: '客户拜访', morningResult: '新增5个客户', eveningAction: '客户跟进', eveningResult: '积极' },
            { day: '周五', morningAction: '客户拜访', morningResult: '新增5个客户', eveningAction: '总结汇报', eveningResult: '完成' }
          ]),
          week_plan: JSON.stringify([
            { task: '深化客户关系', expectedResult: '客户满意度提升' },
            { task: '产品优化', expectedResult: '产品竞争力增强' }
          ]),
          coordination_items: '需要市场部门配合，产品部门支持',
          other_items: '本周重点提升客户满意度',
          ai_report: `# 📊 营销周复盘报告\n\n## 📋 报告基本信息\n\n| 项目 | 内容 |\n|------|------|\n| **被复盘人** | 李四 |\n| **复盘时间区间** | 2025-07-07 至 2025-07-13 |\n| **复盘方式** | 线上复盘 |\n| **报告生成时间** | 2025-07-14T10:00:00.000Z |\n| **报告撰写人** | 营销复盘系统分析师 |\n\n## 🎯 一、上周工作成果总结\n\n### 1.1 主要成果与亮点\n\n**🏆 市场调研成果**\n- 完成竞品分析报告，为产品定位提供依据\n- 市场数据收集完整，分析深入\n\n**📈 客户开发进展**\n- 成功新增10个潜在客户\n- 产品推广活动效果良好\n- 客户反馈积极\n\n### 1.2 每日行动复盘\n\n| 日期 | 白天主要动作 | 白天结果 | 晚上主要动作 | 晚上结果 | 效果评估 |\n|------|--------------|----------|--------------|----------|----------|\n| **周一** | 市场调研 | 数据收集完成 | 数据分析 | 初步分析完成 | 调研工作扎实 |\n| **周二** | 竞品分析 | 分析报告初稿 | 报告完善 | 完成 | 分析报告质量高 |\n| **周三** | 产品推广 | 推广活动启动 | 效果跟踪 | 良好 | 推广效果显著 |\n| **周四** | 客户拜访 | 新增5个客户 | 客户跟进 | 积极 | 客户开发成功 |\n| **周五** | 客户拜访 | 新增5个客户 | 总结汇报 | 完成 | 目标超额完成 |\n\n## 🎯 二、本周行动计划\n\n### 2.1 重点任务安排\n\n| 序号 | 任务内容 | 期望结果 | 完成时间 | 所需资源 |\n|------|----------|----------|----------|----------|\n| **1** | 深化客户关系 | 客户满意度提升 | 本周内 | 客户服务资源 |\n| **2** | 产品优化 | 产品竞争力增强 | 本周内 | 产品部门支持 |\n\n## 🎯 三、需协调事项\n\n- **市场部门配合**：提供市场数据支持\n- **产品部门支持**：协助产品优化工作\n\n**报告撰写人**：营销复盘系统分析师  \n**报告生成时间**：2025-07-14T10:00:00.000Z  \n© 2025 营销中心周复盘系统`,
          is_locked: 1,
          created_at: '2025-07-14 10:00:00'
        }
      ];

      mockReports.forEach(report => {
        this.db.run(
          `INSERT OR IGNORE INTO review_reports 
           (user_id, user_name, date_range_start, date_range_end, review_method, 
            last_week_plan, last_week_actions, week_plan, coordination_items, 
            other_items, ai_report, is_locked, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            report.user_id, report.user_name, report.date_range_start, report.date_range_end,
            report.review_method, report.last_week_plan, report.last_week_actions,
            report.week_plan, report.coordination_items, report.other_items,
            report.ai_report, report.is_locked, report.created_at
          ],
          (err) => {
            if (err) {
              Logger.error(`插入模拟复盘报告失败: ${report.user_name}`, err);
            } else {
              Logger.info(`模拟复盘报告 ${report.user_name} 已插入`);
            }
          }
        );
      });
    });
  }

  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users ORDER BY name', (err, rows) => {
        if (err) {
          Logger.error('获取用户列表失败:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          Logger.error('获取用户失败:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  async createUser(name) {
    return new Promise((resolve, reject) => {
      this.db.run('INSERT INTO users (name) VALUES (?)', [name], function(err) {
        if (err) {
          Logger.error('创建用户失败:', err);
          reject(err);
        } else {
          resolve({ id: this.lastID, name });
        }
      });
    });
  }

  async updateUser(id, name) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [name, id], function(err) {
        if (err) {
          Logger.error('更新用户失败:', err);
          reject(err);
        } else {
          resolve({ id, name });
        }
      });
    });
  }

  async deleteUser(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          Logger.error('删除用户失败:', err);
          reject(err);
        } else {
          resolve({ id });
        }
      });
    });
  }

  async saveReviewReport(reportData) {
    return new Promise(async (resolve, reject) => {
      try {
        const {
          dateRange,
          selectedUser,
          selectedUserName,
          reviewMethod,
          lastWeekPlan,
          lastWeekActions,
          weekPlan,
          coordinationItems,
          otherItems,
          aiReport
        } = reportData;

        const [startDate, endDate] = dateRange;

        // 计算周数并创建周数记录
        const weekNumber = this.calculateWeekNumber(endDate);
        const year = require('dayjs')(endDate).year();
        const { weekId } = await this.createOrUpdateWeek(weekNumber, year, endDate);

        this.db.run(
          `INSERT INTO review_reports 
           (user_id, user_name, date_range_start, date_range_end, review_method, 
            last_week_plan, last_week_actions, week_plan, coordination_items, other_items, ai_report,
            week_id, week_number)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
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
          ],
          function(err) {
            if (err) {
              Logger.error('保存复盘报告失败:', err);
              reject(err);
            } else {
              const reportId = this.lastID;
              
              // 检查reportId是否有效
              if (!reportId) {
                Logger.error('保存复盘报告失败: reportId为undefined');
                reject(new Error('保存报告失败: 无法获取报告ID'));
                return;
              }
              
              Logger.info(`报告保存成功，ID: ${reportId}`);
              
              // 使用async/await处理文件保存和统计更新
              (async () => {
                try {
                  // 保存报告内容到文件
                  const fs = require('fs').promises;
                  const path = require('path');
                  const reportsDir = path.join(__dirname, '..', '..', 'reports');
                  
                  // 确保reports目录存在
                  await fs.mkdir(reportsDir, { recursive: true });
                  
                  // 保存报告内容到文件
                  const reportPath = path.join(reportsDir, `${reportId}.txt`);
                  await fs.writeFile(reportPath, aiReport, 'utf-8');
                  
                  Logger.info(`报告文件保存成功: ${reportPath}`);
                  
                  // 更新周数统计
                  await this.updateWeekStatistics(weekId);
                  
                  resolve({ 
                    id: reportId, 
                    weekId, 
                    weekNumber, 
                    year,
                    ...reportData 
                  });
                } catch (fileError) {
                  Logger.error('保存报告文件或更新统计失败:', fileError);
                  // 即使文件保存失败，也返回数据库保存成功的结果
                  resolve({ 
                    id: reportId, 
                    weekId, 
                    weekNumber, 
                    year,
                    ...reportData 
                  });
                }
              })();
            }
          }.bind(this)
        );
      } catch (error) {
        Logger.error('保存复盘报告过程中出错:', error);
        reject(error);
      }
    });
  }

  async getNextPeriodNumber() {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT MAX(id) as maxId FROM review_reports', (err, row) => {
        if (err) {
          Logger.error('获取期数失败:', err);
          reject(err);
        } else {
          resolve((row.maxId || 0) + 1);
        }
      });
    });
  }

  async reassignPeriodNumbers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT id FROM review_reports ORDER BY created_at', (err, rows) => {
        if (err) {
          Logger.error('重新分配期数失败:', err);
          reject(err);
        } else {
          // 这里可以实现期数重新分配的逻辑
          resolve(rows);
        }
      });
    });
  }

  async getAllReviewReports() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          r.id,
          r.user_id,
          r.user_name,
          r.date_range_start,
          r.date_range_end,
          r.review_method,
          r.last_week_plan,
          r.last_week_actions,
          r.week_plan,
          r.coordination_items,
          r.other_items,
          r.ai_report,
          r.is_locked,
          r.created_at,
          u.name as user_display_name
        FROM review_reports r
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
      `, (err, rows) => {
        if (err) {
          Logger.error('获取复盘报告列表失败:', err);
          reject(err);
        } else {
          // 解析JSON字段
          const processedRows = rows.map(row => ({
            ...row,
            user_name: row.user_name || row.user_display_name || '未知用户',
            last_week_plan: row.last_week_plan ? JSON.parse(row.last_week_plan) : [],
            last_week_actions: row.last_week_actions ? JSON.parse(row.last_week_actions) : [],
            week_plan: row.week_plan ? JSON.parse(row.week_plan) : []
          }));
          resolve(processedRows);
        }
      });
    });
  }

  async getReviewReportById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          r.id,
          r.user_id,
          r.user_name,
          r.date_range_start,
          r.date_range_end,
          r.review_method,
          r.last_week_plan,
          r.last_week_actions,
          r.week_plan,
          r.coordination_items,
          r.other_items,
          r.ai_report,
          r.is_locked,
          r.week_id,
          r.week_number,
          r.created_at,
          u.name as user_display_name
        FROM review_reports r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
      `, [id], (err, row) => {
        if (err) {
          Logger.error('获取复盘报告失败:', err);
          reject(err);
        } else if (!row) {
          resolve(null);
        } else {
          // 解析JSON字段
          const processedRow = {
            ...row,
            user_name: row.user_name || row.user_display_name || '未知用户',
            last_week_plan: row.last_week_plan ? JSON.parse(row.last_week_plan) : [],
            last_week_actions: row.last_week_actions ? JSON.parse(row.last_week_actions) : [],
            week_plan: row.week_plan ? JSON.parse(row.week_plan) : []
          };
          resolve(processedRow);
        }
      });
    });
  }

  async deleteReviewReport(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM review_reports WHERE id = ?', [id], function(err) {
        if (err) {
          Logger.error('删除复盘报告失败:', err);
          reject(err);
        } else {
          resolve({ id });
        }
      });
    });
  }

  async lockReviewReport(id) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE review_reports SET is_locked = 1 WHERE id = ?', [id], async function(err) {
        if (err) {
          Logger.error('锁定复盘报告失败:', err);
          reject(err);
        } else {
          try {
            // 获取报告所属的周ID
            const report = await new Promise((resolve, reject) => {
              this.db.get('SELECT week_id FROM review_reports WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });
            
            if (report && report.week_id) {
              // 更新周统计信息
              Logger.info('开始更新周统计信息', { reportId: id, weekId: report.week_id });
              await this.updateWeekStatistics(report.week_id);
              Logger.info('周统计信息更新完成', { reportId: id, weekId: report.week_id });
            } else {
              Logger.warn('报告没有关联的周ID', { reportId: id });
            }
            
            resolve({ id, is_locked: true });
          } catch (error) {
            Logger.error('更新周统计失败:', error);
            resolve({ id, is_locked: true }); // 即使统计更新失败，锁定操作仍然成功
          }
        }
      }.bind(this));
    });
  }

  async unlockReviewReport(id) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE review_reports SET is_locked = 0 WHERE id = ?', [id], async function(err) {
        if (err) {
          Logger.error('解锁复盘报告失败:', err);
          reject(err);
        } else {
          try {
            // 获取报告所属的周ID
            const report = await new Promise((resolve, reject) => {
              this.db.get('SELECT week_id FROM review_reports WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
              });
            });
            
            if (report && report.week_id) {
              // 更新周统计信息
              Logger.info('开始更新周统计信息', { reportId: id, weekId: report.week_id });
              await this.updateWeekStatistics(report.week_id);
              Logger.info('周统计信息更新完成', { reportId: id, weekId: report.week_id });
            } else {
              Logger.warn('报告没有关联的周ID', { reportId: id });
            }
            
            resolve({ id, is_locked: false });
          } catch (error) {
            Logger.error('更新周统计失败:', error);
            resolve({ id, is_locked: false }); // 即使统计更新失败，解锁操作仍然成功
          }
        }
      }.bind(this));
    });
  }

  // 周数计算工具方法
  calculateWeekNumber(endDate) {
    const dayjs = require('dayjs');
    const reportEndDate = dayjs(endDate);
    
    // 找到该日期所在周的周一
    const monday = reportEndDate.startOf('week').add(1, 'day'); // dayjs默认周日为每周第一天，所以+1天得到周一
    
    // 计算从2025年第一个周一到当前周一的周数
    const firstMonday2025 = dayjs('2025-01-06'); // 2025年第一个周一
    const weekNumber = monday.diff(firstMonday2025, 'week') + 1;
    
    // 如果结束日期是周日，需要特殊处理
    // 因为周日应该属于以该周日结束的那一周，而不是下一周
    if (reportEndDate.day() === 0) { // 0 = 周日
      return weekNumber - 1;
    }
    
    return weekNumber;
  }

  // 获取周的时间范围
  getWeekDateRange(weekNumber) {
    const dayjs = require('dayjs');
    const firstMonday2025 = dayjs('2025-01-06'); // 2025年第一个周一
    const weekStart = firstMonday2025.add((weekNumber - 1) * 7, 'day');
    const weekEnd = weekStart.add(6, 'day'); // 周一+6天=周日
    
    return {
      start: weekStart.format('YYYY-MM-DD'),
      end: weekEnd.format('YYYY-MM-DD')
    };
  }

  // 创建或更新周数记录
  async createOrUpdateWeek(weekNumber, year, endDate) {
    return new Promise((resolve, reject) => {
      const dateRange = this.getWeekDateRange(weekNumber);
      
      this.db.run(`
        INSERT OR REPLACE INTO weeks 
        (week_number, year, date_range_start, date_range_end, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [weekNumber, year, dateRange.start, dateRange.end], function(err) {
        if (err) {
          Logger.error('创建或更新周数记录失败:', err);
          reject(err);
        } else {
          resolve({ weekId: this.lastID, weekNumber, year });
        }
      });
    });
  }

  // 获取周数列表
  async getAllWeeks() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          w.id,
          w.week_number,
          w.year,
          w.date_range_start,
          w.date_range_end,
          w.report_count,
          w.locked_count,
          w.unlocked_count,
          w.created_at,
          w.updated_at
        FROM weeks w
        ORDER BY w.year DESC, w.week_number DESC
      `, (err, rows) => {
        if (err) {
          Logger.error('获取周数列表失败:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // 获取指定周的报告
  async getReportsByWeek(weekId) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          r.id,
          r.user_id,
          r.user_name,
          r.date_range_start,
          r.date_range_end,
          r.review_method,
          r.is_locked,
          r.created_at,
          r.ai_report,
          w.week_number,
          w.date_range_start as week_start,
          w.date_range_end as week_end
        FROM review_reports r
        LEFT JOIN weeks w ON r.week_id = w.id
        WHERE r.week_id = ?
        ORDER BY r.created_at DESC
      `, [weekId], (err, rows) => {
        if (err) {
          Logger.error('获取周报告失败:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // 获取周数详情
  async getWeekById(weekId) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT 
          w.id,
          w.week_number,
          w.year,
          w.date_range_start,
          w.date_range_end,
          w.report_count,
          w.locked_count,
          w.unlocked_count,
          w.created_at,
          w.updated_at
        FROM weeks w
        WHERE w.id = ?
      `, [weekId], (err, row) => {
        if (err) {
          Logger.error('获取周数详情失败:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // 更新周数统计
  async updateWeekStatistics(weekId) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE weeks 
        SET 
          report_count = (
            SELECT COUNT(*) FROM review_reports WHERE week_id = ?
          ),
          locked_count = (
            SELECT COUNT(*) FROM review_reports WHERE week_id = ? AND is_locked = 1
          ),
          unlocked_count = (
            SELECT COUNT(*) FROM review_reports WHERE week_id = ? AND is_locked = 0
          ),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [weekId, weekId, weekId, weekId], function(err) {
        if (err) {
          Logger.error('更新周数统计失败:', err);
          reject(err);
        } else {
          resolve({ weekId });
        }
      });
    });
  }

  // 数据迁移：将现有报告关联到周数
  async migrateExistingReports() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM review_reports WHERE week_id IS NULL', (err, reports) => {
        if (err) {
          Logger.error('获取未关联报告失败:', err);
          reject(err);
        } else if (reports.length === 0) {
          Logger.info('没有需要迁移的报告数据');
          resolve({ migrated: 0 });
        } else {
          Logger.info(`开始迁移 ${reports.length} 条报告数据`);
          
          let migratedCount = 0;
          const migrateNext = (index) => {
            if (index >= reports.length) {
              Logger.info(`数据迁移完成，共迁移 ${migratedCount} 条报告`);
              resolve({ migrated: migratedCount });
              return;
            }

            const report = reports[index];
            const weekNumber = this.calculateWeekNumber(report.date_range_end);
            const year = require('dayjs')(report.date_range_end).year();
            
            this.createOrUpdateWeek(weekNumber, year, report.date_range_end)
              .then(({ weekId }) => {
                return new Promise((resolve, reject) => {
                  this.db.run(`
                    UPDATE review_reports 
                    SET week_id = ?, week_number = ?
                    WHERE id = ?
                  `, [weekId, weekNumber, report.id], function(err) {
                    if (err) {
                      Logger.error('更新报告周数关联失败:', err);
                      reject(err);
                    } else {
                      migratedCount++;
                      resolve();
                    }
                  });
                });
              })
              .then(() => {
                migrateNext(index + 1);
              })
              .catch(reject);
          };

          migrateNext(0);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          Logger.error('关闭数据库连接失败:', err);
        } else {
          Logger.info('数据库连接已关闭');
        }
      });
    }
  }
}

module.exports = new DatabaseService(); 