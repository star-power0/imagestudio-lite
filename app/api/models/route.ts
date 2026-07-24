import { NextRequest, NextResponse } from 'next/server';

type ModelItem = { id?: unknown; model?: unknown; name?: unknown };

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function endpoint(baseUrl: string, path: string) {
  return `${normalizeBaseUrl(baseUrl)}${path}`;
}

function extractModelNames(payload: unknown) {
  const candidates = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object'
      ? [
          ...(Array.isArray((payload as { data?: unknown }).data) ? (payload as { data: unknown[] }).data : []),
          ...(Array.isArray((payload as { models?: unknown }).models) ? (payload as { models: unknown[] }).models : []),
          ...(Array.isArray((payload as { data?: { models?: unknown } }).data?.models) ? (payload as { data: { models: unknown[] } }).data.models : []),
          ...(Array.isArray((payload as { result?: unknown }).result) ? (payload as { result: unknown[] }).result : []),
        ]
      : [];

  return [...new Set(candidates.map((item) => {
    if (typeof item === 'string') return item;
    if (!item || typeof item !== 'object') return '';
    const model = item as ModelItem;
    return [model.id, model.model, model.name].find((value): value is string => typeof value === 'string') || '';
  }).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiBaseUrl = String(body.apiBaseUrl || '').trim();
    const apiKey = String(body.apiKey || '').trim();

    if (!apiBaseUrl || !apiKey) {
      return NextResponse.json({ error: '请先填写 API 地址和 API Key。' }, { status: 400 });
    }

    const url = endpoint(apiBaseUrl, '/models');
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
    } catch (networkError) {
      return NextResponse.json(
        {
          error: networkError instanceof Error
            ? `无法连接模型接口：${networkError.message}`
            : '无法连接模型接口。',
          endpoint: url,
        },
        { status: 502 },
      );
    }

    const rawText = await response.text();
    let payload: unknown = {};
    try {
      payload = rawText ? JSON.parse(rawText) : {};
    } catch {
      payload = { message: rawText.slice(0, 300) };
    }

    if (!response.ok) {
      const message =
        (payload as { error?: { message?: string } | string }).error &&
        typeof (payload as { error?: { message?: string } | string }).error === 'object'
          ? (payload as { error?: { message?: string } }).error?.message
          : typeof (payload as { error?: string }).error === 'string'
            ? (payload as { error?: string }).error
            : (payload as { message?: string }).message || `拉取模型失败（HTTP ${response.status}）。`;

      return NextResponse.json(
        { error: message, endpoint: url },
        { status: response.status },
      );
    }

    const models = extractModelNames(payload);
    return NextResponse.json({
      models,
      endpoint: url,
      responseShape: Array.isArray(payload) ? 'array' : Object.keys((payload as object) || {}).join(', ') || 'empty object',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '无法连接到模型接口。' },
      { status: 500 },
    );
  }
}
