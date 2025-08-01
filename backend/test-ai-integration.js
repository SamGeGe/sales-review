const path = require('path');
const config = require('./src/utils/config');
const MySQLService = require('./src/services/mysqlService');
const reportExportService = require('./src/services/reportExportService');

async function testAIIntegrationReport() {
  console.log('🧪 开始测试AI整合报告生成功能...');
  
  try {
    // 初始化数据库服务
    const databaseService = new MySQLService();
    await databaseService.initDatabase();
    
    // 获取一些测试报告
    const reports = await databaseService.getAllReviewReports();
    console.log(`📊 找到 ${reports.length} 份报告`);
    
    // 筛选有AI报告的报告
    const aiReports = reports.filter(r => r.ai_report && r.ai_report.trim() !== '');
    console.log(`🤖 找到 ${aiReports.length} 份AI报告`);
    
    if (aiReports.length === 0) {
      console.log('❌ 没有找到有效的AI报告，无法测试');
      return;
    }
    
    // 选择前3份报告进行测试
    const testReports = aiReports.slice(0, 3);
    console.log(`🔍 选择 ${testReports.length} 份报告进行测试:`);
    testReports.forEach((report, index) => {
      console.log(`  ${index + 1}. ${report.user_name} - ${report.date_range_start} 至 ${report.date_range_end}`);
    });
    
    // 测试生成AI整合报告内容
    console.log('\n🔧 开始生成AI整合报告内容...');
    const weekNumber = testReports[0].week_number || 30;
    const dateRange = '2025年7月21日-2025年7月27日';
    
    const aiReportContent = await reportExportService.buildAIReportContent(testReports, weekNumber, dateRange);
    
    if (aiReportContent && aiReportContent.trim() !== '') {
      console.log('✅ AI整合报告内容生成成功');
      console.log(`📝 内容长度: ${aiReportContent.length} 字符`);
      console.log('\n📄 报告内容预览:');
      console.log('='.repeat(50));
      console.log(aiReportContent.substring(0, 500) + '...');
      console.log('='.repeat(50));
      
      // 测试生成文件
      console.log('\n🔧 开始生成AI整合报告文件...');
      const fileName = await reportExportService.generateAIReport(testReports, weekNumber, dateRange);
      console.log(`✅ AI整合报告文件生成成功: ${fileName}`);
      
      // 测试保存到数据库
      console.log('\n🔧 开始保存到数据库...');
      const weekId = testReports[0].week_id;
      const userNames = testReports.map(r => r.user_name).join('、');
      const reportId = await databaseService.saveIntegrationReport(
        weekId, weekNumber, dateRange, userNames, aiReportContent, fileName
      );
      console.log(`✅ 保存到数据库成功: ID=${reportId}`);
      
      // 验证保存结果
      const savedReport = await databaseService.getIntegrationReportById(reportId);
      if (savedReport) {
        console.log('✅ 数据库验证成功');
        console.log(`📊 保存的报告信息:`);
        console.log(`  - ID: ${savedReport.id}`);
        console.log(`  - 周数: ${savedReport.week_number}`);
        console.log(`  - 日期范围: ${savedReport.date_range}`);
        console.log(`  - 用户: ${savedReport.user_names}`);
        console.log(`  - 内容长度: ${savedReport.report_content.length} 字符`);
        console.log(`  - 文件路径: ${savedReport.file_path}`);
      } else {
        console.log('❌ 数据库验证失败');
      }
      
    } else {
      console.log('❌ AI整合报告内容生成失败，内容为空');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    process.exit(0);
  }
}

// 运行测试
testAIIntegrationReport(); 