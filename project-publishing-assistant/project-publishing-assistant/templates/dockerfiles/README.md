# Dockerfile Templates

v0.3 提供第一批 Verified Minimal Adaptive Dockerfile 参考模板。

模板是参考，不是最终答案。

Templates are references, not final answers.

必须根据项目实际架构适配模板，包括技术栈识别、build 命令、start 命令、端口、环境变量、monorepo 布局、已有 Docker 文件和 Hugging Face Docker Space 要求。

不要盲目复制模板。不要使用 one-size-fits-all Dockerfile。

如果当前项目架构暂不适配现有模板库，不要强行使用 Vue / React / Express / FastAPI / NewAPI 模板，应输出 custom deployment plan / 自定义部署方案。

不要把模板强行套到不适配的项目架构上。
Do not force-fit a template to an incompatible architecture.

## Current Templates

- `vue-vite.Dockerfile`: Vue + Vite 静态前端，适合在 Hugging Face Docker Space 中通过 nginx 提供静态文件。
- `react-vite.Dockerfile`: React + Vite 静态前端，适合在 Hugging Face Docker Space 中通过 nginx 提供静态文件。
- `express.Dockerfile`: Express 单服务 Node.js 应用，默认使用 `npm start`。
- `fastapi.Dockerfile`: FastAPI 单服务应用，默认使用 `uvicorn`。
- `newapi.Dockerfile`: NewAPI 保守参考模板，必须根据真实仓库结构和项目文档适配。

使用前必须确认 scripts、输出目录、运行端口、环境变量，以及应用是否必须监听 `0.0.0.0`。
