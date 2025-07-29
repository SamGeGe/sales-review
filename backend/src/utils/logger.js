// 简单的颜色控制函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const colorize = (color, text) => `${colors[color]}${text}${colors.reset}`;

// 获取北京时间
const getBeijingTime = () => {
  return new Date(new Date().getTime() + (8 * 60 * 60 * 1000)).toISOString();
};

class Logger {
  static info(message, data = null) {
    const timestamp = getBeijingTime();
    console.log(colorize('blue', `[INFO] ${timestamp}`), colorize('white', message));
    if (data) {
      console.log(colorize('gray', '└─ Data:'), JSON.stringify(data, null, 2));
    }
  }

  static success(message, data = null) {
    const timestamp = getBeijingTime();
    console.log(colorize('green', `[SUCCESS] ${timestamp}`), colorize('white', message));
    if (data) {
      console.log(colorize('gray', '└─ Data:'), JSON.stringify(data, null, 2));
    }
  }

  static warning(message, data = null) {
    const timestamp = getBeijingTime();
    console.log(colorize('yellow', `[WARNING] ${timestamp}`), colorize('white', message));
    if (data) {
      console.log(colorize('gray', '└─ Data:'), JSON.stringify(data, null, 2));
    }
  }

  static error(message, error = null) {
    const timestamp = getBeijingTime();
    console.log(colorize('red', `[ERROR] ${timestamp}`), colorize('white', message));
    if (error) {
      console.log(colorize('red', '└─ Error:'), error.message || error);
      if (error.stack) {
        console.log(colorize('gray', '└─ Stack:'), error.stack);
      }
    }
  }

  static llmRequest(url, model, promptLength) {
    const timestamp = getBeijingTime();
    console.log(colorize('cyan', `[LLM REQUEST] ${timestamp}`));
    console.log(colorize('gray', '├─ URL:'), colorize('white', url));
    console.log(colorize('gray', '├─ Model:'), colorize('white', model));
    console.log(colorize('gray', '└─ Prompt Length:'), colorize('white', promptLength));
  }

  static llmResponse(content, length) {
    const timestamp = getBeijingTime();
    console.log(colorize('green', `[LLM RESPONSE] ${timestamp}`));
    console.log(colorize('gray', '├─ Length:'), colorize('white', length));
    console.log(colorize('gray', '└─ Content:'));
    console.log(colorize('white', '   ┌─────────────────────────────────────────────────────────────'));
    console.log(colorize('gray', '   │'), colorize('cyan', content.substring(0, 200) + (content.length > 200 ? '...' : '')));
    console.log(colorize('white', '   └─────────────────────────────────────────────────────────────'));
  }

  static llmError(error) {
    const timestamp = getBeijingTime();
    console.log(colorize('red', `[LLM ERROR] ${timestamp}`));
    console.log(colorize('red', '└─ Error:'), error.message || error);
  }

  static apiRequest(method, path, data = null) {
    const timestamp = getBeijingTime();
    console.log(colorize('magenta', `[API REQUEST] ${timestamp}`));
    console.log(colorize('gray', '├─ Method:'), colorize('white', method));
    console.log(colorize('gray', '├─ Path:'), colorize('white', path));
    if (data) {
      console.log(colorize('gray', '└─ Data:'), JSON.stringify(data, null, 2));
    }
  }

  static apiResponse(status, data = null) {
    const timestamp = getBeijingTime();
    const statusColor = status >= 200 && status < 300 ? 'green' : 'red';
    console.log(colorize(statusColor, `[API RESPONSE] ${timestamp}`));
    console.log(colorize('gray', '├─ Status:'), colorize(statusColor, status));
    if (data) {
      console.log(colorize('gray', '└─ Data:'), JSON.stringify(data, null, 2));
    }
  }
}

module.exports = Logger; 