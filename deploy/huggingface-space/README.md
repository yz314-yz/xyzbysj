---
title: TCM Wellness Assistant
emoji: 🌿
colorFrom: green
colorTo: red
sdk: docker
app_port: 7860
pinned: false
---

# 岐养七日 · 中医养生辅助系统

Docker Space 部署文件。

## Space Variables

建议在 Hugging Face Space 的 Variables / Secrets 中配置：

```text
PORT=7860
PUBLIC_API_BASE=
OPEN_MODEL_BASE_URL=https://你的-qwen3-vl-服务/v1
OPEN_MODEL_API_KEY=
OPEN_MODEL_NAME=Qwen/Qwen3-VL-8B-Instruct
CORS_ORIGIN=
```

说明：

- `PUBLIC_API_BASE` 留空表示前端使用同源 API，适合单容器部署。
- `OPEN_MODEL_BASE_URL` 指向外部 Qwen3-VL/vLLM 服务。
- 未配置 Qwen3-VL 时，系统仍会使用本地规则引擎生成七日养生计划。
