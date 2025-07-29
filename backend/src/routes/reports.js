const express = require('express');
const router = express.Router();
const LLMService = require('../services/llmService');
const ReportExportService = require('../services/reportExportService');
const DatabaseService = require('../services/databaseService');
const Logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// 确保目录存在
async function ensureDirectories() {
  const dirs = ['reports', 'uploads'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(__dirname, '..', '..', dir), { recursive: true });
    } catch (error) {
      Logger.warning(`目录 ${dir} 已存在或创建失败:`, error.message);
    }
  }
}



// 生成AI报告 - 流式推送版本
router.post('/generate-stream', async (req, res) => {
  try {
    Logger.apiRequest('POST', '/api/reports/generate-stream', req.body);
    
    // 设置SSE头部
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 发送开始状态
    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: '开始生成AI报告...',
      progress: 10
    })}\n\n`);

    const reviewData = req.body;
    
    // 验证数据
    if (!reviewData) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: '缺少必要的数据'
      })}\n\n`);
      res.end();
      return;
    }

    // 发送数据验证状态
    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: '正在分析复盘数据...',
      progress: 30
    })}\n\n`);

    // 格式化数据
    const formattedData = LLMService.formatUserData(reviewData);
    
    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: '正在调用AI模型...',
      progress: 50
    })}\n\n`);

    // 调用LLM服务 - 流式版本
    let fullReport = '';
    
    try {
      fullReport = await LLMService.generateReportStream(formattedData, (chunk) => {
        // 发送流式数据
        res.write(`data: ${JSON.stringify({
          type: 'content',
          content: chunk
        })}\n\n`);
      });
    } catch (error) {
      Logger.error('LLM服务调用失败:', error);
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: `AI模型调用失败: ${error.message}`
      })}\n\n`);
      res.end();
      return;
    }

    // 发送完成状态
    res.write(`data: ${JSON.stringify({
      type: 'status',
      message: '报告生成完成',
      progress: 100
    })}\n\n`);

    // 发送最终报告
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      report: fullReport,
      timestamp: new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString()
    })}\n\n`);

    res.end();
    Logger.apiResponse(200, '流式报告生成完成');

  } catch (error) {
    Logger.error('流式报告生成失败:', error);
    
    // 发送错误信息
    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: `报告生成失败: ${error.message}`
    })}\n\n`);
    
    res.end();
  }
});

// 原有的生成报告接口（保留兼容性）
router.post('/generate', async (req, res) => {
  try {
    Logger.apiRequest('POST', '/api/reports/generate', req.body);
    
    await ensureDirectories();
    
    const reviewData = req.body;
    
    if (!reviewData) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的数据'
      });
    }

    // 格式化数据
    const formattedData = LLMService.formatUserData(reviewData);
    
    // 调用LLM服务
    const llmResponse = await LLMService.generateReport(formattedData);
    
    if (!llmResponse.success) {
      return res.status(500).json({
        success: false,
        error: llmResponse.error
      });
    }

    // 生成报告ID
    const reportId = require('uuid').v4();
    
    // 保存报告到文件
    const reportPath = path.join(__dirname, '..', '..', 'reports', `${reportId}.txt`);
    await fs.writeFile(reportPath, llmResponse.data);

    Logger.apiResponse(200, { reportId, content: llmResponse.data });

    res.json({
      success: true,
      data: {
        reportId,
        content: llmResponse.data,
        downloadLinks: {
          word: `/api/reports/download/word/${reportId}`,
          pdf: `/api/reports/download/pdf/${reportId}`
        }
      }
    });

  } catch (error) {
    Logger.error('报告生成失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 下载Word格式报告
router.get('/download/word/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportPath = path.join(__dirname, '..', '..', 'reports', `${id}.txt`);
    
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    const wordBuffer = await ReportExportService.generateWordReport(reportContent);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="sales-review-${id}.docx"`);
    res.send(wordBuffer);
    
    Logger.success(`Word报告下载成功: ${id}`);
  } catch (error) {
    Logger.error('Word报告下载失败:', error);
    res.status(500).json({ error: '下载失败' });
  }
});

// 下载PDF格式报告
router.get('/download/pdf/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reportPath = path.join(__dirname, '..', '..', 'reports', `${id}.txt`);
    
    Logger.info(`开始下载PDF报告: ${id}`);
    
    const reportContent = await fs.readFile(reportPath, 'utf-8');
    Logger.info(`报告内容读取成功，长度: ${reportContent.length}`);
    
    const pdfBuffer = await ReportExportService.generatePdfReport(reportContent);
    Logger.info(`PDF生成成功，大小: ${pdfBuffer.length} 字节`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="sales-review-${id}.pdf"`);
    res.send(pdfBuffer);
    
    Logger.success(`PDF报告下载成功: ${id}`);
  } catch (error) {
    Logger.error('PDF报告下载失败:', error);
    res.status(500).json({ error: '下载失败' });
  }
});

// 保存临时报告用于下载
router.post('/save-temp', async (req, res) => {
  try {
    Logger.apiRequest('POST', '/api/reports/save-temp', req.body);
    
    const { content, dateRange, selectedUser } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: '缺少报告内容'
      });
    }
    
    // 生成临时报告ID
    const tempId = `temp_${Date.now()}`;
    const reportPath = path.join(__dirname, '..', '..', 'reports', `${tempId}.txt`);
    
    // 确保reports目录存在
    await ensureDirectories();
    
    // 保存报告内容到文件
    await fs.writeFile(reportPath, content, 'utf-8');
    
    Logger.apiResponse(201, { id: tempId });
    res.status(201).json({
      success: true,
      data: { id: tempId }
    });
    
  } catch (error) {
    Logger.error('保存临时报告失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 保存复盘报告到数据库
router.post('/save', async (req, res) => {
  try {
    Logger.apiRequest('POST', '/api/reports/save', req.body);
    
    const reviewData = req.body;
    
    if (!reviewData) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的数据'
      });
    }
    
    // 确保目录存在
    await ensureDirectories();
    
    // 保存到数据库
    const result = await DatabaseService.saveReviewReport(reviewData);
    
    // 同时保存到文件，用于下载功能
    if (result && result.id && reviewData.aiReport) {
      const reportPath = path.join(__dirname, '..', '..', 'reports', `${result.id}.txt`);
      await fs.writeFile(reportPath, reviewData.aiReport, 'utf-8');
      Logger.info(`报告内容已保存到文件: ${reportPath}`);
    }
    
    Logger.apiResponse(201, result);
    res.status(201).json({
      success: true,
      data: result
    });
    
  } catch (error) {
    Logger.error('保存复盘报告失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取所有复盘报告
router.get('/history', async (req, res) => {
  try {
    Logger.apiRequest('GET', '/api/reports/history', req.query);
    
    const reports = await DatabaseService.getAllReviewReports();
    
    Logger.apiResponse(200, { count: reports.length });
    res.json({
      success: true,
      data: reports
    });
    
  } catch (error) {
    Logger.error('获取复盘报告历史失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单个复盘报告
router.get('/detail/:id', async (req, res) => {
  try {
    Logger.apiRequest('GET', `/api/reports/detail/${req.params.id}`);
    
    const { id } = req.params;
    const report = await DatabaseService.getReviewReportById(parseInt(id));
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: '报告不存在'
      });
    }
    
    Logger.apiResponse(200, { id: parseInt(id) });
    res.json({
      success: true,
      data: report
    });
    
  } catch (error) {
    Logger.error('获取复盘报告失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 删除复盘报告
router.delete('/delete/:id', async (req, res) => {
  try {
    Logger.apiRequest('DELETE', `/api/reports/delete/${req.params.id}`);
    
    const { id } = req.params;
    await DatabaseService.deleteReviewReport(parseInt(id));
    
    Logger.apiResponse(200, { id: parseInt(id) });
    res.json({
      success: true,
      data: { id: parseInt(id) }
    });
    
  } catch (error) {
    Logger.error('删除复盘报告失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 锁定复盘报告
router.put('/lock/:id', async (req, res) => {
  try {
    Logger.apiRequest('PUT', `/api/reports/lock/${req.params.id}`);
    
    const { id } = req.params;
    await DatabaseService.lockReviewReport(parseInt(id));
    
    Logger.apiResponse(200, { id: parseInt(id) });
    res.json({
      success: true,
      data: { id: parseInt(id) }
    });
    
  } catch (error) {
    Logger.error('锁定复盘报告失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 