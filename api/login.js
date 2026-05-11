// =====================================================================
// API DE LOGIN — HUB SINDICOMPANY
// =====================================================================
// Valida credenciais e seta cookie httpOnly.
// Fluxo:
//   1) Lookup `sindi-password:<email>` em KV
//   2) Se existe → verifica password contra hash PBKDF2
//   3) Senão → compara com DEFAULT_PASSWORD
// =====================================================================

import { TEAM } from './_team.js';
import { authenticatePassword } from './_password.js';

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const USERS = new Set(TEAM.map(t => t.email));

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
  if (!userLower || !pass || !USERS.has(userLower)) {
    return new Response(JSON.stringify({ error: 'Usuário ou senha incorretos' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Lookup KV → verifica
  const storedHash = await kvGet(`sindi-password:${userLower}`);
  const ok = await authenticatePassword(pass, storedHash);
  if (!ok) {
    return new Response(JSON.stringify({ error: 'Usuário ou senha incorretos' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Token = base64(email:senha) — validado pelo middleware (que faz a mesma verificação)
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
