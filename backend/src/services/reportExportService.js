const DocumentGenerator = require('./documentGenerator');

// 文本转docx
async function generateWordReport(text) {
  try {
    return await DocumentGenerator.generateWord(text);
  } catch (error) {
    console.error('Word文档生成失败:', error);
    throw new Error(`Word文档生成失败: ${error.message}`);
  }
}

// 文本转PDF
async function generatePdfReport(text) {
  try {
    return await DocumentGenerator.generatePDF(text);
  } catch (error) {
    console.error('PDF生成失败:', error);
    throw new Error(`PDF生成失败: ${error.message}`);
  }
}



module.exports = { generateWordReport, generatePdfReport }; 