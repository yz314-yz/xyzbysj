# 正式公网发布路线：GitHub -> GHCR -> Hugging Face Docker Space

本文件对应 `project-publishing-assistant` Skill 的 **B. 正式公网发布模式**。

## 已识别项目结构

- 项目类型：前后端分离项目，已适配为 Hugging Face 单容器运行。
- 前端：React + Vite，目录 `jetlag-frontend/`，构建命令 `npm run build`。
- 后端：Express，目录 `jetlag-backend/`，启动命令 `npm start`。
- 模型：Qwen3-VL 外部服务，通过 OpenAI 兼容接口接入。
- 容器端口：`7860`，适配 Hugging Face Docker Space。

## 使用的参考模板

- `react-vite.Dockerfile`：用于前端构建阶段参考。
- `express.Dockerfile`：用于后端运行阶段参考。
- `ghcr-docker-build.yml`：用于 GHCR 构建推送 workflow 参考。
- `node.dockerignore`：用于根目录 `.dockerignore` 参考。

## 针对当前项目的适配

- 不是直接发布前端或后端，而是使用根目录 `Dockerfile` 构建完整应用镜像。
- 前端 `dist` 会复制到后端 `public` 目录，由 Express 同时提供页面和 API。
- 前端运行时 `/env.js` 支持同源 API，Hugging Face 上 `PUBLIC_API_BASE` 可留空。
- 后端通过 `OPEN_MODEL_BASE_URL`、`OPEN_MODEL_API_KEY`、`OPEN_MODEL_NAME` 接入 Qwen3-VL。
- GitHub Actions 输出镜像：`ghcr.io/<github-user>/<repo>:latest`。

## 第一步：推送到 GitHub

如果还没有远程仓库：

```bash
git init
git add .
git commit -m "prepare public deployment"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<你的仓库名>.git
git push -u origin main
```

如果已经有仓库：

```bash
git add .
git commit -m "prepare public deployment"
git push
```

## 第二步：启用 GHCR 构建

项目已生成：

```text
.github/workflows/ghcr-fullstack.yml
```

推送到 `main` 后，GitHub Actions 会自动构建并推送：

```text
ghcr.io/<github-user>/<repo>:latest
```

GitHub 仓库需要确认：

- Actions 已启用。
- Settings -> Actions -> General -> Workflow permissions 选择 Read and write permissions。
- Packages 中生成的镜像建议设为 Public，方便 Hugging Face Space 拉取。

## 第三步：创建 Hugging Face Docker Space

在 Hugging Face 创建 Space：

- SDK 选择 Docker。
- 可见性按需要选择 Public 或 Private。
- 端口使用 `7860`。

把 `deploy/huggingface-space/` 中的文件放到 Space 仓库。

修改 `deploy/huggingface-space/Dockerfile`：

```dockerfile
FROM ghcr.io/<github-user>/<repo>:latest
```

## 第四步：配置 Space Variables / Secrets

在 Hugging Face Space 设置：

```text
PORT=7860
PUBLIC_API_BASE=
OPEN_MODEL_BASE_URL=https://你的-qwen3-vl-服务/v1
OPEN_MODEL_API_KEY=EMPTY
OPEN_MODEL_NAME=Qwen/Qwen3-VL-8B-Instruct
CORS_ORIGIN=
```

说明：

- `PUBLIC_API_BASE` 留空：前端请求同源后端。
- `OPEN_MODEL_BASE_URL`：指向外部 Qwen3-VL/vLLM 服务。
- 如果暂时没有 GPU 模型服务，后端仍会用本地规则生成七日计划。

## 第五步：验证

打开 Hugging Face Space 公网地址后检查：

- 首页能打开。
- 点击“生成七日调理计划”能得到七日表。
- `/health` 返回正常。

期望 `/health`：

```json
{
  "status": "ok",
  "service": "中医养生辅助系统",
  "qwen3VLReady": true,
  "qwen3VLModel": "Qwen/Qwen3-VL-8B-Instruct"
}
```

如果 `qwen3VLReady` 是 `false`，说明 Qwen3-VL 地址还没有配置，但基础演示仍可运行。
