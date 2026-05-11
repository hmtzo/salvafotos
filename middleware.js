// =====================================================================
// MIDDLEWARE - HUB SINDICOMPANY
// =====================================================================
// Protege todas as rotas exceto /login.html, /api/* e arquivos publicos.
// Verifica cookie sf_auth (setado pela API /api/login).
//
// Auth:
// 1) Decodifica cookie sf_auth = base64(email:password)
// 2) Se user tem senha customizada salva em KV → verifica contra ela
// 3) Senão, fallback pra DEFAULT_PASSWORD (123Mudar@@2026)
//
// Fonte de usuários: /api/_team.js
// =====================================================================

import { TEAM } from './api/_team.js';
import { authenticatePassword, DEFAULT_PASSWORD } from './api/_password.js';

const USERS = new Set(TEAM.map(t => t.email));
const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL || !KV_TOK) return null;
  try {
    const r = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${KV_TOK}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    if (!j.result) return null;
    try { return JSON.parse(j.result); } catch { return j.result; }
  } catch { return null; }
}

export const config = {
  // Protege APENAS rotas autenticadas. Resto (/, /login.html, /assets/*, /api/login etc) público.
  matcher: ['/hub.html', '/tools/:path*', '/dashboard.html', '/perfil.html', '/admin.html', '/api/sindi', '/api/sindi-chats', '/api/sindi-os', '/api/corretor', '/api/transcribe', '/api/gemini-doc', '/api/track-usage', '/api/email-invite', '/api/email-broadcast', '/api/presence', '/api/quick-capture', '/api/chat', '/api/team', '/api/change-password'],
};

export default async function middleware(request) {
  const url = new URL(request.url);

  // Verifica cookie sf_auth
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/(?:^|;\s*)sf_auth=([^;]+)/);

  if (match) {
    try {
      const decoded = atob(match[1]);
      const idx = decoded.indexOf(':');
      if (idx > 0) {
        const user = decoded.slice(0, idx).toLowerCase();
        const pass = decoded.slice(idx + 1);
        if (USERS.has(user)) {
          const storedHash = await kvGet(`sindi-password:${user}`);
          if (await authenticatePassword(pass, storedHash)) {
            return; // autenticado, libera
          }
        }
      }
    } catch (e) { /* cookie invalido -> redireciona */ }
  }

  // Sem cookie valido -> redireciona pro login preservando a URL solicitada
  const loginUrl = new URL('/login.html', url.origin);
  loginUrl.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(loginUrl, 302);
}
