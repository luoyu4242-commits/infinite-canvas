---
name: open-canvas
description: 打开当前 星程画布 本地项目，并连接本地 Canvas Agent。
---

# Open 星程画布

使用当前项目，不访问其他项目的在线站点或下载其他作者的 Agent 包。

1. 在用户的 星程画布 项目根目录启动前端，使用 Vite 输出的地址：

```bash
npm --prefix web run dev
```

2. 在另一个终端启动已安装依赖的本地 Agent：

```bash
npm --prefix canvas-agent run dev
```

3. 从输出读取 `Local URL` 和 `Connect token`，打开：

```text
<Vite Local 地址>/canvas?mode=new#agentUrl=<Local URL>&agentToken=<Connect token>
```

插件 MCP 使用 `canvas-agent mcp`。首次安装需按插件 README 构建并 `npm link` 本地 Agent；如果命令不可用，先检查安装，不回退到其他 npm 包。

MCP 进程提供工具，普通 Agent 进程提供网页连接服务。两个进程读取同一份本地配置。

默认 `mode=new` 新建画布。只有用户明确要求时才改用 `mode=recent`（最近画布）或 `mode=choose`（自己选择）。
