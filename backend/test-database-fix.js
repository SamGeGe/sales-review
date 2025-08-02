const mysql = require('mysql2/promise');

async function testDatabaseFix() {
  let connection;
  
  try {
    console.log('🔍 测试数据库修复...');
    
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

    // 检查 ai_integration_reports 表是否存在
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'sales_review' 
      AND TABLE_NAME = 'ai_integration_reports'
    `);

    if (tables.length > 0) {
      console.log('✅ ai_integration_reports 表存在');
      
      // 检查表结构
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'sales_review' 
        AND TABLE_NAME = 'ai_integration_reports'
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('📋 表结构:');
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // 检查是否有数据
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM ai_integration_reports');
      console.log(`📊 表中记录数: ${rows[0].count}`);
      
    } else {
      console.log('❌ ai_integration_reports 表不存在');
      console.log('💡 请运行: npm run init-db 来初始化数据库');
    }
    
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
  testDatabaseFix()
    .then(() => {
      console.log('🎉 数据库修复测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库修复测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseFix }; 