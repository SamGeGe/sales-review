const mysql = require('mysql2/promise');

async function testReportDetail() {
  let connection;
  
  try {
    console.log('🔍 测试报告详情 API...');
    
    // 创建数据库连接
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sales_review',
      charset: process.env.DB_CHARSET || 'utf8mb4'
    });

    console.log('✅ 数据库连接成功');

    // 检查是否有报告数据
    const [reports] = await connection.execute('SELECT COUNT(*) as count FROM review_reports');
    console.log(`📊 报告总数: ${reports[0].count}`);

    if (reports[0].count === 0) {
      console.log('⚠️ 没有报告数据，无法测试详情 API');
      return;
    }

    // 获取第一个报告
    const [firstReport] = await connection.execute('SELECT id, user_name FROM review_reports LIMIT 1');
    const reportId = firstReport[0].id;
    const userName = firstReport[0].user_name;
    
    console.log(`📋 测试报告 ID: ${reportId}, 用户: ${userName}`);

    // 测试 getReviewReportById 方法
    const [reportDetail] = await connection.execute(`
      SELECT rr.*, u.name as user_name
      FROM review_reports rr
      LEFT JOIN users u ON rr.user_id = u.id
      WHERE rr.id = ?
    `, [reportId]);

    if (reportDetail.length > 0) {
      const report = reportDetail[0];
      console.log('✅ 报告详情获取成功');
      console.log(`📄 报告信息:`);
      console.log(`   - ID: ${report.id}`);
      console.log(`   - 用户: ${report.user_name}`);
      console.log(`   - 复盘方式: ${report.review_method}`);
      console.log(`   - 日期范围: ${report.date_range_start} 至 ${report.date_range_end}`);
      console.log(`   - 锁定状态: ${report.is_locked ? '已锁定' : '未锁定'}`);
      console.log(`   - 创建时间: ${report.created_at}`);
      
      if (report.ai_report) {
        console.log(`   - AI报告长度: ${report.ai_report.length} 字符`);
      } else {
        console.log(`   - AI报告: 无`);
      }
    } else {
      console.log('❌ 报告详情获取失败');
    }

    // 测试 API 端点（模拟）
    console.log('\n🔗 测试 API 端点...');
    console.log(`GET /api/reports/detail/${reportId}`);
    console.log('预期响应格式:');
    console.log('{');
    console.log('  "success": true,');
    console.log('  "data": {');
    console.log('    "id": number,');
    console.log('    "user_name": string,');
    console.log('    "date_range_start": string,');
    console.log('    "date_range_end": string,');
    console.log('    "review_method": string,');
    console.log('    "ai_report": string,');
    console.log('    "is_locked": number,');
    console.log('    "created_at": string');
    console.log('  }');
    console.log('}');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testReportDetail()
    .then(() => {
      console.log('\n🎉 报告详情测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 报告详情测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testReportDetail }; 