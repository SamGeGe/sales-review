const axios = require('axios');

async function testDownload() {
  try {
    console.log('🧪 测试整合报告下载...');
    
    const response = await axios.get('http://localhost:6091/api/reports/integration-report/1/download/pdf', {
      responseType: 'stream',
      timeout: 30000
    });
    
    console.log('✅ 下载成功！');
    console.log('状态码:', response.status);
    console.log('内容类型:', response.headers['content-type']);
    console.log('内容长度:', response.headers['content-length']);
    
    // 保存文件
    const fs = require('fs');
    const writer = fs.createWriteStream('test-download.pdf');
    response.data.pipe(writer);
    
    writer.on('finish', () => {
      console.log('💾 文件已保存为 test-download.pdf');
    });
    
  } catch (error) {
    console.error('❌ 下载失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    }
  }
}

testDownload(); 