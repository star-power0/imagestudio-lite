/**
 * 读取上游错误响应。
 *
 * 上游不保证返回 JSON——中转站的网关错误页是整篇 HTML，直接 `response.json()`
 * 会抛错并把错误信息吞成空字符串，用户只看到一个空白提示。所以先读文本，
 * 能解析成 JSON 就取其中的 message，否则用文本兜底。
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
