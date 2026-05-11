// =====================================================================
// EMAIL HELPER — provedor: Resend (https://resend.com)
// =====================================================================
// Env vars necessárias:
//   RESEND_API_KEY  — gerar em resend.com/api-keys
//   EMAIL_FROM      — endereço remetente (ex: painel@sindicompany.com.br)
//                     domain precisa estar verificado em resend.com/domains
//   EMAIL_REPLY_TO  — opcional; default = EMAIL_FROM
//
// Compatível com Edge Runtime do Vercel (fetch nativo, sem Node lib).
// =====================================================================

export function emailConfigured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Envia um email via Resend API.
 * @param {Object} opts
 * @param {string|string[]} opts.to       — destinatário(s)
 * @param {string} opts.subject
 * @param {string} opts.html              — conteúdo HTML
 * @param {string} [opts.text]            — fallback texto puro (gerado do html se omisso)
 * @param {string} [opts.replyTo]
 * @param {string[]} [opts.cc]
 * @param {string[]} [opts.bcc]
 */
export async function sendEmail(opts) {
  if (!emailConfigured()) {
    throw new Error('Email não configurado. Defina RESEND_API_KEY e EMAIL_FROM no Vercel.');
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const replyTo = opts.replyTo || process.env.EMAIL_REPLY_TO || from;

  const body = {
    from,
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    html: opts.html,
    reply_to: replyTo,
  };
  if (opts.text) body.text = opts.text;
  if (opts.cc) body.cc = opts.cc;
  if (opts.bcc) body.bcc = opts.bcc;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Resend falhou (${r.status}): ${errText.slice(0, 300)}`);
  }
  return r.json();
}

/**
 * Wrapper de template HTML — header + footer Sindicompany comum.
 */
export function emailLayout({ title, body, ctaText, ctaUrl, preheader = '' }) {
  const PAINEL_URL = 'https://painel.sindicompany.com.br';
  const LOGO_URL  = `${PAINEL_URL}/assets/brand/logo-full-white.png`;
  const ICON_URL  = `${PAINEL_URL}/assets/brand/icon-color.png`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0c;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fafafa;-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;color:#0a0a0c;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0c">
  <tr>
    <td align="center" style="padding:32px 16px 40px">

      <!-- Logo topo (fora do card pra ficar mais marcante) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px">
        <tr>
          <td align="center">
            <a href="${PAINEL_URL}" style="text-decoration:none;display:inline-block">
              <img src="${LOGO_URL}" alt="Sindicompany" width="200" height="auto" style="display:block;width:200px;max-width:60%;height:auto;border:0;outline:none">
            </a>
          </td>
        </tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#15151a 0%,#0a0a0c 100%);border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
        <!-- Header (eyebrow + dot) -->
        <tr>
          <td style="padding:28px 36px 0;text-align:left">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="vertical-align:middle">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 6px #10b981;margin-right:8px;vertical-align:middle"></span>
                  <span style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#a5b4fc">Sindicompany Painel</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:20px 36px 32px">
            ${body}
            ${ctaText && ctaUrl ? `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
              <tr>
                <td>
                  <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#6366f1 0%,#818cf8 100%);color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:100px;letter-spacing:-0.01em">${escapeHtml(ctaText)} →</a>
                </td>
              </tr>
            </table>
            ` : ''}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:22px 36px 28px;border-top:1px solid rgba(255,255,255,0.08)">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="vertical-align:middle">
                  <img src="${ICON_URL}" alt="" width="28" height="28" style="display:inline-block;vertical-align:middle;margin-right:10px;width:28px;height:28px;border:0;outline:none;border-radius:6px">
                  <span style="vertical-align:middle;font-size:13px;font-weight:700;color:#fafafa;letter-spacing:-0.01em">Sindicompany</span>
                </td>
                <td align="right" style="vertical-align:middle">
                  <a href="${PAINEL_URL}" style="color:#a5b4fc;text-decoration:none;font-size:11.5px;font-weight:600">painel.sindicompany.com.br →</a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0;font-size:11.5px;color:#71717a;line-height:1.55">
              Você está recebendo este email porque tem acesso ao painel interno.
              Dúvidas: responda este email ou fale com a equipe Sindicompany.
            </p>
          </td>
        </tr>
      </table>

      <!-- Disclaimer fora do card -->
      <p style="margin:18px auto 0;font-size:10.5px;color:#52525b;line-height:1.6;max-width:520px">
        Sindicompany · administração condominial · uso interno
      </p>

    </td>
  </tr>
</table>
</body>
</html>`;
}

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

/**
 * Lista oficial de funcionários (mesma do middleware).
 * Fonte de verdade: /api/_team.js. Re-exporta aqui pra retrocompatibilidade
 * com chamadas existentes (email-invite, broadcast, cron, etc).
 */
import { TEAM as _TEAM } from './_team.js';
export const TEAM_EMAILS = _TEAM
  .filter(t => t.active && t.email.endsWith('@sindicompany.com.br'))
  .map(t => t.email);

/**
 * Mapa email → nome real do cadastro oficial. Tem preferência sobre o
 * fallback heurístico de nameFromEmail() quando não houver perfil salvo no KV.
 */
export const TEAM_NAMES = {
  'amanda@sindicompany.com.br': 'Amanda Queiroz',
  'arquitetura@sindicompany.com.br': 'equipe Arquitetura',
  'atendimento@sindicompany.com.br': 'equipe SAC',
  'atendimento2@sindicompany.com.br': 'Henrique Nogueira',
  'comercial@sindicompany.com.br': 'By Sindicompany',
  'contasapagar@sindicompany.com.br': 'equipe Contas a Pagar',
  'corina@sindicompany.com.br': 'Corina Abreu',
  'diego@sindicompany.com.br': 'Diego Leite',
  'eduardo@sindicompany.com.br': 'Eduardo Ribeiro',
  'engenharia@sindicompany.com.br': 'equipe Engenharia',
  'engenharia1@sindicompany.com.br': 'Vitor Porto',
  'engenharia2@sindicompany.com.br': 'Vitor Porto',
  'felipe.fernandes@sindicompany.com.br': 'Felipe Fernandes',
  'isabella@sindicompany.com.br': 'Isabella Nascimento',
  'jornal@sindicompany.com.br': 'equipe Mídias',
  'junior@sindicompany.com.br': 'Rommel Júnior',
  'luciane.barco@sindicompany.com.br': 'Luciane Barco',
  'marcia@sindicompany.com.br': 'Márcia',
  'marcio@sindicompany.com.br': 'Marcio Reis',
  'miriam@sindicompany.com.br': 'Miriam Diamantino',
  'operacional@sindicompany.com.br': 'equipe Operacional',
  'operacional2@sindicompany.com.br': 'Bruno (Operacional)',
  'operacional3@sindicompany.com.br': 'Silvanio (Operacional)',
  'orcamento@sindicompany.com.br': 'equipe Orçamentos',
  'raquel@sindicompany.com.br': 'Raquel Moura',
  'rose@sindicompany.com.br': 'Rose Brandão',
};

/**
 * Pega nome amigável a partir do email (heurística). Se houver perfil cadastrado
 * no KV, prefere usar o name de lá.
 *
 * Pra emails de cargo/genéricos mapeia pra label da equipe ("equipe Marketing",
 * "equipe Comercial", etc.). Pra emails pessoais formata o local part.
 */
const GENERIC_LOCAL_LABEL = {
  'mkt': 'equipe Marketing',
  'marketing': 'equipe Marketing',
  'comercial': 'equipe Comercial',
  'vendas': 'equipe Comercial',
  'sales': 'equipe Comercial',
  'orcamentos': 'equipe Orçamentos',
  'orcamento': 'equipe Orçamentos',
  'contato': 'time',
  'contact': 'time',
  'suporte': 'equipe Suporte',
  'support': 'equipe Suporte',
  'atendimento': 'equipe Atendimento',
  'admin': 'time',
  'financeiro': 'equipe Financeiro',
  'financas': 'equipe Financeiro',
  'rh': 'equipe RH',
  'juridico': 'equipe Jurídica',
  'legal': 'equipe Jurídica',
  'diretoria': 'time',
  'gerencia': 'time',
  'gestao': 'time',
  'operacoes': 'equipe Operações',
  'noreply': 'time',
  'no-reply': 'time',
  'info': 'time',
};

export function nameFromEmail(email) {
  const e = String(email || '').toLowerCase();
  // 1) Mapa oficial da equipe (preferência máxima)
  if (TEAM_NAMES[e]) return TEAM_NAMES[e];
  // 2) Email institucional/cargo genérico
  const local = e.split('@')[0];
  if (GENERIC_LOCAL_LABEL[local]) return GENERIC_LOCAL_LABEL[local];
  // 3) Fallback heurístico
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
