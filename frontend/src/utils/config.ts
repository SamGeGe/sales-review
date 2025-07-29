import yaml from 'js-yaml';

interface FrontendConfig {
  port: number;
  backend_url: string;
}

interface BackendConfig {
  port: number;
  cors_origins: string[];
}

interface LLMConfig {
  primary: {
    base_url: string;
    model: string;
    api_key: string;
    timeout: number;
    max_retries: number;
  };
  backup: {
    base_url: string;
    model: string;
    api_key: string;
    timeout: number;
    max_retries: number;
  };
}

interface ChatHistoryConfig {
  enabled: boolean;
  max_messages: number;
  storage_key: string;
}

interface DevelopmentConfig {
  frontend: FrontendConfig;
  backend: BackendConfig;
}

interface ProductionConfig {
  frontend: FrontendConfig;
  backend: BackendConfig;
}

interface Config {
  development: DevelopmentConfig;
  production: ProductionConfig;
  llm: LLMConfig;
  chat_history: ChatHistoryConfig;
}

type CurrentConfig = DevelopmentConfig | ProductionConfig;

class ConfigManager {
  private config: Config | null = null;
  private isDockerEnvironment: boolean = false;

  constructor() {
    this.detectEnvironment();
    this.setTimezone();
    this.loadConfig();
  }

  private setTimezone() {
    // 设置时区为东八区北京时间
    if (typeof window !== 'undefined') {
      // 在浏览器环境中，通过设置 Intl.DateTimeFormat 的时区
      console.log('🕐 前端时区设置为东八区北京时间');
    }
  }

  private detectEnvironment() {
    // 检测是否在Docker环境中运行
    // 通过检查当前URL的端口和主机名来判断
    const currentPort = window.location.port;
    const currentHostname = window.location.hostname;
    
    // Docker环境检测：端口为6092或主机名不是localhost/127.0.0.1
    this.isDockerEnvironment = currentPort === '6092' || 
                               (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1');
    
    console.log(`🔍 环境检测: ${this.isDockerEnvironment ? 'Docker/公网环境' : '本地开发环境'}`);
    console.log(`📍 当前访问地址: ${window.location.hostname}:${window.location.port}`);
  }

  private async loadConfig() {
    try {
      // 修改为读取根目录的配置文件
      const response = await fetch('/api/config');
      const configText = await response.text();
      this.config = yaml.load(configText) as Config;
      console.log('✅ 前端配置文件加载成功');
      
      // 设置前端端口（如果环境变量未设置）
      const currentConfig = this.getCurrentConfig();
      if (!process.env.PORT && currentConfig?.frontend?.port) {
        process.env.PORT = currentConfig.frontend.port.toString();
        console.log(`🔧 设置前端端口: ${currentConfig.frontend.port}`);
      }
    } catch (error) {
      console.error('❌ 前端配置文件加载失败:', error);
      this.config = this.getDefaultConfig();
      
      // 设置默认端口
      const currentConfig = this.getCurrentConfig();
      if (!process.env.PORT) {
        process.env.PORT = currentConfig.frontend.port.toString();
        console.log(`🔧 设置默认前端端口: ${currentConfig.frontend.port}`);
      }
    }
  }

  private getCurrentConfig(): CurrentConfig {
    if (!this.config) return this.getDefaultConfig().development;

    if (this.isDockerEnvironment) {
      return this.config.production || this.getDefaultConfig().production;
    } else {
      return this.config.development || this.getDefaultConfig().development;
    }
  }

  private getDefaultConfig(): Config {
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
      },
      llm: {
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
      },
      chat_history: {
        enabled: true,
        max_messages: 100,
        storage_key: 'sales_review_chat_history'
      }
    };
  }

  get(path: string): any {
    return path.split('.').reduce((obj: any, key) => obj && obj[key], this.config);
  }

  getFrontend(): FrontendConfig {
    const config = this.getCurrentConfig();
    console.log(`🌐 前端配置: ${config.frontend.backend_url}`);
    return config.frontend;
  }

  getBackend(): BackendConfig {
    const config = this.getCurrentConfig();
    return config.backend;
  }

  getLLM(): LLMConfig {
    return this.config?.llm || this.getDefaultConfig().llm;
  }

  getChatHistory(): ChatHistoryConfig {
    return this.config?.chat_history || this.getDefaultConfig().chat_history;
  }

  // 获取当前环境信息
  getEnvironmentInfo() {
    return {
      isDocker: this.isDockerEnvironment,
      currentPort: window.location.port,
      backendUrl: this.getFrontend().backend_url
    };
  }

  // 获取前端端口配置
  getFrontendPort(): number {
    const config = this.getCurrentConfig();
    return config.frontend.port;
  }
}

export default new ConfigManager(); 