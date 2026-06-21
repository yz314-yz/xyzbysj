# Validation / 真实项目验证

v0.4 的目标是用真实项目验证 project-publishing-assistant Skill 的实际效果。

该目录用于沉淀 Skill 自身质量验证结果，不替代 Deployment Report，也不改变正式部署流程。

## 目标

- 用真实项目验证 Skill。
- 不再只验证文档结构。
- 不凭空添加大量错误案例。
- 错误案例必须来自真实测试或用户真实反馈。
- 每个测试项目都应生成一份 validation report。

## 第一批推荐测试项目

1. Vue + Vite 纯前端项目
2. Express 或 FastAPI 单服务项目
3. NewAPI 类前后端一体项目，连接 Aiven MySQL

## 使用方式

当用户说“测试这个 Skill”“验证这个部署方案”“沉淀这个案例”时，可以使用 `validation/test-case-template.md` 输出 validation report。

Validation report 应记录 Skill 是否正确完成路线选择、技术栈识别、模板兼容性判断、模板适配、部署步骤生成和真实结果复盘。

不要记录真实 token、数据库密码、API key 或其他敏感信息。
