# .dockerignore Templates

v0.3 提供 Verified Minimal Adaptive `.dockerignore` 参考模板。

模板是参考，不是最终答案。

Templates are references, not final answers.

必须根据项目实际架构适配模板，包括包管理器、构建产物、monorepo 布局、生成文件、本地密钥和已有 ignore 规则。

不要盲目复制模板。不要使用 one-size-fits-all `.dockerignore`。

如果当前项目架构暂不适配现有模板库，不要强行使用 Node/Python `.dockerignore`，应输出 custom deployment plan / 自定义部署方案，并说明需要确认哪些目录和文件。

不要把模板强行套到不适配的项目架构上。
Do not force-fit a template to an incompatible architecture.

## Current Templates

- `node.dockerignore`: 常见 Node.js 忽略项，默认提醒保留包管理器 lock file。
- `python.dockerignore`: 常见 Python 忽略项，包括缓存、虚拟环境、本地 env 文件和构建产物。

使用前必须确认 Docker build 需要哪些构建产物和 lock file。
