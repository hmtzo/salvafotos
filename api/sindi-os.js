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
// Admins: veem painel /admin.html, trilha de auditoria global e gerenciam KB
const ADMIN_USERS = [
  'hmtzo@icloud.com',
  'juliana@sindicompany.com.br',   // CEO
  'raquel@sindicompany.com.br',    // Head de Cultura e Pessoas
  'luciane@sindicompany.com.br',   // Agilista
  'mkt@sindicompany.com.br',
];
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
  if (!user) return { profile: null, memory: [], insights: [], activeCondo: null };
  const [profile, memoryList, insights, activeCondoObj] = await Promise.all([
    kvGet(`sindi-profile:${user}`),
    kvLRange(`sindi-memory:${user}`, 0, 4),
    loadSharedInsights(80),
    kvGet(`sindi-active-condo:${user}`),
  ]);
  const memory = (memoryList || []).map(s => {
    try { return JSON.parse(s); } catch { return null; }
  }).filter(Boolean);
  return {
    profile: profile || null,
    memory,
    insights: insights || [],
    activeCondo: activeCondoObj?.condo || null,
  };
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

// =====================================================================
// INSIGHTS COMPARTILHADOS — cérebro coletivo da Sindicompany
// =====================================================================
// Cada insight é um Q→A destilado que pode ser reutilizado por outros
// usuários. Salvos em sindi-insights:global (lista capped 500).

// Sanitiza dados sensíveis antes de salvar (LGPD)
function sanitizeForSharing(text) {
  if (!text) return '';
  return String(text)
    // CPF
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[CPF]')
    // CNPJ
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, '[CNPJ]')
    // RG (formato brasileiro)
    .replace(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dXx]\b/g, '[RG]')
    // Email
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email]')
    // Telefones brasileiros
    .replace(/\(?(\d{2})\)?\s?9?\d{4}[-.\s]?\d{4}/g, '[telefone]')
    // Nomes de moradores referenciados (heurística simples: "Sr./Sra. NOME")
    .replace(/\b(Sr\.?|Sra\.?|Dr\.?|Dra\.?)\s+[A-ZÀ-Ý][a-zà-ý]+(\s+[A-ZÀ-Ý][a-zà-ý]+)?/g, '[pessoa]');
}

// =====================================================================
// NOTIFICAÇÕES — sistema in-app
// =====================================================================
export async function pushNotification(user, notif) {
  if (!user || !notif) return;
  const entry = JSON.stringify({
    id: 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 5),
    ts: Date.now(),
    read: false,
    ...notif,
  });
  await kvLPush(`sindi-notif:${user}`, entry);
  await kvLTrim(`sindi-notif:${user}`, 0, 49); // últimas 50
}
export async function broadcastNotification(notif, exceptUser = null) {
  for (const u of ALL_USERS) {
    if (exceptUser && u === exceptUser) continue;
    await pushNotification(u, notif);
  }
}

// =====================================================================
// ATTACHMENT LIBRARY — biblioteca de docs do usuário
// =====================================================================
export async function saveAttachment(user, attachment) {
  if (!user || !attachment) return null;
  const id = 'att-' + Date.now().toString(36);
  const list = (await kvGet(`sindi-attachments:${user}`)) || [];
  const safe = {
    id,
    name: String(attachment.name || 'documento').slice(0, 200),
    text: String(attachment.text || '').slice(0, 30000),
    size: Number(attachment.size) || 0,
    ts: Date.now(),
  };
  list.unshift(safe);
  await kvSet(`sindi-attachments:${user}`, list.slice(0, 30)); // até 30 docs
  return safe;
}

export async function saveInsight(insight) {
  if (!insight || !insight.summary) return null;
  const id = 'ins-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const safe = {
    id,
    title: sanitizeForSharing(insight.title || insight.question || '').slice(0, 200),
    question: sanitizeForSharing(insight.question || '').slice(0, 300),
    content: sanitizeForSharing(insight.summary).slice(0, 1500),
    summary: sanitizeForSharing(insight.summary).slice(0, 1500), // alias compat com retriever
    tags: Array.isArray(insight.tags)
      ? insight.tags.slice(0, 8).map(t => String(t).toLowerCase().slice(0, 40))
      : [],
    category: insight.category || 'outros',
    contributedBy: insight.contributedBy || null,
    confidence: typeof insight.confidence === 'number' ? insight.confidence : null,
    votes: 0,
    ts: Date.now(),
  };
  await kvLPush('sindi-insights:global', JSON.stringify(safe));
  await kvLTrim('sindi-insights:global', 0, 499); // até 500 insights
  return safe;
}

export async function loadSharedInsights(limit = 80) {
  const list = await kvLRange('sindi-insights:global', 0, limit - 1);
  return (list || []).map(s => {
    try { return JSON.parse(s); } catch { return null; }
  }).filter(Boolean);
}

// Extrai insight reutilizável de uma troca usando Gemini (background, não bloqueia user)
export async function extractInsightAsync({ question, answer, user, confidence, mode }) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;

  // Heurísticas: só extrai se vale a pena
  if (!question || !answer) return null;
  if (question.length < 20) return null; // pergunta muito curta = não vale
  if (answer.length < 100) return null; // resposta trivial
  if (confidence != null && confidence < 60) return null; // baixa confiança = não destila
  if (/\[Documento anexado/i.test(question)) return null; // docs anexados podem ter dados sensíveis

  try {
    const prompt = `Você é um destilador de conhecimento operacional para a Sindicompany (administração condominial).

A partir da pergunta e resposta abaixo, extraia uma INSIGHT REUTILIZÁVEL que possa ajudar outros colegas no futuro.

Retorne APENAS um JSON válido (sem markdown, sem comentários) no formato:
{
  "title": "título curto canônico (max 80 chars)",
  "question": "pergunta canônica reformulada genericamente (max 200 chars, sem nomes/dados pessoais)",
  "summary": "destilação dos pontos-chave da resposta (max 800 chars, em markdown leve, focado em direção/regra/procedimento)",
  "tags": ["até 6 tags em lowercase"],
  "category": "juridico" | "engenharia" | "financeiro" | "operacional" | "governanca" | "rh" | "atendimento" | "outros",
  "shouldStore": true se a insight é genuinamente reutilizável; false se foi muito específica/pessoal/contextual
}

PERGUNTA:
"""
${question.slice(0, 1500)}
"""

RESPOSTA:
"""
${answer.slice(0, 3000)}
"""`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800, responseMimeType: 'application/json' },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    if (!text) return null;
    const parsed = JSON.parse(text);
    if (!parsed.shouldStore) return null;

    const insight = {
      title: parsed.title,
      question: parsed.question,
      summary: parsed.summary,
      tags: parsed.tags,
      category: parsed.category,
      contributedBy: user || null,
      confidence,
    };

    // Categorias críticas (juridico, governanca) vão pra fila de aprovação
    const criticalCategories = ['juridico', 'governanca', 'rh'];
    if (criticalCategories.includes(parsed.category)) {
      const pending = await savePendingInsight(insight);
      // Notifica admins
      if (pending) {
        const adminNotif = {
          type: 'pending-insight',
          title: 'Nova insight aguardando aprovação',
          body: `Categoria ${parsed.category}: "${pending.title}"`,
          link: '/admin.html#insights',
        };
        for (const a of ADMIN_USERS) await pushNotification(a, adminNotif);
      }
      return pending;
    }
    // Não-críticas vão direto pro pool global
    return await saveInsight(insight);
  } catch (e) {
    console.warn('insight extraction failed', e);
    return null;
  }
}

// Fila de aprovação pra insights críticas
export async function savePendingInsight(insight) {
  if (!insight || !insight.summary) return null;
  const id = 'pin-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const safe = {
    id,
    title: sanitizeForSharing(insight.title || insight.question || '').slice(0, 200),
    question: sanitizeForSharing(insight.question || '').slice(0, 300),
    content: sanitizeForSharing(insight.summary).slice(0, 1500),
    summary: sanitizeForSharing(insight.summary).slice(0, 1500),
    tags: Array.isArray(insight.tags) ? insight.tags.slice(0, 8).map(t => String(t).toLowerCase().slice(0, 40)) : [],
    category: insight.category || 'outros',
    contributedBy: insight.contributedBy || null,
    confidence: typeof insight.confidence === 'number' ? insight.confidence : null,
    ts: Date.now(),
    status: 'pending',
  };
  await kvLPush('sindi-insights:pending', JSON.stringify(safe));
  await kvLTrim('sindi-insights:pending', 0, 99);
  return safe;
}
export async function loadPendingInsights() {
  const list = await kvLRange('sindi-insights:pending', 0, 99);
  return (list || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
}
export async function approvePendingInsight(id) {
  const list = await loadPendingInsights();
  const insight = list.find(i => i.id === id);
  if (!insight) return null;
  // Remove de pending, salva no pool global
  const filtered = list.filter(i => i.id !== id);
  await kv('POST', `/del/${encodeURIComponent('sindi-insights:pending')}`);
  for (let i = filtered.length - 1; i >= 0; i--) {
    await kvLPush('sindi-insights:pending', JSON.stringify(filtered[i]));
  }
  return await saveInsight(insight);
}
export async function rejectPendingInsight(id) {
  const list = await loadPendingInsights();
  const filtered = list.filter(i => i.id !== id);
  await kv('POST', `/del/${encodeURIComponent('sindi-insights:pending')}`);
  for (let i = filtered.length - 1; i >= 0; i--) {
    await kvLPush('sindi-insights:pending', JSON.stringify(filtered[i]));
  }
  return true;
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
      if (action === 'insights-list') {
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
        const cat = url.searchParams.get('category') || null;
        let list = await loadSharedInsights(limit);
        if (cat) list = list.filter(i => i.category === cat);
        return ok({ insights: list, count: list.length });
      }
      if (action === 'insights-pending') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const list = await loadPendingInsights();
        return ok({ insights: list, count: list.length });
      }
      if (action === 'notifications') {
        const list = await kvLRange(`sindi-notif:${user}`, 0, 49);
        const items = (list || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
        return ok({ notifications: items, unread: items.filter(n => !n.read).length });
      }
      if (action === 'attachments') {
        const list = (await kvGet(`sindi-attachments:${user}`)) || [];
        // Não retorna o texto completo na lista (só metadados)
        const meta = list.map(a => ({ id: a.id, name: a.name, size: a.size, ts: a.ts }));
        return ok({ attachments: meta });
      }
      if (action === 'attachment-get') {
        const id = url.searchParams.get('id');
        const list = (await kvGet(`sindi-attachments:${user}`)) || [];
        const att = list.find(a => a.id === id);
        if (!att) return new Response(JSON.stringify({ error: 'não encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        return ok({ attachment: att });
      }
      if (action === 'analytics') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const [insights, audit, fbUp, fbDown] = await Promise.all([
          loadSharedInsights(500),
          kvLRange('sindi-audit:global', 0, 999),
          kvGet('sindi-feedback:up'),
          kvGet('sindi-feedback:down'),
        ]);
        const auditEntries = (audit || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);

        // Top insights por votos
        const topInsights = [...insights].sort((a, b) => (b.votes || 0) - (a.votes || 0)).slice(0, 10);

        // Categorias mais frequentes nas insights
        const catCount = {};
        for (const i of insights) {
          catCount[i.category || 'outros'] = (catCount[i.category || 'outros'] || 0) + 1;
        }
        const categoryDist = Object.entries(catCount).map(([k, v]) => ({ category: k, count: v })).sort((a, b) => b.count - a.count);

        // Confiança média
        const confs = auditEntries.filter(e => e.confidence != null).map(e => e.confidence);
        const avgConf = confs.length ? Math.round(confs.reduce((a, b) => a + b) / confs.length) : null;

        // Distribuição de modos
        const modeCount = {};
        for (const e of auditEntries) {
          const m = e.mode || 'normal';
          modeCount[m] = (modeCount[m] || 0) + 1;
        }
        const modeDist = Object.entries(modeCount).map(([k, v]) => ({ mode: k, count: v }));

        // Top usuários por atividade
        const userCount = {};
        for (const e of auditEntries) {
          if (e.user) userCount[e.user] = (userCount[e.user] || 0) + 1;
        }
        const topUsers = Object.entries(userCount).map(([k, v]) => ({ user: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 10);

        return ok({
          totalInsights: insights.length,
          topInsights,
          categoryDist,
          modeDist,
          avgConfidence: avgConf,
          topUsers,
          feedback: {
            up: Number(fbUp) || 0,
            down: Number(fbDown) || 0,
            total: (Number(fbUp) || 0) + (Number(fbDown) || 0),
          },
          totalAuditEntries: auditEntries.length,
        });
      }
      if (action === 'export-mine') {
        // Exporta tudo do usuário (chats, profile, memories, attachments)
        const [chats, profile, mem, atts] = await Promise.all([
          kvGet(`sindi-chats:${user}`),
          kvGet(`sindi-profile:${user}`),
          kvLRange(`sindi-memory:${user}`, 0, 49),
          kvGet(`sindi-attachments:${user}`),
        ]);
        return ok({
          user,
          exportedAt: Date.now(),
          chats: chats || { conversations: [] },
          profile: profile || null,
          memories: (mem || []).map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean),
          attachments: atts || [],
        });
      }
      return ok({
        ok: true,
        actions: ['profile', 'memory', 'audit', 'audit-mine', 'quota', 'me-stats', 'admin-overview', 'admin-audit', 'kb-list', 'insights-list', 'insights-pending', 'notifications', 'attachments', 'analytics', 'export-mine'],
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
      if (a === 'insight-vote') {
        const id = String(body.id || '');
        const direction = body.direction === 'up' ? 1 : body.direction === 'down' ? -1 : 0;
        if (!id || !direction) {
          return new Response(JSON.stringify({ error: 'id e direction obrigatórios' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        // Pega lista, atualiza, regrava
        const list = await loadSharedInsights(500);
        const updated = list.map(i => i.id === id ? { ...i, votes: (i.votes || 0) + direction } : i);
        // Regrava lista (DEL + LPUSH em ordem)
        await kv('POST', `/del/${encodeURIComponent('sindi-insights:global')}`);
        for (let i = updated.length - 1; i >= 0; i--) {
          await kvLPush('sindi-insights:global', JSON.stringify(updated[i]));
        }
        // Registra quem votou pra evitar repeat (TTL 30 dias)
        await kvSet(`sindi-insight-vote:${user}:${id}`, { ts: Date.now(), direction });
        await kvExpire(`sindi-insight-vote:${user}:${id}`, 30 * 86400);
        return ok({ voted: true });
      }
      if (a === 'insight-delete') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const id = String(body.id || '');
        const list = await loadSharedInsights(500);
        const filtered = list.filter(i => i.id !== id);
        await kv('POST', `/del/${encodeURIComponent('sindi-insights:global')}`);
        for (let i = filtered.length - 1; i >= 0; i--) {
          await kvLPush('sindi-insights:global', JSON.stringify(filtered[i]));
        }
        return ok({ deleted: true, count: filtered.length });
      }
      if (a === 'insight-promote') {
        // Promove insight pra KB customizada (só admin)
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const id = String(body.id || '');
        const list = await loadSharedInsights(500);
        const insight = list.find(i => i.id === id);
        if (!insight) {
          return new Response(JSON.stringify({ error: 'insight não encontrado' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        const kbList = (await kvGet('sindi-kb:custom')) || [];
        const newPiece = {
          id: 'kb-promoted-' + Date.now().toString(36),
          tags: insight.tags || [],
          title: insight.title || insight.question || 'Insight promovida',
          content: insight.summary || insight.content || '',
          createdAt: Date.now(),
          createdBy: user,
          promotedFrom: insight.id,
        };
        kbList.unshift(newPiece);
        await kvSet('sindi-kb:custom', kbList.slice(0, 100));
        return ok({ promoted: newPiece });
      }
      if (a === 'notif-read') {
        const id = body.id;
        const list = await kvLRange(`sindi-notif:${user}`, 0, 49);
        const updated = (list || []).map(s => {
          try {
            const n = JSON.parse(s);
            if (id === '*' || n.id === id) n.read = true;
            return JSON.stringify(n);
          } catch { return s; }
        });
        await kv('POST', `/del/${encodeURIComponent('sindi-notif:' + user)}`);
        for (let i = updated.length - 1; i >= 0; i--) {
          await kvLPush(`sindi-notif:${user}`, updated[i]);
        }
        return ok({ marked: true });
      }
      if (a === 'attachment-save') {
        const att = await saveAttachment(user, body.attachment || {});
        return ok({ attachment: att });
      }
      if (a === 'attachment-delete') {
        const id = body.id;
        const list = (await kvGet(`sindi-attachments:${user}`)) || [];
        const filtered = list.filter(att => att.id !== id);
        await kvSet(`sindi-attachments:${user}`, filtered);
        return ok({ deleted: true });
      }
      if (a === 'pending-approve') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        const result = await approvePendingInsight(body.id);
        return ok({ approved: !!result, insight: result });
      }
      if (a === 'pending-reject') {
        if (!ADMIN_USERS.includes(user)) return forbidden();
        await rejectPendingInsight(body.id);
        return ok({ rejected: true });
      }
      if (a === 'set-active-condo') {
        // Salva qual condomínio o user está trabalhando agora
        const condo = String(body.condo || '').slice(0, 100);
        await kvSet(`sindi-active-condo:${user}`, { condo, ts: Date.now() });
        return ok({ saved: true, condo });
      }
      if (a === 'feedback') {
        // Feedback de uma resposta específica (👍/👎). Salva na auditoria.
        const direction = body.direction === 'up' ? 'up' : body.direction === 'down' ? 'down' : null;
        if (!direction) {
          return new Response(JSON.stringify({ error: 'direction obrigatório' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        await logAudit(user, {
          type: 'feedback',
          direction,
          q: String(body.question || '').slice(0, 200),
          replyHash: String(body.replyHash || '').slice(0, 32),
        });
        // Incrementa contador global
        await kvIncr(`sindi-feedback:${direction}`);
        return ok({ saved: true });
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
