// =====================================================================
// API POLI-DIAG — diagnóstico do token e endpoints da Poli
// =====================================================================
// Uso: curl https://painel.sindicompany.com.br/api/poli-diag?secret=...
// Tenta vários endpoints GET conhecidos da Poli e devolve status+body
// pra identificar onde o token funciona (e onde não).
// =====================================================================

export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return new Response('forbidden', { status: 403 });
  }

  const token    = process.env.POLI_API_TOKEN || '';
  const customer = process.env.POLI_CUSTOMER_ID || '';
  const channel  = process.env.POLI_CHANNEL_ID || '';
  const user     = process.env.POLI_USER_ID || '';

  const tokenInfo = {
    length: token.length,
    firstChars: token.slice(0, 4),
    lastChars: token.slice(-4),
    hasSpaces: /\s/.test(token),
    hasQuotes: /["']/.test(token),
    customerId: customer,
    channelId: channel,
    userId: user,
  };

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  // Endpoints pra tentar (GET — só leitura)
  const candidates = [
    { name: 'me',                 url: `https://app.poli.digital/api/v1/me` },
    { name: 'user-current',       url: `https://app.poli.digital/api/v1/user` },
    { name: 'customer',           url: `https://app.poli.digital/api/v1/customers/${customer}` },
    { name: 'customer-channels',  url: `https://app.poli.digital/api/v1/customers/${customer}/channels` },
    { name: 'customer-contacts',  url: `https://app.poli.digital/api/v1/customers/${customer}/contacts?per_page=1` },
    { name: 'whatsapp-channels',  url: `https://app.poli.digital/api/v1/customers/${customer}/whatsapp/channels` },
    { name: 'channel-info',       url: `https://app.poli.digital/api/v1/customers/${customer}/channels/${channel}` },
    { name: 'users',              url: `https://app.poli.digital/api/v1/customers/${customer}/users` },
  ];

  const results = [];
  for (const c of candidates) {
    try {
      const r = await fetch(c.url, { headers });
      const text = await r.text();
      results.push({
        name: c.name,
        url: c.url.replace(/key=[^&]+/, 'key=***'),
        status: r.status,
        ok: r.ok,
        body: text.slice(0, 400),
      });
    } catch (e) {
      results.push({ name: c.name, url: c.url, error: e.message });
    }
  }

  // Também testa com prefixo "Token" em vez de "Bearer" (algumas APIs usam)
  const headersToken = { Authorization: `Token ${token}`, Accept: 'application/json' };
  let altAuth = null;
  try {
    const r = await fetch(`https://app.poli.digital/api/v1/customers/${customer}`, { headers: headersToken });
    altAuth = { status: r.status, ok: r.ok, body: (await r.text()).slice(0, 200) };
  } catch (e) {
    altAuth = { error: e.message };
  }

  return new Response(JSON.stringify({
    tokenInfo,
    bearerResults: results,
    tokenPrefixTest: altAuth,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
