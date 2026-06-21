# Cloudflare Quick Tunnel 快速预览路线

状态：Experimental / 作者尚未完全验证

仅在 Quick Preview Mode / 快速预览模式中使用该路线。

```text
Local Project
-> cloudflared
-> Cloudflare Quick Tunnel
-> Public URL
```

## 安装

Windows:

```powershell
winget install Cloudflare.cloudflared
```

macOS:

```bash
brew install cloudflared
```

Linux:

请按照 Cloudflare 官方文档安装。不要凭空编写特定发行版命令，除非已经从用户环境或官方文档确认。

## 启动

```bash
cloudflared tunnel --url http://localhost:<port>
```

示例：

```bash
cloudflared tunnel --url http://localhost:5173
```

## 必须说明

- 会生成随机 `trycloudflare.com` 地址。
- 终端关闭后失效。
- 电脑关机后失效。
- 本地服务或本地项目停止后失效。
- 不适合生产环境。
- 适合临时预览和 Demo 演示。
