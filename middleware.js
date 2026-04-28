// =====================================================================
// AUTENTICAÇÃO - SALVAFOTOS SINDICOMPANY
// =====================================================================
// Para ADICIONAR um colaborador: adicione uma linha no objeto USERS abaixo
// no formato 'usuario': 'senha',
// Depois faça `git push` e o deploy é automático.
// =====================================================================

const USERS = {
  // formato: 'email-completo': 'senha',
  'luciane@sindicompany.com.br': 'Sindi-luciane-7042',
  'juliana@sindicompany.com.br': 'Sindi-juliana-3815',
  'raquel@sindicompany.com.br':  'Sindi-raquel-9263',
  'mkt@sindicompany.com.br':     'Sindi-mkt-5197',
  'admin':                       'SindiAdmin2026!', // backup do administrador
};

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon).*)',
};

export default function middleware(request) {
  const auth = request.headers.get('authorization');

  if (auth && auth.startsWith('Basic ')) {
    try {
      const decoded = atob(auth.slice(6));
      const idx = decoded.indexOf(':');
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (USERS[user] && USERS[user] === pass) {
        return; // autenticado, libera o acesso
      }
    } catch (e) { /* falha no decode -> 401 */ }
  }

  return new Response(
    'Acesso restrito a colaboradores Sindicompany.\n\nUse o login e senha fornecidos pela empresa.',
    {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Sindicompany - Acesso restrito a colaboradores"',
        'Content-Type': 'text/plain; charset=utf-8',
      },
    }
  );
}
