const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function testDataPassing() {
  const dbPath = path.join(__dirname, 'data', 'sales_review.db');
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔍 测试数据传递...');
  
  try {
    // 获取第31周的数据
    const reports = await new Promise((resolve, reject) => {
      db.all(`
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
          r.is_locked,
          r.created_at,
          r.ai_report,
          w.week_number,
          w.date_range_start as week_start,
          w.date_range_end as week_end
        FROM review_reports r
        LEFT JOIN weeks w ON r.week_id = w.id
        WHERE r.week_id = (SELECT id FROM weeks WHERE week_number = 31)
        ORDER BY r.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
    
    console.log('📊 数据库中的原始数据:');
    console.log(`找到 ${reports.length} 条报告`);
    
    for (const report of reports) {
      console.log(`\n👤 用户: ${report.user_name}`);
      console.log(`📅 时间: ${report.date_range_start} 至 ${report.date_range_end}`);
      console.log(`📋 last_week_plan: ${report.last_week_plan}`);
      console.log(`📋 last_week_actions: ${report.last_week_actions ? report.last_week_actions.length : 0} 条记录`);
      console.log(`📋 week_plan: ${report.week_plan ? report.week_plan.length : 0} 条记录`);
      console.log(`📋 coordination_items: ${report.coordination_items || '无'}`);
      console.log(`📋 other_items: ${report.other_items || '无'}`);
      console.log(`📋 ai_report: ${report.ai_report ? '有' : '无'}`);
      
      // 解析JSON数据
      try {
        const lastWeekPlan = report.last_week_plan ? JSON.parse(report.last_week_plan) : [];
        const lastWeekActions = report.last_week_actions ? JSON.parse(report.last_week_actions) : [];
        const weekPlan = report.week_plan ? JSON.parse(report.week_plan) : [];
        
        console.log(`✅ 解析后的数据:`);
        console.log(`   - last_week_plan: ${lastWeekPlan.length} 条`);
        console.log(`   - last_week_actions: ${lastWeekActions.length} 条`);
        console.log(`   - week_plan: ${weekPlan.length} 条`);
        
        if (lastWeekActions.length > 0) {
          console.log(`   - 示例行动: ${lastWeekActions[0].day} - ${lastWeekActions[0].morningAction}`);
        }
        
        if (weekPlan.length > 0) {
          console.log(`   - 示例计划: ${weekPlan[0].task}`);
        }
      } catch (parseError) {
        console.error(`❌ JSON解析失败:`, parseError.message);
      }
    }
    
    // 模拟API响应格式
    const formattedReports = reports.map(report => ({
      id: report.id,
      user_name: report.user_name,
      review_method: report.review_method,
      last_week_plan: report.last_week_plan ? JSON.parse(report.last_week_plan) : [],
      last_week_actions: report.last_week_actions ? JSON.parse(report.last_week_actions) : [],
      week_plan: report.week_plan ? JSON.parse(report.week_plan) : [],
      coordination_items: report.coordination_items || '',
      other_items: report.other_items || '',
      is_locked: report.is_locked,
      created_at: report.created_at,
      date_range_start: report.date_range_start,
      date_range_end: report.date_range_end,
      ai_report: report.ai_report || ''
    }));
    
    console.log('\n📤 模拟传递给LLM的数据:');
    for (const report of formattedReports) {
      console.log(`\n👤 ${report.user_name}:`);
      console.log(`   - last_week_plan: ${report.last_week_plan.length} 条`);
      console.log(`   - last_week_actions: ${report.last_week_actions.length} 条`);
      console.log(`   - week_plan: ${report.week_plan.length} 条`);
      console.log(`   - coordination_items: ${report.coordination_items ? '有' : '无'}`);
      console.log(`   - other_items: ${report.other_items ? '有' : '无'}`);
      console.log(`   - ai_report: ${report.ai_report ? '有' : '无'}`);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    db.close();
  }
}

testDataPassing(); 