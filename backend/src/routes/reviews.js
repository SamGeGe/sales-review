const express = require('express');
const Logger = require('../utils/logger');

module.exports = (databaseService) => {
  const router = express.Router();

  // 获取历史复盘数据
  router.get('/history', async (req, res) => {
    try {
      Logger.apiRequest('GET', '/api/reviews/history', req.query);
      
      // 确保数据库服务已初始化
      if (!databaseService.pool) {
        await databaseService.initDatabase();
      }
      
      const reports = await databaseService.getAllReviewReports();
      
      Logger.apiResponse(200, { count: reports.length, data: reports });
      res.json({ 
        success: true,
        count: reports.length, 
        data: reports 
      });
    } catch (error) {
      Logger.error('获取历史复盘数据失败:', error);
      res.status(500).json({ 
        success: false,
        error: '获取历史复盘数据失败' 
      });
    }
  });

  // 获取所有周数
  router.get('/weeks', async (req, res) => {
    try {
      Logger.apiRequest('GET', '/api/reviews/weeks', req.query);
      
      // 确保数据库服务已初始化
      if (!databaseService.pool) {
        await databaseService.initDatabase();
      }
      
      const weeks = await databaseService.getAllWeeks();
      
      // 转换数据格式以匹配前端期望
      const formattedWeeks = weeks.map(week => ({
        id: week.id,
        week_number: week.week_number,
        year: week.year,
        date_range_start: week.start_date,
        date_range_end: week.end_date,
        report_count: week.report_count,
        created_at: week.created_at,
        updated_at: week.updated_at
      }));
      
      Logger.apiResponse(200, { count: formattedWeeks.length, data: formattedWeeks });
      res.json({ 
        success: true,
        count: formattedWeeks.length, 
        data: formattedWeeks 
      });
    } catch (error) {
      Logger.error('获取周数失败:', error);
      res.status(500).json({ 
        success: false,
        error: '获取周数失败' 
      });
    }
  });

  // 根据周数ID获取报告
  router.get('/weeks/:weekId', async (req, res) => {
    try {
      const { weekId } = req.params;
      const reports = await databaseService.getReportsByWeek(weekId);
      
      res.json({ reports });
    } catch (error) {
      Logger.error('根据周数获取报告失败:', error);
      res.status(500).json({ error: '根据周数获取报告失败' });
    }
  });

  // 获取周数详情
  router.get('/week/:weekId', async (req, res) => {
    try {
      const { weekId } = req.params;
      const week = await databaseService.getWeekById(weekId);
      
      if (!week) {
        return res.status(404).json({ error: '周数不存在' });
      }
      
      res.json(week);
    } catch (error) {
      Logger.error('获取周数详情失败:', error);
      res.status(500).json({ error: '获取周数详情失败' });
    }
  });

  return router;
}; 