const express = require('express');
const Logger = require('../utils/logger');

module.exports = (databaseService) => {
  const router = express.Router();

  // 获取所有用户
  router.get('/', async (req, res) => {
    try {
      Logger.apiRequest('GET', '/api/users', {});
      const users = await databaseService.getAllUsers();
      Logger.apiResponse(200, { count: users.length, data: users });
      res.json({ 
        success: true,
        count: users.length, 
        data: users 
      });
    } catch (error) {
      Logger.error('获取用户列表失败:', error);
      res.status(500).json({ 
        success: false,
        error: '获取用户列表失败' 
      });
    }
  });

  // 根据ID获取用户
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const user = await databaseService.getUserById(id);
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      res.json(user);
    } catch (error) {
      Logger.error('获取用户失败:', error);
      res.status(500).json({ error: '获取用户失败' });
    }
  });

  // 创建用户
  router.post('/', async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: '用户名不能为空' });
      }
      
      const user = await databaseService.createUser(name);
      res.status(201).json(user);
    } catch (error) {
      Logger.error('创建用户失败:', error);
      res.status(500).json({ error: '创建用户失败' });
    }
  });

  // 更新用户
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: '用户名不能为空' });
      }
      
      const user = await databaseService.updateUser(id, name);
      res.json(user);
    } catch (error) {
      Logger.error('更新用户失败:', error);
      res.status(500).json({ error: '更新用户失败' });
    }
  });

  // 删除用户
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await databaseService.deleteUser(id);
      res.json({ success: true });
    } catch (error) {
      Logger.error('删除用户失败:', error);
      res.status(500).json({ error: '删除用户失败' });
    }
  });

  return router;
}; 