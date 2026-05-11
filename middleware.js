// =====================================================================
// MIDDLEWARE - HUB SINDICOMPANY
// =====================================================================
// Protege todas as rotas exceto /login.html, /api/* e arquivos publicos.
// Verifica cookie sf_auth (setado pela API /api/login).
// =====================================================================

const DEFAULT_PASSWORD = '123Mudar@@2026';
// Equipe Sindicompany (cadastro oficial via /Users/.../sindicompany.xlsx)
// Mantém também mkt@ como acesso administrativo (não está no XLSX mas é a conta
// usada pra gerenciar o painel).
const USERS = new Set([
  // Pessoas
  'amanda@sindicompany.com.br',
  'corina@sindicompany.com.br',
  'diego@sindicompany.com.br',
  'eduardo@sindicompany.com.br',
  'felipe.fernandes@sindicompany.com.br',
  'isabella@sindicompany.com.br',
  'juliana@sindicompany.com.br',
  'junior@sindicompany.com.br',
  'luciane@sindicompany.com.br',
  'luciane.barco@sindicompany.com.br',
  'marcia@sindicompany.com.br',
  'marcio@sindicompany.com.br',
  'miriam@sindicompany.com.br',
  'raquel@sindicompany.com.br',
  'rose@sindicompany.com.br',
  // Áreas / contas operacionais
  'arquitetura@sindicompany.com.br',
  'atendimento@sindicompany.com.br',
  'atendimento2@sindicompany.com.br',
  'comercial@sindicompany.com.br',
  'contasapagar@sindicompany.com.br',
  'engenharia@sindicompany.com.br',
  'engenharia1@sindicompany.com.br',
  'engenharia2@sindicompany.com.br',
  'jornal@sindicompany.com.br',
  'operacional@sindicompany.com.br',
  'operacional2@sindicompany.com.br',
  'operacional3@sindicompany.com.br',
  'orcamento@sindicompany.com.br',
  'orcamentos@sindicompany.com.br',
  // Administrativo do painel
  'mkt@sindicompany.com.br',
]);

export const config = {
  // Protege APENAS rotas autenticadas. Resto (/, /login.html, /assets/*, /api/login etc) público.
  matcher: ['/hub.html', '/tools/:path*', '/dashboard.html', '/perfil.html', '/admin.html', '/api/sindi', '/api/sindi-chats', '/api/sindi-os', '/api/corretor', '/api/transcribe', '/api/gemini-doc', '/api/track-usage', '/api/email-invite', '/api/email-broadcast', '/api/presence', '/api/quick-capture', '/api/chat', '/api/team'],
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
