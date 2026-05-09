// =====================================================================
// API GEMINI-DOC — endpoint genérico pra processar documento via Gemini
// =====================================================================
// Recebe { file: <base64>, mimeType, prompt, mode? }
// Devolve { text } com a resposta. Usado por:
// - /tools/resumir-pdf.html
// - /tools/traduzir-pdf.html
// - qualquer ferramenta que precise mandar arquivo + prompt pro Gemini
// =====================================================================

export const config = { runtime: 'edge' };

const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_THINK = 'gemini-2.5-pro';
const MAX_BYTES = 18 * 1024 * 1024; // ~18MB inline limit

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GOOGLE_API_KEY não configurada', configured: false }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const fileB64 = (body.file || '').replace(/^data:[^;]+;base64,/, '').trim();
  const mimeType = body.mimeType || 'application/pdf';
  const prompt = (body.prompt || '').trim();
  const mode = body.mode || 'flash';

  if (!fileB64) {
    return new Response(JSON.stringify({ error: 'Arquivo vazio' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'Prompt vazio' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (fileB64.length > MAX_BYTES * 1.4) {
    return new Response(JSON.stringify({
      error: 'Arquivo muito grande. Limite ~18MB (use Comprimir PDF antes).',
    }), { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  const model = mode === 'think' ? MODEL_THINK : MODEL_FAST;
  const FALLBACK_MODEL = 'gemini-2.0-flash';

  const requestBody = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: fileB64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  };

  try {
    let currentModel = model;
    let upstream;
    let attempt = 0;
    let triedLegacyOn403 = false;
    while (attempt < 4) {
      upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
      );
      if (upstream.ok) break;
      if (upstream.status === 403 && !triedLegacyOn403) {
        triedLegacyOn403 = true;
        currentModel = FALLBACK_MODEL;
        continue;
      }
      const retryable = [429, 500, 502, 503, 504].includes(upstream.status);
      if (!retryable || attempt === 3) break;
      await new Promise(r => setTimeout(r, 800 * (attempt + 1) + Math.random() * 400));
      if ([503, 504].includes(upstream.status) && currentModel !== FALLBACK_MODEL) {
        currentModel = FALLBACK_MODEL;
      }
      attempt++;
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini-doc error:', upstream.status, errText.slice(0, 300));
      let userMsg = `Erro Gemini (${upstream.status})`;
      if (upstream.status === 429) userMsg = '⚠️ Limite de requisições. Aguarde 1 min.';
      if (upstream.status === 503) userMsg = '⏳ Gemini sobrecarregado. Tente em 30s.';
      if (upstream.status === 400) userMsg = '⚠️ Documento inválido ou prompt rejeitado.';
      if (upstream.status === 403) {
        let hint = 'A chave pode estar revogada ou sem acesso.';
        try { const j = JSON.parse(errText); if (j?.error?.message) hint = j.error.message; } catch {}
        userMsg = `⚠️ Gemini recusou (403): ${hint}`;
      }
      return new Response(JSON.stringify({ error: userMsg, detail: errText.slice(0, 200) }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text || '').join('').trim();

    if (!text) {
      const reason = data.candidates?.[0]?.finishReason || data.promptFeedback?.blockReason;
      return new Response(JSON.stringify({
        text: '',
        empty: true,
        blockReason: reason || null,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      text,
      model: currentModel,
      usage: data.usageMetadata,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('gemini-doc failed', err);
    return new Response(JSON.stringify({ error: 'Falha: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
