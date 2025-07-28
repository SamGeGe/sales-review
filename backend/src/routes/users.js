const express = require('express');
const router = express.Router();
const DatabaseService = require('../services/databaseService');
const Logger = require('../utils/logger');

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    Logger.apiRequest('GET', '/api/users', req.query);
    
    const users = await DatabaseService.getAllUsers();
    
    Logger.apiResponse(200, { count: users.length });
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    Logger.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 添加用户
router.post('/', async (req, res) => {
  try {
    Logger.apiRequest('POST', '/api/users', req.body);
    
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }
    
    const user = await DatabaseService.createUser(name.trim());
    
    Logger.apiResponse(201, user);
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    Logger.error('添加用户失败:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({
        success: false,
        error: '用户名已存在'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// 更新用户
router.put('/:id', async (req, res) => {
  try {
    Logger.apiRequest('PUT', `/api/users/${req.params.id}`, req.body);
    
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: '用户名不能为空'
      });
    }
    
    const user = await DatabaseService.updateUser(parseInt(id), name.trim());
    
    Logger.apiResponse(200, user);
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    Logger.error('更新用户失败:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({
        success: false,
        error: '用户名已存在'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
});

// 删除用户
router.delete('/:id', async (req, res) => {
  try {
    Logger.apiRequest('DELETE', `/api/users/${req.params.id}`);
    
    const { id } = req.params;
    
    await DatabaseService.deleteUser(parseInt(id));
    
    Logger.apiResponse(200, { id: parseInt(id) });
    res.json({
      success: true,
      data: { id: parseInt(id) }
    });
  } catch (error) {
    Logger.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 