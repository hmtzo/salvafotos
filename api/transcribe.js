// =====================================================================
// API TRANSCRIBE — transcrição de áudio via Gemini
// =====================================================================
// Recebe { audio: <base64>, mimeType: 'audio/webm;codecs=opus' }
// Devolve { text: '...' }
//
// Fallback universal pro botão do mic: quando o navegador não tem
// Web Speech API (Firefox, Safari iOS PWA, Android variados), o front
// grava com MediaRecorder e envia o blob pra cá.
// =====================================================================

export const config = { runtime: 'edge' };

const MODEL = 'gemini-2.5-flash';
const MAX_BYTES = 18 * 1024 * 1024; // ~18MB (Gemini inline limit é 20MB, deixa margem)

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Transcrição indisponível: GOOGLE_API_KEY não configurada.',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Requisição inválida (JSON malformado)' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const audioB64 = (body.audio || '').replace(/^data:[^;]+;base64,/, '').trim();
  const mimeType = body.mimeType || 'audio/webm';
  const lang = body.lang || 'pt-BR';

  if (!audioB64) {
    return new Response(JSON.stringify({ error: 'Áudio vazio' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  // base64 expande ~33% — limita pra não estourar
  if (audioB64.length > MAX_BYTES * 1.4) {
    return new Response(JSON.stringify({
      error: 'Áudio muito longo. Grave por menos tempo (máx ~1 min).',
    }), { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
  const prompt = lang === 'pt-BR'
    ? 'Transcreva o áudio em português brasileiro. Devolva APENAS o texto transcrito, sem comentários, sem aspas, sem marcadores. Se o áudio estiver vazio ou inaudível, devolva exatamente: (sem áudio)'
    : `Transcribe the audio in ${lang}. Return ONLY the transcribed text, no comments, no quotes, no markers. If the audio is empty or inaudible, return exactly: (sem áudio)`;

  const requestBody = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: audioB64 } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0,
      maxOutputTokens: 2048,
    },
  };

  try {
    // Retry simples com backoff em 429/5xx (Gemini sobrecarga é comum)
    let upstream;
    let attempt = 0;
    while (attempt < 3) {
      upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (upstream.ok) break;
      const retryable = [429, 500, 502, 503, 504].includes(upstream.status);
      if (!retryable || attempt === 2) break;
      await new Promise(r => setTimeout(r, 800 * (attempt + 1) + Math.random() * 400));
      attempt++;
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini transcribe error:', upstream.status, errText.slice(0, 300));
      let userMsg = `Erro Gemini (${upstream.status})`;
      if (upstream.status === 429) userMsg = '⚠️ Limite de requisições. Aguarde 1 min.';
      if (upstream.status === 503) userMsg = '⏳ Gemini sobrecarregado. Tenta de novo em 30s.';
      if (upstream.status === 400) userMsg = '⚠️ Áudio inválido ou formato não suportado.';
      return new Response(JSON.stringify({ error: userMsg, detail: errText.slice(0, 200) }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text || '').join('').trim();

    if (!text || /^\(sem áudio\)$/i.test(text)) {
      return new Response(JSON.stringify({ text: '', empty: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('transcribe failed', err);
    return new Response(JSON.stringify({ error: 'Falha ao transcrever: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
