const rules = [
  { type: "input", field: "baseUrl" as const, title: "API 基础地址", value: "", props: { placeholder: "https://relay.example.com/v1" } },
  { type: "input", field: "apiKey" as const, title: "API Key", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
  { type: "input", field: "imageBaseUrl" as const, title: "图片 API 地址（可选）", value: "" },
  { type: "input", field: "imageApiKey" as const, title: "图片 API Key（可选）", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
  { type: "input", field: "videoBaseUrl" as const, title: "视频 API 地址（可选）", value: "" },
  { type: "input", field: "videoApiKey" as const, title: "视频 API Key（可选）", value: "", props: { type: "password", showPassword: true, autocomplete: "off" } },
  { type: "input", field: "imagePath" as const, title: "图片生成路径", value: "/images/generations" },
  { type: "input", field: "videoPath" as const, title: "视频提交路径", value: "/videos" },
  { type: "input", field: "videoStatusPath" as const, title: "视频查询路径（{id} 为任务 ID）", value: "/videos/{id}" },
];

type RelayContext = ProviderContext<ProviderConfig<typeof rules>>;
type RelayReply = Record<string, unknown>;

function endpoint(context: RelayContext, path: string, mediaType: "image" | "video") {
  const base = (mediaType === "image" ? context.config.imageBaseUrl : context.config.videoBaseUrl).trim() || context.config.baseUrl.trim();
  if (!/^https?:\/\//.test(base)) throw new Error("请配置有效的中转站 API 基础地址");
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function requestJson(context: RelayContext, mediaType: "image" | "video", path: string, body?: unknown): Promise<RelayReply> {
  const apiKey = (mediaType === "image" ? context.config.imageApiKey : context.config.videoApiKey).trim() || context.config.apiKey.trim();
  const response = await context.tool.fetch(endpoint(context, path, mediaType), {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}), "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: context.signal,
  });
  const data = await response.json() as RelayReply;
  if (!response.ok) throw new Error(context.tool.errorMessage(data) || `中转站请求失败 (${response.status})`);
  return data;
}

function assetUrl(value: unknown): string | undefined {
  if (typeof value === "string" && value) return value;
  if (!value || typeof value !== "object") return;
  const item = value as RelayReply;
  for (const field of ["url", "video_url", "image_url", "b64_json"]) {
    if (typeof item[field] === "string" && item[field])
      return field === "b64_json" ? `data:image/png;base64,${item[field]}` : item[field] as string;
  }
}

function resultUrl(data: RelayReply): string | undefined {
  const items = Array.isArray(data.data) ? data.data : Array.isArray(data.output) ? data.output : [];
  return assetUrl(items[0]) || assetUrl(data.data) || assetUrl(data.result) || assetUrl(data.output) || assetUrl(data);
}

function toAsset(url: string, mediaType: "image" | "video"): MediaAsset {
  if (url.startsWith("data:")) {
    const match = /^data:([^;]+);base64,(.+)$/.exec(url);
    if (!match) throw new Error("中转站返回了无法识别的内联媒体");
    return { type: "base64", data: match[2], mimeType: match[1], mediaType };
  }
  return { type: "url", url, mediaType };
}

async function inputUrl(input: MediaInput): Promise<string> {
  if (input.type === "url") return input.url;
  const data = input.type === "binary" ? Buffer.from(input.data).toString("base64") : input.data;
  return `data:${input.mimeType};base64,${data}`;
}

export default {
  id: "relay",
  label: "自定义中转站",
  icon: "",
  version: "1.0.0",
  readme: "填写中转站地址和密钥后，在供应商列表中编辑图片、视频模型 ID。图片使用 OpenAI 兼容的 /images/generations；视频使用 POST 提交和 GET 轮询，路径可配置。接口格式不同的中转站可通过自定义供应商文件适配。",
  rules,
  models: [],
  async generateImage(this: RelayContext, request: ImageRequest): Promise<MediaAsset[]> {
    const body: RelayReply = { model: request.model, prompt: request.prompt, n: request.n ?? 1 };
    if (request.size) body.size = request.size;
    if (request.quality) body.quality = request.quality;
    if (request.outputFormat) body.output_format = request.outputFormat;
    if (request.images?.length) body.images = await Promise.all(request.images.map(inputUrl));
    const data = await requestJson(this, "image", this.config.imagePath || "/images/generations", { ...body, ...request.other });
    const items = Array.isArray(data.data) ? data.data : [data];
    const assets = items.map(assetUrl).filter((url): url is string => !!url).map(url => toAsset(url, "image"));
    if (!assets.length) throw new Error("中转站未返回图片 URL 或 b64_json");
    return assets;
  },
  async generateVideo(this: RelayContext, request: VideoRequest): Promise<MediaAsset[]> {
    const body: RelayReply = { model: request.model, prompt: request.prompt, ...request.other };
    if (request.duration) body.duration = request.duration;
    if (request.ratio) body.ratio = request.ratio;
    if (request.resolution) body.resolution = request.resolution;
    if (request.firstFrame) body.first_frame = await inputUrl(request.firstFrame);
    if (request.lastFrame) body.last_frame = await inputUrl(request.lastFrame);
    if (request.images?.length) body.images = await Promise.all(request.images.map(inputUrl));
    const submitted = await requestJson(this, "video", this.config.videoPath || "/videos", body);
    let url = resultUrl(submitted);
    if (url) return [toAsset(url, "video")];
    const id = submitted.id ?? submitted.task_id ?? (submitted.data as RelayReply | undefined)?.id;
    if (typeof id !== "string" || !id) throw new Error("中转站未返回视频 URL 或任务 ID");
    const statusPath = this.config.videoStatusPath || "/videos/{id}";
    for (let attempt = 0; attempt < 180; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      this.signal?.throwIfAborted();
      const data = await requestJson(this, "video", statusPath.replace("{id}", encodeURIComponent(id)));
      url = resultUrl(data);
      if (url) return [toAsset(url, "video")];
      const status = String(data.status ?? (data.data as RelayReply | undefined)?.status ?? "").toLowerCase();
      if (["failed", "error", "cancelled"].includes(status)) throw new Error(this.tool.errorMessage(data) || `视频生成失败：${status}`);
    }
    throw new Error("视频生成超时，请在中转站查询任务状态");
  },
} satisfies ProviderDefinition<typeof rules>;
