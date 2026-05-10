// =====================================================================
// API EMAIL-DAILY — relatório de produtividade diário (cron 19h BRT)
// =====================================================================
// Pra cada funcionário da equipe:
//   - Se USOU o sistema hoje → email com resumo do que fez
//   - Se NÃO USOU → email com sugestões de ferramentas relevantes
//
// Disparado pelo Vercel Cron (vercel.json) seg-sex 19h BRT.
// Auth: Bearer CRON_SECRET. Aceita ?testEmail e ?force=1 pra dispara manual.
// =====================================================================

import { sendEmail, emailLayout, emailConfigured, TEAM_EMAILS, nameFromEmail, escapeHtml } from './_email.js';

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

function todayKey() {
  const offset = -3 * 60;
  const local = new Date(Date.now() + (new Date().getTimezoneOffset() + offset) * 60000);
  return local.toISOString().slice(0, 10);
}

// Tempo economizado (min) por ferramenta — alinhado com TIME_SAVED_MIN do shared.js
const TIME_SAVED_MIN = {
  sindi: 8, 'corretor-texto': 5, 'resumir-pdf': 12, 'traduzir-pdf': 15,
  'gerador-notificacao': 20, 'gerador-ata': 30, 'gerador-contrato': 25,
  'wizard-inadimplencia': 35, calculadoras: 10,
  'word-para-pdf': 4, 'excel-para-pdf': 4, 'pdf-para-excel': 6, 'pdf-para-jpg': 3,
  'jpg-para-pdf': 3, 'conversor-imagens': 5, 'html-para-pdf': 5,
  'editor-pdf': 8, 'juntar-pdf': 3, 'dividir-pdf': 4, 'comprimir-pdf': 3,
  'comparar-pdf': 15, 'reparar-pdf': 6, 'recortar-pdf': 4,
  'organizar-pdf': 5, 'girar-pdf': 2, 'numerar-paginas': 3, 'marca-dagua': 4,
  'whatsapp-fotos': 25, ocr: 12,
  'proteger-pdf': 3, 'desbloquear-pdf': 3, 'redigir-lgpd': 15, assinatura: 8,
};

const TOOL_LABELS = {
  sindi: 'Sindi (IA)', 'corretor-texto': 'Corretor de Texto',
  'resumir-pdf': 'Resumir PDF com IA', 'traduzir-pdf': 'Traduzir PDF',
  'gerador-notificacao': 'Gerador de Notificação', 'gerador-ata': 'Gerador de Ata',
  'gerador-contrato': 'Gerador de Contrato', 'wizard-inadimplencia': 'Wizard Inadimplência',
  calculadoras: 'Calculadoras',
  'word-para-pdf': 'Word → PDF', 'excel-para-pdf': 'Excel → PDF',
  'pdf-para-excel': 'PDF → Excel', 'pdf-para-jpg': 'PDF → JPG', 'jpg-para-pdf': 'Imagens → PDF',
  'conversor-imagens': 'Conversor de Imagens', 'html-para-pdf': 'HTML → PDF',
  'editor-pdf': 'Editor de PDF', 'juntar-pdf': 'Juntar PDF', 'dividir-pdf': 'Dividir PDF',
  'comprimir-pdf': 'Comprimir PDF', 'comparar-pdf': 'Comparar Documentos',
  'reparar-pdf': 'Reparar PDF', 'recortar-pdf': 'Recortar PDF',
  'organizar-pdf': 'Organizar Páginas', 'girar-pdf': 'Girar PDF',
  'numerar-paginas': 'Numerar Páginas', 'marca-dagua': "Marca d'água",
  'whatsapp-fotos': 'Fotos do WhatsApp', ocr: 'OCR (Texto em Imagem)',
  'proteger-pdf': 'Proteger PDF', 'desbloquear-pdf': 'Desbloquear PDF',
  'redigir-lgpd': 'Redigir LGPD', assinatura: 'Assinatura Eletrônica',
};

// Sugestões pra quem não usou — selecionadas das mais úteis no dia a dia
const SUGGESTIONS = [
  { slug: 'sindi', icon: '🤖', why: 'Tira qualquer dúvida em segundos — convenção, NBR, redação, cálculo, qualquer coisa.' },
  { slug: 'gerador-notificacao', icon: '📄', why: 'Notificação extrajudicial pronta em 30 segundos — barulho, inadimplência, animal, obra.' },
  { slug: 'wizard-inadimplencia', icon: '💸', why: 'Fluxo guiado completo: cálculo + notificação + cronograma. Tudo em uma sessão.' },
  { slug: 'calculadoras', icon: '🧮', why: 'Reajuste de aluguel, multa por atraso, rateio. Sem precisar de planilha.' },
  { slug: 'whatsapp-fotos', icon: '📱', why: 'Recebeu fotos do morador? Extrai e renomeia tudo com legenda + data.' },
  { slug: 'redigir-lgpd', icon: '🔒', why: 'Tarja CPF/RG/email automaticamente antes de mandar PDF pra alguém.' },
  { slug: 'resumir-pdf', icon: '⚡', why: 'Resumo executivo de qualquer PDF longo (ata, contrato, laudo) em 4 modos.' },
  { slug: 'editor-pdf', icon: '✏️', why: 'Adiciona texto, destaque, anotação direto no PDF. Sem instalar Adobe.' },
];

function pickSuggestions(used, count = 4) {
  const usedSet = new Set(used);
  const pool = SUGGESTIONS.filter(s => !usedSet.has(s.slug));
  // Embaralha de forma determinística pelo dia (pra todo mundo receber as mesmas, mas variar por dia)
  const seed = todayKey().replace(/-/g, '').slice(-4);
  const shuffled = [...pool].sort((a, b) => {
    const ha = (a.slug + seed).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const hb = (b.slug + seed).split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    return ha - hb;
  });
  return shuffled.slice(0, count);
}

function buildUsedEmail({ name, items }) {
  // items: array de { tool, ts, meta? }
  const byTool = {};
  for (const it of items) {
    byTool[it.tool] = (byTool[it.tool] || 0) + 1;
  }
  const top = Object.entries(byTool).sort((a, b) => b[1] - a[1]);
  const totalUses = items.length;
  const totalSaved = top.reduce((sum, [t, c]) => sum + (TIME_SAVED_MIN[t] || 5) * c, 0);
  const hours = Math.floor(totalSaved / 60);
  const mins = totalSaved % 60;
  const savedTxt = hours ? `${hours}h${mins ? ' ' + mins + 'min' : ''}` : `${mins} min`;

  const rows = top.slice(0, 8).map(([t, c]) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#fff">
        ${escapeHtml(TOOL_LABELS[t] || t)}
      </td>
      <td style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#a5b4fc;text-align:right;font-variant-numeric:tabular-nums;font-weight:700">
        ${c}×
      </td>
    </tr>`).join('');

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-0.025em;line-height:1.2;color:#fff">Boa noite, ${escapeHtml(name)}! 🌙</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#d4d4d8">Hoje você se moveu rápido no painel. Aqui o resumo:</p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 20px">
      <tr>
        <td style="width:50%;padding:18px 16px;background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.25);border-radius:14px;text-align:center" valign="middle">
          <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1">${totalUses}</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a5b4fc;margin-top:4px">Ações no painel</div>
        </td>
        <td style="width:14"></td>
        <td style="width:50%;padding:18px 16px;background:rgba(16,185,129,0.10);border:1px solid rgba(16,185,129,0.25);border-radius:14px;text-align:center" valign="middle">
          <div style="font-size:32px;font-weight:800;color:#fff;letter-spacing:-0.02em;line-height:1">${savedTxt}</div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#86efac;margin-top:4px">Economizadas hoje</div>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a5b4fc">Ferramentas usadas</p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden">
      ${rows}
    </table>

    <p style="margin:28px 0 0;font-size:14px;line-height:1.55;color:#d4d4d8">Continua assim. Amanhã tem mais 🚀</p>
  `;

  return emailLayout({
    title: 'Sua produtividade hoje',
    preheader: `${totalUses} ações · ${savedTxt} economizadas hoje`,
    body,
    ctaText: 'Abrir painel',
    ctaUrl: 'https://painel.sindicompany.com.br/dashboard.html',
  });
}

function buildIdleEmail({ name, suggestions }) {
  const items = suggestions.map(s => `
    <tr><td style="padding:14px 16px;background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.06);border-radius:12px">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff">
        ${s.icon} ${escapeHtml(TOOL_LABELS[s.slug] || s.slug)}
      </p>
      <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5">${escapeHtml(s.why)}</p>
    </td></tr>
    <tr><td height="8"></td></tr>
  `).join('');

  const body = `
    <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;letter-spacing:-0.025em;line-height:1.2;color:#fff">Oi, ${escapeHtml(name)} 👋</h1>
    <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#d4d4d8">Você não passou pelo painel hoje. Sem cobrança — só uma lembrança que essas ferramentas estão prontas pra economizar tempo amanhã:</p>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
      ${items}
    </table>

    <p style="margin:28px 0 0;font-size:14px;line-height:1.55;color:#d4d4d8">
      <strong style="color:#fff">Dica:</strong> abre o painel, aperta <code style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;font-size:12px;color:#a5b4fc">⌘K</code> ou <code style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;font-size:12px;color:#a5b4fc">Ctrl+K</code> e busca direto. Ou só joga uma dúvida no botão Sindi flutuante no canto.
    </p>
  `;

  return emailLayout({
    title: 'O painel está te esperando',
    preheader: 'Algumas ferramentas que podem economizar seu tempo amanhã',
    body,
    ctaText: 'Dar uma olhada',
    ctaUrl: 'https://painel.sindicompany.com.br/hub.html',
  });
}

export default async function handler(request) {
  const url = new URL(request.url);
  const cronSecret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization') || '';
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!emailConfigured()) {
    return new Response(JSON.stringify({
      error: 'Email não configurado. Falta RESEND_API_KEY ou EMAIL_FROM.',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const testEmail = url.searchParams.get('testEmail');
  const force = url.searchParams.get('force') === '1' || !!testEmail;
  const dryRun = url.searchParams.get('dryRun') === '1';

  let recipients = TEAM_EMAILS;
  if (testEmail) recipients = [testEmail.toLowerCase()];

  const day = todayKey();
  const log = [];

  for (const email of recipients) {
    const dedupKey = `sindi-email-daily-sent:${day}:${email.toLowerCase()}`;
    if (!force) {
      const already = await kvGet(dedupKey);
      if (already) { log.push({ email, status: 'skipped', reason: 'já enviado hoje' }); continue; }
    }

    try {
      const profile = await kvGet(`sindi-profile:${email.toLowerCase()}`);
      const name = profile?.name || nameFromEmail(email);

      // Pega uso do dia
      const usage = (await kvGet(`sindi-usage:${email.toLowerCase()}:${day}`)) || [];
      const usedSlugs = [...new Set(usage.map(u => u.tool))];

      const used = usage.length > 0;
      const html = used
        ? buildUsedEmail({ name, items: usage })
        : buildIdleEmail({ name, suggestions: pickSuggestions(usedSlugs, 4) });
      const subject = used
        ? `Sua produtividade hoje · ${usage.length} ações`
        : 'O painel está te esperando 👋';

      if (dryRun) {
        log.push({ email, status: 'dry-run', used, usageCount: usage.length, subject });
        continue;
      }

      const result = await sendEmail({ to: email, subject, html });
      await kvSet(dedupKey, { sentAt: new Date().toISOString(), used, count: usage.length }, 86400 * 2);
      log.push({ email, status: 'sent', used, count: usage.length, id: result?.id || null });
    } catch (e) {
      log.push({ email, status: 'error', error: String(e.message || e) });
    }
  }

  return new Response(JSON.stringify({
    ok: true, date: day,
    total: recipients.length,
    sent: log.filter(l => l.status === 'sent').length,
    skipped: log.filter(l => l.status === 'skipped').length,
    errors: log.filter(l => l.status === 'error').length,
    log,
  }, null, 2), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
