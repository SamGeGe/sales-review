const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

async function testTemplate() {
  try {
    console.log('🔍 开始测试模板编译...');
    
    // 读取模板
    const templatePath = path.join(__dirname, 'src', 'templates', 'ai-integration-prompt.md');
    const template = await fs.readFile(templatePath, 'utf8');
    console.log('✅ 模板读取成功');
    
    // 测试数据
    const testData = {
      dateRange: '2025年7月28日-2025年8月3日',
      weekNumber: 31,
      userList: '张三、李四',
      reportCount: 2,
      reports: [
        {
          userName: '张三',
          dateRange: '2025-07-28 至 2025-08-03',
          aiReport: '这是张三的AI报告内容...'
        },
        {
          userName: '李四',
          dateRange: '2025-07-28 至 2025-08-03',
          aiReport: '这是李四的AI报告内容...'
        }
      ],
      startYear: '2025',
      startMonth: '7',
      startDay: '28',
      endYear: '2025',
      endMonth: '8',
      endDay: '3'
    };
    
    // 编译模板
    const compiledTemplate = Handlebars.compile(template);
    const result = compiledTemplate(testData);
    
    console.log('✅ 模板编译成功');
    console.log('📄 生成内容长度:', result.length);
    console.log('📄 内容预览:');
    console.log(result.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testTemplate(); 