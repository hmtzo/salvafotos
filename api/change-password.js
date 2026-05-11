// =====================================================================
// API CHANGE-PASSWORD — trocar/resetar senha do usuário
// =====================================================================
// POST /api/change-password
//   { currentPassword, newPassword }       → user troca a própria senha
//   { targetEmail, newPassword, reset:true } → admin reseta a de alguém
//
// Cookie sf_auth é re-emitido com a nova senha embutida pra manter sessão.
// Admin reset não re-emite cookie do target (ele vai precisar relogar).
// =====================================================================

import { TEAM, ADMIN_EMAILS } from './_team.js';
import { authenticatePassword, makeStoredHash, validatePasswordStrength, DEFAULT_PASSWORD } from './_password.js';

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const USERS = new Set(TEAM.map(t => t.email));

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
async function kvSet(key, value) {
  if (!KV_URL || !KV_TOK) return false;
  const v = typeof value === 'string' ? value : JSON.stringify(value);
  const r = await fetch(`${KV_URL}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOK}`, 'Content-Type': 'application/json' },
    body: v,
  });
  return r.ok;
}

function getUserFromCookie(req) {
  const cookies = req.headers.get('cookie') || '';
  const m = cookies.match(/(?:^|;\s*)sf_auth=([^;]+)/);
  if (!m) return null;
  try {
    const decoded = atob(m[1]);
    const idx = decoded.indexOf(':');
    if (idx > 0) {
      return {
        email: decoded.slice(0, idx).toLowerCase(),
        token: decoded.slice(idx + 1),
      };
    }
  } catch {}
  return null;
}

function jsonResp(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export default async function handler(request) {
  if (request.method !== 'POST') return jsonResp({ error: 'método não permitido' }, 405);

  const session = getUserFromCookie(request);
  if (!session || !USERS.has(session.email)) {
    return jsonResp({ error: 'sem autenticação' }, 401);
  }

  let body = {};
  try { body = await request.json(); } catch { return jsonResp({ error: 'bad json' }, 400); }

  const isAdmin = ADMIN_EMAILS.includes(session.email);

  // -------- Admin reset --------
  if (body.reset === true) {
    if (!isAdmin) return jsonResp({ error: 'apenas admin pode resetar senha de outros' }, 403);

    const targetEmail = String(body.targetEmail || '').toLowerCase().trim();
    if (!USERS.has(targetEmail)) return jsonResp({ error: 'usuário inválido' }, 400);

    // Se não passou nova senha → volta pra padrão (remove custom)
    if (!body.newPassword) {
      await kvSet(`sindi-password:${targetEmail}`, null);
      return jsonResp({
        ok: true,
        reset: true,
        defaultPassword: DEFAULT_PASSWORD,
        message: `Senha de ${targetEmail} resetada para a padrão`,
      });
    }

    // Admin definindo senha customizada pro user
    const valErr = validatePasswordStrength(body.newPassword);
    if (valErr) return jsonResp({ error: valErr }, 400);

    const hash = await makeStoredHash(body.newPassword);
    await kvSet(`sindi-password:${targetEmail}`, hash);

    return jsonResp({
      ok: true,
      reset: true,
      message: `Senha de ${targetEmail} atualizada`,
    });
  }

  // -------- User trocando própria senha --------
  const currentPassword = String(body.currentPassword || '');
  const newPassword = String(body.newPassword || '');

  if (!currentPassword || !newPassword) {
    return jsonResp({ error: 'precisa de currentPassword e newPassword' }, 400);
  }

  // Verifica senha atual
  const storedHash = await kvGet(`sindi-password:${session.email}`);
  const ok = await authenticatePassword(currentPassword, storedHash);
  if (!ok) return jsonResp({ error: 'senha atual incorreta' }, 401);

  if (currentPassword === newPassword) {
    return jsonResp({ error: 'nova senha igual à atual' }, 400);
  }

  const valErr = validatePasswordStrength(newPassword);
  if (valErr) return jsonResp({ error: valErr }, 400);

  // Hash e armazena
  const hash = await makeStoredHash(newPassword);
  const saved = await kvSet(`sindi-password:${session.email}`, hash);
  if (!saved) return jsonResp({ error: 'falha gravando senha' }, 500);

  // Re-emite cookie com a nova senha (mantém sessão)
  const token = btoa(`${session.email}:${newPassword}`);
  const maxAge = 60 * 60 * 24 * 30; // 30 dias
  const cookie = `sf_auth=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;

  return jsonResp({ ok: true, message: 'Senha atualizada com sucesso' }, 200, {
    'Set-Cookie': cookie,
  });
}
