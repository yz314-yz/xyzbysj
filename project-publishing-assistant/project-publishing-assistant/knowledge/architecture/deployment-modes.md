# Deployment Modes / 部署模式

当前 Skill 正式支持两种部署模式。

在部署审查或文件生成前，必须先执行 Route Selection First / 路线选择优先。如果用户尚未选择路线，临时演示推荐 Quick Preview Mode，长期公网访问推荐 Public Deployment Mode。

## Mode A: 快速预览模式 Quick Preview Mode

```text
Local Project
-> cloudflared
-> Cloudflare Quick Tunnel
-> Public URL
```

Quick Preview Mode 仅用于临时预览。当用户需要快速把本地项目暴露成公网 URL 时使用，但它不是正式部署路线。

适合 Demo 展示、朋友测试、客户临时预览和短期验证。

## Mode B: 正式公网发布模式 Public Deployment Mode

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

Public Deployment Mode 是长期公网访问路线。当用户需要稳定公开访问时，默认推荐该模式。

## Decision Rule / 推荐规则

用户只需要临时访问本地应用时，使用 Quick Preview Mode。

用户需要长期公网访问、可重复构建、容器托管、密钥管理或真实用户访问时，使用 Public Deployment Mode。

## Mode C: 敬请期待 Coming Soon

未来版本可能支持 Railway、Render、VPS、Cloudflare Workers、Cloudflare Named Tunnel 或其他已验证路线。

不要把 Mode C 描述成当前可用路线。如果用户询问这些路线，使用中文自然说明：当前版本尚未正式支持该部署路线。你可以继续选择 A 快速预览模式，或 B 正式公网发布模式。该路线可以作为后续版本验证方向记录，但当前不应作为可用路线输出。

## v0.3 Template Use / v0.3 模板使用规则

v0.3 模板库只包含第一批最小、可验证、可适配的参考模板，包括部分 Dockerfile、`.dockerignore`、GHCR workflow 和可选 Deno proxy。

模板是参考，不是最终答案。

Templates are references, not final answers.

只有在完成路线选择，并检查真实项目结构、scripts、端口、环境变量和托管要求后，才可以使用模板。部署报告必须记录使用了哪些参考模板，以及做了哪些适配。

如果检测到的项目架构不匹配任何已支持模板，不要强行套模板。应输出 custom deployment plan / 自定义部署方案，并列出用户需要补充的项目结构、启动命令、构建命令、端口、环境变量等信息。

不要把模板强行套到不适配的项目架构上。
Do not force-fit a template to an incompatible architecture.
