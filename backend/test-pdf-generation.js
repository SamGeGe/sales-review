const DocumentGenerator = require('./src/services/documentGenerator');

async function testPdfGeneration() {
  try {
    console.log('🧪 开始测试 PDF 生成...');
    
    const testContent = `
# 测试报告

这是一个测试报告的内容。

## 表格测试

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |

## 列表测试

- 项目1
- 项目2
- 项目3

1. 有序项目1
2. 有序项目2
3. 有序项目3

## 段落测试

这是一个段落，包含一些文本内容。PDF 生成应该能够正确处理这些内容。

### 子标题

更多的内容在这里。
    `;
    
    console.log('📝 测试内容长度:', testContent.length, '字符');
    
    const pdfBuffer = await DocumentGenerator.generatePDF(testContent);
    
    console.log('✅ PDF 生成成功！');
    console.log('📄 PDF 大小:', pdfBuffer.length, '字节');
    
    // 保存测试文件
    const fs = require('fs').promises;
    const path = require('path');
    
    const testFilePath = path.join(__dirname, 'test-output.pdf');
    await fs.writeFile(testFilePath, pdfBuffer);
    
    console.log('💾 测试文件已保存到:', testFilePath);
    
  } catch (error) {
    console.error('❌ PDF 生成测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

testPdfGeneration(); 