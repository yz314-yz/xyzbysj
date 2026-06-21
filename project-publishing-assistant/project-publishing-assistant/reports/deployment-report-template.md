# Deployment Report

## Project Name / 项目名称
项目名称。

TBD

## Detected Stack / 识别到的技术栈
检测到的技术栈；如果证据不足，写 `uncertain` 并说明缺失证据。

TBD

## Deployment Mode / 部署模式
选择的部署模式：Quick Preview Mode 或 Public Deployment Mode。

TBD

## Route Selection Reason / 路线选择原因
路线选择原因，说明为什么推荐当前路线。

TBD

## Local Port / 本地端口
本地运行端口；如果未知，列出需要用户确认的启动命令或日志。

TBD

## Required Files / 必需文件
部署所需文件，例如 Dockerfile、`.dockerignore`、GitHub Actions workflow、Space README、环境变量示例等。

TBD

## Missing Files / 缺失文件
当前缺失的部署文件或配置。

TBD

## Template Compatibility / 模板兼容性
模板兼容性判断：匹配、部分匹配或不匹配。说明判断依据。

TBD

## Template Adaptation Notes / 模板适配说明
模板适配说明。记录基于项目证据做出的适配，例如 build 命令、start 命令、端口、环境变量、已有 Docker 文件和托管约束。

模板是参考，不是最终答案。记录用于定制部署文件的项目证据，包括 build 命令、start 命令、端口、环境变量、已有 Docker 文件和托管约束。

Templates are references, not final answers.

## Used Template References / 使用的参考模板
使用的参考模板。列出具体模板路径，并说明为当前项目修改了什么。

例如可列出 `templates/dockerfiles/express.Dockerfile` 或 `templates/github-actions/ghcr-docker-build.yml`，并说明为了当前项目具体修改了哪些内容。

## Unsupported / Unmatched Architecture Notes / 不支持或未匹配架构说明
不支持或未匹配架构说明。如果当前项目架构暂不适配现有模板库，说明原因，并给出 custom deployment plan / 自定义部署方案。

TBD

## Required User Confirmation / 需要用户确认的信息
需要用户确认的信息，例如项目结构、启动方式、构建命令、端口、环境变量、数据库需求、镜像可见性等。

TBD

## Environment Variables / 环境变量
环境变量和 Secrets，避免写入真实密钥。

TBD

## Database Requirement / 数据库需求
是否需要持久化数据库；如需要，说明数据库类型和连接方式。

TBD

## Recommended Route / 推荐路线
推荐部署路线和下一步操作。

TBD

## Deployment Steps / 部署步骤
逐步部署操作，只写当前路线需要的步骤。

TBD

## Verification Checklist / 验证清单
验证清单。

- 网站首页
- API 接口
- 数据库连接，如需要
- 登录流程，如需要
- 流式输出，如需要
- 环境变量

## Known Risks / 已知风险
已知风险和仍需确认的不确定项。

TBD

## Next Actions / 下一步行动
下一步行动。

TBD
