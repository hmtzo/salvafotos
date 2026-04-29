// =====================================================================
// MIDDLEWARE - HUB SINDICOMPANY
// =====================================================================
// Protege todas as rotas exceto /login.html, /api/* e arquivos publicos.
// Verifica cookie sf_auth (setado pela API /api/login).
// =====================================================================

const DEFAULT_PASSWORD = '123Mudar@@2026';
const USERS = new Set([
  'luciane@sindicompany.com.br',
  'juliana@sindicompany.com.br',
  'raquel@sindicompany.com.br',
  'mkt@sindicompany.com.br',
  'junior@sindicompany.com.br',
  'felipe.fernandes@sindicompany.com.br',
  'comercial@sindicompany.com.br',
  'orcamentos@sindicompany.com.br',
]);

export const config = {
  // Protege APENAS rotas autenticadas. Resto (/, /login.html, /assets/*, /api/login etc) público.
  matcher: ['/hub.html', '/tools/:path*', '/dashboard.html', '/api/sindi', '/api/sindi-chats', '/api/sindi-os', '/api/corretor'],
};

export default function middleware(request) {
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
        if (USERS.has(user) && pass === DEFAULT_PASSWORD) {
          return; // autenticado, libera
        }
      }
    } catch (e) { /* cookie invalido -> redireciona */ }
  }

  // Sem cookie valido -> redireciona pro login preservando a URL solicitada
  const loginUrl = new URL('/login.html', url.origin);
  loginUrl.searchParams.set('next', url.pathname + url.search);
  return Response.redirect(loginUrl, 302);
}
