// =====================================================================
// API QUICK-CAPTURE — salva capturas (foto + texto + categoria) no KV
// =====================================================================
// POST  /api/quick-capture  { id, cat, text, ts, photo? }
//   → grava em sindi-qc:<user>:<id> + adiciona a sindi-qc-list:<user>
//   → grava em sindi-qc-global (timeline pra admin)
// GET   /api/quick-capture                  → últimas do user
// GET   /api/quick-capture?global=1         → últimas globais (admin)
// =====================================================================

export const config = { runtime: 'edge' };

const ADMIN_USERS = ['luciane@sindicompany.com.br', 'mkt@sindicompany.com.br'];
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB de base64

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
  if (!user) {
    return new Response(JSON.stringify({ ok: false, reason: 'no auth' }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // POST: salvar
  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ ok: false, reason: 'bad json' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    const id = String(body.id || 'cap-' + Date.now()).slice(0, 60);
    const cat = String(body.cat || 'outro').slice(0, 40);
    const text = String(body.text || '').slice(0, 2000);
    const ts = Number(body.ts) || Date.now();
    let photo = String(body.photo || '');
    // Limita tamanho do photo (base64) pra não estourar KV
    if (photo.length > MAX_PHOTO_BYTES) photo = '';
    if (!text) {
      return new Response(JSON.stringify({ ok: false, reason: 'missing text' }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    const item = { id, cat, text, ts, user, photo };
    // Salva entrada individual com TTL 90 dias
    await kvSet(`sindi-qc:${user}:${id}`, item, 86400 * 90);
    // Atualiza índice do user (lista de IDs)
    const idx = (await kvGet(`sindi-qc-list:${user}`)) || [];
    idx.unshift(id);
    await kvSet(`sindi-qc-list:${user}`, idx.slice(0, 100), 86400 * 365);
    // Timeline global (sem fotos pra economizar)
    const gIdx = (await kvGet('sindi-qc-global')) || [];
    gIdx.unshift({ id, user, cat, text: text.slice(0, 200), ts });
    await kvSet('sindi-qc-global', gIdx.slice(0, 200), 86400 * 90);
    return new Response(JSON.stringify({ ok: true, id }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  // GET: listar
  if (request.method === 'GET') {
    const url = new URL(request.url);
    if (url.searchParams.get('global') === '1') {
      if (!ADMIN_USERS.includes(user)) {
        return new Response(JSON.stringify({ error: 'Apenas admin' }), {
          status: 403, headers: { 'Content-Type': 'application/json' },
        });
      }
      const list = (await kvGet('sindi-qc-global')) || [];
      return new Response(JSON.stringify({ ok: true, items: list }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }
    const idx = (await kvGet(`sindi-qc-list:${user}`)) || [];
    const items = [];
    for (const id of idx.slice(0, 20)) {
      const it = await kvGet(`sindi-qc:${user}:${id}`);
      if (it) items.push(it);
    }
    return new Response(JSON.stringify({ ok: true, items }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Método não permitido', { status: 405 });
}
