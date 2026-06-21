# Node.js 项目识别

以 `package.json` dependencies 和 scripts 作为主要证据。

## Vue + Vite

- 识别依赖：`vue`、`@vitejs/plugin-vue`、`vite`
- 常见配置文件：`vite.config.js`、`vite.config.ts`、`tsconfig.json`
- 常见目录：`src/`、`src/App.vue`、`src/main.js`、`src/main.ts`
- 常见 dev 命令：`npm run dev`
- 常见 build 命令：`npm run build`
- 常见 start 命令：使用 `npm run preview` 静态预览，或服务构建后的 `dist/`
- 常见端口：`5173`
- Hugging Face Docker Space 注意事项：正式部署时不要依赖 Vite dev server，除非只是临时预览。静态前端通常应先 build，再通过 nginx 或其他静态服务器暴露到 Space 端口。

## React + Vite

- 识别依赖：`react`、`react-dom`、`@vitejs/plugin-react`、`vite`
- 常见配置文件：`vite.config.js`、`vite.config.ts`、`tsconfig.json`
- 常见目录：`src/`、`src/App.jsx`、`src/App.tsx`、`src/main.jsx`、`src/main.tsx`
- 常见 dev 命令：`npm run dev`
- 常见 build 命令：`npm run build`
- 常见 start 命令：使用 `npm run preview` 静态预览，或服务构建后的 `dist/`
- 常见端口：`5173`
- Hugging Face Docker Space 注意事项：正式部署时优先构建静态资源，再用最小 HTTP 服务或项目已有后端提供访问。

## Next.js

- 识别依赖：`next`、`react`、`react-dom`
- 常见配置文件：`next.config.js`、`next.config.mjs`、`next.config.ts`
- 常见目录：`app/`、`pages/`、`public/`
- 常见 dev 命令：`npm run dev`
- 常见 build 命令：`npm run build`
- 常见 start 命令：`npm run start` 或 `next start`
- 常见端口：`3000`
- Hugging Face Docker Space 注意事项：需要确保服务监听 `0.0.0.0`。当前 v0.3 尚未提供 Next.js Dockerfile 模板，不能强行套用其他模板。

## Express

- 识别依赖：`express`
- 常见配置文件：`package.json`、`.env`，有时包含 `tsconfig.json`
- 常见目录：`src/`、`routes/`、`controllers/`、`server.js`、`app.js`
- 常见 dev 命令：`npm run dev`，常配合 `nodemon` 或 `tsx`
- 常见 build 命令：项目相关；TypeScript 项目通常是 `npm run build`
- 常见 start 命令：`npm start`、`node server.js`、`node app.js` 或 `node dist/server.js`
- 常见端口：`3000`、`8080` 或环境变量 `PORT`
- Hugging Face Docker Space 注意事项：服务应监听 `0.0.0.0`，并尽量读取 `process.env.PORT`。

## NestJS

- 识别依赖：`@nestjs/core`、`@nestjs/common`、`@nestjs/platform-express`
- 常见配置文件：`nest-cli.json`、`tsconfig.json`、`tsconfig.build.json`
- 常见目录：`src/`、`src/main.ts`、`src/app.module.ts`
- 常见 dev 命令：`npm run start:dev`
- 常见 build 命令：`npm run build`
- 常见 start 命令：`npm run start:prod` 或 `node dist/main.js`
- 常见端口：`3000`
- Hugging Face Docker Space 注意事项：需要确保 Nest 监听 `0.0.0.0`，使用生产构建产物，并包含运行时依赖。当前 v0.3 尚未提供 NestJS Dockerfile 模板，不能强行套用其他模板。
