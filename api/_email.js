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
    <td align="center" style="padding:40px 16px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:linear-gradient(180deg,#15151a 0%,#0a0a0c 100%);border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)">
        <!-- Header -->
        <tr>
          <td style="padding:32px 36px 0;text-align:left">
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
          <td style="padding:24px 36px 32px">
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
          <td style="padding:24px 36px 32px;border-top:1px solid rgba(255,255,255,0.08)">
            <p style="margin:0;font-size:12px;color:#71717a;line-height:1.6">
              <strong style="color:#a1a1aa;font-weight:700">Sindicompany</strong><br>
              Você está recebendo este email porque tem acesso ao painel interno.<br>
              <a href="https://painel.sindicompany.com.br" style="color:#a5b4fc;text-decoration:none">painel.sindicompany.com.br</a>
            </p>
          </td>
        </tr>
      </table>
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
 * Mantém em sincronia se mudar.
 */
export const TEAM_EMAILS = [
  'luciane@sindicompany.com.br',
  'juliana@sindicompany.com.br',
  'raquel@sindicompany.com.br',
  'mkt@sindicompany.com.br',
  'junior@sindicompany.com.br',
  'felipe.fernandes@sindicompany.com.br',
  'comercial@sindicompany.com.br',
  'orcamentos@sindicompany.com.br',
];

/**
 * Pega nome amigável a partir do email (heurística). Se houver perfil cadastrado
 * no KV, prefere usar o name de lá.
 */
export function nameFromEmail(email) {
  const local = String(email || '').split('@')[0];
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
