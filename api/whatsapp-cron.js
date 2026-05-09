// =====================================================================
// API WHATSAPP-CRON — Bom dia diário pros funcionários
// =====================================================================
// Disparado pelo Vercel Cron (vercel.json) toda manhã 8h dia útil.
// Pra cada funcionário com WhatsApp cadastrado:
//   1) gera frase motivacional via Sindi (Gemini)
//   2) monta mensagem "Bom dia, {nome}! …" + dica de uso da Sindi
//   3) envia via Poli
//   4) loga resultado no KV (sf_wpp_log)
//
// Segurança: protegido por header CRON_SECRET (Vercel Cron envia automático
// com a env var CRON_SECRET configurada).
// =====================================================================

import { sendTextByPhone, poliConfigured } from './_poli.js';

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

async function kvSet(key, value, ttlSeconds = null) {
  if (!KV_URL || !KV_TOK) return false;
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  const url = ttlSeconds
    ? `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttlSeconds}`
    : `${KV_URL}/set/${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOK}`, 'Content-Type': 'application/json' },
    body: v,
  });
  return r.ok;
}

// Lista de funcionários — vem do KV (perfis cadastrados).
// Cada perfil em sindi-profile:<email> com { name, role, whatsapp, ... }.
// Mantém um índice sindi-wpp-users → [emails] pra evitar varredura.
async function listEmployees() {
  const idx = await kvGet('sindi-wpp-users');
  const emails = Array.isArray(idx) ? idx : [];
  const out = [];
  for (const email of emails) {
    const p = await kvGet(`sindi-profile:${email.toLowerCase()}`);
    if (p && p.whatsapp) {
      out.push({
        email,
        name: p.name || email.split('@')[0],
        role: p.role || '',
        whatsapp: p.whatsapp,
      });
    }
  }
  return out;
}

// Gera frase motivacional via Gemini.
// Cache de 30 dias por chave pra não repetir frases recentes.
async function generateQuote(name) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return {
      text: 'Cada dia é uma página nova — escreve bonito.',
      author: null,
    };
  }
  const recent = await kvGet('sindi-wpp-recent-quotes') || [];
  const prompt = `Gere uma frase motivacional curta (até 18 palavras) para começar o dia de uma pessoa que trabalha em administração de condomínios. Tom: leve, otimista, brasileiro, sem pieguice. Pode ser citação famosa OU original.

Evite repetir estas que já foram usadas recentemente:
${recent.slice(0, 30).map(q => '- ' + q).join('\n') || '(nenhuma ainda)'}

Devolva APENAS um JSON válido no formato:
{"text": "a frase", "author": "Autor ou null se for original"}`;

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 200,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!r.ok) throw new Error('Gemini retornou ' + r.status);
    const data = await r.json();
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const j = JSON.parse(txt);
    if (j.text) {
      // atualiza cache de recentes (top 30)
      const updated = [j.text, ...recent].slice(0, 30);
      await kvSet('sindi-wpp-recent-quotes', updated);
      return j;
    }
  } catch (e) {
    console.warn('quote gen failed', e.message);
  }
  return {
    text: 'Cada dia é uma página nova — escreve bonito.',
    author: null,
  };
}

function buildMessage({ name, quote }) {
  const firstName = String(name || '').trim().split(/\s+/)[0] || 'time';
  const greet = `Bom dia, ${firstName}! 🌅`;
  const phrase = quote.author ? `"${quote.text}"\n— ${quote.author}` : `"${quote.text}"`;
  const tip = `\n\n_Qualquer dúvida do dia, é só responder por aqui — a Sindi te ajuda na hora._`;
  return `${greet}\n\n${phrase}${tip}`;
}

export default async function handler(request) {
  // Proteção: aceita só requisições do Vercel Cron (com CRON_SECRET) ou
  // chamada manual com mesmo secret no header Authorization
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  const expectedAuth = cronSecret ? `Bearer ${cronSecret}` : null;
  // Vercel Cron envia o secret no header. Em chamadas manuais aceita o mesmo bearer.
  if (cronSecret && auth !== expectedAuth) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!poliConfigured()) {
    return new Response(JSON.stringify({
      error: 'Poli não configurada. Falta POLI_API_TOKEN, POLI_CUSTOMER_ID, POLI_CHANNEL_ID ou POLI_USER_ID.',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const employees = await listEmployees();
  if (!employees.length) {
    return new Response(JSON.stringify({
      ok: true, sent: 0, skipped: 0, note: 'Nenhum funcionário com WhatsApp cadastrado.',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  const log = [];
  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  for (const emp of employees) {
    // Dedup: não envia 2x no mesmo dia
    const dedupKey = `sindi-wpp-sent:${todayKey}:${emp.email.toLowerCase()}`;
    const already = await kvGet(dedupKey);
    if (already) {
      log.push({ email: emp.email, status: 'skipped', reason: 'já enviado hoje' });
      continue;
    }

    try {
      const quote = await generateQuote(emp.name);
      const msg = buildMessage({ name: emp.name, quote });
      await sendTextByPhone({
        phone: emp.whatsapp,
        message: msg,
        name: emp.name,
        email: emp.email,
      });
      await kvSet(dedupKey, { sentAt: new Date().toISOString(), quote: quote.text }, 86400 * 2);
      log.push({ email: emp.email, status: 'sent', quote: quote.text });
    } catch (err) {
      console.error('cron send error', emp.email, err.message);
      log.push({ email: emp.email, status: 'error', error: err.message });
    }
  }

  // Log diário pra dashboard ver depois
  await kvSet(`sindi-wpp-cron-log:${todayKey}`, {
    ranAt: new Date().toISOString(),
    total: employees.length,
    sent: log.filter(l => l.status === 'sent').length,
    errors: log.filter(l => l.status === 'error').length,
    items: log,
  }, 86400 * 90);

  return new Response(JSON.stringify({
    ok: true,
    date: todayKey,
    total: employees.length,
    sent: log.filter(l => l.status === 'sent').length,
    skipped: log.filter(l => l.status === 'skipped').length,
    errors: log.filter(l => l.status === 'error').length,
    log,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
