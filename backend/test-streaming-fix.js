const axios = require('axios');

async function testStreamingFix() {
  try {
    console.log('🔍 测试流式功能修复...');
    
    // 测试复盘报告流式生成
    console.log('\n📝 测试复盘报告流式生成...');
    
    const reviewData = {
      dateRange: ['2025-08-11', '2025-08-17'],
      selectedUser: 1,
      selectedUserName: '张三',
      reviewMethod: 'offline',
      lastWeekPlan: [
        { task: '客户拜访', expectedResult: '建立合作关系' }
      ],
      lastWeekActions: [
        {
          day: '周一',
          morningAction: '拜访客户A',
          morningResult: '达成初步合作意向',
          eveningAction: '整理客户资料',
          eveningResult: '完成客户档案建立'
        }
      ],
      weekPlan: [
        { task: '跟进客户A', expectedResult: '签署正式合同' }
      ],
      coordinationItems: '需要技术支持',
      otherItems: '无'
    };
    
    console.log('📡 发送复盘报告生成请求...');
    
    const response = await axios({
      method: 'POST',
      url: 'http://localhost:6091/api/reports/generate-stream',
      headers: {
        'Content-Type': 'application/json',
      },
      data: reviewData,
      responseType: 'stream',
      timeout: 120000
    });
    
    console.log('✅ 流式响应开始');
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应头:', response.headers);
    
    let contentChunks = 0;
    let totalContent = '';
    
    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'status':
                console.log(`📊 状态: ${data.message} (${data.progress || 0}%)`);
                break;
                
              case 'content':
                contentChunks++;
                totalContent += data.content;
                console.log(`📝 内容块 ${contentChunks}: ${data.content.length} 字符`);
                break;
                
              case 'complete':
                console.log(`✅ 完成: 总长度 ${totalContent.length} 字符`);
                break;
                
              case 'error':
                console.error(`❌ 错误: ${data.message}`);
                break;
            }
          } catch (error) {
            // 忽略解析错误
          }
        }
      }
    });
    
    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        console.log('\n🎉 复盘报告流式测试完成');
        console.log(`📊 总内容块数: ${contentChunks}`);
        console.log(`📊 总内容长度: ${totalContent.length} 字符`);
        resolve();
      });
      
      response.data.on('error', (error) => {
        console.error('❌ 流式测试失败:', error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ 流式测试失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testStreamingFix()
    .then(() => {
      console.log('\n✅ 流式功能测试成功');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 流式功能测试失败:', error);
      process.exit(1);
    });
}

module.exports = { testStreamingFix }; 