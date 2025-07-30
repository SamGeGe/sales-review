const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dayjs = require('dayjs');

// 连接数据库
const dbPath = path.join(__dirname, 'data', 'sales_review.db');
const db = new sqlite3.Database(dbPath);

// 重新计算所有周数的统计信息
async function fixWeekStatistics() {
  console.log('🔧 开始修复周数统计...');
  
  // 获取所有周数
  const weeks = await new Promise((resolve, reject) => {
    db.all('SELECT id, week_number FROM weeks ORDER BY week_number', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  console.log(`📊 找到 ${weeks.length} 个周数需要更新统计`);
  
  for (const week of weeks) {
    console.log(`\n处理第 ${week.week_number} 周 (ID: ${week.id}):`);
    
    // 计算该周的报告统计
    const stats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_count,
          SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) as locked_count,
          SUM(CASE WHEN is_locked = 0 THEN 1 ELSE 0 END) as unlocked_count
        FROM review_reports 
        WHERE week_id = ?
      `, [week.id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log(`  总报告数: ${stats.total_count}`);
    console.log(`  已锁定: ${stats.locked_count}`);
    console.log(`  未锁定: ${stats.unlocked_count}`);
    
    // 更新周数统计
    await new Promise((resolve, reject) => {
      db.run(`
        UPDATE weeks 
        SET 
          report_count = ?,
          locked_count = ?,
          unlocked_count = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [stats.total_count, stats.locked_count, stats.unlocked_count, week.id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    console.log(`  ✅ 第 ${week.week_number} 周统计已更新`);
  }
  
  console.log('\n✅ 所有周数统计修复完成！');
  
  // 显示修复结果
  console.log('\n📋 修复结果:');
  const updatedWeeks = await new Promise((resolve, reject) => {
    db.all('SELECT id, week_number, report_count, locked_count, unlocked_count FROM weeks ORDER BY week_number', (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
  
  updatedWeeks.forEach(week => {
    console.log(`  第${week.week_number}周: 总报告${week.report_count}份 (已锁定${week.locked_count}份, 未锁定${week.unlocked_count}份)`);
  });
  
  // 计算总体统计
  const totalStats = await new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        COUNT(*) as total_reports,
        SUM(CASE WHEN is_locked = 1 THEN 1 ELSE 0 END) as total_locked,
        SUM(CASE WHEN is_locked = 0 THEN 1 ELSE 0 END) as total_unlocked
      FROM review_reports
    `, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
  
  console.log(`\n📊 总体统计:`);
  console.log(`  总报告数: ${totalStats.total_reports}`);
  console.log(`  已锁定: ${totalStats.total_locked}`);
  console.log(`  未锁定: ${totalStats.total_unlocked}`);
  
  db.close();
}

// 运行修复
fixWeekStatistics().catch(console.error); 