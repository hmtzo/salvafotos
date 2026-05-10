// =====================================================================
// API PRESENCE — quem está online agora (presença em tempo real)
// =====================================================================
// POST /api/presence  { tool, toolName?, label? }     → heartbeat (~30s)
// GET  /api/presence                                  → lista de online (admin)
//
// Considera "online" quem teve heartbeat nos últimos 60 segundos.
// Estado mantido em chave única "sindi-presence-state" como array JSON
// (TTL longo) — filtragem por timestamp no read.
// =====================================================================

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;

const ADMIN_USERS = ['luciane@sindicompany.com.br', 'mkt@sindicompany.com.br'];
const ONLINE_WINDOW_MS = 60 * 1000; // 60s sem heartbeat = offline

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

export default async function handler(request) {
  const user = getUser(request);
  if (!user) return new Response(JSON.stringify({ ok: false }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });

  // ---------- POST: heartbeat ----------
  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {}
    const tool = String(body.tool || 'unknown').slice(0, 60).toLowerCase();
    const toolName = String(body.toolName || '').slice(0, 80);
    const label = String(body.label || '').slice(0, 80);

    let state = (await kvGet('sindi-presence-state')) || [];
    if (!Array.isArray(state)) state = [];
    // Remove entradas antigas e do mesmo user
    state = state.filter(p => p.email !== user);
    state.push({
      email: user,
      tool,
      toolName: toolName || tool,
      label,
      ts: Date.now(),
    });
    // Garbage collect: mantém só os últimos 5 minutos pra não inflar
    const cutoff5 = Date.now() - 5 * 60 * 1000;
    state = state.filter(p => p.ts > cutoff5);

    await kvSet('sindi-presence-state', state, 60 * 60); // TTL 1h, mas filtragem por ts no read

    return new Response(JSON.stringify({ ok: true, n: state.length }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---------- GET: lista online ----------
  if (request.method === 'GET') {
    if (!ADMIN_USERS.includes(user)) {
      return new Response(JSON.stringify({ error: 'Apenas admin' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }

    const state = (await kvGet('sindi-presence-state')) || [];
    const cutoff = Date.now() - ONLINE_WINDOW_MS;
    const online = (Array.isArray(state) ? state : [])
      .filter(p => p.ts > cutoff)
      .sort((a, b) => b.ts - a.ts);

    // Enriquece com perfis
    const enriched = await Promise.all(online.map(async p => {
      const profile = await kvGet(`sindi-profile:${p.email.toLowerCase()}`).catch(() => null);
      return {
        ...p,
        name: profile?.name || p.email.split('@')[0],
        role: profile?.role || null,
        idleSeconds: Math.floor((Date.now() - p.ts) / 1000),
      };
    }));

    return new Response(JSON.stringify({
      ok: true,
      now: Date.now(),
      online: enriched,
      count: enriched.length,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response('Método não permitido', { status: 405 });
}
