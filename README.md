# 岐养七日 · 中医养生辅助系统

岐养七日是一个面向毕业设计展示的中医养生辅助系统。系统通过症状选择、舌像/面相/手相图片采集、本地规则引擎和可选 Qwen3-VL 图像特征提取，生成体质方向、子午流注建议和七日饮食/运动/作息计划。

> 免责声明：系统输出仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。

## 功能概览

- 用户注册/登录：JWT 鉴权，登录后自动保存诊断历史。
- 望诊采集：支持舌像、面相、手相上传、拖拽、预览和单张删除。
- 智能分析：本地规则引擎 + 可选 Qwen3-VL 图像特征。
- 历史记录：SQLite 持久化用户和诊断记录。
- 计划导出：前端可将报告导出为 PDF。
- API 文档：后端提供 Swagger UI `/api-docs`。
- 工程化：Docker、GitHub Actions、非 root 容器、健康检查、Prometheus 指标、Loki 日志采集配置、限流、安全头、日志轮转、前后端测试。

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | React、Vite、React Router、react-hot-toast、html2canvas、jsPDF |
| 后端 | Node.js、Express、SQLite、JWT、Zod、Multer、Helmet、Morgan、Winston |
| AI 接入 | OpenAI 兼容接口、Qwen3-VL |
| 测试 | Jest + Supertest、Vitest + Testing Library |
| 部署 | Docker、Nginx、GitHub Actions、GHCR |

## 目录结构

```text
.
├── docs/                         # 毕业设计文档
├── jetlag-backend/               # 后端服务
│   ├── src/controllers/          # 控制器
│   ├── src/services/             # 业务服务
│   ├── src/models/               # SQLite 数据模型
│   ├── src/routes/               # API 路由与 Swagger 注释
│   └── test/                     # 后端接口测试
├── jetlag-frontend/              # 前端应用
│   ├── src/components/           # UI 组件
│   ├── src/pages/                # 路由页面
│   ├── src/hooks/                # 自定义 hooks
│   ├── src/services/             # API 服务
│   └── src/test/                 # 前端测试配置
└── deploy/                       # 云部署配置
```

## 本地运行

1. 安装依赖：

```bash
cd jetlag-backend && npm install
cd ../jetlag-frontend && npm install
```

2. 后端配置：

```bash
cp .env.example jetlag-backend/.env
```

3. 启动后端：

```bash
cd jetlag-backend
npm run dev
```

4. 启动前端：

```bash
cd jetlag-frontend
npm run dev
```

默认访问：

- 前端：http://localhost:5173
- 后端：http://localhost:3000
- API 文档：http://localhost:3000/api-docs
- 监控指标：http://localhost:3000/metrics

## 测试

```bash
cd jetlag-backend && npm test
cd ../jetlag-frontend && npm test
cd ../jetlag-frontend && npm run build
```

## 环境变量

详见 [.env.example](.env.example)。核心变量包括：

- `PORT`
- `DATABASE_PATH`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `OPEN_MODEL_BASE_URL`
- `OPEN_MODEL_API_KEY`
- `OPEN_MODEL_NAME`

## 部署

项目提供：

- 根目录 `Dockerfile`：前后端合并镜像。
- `docker-compose.cloud.yml`：前后端分离部署。
- `docker-compose.cloud.yml --profile observability`：可选 Prometheus、Grafana、Loki、Promtail 监控与日志采集。
- `.github/workflows/ghcr-fullstack.yml`：构建并推送 GHCR 镜像。
- `deploy/huggingface-space/Dockerfile`：Hugging Face Space 复用 GHCR 镜像。
