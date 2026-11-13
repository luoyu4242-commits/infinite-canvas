# 星程画布 Plugin

让 Codex / ZCode 可以打开并操作 星程画布。

## 安装

先在本仓库中安装、构建并链接本地 Agent（插件通过 `canvas-agent mcp` 启动它）：

```bash
cd canvas-agent
npm install
npm run build
npm link
cd ..
```

确认 `canvas-agent` 命令来自当前项目，再安装插件；依赖不再从原项目的 npm 包自动下载。

### Codex

macOS / Linux：

```bash
git clone https://github.com/luoyu4242-commits/infinite-canvas.git
cd infinite-canvas
codex plugin marketplace add "$(pwd)"
codex plugin add infinite-canvas@infinite-canvas-local
```

Windows PowerShell：

```powershell
git clone https://github.com/luoyu4242-commits/infinite-canvas.git
cd infinite-canvas
codex plugin marketplace add "$PWD"
codex plugin add infinite-canvas@infinite-canvas-local
```

Windows CMD 将 `$PWD` 替换为 `%cd%`。

### ZCode

- 打开 **Settings → Plugin Management → Discover**，点击右上角 **`+`** 添加 marketplace。
- 选择 **本仓库目录**（`plugins/infinite-canvas`）或本仓库根目录，即可发现 `infinite-canvas` 插件并安装。
- 或在 ZCode 界面直接以本地目录方式加载该插件目录。

安装后新建一个任务，然后输入：

```text
帮我打开并连接到 星程画布
```
