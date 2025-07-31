const express = require('express');
const Logger = require('../utils/logger');

module.exports = (databaseService) => {
  const router = express.Router();

  // 获取所有周数
  router.get('/weeks', async (req, res) => {
    try {
      Logger.apiRequest('GET', '/api/reviews/weeks', req.query);
      
      const weeks = await databaseService.getAllWeeks();
      
      Logger.apiResponse(200, { count: weeks.length, data: weeks });
      res.json({ 
        success: true,
        count: weeks.length, 
        data: weeks 
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