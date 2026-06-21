# Aiven MySQL 路线

Aiven MySQL 是可选远程数据库，适用于需要持久化数据的项目。

Aiven MySQL 是数据库，不是后端服务器。

```text
Hugging Face Docker Space
-> connects to
-> Aiven MySQL
```

## 常见配置项

- `host`：Aiven 提供的数据库主机名。
- `port`：MySQL 端口，通常是 `3306` 或 Aiven 控制台显示的端口。
- `user`：数据库用户名。
- `password`：数据库密码。
- `database`：数据库名称。
- `ssl mode`：Aiven 通常需要 TLS 或明确的 SSL 配置。

## DSN 示例

```text
username:password@tcp(host:port)/dbname?tls=skip-verify&parseTime=true
```

给出最终 DSN 前，必须确认目标应用实际读取的环境变量名称。

除非确有必要，不要要求用户在聊天中粘贴真实密钥。优先使用占位符，并指导用户把真实值放入平台 Secrets。
