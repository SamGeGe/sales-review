const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/logger');
const config = require('../utils/config');

class LLMService {
  constructor() {
    // 解析配置文件中的LLM配置
    this.parseLLMConfig();
    
    this.timeout = 120000; // 120秒超时
    this.useBackup = false; // 是否使用备用LLM
  }

  // 解析LLM配置
  parseLLMConfig() {
    try {
      const llmConfig = config.getLLM();
      
      // 设置主LLM配置
      this.primaryBaseURL = llmConfig.primary.base_url;
      this.primaryModel = llmConfig.primary.model;
      this.primaryApiKey = llmConfig.primary.api_key;
      this.timeout = llmConfig.primary.timeout;
      
      // 设置备用LLM配置
      this.backupBaseURL = llmConfig.backup.base_url;
      this.backupModel = llmConfig.backup.model;
      this.backupApiKey = llmConfig.backup.api_key;
      
      Logger.info('LLM配置解析完成', {
        primary: `${this.primaryBaseURL} (${this.primaryModel})`,
        backup: `${this.backupBaseURL} (${this.backupModel})`
      });
      
    } catch (error) {
      Logger.warning('LLM配置解析失败，使用默认配置', { error: error.message });
      
      // 使用默认配置
      this.primaryBaseURL = 'https://api.openai.com/v1';
      this.primaryModel = 'gpt-3.5-turbo';
      this.primaryApiKey = 'sk-fake';
      this.backupBaseURL = null;
      this.backupModel = 'gpt-3.5-turbo';
      this.backupApiKey = 'sk-fake';
    }
  }

  // 获取当前LLM配置
  getCurrentLLMConfig() {
    if (this.useBackup && this.backupBaseURL) {
      return {
        baseURL: this.backupBaseURL,
        model: this.backupModel,
        apiKey: this.backupApiKey
      };
    }
    return {
      baseURL: this.primaryBaseURL,
      model: this.primaryModel,
      apiKey: this.primaryApiKey
    };
  }

  // 切换到备用LLM
  switchToBackup() {
    if (this.backupBaseURL) {
      this.useBackup = true;
      Logger.warning('切换到备用LLM服务', {
        backupURL: this.backupBaseURL,
        backupModel: this.backupModel
      });
      return true;
    }
    Logger.error('没有可用的备用LLM服务');
    return false;
  }

  // 切换回主LLM
  switchToPrimary() {
    this.useBackup = false;
    Logger.info('切换回主LLM服务', {
      primaryURL: this.primaryBaseURL,
      primaryModel: this.primaryModel
    });
  }

  // 读取提示词模板
  async readPromptTemplate() {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', 'review-prompt.md');
      const template = await fs.readFile(templatePath, 'utf-8');
      Logger.info('提示词模板加载成功', { templateLength: template.length });
      return template;
    } catch (error) {
      Logger.warning('加载提示词模板失败，使用默认模板', { error: error.message });
      return this.getDefaultPromptTemplate();
    }
  }

  // 默认提示词模板
  getDefaultPromptTemplate() {
    return `# 政府客户营销周复盘报告生成提示词

你是一个专业的政府客户营销复盘分析师。请严格按照以下要求生成报告：

## 重要约束条件
1. **严禁虚构内容**：只能基于用户实际填写的数据进行分析，不得添加任何未提供的信息
2. **条件性输出**：如果某个部分用户没有填写内容，则跳过该部分，不要生成相关内容
3. **数据真实性**：所有分析必须基于用户提供的真实数据，不得编造或推测
4. **格式规范**：使用标准的Markdown格式，表格必须对齐，确保可读性

## 输入数据格式
- 复盘时间区间：{dateRange}
- 被复盘人：{selectedUser}
- 复盘方式：{reviewMethod}
- 上周复盘计划完成情况：{lastWeekPlan}
- 上周行动回顾：{lastWeekActions}
- 本周行动计划：{weekPlan}
- 需领导协调事项：{coordinationItems}
- 其他事项：{otherItems}

## 输出要求

### 报告标题
**政府客户营销周复盘报告 ({dateRange})**

### 一、上周工作成果总结
**1.1 主要成果与亮点**
基于用户填写的上周行动回顾数据，总结主要成果：
- 政府客户接触情况
- 项目推进进展  
- 关键突破点

**1.2 上周计划完成情况分析**
{lastWeekPlan ? '基于用户填写的上周计划数据进行分析' : '用户未填写上周计划数据，跳过此部分'}

**1.3 每日行动复盘**
基于用户填写的每日行动数据，生成详细复盘表格：

| 日期 | 白天主要动作 | 白天结果 | 晚上主要动作 | 晚上结果 | 效果评估 |
|------|--------------|----------|--------------|----------|----------|
{根据用户填写的lastWeekActions数据生成具体内容}

### 二、政府客户营销策略分析
基于用户填写的行动数据，分析：
**2.1 客户关系维护情况**
- 重点客户接触频次
- 客户需求挖掘深度
- 客户满意度评估

**2.2 项目推进策略**
- 项目立项进展
- 技术方案对接
- 商务谈判进度

**2.3 竞品分析与市场洞察**
- 竞争对手动态
- 市场机会识别
- 差异化优势分析

### 三、本周行动计划
{weekPlan ? '基于用户填写的本周计划数据生成详细计划表：' : '用户未填写本周计划数据，跳过此部分'}

**3.1 重点任务安排**
| 序号 | 任务内容 | 期望结果 | 完成时间 | 所需资源 | 风险评估 |
|------|----------|----------|----------|----------|----------|
{根据用户填写的weekPlan数据生成具体内容}

**3.2 政府客户拜访计划**
基于本周计划，制定拜访计划

### 四、需协调事项与资源需求
{coordinationItems ? '基于用户填写的协调事项生成详细分析：' : '用户未填写协调事项，跳过此部分'}

**4.1 领导支持事项**
| 事项 | 具体需求 | 紧急程度 | 预期支持方式 | 时间要求 |
|------|----------|----------|--------------|----------|
{根据用户填写的coordinationItems数据生成具体内容}

**4.2 跨部门协作需求**
基于协调事项，分析所需部门支持

### 五、能力提升与改进建议
基于用户填写的所有数据，提供：
**5.1 个人能力提升建议**
- 政府客户沟通技巧
- 项目推进能力
- 商务谈判技能

**5.2 工作方法优化建议**
- 客户管理流程
- 信息收集方法
- 时间管理策略

**5.3 团队协作改进建议**
- 内部沟通机制
- 信息共享平台
- 协同作战模式

### 六、风险预警与应对措施
基于用户数据，识别：
**6.1 潜在风险识别**
| 风险类型 | 风险描述 | 影响程度 | 发生概率 | 应对措施 |
|----------|----------|----------|----------|----------|
{基于用户数据识别具体风险}

**6.2 应急预案**
- 客户关系维护预案
- 项目推进备选方案
- 竞争应对策略

## 格式要求
1. **必须用中文输出**，语言专业、准确
2. **使用标准Markdown格式**，确保表格对齐
3. **表格格式**：使用 | 分隔列，确保对齐
4. **标题层级**：使用 # ## ### 等标准格式
5. **列表格式**：使用 - 或 * 标记
6. **强调格式**：使用 **粗体** 和 *斜体*
7. **条件性内容**：如果用户未填写某部分，明确说明"用户未填写相关内容"

## 数据约束
- 只能基于用户实际填写的数据进行分析
- 不得添加任何未提供的信息
- 不得编造或推测数据
- 如果数据为空，明确说明"无相关数据"

请严格按照以上要求，基于用户提供的真实数据生成报告。`;
  }

  // 格式化用户数据
  formatUserData(reviewData) {
    try {
      const {
        dateRange,
        selectedUser,
        selectedUserName,
        reviewMethod,
        lastWeekPlan,
        lastWeekActions,
        weekPlan,
        coordinationItems,
        otherItems,
        pageContext,
        validationInfo,
        submissionTime,
        timezone,
        structuredTables
      } = reviewData;

      // 格式化上周复盘计划
      let lastWeekPlanText = '无';
      if (lastWeekPlan && Array.isArray(lastWeekPlan) && lastWeekPlan.length > 0) {
        lastWeekPlanText = lastWeekPlan.map((item, index) => {
          return `${index + 1}. 任务：${item.task || '无'}\n   期望结果：${item.expectedResult || '无'}\n   完成情况：${item.completion || '无'}`;
        }).join('\n\n');
      }

      // 格式化上周行动回顾
      let lastWeekActionsText = '无';
      if (lastWeekActions && Array.isArray(lastWeekActions) && lastWeekActions.length > 0) {
        lastWeekActionsText = lastWeekActions.map((action, index) => {
          const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
          const dayName = days[index] || `第${index + 1}天`;
          return `${dayName}：\n   白天-动作：${action.morningAction || '无'}\n   白天-结果：${action.morningResult || '无'}\n   晚上-动作：${action.eveningAction || '无'}\n   晚上-结果：${action.eveningResult || '无'}`;
        }).join('\n\n');
      }

      // 格式化本周行动计划
      let weekPlanText = '无';
      if (weekPlan && Array.isArray(weekPlan) && weekPlan.length > 0) {
        weekPlanText = weekPlan.map((item, index) => {
          return `${index + 1}. 任务：${item.task || '无'}\n   期望结果：${item.expectedResult || '无'}`;
        }).join('\n\n');
      }

      // 构建页面上下文说明
      let contextDescription = '';
      if (pageContext) {
        contextDescription = `
## 页面上下文信息

### 系统信息
- 系统名称：${pageContext.pageTitle}
- 系统描述：${pageContext.pageDescription}
- 提交时间：${submissionTime}
- 时区：${timezone}

### 表单字段说明
${Object.entries(pageContext.formFields || {}).map(([key, field]) => 
  `- ${field.label}：${field.description}${field.required ? '（必填）' : ''}`
).join('\n')}

### 表格结构说明
${Object.entries(pageContext.tableStructures || {}).map(([key, table]) => 
  `- ${table.title}：${table.description}\n  列结构：${table.columns.map(col => `${col.label}（${col.description}）`).join('、')}`
).join('\n\n')}

### 其他字段说明
${Object.entries(pageContext.otherFields || {}).map(([key, field]) => 
  `- ${field.label}：${field.description}`
).join('\n')}

### 数据验证信息
- 是否有历史数据：${validationInfo?.hasHistoricalData ? '是' : '否'}
- 上周计划项目数：${validationInfo?.totalLastWeekPlanItems || 0}
- 上周行动记录数：${validationInfo?.totalLastWeekActions || 0}
- 本周计划项目数：${validationInfo?.totalWeekPlanItems || 0}
- 是否有协调事项：${validationInfo?.hasCoordinationItems ? '是' : '否'}
- 是否有其他事项：${validationInfo?.hasOtherItems ? '是' : '否'}

---
`;
      }

      // 处理结构化表格数据
      const formattedStructuredTables = {};
      if (structuredTables) {
        Object.keys(structuredTables).forEach(key => {
          formattedStructuredTables[key] = structuredTables[key] || '';
        });
      }

      return {
        dateRange: dateRange ? `${dateRange[0]} 至 ${dateRange[1]}` : '未设置',
        selectedUser: selectedUserName || selectedUser || '未选择',
        reviewMethod: reviewMethod === 'offline' ? '线下复盘' : reviewMethod === 'online' ? '线上复盘' : '未选择',
        lastWeekPlan: lastWeekPlanText,
        lastWeekActions: lastWeekActionsText,
        weekPlan: weekPlanText,
        coordinationItems: coordinationItems || '无',
        otherItems: otherItems || '无',
        contextDescription: contextDescription,
        submissionTime: submissionTime,
        timezone: timezone,
        structuredTables: formattedStructuredTables
      };
    } catch (error) {
      Logger.error('格式化用户数据失败:', error);
      throw new Error('数据格式化失败');
    }
  }

  // 流式生成报告
  async generateReportStream(formattedData, onChunk) {
    try {
      const template = await this.readPromptTemplate();
      
      // 构建完整的提示词
      let fullPrompt = template
        .replace('{contextDescription}', formattedData.contextDescription || '')
        .replace('{dateRange}', formattedData.dateRange)
        .replace('{selectedUser}', formattedData.selectedUser)
        .replace('{reviewMethod}', formattedData.reviewMethod)
        .replace('{lastWeekPlan}', formattedData.lastWeekPlan)
        .replace('{lastWeekActions}', formattedData.lastWeekActions)
        .replace('{weekPlan}', formattedData.weekPlan)
        .replace('{coordinationItems}', formattedData.coordinationItems)
        .replace('{otherItems}', formattedData.otherItems)
        .replace('{submissionTime}', formattedData.submissionTime || new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString());

      // 替换结构化表格数据
      if (formattedData.structuredTables) {
        Object.keys(formattedData.structuredTables).forEach(key => {
          const placeholder = `{structuredTables.${key}}`;
          const value = formattedData.structuredTables[key];
          fullPrompt = fullPrompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      }

      // 获取当前LLM配置
      const llmConfig = this.getCurrentLLMConfig();
      Logger.llmRequest(llmConfig.baseURL, llmConfig.model, fullPrompt.length);

      // 构建请求数据
      const requestData = {
        model: llmConfig.model,
        messages: [
          {
            role: "system",
            content: "你是一个专业的销售复盘分析师，擅长分析销售数据并生成结构化的复盘报告。"
          },
          {
            role: "user",
            content: fullPrompt + "\n\n\\no_think"
          }
        ],
        stream: true, // 启用流式响应
        max_tokens: 4000,
        temperature: 0.7
      };

      // 发送流式请求
      const response = await axios({
        method: 'POST',
        url: `${llmConfig.baseURL}/chat/completions`,
        headers: {
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: requestData,
        responseType: 'stream',
        timeout: this.timeout
      });

      let fullContent = '';
      
      // 处理流式响应
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              Logger.llmResponse(fullContent, fullContent.length);
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const content = parsed.choices[0].delta.content;
                fullContent += content;
                
                // 调用回调函数发送内容块
                if (onChunk) {
                  onChunk(content);
                }
              }
            } catch (error) {
              // 忽略解析错误
            }
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          Logger.llmResponse(fullContent, fullContent.length);
          resolve(fullContent);
        });
        
        response.data.on('error', (error) => {
          Logger.llmError(error);
          reject(error);
        });
      });

    } catch (error) {
      Logger.llmError(error);
      
      // 如果是主LLM失败且未使用备用LLM，尝试切换到备用LLM
      if (!this.useBackup && this.backupBaseURL) {
        Logger.warning('主LLM请求失败，尝试切换到备用LLM', { error: error.message });
        if (this.switchToBackup()) {
          // 递归调用，使用备用LLM重试
          return this.generateReportStream(formattedData, onChunk);
        }
      }
      
      throw new Error(`LLM请求失败: ${error.message}`);
    }
  }

  // 原有的非流式生成方法（保留兼容性）
  async generateReport(reviewData) {
    try {
      // 格式化用户数据
      const formattedData = this.formatUserData(reviewData);
      
      // 读取提示词模板
      const template = await this.readPromptTemplate();
      
      // 构建完整的提示词
      let fullPrompt = template
        .replace('{dateRange}', formattedData.dateRange)
        .replace('{selectedUser}', formattedData.selectedUser)
        .replace('{reviewMethod}', formattedData.reviewMethod)
        .replace('{lastWeekPlan}', formattedData.lastWeekPlan)
        .replace('{lastWeekActions}', formattedData.lastWeekActions)
        .replace('{weekPlan}', formattedData.weekPlan)
        .replace('{coordinationItems}', formattedData.coordinationItems)
        .replace('{otherItems}', formattedData.otherItems);

      // 替换结构化表格数据
      if (formattedData.structuredTables) {
        Object.keys(formattedData.structuredTables).forEach(key => {
          const placeholder = `{structuredTables.${key}}`;
          const value = formattedData.structuredTables[key];
          fullPrompt = fullPrompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        });
      }

      // 获取当前LLM配置
      const llmConfig = this.getCurrentLLMConfig();
      Logger.llmRequest(llmConfig.baseURL, llmConfig.model, fullPrompt.length);

      const response = await axios({
        method: 'POST',
        url: `${llmConfig.baseURL}/chat/completions`,
        headers: {
          'Authorization': `Bearer ${llmConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: llmConfig.model,
          messages: [
            {
              role: "system",
              content: "你是一个专业的销售复盘分析师，擅长分析销售数据并生成结构化的复盘报告。"
            },
            {
              role: "user",
              content: fullPrompt + "\n\n\\no_think"
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        },
        timeout: this.timeout
      });

      const content = response.data.choices[0].message.content;
      Logger.llmResponse(content, content.length);

      return {
        success: true,
        data: content
      };

    } catch (error) {
      Logger.llmError(error);
      
      // 如果是主LLM失败且未使用备用LLM，尝试切换到备用LLM
      if (!this.useBackup && this.backupBaseURL) {
        Logger.warning('主LLM请求失败，尝试切换到备用LLM', { error: error.message });
        if (this.switchToBackup()) {
          // 递归调用，使用备用LLM重试
          return this.generateReport(reviewData);
        }
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new LLMService(); 