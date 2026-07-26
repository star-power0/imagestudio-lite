import { NextRequest, NextResponse } from 'next/server';

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error?.message || payload.message || `请求失败（HTTP ${response.status}）。`;
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const apiBaseUrl = String(params.get('apiBaseUrl') || '');
    const apiKey = String(params.get('apiKey') || '');
    const requestId = String(params.get('requestId') || '');

    if (!apiBaseUrl || !apiKey || !requestId) {
      return NextResponse.json({ error: '缺少查询参数。' }, { status: 400 });
    }

    const response = await fetch(endpoint(apiBaseUrl, `/videos/${requestId}`), {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: await readError(response) }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      status: data.status,
      progress: data.progress ?? null,
      url: data.video?.url ?? null,
      errorMessage: data.error?.message ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '查询视频任务状态失败。' },
      { status: 500 },
    );
  }
}
