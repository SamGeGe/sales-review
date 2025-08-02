const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: './config.env' });

// 导入服务
const MySQLService = require('./services/mysqlService');
const LLMService = require('./services/llmService');
const ReportExportService = require('./services/reportExportService');
const Logger = require('./utils/logger');

// 导入路由
const usersRouter = require('./routes/users');
const reportsRouter = require('./routes/reports');
const reviewsRouter = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 6091;

// 环境检测
const isProduction = process.env.NODE_ENV === 'production';
Logger.info(`🔍 后端环境检测: ${isProduction ? '生产环境' : '本地开发环境'}`);

// 设置时区
process.env.TZ = process.env.TZ || 'Asia/Shanghai';
Logger.info(`🕐 设置系统时区为东八区北京时间 (${process.env.TZ})`);

// 加载配置
Logger.info('✅ 配置文件加载成功');
Logger.info(`🔧 设置后端端口: ${PORT}`);

// CORS配置
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:6090', 'http://localhost:6091'];
Logger.info(`🔧 后端CORS配置: ${JSON.stringify(corsOrigins)}`);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/reports', express.static(path.join(__dirname, '..', 'reports')));

// 健康检查
app.get('/health', (req, res) => {
  Logger.info('健康检查请求', { path: req.path });
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'mysql'
  });
});

// 初始化数据库服务
const databaseService = new MySQLService();

// 初始化LLM服务
const llmService = new LLMService();

// 初始化报告导出服务
const reportExportService = require('./services/reportExportService');

// 将服务注入到路由中
app.use('/api/users', usersRouter(databaseService));
app.use('/api/reports', reportsRouter(databaseService, llmService, reportExportService));
app.use('/api/reviews', reviewsRouter(databaseService));

// 直接定义 /api/weeks 路由
app.get('/api/weeks', async (req, res) => {
  try {
    Logger.apiRequest('GET', '/api/weeks', req.query);
    
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

// 直接定义 /api/weeks/:weekId 路由
app.get('/api/weeks/:weekId', async (req, res) => {
  try {
    const { weekId } = req.params;
    Logger.apiRequest('GET', `/api/weeks/${weekId}`, req.query);
    
    // 确保数据库服务已初始化
    if (!databaseService.pool) {
      await databaseService.initDatabase();
    }
    
    // 获取周详情
    const week = await databaseService.getWeekById(weekId);
    if (!week) {
      return res.status(404).json({ 
        success: false,
        error: '周数不存在' 
      });
    }
    
    // 获取该周的所有报告
    const reports = await databaseService.getReportsByWeek(weekId);
    
    // 转换数据格式
    const formattedWeek = {
      id: week.id,
      week_number: week.week_number,
      year: week.year,
      date_range_start: week.start_date,
      date_range_end: week.end_date,
      report_count: week.report_count
    };
    
    const formattedReports = reports.map(report => ({
      id: report.id,
      user_name: report.user_name,
      review_method: report.review_method,
      created_at: report.created_at,
      date_range_start: report.date_range_start,
      date_range_end: report.date_range_end
    }));
    
    res.json({
      success: true,
      data: {
        week: formattedWeek,
        reports: formattedReports
      }
    });
  } catch (error) {
    Logger.error('获取周详情失败:', error);
    res.status(500).json({ 
      success: false,
      error: '获取周详情失败' 
    });
  }
});

// 错误处理中间件
app.use((err, req, res, next) => {
  Logger.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    error: '服务器内部错误',
    message: err.message 
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: '接口不存在' 
  });
});

// 优雅关闭
process.on('SIGTERM', async () => {
  Logger.info('收到SIGTERM信号，正在优雅关闭...');
  await databaseService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('收到SIGINT信号，正在优雅关闭...');
  await databaseService.close();
  process.exit(0);
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await databaseService.initDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      Logger.success(`🚀 后端服务启动成功，端口: ${PORT}`);
      Logger.info(`📊 健康检查: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    Logger.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer(); 