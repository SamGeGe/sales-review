# 项目介绍

本项目为基于 [Create React App](https://github.com/facebook/create-react-app) 搭建的前端应用，适用于销售评审等相关业务场景。

## 快速开始

在项目根目录下，进入 frontend 文件夹后执行以下命令：

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
npm start
```

启动后，浏览器自动打开 [http://localhost:3000](http://localhost:3000)。如有端口占用，请自行调整。

### 3. 运行测试

```bash
npm test
```

进入交互式测试模式，可根据提示进行单元测试。

### 4. 打包构建

```bash
npm run build
```

打包后的文件会生成在 `build` 目录下，可用于生产环境部署。

## 目录结构说明

- `public/`         公共资源目录（如 favicon、index.html 等）
- `src/`            源码目录
  - `pages/`        主要页面组件（如 Dashboard、Login、Report 等）
  - 其他            入口文件、样式文件等
- `package.json`    项目依赖及脚本配置
- `README.md`       项目说明文档

## 参考文档

- [Create React App 官方文档](https://facebook.github.io/create-react-app/docs/getting-started)
- [React 官方文档](https://reactjs.org/)
