#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { spawn } = require('child_process');

// 检测环境
function detectEnvironment() {
  const isDocker = process.env.NODE_ENV === 'production' || 
                   process.env.DOCKER_ENV === 'true' ||
                   fs.existsSync('/.dockerenv');
  
  console.log(`🔍 环境检测: ${isDocker ? 'Docker/生产环境' : '本地开发环境'}`);
  return isDocker;
}

// 读取配置文件
function loadConfig() {
  try {
    // 尝试从多个位置读取配置文件
    const configPaths = [
      path.join(__dirname, '..', '..', 'conf.yaml'),
      path.join(__dirname, '..', '..', '..', 'conf.yaml'),
      path.join(__dirname, '..', 'conf.yaml')
    ];

    let config = null;
    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        const configFile = fs.readFileSync(configPath, 'utf8');
        config = yaml.load(configFile);
        console.log(`✅ 配置文件加载成功: ${configPath}`);
        break;
      }
    }

    if (!config) {
      throw new Error('配置文件未找到');
    }

    return config;
  } catch (error) {
    console.error('❌ 配置文件加载失败:', error.message);
    return getDefaultConfig();
  }
}

// 获取配置
function getConfig() {
  const config = loadConfig();
  const isDocker = detectEnvironment();
  
  // 根据环境选择配置
  if (isDocker) {
    return config.production || getDefaultConfig().production;
  } else {
    return config.development || getDefaultConfig().development;
  }
}

// 获取默认配置
function getDefaultConfig() {
  return {
    development: {
      frontend: {
        port: 6090,
        backend_url: 'http://localhost:6091'
      },
      backend: {
        port: 6091,
        cors_origins: ['http://localhost:6090', 'http://localhost:6091']
      }
    },
    production: {
      frontend: {
        port: 6092,
        backend_url: '/api'
      },
      backend: {
        port: 6093,
        cors_origins: ['http://localhost:6092', 'http://localhost:6093', '*']
      }
    }
  };
}

// 启动后端应用
function startBackendApp(port) {
  console.log(`🚀 启动后端服务，端口: ${port}`);
  
  // 设置环境变量
  process.env.PORT = port.toString();
  
  // 启动后端应用
  const backendApp = spawn('node', ['src/app.js'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: port.toString() }
  });

  backendApp.on('error', (error) => {
    console.error('❌ 启动失败:', error);
    process.exit(1);
  });

  backendApp.on('close', (code) => {
    console.log(`后端服务已停止，退出码: ${code}`);
    process.exit(code);
  });
}

// 主函数
function main() {
  console.log('🔧 后端配置启动脚本');
  
  // 检测环境
  const isDocker = detectEnvironment();
  
  // 获取配置
  const config = getConfig();
  
  // 获取端口
  const port = config.backend.port;
  console.log(`📋 配置信息:`);
  console.log(`  环境: ${isDocker ? 'Docker/生产环境' : '本地开发环境'}`);
  console.log(`  后端端口: ${port}`);
  console.log(`  CORS配置: ${config.backend.cors_origins.join(', ')}`);
  
  // 启动应用
  startBackendApp(port);
}

// 运行主函数
main(); 