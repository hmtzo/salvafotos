// =====================================================================
// API CHAT — chat interno Sindicompany
// =====================================================================
// Canal único #geral + DMs 1:1 entre usuários da equipe.
//
//   GET  /api/chat?channel=geral[&since=ts]    → mensagens do #geral
//   GET  /api/chat?dm=outroEmail[&since=ts]    → mensagens da DM com esse user
//   GET  /api/chat?summary=1                   → { online[], unread{} }
//   POST /api/chat  { channel: 'geral', text } → envia no #geral
//   POST /api/chat  { dm: 'outro@', text }     → envia DM
//   POST /api/chat  { read: 'geral' | 'outro@' } → marca como lido
//
// Storage KV (Upstash Redis):
//   chat-ch-geral        → array das últimas 200 msgs do canal
//   chat-dm:<a|b>        → array das últimas 200 msgs da DM (par ordenado)
//   chat-state:<user>    → { readGeral: ts, readDm: { 'outro@': ts } }
// =====================================================================

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const MAX_MESSAGES_PER_BUCKET = 200;
const MAX_TEXT_LENGTH = 2000;

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

function dmKey(a, b) {
  const pair = [a.toLowerCase(), b.toLowerCase()].sort();
  return `chat-dm:${pair.join('|')}`;
}

function makeId() {
  return 'm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

function isValidEmail(s) {
  return typeof s === 'string' && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s);
}

export default async function handler(request) {
  const user = getUser(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'no auth' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);

  // ---------- GET ----------
  if (request.method === 'GET') {
    // Summary: presence + unread counts
    if (url.searchParams.get('summary') === '1') {
      const state = (await kvGet(`chat-state:${user}`)) || { readGeral: 0, readDm: {} };
      const presence = (await kvGet('sindi-presence-state')) || [];
      const cutoff = Date.now() - 60 * 1000;
      const onlineEmails = new Set(
        (Array.isArray(presence) ? presence : [])
          .filter(p => p.ts > cutoff)
          .map(p => p.email.toLowerCase())
      );

      // Unread no #geral: contar msgs > state.readGeral
      const geral = (await kvGet('chat-ch-geral')) || [];
      const unreadGeral = geral.filter(m => m.ts > (state.readGeral || 0) && m.from !== user).length;

      // Unread DMs: olhar últimas mensagens por par
      const dmUnread = {};
      const recentDmPartners = Object.keys(state.readDm || {});
      for (const partner of recentDmPartners) {
        const msgs = (await kvGet(dmKey(user, partner))) || [];
        const last = state.readDm[partner] || 0;
        const n = msgs.filter(m => m.ts > last && m.from !== user).length;
        if (n > 0) dmUnread[partner] = n;
      }

      return new Response(JSON.stringify({
        ok: true,
        you: user,
        online: Array.from(onlineEmails),
        unread: { geral: unreadGeral, dm: dmUnread },
        now: Date.now(),
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const since = Number(url.searchParams.get('since') || 0);
    const channel = url.searchParams.get('channel');
    const dm = url.searchParams.get('dm');

    if (channel === 'geral') {
      const msgs = (await kvGet('chat-ch-geral')) || [];
      const filtered = since ? msgs.filter(m => m.ts > since) : msgs;
      return new Response(JSON.stringify({ ok: true, messages: filtered, now: Date.now() }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (dm) {
      const partner = dm.toLowerCase();
      if (!isValidEmail(partner)) {
        return new Response(JSON.stringify({ error: 'email inválido' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      const msgs = (await kvGet(dmKey(user, partner))) || [];
      const filtered = since ? msgs.filter(m => m.ts > since) : msgs;
      return new Response(JSON.stringify({ ok: true, messages: filtered, partner, now: Date.now() }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'precisa de channel, dm ou summary' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---------- POST ----------
  if (request.method === 'POST') {
    let body = {};
    try { body = await request.json(); } catch {
      return new Response(JSON.stringify({ error: 'bad json' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark as read
    if (body.read) {
      const target = String(body.read).toLowerCase();
      const state = (await kvGet(`chat-state:${user}`)) || { readGeral: 0, readDm: {} };
      if (target === 'geral') {
        state.readGeral = Date.now();
      } else if (isValidEmail(target)) {
        state.readDm = state.readDm || {};
        state.readDm[target] = Date.now();
      }
      await kvSet(`chat-state:${user}`, state, 86400 * 90);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    const text = String(body.text || '').trim().slice(0, MAX_TEXT_LENGTH);
    if (!text) {
      return new Response(JSON.stringify({ error: 'texto vazio' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const msg = { id: makeId(), ts: Date.now(), from: user, text };

    if (body.channel === 'geral') {
      const existing = (await kvGet('chat-ch-geral')) || [];
      existing.push(msg);
      const trimmed = existing.slice(-MAX_MESSAGES_PER_BUCKET);
      await kvSet('chat-ch-geral', trimmed, 86400 * 365);
      return new Response(JSON.stringify({ ok: true, message: msg }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (body.dm) {
      const partner = String(body.dm).toLowerCase();
      if (!isValidEmail(partner)) {
        return new Response(JSON.stringify({ error: 'destinatário inválido' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      if (partner === user) {
        return new Response(JSON.stringify({ error: 'não pode mandar DM pra você mesmo' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      msg.to = partner;
      const key = dmKey(user, partner);
      const existing = (await kvGet(key)) || [];
      existing.push(msg);
      const trimmed = existing.slice(-MAX_MESSAGES_PER_BUCKET);
      await kvSet(key, trimmed, 86400 * 365);

      // Atualiza o índice de DMs conhecidas pra cada lado (pra summary)
      for (const u of [user, partner]) {
        const s = (await kvGet(`chat-state:${u}`)) || { readGeral: 0, readDm: {} };
        s.readDm = s.readDm || {};
        if (!(u === user ? partner : user in s.readDm)) {
          s.readDm[u === user ? partner : user] = s.readDm[u === user ? partner : user] || 0;
        }
        await kvSet(`chat-state:${u}`, s, 86400 * 90);
      }

      return new Response(JSON.stringify({ ok: true, message: msg }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'precisa de channel ou dm' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response('Método não permitido', { status: 405 });
}
