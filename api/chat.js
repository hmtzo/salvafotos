// =====================================================================
// API CHAT — chat interno Sindicompany (versão profissional)
// =====================================================================
// Canal #geral + DMs 1:1. Suporta:
//   - reply (replyTo: msgId)
//   - reactions (👍 ❤️ 😂 🎉 🚀 👀)
//   - edit (até 15 min após envio, somente próprias)
//   - delete (somente próprias)
//   - typing indicator (KV com TTL curto)
//   - mentions (@email) — registradas pra notificação
//
// Endpoints (param via query string para GET, JSON pra POST):
//   GET  /api/chat?summary=1                        → presence + unread
//   GET  /api/chat?channel=geral[&since=ts]         → msgs do #geral
//   GET  /api/chat?dm=outroEmail[&since=ts]         → msgs da DM
//   GET  /api/chat?typing=geral|outroEmail          → quem tá digitando
//
//   POST /api/chat  { channel|dm, text, replyTo?, mentions? }
//   POST /api/chat  { edit: msgId, text, channel|dm }
//   POST /api/chat  { delete: msgId, channel|dm }
//   POST /api/chat  { react: msgId, emoji, channel|dm }   (toggle on/off)
//   POST /api/chat  { read: 'geral' | 'outro@' }
//   POST /api/chat  { typing: 'geral' | 'outro@' }
//
// Storage KV:
//   chat-ch-geral                → array das últimas 200 msgs do canal
//   chat-dm:<a|b>                → array das últimas 200 msgs da DM
//   chat-state:<user>            → { readGeral, readDm, mentions[] }
//   chat-typing:geral            → { user: tsExpiry } (TTL ~5s)
//   chat-typing:dm:<a|b>         → idem
// =====================================================================

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const MAX_MESSAGES_PER_BUCKET = 300;
const MAX_TEXT_LENGTH = 4000;
const EDIT_WINDOW_MS = 15 * 60 * 1000;
const VALID_REACTIONS = ['👍', '❤️', '😂', '🎉', '🚀', '👀', '✅', '🤔'];

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
async function kvSet(key, value, ttlSec = null) {
  if (!KV_URL || !KV_TOK) return false;
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  const url = ttlSec ? `${KV_URL}/set/${encodeURIComponent(key)}?EX=${ttlSec}` : `${KV_URL}/set/${encodeURIComponent(key)}`;
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
function typingKey(target, user) {
  const t = target === 'geral' ? 'chat-typing:geral' : `chat-typing:dm:${[user, target].sort().join('|')}`;
  return t;
}

function makeId() {
  return 'm-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}
function isValidEmail(s) {
  return typeof s === 'string' && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s);
}
function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

async function getBucket(channelOrDm, user) {
  if (channelOrDm === 'geral') return { key: 'chat-ch-geral', list: (await kvGet('chat-ch-geral')) || [] };
  if (!isValidEmail(channelOrDm)) return null;
  const k = dmKey(user, channelOrDm);
  return { key: k, list: (await kvGet(k)) || [] };
}

export default async function handler(request) {
  const user = getUser(request);
  if (!user) return jsonResp({ error: 'no auth' }, 401);

  const url = new URL(request.url);

  // ============ GET ============
  if (request.method === 'GET') {
    // Summary: presence + unread
    if (url.searchParams.get('summary') === '1') {
      const state = (await kvGet(`chat-state:${user}`)) || { readGeral: 0, readDm: {}, mentions: [] };
      const presence = (await kvGet('sindi-presence-state')) || [];
      const cutoff = Date.now() - 60 * 1000;
      const onlineEmails = new Set(
        (Array.isArray(presence) ? presence : [])
          .filter(p => p.ts > cutoff)
          .map(p => p.email.toLowerCase())
      );

      const geral = (await kvGet('chat-ch-geral')) || [];
      const unreadGeral = geral.filter(m => m.ts > (state.readGeral || 0) && m.from !== user && !m.deleted).length;
      const lastGeral = [...geral].filter(m => !m.deleted).slice(-1)[0] || null;

      const dmPartners = Object.keys(state.readDm || {});
      const dmUnread = {};
      const dmPreview = {};
      for (const partner of dmPartners) {
        const msgs = (await kvGet(dmKey(user, partner))) || [];
        const last = state.readDm[partner] || 0;
        const n = msgs.filter(m => m.ts > last && m.from !== user && !m.deleted).length;
        if (n > 0) dmUnread[partner] = n;
        const lastMsg = [...msgs].filter(m => !m.deleted).slice(-1)[0] || null;
        if (lastMsg) dmPreview[partner] = { text: lastMsg.text.slice(0, 80), ts: lastMsg.ts, from: lastMsg.from };
      }

      return jsonResp({
        ok: true,
        you: user,
        online: Array.from(onlineEmails),
        unread: { geral: unreadGeral, dm: dmUnread },
        preview: { geral: lastGeral ? { text: lastGeral.text.slice(0, 80), ts: lastGeral.ts, from: lastGeral.from } : null, dm: dmPreview },
        mentions: state.mentions || [],
        now: Date.now(),
      });
    }

    // Typing indicator: quem está digitando agora?
    const typingTarget = url.searchParams.get('typing');
    if (typingTarget) {
      const tk = typingTarget === 'geral' ? 'chat-typing:geral' : `chat-typing:dm:${[user, typingTarget].sort().join('|')}`;
      const state = (await kvGet(tk)) || {};
      const now = Date.now();
      const typingUsers = Object.entries(state).filter(([u, ts]) => u !== user && Number(ts) > now).map(([u]) => u);
      return jsonResp({ ok: true, typing: typingUsers });
    }

    const since = Number(url.searchParams.get('since') || 0);
    const channel = url.searchParams.get('channel');
    const dm = url.searchParams.get('dm');

    if (channel === 'geral') {
      const msgs = (await kvGet('chat-ch-geral')) || [];
      const filtered = since ? msgs.filter(m => m.ts > since || (m.editedTs && m.editedTs > since)) : msgs;
      return jsonResp({ ok: true, messages: filtered, now: Date.now() });
    }

    if (dm) {
      const partner = dm.toLowerCase();
      if (!isValidEmail(partner)) return jsonResp({ error: 'email inválido' }, 400);
      const msgs = (await kvGet(dmKey(user, partner))) || [];
      const filtered = since ? msgs.filter(m => m.ts > since || (m.editedTs && m.editedTs > since)) : msgs;
      return jsonResp({ ok: true, messages: filtered, partner, now: Date.now() });
    }

    return jsonResp({ error: 'precisa de channel, dm, typing ou summary' }, 400);
  }

  // ============ POST ============
  if (request.method !== 'POST') return jsonResp({ error: 'método não permitido' }, 405);

  let body = {};
  try { body = await request.json(); } catch { return jsonResp({ error: 'bad json' }, 400); }

  // Identifica o target (channel ou dm)
  const target = body.channel === 'geral' ? 'geral'
              : body.dm ? String(body.dm).toLowerCase()
              : null;

  // ----- typing -----
  if (body.typing !== undefined) {
    const t = String(body.typing).toLowerCase();
    if (t !== 'geral' && !isValidEmail(t)) return jsonResp({ error: 'target inválido' }, 400);
    const tk = t === 'geral' ? 'chat-typing:geral' : `chat-typing:dm:${[user, t].sort().join('|')}`;
    const state = (await kvGet(tk)) || {};
    const now = Date.now();
    // Limpa expirados
    for (const k of Object.keys(state)) if (Number(state[k]) < now) delete state[k];
    state[user] = now + 5000;
    await kvSet(tk, state, 60); // TTL 60s só pra GC
    return jsonResp({ ok: true });
  }

  // ----- mark read -----
  if (body.read) {
    const tgt = String(body.read).toLowerCase();
    const state = (await kvGet(`chat-state:${user}`)) || { readGeral: 0, readDm: {}, mentions: [] };
    if (tgt === 'geral') state.readGeral = Date.now();
    else if (isValidEmail(tgt)) {
      state.readDm = state.readDm || {};
      state.readDm[tgt] = Date.now();
    }
    // Limpa menções desse target
    state.mentions = (state.mentions || []).filter(m => m.target !== tgt);
    await kvSet(`chat-state:${user}`, state, 86400 * 180);
    return jsonResp({ ok: true });
  }

  // ----- edit -----
  if (body.edit && target) {
    const bucket = await getBucket(target, user);
    if (!bucket) return jsonResp({ error: 'target inválido' }, 400);
    const msg = bucket.list.find(m => m.id === body.edit);
    if (!msg) return jsonResp({ error: 'msg não existe' }, 404);
    if (msg.from !== user) return jsonResp({ error: 'só dá pra editar mensagem própria' }, 403);
    if (Date.now() - msg.ts > EDIT_WINDOW_MS) return jsonResp({ error: 'janela de edição expirou (15 min)' }, 403);
    const newText = String(body.text || '').trim().slice(0, MAX_TEXT_LENGTH);
    if (!newText) return jsonResp({ error: 'texto vazio' }, 400);
    msg.text = newText;
    msg.editedTs = Date.now();
    await kvSet(bucket.key, bucket.list, 86400 * 365);
    return jsonResp({ ok: true, message: msg });
  }

  // ----- delete -----
  if (body.delete && target) {
    const bucket = await getBucket(target, user);
    if (!bucket) return jsonResp({ error: 'target inválido' }, 400);
    const msg = bucket.list.find(m => m.id === body.delete);
    if (!msg) return jsonResp({ error: 'msg não existe' }, 404);
    if (msg.from !== user) return jsonResp({ error: 'só dá pra apagar mensagem própria' }, 403);
    msg.deleted = true;
    msg.text = '';
    msg.editedTs = Date.now();
    msg.reactions = {};
    await kvSet(bucket.key, bucket.list, 86400 * 365);
    return jsonResp({ ok: true, message: msg });
  }

  // ----- react (toggle) -----
  if (body.react && target) {
    const emoji = String(body.emoji || '').trim();
    if (!VALID_REACTIONS.includes(emoji)) return jsonResp({ error: 'emoji inválido' }, 400);
    const bucket = await getBucket(target, user);
    if (!bucket) return jsonResp({ error: 'target inválido' }, 400);
    const msg = bucket.list.find(m => m.id === body.react);
    if (!msg) return jsonResp({ error: 'msg não existe' }, 404);
    msg.reactions = msg.reactions || {};
    msg.reactions[emoji] = msg.reactions[emoji] || [];
    const idx = msg.reactions[emoji].indexOf(user);
    if (idx >= 0) msg.reactions[emoji].splice(idx, 1);
    else msg.reactions[emoji].push(user);
    // Limpa emoji vazio
    if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    msg.editedTs = Date.now();
    await kvSet(bucket.key, bucket.list, 86400 * 365);
    return jsonResp({ ok: true, message: msg });
  }

  // ----- new message -----
  const text = String(body.text || '').trim().slice(0, MAX_TEXT_LENGTH);
  if (!text || !target) return jsonResp({ error: 'precisa de text + (channel|dm)' }, 400);

  if (target !== 'geral' && !isValidEmail(target)) return jsonResp({ error: 'destinatário inválido' }, 400);
  if (target !== 'geral' && target === user) return jsonResp({ error: 'não dá pra mandar pra você mesmo' }, 400);

  const mentions = Array.isArray(body.mentions)
    ? body.mentions.filter(isValidEmail).map(s => s.toLowerCase()).slice(0, 20)
    : [];

  const msg = {
    id: makeId(),
    ts: Date.now(),
    from: user,
    text,
    replyTo: body.replyTo && typeof body.replyTo === 'string' ? body.replyTo : null,
    mentions: mentions.length ? mentions : undefined,
  };
  if (target !== 'geral') msg.to = target;

  const bucket = await getBucket(target, user);
  bucket.list.push(msg);
  const trimmed = bucket.list.slice(-MAX_MESSAGES_PER_BUCKET);
  await kvSet(bucket.key, trimmed, 86400 * 365);

  // Atualiza estado de DM partners pra os dois lados (sem afetar lastRead)
  if (target !== 'geral') {
    for (const u of [user, target]) {
      const s = (await kvGet(`chat-state:${u}`)) || { readGeral: 0, readDm: {}, mentions: [] };
      s.readDm = s.readDm || {};
      const partnerOf = u === user ? target : user;
      if (s.readDm[partnerOf] == null) s.readDm[partnerOf] = 0;
      await kvSet(`chat-state:${u}`, s, 86400 * 180);
    }
  }

  // Marca menções para os usuários mencionados
  for (const mentioned of mentions) {
    if (mentioned === user) continue;
    const s = (await kvGet(`chat-state:${mentioned}`)) || { readGeral: 0, readDm: {}, mentions: [] };
    s.mentions = s.mentions || [];
    s.mentions.push({ msgId: msg.id, target, by: user, ts: msg.ts });
    s.mentions = s.mentions.slice(-50);
    await kvSet(`chat-state:${mentioned}`, s, 86400 * 180);
  }

  // Limpa typing do user no target
  const tk = target === 'geral' ? 'chat-typing:geral' : `chat-typing:dm:${[user, target].sort().join('|')}`;
  const tstate = (await kvGet(tk)) || {};
  delete tstate[user];
  await kvSet(tk, tstate, 60);

  return jsonResp({ ok: true, message: msg });
}
