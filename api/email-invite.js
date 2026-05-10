// =====================================================================
// API EMAIL-INVITE — convite de boas-vindas pra equipe
// =====================================================================
// POST /api/email-invite           → envia pra todos da equipe
// POST /api/email-invite { to: [...] } → envia só pros emails listados
// POST /api/email-invite { dryRun: true } → não envia, só devolve preview
//
// Auth: cookie sf_auth com user em ADMIN_USERS (mesma regra do sindi-os).
// =====================================================================

import { sendEmail, emailLayout, emailConfigured, TEAM_EMAILS, nameFromEmail, escapeHtml } from './_email.js';

export const config = { runtime: 'edge' };

const ADMIN_USERS = ['luciane@sindicompany.com.br', 'mkt@sindicompany.com.br'];
const DEFAULT_PASSWORD = '123Mudar@@2026';

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

function inviteHtml({ name, email }) {
  const body = `
    <h1 style="margin:0 0 12px;font-size:30px;font-weight:800;letter-spacing:-0.025em;line-height:1.1;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.7) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#fff">Bem-vinda, ${escapeHtml(name)}! 👋</h1>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.55;color:#d4d4d8">Você foi convidada a usar o <strong style="color:#fff">Painel Sindicompany</strong> — a plataforma interna que reúne tudo que a equipe precisa em um só lugar.</p>

    <div style="margin:24px 0;padding:18px 20px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.25);border-radius:14px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a5b4fc">Suas credenciais</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
        <tr><td style="padding:4px 0;font-size:13px;color:#a1a1aa">Login:</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#fff;font-family:'SF Mono','Menlo',ui-monospace,monospace">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#a1a1aa">Senha inicial:</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#fff;font-family:'SF Mono','Menlo',ui-monospace,monospace">${DEFAULT_PASSWORD}</td></tr>
      </table>
    </div>

    <h2 style="margin:24px 0 12px;font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.01em">O que você encontra lá</h2>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 8px">
      <tr><td style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff">🤖 Sindi (IA)</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5">Pergunta qualquer coisa: convenção, NBR, redação de notificação, dúvida do dia. Streaming em tempo real e até por WhatsApp.</p>
      </td></tr>
      <tr><td height="6"></td></tr>
      <tr><td style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff">📄 41 ferramentas profissionais</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5">PDF (juntar, dividir, comprimir, OCR, editor), conversões Word/Excel/PDF, geradores de ata/contrato/notificação, calculadoras de rateio e multa, assinatura eletrônica, redação LGPD, e muito mais.</p>
      </td></tr>
      <tr><td height="6"></td></tr>
      <tr><td style="padding:10px 14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:10px">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#fff">⚡ Atalho mágico</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5">Em qualquer página, aperta <code style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;font-size:12px">⌘K</code> (Mac) ou <code style="background:rgba(255,255,255,0.06);padding:1px 6px;border-radius:4px;font-size:12px">Ctrl+K</code> (Win) e busca direto.</p>
      </td></tr>
    </table>

    <p style="margin:24px 0 0;font-size:14px;line-height:1.55;color:#d4d4d8">Bora começar? Clique no botão abaixo, faz login com suas credenciais e dá uma volta. <strong style="color:#fff">Qualquer dúvida, é só responder este email</strong>.</p>
  `;

  return emailLayout({
    title: 'Convite Sindicompany Painel',
    preheader: `Suas credenciais já estão prontas — acesse painel.sindicompany.com.br`,
    body,
    ctaText: 'Acessar painel agora',
    ctaUrl: 'https://painel.sindicompany.com.br/hub.html',
  });
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = getUser(request);
  if (!user || !ADMIN_USERS.includes(user)) {
    return new Response(JSON.stringify({ error: 'Apenas admins podem disparar convites.' }), {
      status: 403, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!emailConfigured()) {
    return new Response(JSON.stringify({
      error: 'Email não configurado. Falta RESEND_API_KEY ou EMAIL_FROM no Vercel.',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  let body = {};
  try { body = await request.json(); } catch {}

  const recipients = (Array.isArray(body.to) && body.to.length)
    ? body.to.filter(e => /\S+@\S+\.\S+/.test(e))
    : TEAM_EMAILS;

  const dryRun = !!body.dryRun;

  const log = [];
  for (const email of recipients) {
    try {
      // Tenta puxar nome do perfil cadastrado; senão deriva do email
      const profile = await kvGet(`sindi-profile:${email.toLowerCase()}`);
      const name = profile?.name || nameFromEmail(email);

      const html = inviteHtml({ name, email });

      if (dryRun) {
        log.push({ email, status: 'dry-run', name, htmlLength: html.length });
        continue;
      }

      const result = await sendEmail({
        to: email,
        subject: 'Bem-vindo ao Painel Sindicompany 🚀',
        html,
      });
      log.push({ email, status: 'sent', name, id: result?.id || null });
    } catch (e) {
      log.push({ email, status: 'error', error: String(e.message || e) });
    }
  }

  return new Response(JSON.stringify({
    ok: true,
    triggeredBy: user,
    total: recipients.length,
    sent: log.filter(l => l.status === 'sent').length,
    dryRun: log.filter(l => l.status === 'dry-run').length,
    errors: log.filter(l => l.status === 'error').length,
    log,
  }, null, 2), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  });
}
