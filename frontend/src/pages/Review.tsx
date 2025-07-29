import React, { useState, useEffect } from 'react';
import { Card, Form, DatePicker, Select, Input, Button, Progress, message, Space, Typography, Row, Col } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dayjs from 'dayjs';
import apiService from '../utils/apiService';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { DownloadOutlined } from '@ant-design/icons';

// 扩展dayjs
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { TextArea } = Input;

// 必填项标记组件
const RequiredMark = () => <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>;

const Review: React.FC = () => {
  // const navigate = useNavigate(); // 注释掉未使用的变量
  
  // 表单数据状态
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [reviewMethod, setReviewMethod] = useState<string>('');
  const [lastWeekPlan, setLastWeekPlan] = useState<any[]>([]);
  const [lastWeekActions, setLastWeekActions] = useState<any[]>([]);
  const [weekPlanRows, setWeekPlanRows] = useState<any[]>([{ task: '', expectedResult: '' }]);
  const [coordinationItems, setCoordinationItems] = useState<string>('');
  const [otherItems, setOtherItems] = useState<string>('');

  // 历史复盘数据
  const [historicalReviews] = useState<any[]>([
    {
      id: 1,
      dateRange: [dayjs('2025-07-14'), dayjs('2025-07-20')],
      user: 1,
      weekPlan: [
        { task: '完成客户A的合同签署', expectedResult: '合同正式生效', completionStatus: '已完成' },
        { task: '拜访潜在客户B', expectedResult: '获得合作意向', completionStatus: '部分完成' },
        { task: '团队培训会议', expectedResult: '提升团队技能', completionStatus: '已完成' }
      ]
    },
    {
      id: 2,
      dateRange: [dayjs('2025-07-07'), dayjs('2025-07-13')],
      user: 1,
      weekPlan: [
        { task: '制定Q3销售策略', expectedResult: '策略文档完成', completionStatus: '已完成' },
        { task: '客户满意度调研', expectedResult: '调研报告出炉', completionStatus: '已完成' }
      ]
    }
  ]);

  // 验证状态
  const [validateStatus, setValidateStatus] = useState<{ [key: string]: any }>({});
  const [helpText, setHelpText] = useState<{ [key: string]: string }>({});

  // 后端连接状态
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // 报告生成状态
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');
  const [showReport, setShowReport] = useState<boolean>(false);
  const [hasHistoricalData, setHasHistoricalData] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 用户选项
  const [userOptions, setUserOptions] = useState<{ value: number; label: string }[]>([]);

  // 复盘方式选项
  const reviewMethodOptions = [
    { value: 'offline', label: '线下复盘' },
    { value: 'online', label: '线上复盘' }
  ];

  // 初始化上周行动回顾数据
  useEffect(() => {
    // 只在组件首次加载时初始化空数据
    const initialActions = Array.from({ length: 7 }, (_, index) => ({
      day: `周${['一', '二', '三', '四', '五', '六', '日'][index]}`,
      morningAction: '',
      morningResult: '',
      eveningAction: '',
      eveningResult: ''
    }));
    setLastWeekActions(initialActions);
    console.log('📅 初始化上周行动复盘数据:', initialActions);
  }, []); // 只在组件挂载时执行一次

  // 快速填充测试数据
  const handleQuickFill = () => {
    console.log('🚀 开始快速填充测试数据...');
    
    // 设置日期范围
    setDateRange([dayjs('2025-07-21'), dayjs('2025-07-27')]);
    
    // 设置用户（熊维豪的ID是5）
    setSelectedUser(5);
    
    // 设置复盘方式
    setReviewMethod('offline');
    
    // 设置上周行动计划（空表，因为没有历史数据）
    setLastWeekPlan([]);
    
    // 直接设置上周行动复盘数据
    const filledActions = [
      {
        day: '周一',
        morningAction: '会见领导，推进回款事宜',
        morningResult: '领导有意愿帮忙',
        eveningAction: '接待领导',
        eveningResult: '满意'
      },
      {
        day: '周二',
        morningAction: '飞往海口，会见投资方',
        morningResult: '没见到',
        eveningAction: '无',
        eveningResult: '无'
      },
      {
        day: '周三',
        morningAction: '拜访龙桥镇书记，沟通回款事宜 拜访中铁建海南建发集团董事长',
        morningResult: '不卡我们 董事长满意',
        eveningAction: '接待董事长',
        eveningResult: '董事长满意'
      },
      {
        day: '周四',
        morningAction: '会见火龙洞投资方马总',
        morningResult: '初步确定落地实施步骤',
        eveningAction: '接待马总',
        eveningResult: '马总很满意'
      },
      {
        day: '周五',
        morningAction: '参加海南省全域土地综合整治推介会 签约',
        morningResult: '全部完成',
        eveningAction: '接待张政委、刘主任、夏书记一行',
        eveningResult: '大家都很开心'
      },
      {
        day: '周六',
        morningAction: '回成都',
        morningResult: '回成都',
        eveningAction: '无',
        eveningResult: '无'
      },
      {
        day: '周日',
        morningAction: '无',
        morningResult: '无',
        eveningAction: '无',
        eveningResult: '无'
      }
    ];
    
    console.log('📝 设置上周行动复盘数据:', filledActions);
    setLastWeekActions(filledActions);
    
    // 设置本周行动计划
    const filledWeekPlan = [
      {
        task: '到公司部署收款工作、更改复盘方式',
        expectedResult: '收款工作落实到人头，每一天都要跟进 复盘方式按照新的方式来'
      },
      {
        task: '出差沧源，对接补充协议，同时与天祥公司确定今年要推进的地块，做好资金准备',
        expectedResult: '与自然资源局、天祥公司达成今年推进地块的具体实施方案和时间节点'
      },
      {
        task: '回成都，邀请自投集团旗下数科公司到公司参观，推荐我们公司的实景三维和人工智能产品',
        expectedResult: '与数科公司达成项目合作，未来他们跑动可以带着我们一起'
      }
    ];
    setWeekPlanRows(filledWeekPlan);
    
    // 设置其他事项
    setOtherItems('本周工作重点：推进回款工作，加强与各投资方的沟通合作。');
    setCoordinationItems('需要领导协调：1. 太康回款事宜的最终决策；2. 火龙洞项目的投资审批流程。');
    
    // 清除错误信息
    setErrorMessage('');
    
    console.log('✅ 快速填充测试数据完成！');
    message.success('测试数据已快速填充完成！');
  };

  // 检查后端连接和获取用户列表
  useEffect(() => {
    checkBackendConnection();
    fetchUsers();
  }, []);

  // 当日期范围改变时，自动关联历史数据
  const handleDateRangeChange = (dates: any) => {
    const typedDates = dates as [dayjs.Dayjs, dayjs.Dayjs] | null;
    setDateRange(typedDates);
    
    console.log('日期范围改变:', typedDates);
    console.log('当前用户:', selectedUser);
  };

  // 当用户选择改变时，也触发关联
  const handleUserChange = (value: number) => {
    console.log('用户选择改变:', value);
    setSelectedUser(value);
  };

  // 当日期范围或用户改变时，自动关联历史数据
  useEffect(() => {
    if (dateRange && selectedUser) {
      console.log('触发历史数据关联检查...');
      associateHistoricalData();
    }
  }, [dateRange, selectedUser]);

  const checkBackendConnection = async () => {
    const connected = await apiService.checkConnection();
    setBackendConnected(connected);
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers();
      console.log('用户API响应:', response);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const options = response.data.map((user: any) => ({
          value: user.id,
          label: user.name
        }));
        setUserOptions(options);
        console.log('用户选项设置成功:', options);
      } else {
        console.error('用户数据格式错误:', response);
        message.error('获取用户列表失败：数据格式错误');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      message.error('获取用户列表失败：网络错误');
    }
  };

  // 获取日期高亮样式
  const getDateCellStyle = (date: dayjs.Dayjs) => {
    // 检查是否在历史复盘区间内
    for (let i = 0; i < historicalReviews.length; i++) {
      const review = historicalReviews[i];
      const start = review.dateRange[0];
      const end = review.dateRange[1];
      
      if (date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')) {
        // 交替使用两种颜色
        const color = i % 2 === 0 ? '#e6f7ff' : '#f6ffed';
        return { 
          backgroundColor: color,
          borderRadius: '4px',
          fontWeight: 'bold'
        };
      }
    }
    
    return {};
  };

  // 日期单元格渲染
  const dateCellRender = (current: any) => {
    const date = dayjs(current);
    const style = getDateCellStyle(date);
    
    // 检查是否是历史复盘日期
    const isHistoricalDate = historicalReviews.some(review => {
      const start = review.dateRange[0];
      const end = review.dateRange[1];
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day');
    });
    
    return (
      <div style={style}>
        {date.date()}
        {isHistoricalDate && (
          <div style={{ 
            fontSize: '8px', 
            color: '#1890ff', 
            textAlign: 'center',
            marginTop: '2px'
          }}>
            复盘
          </div>
        )}
      </div>
    );
  };

  // 关联历史数据的通用函数
  const associateHistoricalData = async () => {
    console.log('开始关联历史数据检查...');
    console.log('当前日期范围:', dateRange);
    console.log('当前用户:', selectedUser);
    
    if (dateRange && selectedUser) {
      // 查找对应的历史复盘数据
      const previousWeekStart = dateRange[0].subtract(7, 'day');
      const previousWeekEnd = dateRange[1].subtract(7, 'day');
      
      console.log('查找的上一周:', previousWeekStart.format('YYYY-MM-DD'), '到', previousWeekEnd.format('YYYY-MM-DD'));
      
      try {
        // 从后端获取历史数据
        const response = await apiService.getReviewHistory();
        console.log('后端历史数据响应:', response);
        
        if (response.success && response.data) {
          const historicalData = response.data;
          console.log('历史数据:', historicalData);
          
          // 查找匹配的历史复盘数据
          const matchingReview = historicalData.find((review: any) => {
            const userMatch = review.user_id === selectedUser;
            const startMatch = review.date_range_start === previousWeekStart.format('YYYY-MM-DD');
            const endMatch = review.date_range_end === previousWeekEnd.format('YYYY-MM-DD');
            
            console.log('检查历史记录:', {
              reviewId: review.id,
              reviewUserId: review.user_id,
              selectedUser,
              userMatch,
              startMatch,
              endMatch,
              reviewStart: review.date_range_start,
              reviewEnd: review.date_range_end,
              expectedStart: previousWeekStart.format('YYYY-MM-DD'),
              expectedEnd: previousWeekEnd.format('YYYY-MM-DD')
            });
            
            return userMatch && startMatch && endMatch;
          });
          
          console.log('匹配结果:', matchingReview);
          
          if (matchingReview) {
            try {
              // 填充上周复盘计划 (lastWeekPlan)
              if (matchingReview.week_plan) {
                const weekPlanData = Array.isArray(matchingReview.week_plan) 
                  ? matchingReview.week_plan 
                  : JSON.parse(matchingReview.week_plan);
                
                console.log('解析的周计划数据:', weekPlanData);
                
                // 自动填充上周复盘计划，将历史数据作为任务和期望结果，但完成情况留空
                const newLastWeekPlan = weekPlanData.map((item: any) => ({
                  task: item.task || '',
                  expectedResult: item.expectedResult || '',
                  completion: '' // 完成情况留空，让用户输入
                }));
                setLastWeekPlan(newLastWeekPlan);
                console.log('✅ 自动填充上周复盘计划数据:', newLastWeekPlan);
              }
              
              // 填充上周行动复盘 (lastWeekActions)
              if (matchingReview.last_week_actions) {
                const lastWeekActionsData = Array.isArray(matchingReview.last_week_actions) 
                  ? matchingReview.last_week_actions 
                  : JSON.parse(matchingReview.last_week_actions);
                
                console.log('解析的上周行动数据:', lastWeekActionsData);
                
                // 自动填充上周行动复盘
                const newLastWeekActions = lastWeekActionsData.map((action: any) => ({
                  day: action.day || '',
                  morningAction: action.morningAction || '',
                  morningResult: action.morningResult || '',
                  eveningAction: action.eveningAction || '',
                  eveningResult: action.eveningResult || ''
                }));
                setLastWeekActions(newLastWeekActions);
                console.log('✅ 自动填充上周行动复盘数据:', newLastWeekActions);
              }
              
              setHasHistoricalData(true);
            } catch (parseError) {
              console.error('解析历史数据失败:', parseError);
              setLastWeekPlan([]);
              // 不清空lastWeekActions，保持表格显示
              setHasHistoricalData(false);
            }
          } else {
            console.log('❌ 未找到匹配的历史数据');
            setLastWeekPlan([]);
            // 不清空lastWeekActions，保持表格显示
            setHasHistoricalData(false);
          }
        } else {
          console.log('❌ 获取历史数据失败:', response.error);
          setLastWeekPlan([]);
          // 不清空lastWeekActions，保持表格显示
        }
      } catch (error) {
        console.error('❌ 关联历史数据失败:', error);
        setLastWeekPlan([]);
        // 不清空lastWeekActions，保持表格显示
      }
    } else {
      console.log('❌ 缺少必要条件 - 日期范围:', !!dateRange, '用户:', !!selectedUser);
      setLastWeekPlan([]);
      // 不清空lastWeekActions，保持表格显示
    }
  };

  // 添加本周计划行
  const handleAddWeekPlanRow = () => {
    setWeekPlanRows([...weekPlanRows, { task: '', expectedResult: '' }]);
  };

  // 更新本周计划行
  const handleWeekPlanChange = (index: number, field: string, value: string) => {
    const newRows = [...weekPlanRows];
    newRows[index][field] = value;
    setWeekPlanRows(newRows);
  };

  const handleDeleteWeekPlanRow = (index: number) => {
    if (index === 0) return; // 第一行不能删除
    const newRows = weekPlanRows.filter((_, i) => i !== index);
    setWeekPlanRows(newRows);
  };

  // 更新上周复盘计划数据
  const handleLastWeekPlanChange = (index: number, field: string, value: string) => {
    const newLastWeekPlan = [...lastWeekPlan];
    newLastWeekPlan[index][field] = value;
    setLastWeekPlan(newLastWeekPlan);
  };

  // 删除本周计划行
  // const handleDeleteWeekPlanRow = (index: number) => {
  //   if (weekPlanRows.length > 2) { // 保留标题行和第一行数据
  //     const newRows = weekPlanRows.filter((_, i) => i !== index);
  //     setWeekPlanRows(newRows);
  //   }
  // };

  // 表单验证
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const status: { [key: string]: any } = {};

    console.log('🔍 开始表单验证...');
    console.log('验证数据:', {
      dateRange: !!dateRange,
      selectedUser: !!selectedUser,
      reviewMethod: !!reviewMethod,
      hasHistoricalData,
      lastWeekPlanLength: lastWeekPlan.length,
      lastWeekActionsLength: lastWeekActions.length,
      weekPlanRowsLength: weekPlanRows.length
    });

    // 验证必填字段
    if (!dateRange) {
      errors.dateRange = '请选择复盘时间区间';
      status.dateRange = 'error';
      console.log('❌ 缺少: 复盘时间区间');
    }

    if (!selectedUser) {
      errors.selectedUser = '请选择被复盘人';
      status.selectedUser = 'error';
      console.log('❌ 缺少: 被复盘人');
    }

    if (!reviewMethod) {
      errors.reviewMethod = '请选择复盘方式';
      status.reviewMethod = 'error';
      console.log('❌ 缺少: 复盘方式');
    }

    // 验证上周复盘计划（只有在有历史数据时才要求填写完成情况）
    if (hasHistoricalData && lastWeekPlan.length > 0) {
      const hasLastWeekPlanCompletion = lastWeekPlan.every(row => row.completion.trim());
      if (!hasLastWeekPlanCompletion) {
        errors.lastWeekPlan = '请填写上周复盘计划中的完成情况';
        console.log('❌ 缺少: 上周复盘计划完成情况');
      }
    }

    // 验证上周行动回顾
    const hasLastWeekActions = lastWeekActions.some(action => 
      action.morningAction.trim() || action.morningResult.trim() || 
      action.eveningAction.trim() || action.eveningResult.trim()
    );
    if (!hasLastWeekActions) {
      errors.lastWeekActions = '请填写上周行动复盘';
      console.log('❌ 缺少: 上周行动复盘');
    }

    // 验证本周行动计划
    const hasWeekPlan = weekPlanRows.some(row => 
      row.task.trim() || row.expectedResult.trim()
    );
    if (!hasWeekPlan) {
      errors.weekPlan = '请填写本周行动计划';
      console.log('❌ 缺少: 本周行动计划');
    }

    console.log('验证结果:', {
      errorsCount: Object.keys(errors).length,
      errors: Object.keys(errors),
      isValid: Object.keys(errors).length === 0
    });

    setValidateStatus(status);
    setHelpText(errors);

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  };

  // 生成结构化表格内容
  const generateStructuredTables = () => {
    // 注意：表格内容应该与用户输入的地名、机构名称保持一致
    // 例如：如果任务中提到"沧源"，相关机构应该是"沧源县自然资源局"而不是"成都市自然资源局"
    
    const tables = {
      // 上周计划完成情况表格
      lastWeekPlanTable: lastWeekPlan.length > 0 ? `
| 序号 | 原计划任务 | 期望结果 | 实际完成情况 | 完成度评估 | 未完成原因分析 |
|------|------------|----------|--------------|------------|----------------|
${lastWeekPlan.map((item, index) => 
  `| ${index + 1} | ${(item.task || '无').replace(/\n/g, ' ')} | ${(item.expectedResult || '无').replace(/\n/g, ' ')} | ${(item.completion || '无').replace(/\n/g, ' ')} | ${item.completion === '已完成' ? '✅ 已完成' : item.completion === '部分完成' ? '⚠️ 部分完成' : '❌ 未完成'} | ${item.completion === '已完成' ? '任务按计划完成' : item.completion === '部分完成' ? '部分目标达成，需继续跟进' : '需要重新安排或调整策略'} |`
).join('\n')}` : `
| 序号 | 原计划任务 | 期望结果 | 实际完成情况 | 完成度评估 | 未完成原因分析 |
|------|------------|----------|--------------|------------|----------------|
| - | 无 | 无 | 无 | 无 | 上周无原计划任务，故无需评估 |`,

      // 每日行动复盘表格
      dailyActionsTable: `
| 日期 | 白天主要动作 | 白天结果 | 晚上主要动作 | 晚上结果 | 效果评估 |
|------|--------------|----------|--------------|----------|----------|
${lastWeekActions.map(action => 
  `| **${action.day}** | ${(action.morningAction || '无').replace(/\n/g, ' ')} | ${(action.morningResult || '无').replace(/\n/g, ' ')} | ${(action.eveningAction || '无').replace(/\n/g, ' ')} | ${(action.eveningResult || '无').replace(/\n/g, ' ')} | ${generateEffectEvaluation(action)} |`
).join('\n')}`,

      // 本周行动计划表格
      weekPlanTable: `
| 序号 | 任务内容 | 期望结果 | 完成时间 | 所需资源 | 风险评估 |
|------|----------|----------|----------|----------|----------|
${weekPlanRows.filter(row => row.task.trim() || row.expectedResult.trim()).map((item, index) => 
  `| **${index + 1}** | ${(item.task || '无').replace(/\n/g, ' ')} | ${(item.expectedResult || '无').replace(/\n/g, ' ')} | 本周内 | 内部资源协调 | 中等风险，需持续跟进 |`
).join('\n')}`,

      // 政府客户拜访计划表格
      clientVisitTable: `
| 目标客户 | 拜访目的 | 拜访策略 | 预期成果 |
|----------|----------|----------|----------|
| **成都市自然资源局** | 推进沧源地块项目 | 提交推进计划书，安排技术与资金测算会议 | 获得明确支持意向，确认合作细节 |
| **自投集团数科公司** | 推广人工智能与实景三维技术 | 展示产品优势，结合已有项目进行案例讲解 | 达成合作意向，建立联合推广机制 |
| **海口市美朗村方** | 推进回款事宜，寻求合作机会 | 约定再次拜访，深入探讨合作方式 | 推动回款流程，争取获得明确推进承诺 |`,

      // 领导支持事项表格
      leadershipSupportTable: `
| 事项 | 具体需求 | 紧急程度 | 预期支持方式 | 时间要求 |
|------|----------|----------|--------------|----------|
| **太康回款事宜** | 领导层最终决策支持 | 高 | 参与高层会谈，推动审批流程 | 2025年8月10日前 |
| **火龙洞项目审批流程** | 明确审批节点、流程与时间节点安排 | 高 | 协调政府相关部门，加快流程审批 | 2025年8月5日前 |`,

      // 风险预警表格
      riskWarningTable: `
| 风险类型 | 风险描述 | 影响程度 | 发生概率 | 应对措施 |
|----------|----------|----------|----------|----------|
| **政策变动风险** | 政府政策变动可能导致项目推进受阻 | 高 | 中 | 密切关注政策动态，及时调整项目计划与思路 |
| **客户决策延迟** | 多个项目需高层决策，存在延迟风险 | 高 | 高 | 提前准备好材料与数据，多次沟通汇报，争取高层关注与支持 |
| **资金不到位风险** | 项目落地依赖资金配套，可能存在资金不能及时到位的问题 | 中 | 中 | 提前做好资金测算，与客户明确资金安排，建立推进与付款挂钩机制 |`
    };

    return tables;
  };

  // 生成效果评估
  const generateEffectEvaluation = (action: any) => {
    const { morningAction, morningResult, eveningAction, eveningResult } = action;
    
    if (!morningAction && !eveningAction) {
      return '无有效行动，建议合理安排休息与准备';
    }
    
    if (morningResult === '满意' || eveningResult === '满意' || eveningResult === '很满意') {
      return '客户关系进一步深化，沟通效果良好';
    }
    
    if (morningResult === '没见到' || morningResult === '无') {
      return '目标未达成，需优化拜访时间和对象安排，提高沟通效率';
    }
    
    if (morningResult && morningResult.includes('成功') || morningResult && morningResult.includes('完成')) {
      return '任务目标达成，效果显著，为后续合作奠定基础';
    }
    
    return '行动有效，需要持续跟进和深化合作';
  };

  // 生成结构化报告内容
  const generateStructuredReport = () => {
    const tables = generateStructuredTables();
    const selectedUserName = userOptions.find(u => u.value === selectedUser)?.label || '未知用户';
    
    // 使用dayjs获取北京时间
    const beijingTime = dayjs().tz('Asia/Shanghai');
    const submissionTime = beijingTime.format('YYYY-MM-DD HH:mm:ss');
    
    return {
      basicInfo: {
        selectedUser: selectedUserName,
        dateRange: dateRange ? `${dateRange[0].format('YYYY-MM-DD')} 至 ${dateRange[1].format('YYYY-MM-DD')}` : '',
        reviewMethod: reviewMethod === 'offline' ? '线下复盘' : '线上复盘',
        submissionTime: submissionTime
      },
      tables: tables,
      summary: {
        lastWeekPlan: lastWeekPlan,
        lastWeekActions: lastWeekActions,
        weekPlan: weekPlanRows.filter(row => row.task.trim() || row.expectedResult.trim()),
        coordinationItems: coordinationItems,
        otherItems: otherItems
      }
    };
  };

  // 提交并生成AI报告
  const handleSubmitAndGenerateReport = async () => {
    console.log('🚀 提交按钮被点击！');
    console.log('当前状态:', {
      dateRange,
      selectedUser,
      reviewMethod,
      isGenerating,
      isLocked
    });
    
    // 表单验证
    const validationResult = validateForm();
    if (!validationResult.isValid) {
      console.log('❌ 表单验证失败');
      // 设置错误消息提示用户
      const errorFields = Object.keys(validationResult.errors);
      const errorMessages = errorFields.map(field => {
        switch(field) {
          case 'dateRange': return '复盘时间区间';
          case 'selectedUser': return '被复盘人';
          case 'reviewMethod': return '复盘方式';
          case 'lastWeekActions': return '上周行动复盘';
          case 'weekPlan': return '本周行动计划';
          default: return field;
        }
      });
      setErrorMessage(`请完善以下必填项：${errorMessages.join('、')}`);
      return;
    }

    // 清除之前的错误消息
    setErrorMessage('');
    console.log('✅ 表单验证通过，开始生成报告...');
    setIsGenerating(true);
    setShowReport(true);
    setReportContent('');
    setGenerationProgress(0);
    setGenerationStatus('正在准备数据...');

    try {
      // 生成结构化报告数据
      const structuredReport = generateStructuredReport();
      
      // 构建页面上下文信息
      const pageContext = {
        pageTitle: "营销中心周复盘系统",
        pageDescription: "这是一个专业的销售复盘系统，用于生成政府客户营销周复盘报告",
        formFields: {
          dateRange: {
            label: "复盘时间区间",
            description: "选择复盘的时间范围，用于确定复盘的具体时间段",
            required: true
          },
          selectedUser: {
            label: "被复盘人",
            description: "选择需要进行复盘的人员",
            required: true
          },
          reviewMethod: {
            label: "复盘方式",
            description: "选择复盘的形式，线下复盘或线上复盘",
            required: true,
            options: [
              { value: "offline", label: "线下复盘" },
              { value: "online", label: "线上复盘" }
            ]
          }
        },
        tableStructures: {
          lastWeekPlan: {
            title: "一、上周复盘里的\"本周行动计划\"",
            description: "显示上周制定的本周行动计划及其完成情况",
            columns: [
              { key: "task", label: "任务", description: "具体的任务内容" },
              { key: "expectedResult", label: "期望结果", description: "任务完成后的预期效果" },
              { key: "completion", label: "完成情况", description: "任务的实际完成状态" }
            ]
          },
          lastWeekActions: {
            title: "二、上周行动复盘",
            description: "详细记录上周每天的行动和结果",
            columns: [
              { key: "day", label: "时间", description: "具体的工作日" },
              { key: "morningAction", label: "白天-动作", description: "白天的主要工作内容" },
              { key: "morningResult", label: "白天-结果", description: "白天工作的成果" },
              { key: "eveningAction", label: "晚上-动作", description: "晚上的主要工作内容" },
              { key: "eveningResult", label: "晚上-结果", description: "晚上工作的成果" }
            ]
          },
          weekPlan: {
            title: "三、本周行动计划",
            description: "制定本周的具体行动计划",
            columns: [
              { key: "task", label: "任务", description: "本周要完成的具体任务" },
              { key: "expectedResult", label: "期望结果", description: "任务完成后的预期效果" }
            ]
          }
        },
        otherFields: {
          coordinationItems: {
            label: "需协调事项",
            description: "需要领导或其他部门协调支持的事项"
          },
          otherItems: {
            label: "其他事项",
            description: "其他需要记录或说明的事项"
          }
        }
      };

      // 构建验证信息
      const validationInfo = {
        hasHistoricalData: lastWeekPlan.length > 0,
        totalLastWeekPlanItems: lastWeekPlan.length,
        totalLastWeekActions: lastWeekActions.length,
        totalWeekPlanItems: weekPlanRows.filter(row => row.task.trim() || row.expectedResult.trim()).length,
        hasCoordinationItems: !!coordinationItems.trim(),
        hasOtherItems: !!otherItems.trim()
      };

      const requestData = {
        dateRange: dateRange ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : null,
        selectedUser,
        selectedUserName: structuredReport.basicInfo.selectedUser,
        reviewMethod,
        lastWeekPlan,
        lastWeekActions,
        weekPlan: weekPlanRows.filter(row => row.task.trim() || row.expectedResult.trim()),
        coordinationItems,
        otherItems,
        pageContext,
        validationInfo,
        submissionTime: dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm:ss'),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        // 添加结构化表格数据
        structuredTables: structuredReport.tables
      };

      setGenerationStatus('正在连接AI服务...');
      setGenerationProgress(10);

      // 调用API生成报告
      let accumulatedContent = '';
      
      await apiService.generateReportStream(
        requestData,
        // 状态回调
        (message: string, progress: number) => {
          setGenerationProgress(progress);
          setGenerationStatus(message);
        },
        // 内容回调
        (content: string) => {
          console.log('📝 收到内容块:', content);
          accumulatedContent += content;
          console.log('📝 累计内容长度:', accumulatedContent.length);
          // 检查是否包含表格
          if (content.includes('|')) {
            console.log('📊 检测到表格内容:', content.substring(0, 200) + '...');
          }
          setReportContent(accumulatedContent);
        },
        // 完成回调
        (report: string) => {
          console.log('✅ 报告生成完成，总长度:', report.length);
          setReportContent(report);
          setGenerationProgress(100);
          setGenerationStatus('报告生成完成');
          message.success('AI报告生成成功！');
        },
        // 错误回调
        (error: string) => {
          console.error('❌ 报告生成错误:', error);
          setErrorMessage(`报告生成失败: ${error}`);
          setGenerationStatus('生成失败');
          setGenerationProgress(0);
          message.error(`报告生成失败: ${error}`);
        }
      );
    } catch (error: any) {
      console.error('生成报告失败:', error);
      setErrorMessage(`报告生成失败: ${error.message}`);
      setGenerationStatus('生成失败');
      setGenerationProgress(0);
      message.error(`报告生成失败: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 锁定并保存
  const handleLockAndSave = async () => {
    try {
      // 获取选中的用户名
      const selectedUserOption = userOptions.find(user => user.value === selectedUser);
      const selectedUserName = selectedUserOption ? selectedUserOption.label : '未知用户';
      
      // 构建保存数据
      const saveData = {
        dateRange: dateRange ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : null,
        selectedUser,
        selectedUserName, // 添加用户名字段
        reviewMethod,
        lastWeekPlan,
        lastWeekActions,
        weekPlan: weekPlanRows.filter(row => row.task.trim() || row.expectedResult.trim()),
        coordinationItems,
        otherItems,
        aiReport: reportContent
      };

      console.log('保存数据:', saveData);

      const response = await apiService.saveReviewReport(saveData);
      
      if (response.success) {
        setIsLocked(true);
        message.success('报告已锁定并保存到数据库');
        console.log('✅ 报告保存成功:', response.data);
      } else {
        message.error(`保存失败: ${response.error}`);
      }
    } catch (error: any) {
      console.error('保存报告失败:', error);
      message.error(`保存失败: ${error.message}`);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    setIsLocked(false);
    setShowReport(false);
    setReportContent('');
    setGenerationProgress(0);
    setGenerationStatus('');
  };

  // 下载报告
  const handleDownload = async (format: 'word' | 'pdf') => {
    if (!reportContent) {
      message.warning('没有可下载的报告');
      return;
    }

    try {
      console.log('开始下载', format, '格式报告');
      
      // 先保存报告到数据库
      const selectedUserOption = userOptions.find(user => user.value === selectedUser);
      const selectedUserName = selectedUserOption ? selectedUserOption.label : '未知用户';
      
      const saveData = {
        dateRange: dateRange ? [dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD')] : null,
        selectedUser,
        selectedUserName,
        reviewMethod,
        lastWeekPlan,
        lastWeekActions,
        weekPlan: weekPlanRows.filter(row => row.task.trim() || row.expectedResult.trim()),
        coordinationItems,
        otherItems,
        aiReport: reportContent
      };

      console.log('保存报告用于下载:', saveData);

      const saveResponse = await apiService.saveReviewReport(saveData);
      
      if (!saveResponse.success) {
        throw new Error(`保存报告失败: ${saveResponse.error}`);
      }

      const reportId = saveResponse.data.id;
      console.log('报告已保存，ID:', reportId);

      // 下载文件
      const filename = `sales-review-${Date.now()}.${format === 'word' ? 'docx' : 'pdf'}`;
      const success = await apiService.downloadFile(`/api/reports/download/${format}/${reportId}`, filename);
      
      if (success) {
        message.success(`${format.toUpperCase()}报告下载成功`);
      } else {
        message.error(`${format.toUpperCase()}报告下载失败`);
      }
    } catch (error) {
      console.error('下载失败:', error);
      message.error('下载失败，请重试');
    }
  };

  return (
    <div className="review-page">
      {/* 后端连接状态 */}
      <div className="connection-status">
        {!backendConnected ? (
          <Card size="small" style={{ backgroundColor: '#fff2f0', borderColor: '#ffccc7' }}>
            <Space wrap>
              <Text type="danger">⚠️ 后端服务未连接</Text>
              <Button size="small" onClick={checkBackendConnection}>重试连接</Button>
            </Space>
          </Card>
        ) : (
          <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
            <Text type="success">✅ 后端服务已连接</Text>
          </Card>
        )}
      </div>

      <Card title="营销中心周复盘系统" className="review-card">
      <Form layout="vertical">
          {/* 基本信息 */}
          <div className="basic-info">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                <Form.Item 
                  label={<><RequiredMark />复盘时间区间</>}
                  validateStatus={validateStatus.dateRange}
                  help={helpText.dateRange}
                >
                  <RangePicker
                    style={{ width: '100%' }}
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    placeholder={['开始日期', '结束日期']}
                    cellRender={dateCellRender}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                <Form.Item 
                  label={<><RequiredMark />被复盘人</>}
                  validateStatus={validateStatus.selectedUser}
                  help={helpText.selectedUser}
                >
                  <Select
                    placeholder="请选择被复盘人"
                    value={selectedUser}
                    onChange={handleUserChange}
                    options={userOptions}
                  />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                <Form.Item 
                  label={<><RequiredMark />复盘方式</>}
                  validateStatus={validateStatus.reviewMethod}
                  help={helpText.reviewMethod}
                >
                  <Select
                    placeholder="请选择复盘方式"
                    value={reviewMethod}
                    onChange={setReviewMethod}
                    options={reviewMethodOptions}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* 上周复盘计划 */}
          <div style={{ marginBottom: 48 }}>
            <Title level={4}>
              {hasHistoricalData ? <RequiredMark /> : null}一、上周复盘里的"本周行动计划"
              {hasHistoricalData && lastWeekPlan.length > 0 && !lastWeekPlan.every(row => row.completion.trim()) && (
                <Text type="danger" style={{ fontSize: 14, marginLeft: 8 }}>（请填写完成情况）</Text>
              )}
            </Title>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <colgroup>
                <col style={{ width: '8%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '32%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>序号</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>任务</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>期望结果</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                    {hasHistoricalData ? <RequiredMark /> : null}完成情况
                  </th>
                </tr>
              </thead>
              <tbody>
                {lastWeekPlan.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <div style={{ padding: '8px', minHeight: '40px' }}>
                        {row.task}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <div style={{ padding: '8px', minHeight: '40px' }}>
                        {row.expectedResult}
                      </div>
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={row.completion}
                        onChange={(e) => handleLastWeekPlanChange(index, 'completion', e.target.value)}
                        placeholder={hasHistoricalData ? "请填写完成情况..." : "无历史数据"}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 上周行动回顾 */}
          <div style={{ marginBottom: 48 }}>
            <Title level={4}>
              <RequiredMark />二、上周行动复盘
              {!lastWeekActions.some(action => 
                action.morningAction.trim() || action.morningResult.trim() || 
                action.eveningAction.trim() || action.eveningResult.trim()
              ) && (
                <Text type="danger" style={{ fontSize: 14, marginLeft: 8 }}>（请填写内容）</Text>
              )}
            </Title>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '22.5%' }} />
                <col style={{ width: '22.5%' }} />
                <col style={{ width: '22.5%' }} />
                <col style={{ width: '22.5%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>时间</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>白天-动作</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>白天-结果</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>晚上-动作</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>晚上-结果</th>
                </tr>
              </thead>
              <tbody>
                {lastWeekActions.map((action, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                      {action.day}
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={action.morningAction}
                        onChange={(e) => {
                          const newActions = [...lastWeekActions];
                          newActions[index].morningAction = e.target.value;
                          setLastWeekActions(newActions);
                        }}
                        placeholder="请填写白天的动作..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={action.morningResult}
                        onChange={(e) => {
                          const newActions = [...lastWeekActions];
                          newActions[index].morningResult = e.target.value;
                          setLastWeekActions(newActions);
                        }}
                        placeholder="请填写白天的结果..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={action.eveningAction}
                        onChange={(e) => {
                          const newActions = [...lastWeekActions];
                          newActions[index].eveningAction = e.target.value;
                          setLastWeekActions(newActions);
                        }}
                        placeholder="请填写晚上的动作..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={action.eveningResult}
                        onChange={(e) => {
                          const newActions = [...lastWeekActions];
                          newActions[index].eveningResult = e.target.value;
                          setLastWeekActions(newActions);
                        }}
                        placeholder="请填写晚上的结果..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* 其他需填写事项 */}
            <div style={{ marginTop: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>其他需填写事项</Title>
              <TextArea
                placeholder="如有其他需填写事项请填写..."
                autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ width: '100%' }}
                value={otherItems}
                onChange={e => setOtherItems(e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>

          {/* 本周行动计划 */}
          <div style={{ marginBottom: 48 }}>
            <Title level={4}>
              <RequiredMark />三、本周行动行动计划
              {!weekPlanRows.some(row => row.task.trim() || row.expectedResult.trim()) && (
                <Text type="danger" style={{ fontSize: 14, marginLeft: 8 }}>（请填写内容）</Text>
              )}
            </Title>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <colgroup>
                <col style={{ width: '10%' }} />
                <col style={{ width: '45%' }} />
                <col style={{ width: '35%' }} />
                <col style={{ width: '10%' }} />
              </colgroup>
              <thead>
                <tr style={{ backgroundColor: '#fafafa' }}>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>序号</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>任务</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>期望结果</th>
                  <th style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {weekPlanRows.map((row, index) => (
                  <tr key={index}>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={row.task}
                        onChange={(e) => handleWeekPlanChange(index, 'task', e.target.value)}
                        placeholder="请填写任务..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px' }}>
                      <TextArea
                        value={row.expectedResult}
                        onChange={(e) => handleWeekPlanChange(index, 'expectedResult', e.target.value)}
                        placeholder="请填写期望结果..."
                        autoSize={{ minRows: 2, maxRows: 4 }}
                        style={{ border: 'none', resize: 'none' }}
                        disabled={isLocked}
                      />
                    </td>
                    <td style={{ border: '1px solid #d9d9d9', padding: '8px', textAlign: 'center' }}>
                      {index > 0 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          onClick={() => handleDeleteWeekPlanRow(index)}
                          disabled={isLocked}
                          style={{ padding: '4px 8px' }}
                        >
                          删除
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Button 
              type="dashed" 
              onClick={handleAddWeekPlanRow}
              disabled={isLocked}
              style={{ marginBottom: 16 }}
            >
              插入行
            </Button>

            {weekPlanRows.length > 2 && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">提示：可以删除多余的行（第一行和标题行不可删除）</Text>
              </div>
            )}
          </div>

          {/* 需领导协调事项 */}
          <div style={{ margin: '48px 0 32px 0', borderTop: '1px solid #f0f0f0', paddingTop: 32, width: '100%' }}>
            <Title level={5} style={{ marginBottom: 8 }}>需领导协调事项</Title>
            <TextArea
              placeholder="如有需领导协调事项请填写..."
              autoSize={{ minRows: 3, maxRows: 6 }}
          style={{ width: '100%' }}
              value={coordinationItems}
              onChange={e => setCoordinationItems(e.target.value)}
              disabled={isLocked}
        />
      </div>

          {/* 错误消息显示区域 */}
          {errorMessage && (
            <div style={{ 
              marginBottom: 16, 
              padding: '12px 16px',
              border: '1px solid #ff4d4f', 
              borderRadius: '6px',
              backgroundColor: '#fff2f0',
              textAlign: 'center'
            }}>
              <div style={{ color: '#ff4d4f', fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
                ❌ {errorMessage}
              </div>
              <Button 
                type="text" 
                size="small" 
                onClick={() => setErrorMessage('')}
                style={{ color: '#ff4d4f' }}
              >
                关闭
              </Button>
            </div>
          )}

          {/* 提交按钮 */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Button
              type="primary"
              size="large"
              onClick={handleSubmitAndGenerateReport}
              loading={isGenerating}
              disabled={isLocked}
              style={{ marginRight: 16 }}
            >
              {isGenerating ? '正在生成AI报告...' : '提交并生成AI报告'}
            </Button>

            <Button
              type="dashed"
              onClick={handleQuickFill}
              disabled={isLocked}
              style={{ marginRight: 16 }}
            >
              快速填充测试数据
            </Button>
            <Button
              onClick={() => {
                const testTable = `
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |
                `;
                setReportContent(testTable);
                setShowReport(true);
              }}
              disabled={isLocked}
              style={{ marginRight: 16 }}
            >
              测试表格渲染
            </Button>
          </div>
        </Form>
      </Card>

      {/* AI报告显示区域 */}
      {showReport && (
        <Card title="AI生成的复盘报告" style={{ marginTop: 24 }}>
          {isGenerating && (
            <div style={{ marginBottom: 16 }}>
              <Progress percent={generationProgress} status="active" />
              <Text>{generationStatus}</Text>
            </div>
          )}
          
          {reportContent && (
            <div style={{ 
              border: '1px solid #e8e8e8', 
              borderRadius: '8px', 
              padding: '32px',
              backgroundColor: '#ffffff',
              maxHeight: '900px',
              overflowY: 'auto',
              lineHeight: '1.8',
              fontSize: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {/* 调试信息 */}
              <details style={{ marginBottom: '16px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>调试信息 - 原始Markdown内容</summary>
                <pre style={{ fontSize: '12px', overflow: 'auto', maxHeight: '200px', backgroundColor: '#fff', padding: '8px', border: '1px solid #ddd' }}>
                  {reportContent}
                </pre>
              </details>
              
              <div style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                color: '#2c3e50'
              }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // 表格样式优化
                    table: ({node, ...props}) => (
                      <table 
                        {...props} 
                        style={{
                          borderCollapse: 'collapse',
                          width: '100%',
                          marginBottom: '24px',
                          border: '2px solid #e8e8e8',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      />
                    ),
                    th: ({node, ...props}) => (
                      <th 
                        {...props} 
                        style={{
                          border: '1px solid #e8e8e8',
                          padding: '16px 12px',
                          backgroundColor: '#f8f9fa',
                          fontWeight: '600',
                          textAlign: 'left',
                          fontSize: '14px',
                          color: '#2c3e50',
                          borderBottom: '2px solid #dee2e6'
                        }}
                      />
                    ),
                    td: ({node, ...props}) => (
                      <td 
                        {...props} 
                        style={{
                          border: '1px solid #e8e8e8',
                          padding: '14px 12px',
                          textAlign: 'left',
                          fontSize: '14px',
                          lineHeight: '1.6',
                          verticalAlign: 'top'
                        }}
                      />
                    ),
                    // 标题样式优化
                    h1: ({node, ...props}) => (
                      <h1 {...props} style={{ 
                        fontSize: '28px', 
                        fontWeight: '700', 
                        marginBottom: '20px', 
                        marginTop: '32px',
                        color: '#1a365d',
                        borderBottom: '3px solid #3182ce',
                        paddingBottom: '8px'
                      }} />
                    ),
                    h2: ({node, ...props}) => (
                      <h2 {...props} style={{ 
                        fontSize: '22px', 
                        fontWeight: '600', 
                        marginBottom: '16px', 
                        marginTop: '28px', 
                        color: '#2d3748',
                        borderLeft: '4px solid #3182ce',
                        paddingLeft: '12px'
                      }} />
                    ),
                    h3: ({node, ...props}) => (
                      <h3 {...props} style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        marginBottom: '12px', 
                        marginTop: '20px', 
                        color: '#4a5568',
                        backgroundColor: '#f7fafc',
                        padding: '8px 12px',
                        borderRadius: '4px'
                      }} />
                    ),
                    // 段落样式优化
                    p: ({node, ...props}) => (
                      <p {...props} style={{ 
                        marginBottom: '16px', 
                        lineHeight: '1.8',
                        fontSize: '15px',
                        color: '#2d3748'
                      }} />
                    ),
                    // 列表样式优化
                    ul: ({node, ...props}) => (
                      <ul {...props} style={{ 
                        marginBottom: '20px', 
                        paddingLeft: '24px',
                        lineHeight: '1.8'
                      }} />
                    ),
                    ol: ({node, ...props}) => (
                      <ol {...props} style={{ 
                        marginBottom: '20px', 
                        paddingLeft: '24px',
                        lineHeight: '1.8'
                      }} />
                    ),
                    li: ({node, ...props}) => (
                      <li {...props} style={{ 
                        marginBottom: '8px',
                        fontSize: '15px',
                        color: '#2d3748'
                      }} />
                    ),
                    // 强调文本样式优化
                    strong: ({node, ...props}) => (
                      <strong {...props} style={{ 
                        fontWeight: '600', 
                        color: '#3182ce',
                        backgroundColor: '#ebf8ff',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }} />
                    ),
                    em: ({node, ...props}) => (
                      <em {...props} style={{ 
                        fontStyle: 'italic', 
                        color: '#718096',
                        backgroundColor: '#f7fafc',
                        padding: '1px 3px',
                        borderRadius: '2px'
                      }} />
                    ),
                    // 代码块样式优化
                    code: ({node, className, ...props}: any) => {
                      const isInline = className && !className.includes('language-');
                      if (isInline) {
                        return (
                          <code {...props} style={{
                            backgroundColor: '#f1f5f9',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                            color: '#e53e3e'
                          }} />
                        );
                      }
                      return (
                        <code {...props} style={{
                          backgroundColor: '#f7fafc',
                          padding: '16px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                          color: '#2d3748',
                          display: 'block',
                          overflow: 'auto',
                          border: '1px solid #e2e8f0'
                        }} />
                      );
                    },
                    // 引用块样式优化
                    blockquote: ({node, ...props}) => (
                      <blockquote {...props} style={{
                        borderLeft: '4px solid #3182ce',
                        paddingLeft: '16px',
                        margin: '20px 0',
                        backgroundColor: '#f7fafc',
                        padding: '16px',
                        borderRadius: '4px',
                        fontStyle: 'italic',
                        color: '#4a5568'
                      }} />
                    ),
                    // 分割线样式优化
                    hr: ({node, ...props}) => (
                      <hr {...props} style={{
                        border: 'none',
                        height: '2px',
                        backgroundColor: '#e2e8f0',
                        margin: '32px 0',
                        borderRadius: '1px'
                      }} />
                    ),
                    // 链接样式优化
                    a: ({node, ...props}) => (
                      <a {...props} style={{
                        color: '#3182ce',
                        textDecoration: 'none',
                        borderBottom: '1px solid #3182ce',
                        paddingBottom: '1px'
                      }} />
                    )
                  }}
                >
                  {reportContent}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* 操作按钮区域 - 移动到报告内容下方 */}
          {showReport && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <Text strong style={{ display: 'block', marginBottom: '12px', color: '#495057' }}>
                报告操作
              </Text>
              <Space wrap>
                <Button
                  type="primary"
                  onClick={handleLockAndSave}
                  disabled={isLocked || isGenerating}
                  style={{ marginRight: 8 }}
                  loading={isGenerating}
                >
                  {isGenerating ? '生成中...' : '锁定并保存'}
                </Button>
                <Button
                  onClick={handleRegenerate}
                  disabled={isLocked || isGenerating}
                  style={{ marginRight: 8 }}
                  loading={isGenerating}
                >
                  {isGenerating ? '生成中...' : '重新生成'}
                </Button>
                <Button
                  onClick={() => handleDownload('word')}
                  disabled={isLocked || isGenerating}
                  icon={<DownloadOutlined />}
                  style={{ marginRight: 8 }}
                >
                  下载Word
                </Button>
                <Button
                  onClick={() => handleDownload('pdf')}
                  disabled={isLocked || isGenerating}
                  icon={<DownloadOutlined />}
                >
                  下载PDF
                </Button>
              </Space>
            </div>
          )}
        </Card>
      )}
      
      <style>{`
        .review-page {
          padding: 16px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .connection-status {
          margin-bottom: 16px;
        }
        
        .review-card {
          margin-bottom: 24px;
        }
        
        .basic-info {
          margin-bottom: 24px;
        }
        
        .review-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          overflow-x: auto;
        }
        
        .review-table th,
        .review-table td {
          border: 1px solid #d9d9d9;
          padding: 8px;
          text-align: center;
        }
        
        .review-table th {
          background-color: #fafafa;
        }
        
        .report-content {
          max-height: 600px;
          overflow-y: auto;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .report-actions {
          margin-top: 24px;
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        @media (max-width: 768px) {
          .review-page {
            padding: 12px;
          }
          
          .review-card {
            margin-bottom: 16px;
          }
          
          .basic-info {
            margin-bottom: 16px;
          }
          
          .review-table {
            font-size: 12px;
          }
          
          .review-table th,
          .review-table td {
            padding: 4px;
          }
          
          .report-content {
            max-height: 400px;
            padding: 12px;
            font-size: 14px;
          }
          
          .report-actions {
            margin-top: 16px;
            padding: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .review-page {
            padding: 8px;
          }
          
          .review-table {
            font-size: 11px;
          }
          
          .review-table th,
          .review-table td {
            padding: 2px;
          }
          
          .report-content {
            max-height: 300px;
            padding: 8px;
            font-size: 12px;
          }
          
          .report-actions {
            margin-top: 12px;
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default Review; 
