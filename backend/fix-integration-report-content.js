const mysql = require('mysql2/promise');

async function fixIntegrationReportContent() {
  let connection;
  
  try {
    console.log('🔧 开始修复整合报告内容格式...');
    
    // 连接数据库
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'sales_review'
    });
    
    console.log('✅ 数据库连接成功');
    
    // 获取所有整合报告
    const [rows] = await connection.execute('SELECT id, report_content FROM ai_integration_reports');
    
    console.log(`📊 找到 ${rows.length} 条整合报告记录`);
    
    let fixedCount = 0;
    
    for (const row of rows) {
      let content = row.report_content;
      let needsUpdate = false;
      
      // 检查是否被代码块包装
      if (content.startsWith('```markdown\n') && content.endsWith('\n```')) {
        // 移除代码块包装
        content = content.slice(12, -4); // 移除开头的 ```markdown\n 和结尾的 \n```
        needsUpdate = true;
        console.log(`🔧 修复记录 ID ${row.id}: 移除代码块包装`);
      } else if (content.startsWith('```\n') && content.endsWith('\n```')) {
        // 移除普通代码块包装
        content = content.slice(4, -4); // 移除开头的 ```\n 和结尾的 \n```
        needsUpdate = true;
        console.log(`🔧 修复记录 ID ${row.id}: 移除普通代码块包装`);
      }
      
      if (needsUpdate) {
        // 更新数据库
        await connection.execute(
          'UPDATE ai_integration_reports SET report_content = ? WHERE id = ?',
          [content, row.id]
        );
        fixedCount++;
      }
    }
    
    console.log(`✅ 修复完成！共修复 ${fixedCount} 条记录`);
    
    // 验证修复结果
    const [verifyRows] = await connection.execute('SELECT id, LEFT(report_content, 50) as preview FROM ai_integration_reports LIMIT 5');
    console.log('📋 修复后的内容预览:');
    verifyRows.forEach(row => {
      console.log(`  ID ${row.id}: ${row.preview}...`);
    });
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

fixIntegrationReportContent(); 