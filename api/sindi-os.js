// =====================================================================
// SINDICOMPANY OS — Endpoint para memória, perfil, auditoria e quota
// =====================================================================
// GET    /api/sindi-os?action=profile       → perfil do usuário
// POST   /api/sindi-os  { action:'profile', data:{...} } → salvar perfil
// GET    /api/sindi-os?action=memory        → resumos das últimas conversas
// POST   /api/sindi-os  { action:'memory', summary:'...', convId:'...' }
// GET    /api/sindi-os?action=audit&limit=50 → trilha (admin only)
// GET    /api/sindi-os?action=quota         → quota usada hoje
// =====================================================================

export const config = { runtime: 'edge' };

const KV_URL = () => process.env.KV_REST_API_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN;
const ADMIN_USERS = ['hmtzo@icloud.com']; // emails que veem trilha auditoria

async function kv(method, path, body) {
  if (!KV_URL() || !KV_TOKEN()) return null;
  const url = `${KV_URL()}${path}`;
  const opts = {
    method,
    headers: { Authorization: `Bearer ${KV_TOKEN()}` },
  };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'text/plain';
    opts.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  if (!res.ok) return null;
  return res.json();
}

async function kvGet(key) {
  const r = await kv('GET', `/get/${encodeURIComponent(key)}`);
  if (!r || !r.result) return null;
  try { return JSON.parse(r.result); } catch { return r.result; }
}
async function kvSet(key, value) {
  const r = await kv('POST', `/set/${encodeURIComponent(key)}`, value);
  return !!r;
}
async function kvIncr(key) {
  const r = await kv('POST', `/incr/${encodeURIComponent(key)}`);
  return r?.result || 0;
}
async function kvLPush(key, value) {
  const r = await kv('POST', `/lpush/${encodeURIComponent(key)}`, value);
  return !!r;
}
async function kvLRange(key, start, stop) {
  const r = await kv('GET', `/lrange/${encodeURIComponent(key)}/${start}/${stop}`);
  return r?.result || [];
}
async function kvLTrim(key, start, stop) {
  await kv('POST', `/ltrim/${encodeURIComponent(key)}/${start}/${stop}`);
}
async function kvExpire(key, seconds) {
  await kv('POST', `/expire/${encodeURIComponent(key)}/${seconds}`);
}

function getUserFromCookie(request) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/(?:^|;\s*)sf_auth=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = atob(match[1]);
    const idx = decoded.indexOf(':');
    if (idx > 0) return decoded.slice(0, idx).toLowerCase();
  } catch (e) {}
  return null;
}

function todayKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`;
}

// ===== Helpers exportados pra outros endpoints =====
export async function loadOSContext(user) {
  if (!user) return { profile: null, memory: [] };
  const [profile, memoryList] = await Promise.all([
    kvGet(`sindi-profile:${user}`),
    kvLRange(`sindi-memory:${user}`, 0, 4), // últimas 5 conversas
  ]);
  const memory = (memoryList || []).map(s => {
    try { return JSON.parse(s); } catch { return null; }
  }).filter(Boolean);
  return { profile: profile || null, memory };
}

export async function logAudit(user, payload) {
  if (!user) return;
  const entry = JSON.stringify({
    user,
    ts: Date.now(),
    ...payload,
  });
  // Lista global (admin), capped
  await kvLPush('sindi-audit:global', entry);
  await kvLTrim('sindi-audit:global', 0, 999); // últimas 1000
  // Lista por usuário, capped
  await kvLPush(`sindi-audit:${user}`, entry);
  await kvLTrim(`sindi-audit:${user}`, 0, 199); // últimas 200
}

export async function incrementQuota(user) {
  const day = todayKey();
  const globalKey = `sindi-quota:global:${day}`;
  const userKey = `sindi-quota:${user}:${day}`;
  const [global, userCount] = await Promise.all([
    kvIncr(globalKey),
    kvIncr(userKey),
  ]);
  // Expira em 36h pra liberar memória
  await Promise.all([
    kvExpire(globalKey, 36 * 3600),
    kvExpire(userKey, 36 * 3600),
  ]);
  return { global, user: userCount };
}

export async function saveMemorySummary(user, convId, summary) {
  if (!user || !summary) return;
  const entry = JSON.stringify({
    convId: convId || null,
    summary: summary.slice(0, 800), // hard cap
    ts: Date.now(),
  });
  await kvLPush(`sindi-memory:${user}`, entry);
  await kvLTrim(`sindi-memory:${user}`, 0, 9); // últimas 10
}

// ===== HTTP handler =====
export default async function handler(request) {
  const user = getUserFromCookie(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  if (!KV_URL() || !KV_TOKEN()) {
    return new Response(JSON.stringify({ error: 'KV não configurado' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') ||
    (request.method === 'POST' ? null : 'help');

  try {
    if (request.method === 'GET') {
      if (action === 'profile') {
        const profile = await kvGet(`sindi-profile:${user}`);
        return ok({ profile: profile || null });
      }
      if (action === 'memory') {
        const list = await kvLRange(`sindi-memory:${user}`, 0, 9);
        const memory = list.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        return ok({ memory });
      }
      if (action === 'audit') {
        if (!ADMIN_USERS.includes(user)) {
          return ok({ entries: [], note: 'Trilha pessoal (não-admin).' });
        }
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);
        const list = await kvLRange('sindi-audit:global', 0, limit - 1);
        const entries = list.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        return ok({ entries });
      }
      if (action === 'quota') {
        const day = todayKey();
        const [g, u] = await Promise.all([
          kvGet(`sindi-quota:global:${day}`),
          kvGet(`sindi-quota:${user}:${day}`),
        ]);
        return ok({
          global: Number(g) || 0,
          user: Number(u) || 0,
          dailyLimit: 1500, // Gemini free tier
        });
      }
      if (action === 'audit-mine') {
        const list = await kvLRange(`sindi-audit:${user}`, 0, 49);
        const entries = list.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        return ok({ entries });
      }
      return ok({
        ok: true,
        actions: ['profile', 'memory', 'audit', 'audit-mine', 'quota'],
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const a = body.action;
      if (a === 'profile') {
        const data = body.data || {};
        const safe = {
          name: String(data.name || '').slice(0, 80),
          role: String(data.role || '').slice(0, 60),
          condos: String(data.condos || '').slice(0, 200),
          context: String(data.context || '').slice(0, 500),
          updatedAt: Date.now(),
        };
        await kvSet(`sindi-profile:${user}`, safe);
        return ok({ saved: true, profile: safe });
      }
      if (a === 'memory') {
        await saveMemorySummary(user, body.convId, body.summary);
        return ok({ saved: true });
      }
      if (a === 'profile-clear') {
        await kvSet(`sindi-profile:${user}`, null);
        return ok({ cleared: true });
      }
      return new Response(JSON.stringify({ error: 'Ação inválida' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Falha: ' + (e.message || e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}

function ok(data) {
  return new Response(JSON.stringify(data), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
