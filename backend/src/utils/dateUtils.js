const dayjs = require('dayjs');

// 计算周数：2025年1月1日-1月5日为第一周，6日-12日为第二周，以此类推
function calculateWeekNumber(date) {
  const startOfYear = dayjs('2025-01-01');
  const targetDate = dayjs(date);
  const daysDiff = targetDate.diff(startOfYear, 'day');
  if (daysDiff < 5) {
    return 1;
  } else {
    return Math.floor((daysDiff - 5) / 7) + 2;
  }
}

// 格式化日期为中文格式
function formatDateToChinese(dateStr) {
  const date = dayjs(dateStr);
  return `${date.year()}年${date.month() + 1}月${date.date()}日`;
}

module.exports = {
  calculateWeekNumber,
  formatDateToChinese
}; 