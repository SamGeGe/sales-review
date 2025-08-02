const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  let connection;
  
  try {
    console.log('🔧 开始初始化数据库...');
    
    // 创建数据库连接（不指定数据库名）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      charset: process.env.DB_CHARSET || 'utf8mb4'
    });

    console.log('✅ 数据库连接成功');

    // 读取 init.sql 文件
    const initSqlPath = path.join(__dirname, 'init.sql');
    const initSql = fs.readFileSync(initSqlPath, 'utf8');

    // 执行 SQL 脚本
    console.log('📝 执行数据库初始化脚本...');
    await connection.execute(initSql);
    
    console.log('✅ 数据库初始化完成！');
    console.log('📊 数据库: sales_review');
    console.log('📋 已创建的表:');
    console.log('   - users');
    console.log('   - weeks');
    console.log('   - review_reports');
    console.log('   - ai_integration_reports');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('🎉 数据库初始化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 数据库初始化脚本执行失败:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase }; 