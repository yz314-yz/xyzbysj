# 服务关系 Service Relationship

不要混淆应用托管和数据库托管。

## 正确关系

```text
Hugging Face Docker Space
运行应用容器；如果项目是单体应用，容器中可以同时包含前端和后端
-> connects to
-> Aiven MySQL
```

Aiven MySQL 是数据库服务，不是后端服务器。它负责存储数据，并接受应用发起的数据库连接。

Hugging Face Docker Space 运行应用容器。根据项目形态不同，这个容器可能包含前端静态资源、后端 API、worker 和运行时进程。

## 错误理解

```text
Hugging Face is frontend
-> Aiven is backend
```

这是错误理解。Aiven MySQL 是数据库，不是后端服务器，也不运行应用业务逻辑。不要把 Aiven 描述成后端。

解释架构时，应说明：应用运行在 Hugging Face Docker Space，并连接 Aiven MySQL 作为远程数据库。
