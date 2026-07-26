import { NextRequest, NextResponse } from 'next/server';

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error?.message || payload.message || `请求失败（HTTP ${response.status}）。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiBaseUrl = String(body.apiBaseUrl || '');
    const apiKey = String(body.apiKey || '');
    const model = String(body.model || '');
    const prompt = String(body.prompt || '');
    const duration = Number(body.duration) || 6;
    const aspectRatio = String(body.aspectRatio || '16:9');
    const resolution = String(body.resolution || '720p');
    const sourceImage = typeof body.sourceImage === 'string' ? body.sourceImage : '';

    if (!apiBaseUrl || !apiKey || !model || !prompt) {
      return NextResponse.json({ error: '请完整填写连接设置和提示词。' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      model,
      prompt,
      duration,
      aspect_ratio: aspectRatio,
      resolution,
    };
    if (sourceImage) payload.image = { url: sourceImage };

    const response = await fetch(endpoint(apiBaseUrl, '/videos/generations'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json({ error: await readError(response) }, { status: response.status });
    }

    const data = await response.json();
    if (!data.request_id) {
      return NextResponse.json({ error: '接口未返回任务 ID。' }, { status: 502 });
    }

    return NextResponse.json({ requestId: data.request_id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '提交视频生成任务失败。' },
      { status: 500 },
    );
  }
}
