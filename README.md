# 岐养七日 · 中医养生辅助系统

岐养七日是一个面向毕业设计展示的中医养生辅助系统。系统通过症状选择、舌像/面相/手相图片采集、本地规则引擎和可选 Qwen3-VL 图像特征提取，生成体质方向、子午流注建议和七日饮食/运动/作息计划。

> 免责声明：系统输出仅供学术展示与日常养生参考，不能替代执业医师诊断、治疗或处方。

## 功能概览

- 用户注册/登录：JWT 鉴权，登录后自动保存诊断历史。
- 望诊采集：支持舌像、面相、手相上传、拖拽、预览和单张删除。
- 智能分析：本地规则引擎 + 可选 Qwen3-VL 图像特征。
- AI 养生问答：基于当前方案追问饮食、运动、作息执行细节；离线演示模式下明确提示不可用。
- 七日打卡：登录用户可记录每日饮食、运动、作息执行情况和 1-5 分主观感受。
- 历史记录：SQLite 持久化用户和诊断记录。
- 计划导出：前端可将报告导出为 PDF。
- 分享卡片：生成体质方案卡片，可下载图片或复制摘要。
- 移动端适配：手机端支持相机直拍、七日计划折叠阅读、触摸目标优化和返回顶部。
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
- `OPEN_TEXT_MODEL_NAME`

## 双模式演示

系统提供两种推理模式，前端问诊页可直接切换：

| 模式 | 运行方式 | 适用场景 |
|---|---|---|
| 公网免费体验版 | 图片在访客浏览器内提取轻量特征，后端只接收结构化特征并用规则引擎生成建议 | GitHub Pages / 公网体验 / 无云 GPU |
| 离线增强演示版 | 答辩电脑连接本机 OpenAI 兼容 Qwen3-VL 服务，后端仅在该模式下调用模型 | 答辩电脑或已安装完整模型的电脑 |

默认保持 `OPEN_MODEL_BASE_URL=` 为空，即公网免费体验版可用，且不会把原始图片上传给服务端诊断接口。若要展示 Qwen3-VL 图像特征提取能力，再配置 `OPEN_MODEL_BASE_URL`、`OPEN_MODEL_API_KEY` 和 `OPEN_MODEL_NAME`，前端会将“离线增强”标为可选。

AI 养生问答使用同一个 OpenAI 兼容服务地址；公网免费体验版不会调用后端大模型对话，离线增强模式下文本模型优先读取 `OPEN_TEXT_MODEL_NAME`，未配置时回退到 `OPEN_MODEL_NAME`。

### 上线严格模式

如果要按真实客户产品上线，而不是毕业设计演示，请设置：

```env
REQUIRE_MODEL_EVIDENCE=true
```

开启后系统只接受有多模态模型证据的方案；默认关闭时，手机端公网免费体验版仍可用轻量浏览器特征 + 规则引擎完整跑通：

- 公网免费体验版：必须接入浏览器端多模态模型适配器，并提交 `modelBacked=true` 的结构化特征；当前 Canvas 轻量识别只用于拍摄质量和演示，不会被当成大模型证据。
- 离线增强演示版：必须成功调用本机 Qwen3-VL OpenAI 兼容服务；模型不可用时直接拒绝生成，不再回退为规则方案。

注意：手机端定位为轻量公网体验版，不承诺在普通手机浏览器里稳定运行 32B 级 Qwen3-VL；电脑端用户可安装完整模型后启用离线增强。若未来要求所有手机都获得完整多模态大模型识别，需要另建受控后端/边缘推理服务，或发布经过设备兼容测试的原生 App 模型包。

## TRAE 开发实践

本项目按 TRAE 创意赛展示口径补充了 [TRAE 开发实践](docs/TRAE开发实践.md)，记录 AI 辅助编码、前后端质量检查、Qwen 双引擎接入和答辩演示风险控制。演示视频脚本见 [演示视频脚本](docs/演示视频脚本.md)。

## 接入 Qwen3-VL

项目默认使用 `Qwen/Qwen3-VL-32B-Instruct`，通过 vLLM 提供 OpenAI 兼容接口。没有启动模型服务时，系统会自动使用本地规则引擎；启动模型服务后，上传舌像、面相或手相图片即可获得图像特征记录。

GPU 环境可用 Docker 启动：

```bash
docker compose --env-file .env -f deploy/qwen3-vl-vllm.compose.yml up -d
```

本地后端 `.env` 中配置：

```env
OPEN_MODEL_BASE_URL=http://localhost:8000/v1
OPEN_MODEL_API_KEY=
OPEN_MODEL_NAME=Qwen/Qwen3-VL-32B-Instruct
```

## 部署

项目提供：

- 根目录 `Dockerfile`：前后端合并镜像。
- `docker-compose.cloud.yml`：前后端分离部署。
- `docker-compose.cloud.yml --profile observability`：可选 Prometheus、Grafana、Loki、Promtail 监控与日志采集。
- `.github/workflows/ghcr-fullstack.yml`：构建并推送 GHCR 镜像。
- `deploy/huggingface-space/Dockerfile`：Hugging Face Space 复用 GHCR 镜像。


