# 技术栈识别规则 Stack Detection Rules

使用多层证据识别技术栈，不要只凭单个文件名猜测。

## 优先级

1. 检查 `package.json` dependencies 和 scripts。
2. 检查 lock file，例如 `package-lock.json`、`pnpm-lock.yaml`、`yarn.lock` 或 `bun.lockb`。
3. 检查目录结构。
4. 检查配置文件。
5. 必要时检查入口文件和 import。

## 规则

- 不要只根据目录名或文件名判断。
- 依赖证据优先于命名证据。
- `package.json` scripts 优先于猜测命令。
- Python 项目需要检查 `requirements.txt` 和 `pyproject.toml`。
- 如果证据冲突，说明冲突点。
- 如果技术栈不清楚，输出 `uncertain`，并向用户索要缺失文件或命令。

目标是识别足够的项目信息，用于推荐部署路线和缺失配置；这不是完整代码审计。
