# NewAPI 识别和部署注意事项

当项目看起来是 NewAPI 或 NewAPI 衍生服务时，使用本文件。

## 识别证据

需要寻找多项证据，不要只凭项目名判断：

- 项目名或文档提到 `NewAPI`。
- 配置或环境变量涉及 API relay、token 管理、channel 配置或模型供应商设置。
- 后端代码和前端/admin UI 打包在一起，或文档说明它们作为一个服务运行。
- 数据库配置需要 MySQL 兼容连接信息。

如果证据不完整，输出 `uncertain`，并要求用户提供仓库 README、env 示例和运行命令。

## 部署关系

NewAPI 可以以前后端一起运行的形式部署在 Hugging Face Docker Space 容器中，然后连接 Aiven MySQL 实现持久化。

```text
Hugging Face Docker Space
运行 NewAPI 应用容器
-> connects to
-> Aiven MySQL
```

不要把 Aiven 描述成后端服务器。Aiven MySQL 是数据库，不是后端服务器。

## 部署注意事项

- 写 Docker 指引前，先确认应用期望端口。
- 部署前确认必需环境变量和 Secrets。
- 只有需要持久化数据库时，才引入 Aiven MySQL。
- 除非项目本身已经支持前后端分离架构，否则不要强行拆分前端和后端。
