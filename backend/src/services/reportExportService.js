const DocumentGenerator = require('./documentGenerator');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const dayjs = require('dayjs');
const { calculateWeekNumber, formatDateToChinese } = require('../utils/dateUtils');

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

// 生成单个报告文件
async function generateReport(report, format, customFileName = null) {
  try {
    // 构建报告内容
    const reportContent = buildReportContent(report);
    
    // 生成文件名
    let fileName;
    if (customFileName) {
      // 使用传入的自定义文件名
      fileName = customFileName;
    } else {
      // 使用原来的逻辑
      const userName = report.user_name || '未知用户';
      
      // 根据复盘期间的最后一天计算周数
      const endDate = dayjs(report.date_range_end);
      const weekNumber = calculateWeekNumber(endDate);
      
      // 格式化日期范围
      const startDateChinese = formatDateToChinese(report.date_range_start);
      const endDateChinese = formatDateToChinese(report.date_range_end);
      const dateRange = `${startDateChinese}-${endDateChinese}`;
      
      fileName = `${userName}-第${weekNumber}周-${dateRange}复盘明细.${format === 'pdf' ? 'pdf' : 'docx'}`;
    }
    
    // 确保reports目录存在
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    // 生成文件
    const filePath = path.join(reportsDir, fileName);
    if (format === 'pdf') {
      const pdfBuffer = await DocumentGenerator.generatePDF(reportContent);
      await fs.writeFile(filePath, pdfBuffer);
    } else {
      const docxBuffer = await DocumentGenerator.generateWord(reportContent);
      await fs.writeFile(filePath, docxBuffer);
    }
    
    return fileName;
  } catch (error) {
    console.error('生成报告文件失败:', error);
    throw new Error(`生成报告文件失败: ${error.message}`);
  }
}

// 生成批量报告文件
async function generateBatchReport(reports, format, customFileName = null) {
  try {
    console.log(`🔍 开始生成批量报告，共 ${reports.length} 个报告`);
    
    // 确保reports目录存在
    const reportsDir = path.join(__dirname, '..', '..', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });
    
    // 生成文件名
    let zipFileName;
    if (customFileName) {
      // 使用传入的自定义文件名
      zipFileName = customFileName;
    } else {
      // 使用第一个报告的日期范围作为批量下载的文件名
      const firstReport = reports[0];
      const endDate = dayjs(firstReport.date_range_end);
      const weekNumber = calculateWeekNumber(endDate);
      
      // 格式化日期范围
      const startDateChinese = formatDateToChinese(firstReport.date_range_start);
      const endDateChinese = formatDateToChinese(firstReport.date_range_end);
      const dateRange = `${startDateChinese}-${endDateChinese}`;
      
      zipFileName = `第${weekNumber}周-${dateRange}批量复盘明细.zip`;
    }
    
    console.log(`📦 创建ZIP文件: ${zipFileName}`);
    
    const archive = archiver('zip', { 
      zlib: { level: 9 }
    });
    
    // 设置UTF-8编码
    archive.on('warning', function(err) {
      if (err.code === 'ENOENT') {
        console.warn('ZIP警告:', err);
      } else {
        throw err;
      }
    });
    const zipFilePath = path.join(reportsDir, zipFileName);
    const output = require('fs').createWriteStream(zipFilePath);
    
    archive.pipe(output);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 为每个报告生成文件并添加到压缩包
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      console.log(`📝 处理第 ${i + 1}/${reports.length} 个报告: ID=${report.id}, 用户=${report.user_name}`);
      
      try {
        const reportContent = buildReportContent(report);
        const userName = report.user_name || '未知用户';
        
        // 根据复盘期间的最后一天计算周数
        const reportEndDate = dayjs(report.date_range_end);
        const reportWeekNumber = calculateWeekNumber(reportEndDate);
        
        // 格式化日期范围
        const startDateChinese = formatDateToChinese(report.date_range_start);
        const endDateChinese = formatDateToChinese(report.date_range_end);
        const reportDateRange = `${startDateChinese}-${endDateChinese}`;
        
        const fileName = `${userName}-第${reportWeekNumber}周-${reportDateRange}复盘明细-${report.id}.${format === 'pdf' ? 'pdf' : 'docx'}`;
        
        console.log(`📄 生成文件: ${fileName}`);
        
        if (format === 'pdf') {
          const pdfBuffer = await DocumentGenerator.generatePDF(reportContent);
          archive.append(pdfBuffer, { name: fileName });
          console.log(`✅ PDF文件已添加到ZIP: ${fileName}`);
        } else {
          const docxBuffer = await DocumentGenerator.generateWord(reportContent);
          archive.append(docxBuffer, { name: fileName });
          console.log(`✅ Word文件已添加到ZIP: ${fileName}`);
        }
        
        successCount++;
      } catch (error) {
        console.error(`❌ 处理报告 ${report.id} 失败:`, error);
        errorCount++;
      }
    }
    
    console.log(`📊 批量生成完成: 成功 ${successCount} 个，失败 ${errorCount} 个`);
    
    await archive.finalize();
    console.log(`🎉 ZIP文件生成完成: ${zipFileName}`);
    
    return zipFileName;
  } catch (error) {
    console.error('生成批量报告失败:', error);
    throw new Error(`生成批量报告失败: ${error.message}`);
  }
}

// 构建报告内容
function buildReportContent(report) {
  let content = `# 📊 营销周复盘报告\n\n`;
  
  // 基本信息
  content += `## 📋 报告基本信息\n\n`;
  content += `| 项目 | 内容 |\n`;
  content += `|------|------|\n`;
  content += `| **被复盘人** | ${report.user_name || '未知'} |\n`;
  content += `| **复盘时间区间** | ${report.date_range_start} 至 ${report.date_range_end} |\n`;
  content += `| **复盘方式** | ${report.review_method === 'online' ? '线上复盘' : '线下复盘'} |\n`;
  content += `| **报告生成时间** | ${new Date().toISOString()} |\n`;
  content += `| **报告撰写人** | 营销复盘系统分析师 |\n\n`;
  
  // AI报告内容
  if (report.ai_report) {
    content += report.ai_report;
  } else {
    content += `## 📝 报告内容\n\n`;
    content += `暂无AI生成的报告内容。\n\n`;
  }
  
  // 其他信息
  if (report.coordination_items) {
    content += `## 🤝 需协调事项\n\n${report.coordination_items}\n\n`;
  }
  
  if (report.other_items) {
    content += `## 📌 其他事项\n\n${report.other_items}\n\n`;
  }
  
  content += `**报告撰写人**：营销复盘系统分析师  \n`;
  content += `**报告生成时间**：${new Date().toISOString()}  \n`;
  content += `© 2025 营销中心周复盘系统`;
  
  return content;
}

module.exports = { 
  generateWordReport, 
  generatePdfReport, 
  generateReport, 
  generateBatchReport 
}; 