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

// 下载周报告
router.get('/:weekId/download/:format', async (req, res) => {
  try {
    const { weekId, format } = req.params;
    const { week_number, date_range } = req.query; // 接收前端传递的参数

    Logger.apiRequest('GET', `/api/weeks/${weekId}/download/${format}`, req.query);

    // 获取周数据
    const week = await databaseService.getWeekById(weekId);
    if (!week) {
      return res.status(404).json({
        success: false,
        error: '周数据不存在'
      });
    }

    // 获取该周的所有报告
    const reports = await databaseService.getReportsByWeekId(weekId);
    if (reports.length === 0) {
      return res.status(404).json({
        success: false,
        error: '该周没有报告'
      });
    }

    // 生成文件名 - 优先使用前端传递的参数
    let zipFileName;
    if (week_number && date_range) {
      // 使用前端传递的参数
      zipFileName = `第${week_number}周-${date_range}批量复盘明细.zip`;
    } else {
      // 备用方案：使用周数据
      const startDateChinese = formatDateToChinese(week.date_range_start);
      const endDateChinese = formatDateToChinese(week.date_range_end);
      const dateRange = `${startDateChinese}-${endDateChinese}`;
      zipFileName = `第${week.week_number}周-${dateRange}批量复盘明细.zip`;
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
        Logger.error('周报告文件发送失败:', err);
        res.status(500).json({
          success: false,
          error: '周报告文件发送失败'
        });
      }
    });

    Logger.apiResponse(200, { fileName: fileNameWithPath });
  } catch (error) {
    Logger.error('下载周报告失败:', error);
    res.status(500).json({
      success: false,
      error: '下载周报告失败'
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