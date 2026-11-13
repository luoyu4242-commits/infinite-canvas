# 星程画布

一个将文字、图像、视频与音频连接在一起的 AI 创作空间。

项目仓库：[luoyu4242-commits/infinite-canvas](https://github.com/luoyu4242-commits/infinite-canvas)。

## 核心功能

- 星程画布：节点连接、分组、素材管理、导入导出与多模态生成。
- 图片与视频创作台：参考素材、自定义调用脚本、生成记录和支持渠道的费用预估。
- Seedance 视频：按型号选择 Mini、Fast、标准档位。
- 本地 Agent、节点插件、提示词库与可配置的 OSS 上传。

项目、素材、生成记录和 AI 配置主要保存在当前浏览器中，AI 请求由前端直连配置的渠道。登录注册界面尚未接入账号服务。

## 快速开始

```bash
git clone https://github.com/luoyu4242-commits/infinite-canvas.git
cd infinite-canvas/web
bun install
bun run director:install
bun run dev
```

打开 `http://localhost:3000`，在设置中配置渠道地址和 API Key。

画布右键添加「3D 导演台」，双击进入场景与运镜编辑；顶部按钮可将参考帧、预演视频送回画布。导演台随项目启动和构建，使用说明与上游许可见 [导演台接入说明](director-desk/README.md)。

需要 OSS 上传时，将 `web/.env.example` 复制为 `web/.env` 后填写配置。`VITE_*` 值会出现在浏览器产物中。

`bun run dev` 和 `bun run start`（构建后的本地预览）会自动启动 `http://127.0.0.1:23210` 代理；在「配置 → 本地代理」中启用即可。已有代理会直接复用，随项目启动的代理会随项目退出关闭。

需要单独启动代理时，在项目根目录运行：

```bash
node canvas-proxy/index.js
```

静态部署和 Docker 不会启动访问者电脑上的代理，需要在访问者本机单独运行上述命令。

从源码构建 Docker 镜像：

```bash
docker compose -f docker-compose.local.yml up -d --build
```

## 文档

- [功能介绍](docs/content/docs/overview/features.mdx)
- [文档索引](docs/index.md)
- [本地 Agent](canvas-agent/README.md)
- [待测试项](docs/content/docs/progress/pending-test.mdx)
- [后续计划](docs/content/docs/progress/todo.mdx)

本项目沿用 [MIT License](LICENSE)，保留原始版权与许可声明。
