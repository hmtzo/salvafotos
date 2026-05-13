// =====================================================================
// API EMAIL-MORNING — bom dia + frase motivacional via email (cron 9h)
// =====================================================================
// Envia toda manhã (9h BRT seg-sex) um email curto motivacional pra
// todos os funcionários. Roda em PARALELO com o WhatsApp cron pro
// mesmo horário — funcionário recebe nos 2 canais.
//
// Frase gerada pela Sindi (Gemini) com cache de 30 últimas pra não
// repetir. Dedup por dia: não envia 2x mesmo se cron disparar 2x.
// =====================================================================

import { sendEmail, emailLayout, emailConfigured, TEAM_EMAILS, nameFromEmail, escapeHtml } from './_email.js';
import { ADMIN_EMAILS } from './_team.js';

export const config = { runtime: 'edge' };

function getUserFromCookie(req) {
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

function todayKey() {
  const offset = -3 * 60; // BRT
  const local = new Date(Date.now() + (new Date().getTimezoneOffset() + offset) * 60000);
  return local.toISOString().slice(0, 10);
}

// Pool de fallback (usado SÓ se Gemini falhar) — 12 frases pra rotacionar
// por dia do ano (índice = dia juliano % 12). Garante variação mesmo offline.
const FALLBACK_QUOTES = [
  { text: 'Cada dia é uma página nova — escreve bonito.', author: null },
  { text: 'O sucesso é a soma de pequenos esforços repetidos dia após dia.', author: 'Robert Collier' },
  { text: 'Comece o dia com gratidão e termine com orgulho do que construiu.', author: null },
  { text: 'Não espere por oportunidades — crie elas.', author: 'George Bernard Shaw' },
  { text: 'Disciplina é a ponte entre objetivos e conquistas.', author: 'Jim Rohn' },
  { text: 'A jornada de mil milhas começa com um único passo.', author: 'Lao Tsé' },
  { text: 'Faça hoje o que os outros não querem, viva amanhã o que os outros não podem.', author: 'Jerry Rice' },
  { text: 'Pequenas ações consistentes geram grandes transformações.', author: null },
  { text: 'O melhor momento pra plantar uma árvore foi há 20 anos. O segundo melhor é hoje.', author: 'Provérbio chinês' },
  { text: 'Você não precisa ser perfeito — só precisa começar.', author: null },
  { text: 'Quem busca, encontra. Quem persiste, conquista.', author: null },
  { text: 'A diferença entre o impossível e o possível está na sua determinação.', author: 'Tommy Lasorda' },
];

function pickFallbackByDate() {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d - start;
  const dayOfYear = Math.floor(diff / 86400000);
  return FALLBACK_QUOTES[dayOfYear % FALLBACK_QUOTES.length];
}

// Gera UMA frase motivacional do dia. Por padrão usa cache (todos do dia
// recebem a mesma — pra dar consistência de "frase do dia" pra equipe).
// Se `fresh=true`, IGNORA cache e gera nova (pra teste/preview).
async function generateDailyQuote(fresh = false) {
  const cacheKey = `sindi-email-morning-quote:${todayKey()}`;
  if (!fresh) {
    const cached = await kvGet(cacheKey);
    if (cached) return cached;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return pickFallbackByDate();

  const recent = (await kvGet('sindi-wpp-recent-quotes')) || [];
  // Inclui timestamp pra forçar variação entre chamadas no mesmo dia (modo fresh)
  const seed = fresh ? `\n\n[seed pra variar: ${Date.now()}]` : '';
  const prompt = `Gere UMA frase motivacional curta (até 18 palavras) pra começar o dia da equipe Sindicompany (administradora de condomínios em São Paulo). Tom leve, otimista, brasileiro, sem pieguice nem clichê manjado. Pode ser:
- Citação famosa de autor brasileiro/internacional
- Provérbio popular
- Frase original sua

VARIA os temas (não fique só em "persistência"): foco, gratidão, equilíbrio, coragem, presença, simplicidade, generosidade, descanso, alegria no trabalho, propósito.

Evite repetir estas que já foram usadas recentemente:
${recent.slice(0, 30).map(q => '- ' + q).join('\n') || '(nenhuma ainda)'}${seed}

Devolva APENAS um JSON válido:
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
            temperature: 1.1,        // ↑ era 0.9 — mais criatividade
            topP: 0.95,
            maxOutputTokens: 200,
            responseMimeType: 'application/json',
          },
        }),
      }
    );
    if (!r.ok) throw new Error('Gemini ' + r.status);
    const data = await r.json();
    const txt = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const j = JSON.parse(txt);
    if (j.text) {
      // Atualiza recent quotes só se NÃO for modo fresh (pra não poluir histórico com testes)
      if (!fresh) {
        const updated = [j.text, ...recent].slice(0, 30);
        await kvSet('sindi-wpp-recent-quotes', updated);
        await kvSet(cacheKey, j, 86400 * 2); // cache do dia
      }
      return j;
    }
  } catch (e) {
    console.warn('quote gen failed', e.message);
  }
  return pickFallbackByDate();
}

function buildMorningHtml({ name, quote }) {
  const firstName = String(name || '').trim().split(/\s+/)[0] || 'time';
  const phrase = quote.author
    ? `<p style="margin:0 0 6px;font-size:20px;font-weight:600;color:#fff;line-height:1.4;font-style:italic">"${escapeHtml(quote.text)}"</p>
       <p style="margin:0;font-size:14px;color:#a5b4fc;font-weight:500">— ${escapeHtml(quote.author)}</p>`
    : `<p style="margin:0;font-size:20px;font-weight:600;color:#fff;line-height:1.4;font-style:italic">"${escapeHtml(quote.text)}"</p>`;

  const body = `
    <div style="display:inline-block;padding:6px 12px;border-radius:100px;background:linear-gradient(135deg,rgba(245,158,11,0.18),rgba(251,191,36,0.10));border:1px solid rgba(245,158,11,0.35);margin-bottom:16px">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fbbf24">🌅 Bom dia · Sindicompany</span>
    </div>

    <h1 style="margin:0 0 16px;font-size:30px;font-weight:800;letter-spacing:-0.025em;line-height:1.1;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.7) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#fff">Bom dia, ${escapeHtml(firstName)}! 🌅</h1>

    <div style="margin:20px 0;padding:20px 22px;background:rgba(99,102,241,0.08);border-left:3px solid #818cf8;border-radius:10px">
      ${phrase}
    </div>

    <p style="margin:24px 0 8px;font-size:15px;line-height:1.6;color:#d4d4d8">Que seu dia seja produtivo.</p>
    <p style="margin:0;font-size:13.5px;line-height:1.6;color:#a1a1aa">Lembra: a <strong style="color:#fff">Sindi</strong> tá no painel se precisar de qualquer coisa — convenção, NBR, redigir notificação, cálculo, brainstorm. <kbd style="background:rgba(99,102,241,0.18);color:#a5b4fc;padding:1px 6px;border-radius:4px;font-size:12px;font-weight:600;font-family:'SF Mono',ui-monospace,monospace">⌘K</kbd> abre tudo na hora.</p>
  `;

  return emailLayout({
    title: `Bom dia, ${escapeHtml(firstName)}`,
    preheader: quote.text.slice(0, 90),
    body,
    ctaText: 'Abrir painel',
    ctaUrl: 'https://painel.sindicompany.com.br/hub.html',
  });
}

export default async function handler(request) {
  const url = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  const validCronAuth = cronSecret && auth === `Bearer ${cronSecret}`;

  // Auth alternativa: admin com cookie pode disparar pra teste (só pra ele mesmo)
  const cookieUser = getUserFromCookie(request);
  const isAdminTest = cookieUser && ADMIN_EMAILS.includes(cookieUser);

  if (!validCronAuth && !isAdminTest) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  // Admin sem CRON_SECRET → força teste pra ele mesmo (impede broadcast)
  if (isAdminTest && !validCronAuth) {
    const requestedTest = url.searchParams.get('testEmail');
    if (requestedTest && requestedTest.toLowerCase() !== cookieUser) {
      return new Response(JSON.stringify({ error: 'Admin sem CRON_SECRET só pode testar pra si mesmo' }), {
        status: 403, headers: { 'Content-Type': 'application/json' },
      });
    }
    url.searchParams.set('testEmail', cookieUser);
    url.searchParams.set('force', '1');
  }
  if (!emailConfigured()) {
    return new Response(JSON.stringify({
      error: 'Email não configurado.', configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const testEmail = url.searchParams.get('testEmail');
  const force = url.searchParams.get('force') === '1' || !!testEmail;
  // Em teste manual (admin via cookie ou testEmail), sempre gera frase nova
  // pra não mostrar a mesma cacheada do envio real do dia
  const fresh = !!testEmail || isAdminTest;

  const recipients = testEmail ? [testEmail.toLowerCase()] : TEAM_EMAILS;
  const day = todayKey();

  // Gera frase do dia (1x — todos recebem a mesma)
  const quote = await generateDailyQuote(fresh);

  const log = [];
  for (const email of recipients) {
    const dedupKey = `sindi-email-morning-sent:${day}:${email.toLowerCase()}`;
    if (!force) {
      const already = await kvGet(dedupKey);
      if (already) { log.push({ email, status: 'skipped', reason: 'já enviado hoje' }); continue; }
    }
    try {
      const profile = await kvGet(`sindi-profile:${email.toLowerCase()}`);
      const name = profile?.name || nameFromEmail(email);
      const html = buildMorningHtml({ name, quote });
      const result = await sendEmail({
        to: email,
        subject: `🌅 Bom dia, ${String(name).split(' ')[0]} — ${quote.text.slice(0, 50)}${quote.text.length > 50 ? '...' : ''}`,
        html,
      });
      await kvSet(dedupKey, { sentAt: new Date().toISOString(), quote: quote.text }, 86400 * 2);
      log.push({ email, status: 'sent', id: result?.id || null });
    } catch (e) {
      log.push({ email, status: 'error', error: String(e.message || e) });
    }
  }

  return new Response(JSON.stringify({
    ok: true, date: day,
    quote: quote.text,
    total: recipients.length,
    sent: log.filter(l => l.status === 'sent').length,
    skipped: log.filter(l => l.status === 'skipped').length,
    errors: log.filter(l => l.status === 'error').length,
    log,
  }, null, 2), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
