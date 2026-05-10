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
    <div style="display:inline-block;padding:6px 12px;border-radius:100px;background:linear-gradient(135deg,rgba(245,158,11,0.18),rgba(251,191,36,0.10));border:1px solid rgba(245,158,11,0.35);margin-bottom:16px">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fbbf24">🎁 Presente da Sindicompany · Uso interno</span>
    </div>

    <h1 style="margin:0 0 12px;font-size:32px;font-weight:800;letter-spacing:-0.025em;line-height:1.1;background:linear-gradient(180deg,#fff 0%,rgba(255,255,255,0.7) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:#fff">${escapeHtml(name)}, é seu. 🎁</h1>

    <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#e4e4e7">Pensamos numa forma de fazer seu dia render mais.<br>E aqui está — um <strong style="color:#fff">painel feito sob medida pra equipe</strong>, com <strong style="color:#a5b4fc">41 ferramentas + IA</strong> que resolvem em segundos o que hoje leva horas.</p>

    <div style="margin:20px 0 24px;padding:16px 18px;background:rgba(16,185,129,0.08);border-left:3px solid #10b981;border-radius:8px">
      <p style="margin:0;font-size:14px;line-height:1.65;color:#d4d4d8">
        <strong style="color:#86efac">⚡ Notificação extrajudicial pronta?</strong> 30 segundos.<br>
        <strong style="color:#86efac">⚡ Cálculo de inadimplência com juros e correção?</strong> 10 segundos.<br>
        <strong style="color:#86efac">⚡ Resumir uma ata de 40 páginas?</strong> 1 minuto.<br>
        <strong style="color:#86efac">⚡ Dúvida de convenção ou NBR?</strong> Pergunta pra Sindi e ela responde na hora.
      </p>
    </div>

    <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#d4d4d8">Tudo <strong style="color:#fff">grátis</strong>, <strong style="color:#fff">ilimitado</strong>, direto do navegador. Sem instalar nada, sem mensalidade, sem complicação. É da casa, pra casa.</p>

    <div style="margin:24px 0;padding:18px 20px;background:rgba(99,102,241,0.10);border:1px solid rgba(99,102,241,0.30);border-radius:14px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#a5b4fc">🔑 Suas credenciais</p>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
        <tr><td style="padding:4px 0;font-size:13px;color:#a1a1aa;width:100px">Login:</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#fff;font-family:'SF Mono','Menlo',ui-monospace,monospace;word-break:break-all">${escapeHtml(email)}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#a1a1aa">Senha inicial:</td><td style="padding:4px 0;font-size:14px;font-weight:600;color:#fff;font-family:'SF Mono','Menlo',ui-monospace,monospace">${DEFAULT_PASSWORD}</td></tr>
      </table>
    </div>

    <h2 style="margin:32px 0 14px;font-size:18px;font-weight:700;color:#fff;letter-spacing:-0.01em">O que tá esperando você</h2>

    <table cellpadding="0" cellspacing="0" border="0" style="width:100%">
      <tr><td style="padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
        <p style="margin:0 0 5px;font-size:14.5px;font-weight:700;color:#fff">🤖 Sindi · sua copiloto IA</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.55">Conversa fluida sobre qualquer coisa — convenção, lei, redação, brainstorm, cálculo. Streaming em tempo real, com pesquisa na web e leitura de PDF que você anexa. Também responde no seu WhatsApp.</p>
      </td></tr>
      <tr><td height="8"></td></tr>
      <tr><td style="padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
        <p style="margin:0 0 5px;font-size:14.5px;font-weight:700;color:#fff">📄 41 ferramentas que economizam horas</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.55">PDF (juntar, dividir, comprimir, OCR, editor, traduzir com IA), conversões Word/Excel/PDF, geradores de ata/contrato/notificação, calculadoras de rateio/multa/reajuste, assinatura eletrônica, redação LGPD automática.</p>
      </td></tr>
      <tr><td height="8"></td></tr>
      <tr><td style="padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
        <p style="margin:0 0 5px;font-size:14.5px;font-weight:700;color:#fff">⌘ Atalho mágico em qualquer lugar</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.55">Aperta <code style="background:rgba(99,102,241,0.18);color:#a5b4fc;padding:2px 7px;border-radius:5px;font-size:12px;font-weight:600">⌘K</code> no Mac ou <code style="background:rgba(99,102,241,0.18);color:#a5b4fc;padding:2px 7px;border-radius:5px;font-size:12px;font-weight:600">Ctrl+K</code> no Windows e busca direto a ferramenta que você quer. Voa.</p>
      </td></tr>
      <tr><td height="8"></td></tr>
      <tr><td style="padding:14px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px">
        <p style="margin:0 0 5px;font-size:14.5px;font-weight:700;color:#fff">🌅 Bom dia diário com a Sindi</p>
        <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.55">Toda manhã uma frase pra começar bem. À noite, um resumo do que você fez no dia (ou ideias do que poderia testar). Cuidamos de você como cuidamos do nosso trabalho.</p>
      </td></tr>
    </table>

    <p style="margin:32px 0 8px;font-size:15px;line-height:1.55;color:#e4e4e7"><strong style="color:#fff">Bora começar?</strong> Clica no botão abaixo, faz login com as credenciais aí em cima e dá uma volta — leva 5 minutos pra entender tudo.</p>
    <p style="margin:0;font-size:13px;line-height:1.55;color:#a1a1aa">Qualquer dúvida, é só responder este email. Estamos junto.</p>
  `;

  return emailLayout({
    title: 'Seu painel Sindicompany chegou',
    preheader: '41 ferramentas + IA pra economizar horas todo dia. Suas credenciais estão dentro.',
    body,
    ctaText: 'Abrir meu painel agora',
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
        subject: '🎁 Seu painel Sindicompany chegou — 41 atalhos pro dia a dia',
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
