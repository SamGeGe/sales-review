const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dayjs = require('dayjs');

// 连接数据库
const dbPath = path.join(__dirname, 'data', 'sales_review.db');
const db = new sqlite3.Database(dbPath);

// 计算周数的函数
function calculateWeekNumber(endDate) {
  const reportEndDate = dayjs(endDate);
  const monday = reportEndDate.startOf('week').add(1, 'day');
  const firstMonday2025 = dayjs('2025-01-06');
  const weekNumber = monday.diff(firstMonday2025, 'week') + 1;
  return weekNumber;
}

// 获取周的时间范围
function getWeekDateRange(weekNumber) {
  const firstMonday2025 = dayjs('2025-01-06');
  const monday = firstMonday2025.add((weekNumber - 1) * 7, 'day');
  const sunday = monday.add(6, 'day');
  return {
    start: monday.format('YYYY-MM-DD'),
    end: sunday.format('YYYY-MM-DD')
  };
}

// 创建或更新周记录
function createOrUpdateWeek(weekNumber, endDate) {
  return new Promise((resolve, reject) => {
    const dateRange = getWeekDateRange(weekNumber);
    const year = dayjs(endDate).year();
    
    db.run(
      `INSERT OR REPLACE INTO weeks (week_number, year, date_range_start, date_range_end) 
       VALUES (?, ?, ?, ?)`,
      [weekNumber, year, dateRange.start, dateRange.end],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

// 修复所有报告的周数分类
async function fixWeekClassification() {
  console.log('🔧 开始修复报告周数分类...');
  
  // 获取所有报告
  const reports = await new Promise((resolve, reject) => {
    db.all('SELECT id, user_name, date_range_start, date_range_end FROM review_reports', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`📊 找到 ${reports.length} 个报告需要修复`);
  
  for (const report of reports) {
    console.log(`\n处理报告 ID ${report.id} (${report.user_name}):`);
    console.log(`  时间范围: ${report.date_range_start} 至 ${report.date_range_end}`);
    
    // 根据结束日期计算周数
    const weekNumber = calculateWeekNumber(report.date_range_end);
    console.log(`  计算出的周数: ${weekNumber}`);
    
    // 创建或更新周记录
    const weekId = await createOrUpdateWeek(weekNumber, report.date_range_end);
    console.log(`  周记录ID: ${weekId}`);
    
    // 更新报告的周数信息
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE review_reports SET week_id = ?, week_number = ? WHERE id = ?',
        [weekId, weekNumber, report.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
    
    console.log(`  ✅ 报告 ID ${report.id} 已更新为第 ${weekNumber} 周`);
  }
  
  console.log('\n✅ 所有报告周数分类修复完成！');
  
  // 显示修复结果
  console.log('\n📋 修复结果:');
  const updatedReports = await new Promise((resolve, reject) => {
    db.all('SELECT id, user_name, date_range_start, date_range_end, week_number, week_id FROM review_reports ORDER BY id', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  updatedReports.forEach(report => {
    console.log(`  报告 ${report.id} (${report.user_name}): 第${report.week_number}周 (${report.date_range_start} 至 ${report.date_range_end})`);
  });
  
  db.close();
}

// 运行修复
fixWeekClassification().catch(console.error); 