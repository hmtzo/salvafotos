// =====================================================================
// API TRACK-USAGE — registro server-side de uso de ferramentas
// =====================================================================
// POST { tool, meta? }
// Identifica o user pelo cookie sf_auth e grava em:
//   sindi-usage:<user>:<YYYY-MM-DD> → array de { tool, ts, meta? }
//
// Usado pelo email diário (/api/email-daily) pra calcular o uso do dia.
// =====================================================================

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
  const url = ttl ? `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttl}` : `${KV_URL}/set/${encodeURIComponent(key)}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOK}`, 'Content-Type': 'application/json' },
    body: v,
  });
  return r.ok;
}

function getUser(req) {
  const cookies = req.headers.get('cookie') || '';
  const m = cookies.match(/(?:^|;\s*)sf_auth=([^;]+)/);
  if (!m) return null;
  try {
    const decoded = atob(m[1]);
    const idx = decoded.indexOf(':');
    if (idx > 0) return decoded.slice(0, idx).toLowerCase();
  } catch {}
  return null;
}

function todayKey() {
  // YYYY-MM-DD em fuso BRT (UTC-3)
  const offset = -3 * 60;
  const local = new Date(Date.now() + (new Date().getTimezoneOffset() + offset) * 60000);
  return local.toISOString().slice(0, 10);
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 });
  }
  const user = getUser(request);
  if (!user) {
    // Sem cookie — não loga, mas não erra (pra não quebrar UX)
    return new Response(JSON.stringify({ ok: false, reason: 'no auth' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  let body = {};
  try { body = await request.json(); } catch {}
  const tool = String(body.tool || '').slice(0, 60);
  if (!tool) {
    return new Response(JSON.stringify({ ok: false, reason: 'missing tool' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }
  const meta = body.meta && typeof body.meta === 'object' ? body.meta : null;

  const day = todayKey();
  const key = `sindi-usage:${user}:${day}`;
  const list = (await kvGet(key)) || [];
  list.push({ tool, ts: Date.now(), ...(meta ? { meta } : {}) });
  // Limite defensivo
  const trimmed = list.slice(-500);
  // TTL 90 dias — depois disso o uso histórico já agregou pra analytics
  await kvSet(key, trimmed, 86400 * 90);

  return new Response(JSON.stringify({ ok: true, count: trimmed.length }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
