const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const Logger = require('./utils/logger');
const config = require('./utils/config');

const app = express();
// 使用配置管理器读取端口，确保从conf.yaml读取
const PORT = config.getBackendPort() || process.env.PORT || 6091;

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: config.getBackend().cors_origins,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Accept']
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/reports', express.static(path.join(__dirname, '../reports')));

// 路由
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));

// 健康检查
app.get('/health', (req, res) => {
  Logger.info('健康检查请求', { path: req.path });
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  Logger.error('服务器内部错误', err);
  res.status(500).json({ 
    error: '服务器内部错误',
    message: '请稍后再试'
  });
});

// 404处理
app.use('*', (req, res) => {
  Logger.warning('接口不存在', { path: req.originalUrl });
  res.status(404).json({ error: '接口不存在' });
});

app.listen(PORT, () => {
  Logger.success(`🚀 后端服务启动成功，端口: ${PORT}`);
  Logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
});

module.exports = app; 