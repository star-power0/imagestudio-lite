/**
 * 读取上游错误响应。
 *
 * 上游不保证返回 JSON：中转站的网关错误页是整篇 HTML。直接 `response.json()`
 * 会解析失败，于是上游给出的原因被整个丢掉，只剩一句「请求失败（HTTP xxx）」——
 * 不是空提示，但排查时等于没有信息。只认 error.message / message 也一样，
 * 别的 JSON 结构（例如 {"detail":...}）会退化成同一句话。
 *
 * 所以先读文本：能解析成 JSON 就优先取其中的 message，否则原样带出文本，
 * 只有 HTML 错误页才压缩成状态码摘要（整篇标签回显会刷屏）。
 */
export async function readUpstreamError(response: Response) {
  const raw = await response.text().catch(() => '');

  try {
    const payload = JSON.parse(raw);
    const message = payload.error?.message || payload.message;
    if (message) return message;
  } catch {
    // 不是 JSON，下面用文本兜底
  }

  const text = raw.trim();
  // HTML 错误页直接回显会刷屏，只提示状态码。
  if (!text || text.startsWith('<')) {
    return `上游返回 HTTP ${response.status}，未给出错误详情（可能是参数不被支持或网关故障）。`;
  }
  return `请求失败（HTTP ${response.status}）：${text.slice(0, 200)}`;
}
