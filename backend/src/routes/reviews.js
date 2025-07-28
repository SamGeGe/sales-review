const express = require('express');
const router = express.Router();
const db = require('../services/databaseService');
const Logger = require('../utils/logger');

// 获取历史复盘数据
router.get('/history', async (req, res) => {
  try {
    Logger.apiRequest('GET', '/api/reviews/history', req.query);
    
    const reviews = await db.getAllReviewReports();
    
    Logger.info('历史复盘数据查询成功', { count: reviews.length });
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    Logger.error('历史复盘数据查询失败:', error);
    res.status(500).json({
      success: false,
      error: '获取历史数据失败',
      message: error.message
    });
  }
});

// 保存复盘报告
router.post('/save', async (req, res) => {
  try {
    Logger.apiRequest('POST', '/api/reviews/save', req.body);
    
    const reviewData = req.body;
    const savedReview = await db.saveReviewReport(reviewData);
    
    Logger.info('复盘报告保存成功', { id: savedReview.id });
    res.json({
      success: true,
      data: savedReview
    });
  } catch (error) {
    Logger.error('复盘报告保存失败:', error);
    res.status(500).json({
      success: false,
      error: '保存复盘报告失败',
      message: error.message
    });
  }
});

// 获取复盘详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    Logger.apiRequest('GET', `/api/reviews/${id}`, { id });
    
    const review = await db.getReviewReportById(parseInt(id));
    
    if (!review) {
      return res.status(404).json({
        success: false,
        error: '复盘记录不存在'
      });
    }
    
    Logger.info('复盘详情查询成功', { id });
    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    Logger.error('复盘详情查询失败:', error);
    res.status(500).json({
      success: false,
      error: '获取复盘详情失败',
      message: error.message
    });
  }
});

// 删除复盘报告
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    Logger.apiRequest('DELETE', `/api/reviews/${id}`, { id });
    
    const deleted = await db.deleteReviewReport(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: '复盘记录不存在'
      });
    }
    
    Logger.info('复盘报告删除成功', { id });
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    Logger.error('复盘报告删除失败:', error);
    res.status(500).json({
      success: false,
      error: '删除复盘报告失败',
      message: error.message
    });
  }
});

// 锁定/解锁复盘报告
router.put('/:id/lock', async (req, res) => {
  try {
    const { id } = req.params;
    const { locked } = req.body;
    Logger.apiRequest('PUT', `/api/reviews/${id}/lock`, { id, locked });
    
    if (locked) {
      await db.lockReviewReport(parseInt(id));
    } else {
      // 解锁功能需要实现
      await db.unlockReviewReport(parseInt(id));
    }
    
    Logger.info('复盘报告锁定状态更新成功', { id, locked });
    res.json({
      success: true,
      message: locked ? '报告已锁定' : '报告已解锁'
    });
  } catch (error) {
    Logger.error('复盘报告锁定状态更新失败:', error);
    res.status(500).json({
      success: false,
      error: '更新锁定状态失败',
      message: error.message
    });
  }
});

// 示例：获取所有复盘（后续可扩展为数据库查询）
router.get('/', (req, res) => {
  res.json({ message: '复盘列表接口（待实现）' });
});

// 示例：创建复盘（后续可扩展为数据库写入）
router.post('/', (req, res) => {
  res.json({ message: '创建复盘接口（待实现）', data: req.body });
});

module.exports = router; 