import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiBaseUrl = String(body.apiBaseUrl || '');
    const apiKey = String(body.apiKey || '');
    const videoUrl = String(body.videoUrl || '');

    if (!apiBaseUrl || !apiKey || !videoUrl) {
      return NextResponse.json({ error: '缺少视频代理参数。' }, { status: 400 });
    }

    const base = new URL(apiBaseUrl);
    const target = new URL(videoUrl);
    if (target.origin !== base.origin) {
      return NextResponse.json({ error: '视频地址与 API 地址不匹配。' }, { status: 400 });
    }

    const response = await fetch(target, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: `下载视频失败（HTTP ${response.status}）。` }, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': response.headers.get('content-type') || 'video/mp4',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '代理视频失败。' },
      { status: 500 },
    );
  }
}
