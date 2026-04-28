// =====================================================================
// API SINDI CHATS — Persistência server-side via Vercel KV (Upstash)
// =====================================================================
// Necessita das variáveis de ambiente:
//   KV_REST_API_URL
//   KV_REST_API_TOKEN
// (ambas geradas automaticamente quando você cria o KV em
//  https://vercel.com/hmtzos-projects/whatsapp-fotos/stores)
//
// Endpoints:
//   GET  /api/sindi-chats        → retorna todas conversas do usuário
//   POST /api/sindi-chats        → salva o estado completo (body JSON)
// =====================================================================

export const config = { runtime: 'edge' };

const KV_URL = () => process.env.KV_REST_API_URL;
const KV_TOKEN = () => process.env.KV_REST_API_TOKEN;

async function kvGet(key) {
  if (!KV_URL() || !KV_TOKEN()) return null;
  const res = await fetch(`${KV_URL()}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN()}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.result) return null;
  try { return JSON.parse(data.result); } catch { return null; }
}

async function kvSet(key, value) {
  if (!KV_URL() || !KV_TOKEN()) return false;
  const res = await fetch(`${KV_URL()}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN()}`,
      'Content-Type': 'text/plain',
    },
    body: JSON.stringify(value),
  });
  return res.ok;
}

function getUserFromCookie(request) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/(?:^|;\s*)sf_auth=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = atob(match[1]);
    const idx = decoded.indexOf(':');
    if (idx > 0) return decoded.slice(0, idx).toLowerCase();
  } catch (e) {}
  return null;
}

export default async function handler(request) {
  const user = getUserFromCookie(request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autenticado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!KV_URL() || !KV_TOKEN()) {
    return new Response(JSON.stringify({
      error: 'Storage não configurado. O administrador precisa criar o Vercel KV.',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  const key = `sindi-chats:${user}`;

  try {
    if (request.method === 'GET') {
      const data = await kvGet(key);
      return new Response(JSON.stringify(data || { conversations: [], activeId: null }), {
        status: 200, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      if (!body || typeof body !== 'object') {
        return new Response(JSON.stringify({ error: 'Body inválido' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
      // Limita tamanho (~2MB por usuário)
      const stringified = JSON.stringify(body);
      if (stringified.length > 2 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'Histórico muito grande. Exclua conversas antigas.' }), {
          status: 413, headers: { 'Content-Type': 'application/json' },
        });
      }
      const ok = await kvSet(key, body);
      return new Response(JSON.stringify({ ok, user }), {
        status: ok ? 200 : 500, headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('sindi-chats error:', err);
    return new Response(JSON.stringify({ error: 'Falha: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
