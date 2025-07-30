const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

async function generateMissingFiles() {
  const dbPath = path.join(__dirname, 'data', 'sales_review.db');
  const reportsDir = path.join(__dirname, 'reports');
  
  // 确保reports目录存在
  await fs.mkdir(reportsDir, { recursive: true });
  
  const db = new sqlite3.Database(dbPath);
  
  return new Promise((resolve, reject) => {
    db.all('SELECT id, user_name, date_range_start, date_range_end, review_method, last_week_plan, last_week_actions, week_plan, coordination_items, other_items, ai_report FROM review_reports ORDER BY id', async (err, rows) => {
      if (err) {
        console.error('查询数据库失败:', err);
        reject(err);
        return;
      }
      
      console.log(`找到 ${rows.length} 个报告记录`);
      
      for (const row of rows) {
        const filePath = path.join(reportsDir, `${row.id}.txt`);
        
        try {
          // 检查文件是否已存在
          await fs.access(filePath);
          console.log(`✅ 文件已存在: ${row.id}.txt`);
        } catch (error) {
          // 文件不存在，生成文件
          try {
            // 构建报告内容
            let content = `# 📊 营销周复盘报告\n\n`;
            content += `## 📋 报告基本信息\n\n`;
            content += `| 项目 | 内容 |\n`;
            content += `|------|------|\n`;
            content += `| **被复盘人** | ${row.user_name} |\n`;
            content += `| **复盘时间区间** | ${row.date_range_start} 至 ${row.date_range_end} |\n`;
            content += `| **复盘方式** | ${row.review_method === 'online' ? '线上复盘' : '线下复盘'} |\n`;
            content += `| **报告生成时间** | ${new Date().toISOString()} |\n`;
            content += `| **报告撰写人** | 营销复盘系统分析师 |\n\n`;
            
            // 添加AI报告内容
            if (row.ai_report) {
              content += row.ai_report;
            } else {
              content += `## 📝 报告内容\n\n`;
              content += `此报告由营销复盘系统自动生成。\n\n`;
              
              if (row.last_week_plan) {
                const lastWeekPlan = JSON.parse(row.last_week_plan);
                content += `### 上周复盘计划\n\n`;
                lastWeekPlan.forEach((plan, index) => {
                  content += `${index + 1}. **${plan.task}**\n`;
                  content += `   期望结果：${plan.expectedResult}\n\n`;
                });
              }
              
              if (row.last_week_actions) {
                const lastWeekActions = JSON.parse(row.last_week_actions);
                content += `### 上周行动复盘\n\n`;
                lastWeekActions.forEach(action => {
                  content += `**${action.day}：**\n`;
                  content += `- 上午：${action.morningAction} - 结果：${action.morningResult}\n`;
                  content += `- 晚上：${action.eveningAction} - 结果：${action.eveningResult}\n\n`;
                });
              }
              
              if (row.week_plan) {
                const weekPlan = JSON.parse(row.week_plan);
                content += `### 本周行动计划\n\n`;
                weekPlan.forEach((plan, index) => {
                  content += `${index + 1}. **${plan.task}**\n`;
                  content += `   期望结果：${plan.expectedResult}\n\n`;
                });
              }
              
              if (row.coordination_items) {
                content += `### 需协调事项\n\n${row.coordination_items}\n\n`;
              }
              
              if (row.other_items) {
                content += `### 其他事项\n\n${row.other_items}\n\n`;
              }
            }
            
            content += `\n**报告撰写人**：营销复盘系统分析师  \n`;
            content += `**报告生成时间**：${new Date().toISOString()}  \n`;
            content += `© 2025 营销中心周复盘系统`;
            
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`✅ 生成文件: ${row.id}.txt`);
          } catch (fileError) {
            console.error(`❌ 生成文件失败 ${row.id}.txt:`, fileError.message);
          }
        }
      }
      
      console.log('\n🎉 文件生成完成！');
      db.close();
      resolve();
    });
  });
}

generateMissingFiles().catch(console.error); 