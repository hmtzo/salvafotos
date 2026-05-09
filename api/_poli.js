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

const BASE = 'https://app.poli.digital/api/v1';

function env(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Env var ${key} não configurada no Vercel`);
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

// Envia texto pra um contato específico
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

// Conveniência: envia texto resolvendo (ou criando) o contato a partir do telefone
export async function sendTextByPhone({ phone, message, name = '', email = '' }) {
  let contact = await findContactByPhone(phone);
  if (!contact) {
    contact = await createContact({ name: name || phone, phone, email });
  }
  const id = contact.id || contact.contact_id || contact.uuid;
  if (!id) throw new Error('Contato sem id no payload da Poli — verifique formato da resposta');
  return sendText({ contactId: id, message });
}
