// =====================================================================
// API WHATSAPP-WEBHOOK — recebe mensagens via Poli e responde com Sindi
// =====================================================================
// A Poli envia POST quando uma mensagem chega no canal WhatsApp.
// O formato exato do payload da Poli ainda não está documentado
// publicamente — fiz parser tolerante que tenta vários formatos comuns.
//
// Fluxo:
//   1) parse payload → extrai { phone, body, contactName }
//   2) identifica o funcionário pelo número (índice sindi-phone:<phone>)
//   3) se conhecido: manda mensagem pra Sindi com contexto do funcionário,
//      pega resposta, envia de volta via Poli
//   4) se desconhecido: ignora (ou opcionalmente loga)
//   5) tudo num try/catch — webhook NUNCA pode dar 500 (Poli reenvia)
//
// Verificação opcional: se POLI_WEBHOOK_SECRET estiver setado, valida
// header "X-Poli-Token" ou similar.
// =====================================================================

import { sendTextByPhone, normalizePhone, poliConfigured } from './_poli.js';

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOK) return null;
  const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOK}` },
  });
  if (!r.ok) return null;
  const j = await r.json();
  if (!j.result) return null;
  try { return JSON.parse(j.result); } catch { return j.result; }
}

async function kvSet(key, value, ttl = null) {
  if (!KV_URL || !KV_TOK) return false;
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  const url = ttl
    ? `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttl}`
    : `${KV_URL}/set/${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOK}`, 'Content-Type': 'application/json' },
    body: v,
  });
  return r.ok;
}

// Tenta extrair { phone, body, contactName, messageId } de payloads variados da Poli.
function parsePayload(p) {
  if (!p || typeof p !== 'object') return null;
  // Tentativas de chave em ordem de probabilidade
  const phone =
    p.phone || p.from || p.contact_phone || p.sender_phone ||
    p.contact?.phone || p.from?.phone || p.message?.from || p.data?.phone;
  const body =
    p.message || p.text || p.body || p.content ||
    p.message?.text || p.message?.body || p.data?.message;
  const contactName =
    p.contact_name || p.from_name || p.contact?.name || p.sender_name || '';
  const messageId =
    p.message_id || p.id || p.message?.id || p.data?.id || null;
  // Direção (só quer mensagens recebidas, não as que ele mesmo mandou)
  const direction = p.direction || p.message?.direction || 'inbound';

  if (!phone || !body) return null;
  return {
    phone: String(phone),
    body: String(body),
    contactName: String(contactName || ''),
    messageId,
    direction,
  };
}

// Acha o funcionário pelo telefone
async function findEmployeeByPhone(phone) {
  const norm = normalizePhone(phone);
  // Tenta variações de chave (com e sem 55)
  const variants = [norm, norm.replace(/^55/, ''), '55' + norm.replace(/^55/, '')];
  for (const v of variants) {
    const email = await kvGet(`sindi-phone:${v}`);
    if (email) {
      const profile = await kvGet(`sindi-profile:${email.toLowerCase()}`);
      if (profile) return { email, ...profile };
    }
  }
  return null;
}

// Mantém histórico curto da conversa (últimas 8 trocas, TTL 12h pra liberar
// memória se ficar idle)
async function getThread(phone) {
  const k = `sindi-wpp-thread:${normalizePhone(phone)}`;
  const t = await kvGet(k);
  return Array.isArray(t) ? t : [];
}
async function pushThread(phone, role, content) {
  const k = `sindi-wpp-thread:${normalizePhone(phone)}`;
  const t = await getThread(phone);
  t.push({ role, content });
  const trimmed = t.slice(-16);
  await kvSet(k, trimmed, 60 * 60 * 12);
}

// Chama a Sindi (mesma /api/sindi internamente — mas não passa pelo cookie auth,
// então chamamos o Gemini direto com prompt customizado)
async function askSindi({ employee, history, message }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return 'Sindi indisponível agora — chave Gemini não configurada.';

  const systemText = `Você é a Sindi, IA da Sindicompany, falando por WhatsApp com ${employee.name}${employee.role ? ' (' + employee.role + ')' : ''} — funcionário interno.

Esta conversa é via WhatsApp, então:
- Mensagens curtas (idealmente 1-3 parágrafos, máx ~250 palavras)
- Markdown leve: *negrito* e _itálico_ com asterisco/underscore SIMPLES (formato WhatsApp), NÃO use ** ou __
- Sem cabeçalhos em maiúsculas com asteriscos (cartões coloridos só funcionam no painel web, aqui vira ruído)
- Quebras de linha claras
- Tom acolhedor, profissional, brasileiro natural

Você é generalista de elite: faz qualquer coisa que pedirem (condomínio, código, redação, brainstorm, dúvida casual). Aprende continuamente sobre a Sindicompany.

Se pesquisar algo, mencione brevemente. Se não souber, diga.`;

  const contents = [
    ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  // Modelo flash com fallback automático
  const tryModel = async (model) => {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemText }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1500, topP: 0.95 },
          tools: [{ google_search: {} }],
        }),
      }
    );
    return r;
  };

  let r = await tryModel('gemini-2.5-flash');
  if (!r.ok && [403, 503].includes(r.status)) {
    r = await tryModel('gemini-2.0-flash');
  }
  if (!r.ok) {
    const t = await r.text();
    console.error('webhook askSindi error', r.status, t.slice(0, 200));
    return 'Tive um problema agora. Tenta de novo em 1 minuto?';
  }
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
  return text || 'Não consegui formular uma resposta agora — pode reformular?';
}

// Converte markdown ** ou __ pro formato WhatsApp (* simples)
// e remove cabeçalhos de cartão tipo **DIAGNÓSTICO**
function toWhatsappMd(text) {
  return String(text || '')
    .replace(/\*\*\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ ]{3,})\s*\*\*\s*\n?/g, '*$1*\n')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/__(.+?)__/g, '_$1_')
    .replace(/\[CONFIANÇA:[^\]]+\]\s*$/gi, '')
    .trim();
}

export default async function handler(request) {
  // Webhook GET é usado por algumas plataformas pra "verify" — devolve 200 vazio
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const challenge = url.searchParams.get('hub.challenge') || url.searchParams.get('challenge');
    if (challenge) return new Response(challenge, { status: 200 });
    return new Response('ok', { status: 200 });
  }

  if (request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }

  // Validação opcional do secret
  const secret = process.env.POLI_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      request.headers.get('x-poli-token') ||
      request.headers.get('x-webhook-secret') ||
      new URL(request.url).searchParams.get('secret');
    if (provided !== secret) {
      console.warn('webhook auth fail');
      return new Response('forbidden', { status: 403 });
    }
  }

  let payload;
  try { payload = await request.json(); }
  catch {
    // Devolve 200 pra Poli não reenviar pra sempre
    return new Response(JSON.stringify({ ok: false, reason: 'json inválido' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  const msg = parsePayload(payload);
  if (!msg) {
    console.warn('payload sem phone/body', JSON.stringify(payload).slice(0, 300));
    return new Response(JSON.stringify({ ok: false, reason: 'payload incompleto' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Ignora mensagens enviadas pela própria empresa (outbound)
  if (msg.direction && msg.direction !== 'inbound' && msg.direction !== 'received') {
    return new Response(JSON.stringify({ ok: true, ignored: 'outbound' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Dedup por messageId
  if (msg.messageId) {
    const seen = await kvGet(`sindi-wpp-seen:${msg.messageId}`);
    if (seen) {
      return new Response(JSON.stringify({ ok: true, dedup: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    await kvSet(`sindi-wpp-seen:${msg.messageId}`, '1', 60 * 60 * 24);
  }

  const employee = await findEmployeeByPhone(msg.phone);
  if (!employee) {
    // Pessoa fora da equipe mandando mensagem — ignora
    console.log('phone não cadastrado:', normalizePhone(msg.phone));
    return new Response(JSON.stringify({ ok: true, ignored: 'unknown phone' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!poliConfigured()) {
    console.error('Poli não configurada — não dá pra responder');
    return new Response(JSON.stringify({ ok: false, reason: 'poli not configured' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Resposta (síncrona — Poli espera 200 e a resposta acontece depois,
  // mas em Edge runtime o waitUntil não tá garantido. Fazemos inline.)
  try {
    const history = await getThread(msg.phone);
    const reply = await askSindi({ employee, history, message: msg.body });
    const replyFinal = toWhatsappMd(reply);
    await sendTextByPhone({
      phone: msg.phone,
      message: replyFinal,
      name: employee.name,
      email: employee.email,
    });
    await pushThread(msg.phone, 'user', msg.body);
    await pushThread(msg.phone, 'assistant', replyFinal);
    return new Response(JSON.stringify({ ok: true, replied: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('webhook reply failed', e.message);
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
}
