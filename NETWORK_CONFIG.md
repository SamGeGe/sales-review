# 网络配置说明

## 🌐 访问场景详解

### 场景1：本地开发环境
```
访问地址: http://localhost:6090
环境检测: 端口6090 + 主机名localhost → 本地开发环境
前端配置: backend_url = 'http://localhost:6091'
API调用: http://localhost:6091/api/users
工作流程: 前端直接调用本地后端
```

### 场景2：Docker本地访问
```
访问地址: http://localhost:6092
环境检测: 端口6092 → Docker/公网环境
前端配置: backend_url = '/api'
API调用: /api/users → Nginx代理 → localhost:6093/users
工作流程: 前端使用相对路径，通过Nginx代理
```

### 场景3：公网域名访问（推荐）
```
访问地址: http://your-domain.com
环境检测: 主机名不是localhost → Docker/公网环境
前端配置: backend_url = '/api'
API调用: /api/users → Nginx代理 → localhost:6093/users
工作流程: 前端使用相对路径，通过Nginx代理
```

### 场景4：公网IP直接访问
```
访问地址: http://your-server-ip:6092
环境检测: 主机名不是localhost → Docker/公网环境
前端配置: backend_url = '/api'
API调用: /api/users → 浏览器直接访问 → your-server-ip:6093/users
工作流程: 前端使用相对路径，浏览器直接访问后端
```

## 🔧 配置机制

### 前端环境检测逻辑
```typescript
// 检测条件
isDockerEnvironment = (port === '6092') || 
                     (hostname !== 'localhost' && hostname !== '127.0.0.1')

// 配置选择
if (isDockerEnvironment) {
  backendUrl = '/api'  // 相对路径，适用于所有公网访问
} else {
  backendUrl = 'http://localhost:6091'  // 绝对路径，仅本地开发
}
```

### 后端CORS配置
```javascript
// Docker/公网环境
cors_origins: [
  'http://localhost:6092',
  'http://localhost:6093',
  'http://*',      // 支持所有HTTP域名
  'https://*',     // 支持所有HTTPS域名
  '*'              // 支持所有协议
]
```

## 🚀 部署方案对比

### 方案一：Nginx反向代理（推荐）
**优点**：
- ✅ 只开放80/443端口，更安全
- ✅ 支持HTTPS加密
- ✅ 统一的访问入口
- ✅ 更好的缓存和压缩

**配置**：
```nginx
# 前端代理
location / {
    proxy_pass http://localhost:6092;
}

# 后端API代理
location /api/ {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://localhost:6093;
}
```

**访问方式**：
- HTTP: http://your-domain.com
- HTTPS: https://your-domain.com

### 方案二：直接端口暴露
**优点**：
- ✅ 配置简单
- ✅ 无需Nginx

**缺点**：
- ❌ 需要开放更多端口
- ❌ 安全性较低
- ❌ 不支持HTTPS

**访问方式**：
- 前端: http://your-server-ip:6092
- 后端: http://your-server-ip:6093

## 🧪 测试验证

### 本地测试
```bash
# 测试本地开发环境
curl http://localhost:6090
curl http://localhost:6091/api/users

# 测试Docker环境
curl http://localhost:6092
curl http://localhost:6093/api/users
```

### 公网测试
```bash
# 测试Nginx代理
curl http://your-domain.com
curl http://your-domain.com/api/users

# 测试直接访问
curl http://your-server-ip:6092
curl http://your-server-ip:6093/api/users
```

### 浏览器测试
```javascript
// 在浏览器控制台测试
fetch('/api/users')
  .then(response => response.json())
  .then(data => console.log('API调用成功:', data))
  .catch(error => console.error('API调用失败:', error));
```

## 🔒 安全考虑

### CORS配置
- ✅ 本地开发：只允许localhost
- ✅ 公网访问：允许所有域名（生产环境）

### 防火墙配置
- ✅ 只开放必要端口
- ✅ 使用Nginx代理减少暴露面

### HTTPS支持
- ✅ 自动重定向HTTP到HTTPS
- ✅ 安全头配置
- ✅ SSL证书管理

## 🛠️ 故障排除

### 常见问题

1. **API调用失败**
```bash
# 检查后端服务
curl http://localhost:6093/health

# 检查Nginx配置
sudo nginx -t

# 查看日志
docker-compose logs backend
sudo tail -f /var/log/nginx/error.log
```

2. **跨域错误**
```bash
# 检查CORS配置
curl -H "Origin: http://your-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS http://localhost:6093/api/users
```

3. **网络连接问题**
```bash
# 检查端口开放
sudo netstat -tlnp | grep :6093

# 检查防火墙
sudo ufw status

# 测试网络连通性
telnet your-server-ip 6093
```

## 📊 性能优化

### Nginx优化
```nginx
# 启用gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 应用优化
- ✅ 启用HTTP/2
- ✅ 配置适当的超时时间
- ✅ 启用连接池
- ✅ 监控和日志记录

---

**总结**：无论用户在哪里访问前端（本地、Docker、公网），系统都能自动检测环境并使用正确的配置与后端建立连接。 