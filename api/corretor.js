// =====================================================================
// API CORRETOR DE TEXTO PT-BR (Google Gemini)
// =====================================================================
// Recebe texto e retorna versão corrigida + lista de mudanças.
// =====================================================================

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Você é um corretor profissional de português brasileiro.

Tarefa: receber um texto em português brasileiro e devolver:
1. O texto corrigido (ortografia, gramática, concordância, regência, pontuação, acentuação)
2. Uma lista das principais correções feitas (em formato JSON)

REGRAS:
- Use o português brasileiro padrão (Acordo Ortográfico de 2009).
- Mantenha o sentido e o tom do texto original.
- NÃO reescreva ou parafraseie — apenas corrija o que está errado.
- Se o texto já está correto, devolva-o igual e diga "sem correções".
- Para textos formais, mantenha o tom formal. Para informais, mantenha informal.
- Seja conservador: prefira não mexer em escolhas estilísticas que sejam aceitáveis.

FORMATO DE RESPOSTA (responda APENAS o JSON, sem markdown):
{
  "corrigido": "texto completo já corrigido",
  "mudancas": [
    { "antes": "trecho original", "depois": "correção", "motivo": "explicação curta" }
  ]
}

Se não houver correções, retorne:
{ "corrigido": "texto original", "mudancas": [] }`;

const MODEL = 'gemini-2.5-flash';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Corretor não configurado. Adicione GOOGLE_API_KEY no Vercel.',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Requisição inválida' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const text = (body.text || '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'Texto vazio' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (text.length > 50000) {
    return new Response(JSON.stringify({ error: 'Texto muito longo (máx 50.000 caracteres). Divida em partes menores.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text }] }],
        generationConfig: {
          temperature: 0.2, // baixo = correções mais conservadoras
          maxOutputTokens: 8000,
          topP: 0.9,
          responseMimeType: 'application/json',
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini error:', upstream.status, errText);
      let userMsg = `Erro na API (${upstream.status})`;
      if (upstream.status === 429) userMsg = 'Limite atingido. Aguarde 1 minuto.';
      return new Response(JSON.stringify({ error: userMsg }), {
        status: 502, headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await upstream.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Se não veio JSON válido, faz fallback retornando como texto puro
      parsed = { corrigido: raw, mudancas: [] };
    }

    return new Response(JSON.stringify({
      corrigido: parsed.corrigido || text,
      mudancas: Array.isArray(parsed.mudancas) ? parsed.mudancas : [],
      usage: data.usageMetadata,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Corretor error:', err);
    return new Response(JSON.stringify({ error: 'Falha: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
