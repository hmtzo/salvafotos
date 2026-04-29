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
const ALL_USERS = [
  'luciane@sindicompany.com.br',
  'juliana@sindicompany.com.br',
  'raquel@sindicompany.com.br',
  'mkt@sindicompany.com.br',
  'junior@sindicompany.com.br',
  'felipe.fernandes@sindicompany.com.br',
  'comercial@sindicompany.com.br',
  'orcamentos@sindicompany.com.br',
  'hmtzo@icloud.com',
];

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
      if (action === 'me-stats') {
        const day = todayKey();
        const [todayN, profile, memList, mineAudit, chats] = await Promise.all([
          kvGet(`sindi-quota:${user}:${day}`),
          kvGet(`sindi-profile:${user}`),
          kvLRange(`sindi-memory:${user}`, 0, 9),
          kvLRange(`sindi-audit:${user}`, 0, 199),
          kvGet(`sindi-chats:${user}`),
        ]);
        return ok({
          user,
          isAdmin: ADMIN_USERS.includes(user),
          today: Number(todayN) || 0,
          totalQueries: (mineAudit || []).length,
          profile: profile || null,
          memoriesCount: (memList || []).length,
          conversationsCount: chats?.conversations?.length || 0,
        });
      }
      if (action === 'admin-overview') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const day = todayKey();
        // 7 dias agregados
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - i);
          dates.push(`${d.getUTCFullYear()}${String(d.getUTCMonth()+1).padStart(2,'0')}${String(d.getUTCDate()).padStart(2,'0')}`);
        }
        const dailyCounts = await Promise.all(dates.map(d => kvGet(`sindi-quota:global:${d}`)));
        const week7d = dailyCounts.reduce((a, n) => a + (Number(n) || 0), 0);

        // Por usuário (perfil + último audit)
        const userStats = await Promise.all(ALL_USERS.map(async u => {
          const [profile, audit, todayN] = await Promise.all([
            kvGet(`sindi-profile:${u}`),
            kvLRange(`sindi-audit:${u}`, 0, 0),
            kvGet(`sindi-quota:${u}:${day}`),
          ]);
          let lastSeen = null;
          if (audit && audit.length) {
            try { lastSeen = JSON.parse(audit[0]).ts; } catch {}
          }
          return {
            email: u,
            hasProfile: !!profile,
            name: profile?.name || null,
            role: profile?.role || null,
            lastSeen,
            todayCount: Number(todayN) || 0,
          };
        }));

        const profilesCount = userStats.filter(u => u.hasProfile).length;
        const activeUsers24h = userStats.filter(u => u.lastSeen && (Date.now() - u.lastSeen < 86400000)).length;

        return ok({
          today: Number(await kvGet(`sindi-quota:global:${day}`)) || 0,
          week7d,
          dailyCounts: dates.map((d, i) => ({ date: d, count: Number(dailyCounts[i]) || 0 })).reverse(),
          dailyLimit: 1500,
          users: userStats,
          profilesCount,
          activeUsers24h,
          totalUsers: ALL_USERS.length,
        });
      }
      if (action === 'admin-audit') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 500);
        const list = await kvLRange('sindi-audit:global', 0, limit - 1);
        const entries = list.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        return ok({ entries });
      }
      if (action === 'kb-list') {
        const custom = await kvGet('sindi-kb:custom') || [];
        return ok({ custom });
      }
      return ok({
        ok: true,
        actions: ['profile', 'memory', 'audit', 'audit-mine', 'quota', 'me-stats', 'admin-overview', 'admin-audit', 'kb-list'],
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
      if (a === 'memory-clear') {
        await kv('POST', `/del/${encodeURIComponent('sindi-memory:' + user)}`);
        return ok({ cleared: true });
      }
      if (a === 'kb-add') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const piece = body.piece || {};
        if (!piece.title || !piece.content) {
          return new Response(JSON.stringify({ error: 'piece.title e piece.content obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const list = (await kvGet('sindi-kb:custom')) || [];
        const newPiece = {
          id: 'kb-custom-' + Date.now().toString(36),
          tags: Array.isArray(piece.tags) ? piece.tags : String(piece.tags || '').split(',').map(t => t.trim()).filter(Boolean),
          title: String(piece.title).slice(0, 200),
          content: String(piece.content).slice(0, 4000),
          createdAt: Date.now(),
          createdBy: user,
        };
        list.unshift(newPiece);
        await kvSet('sindi-kb:custom', list.slice(0, 100));
        return ok({ added: newPiece });
      }
      if (a === 'kb-delete') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const id = body.id;
        const list = (await kvGet('sindi-kb:custom')) || [];
        const filtered = list.filter(p => p.id !== id);
        await kvSet('sindi-kb:custom', filtered);
        return ok({ deleted: true, count: filtered.length });
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
function forbidden() {
  return new Response(JSON.stringify({ error: 'Acesso restrito a admin' }), {
    status: 403, headers: { 'Content-Type': 'application/json' },
  });
}
