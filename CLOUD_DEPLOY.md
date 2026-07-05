# 岐养七日云部署说明

本项目采用三层部署：

- 前端：React + Vite，经 Nginx 托管。
- 后端：Node.js + Express，负责症状规则引擎、七日计划生成、图片转发。
- 模型：Qwen3-VL，通过 vLLM 提供 OpenAI 兼容接口，建议部署在 GPU 云服务器。

> 安全边界：系统只输出图像特征记录和中医养生参考，不输出医疗诊断、治疗方案或处方。

## 1. 普通云服务器部署业务系统

适合阿里云、腾讯云、华为云、轻量云服务器、Docker 主机等。

```bash
cp .env.cloud.example .env
```

修改 `.env`：

```env
PUBLIC_API_BASE=http://你的服务器公网IP:3000
CORS_ORIGIN=http://你的服务器公网IP:8080
OPEN_MODEL_BASE_URL=http://你的GPU服务器IP:8000/v1
OPEN_MODEL_API_KEY=
OPEN_MODEL_NAME=Qwen/Qwen3-VL-32B-Instruct
```

启动前后端：

```bash
docker compose --env-file .env -f docker-compose.cloud.yml up -d --build
```

访问：

- 前端：`http://你的服务器公网IP:8080`
- 后端健康检查：`http://你的服务器公网IP:3000/health`

## 2. GPU 云服务器部署 Qwen3-VL

GPU 服务器需要安装 NVIDIA 驱动、Docker、NVIDIA Container Toolkit。

```bash
cp .env.cloud.example .env
```

按显存选择模型：

```env
OPEN_MODEL_NAME=Qwen/Qwen3-VL-32B-Instruct
QWEN_PORT=8000
```

启动模型服务：

```bash
docker compose --env-file .env -f deploy/qwen3-vl-vllm.compose.yml up -d
```

模型服务地址：

```text
http://你的GPU服务器IP:8000/v1
```

把这个地址填到业务服务器 `.env` 的 `OPEN_MODEL_BASE_URL`。

## 3. 单机 GPU 部署

如果前端、后端、模型都在一台 GPU 服务器，可以先启动模型，再启动业务：

```bash
docker compose --env-file .env -f deploy/qwen3-vl-vllm.compose.yml up -d
docker compose --env-file .env -f docker-compose.cloud.yml up -d --build
```

此时 `.env` 可写：

```env
OPEN_MODEL_BASE_URL=http://host.docker.internal:8000/v1
```

Linux Docker 如不支持 `host.docker.internal`，建议把模型服务部署到同一个 compose 网络，或直接使用服务器内网 IP。

## 4. 验证

检查后端：

```bash
curl http://你的服务器公网IP:3000/health
```

正常会看到：

```json
{
  "status": "ok",
  "service": "中医养生辅助系统",
  "visionModelReady": true,
  "visionModelName": "Qwen/Qwen3-VL-32B-Instruct"
}
```

如果 `visionModelReady` 为 `false`，说明后端未读取到 `OPEN_MODEL_BASE_URL`，系统仍可用本地规则演示，但不会调用 Qwen3-VL。

## 5. 答辩表述建议

可以这样说明架构：

> 系统前端负责标准化采集舌像、面相、手相和症状信息；后端先用中医知识规则引擎生成稳定可解释的养生计划，再可选调用 Qwen3-VL 对图像做可观察特征记录。模型服务通过 OpenAI 兼容接口接入，因此可以部署在独立 GPU 云服务器，业务系统部署在普通云服务器，便于扩展和控制成本。

Qwen3-VL 参考：

- GitHub: <https://github.com/QwenLM/Qwen3-VL>
- Hugging Face: <https://huggingface.co/Qwen/Qwen3-VL-32B-Instruct>
- vLLM OpenAI server: <https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html>



