const LLMService = require('./src/services/llmService');

async function testLLM() {
  try {
    console.log('🔍 开始测试LLM服务...');
    
    const llmInstance = new LLMService();
    console.log('✅ LLM实例创建成功');
    
    const testPrompt = '请生成一个简单的测试报告';
    console.log('🔍 测试提示词:', testPrompt);
    
    const result = await llmInstance.generateAIReport(testPrompt);
    console.log('🔍 LLM调用结果:', result);
    
    if (result.success) {
      console.log('✅ LLM调用成功');
      console.log('📄 生成内容长度:', result.data.length);
    } else {
      console.log('❌ LLM调用失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testLLM(); 