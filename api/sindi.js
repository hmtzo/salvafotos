// =====================================================================
// API SINDI — Copiloto IA da Sindicompany (Google Gemini, free tier)
// =====================================================================
// Variavel de ambiente necessaria: GOOGLE_API_KEY
// Crie a chave grátis em: https://aistudio.google.com/apikey
// Configure em: Vercel > Settings > Environment Variables
//
// Limites do plano grátis Gemini 2.0 Flash:
// - 15 requisições por minuto
// - 1.500 requisições por dia
// - 1M tokens de contexto
// =====================================================================

export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `Você é a Sindi, copiloto da Sindicompany — empresa de administração condominial.

Você ajuda os colaboradores no dia a dia do escritório. Conhece bem:
- Direito condominial brasileiro (Lei 4.591/64, Código Civil arts. 1.331-1.358, Lei do Inquilinato)
- LGPD aplicada a condomínios
- ABNT NBR 16.280/2014 (reformas em condomínios)
- Práticas de assembleia, ata, convocação, deliberação
- Modelos de notificação extrajudicial
- Cálculos de inadimplência, reajuste de aluguel, rateio
- Procedimentos administrativos (AVCB, vistorias, manutenção preventiva)

DIRETRIZES:
- Responda em português brasileiro, tom profissional mas acessível
- Seja direto e prático — colaboradores estão ocupados
- Cite artigos de lei quando relevante (mas explique em linguagem simples)
- Se a pergunta exige análise jurídica complexa, oriente a consultar advogado
- Se não souber, diga "não tenho essa informação" — nunca invente
- Use markdown leve (negrito com **, listas com - ou 1.) para organizar respostas longas
- Se o usuário enviar texto de documento, analise e responda objetivamente

Responda diretamente. Sem preâmbulos como "ótima pergunta!".`;

// Modelos disponíveis
const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_THINK = 'gemini-2.5-pro';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Sindi não está configurada ainda. O administrador precisa adicionar a chave do Google Gemini nas variáveis de ambiente do Vercel (GOOGLE_API_KEY).',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Requisição inválida' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'Sem mensagens' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const mode = body.mode; // 'search' | 'think' | 'canvas' | null

  // Escolhe modelo conforme modo
  const model = mode === 'think' ? MODEL_THINK : MODEL_FAST;

  // Limita histórico a últimas 20 trocas para controle de tokens
  const trimmed = messages.slice(-20);

  // Converte formato {role:'user'|'assistant', content:'…'} para o formato do Gemini
  // Gemini usa 'user' e 'model' (em vez de 'assistant')
  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Ajusta system prompt e generation config conforme modo
  let systemText = SYSTEM_PROMPT;
  let maxTokens = 2000;
  let temperature = 0.7;
  const tools = [];

  if (mode === 'think') {
    systemText += '\n\nEste é o MODO THINK: dedique-se a uma análise profunda. Considere múltiplas perspectivas, cite fontes/artigos quando aplicável, estruture o raciocínio passo a passo antes da conclusão.';
    maxTokens = 4000;
    temperature = 0.5;
  } else if (mode === 'canvas') {
    systemText += '\n\nEste é o MODO CANVAS: produza conteúdo longo e estruturado. Use markdown rico com títulos, subtítulos, listas, tabelas e seções claras. Não economize em detalhes.';
    maxTokens = 8000;
  } else if (mode === 'search') {
    systemText += '\n\nEste é o MODO SEARCH: use a ferramenta de busca na web para encontrar informações atualizadas e cite as fontes.';
    tools.push({ google_search: {} });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };
    if (tools.length) requestBody.tools = tools;

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini error:', upstream.status, errText);
      let userMsg = `Erro na API Gemini (${upstream.status})`;
      if (upstream.status === 429) userMsg = 'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.';
      if (upstream.status === 400) userMsg = 'Mensagem rejeitada. Tente reformular.';
      if (upstream.status === 403) userMsg = 'Chave da API inválida ou sem permissão. Avise o administrador.';
      return new Response(JSON.stringify({
        error: userMsg,
        detail: errText.slice(0, 300),
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await upstream.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join('') || '';

    if (!text) {
      // Pode ter sido bloqueado por safety
      const blockReason = candidate?.finishReason || data.promptFeedback?.blockReason;
      return new Response(JSON.stringify({
        reply: blockReason
          ? `Não consegui responder por questão de segurança automática (${blockReason}). Tente reformular a pergunta.`
          : '(sem resposta da IA)',
        usage: data.usageMetadata,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      reply: text,
      usage: data.usageMetadata,
      model,
      mode: mode || null,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Sindi error:', err);
    return new Response(JSON.stringify({ error: 'Falha ao chamar API: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
