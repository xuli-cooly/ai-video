# VideoFlow

![VideoFlow Logo](packages/assets/videoFlowLogo.svg)

本项目在 [Toonflow-app](https://github.com/HBAI-Ltd/Toonflow-app) 的 MIT 授权源码基础上开发，保留其项目工作区、无限画布、图片/视频/音频节点、Agent 对话、分镜团队、技能与工具流程。原项目的许可证见 [LICENSE](./LICENSE)。

## 运行

需要 Bun 1.3.14 和 FFmpeg。首次安装依赖后执行：

```sh
bun install --frozen-lockfile
bun run build:server
bun run start:server
```

打开 `http://127.0.0.1:3000`。开发时可先构建节点与工具，再运行 `bun run dev`。

## 配置模型

- **文本：** 首次进入「配置文本模型」，或在设置的文本模型页添加自定义供应商。填写中转站 API 地址、密钥和模型 ID；支持 OpenAI Chat Completions、OpenAI Responses、Anthropic Messages 协议。模型列表可拉取，也可手动维护。
- **图片与视频：** 在设置的媒体模型页选择「添加供应商」→「自定义中转站」。配置通用地址与密钥，或者分别填写图片、视频地址与密钥。安装后点击「编辑模型」，添加实际模型 ID、类型及支持的生成模式。
- **媒体接口约定：** 图片默认 `POST /images/generations`，接受 JSON，返回 `data[].url` 或 `data[].b64_json`。视频默认 `POST /videos` 返回视频 URL 或任务 ID，再以 `GET /videos/{id}` 轮询；路径均可在 UI 修改。视频提交字段包含 `model`、`prompt`，以及按需填写的 `duration`、`ratio`、`resolution`、`first_frame`、`last_frame`、`images`。返回结构不同的中转站可在媒体模型页导入自定义 Provider 文件。

项目不自动安装或配置 TF-Router。媒体中转站的具体响应格式未提供，因此上述适配器按所列接口约定实现；需要按你的实际接口文档调整字段映射或鉴权时，主要修改 `packages/providers/src/media/relay.ts`。
