# GitHub Actions Templates

v0.3 提供 Verified Minimal Adaptive GitHub Actions 参考 workflow，用于 GHCR 镜像构建。

模板是参考，不是最终答案。

Templates are references, not final answers.

必须根据仓库名、默认分支、Dockerfile 路径、build context、镜像名、Package 可见性和权限要求适配 workflow。

不要盲目复制模板。不要使用 one-size-fits-all GitHub Actions workflow。

如果当前项目架构暂不适配现有模板库，不要强行使用 GHCR workflow，应输出 custom deployment plan / 自定义部署方案，并说明需要确认 Dockerfile 路径、构建上下文、镜像名和权限。

不要把模板强行套到不适配的项目架构上。
Do not force-fit a template to an incompatible architecture.

## Current Template

- `ghcr-docker-build.yml`: 使用 `docker/build-push-action` 构建 Docker 镜像，使用 `GITHUB_TOKEN` 登录 GHCR，并在 main 分支 push 或手动触发时推送 `latest`。

不要写入个人 token。如果 Hugging Face 需要从 GHCR 拉取镜像，必须确认镜像是否 public，或是否需要额外访问权限。
