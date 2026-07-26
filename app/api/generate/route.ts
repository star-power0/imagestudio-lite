import { NextRequest, NextResponse } from 'next/server';

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}${path}`;
}

async function readError(response: Response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error?.message || payload.message || `请求失败（HTTP ${response.status}）。`;
}

function toDataUrl(bytes: ArrayBuffer, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString('base64')}`;
}

async function fileToDataUrl(file: File) {
  return toDataUrl(await file.arrayBuffer(), file.type || 'image/png');
}

function isGrokModel(model: string) {
  return model.startsWith('grok-imagine');
}

// Grok Imagine 2K 是当前上限，请求方带来的 4K 分辨率降级到 2K。
const GROK_RESOLUTION: Record<string, string> = { '1K': '1k', '2K': '2k', '4K': '2k' };

async function callGrok(apiBaseUrl: string, apiKey: string, body: Record<string, unknown>, hasImage: boolean) {
  const path = hasImage ? '/images/edits' : '/images/generations';
  return fetch(endpoint(apiBaseUrl, path), {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const apiBaseUrl = String(formData.get('apiBaseUrl') || '');
    const apiKey = String(formData.get('apiKey') || '');
    const model = String(formData.get('model') || '');
    const prompt = String(formData.get('prompt') || '');
    const size = String(formData.get('size') || '');
    const ratio = String(formData.get('ratio') || '');
    const resolution = String(formData.get('resolution') || '');
    const quality = String(formData.get('quality') || 'auto');
    const outputFormat = String(formData.get('outputFormat') || 'png');
    const image = formData.get('image');
    const hasImage = image instanceof File && image.size > 0;

    if (!apiBaseUrl || !apiKey || !model || !prompt || (!size && !(ratio && resolution))) {
      return NextResponse.json({ error: '请完整填写连接设置和提示词。' }, { status: 400 });
    }

    let response: Response;

    if (isGrokModel(model)) {
      // Grok Imagine 走 xAI 原生协议：aspect_ratio + resolution，JSON 请求体，
      // 编辑时用 data URL 内联图片，不用 multipart。
      const body: Record<string, unknown> = {
        model,
        prompt,
        aspect_ratio: ratio,
        resolution: GROK_RESOLUTION[resolution] || '1k',
        response_format: 'b64_json',
      };
      if (hasImage) body.image = { url: await fileToDataUrl(image as File) };
      response = await callGrok(apiBaseUrl, apiKey, body, hasImage);
    } else {
      const headers = { Authorization: `Bearer ${apiKey}` };
      if (hasImage) {
        const body = new FormData();
        body.append('model', model);
        body.append('prompt', prompt);
        body.append('image', image as File, (image as File).name);
        body.append('size', size);
        body.append('quality', quality);
        body.append('output_format', outputFormat);
        response = await fetch(endpoint(apiBaseUrl, '/images/edits'), { method: 'POST', headers, body });
      } else {
        response = await fetch(endpoint(apiBaseUrl, '/images/generations'), {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            size,
            quality,
            output_format: outputFormat,
            response_format: 'b64_json',
          }),
        });
      }
    }

    if (!response.ok) {
      return NextResponse.json({ error: await readError(response) }, { status: response.status });
    }

    const payload = await response.json();
    const result = payload.data?.[0];
    if (result?.b64_json) {
      return NextResponse.json({ image: `data:image/${outputFormat};base64,${result.b64_json}` });
    }

    if (typeof result?.url === 'string') {
      const imageResponse = await fetch(result.url);
      if (!imageResponse.ok) {
        return NextResponse.json({ error: '生成接口返回的图片链接无法下载。' }, { status: 502 });
      }
      const mimeType = imageResponse.headers.get('content-type') || `image/${outputFormat}`;
      return NextResponse.json({ image: toDataUrl(await imageResponse.arrayBuffer(), mimeType) });
    }

    return NextResponse.json({ error: '接口未返回可显示的图片数据。' }, { status: 502 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器处理图片请求时失败。' },
      { status: 500 },
    );
  }
}
