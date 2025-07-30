const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');
const ReportExportService = require('../services/reportExportService');
const Logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// 手动触发数据迁移
router.post('/migrate', async (req, res) => {
  try {
    Logger.info('开始手动数据迁移');
    const result = await databaseService.migrateExistingReports();
    Logger.info('手动数据迁移完成', result);
    res.json({
      success: true,
      message: `数据迁移完成，共迁移 ${result.migrated} 条报告`,
      data: result
    });
  } catch (error) {
    Logger.error('手动数据迁移失败:', error);
    res.status(500).json({
      success: false,
      message: '数据迁移失败',
      error: error.message
    });
  }
});

// 获取周数列表（一级页面）
router.get('/', async (req, res) => {
  try {
    const weeks = await databaseService.getAllWeeks();
    Logger.info('获取周数列表成功', { count: weeks.length });
    res.json({
      success: true,
      data: weeks
    });
  } catch (error) {
    Logger.error('获取周数列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取周数列表失败',
      error: error.message
    });
  }
});

// 获取指定周的详情（二级页面）
router.get('/:weekId', async (req, res) => {
  try {
    const { weekId } = req.params;
    const week = await databaseService.getWeekById(weekId);
    
    if (!week) {
      return res.status(404).json({
        success: false,
        message: '周数不存在'
      });
    }

    const reports = await databaseService.getReportsByWeek(weekId);
    
    Logger.info('获取周详情成功', { weekId, reportCount: reports.length });
    res.json({
      success: true,
      data: {
        week,
        reports
      }
    });
  } catch (error) {
    Logger.error('获取周详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取周详情失败',
      error: error.message
    });
  }
});

// 获取指定周的报告列表
router.get('/:weekId/reports', async (req, res) => {
  try {
    const { weekId } = req.params;
    const reports = await databaseService.getReportsByWeek(weekId);
    
    Logger.info('获取周报告列表成功', { weekId, count: reports.length });
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    Logger.error('获取周报告列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取周报告列表失败',
      error: error.message
    });
  }
});

// 批量下载指定周的报告
router.get('/:weekId/download/:format', async (req, res) => {
  try {
    const { weekId, format } = req.params;
    const { reportIds } = req.query; // 获取要下载的报告ID列表
    
    let reports;
    if (reportIds) {
      // 如果指定了报告ID，只下载选中的报告
      const reportIdArray = reportIds.split(',').map(id => parseInt(id));
      const allReports = await databaseService.getReportsByWeek(weekId);
      reports = allReports.filter(report => reportIdArray.includes(report.id));
    } else {
      // 否则下载该周的所有报告
      reports = await databaseService.getReportsByWeek(weekId);
    }
    
    const week = await databaseService.getWeekById(weekId);
    
    if (!week) {
      return res.status(404).json({
        success: false,
        message: '周数不存在'
      });
    }

    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: '没有找到要下载的报告'
      });
    }

    // 格式化日期范围
    const formatDateRange = (startDate, endDate) => {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const startStr = `${start.getMonth() + 1}-${start.getDate()}`;
      const endStr = `${end.getMonth() + 1}-${end.getDate()}`;
      return `${startStr}至${endStr}`;
    };

    // 如果只有一个报告，直接下载该报告
    if (reports.length === 1) {
      const report = reports[0];
      
      // 直接从数据库读取报告内容
      const reportContent = report.ai_report || '';
      const dateRange = formatDateRange(report.date_range_start, report.date_range_end);
      const fileName = `第${week.week_number}周_${dateRange}_${report.user_name}_复盘报告.${format === 'word' ? 'docx' : 'pdf'}`;
      
      if (format === 'word') {
        const wordBuffer = await ReportExportService.generateWordReport(reportContent);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.send(wordBuffer);
      } else if (format === 'pdf') {
        const pdfBuffer = await ReportExportService.generatePdfReport(reportContent);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
        res.send(pdfBuffer);
      }
      
      Logger.info('单个报告下载成功', { weekId, format, reportId: report.id, fileName });
    } else {
      // 多个报告时，创建一个压缩包
      const archiver = require('archiver');
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      const zipFileName = `第${week.week_number}周_${formatDateRange(week.date_range_start, week.date_range_end)}_复盘报告.zip`;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipFileName)}"`);
      
      archive.pipe(res);
      
      for (const report of reports) {
        // 直接从数据库读取报告内容
        const reportContent = report.ai_report || '';
        const dateRange = formatDateRange(report.date_range_start, report.date_range_end);
        const fileName = `第${week.week_number}周_${dateRange}_${report.user_name}_复盘报告.${format === 'word' ? 'docx' : 'pdf'}`;
        
        if (format === 'word') {
          const wordBuffer = await ReportExportService.generateWordReport(reportContent);
          archive.append(wordBuffer, { name: fileName });
        } else if (format === 'pdf') {
          const pdfBuffer = await ReportExportService.generatePdfReport(reportContent);
          archive.append(pdfBuffer, { name: fileName });
        }
        
        Logger.info(`添加报告到压缩包: ${fileName}`);
      }
      
      await archive.finalize();
      Logger.info('批量报告下载成功', { weekId, format, count: reports.length, zipFileName });
    }
  } catch (error) {
    Logger.error('批量下载周报告失败:', error);
    res.status(500).json({
      success: false,
      message: '批量下载周报告失败',
      error: error.message
    });
  }
});

// 更新指定周的统计信息
router.post('/:weekId/update-stats', async (req, res) => {
  try {
    const { weekId } = req.params;
    const week = await databaseService.getWeekById(weekId);
    
    if (!week) {
      return res.status(404).json({
        success: false,
        message: '周数不存在'
      });
    }

    await databaseService.updateWeekStatistics(weekId);
    const updatedWeek = await databaseService.getWeekById(weekId);

    Logger.info('更新周统计成功', { weekId, stats: updatedWeek });
    res.json({
      success: true,
      message: '周统计更新成功',
      data: updatedWeek
    });
  } catch (error) {
    Logger.error('更新周统计失败:', error);
    res.status(500).json({
      success: false,
      message: '更新周统计失败',
      error: error.message
    });
  }
});

// 删除指定周的所有报告
router.delete('/:weekId', async (req, res) => {
  try {
    const { weekId } = req.params;
    const reports = await databaseService.getReportsByWeek(weekId);
    
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        message: '该周没有报告'
      });
    }

    // 删除该周的所有报告
    for (const report of reports) {
      await databaseService.deleteReviewReport(report.id);
    }

    // 更新周数统计
    await databaseService.updateWeekStatistics(weekId);

    Logger.info('删除周报告成功', { weekId, deletedCount: reports.length });
    res.json({
      success: true,
      message: `第${reports[0].week_number}周报告删除成功`,
      data: {
        weekId,
        deletedCount: reports.length
      }
    });
  } catch (error) {
    Logger.error('删除周报告失败:', error);
    res.status(500).json({
      success: false,
      message: '删除周报告失败',
      error: error.message
    });
  }
});

module.exports = router; 