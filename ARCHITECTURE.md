# 营销中心周复盘系统 - 架构文档

## 1. 项目概述

### 1.1 项目简介
营销中心周复盘系统是一个基于React + Node.js的全栈应用，用于支持销售团队的周度复盘和计划管理。系统提供结构化的复盘流程，支持行动回顾、计划制定和AI报告生成。

### 1.2 核心功能
- 复盘时间区间选择与被复盘人选择
- 复盘方式选择（线下/线上）
- 上周行动回顾（表格化展示）
- 本周行动计划制定
- 需领导协调事项记录
- AI报告生成与下载（Word/PDF）

## 2. 技术栈

### 2.1 前端技术栈
- **框架**: React 19 + TypeScript
- **UI组件库**: Ant Design 5.26.6
- **日期处理**: Day.js 1.11.13
- **路由**: React Router DOM 7.7.0
- **构建工具**: Create React App

### 2.2 后端技术栈
- **运行环境**: Node.js
- **Web框架**: Express.js 4.18.2
- **HTTP客户端**: Axios 1.6.0
- **文档生成**: docx 8.5.0 (Word), Puppeteer 21.5.0 (PDF)
- **安全**: Helmet 7.1.0, express-rate-limit 7.1.5
- **文件处理**: Multer 1.4.5-lts.1, UUID 9.0.1

## 3. 系统架构

### 3.1 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   后端服务      │    │   LLM服务       │
│   (React)       │◄──►│   (Express)     │◄──►│   (外部API)     │
│   Port: 6960    │    │   Port: 6961    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   报告页面      │    │   文件存储      │
│   (展示/下载)   │    │   (Word/PDF)    │
└─────────────────┘    └─────────────────┘
```

### 3.2 前端架构
```
frontend/src/
├── pages/           # 页面组件
│   ├── Review.tsx   # 复盘页面 (核心)
│   ├── Report.tsx   # 报告展示
│   ├── Login.tsx    # 登录页面
│   ├── Dashboard.tsx # 仪表板
│   ├── History.tsx  # 历史报告
│   ├── Plan.tsx     # 计划管理
│   └── About.tsx    # 关于页面
├── App.tsx          # 主应用组件
└── index.tsx        # 入口文件
```

### 3.3 后端架构
```
backend/src/
├── app.js              # 主应用入口
├── routes/             # 路由模块
│   ├── reviews.js      # 复盘相关接口
│   └── reports.js      # 报告相关接口
├── services/           # 业务服务
│   ├── llmService.js   # LLM服务
│   └── reportExportService.js # 报告导出服务
└── templates/          # 模板文件
    └── review-prompt.md # LLM提示词模板
```

## 4. 核心功能实现

### 4.1 复盘页面 (Review.tsx)
**核心功能**: 周度复盘数据收集与表单验证

#### 4.1.1 数据结构
```typescript
interface ReviewForm {
  dateRange: [Dayjs, Dayjs];        // 复盘时间区间
  selectedUser: number;              // 被复盘人
  reviewMethod: 'offline' | 'online'; // 复盘方式
  lastWeekActions: ActionItem[];     // 上周行动回顾
  weekPlan: PlanItem[];             // 本周行动计划
  coordinationItems: string;         // 需领导协调事项
}

interface ActionItem {
  day: string;           // 周几
  dayAction: string;     // 白天动作
  dayResult: string;     // 白天结果
  nightAction: string;   // 晚上动作
  nightResult: string;   // 晚上结果
}

interface PlanItem {
  task: string;          // 任务
  expectedResult: string; // 期望结果
}
```

#### 4.1.2 表单验证
- 必填字段验证（复盘时间、被复盘人、复盘方式）
- 上周行动回顾表格至少填写一天内容
- 本周行动计划至少填写一项完整任务（任务和期望结果）
- 部分填写的内容完整性检查

#### 4.1.3 本周行动计划表格
- **标题**: 三、本周行动行动计划
- **表格结构**: 3列 + 操作列
  - 序号列（10%宽度）：自动生成序号
  - 任务列（45%宽度）：用户输入任务内容
  - 期望结果列（35%宽度）：用户输入期望结果
  - 操作列（10%宽度）：删除按钮（第一行不显示）
- **功能特性**:
  - 支持动态添加行（"插入行"按钮）
  - 支持删除行（除第一行外）
  - 自动序号生成
  - 表单验证确保至少有一行完整数据

#### 4.1.4 上周复盘计划表格
- **标题**: 一、上周复盘里的"本周行动计划"
- **表格结构**: 4列
  - 序号列（8%宽度）：自动生成序号
  - 任务列（30%宽度）：显示历史任务（只读）
  - 期望结果列（30%宽度）：显示历史期望结果（只读）
  - 完成情况列（32%宽度）：用户输入当前完成情况（必填）
- **功能特性**:
  - 自动关联历史数据填充任务和期望结果
  - 完成情况列可编辑，初始为空
  - 支持用户输入实际完成情况
  - 表单验证确保完成情况必填

#### 4.1.5 上周行动复盘表格
- **标题**: 二、上周行动复盘
- **表格结构**: 5列
  - 时间列（10%宽度）：显示星期几
  - 白天-动作列（22.5%宽度）：用户输入白天动作
  - 白天-结果列（22.5%宽度）：用户输入白天结果
  - 晚上-动作列（22.5%宽度）：用户输入晚上动作
  - 晚上-结果列（22.5%宽度）：用户输入晚上结果
- **功能特性**:
  - 按星期几组织（周一到周日）
  - 所有单元格均可编辑
  - 支持多行文本输入
  - 表单验证确保内容填写

### 4.2 报告页面 (Report.tsx)
**核心功能**: AI报告展示与下载

#### 4.2.1 功能特性
- 动态解析AI生成的markdown格式报告
- 按章节结构化展示报告内容
- 支持Word和PDF格式下载
- 返回复盘页面导航

#### 4.2.2 报告结构
```typescript
interface ReportData {
  reportId: string;
  reportContent: string;    // markdown格式
  downloadLinks: {
    word: string;
    pdf: string;
  };
}
```

### 4.3 后端服务

#### 4.3.1 LLM服务 (llmService.js)
- 加载提示词模板 (`review-prompt.md`)
- 格式化前端提交的复盘数据
- 调用外部LLM API生成结构化报告
- 错误处理与重试机制

#### 4.3.2 报告导出服务 (reportExportService.js)
- `generateWordReport()`: 使用docx库生成Word文档
- `generatePdfReport()`: 使用Puppeteer生成PDF文件
- 支持自定义样式和布局

#### 4.3.3 API接口
```typescript
// 报告生成
POST /api/reports/generate
Request: ReviewForm
Response: { reportId, content, downloadLinks }

// 报告下载
GET /api/reports/download/word/:id
GET /api/reports/download/pdf/:id
Response: File stream
```

## 5. 数据流

### 5.1 完整流程
```
用户填写复盘表单 → 前端验证 → 提交后端 → LLM生成报告 → 返回前端 → 展示报告 → 下载文件
```

### 5.2 关键节点
1. **前端验证**: 确保所有必填项完整
2. **数据格式化**: 将表单数据转换为LLM可理解的格式
3. **LLM调用**: 使用结构化提示词生成报告
4. **文件生成**: 将文本报告转换为Word/PDF格式
5. **用户下载**: 浏览器自动下载生成的文件

## 6. 环境配置

### 6.1 前端配置
```bash
# 启动前端
cd frontend
npm install
npm start
# 访问: http://localhost:6960
```

### 6.2 后端配置
```bash
# 启动后端
cd backend
npm install
npm start
# 服务: http://localhost:6961
```

### 6.3 环境变量 (backend/config.env)
```env
PORT=6961
LLM_BASE_URL=http://183.221.24.83:8000/v1
LLM_MODEL=qwq32b-q8
LLM_API_KEY=sk-fake
CORS_ORIGIN=http://localhost:6960
```

## 7. 部署说明

### 7.1 开发环境
- **前端**: localhost:6960
- **后端**: localhost:6961
- **文件存储**: 本地文件系统

### 7.2 生产环境建议
- 使用PM2或Docker容器化部署
- 配置Nginx反向代理
- 设置环境变量管理敏感信息
- 配置日志监控

## 8. 安全考虑

### 8.1 已实现
- CORS跨域配置
- 请求速率限制
- Helmet安全头设置
- 输入数据验证

### 8.2 建议改进
- 用户认证与授权
- API密钥安全存储
- 文件上传安全检查
- 日志审计

## 9. 性能优化

### 9.1 前端优化
- 组件懒加载
- 表单验证优化
- 文件下载优化

### 9.2 后端优化
- 文件生成异步处理
- 缓存机制
- 错误重试机制

## 10. 测试策略

### 10.1 当前测试
- 前端表单验证测试
- 后端API接口测试
- 文件下载功能测试

### 10.2 建议测试
- 单元测试覆盖
- 集成测试
- 端到端测试

## 11. 后续计划

### 11.1 短期目标
- [ ] 用户认证系统
- [ ] 历史数据管理
- [ ] 移动端适配
- [ ] 性能优化

### 11.2 长期目标
- [ ] 团队协作功能
- [ ] 数据分析仪表板
- [ ] 自动化报告推送
- [ ] 多语言支持

---

**文档版本**: v2.0  
**最后更新**: 2025-01-27  
**维护者**: 开发团队 