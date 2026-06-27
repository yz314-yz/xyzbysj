# 岐养七日前端

当前前端为 Vite + React 实现，用于毕业设计演示和 Trae Solo 创作者比赛提交。

## 本地运行

```bash
npm install
npm run dev
```

默认会读取 `VITE_API_BASE` 或后端输出的 `/env.js`，开发环境未配置时回退到 `http://localhost:3000`。

## 构建

```bash
npm run build
```

构建产物位于 `dist/`，提交源码时不需要包含。
