# 正式公网发布模式 Public Deployment Mode

Public Deployment Mode 是用于长期公网访问的正式发布路线。

```text
Local Project
-> GitHub Repository
-> GitHub Actions
-> GHCR
-> Hugging Face Docker Space
-> Aiven MySQL optional
-> Deno Deploy Reverse Proxy optional
-> Public Access
```

## 各层职责

- GitHub：管理源代码和项目历史。
- GitHub Actions：根据仓库变更自动构建 Docker 镜像。
- GHCR：存储构建好的 Docker 镜像。
- Hugging Face Docker Space：运行应用容器。
- Aiven MySQL：在需要持久化数据时提供远程 MySQL 数据库；它不是后端服务器。
- Deno Deploy：可选反向代理，用于转发到 Hugging Face Space；它不是主后端。

当用户需要长期公网访问，而不是短期预览 URL 时，使用这条路线。
