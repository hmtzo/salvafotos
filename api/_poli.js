// =====================================================================
// POLI CHAT API helper
// =====================================================================
// Doc: https://ajuda.poli.digital/pt/articles/21467
// Base: https://app.poli.digital/api/v1
// Auth: Bearer token
//
// Endpoint de envio:
//   POST /customers/{customer}/whatsapp/send_text/channels/{channel}/contacts/{contact}/users/{user}
//   Body: { usermsg, database64?, mimetype?, caption? }
//
// Env vars necessárias:
//   POLI_API_TOKEN     — Bearer token gerado no painel
//   POLI_CUSTOMER_ID   — ID da conta Sindicompany na Poli
//   POLI_CHANNEL_ID    — ID do canal WhatsApp (número da empresa)
//   POLI_USER_ID       — ID do user "atendente" que dispara (bot)
// =====================================================================

// IMPORTANTE: a doc PT em ajuda.poli.digital indica app.poli.digital, mas o Swagger
// oficial (cs.poli.digital/api-cliente/openapi.yaml) mostra app.polichat.com.br.
// Em testes, .poli.digital responde 401 em todos endpoints reais; .polichat.com.br
// responde JSON real → este é o domínio correto da API.
const BASE = 'https://app.polichat.com.br/api/v1';

function env(key, fallback = undefined) {
  const v = process.env[key];
  if (!v) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Env var ${key} não configurada no Vercel`);
  }
  return v;
}

export function poliConfigured() {
  return !!(process.env.POLI_API_TOKEN && process.env.POLI_CUSTOMER_ID && process.env.POLI_CHANNEL_ID && process.env.POLI_USER_ID);
}

// Normaliza um telefone pro formato E.164 sem o "+"
// (Poli geralmente trabalha com 5511999999999)
export function normalizePhone(raw) {
  let p = String(raw || '').replace(/\D/g, '');
  // Se vier sem código do país (10-11 dígitos), assume Brasil 55
  if (p.length >= 10 && p.length <= 11 && !p.startsWith('55')) p = '55' + p;
  return p;
}

// Busca contato por número de telefone. Retorna { id, ... } ou null.
// Endpoint plausível: /customers/{c}/contacts?phone=...
// (não documentado — placeholder; ajustar quando confirmar formato)
export async function findContactByPhone(phone) {
  const customer = env('POLI_CUSTOMER_ID');
  const token = env('POLI_API_TOKEN');
  const norm = normalizePhone(phone);
  const url = `${BASE}/customers/${customer}/contacts?phone=${encodeURIComponent(norm)}`;
  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    if (!r.ok) return null;
    const data = await r.json();
    // tenta achar o contato no payload (formato variável)
    const list = data.data || data.contacts || data.items || (Array.isArray(data) ? data : []);
    return list[0] || null;
  } catch {
    return null;
  }
}

// Cria contato (usado quando funcionário cadastra WhatsApp no perfil).
// Endpoint plausível: POST /customers/{c}/contacts
// Body: { name, phone, ... } — formato pode mudar.
export async function createContact({ name, phone, email }) {
  const customer = env('POLI_CUSTOMER_ID');
  const token = env('POLI_API_TOKEN');
  const url = `${BASE}/customers/${customer}/contacts`;
  const body = { name, phone: normalizePhone(phone), email };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Poli createContact falhou (${r.status}): ${t.slice(0, 300)}`);
  }
  return r.json();
}

// Envia texto pra um contato específico (precisa do contact ID)
export async function sendText({ contactId, message }) {
  const customer = env('POLI_CUSTOMER_ID');
  const channel  = env('POLI_CHANNEL_ID');
  const user     = env('POLI_USER_ID');
  const token    = env('POLI_API_TOKEN');
  const url = `${BASE}/customers/${customer}/whatsapp/send_text/channels/${channel}/contacts/${contactId}/users/${user}`;
  const body = {
    usermsg: String(message),
    database64: '',
    mimetype: '',
    caption: '',
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Poli sendText falhou (${r.status}): ${t.slice(0, 300)}`);
  }
  return r.json().catch(() => ({}));
}

// Envia texto direto pra um número de telefone — endpoint UID
// (não precisa criar contato antes — descobrimos pelo OpenAPI spec oficial)
// POST /customers/{c}/whatsapp/send_text/channels/{ch}/uid/{number}/users/{u}
export async function sendTextByUid({ phone, message }) {
  const customer = env('POLI_CUSTOMER_ID');
  const channel  = env('POLI_CHANNEL_ID');
  const user     = env('POLI_USER_ID');
  const token    = env('POLI_API_TOKEN');
  const norm = normalizePhone(phone);
  const url = `${BASE}/customers/${customer}/whatsapp/send_text/channels/${channel}/uid/${norm}/users/${user}`;
  const body = {
    usermsg: String(message),
    database64: '',
    mimetype: '',
    caption: '',
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Poli sendTextByUid falhou (${r.status}): ${t.slice(0, 300)}`);
  }
  return r.json().catch(() => ({}));
}

// Envia template HSM (aprovado pelo Meta) — único jeito de "começar conversa"
// fora da janela de 24h ou pra contato novo.
// POST /customers/{c}/whatsapp/send_template/channels/{ch}/contacts/{contact}/users/{u}
// Body: { quick_message_id: <template_id>, usermsg: <texto renderizado do template> }
//
// Descoberta empírica (não documentada em lugar nenhum): o campo é
// `quick_message_id` e precisa do `usermsg` com o texto JÁ renderizado.
// O backend valida que o template existe e está aprovado.
export async function sendTemplate({ contactId, templateId, message }) {
  const customer = env('POLI_CUSTOMER_ID');
  const channel  = env('POLI_CHANNEL_ID');
  const user     = env('POLI_USER_ID');
  const token    = env('POLI_API_TOKEN');
  const url = `${BASE}/customers/${customer}/whatsapp/send_template/channels/${channel}/contacts/${contactId}/users/${user}`;
  const body = {
    quick_message_id: Number(templateId),
    usermsg: String(message),
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Poli sendTemplate falhou (${r.status}): ${t.slice(0, 300)}`);
  }
  return r.json().catch(() => ({}));
}

// Conveniência: envia mensagem pra um telefone usando a estratégia robusta.
// Fluxo:
//   1) findContact pelo telefone → se existir, tenta sendText com contact_id
//   2) Se sendText falhar com "Contact Error" (janela 24h fechada / novo) →
//      cai pra sendTemplate com template padrão (id em POLI_DEFAULT_TEMPLATE_ID)
//   3) Se contato não existe → createContact + sendTemplate
//
// Pra mensagem motivacional matinal, o template_id pode ter texto fixo
// genérico (ex: "Bom dia! Tudo bem?") — quando funcionário responder,
// abre janela 24h e dia seguinte pode mandar texto livre.
export async function sendTextByPhone({ phone, message, name = '', email = '', templateId = null }) {
  const norm = normalizePhone(phone);
  const tries = [];
  const tpl = templateId || env('POLI_DEFAULT_TEMPLATE_ID', null);

  // (1) Tenta achar contato + texto
  let contactId = null;
  try {
    const found = await findContactByPhone(phone);
    if (found) {
      contactId = found.id || found.contact_id || found.uuid;
      tries.push({ step: 'findContact', ok: !!contactId, id: contactId });
    } else {
      tries.push({ step: 'findContact', ok: false, reason: 'not found' });
    }
  } catch (e) {
    tries.push({ step: 'findContact', ok: false, err: e.message });
  }

  // (2) Se tem contato, tenta sendText
  if (contactId) {
    try {
      return await sendText({ contactId, message });
    } catch (e) {
      tries.push({ step: 'sendText', ok: false, err: e.message });
      // Se erro foi "Contact Error" (janela 24h fechada), cai pra template
      if (tpl && /Contact Error|submit a template/i.test(e.message)) {
        try {
          tries.push({ step: 'sendTemplate', attempting: true });
          return await sendTemplate({ contactId, templateId: tpl, message });
        } catch (e2) {
          tries.push({ step: 'sendTemplate', ok: false, err: e2.message });
        }
      }
    }
  }

  // (3) Se não tem contato, cria e tenta template
  if (!contactId) {
    try {
      const created = await createContact({ name: name || norm, phone: norm, email });
      contactId = created.id || created.contact_id || created.uuid;
      tries.push({ step: 'createContact', ok: !!contactId, id: contactId });
      if (contactId && tpl) {
        return await sendTemplate({ contactId, templateId: tpl, message });
      }
    } catch (e) {
      tries.push({ step: 'createContact', ok: false, err: e.message });
    }
  }

  // (4) Última tentativa — endpoint UID texto livre (raro funcionar mas é o legado)
  try {
    return await sendTextByUid({ phone: norm, message });
  } catch (e) {
    tries.push({ step: 'sendTextByUid', ok: false, err: e.message });
  }

  const summary = tries.map(t => `${t.step}=${t.ok ? 'ok' : 'fail'}${t.err ? ' (' + t.err.slice(0, 80) + ')' : ''}${t.reason ? ' (' + t.reason + ')' : ''}`).join(' | ');
  throw new Error(`Poli sendTextByPhone falhou em todas as estratégias: ${summary}`);
}
