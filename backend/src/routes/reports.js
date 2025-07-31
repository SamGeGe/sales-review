const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const Logger = require('../utils/logger');
const dayjs = require('dayjs');
const { calculateWeekNumber, formatDateToChinese } = require('../utils/dateUtils');

module.exports = (databaseService, llmService, reportExportService) => {
  const router = express.Router();

  // 将报告内容分割成块
  function splitReportIntoChunks(content, chunkSize) {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // 获取历史报告
  router.get('/history', async (req, res) => {
    try {
      Logger.apiRequest('GET', '/api/reports/history', req.query);
      
      const reports = await databaseService.getAllReviewReports();
      
      Logger.apiResponse(200, { count: reports.length, data: reports });
      res.json({ 
        success: true,
        count: reports.length, 
        data: reports 
      });
    } catch (error) {
      Logger.error('获取历史报告失败:', error);
      res.status(500).json({ 
        success: false,
        error: '获取历史报告失败' 
      });
    }
  });

  // 根据ID获取报告
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const report = await databaseService.getReviewReportById(id);
      
      if (!report) {
        return res.status(404).json({ error: '报告不存在' });
      }
      
      res.json(report);
    } catch (error) {
      Logger.error('获取报告失败:', error);
      res.status(500).json({ error: '获取报告失败' });
    }
  });

  // 获取报告详情（兼容前端调用）
  router.get('/detail/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const report = await databaseService.getReviewReportById(id);
      
      if (!report) {
        return res.status(404).json({ 
          success: false,
          error: '报告不存在' 
        });
      }
      
      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      Logger.error('获取报告详情失败:', error);
      res.status(500).json({ 
        success: false,
        error: '获取报告详情失败' 
      });
    }
  });

  // 流式生成报告
  router.post('/generate-stream', async (req, res) => {
    try {
      Logger.apiRequest('POST', '/api/reports/generate-stream', req.body);
      
      const reviewData = req.body;
      
      // 设置SSE头部
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // 发送初始状态
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: '正在准备数据...',
        progress: 10,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 发送连接状态
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: '正在连接AI服务...',
        progress: 20,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 调用LLM服务生成报告
      const result = await llmService.generateReport(reviewData);
      
      // 检查生成结果
      if (!result.success) {
        throw new Error(result.error || 'AI报告生成失败');
      }
      
      const aiReport = result.data;
      
      // 发送开始生成状态
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: '开始生成报告内容...',
        progress: 20,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 模拟流式发送报告内容（分段发送）
      const chunks = splitReportIntoChunks(aiReport, 100); // 每100字符一段，更小的块
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const progress = 20 + Math.floor((i / chunks.length) * 70); // 20-90%进度
        
        // 发送内容块
        res.write(`data: ${JSON.stringify({
          type: 'content',
          content: chunk,
          progress: progress,
          timestamp: new Date().toISOString()
        })}\n\n`);
        
        // 添加小延迟模拟流式效果
        await new Promise(resolve => setTimeout(resolve, 100)); // 增加延迟到100ms
      }

      // 发送生成完成状态
      res.write(`data: ${JSON.stringify({
        type: 'status',
        message: '报告生成完成',
        progress: 100,
        timestamp: new Date().toISOString()
      })}\n\n`);

      // 发送完整报告
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        report: aiReport,
        timestamp: new Date().toISOString()
      })}\n\n`);

      res.end();
      
      Logger.apiResponse(200, { message: '流式报告生成完成' });
    } catch (error) {
      Logger.error('流式生成报告失败:', error);
      
      // 发送错误信息
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      })}\n\n`);
      
      res.end();
    }
  });

  // 保存报告
  router.post('/save', async (req, res) => {
    try {
      Logger.apiRequest('POST', '/api/reports/save', req.body);
      
      const reviewData = req.body;
      
      // 保存到数据库
      const result = await databaseService.saveReviewReport(reviewData);
      
      // 检查返回结果
      if (!result || !result.id) {
        Logger.error('保存报告失败: 返回结果无效', result);
        return res.status(500).json({
          success: false,
          error: '保存报告失败: 无法获取报告ID'
        });
      }
      
      // 同时保存到文件，用于下载功能
      if (result.id && reviewData.aiReport) {
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
      Logger.error('保存报告失败:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 删除报告
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      // 删除数据库记录
      await databaseService.deleteReviewReport(id);
      
      // 删除文件
      try {
        const reportPath = path.join(__dirname, '..', '..', 'reports', `${id}.txt`);
        await fs.unlink(reportPath);
        Logger.info(`报告文件已删除: ${reportPath}`);
      } catch (fileError) {
        Logger.warning('删除报告文件失败:', fileError);
      }
      
      res.json({ success: true });
    } catch (error) {
      Logger.error('删除报告失败:', error);
      res.status(500).json({ error: '删除报告失败' });
    }
  });

  // 锁定报告
  router.put('/:id/lock', async (req, res) => {
    try {
      const { id } = req.params;
      await databaseService.lockReviewReport(id);
      res.json({ success: true });
    } catch (error) {
      Logger.error('锁定报告失败:', error);
      res.status(500).json({ error: '锁定报告失败' });
    }
  });

  // 解锁报告
  router.put('/:id/unlock', async (req, res) => {
    try {
      const { id } = req.params;
      await databaseService.unlockReviewReport(id);
      res.json({ success: true });
    } catch (error) {
      Logger.error('解锁报告失败:', error);
      res.status(500).json({ error: '解锁报告失败' });
    }
  });

  // 下载单个报告
  router.get('/download/:format/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { format } = req.params;
      const { week_number, date_range, user_name } = req.query; // 接收前端传递的参数

      Logger.apiRequest('GET', `/api/reports/download/${format}/${id}`, req.query);

      // 获取报告数据
      const report = await databaseService.getReviewReportById(id);
      if (!report) {
        return res.status(404).json({
          success: false,
          error: '报告不存在'
        });
      }

      // 生成文件名 - 优先使用前端传递的参数
      let fileName;
      if (week_number && date_range && user_name) {
        // 使用前端传递的参数
        fileName = `${user_name}-第${week_number}周-${date_range}复盘明细.${format === 'pdf' ? 'pdf' : 'docx'}`;
      } else {
        // 备用方案：使用后端计算
        const userName = report.user_name || '未知用户';
        const endDate = dayjs(report.date_range_end);
        const weekNumber = calculateWeekNumber(endDate);
        const startDateChinese = formatDateToChinese(report.date_range_start);
        const endDateChinese = formatDateToChinese(report.date_range_end);
        const dateRange = `${startDateChinese}-${endDateChinese}`;
        fileName = `${userName}-第${weekNumber}周-${dateRange}复盘明细.${format === 'pdf' ? 'pdf' : 'docx'}`;
      }

      // 生成文件
      const fileNameWithPath = await reportExportService.generateReport(report, format, fileName);

      // 设置响应头
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileNameWithPath)}"`);
      res.setHeader('Content-Type', format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      // 发送文件
      const filePath = path.join(__dirname, '..', '..', 'reports', fileNameWithPath);
      res.sendFile(filePath, (err) => {
        if (err) {
          Logger.error('文件发送失败:', err);
          res.status(500).json({
            success: false,
            error: '文件发送失败'
          });
        }
      });

      Logger.apiResponse(200, { fileName: fileNameWithPath });
    } catch (error) {
      Logger.error('下载报告失败:', error);
      res.status(500).json({
        success: false,
        error: '下载报告失败'
      });
    }
  });

  // 批量下载报告
  router.post('/batch-download', async (req, res) => {
    try {
      const { reportIds, format, week_number, date_range } = req.body; // 接收前端传递的参数

      Logger.apiRequest('POST', '/api/reports/batch-download', req.body);

      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: '请选择要下载的报告'
        });
      }

      // 获取所有报告数据
      const reports = [];
      for (const reportId of reportIds) {
        const report = await databaseService.getReviewReportById(reportId);
        if (report) {
          reports.push(report);
        }
      }

      if (reports.length === 0) {
        return res.status(404).json({
          success: false,
          error: '没有找到有效的报告'
        });
      }

      // 生成文件名 - 优先使用前端传递的参数
      let zipFileName;
      if (week_number && date_range) {
        // 使用前端传递的参数
        zipFileName = `第${week_number}周-${date_range}批量复盘明细.zip`;
      } else {
        // 备用方案：使用第一个报告的日期
        const firstReport = reports[0];
        const endDate = dayjs(firstReport.date_range_end);
        const weekNumber = calculateWeekNumber(endDate);
        const startDateChinese = formatDateToChinese(firstReport.date_range_start);
        const endDateChinese = formatDateToChinese(firstReport.date_range_end);
        const dateRange = `${startDateChinese}-${endDateChinese}`;
        zipFileName = `第${weekNumber}周-${dateRange}批量复盘明细.zip`;
      }

      // 生成批量文件
      const fileNameWithPath = await reportExportService.generateBatchReport(reports, format, zipFileName);

      // 设置响应头
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileNameWithPath)}"`);
      res.setHeader('Content-Type', 'application/zip');

      // 发送文件
      const filePath = path.join(__dirname, '..', '..', 'reports', fileNameWithPath);
      res.sendFile(filePath, (err) => {
        if (err) {
          Logger.error('批量文件发送失败:', err);
          res.status(500).json({
            success: false,
            error: '批量文件发送失败'
          });
        }
      });

      Logger.apiResponse(200, { fileName: fileNameWithPath });
    } catch (error) {
      Logger.error('批量下载失败:', error);
      res.status(500).json({
        success: false,
        error: '批量下载失败'
      });
    }
  });

  return router;
}; 