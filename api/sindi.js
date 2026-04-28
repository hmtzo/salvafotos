// =====================================================================
// API SINDI — Copiloto IA da Sindicompany (Claude)
// =====================================================================
// Variavel de ambiente necessaria: ANTHROPIC_API_KEY
// Configure em: https://vercel.com/hmtzos-projects/whatsapp-fotos/settings/environment-variables
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
- Use markdown leve (negrito, listas) para organizar respostas longas
- Se o usuário enviar texto de documento, analise e responda objetivamente

Responda diretamente. Sem preâmbulos como "ótima pergunta!".`;

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Sindi não está configurada ainda. O administrador precisa adicionar a chave da API Anthropic nas variáveis de ambiente do Vercel.',
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

  // Limita histórico a últimas 20 trocas para controle de custo
  const trimmed = messages.slice(-20);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        system: [
          { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        ],
        messages: trimmed,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Anthropic error:', upstream.status, errText);
      return new Response(JSON.stringify({
        error: `Erro na API (${upstream.status})`,
        detail: errText.slice(0, 200),
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await upstream.json();
    const text = data.content?.[0]?.text || '';

    return new Response(JSON.stringify({
      reply: text,
      usage: data.usage,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Sindi error:', err);
    return new Response(JSON.stringify({ error: 'Falha ao chamar API: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
