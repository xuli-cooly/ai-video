// 自定义中转站的模型列表由用户在设置中维护，不在启动或保存设置时覆盖。
export async function refreshProviderModels(_previousSettings?: Record<string, unknown>) {
  return {};
}

export default function initializeProviderModels() {
  return Promise.resolve();
}
