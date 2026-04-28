// =====================================================================
// API DE LOGIN — HUB SINDICOMPANY
// =====================================================================
// Valida credenciais e seta cookie httpOnly. Edita o objeto USERS abaixo
// para gerenciar acessos.
// =====================================================================

export const config = { runtime: 'edge' };

// Senha padrão compartilhada — colaborador troca depois (futuramente)
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

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Requisição inválida' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = (body.user || '').trim();
  const pass = body.pass || '';
  const remember = body.remember !== false;

  const userLower = user.toLowerCase();
  if (!userLower || !pass || !USERS.has(userLower) || pass !== DEFAULT_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Usuário ou senha incorretos' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Token = base64(email:senha) — validado pelo middleware
  const token = btoa(`${userLower}:${pass}`);
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 8; // 30 dias ou 8h

  return new Response(JSON.stringify({ ok: true, user }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `sf_auth=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`,
    },
  });
}
