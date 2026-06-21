# Deno Proxy Templates

v0.3 提供 Verified Minimal Adaptive Deno Deploy reverse proxy 参考模板。

模板是参考，不是最终答案。

Templates are references, not final answers.

必须根据可访问的 Hugging Face Space origin、headers、流式响应需求和 `TARGET_ORIGIN` 配置适配代理。

不要盲目复制模板。不要使用 one-size-fits-all Deno proxy。

如果当前项目架构暂不适配现有模板库，不要强行使用 Deno proxy，应输出 custom deployment plan / 自定义部署方案，并说明需要确认目标 origin、路径转发、headers 和流式行为。

不要把模板强行套到不适配的项目架构上。
Do not force-fit a template to an incompatible architecture.

## Current Templates

- `main.ts`: 最小反向代理，读取 `TARGET_ORIGIN`，转发 method、headers、body、path、query，并处理 `OPTIONS`。
- `deno.json`: 提供带网络和环境变量权限的 `start` task。

Deno Deploy 是可选反向代理，不是主后端，也不存储数据。
