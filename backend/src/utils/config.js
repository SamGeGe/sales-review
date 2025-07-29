const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class Config {
  constructor() {
    this.config = null;
    this.isDockerEnvironment = this.detectEnvironment();
    this.setTimezone();
    this.loadConfig();
  }

  setTimezone() {
    // 设置时区为东八区北京时间
    process.env.TZ = 'Asia/Shanghai';
    console.log('🕐 设置系统时区为东八区北京时间 (Asia/Shanghai)');
  }

  detectEnvironment() {
    // 检测是否在Docker环境中运行
    // 通过检查环境变量或进程信息来判断
    const isDocker = process.env.NODE_ENV === 'production' || 
                     process.env.DOCKER_ENV === 'true' ||
                     fs.existsSync('/.dockerenv');
    
    console.log(`🔍 后端环境检测: ${isDocker ? 'Docker环境' : '本地开发环境'}`);
    return isDocker;
  }

  loadConfig() {
    try {
      const configPath = path.join(__dirname, '..', '..', '..', 'conf.yaml');
      const configFile = fs.readFileSync(configPath, 'utf8');
      this.config = yaml.load(configFile);
      console.log('✅ 配置文件加载成功');
      
      // 设置后端端口（如果环境变量未设置）
      const currentConfig = this.getCurrentConfig();
      if (!process.env.PORT && currentConfig?.backend?.port) {
        process.env.PORT = currentConfig.backend.port.toString();
        console.log(`🔧 设置后端端口: ${currentConfig.backend.port}`);
      }
    } catch (error) {
      console.error('❌ 配置文件加载失败:', error.message);
      this.config = this.getDefaultConfig();
      
      // 设置默认端口
      const currentConfig = this.getCurrentConfig();
      if (!process.env.PORT) {
        process.env.PORT = currentConfig.backend.port.toString();
        console.log(`🔧 设置默认后端端口: ${currentConfig.backend.port}`);
      }
    }
  }

  getCurrentConfig() {
    if (!this.config) return this.getDefaultConfig().development;
    
    if (this.isDockerEnvironment) {
      return this.config.production || this.getDefaultConfig().production;
    } else {
      return this.config.development || this.getDefaultConfig().development;
    }
  }

  getDefaultConfig() {
    return {
      development: {
      frontend: {
          port: 6090,
          backend_url: 'http://localhost:6091'
      },
      backend: {
          port: 6091,
          cors_origins: [
            'http://localhost:6090',
            'http://localhost:6091'
          ]
        }
      },
      production: {
        frontend: {
          port: 6092,
          backend_url: '/api'
        },
        backend: {
          port: 6093,
          cors_origins: [
            'http://localhost:6092',
            'http://localhost:6093',
            'http://*',
            'https://*',
            '*'
          ]
        }
      }
    };
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
  }

  getFrontend() {
    const config = this.getCurrentConfig();
    console.log(`🌐 后端前端配置: ${config.frontend.backend_url}`);
    return config.frontend;
  }

  getBackend() {
    const config = this.getCurrentConfig();
    console.log(`🔧 后端CORS配置:`, config.backend.cors_origins);
    return config.backend;
  }

  getLLM() {
    return this.config?.llm || {
        primary: {
          base_url: 'http://183.221.24.83:8000/v1',
          model: 'qwq32b-q8',
          api_key: 'sk-fake',
          timeout: 120000,
          max_retries: 3
        },
        backup: {
          base_url: 'https://openrouter.ai/api/v1',
          model: 'qwen/qwen3-235b-a22b-2507',
          api_key: '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',
          timeout: 120000,
          max_retries: 3
        }
    };
  }

  getChatHistory() {
    return this.config?.chat_history || {
      enabled: true,
      max_messages: 100,
      storage_key: 'sales_review_chat_history'
    };
  }

  // 获取当前环境信息
  getEnvironmentInfo() {
    return {
      isDocker: this.isDockerEnvironment,
      backendPort: this.getBackend().port,
      corsOrigins: this.getBackend().cors_origins
    };
  }

  // 获取后端端口配置
  getBackendPort() {
    const config = this.getCurrentConfig();
    return config.backend.port;
  }
}

module.exports = new Config(); 