// =====================================================================
// API SINDICO-MAP — banco de síndicos e localizações (acesso protegido)
// =====================================================================
// Dados seed em /api/_sindico-map-seed.json (gerado do KML original).
// Adições/edições persistidas em KV (chave sindi-map-data).
//
// Acesso protegido por senha (env: SINDICO_MAP_PASSWORD, default 9090@@).
// Cliente envia X-Map-Auth header com a senha em cada chamada que muda.
//
//   GET  /api/sindico-map                       → seed + custom
//   POST /api/sindico-map  { sindico: {...}, password }   → add síndico
//   POST /api/sindico-map  { location: {...}, password }  → add local
//   POST /api/sindico-map  { delete: 'id', password }     → soft-delete
//   POST /api/sindico-map  { auth: '9090@@' }             → testa senha
// =====================================================================

import seedRaw from './_sindico-map-seed.json' with { type: 'json' };

export const config = { runtime: 'edge' };

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOK = process.env.KV_REST_API_TOKEN;
const MAP_PASSWORD = process.env.SINDICO_MAP_PASSWORD || '9090@@';
const KV_KEY = 'sindi-map-data';

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
    if (idx > 0) return decoded.slice(0, idx).toLowerCase();
  } catch {}
  return null;
}

function checkPassword(p) {
  return typeof p === 'string' && p === MAP_PASSWORD;
}

function slug(s) {
  return String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function colorFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `hsl(${h % 360}, 65%, 50%)`;
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

async function loadData() {
  const stored = (await kvGet(KV_KEY)) || { addedSindicos: [], addedLocations: [], deletedIds: [] };
  const sindicosMap = new Map(seedRaw.sindicos.map(s => [s.id, s]));
  for (const s of stored.addedSindicos || []) sindicosMap.set(s.id, s);
  for (const id of stored.deletedIds || []) sindicosMap.delete(id);

  const allLocations = [
    ...seedRaw.locations,
    ...(stored.addedLocations || []),
  ].filter(loc => !(stored.deletedIds || []).includes(loc.id));

  return {
    sindicos: Array.from(sindicosMap.values()),
    locations: allLocations,
    stored,
  };
}

export default async function handler(request) {
  const user = getUserFromCookie(request);
  if (!user) return jsonResp({ error: 'no auth' }, 401);

  // ============ GET ============
  if (request.method === 'GET') {
    const data = await loadData();
    return jsonResp({
      ok: true,
      sindicos: data.sindicos,
      locations: data.locations,
      counts: {
        sindicos: data.sindicos.length,
        locations: data.locations.length,
      },
    });
  }

  // ============ POST ============
  if (request.method !== 'POST') return jsonResp({ error: 'método não permitido' }, 405);

  let body = {};
  try { body = await request.json(); } catch { return jsonResp({ error: 'bad json' }, 400); }

  // Verificar senha de mapa (separada da senha de login)
  // body.auth: só checa senha
  if (body.auth !== undefined && !body.sindico && !body.location && !body.delete) {
    return jsonResp({ ok: checkPassword(body.auth) });
  }

  if (!checkPassword(body.password)) {
    return jsonResp({ error: 'senha do mapa incorreta' }, 403);
  }

  const stored = (await kvGet(KV_KEY)) || { addedSindicos: [], addedLocations: [], deletedIds: [] };
  stored.addedSindicos = stored.addedSindicos || [];
  stored.addedLocations = stored.addedLocations || [];
  stored.deletedIds = stored.deletedIds || [];

  // Adicionar síndico
  if (body.sindico) {
    const s = body.sindico;
    const name = String(s.name || '').trim().slice(0, 80);
    if (!name) return jsonResp({ error: 'nome obrigatório' }, 400);
    const id = s.id || slug(name);
    const newSindico = {
      id,
      name,
      color: s.color || colorFor(name),
      region: String(s.region || 'São Paulo').slice(0, 40),
      phone: String(s.phone || '').slice(0, 30),
      email: String(s.email || '').slice(0, 80),
      notes: String(s.notes || '').slice(0, 500),
      addedBy: user,
      addedAt: Date.now(),
    };
    stored.addedSindicos = stored.addedSindicos.filter(x => x.id !== id);
    stored.addedSindicos.push(newSindico);
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true, sindico: newSindico });
  }

  // Adicionar localização
  if (body.location) {
    const l = body.location;
    const sindicoId = String(l.sindicoId || '').trim();
    const bairro = String(l.bairro || '').trim().slice(0, 80);
    const lat = Number(l.lat);
    const lng = Number(l.lng);
    if (!sindicoId || !bairro || !isFinite(lat) || !isFinite(lng)) {
      return jsonResp({ error: 'sindicoId, bairro, lat, lng obrigatórios' }, 400);
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return jsonResp({ error: 'coordenadas fora de range' }, 400);
    }
    const newLoc = {
      id: `loc-custom-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      sindicoId,
      bairro,
      lat,
      lng,
      region: String(l.region || 'São Paulo').slice(0, 40),
      addedBy: user,
      addedAt: Date.now(),
    };
    stored.addedLocations.push(newLoc);
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true, location: newLoc });
  }

  // Apagar (soft-delete)
  if (body.delete) {
    const id = String(body.delete).trim();
    if (!id) return jsonResp({ error: 'id obrigatório' }, 400);
    if (!stored.deletedIds.includes(id)) stored.deletedIds.push(id);
    // Remove dos arrays customizados também
    stored.addedSindicos = stored.addedSindicos.filter(x => x.id !== id);
    stored.addedLocations = stored.addedLocations.filter(x => x.id !== id);
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true });
  }

  return jsonResp({ error: 'precisa de sindico, location, delete ou auth' }, 400);
}
