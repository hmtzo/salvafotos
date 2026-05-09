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

  // Bateria de variantes de auth/url pra testar em endpoint que sabemos existir
  // (channel-info devolve 405 com Bearer, então sabemos que a rota existe)
  const targetUrl = `https://app.poli.digital/api/v1/customers/${customer}/channels`;
  const variants = [
    { name: 'Bearer-default',      hdr: { Authorization: `Bearer ${token}` } },
    { name: 'Token-prefix',        hdr: { Authorization: `Token ${token}` } },
    { name: 'X-API-Key',           hdr: { 'X-API-Key': token } },
    { name: 'X-Auth-Token',        hdr: { 'X-Auth-Token': token } },
    { name: 'apikey-header',       hdr: { apikey: token } },
    { name: 'Bearer-with-Accept',  hdr: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    { name: 'query-token',         hdr: {}, qs: `?api_token=${encodeURIComponent(token)}` },
    { name: 'query-access_token',  hdr: {}, qs: `?access_token=${encodeURIComponent(token)}` },
    { name: 'query-token-name',    hdr: {}, qs: `?token=${encodeURIComponent(token)}` },
  ];

  const variantResults = [];
  for (const v of variants) {
    try {
      const url = targetUrl + (v.qs || '');
      const r = await fetch(url, { headers: { ...v.hdr, Accept: 'application/json' } });
      const txt = await r.text();
      variantResults.push({
        name: v.name,
        status: r.status,
        ok: r.ok,
        bodySnippet: txt.slice(0, 150),
        looksHtml: txt.startsWith('<!DOCTYPE'),
      });
    } catch (e) {
      variantResults.push({ name: v.name, error: e.message });
    }
  }

  // Também tenta uma URL base alternativa (alguns sistemas têm /api/external/)
  const altBases = [
    'https://app.poli.digital/api/external/v1',
    'https://app.poli.digital/api/v2',
    'https://api.poli.digital/v1',
  ];
  const altBaseResults = [];
  for (const base of altBases) {
    try {
      const r = await fetch(`${base}/customers/${customer}/channels`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const txt = await r.text();
      altBaseResults.push({
        base,
        status: r.status,
        bodySnippet: txt.slice(0, 100),
      });
    } catch (e) {
      altBaseResults.push({ base, error: e.message });
    }
  }

  return new Response(JSON.stringify({
    tokenInfo,
    bearerResults: results,
    authVariants: variantResults,
    altBases: altBaseResults,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
