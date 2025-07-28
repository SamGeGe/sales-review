# 配置验证文档

## 📋 配置读取机制

### 1. 配置文件结构
系统使用统一的 `conf.yaml` 配置文件，所有配置都从这个文件读取：

```yaml
# 前端配置
frontend:
  port: 6090                    # 前端服务端口
  backend_url: http://localhost:6093  # 后端服务地址

# 后端配置
backend:
  port: 6091                    # 后端服务端口
  cors_origins:                 # 允许的跨域来源
    - http://localhost:6090
    - http://localhost:6092

# LLM配置
llm:
  primary:                      # 主LLM配置
    base_url: http://183.221.24.83:8000/v1
    model: qwq32b-q8
    api_key: sk-fake
    timeout: 120000
    max_retries: 3
  backup:                       # 备用LLM配置
    base_url: https://openrouter.ai/api/v1
    model: qwen/qwen3-235b-a22b-2507
    api_key: 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
    timeout: 120000
    max_retries: 3

# 聊天历史配置
chat_history:
  enabled: true
  max_messages: 100
  storage_key: sales_review_chat_history
```

### 2. 配置读取流程

#### 前端配置读取 (`frontend/src/utils/config.ts`)
```typescript
// 1. 检测运行环境
const currentPort = window.location.port;
const currentHostname = window.location.hostname;
this.isDockerEnvironment = currentPort === '6092' || 
                           (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1');

// 2. 加载配置文件
const response = await fetch('/conf.yaml');
const configText = await response.text();
this.config = yaml.load(configText) as Config;

// 3. 设置端口配置
if (!process.env.PORT && this.config?.frontend?.port) {
  process.env.PORT = this.config.frontend.port.toString();
}
```

#### 后端配置读取 (`backend/src/utils/config.js`)
```javascript
// 1. 检测运行环境
const isDocker = process.env.NODE_ENV === 'production' || 
                 process.env.DOCKER_ENV === 'true' ||
                 fs.existsSync('/.dockerenv');

// 2. 加载配置文件
const configPath = path.join(__dirname, '..', '..', '..', 'conf.yaml');
const configFile = fs.readFileSync(configPath, 'utf8');
this.config = yaml.load(configFile);

// 3. 设置端口配置
if (!process.env.PORT && this.config?.backend?.port) {
  process.env.PORT = this.config.backend.port.toString();
}
```

### 3. 环境检测逻辑

#### 本地开发环境
- 前端端口：6090
- 后端端口：6091
- 后端URL：`http://localhost:6091`
- CORS：允许 localhost:6090

#### Docker/公网环境
- 前端端口：6092
- 后端端口：6093
- 后端URL：`/api`（相对路径，通过Nginx代理）
- CORS：允许所有域名

## 🧪 配置验证方法

### 1. 自动测试脚本
```bash
# 运行配置测试
./test-config.sh
```

### 2. 手动验证步骤

#### 验证前端配置
```bash
cd frontend
npm run build
# 检查是否成功构建，表示配置读取正常
```

#### 验证后端配置
```bash
cd backend
node -e "
const config = require('./src/utils/config.js');
console.log('后端端口:', config.getBackendPort());
console.log('CORS配置:', config.getBackend().cors_origins);
console.log('LLM配置:', config.getLLM().primary.base_url);
"
```

#### 验证Docker配置
```bash
# 检查docker-compose.yml是否挂载conf.yaml
grep -q "conf.yaml" docker-compose.yml && echo "✅ 配置已挂载" || echo "❌ 配置未挂载"
```

#### 验证Nginx配置
```bash
# 检查nginx.conf中的端口映射
grep -q "localhost:609" nginx.conf && echo "✅ 端口映射正确" || echo "❌ 端口映射错误"
```

## 🔧 配置修改指南

### 1. 修改端口配置
```yaml
# 在conf.yaml中修改
frontend:
  port: 8080  # 修改前端端口
backend:
  port: 8081  # 修改后端端口
```

### 2. 修改LLM配置
```yaml
# 在conf.yaml中修改
llm:
  primary:
    base_url: https://your-llm-server.com/v1
    model: your-model-name
    api_key: your-api-key
```

### 3. 修改CORS配置
```yaml
# 在conf.yaml中修改
backend:
  cors_origins:
    - http://your-domain.com
    - https://your-domain.com
```

## 🚨 常见配置问题

### 1. 配置文件不存在
**错误**：`conf.yaml文件不存在`
**解决**：确保项目根目录存在 `conf.yaml` 文件

### 2. 配置读取失败
**错误**：`配置文件加载失败`
**解决**：检查 `conf.yaml` 文件格式是否正确

### 3. 端口冲突
**错误**：`端口被占用`
**解决**：修改 `conf.yaml` 中的端口配置

### 4. CORS错误
**错误**：`跨域请求被拒绝`
**解决**：在 `conf.yaml` 中添加正确的CORS配置

## 📊 配置验证清单

- [ ] `conf.yaml` 文件存在
- [ ] 前端从 `conf.yaml` 读取配置
- [ ] 后端从 `conf.yaml` 读取配置
- [ ] Docker容器挂载 `conf.yaml`
- [ ] Nginx配置正确
- [ ] 端口配置无冲突
- [ ] CORS配置正确
- [ ] LLM配置有效

## 💡 最佳实践

1. **统一配置**：所有配置都从 `conf.yaml` 读取
2. **环境检测**：自动检测运行环境并应用相应配置
3. **配置验证**：部署前运行配置测试脚本
4. **版本控制**：将 `conf.yaml` 纳入版本控制
5. **备份配置**：重要配置修改前先备份

---

**注意**：系统不支持环境变量硬编码，所有配置都必须通过 `conf.yaml` 文件管理。 