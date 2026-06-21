# GitHub -> GHCR -> Hugging Face 路线

这是 Public Deployment Mode / 正式公网发布模式的核心路线。

```text
GitHub Repository
-> GitHub Actions
-> GHCR
-> Hugging Face Docker Space
```

## 职责

- GitHub Repository：存放项目源代码。
- GitHub Actions：从仓库构建 Docker 镜像。
- GHCR：存储构建好的镜像，例如 `ghcr.io/<username>/<repo>:latest`。
- Hugging Face Docker Space：拉取或构建镜像，并运行应用容器。

## 流程

1. 确认项目有可工作的 Dockerfile。
2. 将项目推送到 GitHub。
3. 添加 GitHub Actions workflow，用于登录 GHCR、构建镜像并推送镜像。
4. 确认 GHCR package 已生成，并且 Hugging Face Space 有权限访问。
5. 创建使用 GHCR 镜像的 Hugging Face Docker Space。
6. 配置端口、Secrets、Variables 和启动设置。
7. 验证公网 URL 和运行日志。

不要假设自己拥有 GitHub 或 Hugging Face 权限。需要账户级操作时，指导用户自行完成。
