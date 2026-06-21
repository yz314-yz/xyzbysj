# Deno Deploy 反向代理路线

Deno Deploy 是可选组件，只作为反向代理使用。

Deno Deploy 不运行主应用，不存储数据，也不是主后端。

```text
User
-> Deno Deploy reverse proxy
-> Hugging Face Space
-> Aiven MySQL optional
```

## 适合用途

- 改善部分地区访问体验。
- 转发到 Hugging Face Space 地址。
- 用较短代理地址隐藏较长的 Space URL。

## 必要配置

- `TARGET_ORIGIN`：需要代理到的 Hugging Face Space origin。

只有在 Hugging Face Space 直连已经可用后，才引入该路线。
