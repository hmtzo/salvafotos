// =====================================================================
// API TEAM — dados enriquecidos da equipe (lista + presença + perfis)
// =====================================================================
// GET /api/team                       → todos os membros com online status
// GET /api/team?active=1              → só ativos
// =====================================================================

import { TEAM, ADMIN_EMAILS } from './_team.js';

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const ONLINE_WINDOW_MS = 60 * 1000;

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
  if (!user) return new Response(JSON.stringify({ error: 'no auth' }), {
    status: 401, headers: { 'Content-Type': 'application/json' },
  });
  if (request.method !== 'GET') return new Response('Método não permitido', { status: 405 });

  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active') === '1';
  const isAdmin = ADMIN_EMAILS.includes(user);

  // Pega o estado de presença
  const presenceState = (await kvGet('sindi-presence-state')) || [];
  const cutoff = Date.now() - ONLINE_WINDOW_MS;
  const onlineByEmail = new Map();
  for (const p of Array.isArray(presenceState) ? presenceState : []) {
    if (p.ts > cutoff) {
      onlineByEmail.set(p.email.toLowerCase(), p);
    }
  }

  // Monta a lista enriquecida
  const items = await Promise.all(
    TEAM.filter(t => !activeOnly || t.active).map(async (t) => {
      const profile = await kvGet(`sindi-profile:${t.email}`).catch(() => null);
      const presence = onlineByEmail.get(t.email);
      const idleSeconds = presence ? Math.floor((Date.now() - presence.ts) / 1000) : null;
      return {
        email: t.email,
        name: profile?.name || t.name,
        role: profile?.role || t.role,
        area: t.area,
        active: t.active,
        isAdmin: !!t.isAdmin,
        online: !!presence,
        idleSeconds,
        lastSeenTs: presence?.ts || null,
        // Só admin vê ferramenta atual de cada um
        currentTool: isAdmin && presence ? presence.toolName || presence.tool : undefined,
      };
    })
  );

  // Ordena: admin/diretoria primeiro, depois online, depois alfabético
  items.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return new Response(JSON.stringify({
    ok: true,
    team: items,
    count: items.length,
    onlineCount: items.filter(i => i.online).length,
    you: user,
    isAdmin,
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
