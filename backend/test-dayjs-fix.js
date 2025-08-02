const dayjs = require('dayjs');

async function testDayjsFix() {
  try {
    console.log('🔍 测试 dayjs 修复...');
    
    // 测试 dayjs 基本功能
    const now = dayjs();
    console.log('✅ dayjs 导入成功');
    console.log(`📅 当前时间: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    
    // 测试日期计算功能
    const testDate = dayjs('2025-01-12');
    const weekStart = testDate.subtract(6, 'day');
    console.log(`📊 测试日期: ${testDate.format('YYYY-MM-DD')}`);
    console.log(`📅 周开始日期: ${weekStart.format('YYYY-MM-DD')}`);
    
    // 测试 MySQLService 中的日期计算逻辑
    const startOfYear = dayjs('2025-01-01');
    const targetDate = dayjs('2025-01-12');
    const daysDiff = targetDate.diff(startOfYear, 'day');
    console.log(`📈 从年初开始的天数: ${daysDiff}`);
    
    if (daysDiff <= 4) {
      console.log('📋 第1周');
    } else {
      const daysFromJan6 = daysDiff - 5;
      const weekNumber = Math.floor(daysFromJan6 / 7) + 2;
      console.log(`📋 第${weekNumber}周`);
    }
    
    console.log('🎉 dayjs 功能测试完成');
    
  } catch (error) {
    console.error('❌ dayjs 测试失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testDayjsFix()
    .then(() => {
      console.log('✅ dayjs 修复测试成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 dayjs 修复测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testDayjsFix }; 