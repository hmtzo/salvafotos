// =====================================================================
// API SINDICO-MAP — banco de síndicos, locais de atuação e distâncias
// =====================================================================
// Senha pra editar/apagar: env SINDICO_MAP_PASSWORD (default 9090@@)
//
// Modelo de dados:
//   sindico = {
//     id, name, color, region,
//     phone, email, notes,
//     home: { lat, lng, raw }  // endereço residencial (opcional)
//   }
//   location = {
//     id, sindicoId, bairro,
//     street, number, complement,  // opcionais: endereço específico
//     condoName,                    // opcional: nome do condomínio
//     lat, lng, region
//   }
//
// Endpoints:
//   GET  /api/sindico-map                       → seed + custom
//   GET  /api/sindico-map?region=Vila%20Mariana → todos síndicos que atendem
//   POST /api/sindico-map  { auth }                       → testa senha
//   POST /api/sindico-map  { sindico: {...}, password }   → add síndico
//   POST /api/sindico-map  { location: {...}, password }  → add local
//   POST /api/sindico-map  { delete: 'id', password }     → soft-delete
//   POST /api/sindico-map  { updateSindico: {...}, password } → editar
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

// Haversine distance em km
function distanceKm(lat1, lng1, lat2, lng2) {
  if (!isFinite(lat1) || !isFinite(lat2)) return null;
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function jsonResp(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}

async function loadData() {
  const stored = (await kvGet(KV_KEY)) || { sindicoOverrides: {}, addedSindicos: [], addedLocations: [], deletedIds: [] };
  // Merge sindicos: seed + overrides (home, phone, email) + adicionados
  const sindicosMap = new Map();
  for (const s of seedRaw.sindicos) {
    const ov = stored.sindicoOverrides?.[s.id] || {};
    sindicosMap.set(s.id, { ...s, ...ov });
  }
  for (const s of stored.addedSindicos || []) sindicosMap.set(s.id, s);
  for (const id of stored.deletedIds || []) sindicosMap.delete(id);

  const allLocations = [
    ...seedRaw.locations,
    ...(stored.addedLocations || []),
  ].filter(loc => {
    if ((stored.deletedIds || []).includes(loc.id)) return false;
    if ((stored.deletedIds || []).includes(loc.sindicoId)) return false;
    return true;
  });

  // Enriquece locais com distância do home do síndico
  const enrichedLocations = allLocations.map(loc => {
    const sindico = sindicosMap.get(loc.sindicoId);
    let distanceKmFromHome = null;
    if (sindico?.home?.lat && sindico?.home?.lng) {
      distanceKmFromHome = distanceKm(sindico.home.lat, sindico.home.lng, loc.lat, loc.lng);
    }
    return { ...loc, distanceKm: distanceKmFromHome };
  });

  return {
    sindicos: Array.from(sindicosMap.values()),
    locations: enrichedLocations,
    stored,
  };
}

// Métricas por região: lista síndicos que atendem
function metricsByRegion(locations, sindicos, regionQuery) {
  const q = String(regionQuery || '').toLowerCase().trim();
  if (!q) return null;
  const sindicosMap = new Map(sindicos.map(s => [s.id, s]));
  const matchedLocations = locations.filter(l =>
    (l.bairro || '').toLowerCase().includes(q) ||
    (l.region || '').toLowerCase().includes(q) ||
    (l.condoName || '').toLowerCase().includes(q)
  );
  const bySindico = new Map();
  for (const loc of matchedLocations) {
    if (!bySindico.has(loc.sindicoId)) bySindico.set(loc.sindicoId, { sindico: sindicosMap.get(loc.sindicoId), locations: [] });
    bySindico.get(loc.sindicoId).locations.push(loc);
  }
  const items = Array.from(bySindico.values())
    .filter(x => x.sindico)
    .sort((a, b) => b.locations.length - a.locations.length);
  return {
    query: regionQuery,
    sindicosCount: items.length,
    locationsCount: matchedLocations.length,
    items,
  };
}

export default async function handler(request) {
  const user = getUserFromCookie(request);
  if (!user) return jsonResp({ error: 'no auth' }, 401);

  const url = new URL(request.url);

  // ============ GET ============
  if (request.method === 'GET') {
    const data = await loadData();
    const regionQ = url.searchParams.get('region');
    const sindicoQ = url.searchParams.get('sindico');

    if (regionQ) {
      const m = metricsByRegion(data.locations, data.sindicos, regionQ);
      return jsonResp({ ok: true, region: m });
    }
    if (sindicoQ) {
      const sindico = data.sindicos.find(s => s.id === sindicoQ);
      if (!sindico) return jsonResp({ error: 'síndico não encontrado' }, 404);
      const locs = data.locations.filter(l => l.sindicoId === sindicoQ);
      return jsonResp({ ok: true, sindico, locations: locs });
    }

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

  // Só testa senha
  if (body.auth !== undefined && !body.sindico && !body.location && !body.delete && !body.updateSindico) {
    return jsonResp({ ok: checkPassword(body.auth) });
  }

  if (!checkPassword(body.password)) {
    return jsonResp({ error: 'senha do mapa incorreta' }, 403);
  }

  const stored = (await kvGet(KV_KEY)) || {};
  stored.sindicoOverrides = stored.sindicoOverrides || {};
  stored.addedSindicos = stored.addedSindicos || [];
  stored.addedLocations = stored.addedLocations || [];
  stored.deletedIds = stored.deletedIds || [];

  // ---------- Adicionar síndico ----------
  if (body.sindico) {
    const s = body.sindico;
    const name = String(s.name || '').trim().slice(0, 80);
    if (!name) return jsonResp({ error: 'nome obrigatório' }, 400);
    const id = s.id || slug(name);
    const home = s.home && isFinite(s.home.lat) && isFinite(s.home.lng) ? {
      lat: Number(s.home.lat),
      lng: Number(s.home.lng),
      raw: String(s.home.raw || '').slice(0, 200),
    } : null;
    const newSindico = {
      id,
      name,
      color: s.color || colorFor(name),
      region: String(s.region || 'São Paulo').slice(0, 40),
      phone: String(s.phone || '').slice(0, 30),
      email: String(s.email || '').slice(0, 80),
      notes: String(s.notes || '').slice(0, 500),
      home,
      addedBy: user,
      addedAt: Date.now(),
    };
    // Remove se já existe (replace)
    stored.addedSindicos = stored.addedSindicos.filter(x => x.id !== id);
    stored.addedSindicos.push(newSindico);
    // Se era um seed deletado, "ressuscita"
    stored.deletedIds = stored.deletedIds.filter(x => x !== id);
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true, sindico: newSindico });
  }

  // ---------- Atualizar síndico (do seed ou custom) ----------
  if (body.updateSindico) {
    const s = body.updateSindico;
    if (!s.id) return jsonResp({ error: 'id obrigatório' }, 400);
    // Se é um síndico adicionado pelo user, atualiza inline
    const customIdx = stored.addedSindicos.findIndex(x => x.id === s.id);
    if (customIdx >= 0) {
      stored.addedSindicos[customIdx] = { ...stored.addedSindicos[customIdx], ...s, updatedBy: user, updatedAt: Date.now() };
    } else {
      // Síndico do seed → cria override
      const home = s.home && isFinite(s.home.lat) && isFinite(s.home.lng) ? {
        lat: Number(s.home.lat),
        lng: Number(s.home.lng),
        raw: String(s.home.raw || '').slice(0, 200),
      } : (s.home === null ? null : (stored.sindicoOverrides[s.id]?.home || null));
      stored.sindicoOverrides[s.id] = {
        ...(stored.sindicoOverrides[s.id] || {}),
        ...(s.name ? { name: String(s.name).slice(0,80) } : {}),
        ...(s.region ? { region: String(s.region).slice(0,40) } : {}),
        ...(s.phone !== undefined ? { phone: String(s.phone).slice(0,30) } : {}),
        ...(s.email !== undefined ? { email: String(s.email).slice(0,80) } : {}),
        ...(s.notes !== undefined ? { notes: String(s.notes).slice(0,500) } : {}),
        ...(s.home !== undefined ? { home } : {}),
        updatedBy: user, updatedAt: Date.now(),
      };
    }
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true });
  }

  // ---------- Adicionar localização ----------
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
      lat, lng,
      region: String(l.region || 'São Paulo').slice(0, 40),
      street: String(l.street || '').slice(0, 120),
      number: String(l.number || '').slice(0, 20),
      complement: String(l.complement || '').slice(0, 80),
      condoName: String(l.condoName || '').slice(0, 120),
      addedBy: user,
      addedAt: Date.now(),
    };
    stored.addedLocations.push(newLoc);
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true, location: newLoc });
  }

  // ---------- Apagar (soft-delete + cascade) ----------
  if (body.delete) {
    const id = String(body.delete).trim();
    if (!id) return jsonResp({ error: 'id obrigatório' }, 400);
    if (!stored.deletedIds.includes(id)) stored.deletedIds.push(id);
    stored.addedSindicos = stored.addedSindicos.filter(x => x.id !== id);
    stored.addedLocations = stored.addedLocations.filter(x => x.id !== id && x.sindicoId !== id);
    delete stored.sindicoOverrides[id];
    await kvSet(KV_KEY, stored);
    return jsonResp({ ok: true });
  }

  return jsonResp({ error: 'precisa de sindico, location, delete, updateSindico ou auth' }, 400);
}
