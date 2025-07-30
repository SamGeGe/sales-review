const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dayjs = require('dayjs');

// 修复后的周数计算逻辑
function calculateWeekNumber(endDate) {
  const reportEndDate = dayjs(endDate);
  
  // 找到该日期所在周的周一
  const monday = reportEndDate.startOf('week').add(1, 'day'); // dayjs默认周日为每周第一天，所以+1天得到周一
  
  // 计算从2025年第一个周一到当前周一的周数
  const firstMonday2025 = dayjs('2025-01-06'); // 2025年第一个周一
  const weekNumber = monday.diff(firstMonday2025, 'week') + 1;
  
  return weekNumber;
}

function getWeekDateRange(weekNumber) {
  const firstMonday2025 = dayjs('2025-01-06'); // 2025年第一个周一
  const weekStart = firstMonday2025.add((weekNumber - 1) * 7, 'day');
  const weekEnd = weekStart.add(6, 'day'); // 周一+6天=周日
  
  return {
    start: weekStart.format('YYYY-MM-DD'),
    end: weekEnd.format('YYYY-MM-DD')
  };
}

async function fixWeekCalculation() {
  const dbPath = path.join(__dirname, 'data', 'sales_review.db');
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔧 开始修复周数计算...');
  
  try {
    // 1. 获取所有报告
    const reports = await new Promise((resolve, reject) => {
      db.all('SELECT id, date_range_end, week_id, week_number FROM review_reports', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log(`📊 找到 ${reports.length} 条报告记录`);
    
    // 2. 重新计算每个报告的周数
    for (const report of reports) {
      const newWeekNumber = calculateWeekNumber(report.date_range_end);
      const year = dayjs(report.date_range_end).year();
      const dateRange = getWeekDateRange(newWeekNumber);
      
      console.log(`报告 ${report.id}: ${report.date_range_end} -> 第${newWeekNumber}周 (${dateRange.start} 至 ${dateRange.end})`);
      
      // 3. 创建或更新周数记录
      await new Promise((resolve, reject) => {
        db.run(`
          INSERT OR REPLACE INTO weeks 
          (week_number, year, date_range_start, date_range_end, updated_at)
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [newWeekNumber, year, dateRange.start, dateRange.end], function(err) {
          if (err) reject(err);
          else {
            const weekId = this.lastID;
            
            // 4. 更新报告的周数关联
            db.run(`
              UPDATE review_reports 
              SET week_id = ?, week_number = ?
              WHERE id = ?
            `, [weekId, newWeekNumber, report.id], function(err) {
              if (err) reject(err);
              else resolve();
            });
          }
        });
      });
    }
    
    // 5. 更新周数统计
    const weeks = await new Promise((resolve, reject) => {
      db.all('SELECT id FROM weeks', (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    for (const week of weeks) {
      await new Promise((resolve, reject) => {
        db.run(`
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
        `, [week.id, week.id, week.id, week.id], function(err) {
          if (err) reject(err);
          else resolve();
        });
      });
    }
    
    console.log('✅ 周数计算修复完成！');
    
    // 6. 显示修复后的结果
    const updatedWeeks = await new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          w.id,
          w.week_number,
          w.year,
          w.date_range_start,
          w.date_range_end,
          w.report_count,
          w.locked_count,
          w.unlocked_count
        FROM weeks w
        ORDER BY w.year DESC, w.week_number DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log('\n📋 修复后的周数列表：');
    for (const week of updatedWeeks) {
      console.log(`第${week.week_number}周 (${week.date_range_start} 至 ${week.date_range_end}): ${week.report_count}份报告 (锁定:${week.locked_count}, 未锁定:${week.unlocked_count})`);
    }
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    db.close();
  }
}

fixWeekCalculation().catch(console.error); 