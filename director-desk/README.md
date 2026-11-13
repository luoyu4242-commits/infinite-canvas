# 星程画布 · 3D 导演台

基于 [xiaozangao/3d-director-desk](https://github.com/xiaozangao/3d-director-desk)，固定源码提交 `a6c931cd36d8263d986706f74ab4efe9d5151959`（0.3.1）。保留上游 [MIT 许可](LICENSE)、[原始来源记录](docs/UPSTREAM.md) 和素材目录中的许可说明。代码许可不替代各模型、动作素材的独立许可。

## 使用

1. 在 `web` 目录执行 `bun run director:install` 安装独立依赖，再启动项目。导演台使用自己的 React 18，画布继续使用 React 19。
2. 画布空白处右键添加「3D 导演台」，双击节点或点击「打开导演台」。添加角色、场景、摄影机并编辑运镜。
3. 顶部选择 720p/1080p、视频帧率，将当前帧、首帧、尾帧或预演视频送到画布。截图栏的回传操作也会创建图片节点。
4. 返回画布，将输出的图片/视频节点连接到视频生成节点，按已有渠道和自定义脚本生成。

预演视频由浏览器本地渲染，不调用付费 AI 接口。MP4 导出依赖浏览器的 MediaRecorder 编码支持，不支持时显示上游错误。生成图与视频存入画布原有本地素材库；用于外部生成时沿用既有素材上传流程。

## 工程保存

每个节点独立保存工程，工程变化回写节点 metadata，并随画布保存、复制和导出。导演台自身的场景、素材库索引使用 localforage；上游导入的二进制模型与动作仍保存在其原有 IndexedDB 中。保存失败会提示。

跨设备导出画布或工程 JSON **不打包导演台本地导入的模型、动作文件**，需要保留原文件并在新设备重新导入。输出到画布的图片、视频沿用画布的 ZIP 素材导出。不支持云同步。

## 接入维护

- `host.mjs`：Vite 开发中间件与生产构建；开发共用宿主地址下 `/director-desk/`，没有额外监听端口。生产产物写入 `web/public/director-desk/` 后随主应用打包。
- `src/xingcheng-storage.ts`：先恢复 localforage 索引，再加载上游应用。
- `src/xingcheng-bridge.ts`：恢复节点工程并回传变更；宿主与子页均校验消息来源。
- `web/src/components/canvas/director-dialog.tsx`：窗口、消息关联、素材回传；关闭窗口丢弃待返回结果，不自动重试。
- 上游的场景管理、导出接口见 [嵌入协议](docs/embed-contract.md)。嵌入时禁止切换到其他独立工程，避免写错画布节点。

本次未运行语法检查、构建或浏览器验收，待测项见项目 `docs/content/docs/progress/pending-test.mdx`。
