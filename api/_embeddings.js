// =====================================================================
// EMBEDDINGS — busca semântica via Gemini + Upstash Vector
// =====================================================================
// Variáveis de ambiente necessárias (criadas automaticamente quando você
// conecta Upstash Vector ao projeto na Vercel):
//   UPSTASH_VECTOR_REST_URL
//   UPSTASH_VECTOR_REST_TOKEN
//
// Modelo: gemini text-embedding-004 (768 dims, free tier)
// Custo: Upstash Vector Free Tier — 10K vetors + 10K queries/dia
//
// Como conectar:
// 1. Vercel dashboard > Storage > Marketplace > "Upstash Vector"
// 2. Create database → name: sindi-vector → DIMENSION: 768 → SIMILARITY: cosine
// 3. Connect to project whatsapp-fotos
// 4. Redeploy
// 5. No /admin.html clique "🔁 Reindexar tudo" pra popular
// =====================================================================

const VECTOR_URL = () => process.env.UPSTASH_VECTOR_REST_URL;
const VECTOR_TOKEN = () => process.env.UPSTASH_VECTOR_REST_TOKEN;
const GEMINI_KEY = () => process.env.GOOGLE_API_KEY;

export function vectorAvailable() {
  return !!(VECTOR_URL() && VECTOR_TOKEN() && GEMINI_KEY());
}

// =====================================================================
// Gemini embedding
// =====================================================================
export async function embed(text, taskType = 'RETRIEVAL_QUERY') {
  if (!GEMINI_KEY()) return null;
  if (!text) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_KEY()}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: String(text).slice(0, 8000) }] },
        taskType, // RETRIEVAL_QUERY ou RETRIEVAL_DOCUMENT
      }),
    });
    if (!res.ok) {
      console.warn('embed failed', res.status);
      return null;
    }
    const data = await res.json();
    return data.embedding?.values || null;
  } catch (e) {
    console.warn('embed error', e);
    return null;
  }
}

// =====================================================================
// Upstash Vector REST
// =====================================================================
async function vectorFetch(path, body) {
  if (!VECTOR_URL() || !VECTOR_TOKEN()) return null;
  try {
    const res = await fetch(`${VECTOR_URL()}${path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VECTOR_TOKEN()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('vector fetch failed', res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (e) {
    console.warn('vector fetch error', e);
    return null;
  }
}

// Indexa um documento (id + texto + metadata)
export async function indexDoc({ id, text, metadata }) {
  if (!vectorAvailable()) return false;
  const vector = await embed(text, 'RETRIEVAL_DOCUMENT');
  if (!vector) return false;
  const result = await vectorFetch('/upsert', {
    id: String(id),
    vector,
    metadata: metadata || {},
  });
  return !!result;
}

// Busca semântica
export async function vectorSearch(query, topK = 5, filter = null) {
  if (!vectorAvailable()) return [];
  const vector = await embed(query, 'RETRIEVAL_QUERY');
  if (!vector) return [];
  const body = { vector, topK, includeMetadata: true };
  if (filter) body.filter = filter;
  const result = await vectorFetch('/query', body);
  // Resposta: { result: [{id, score, metadata}, ...] }
  return result?.result || [];
}

// Remove um documento do índice
export async function deleteDoc(id) {
  if (!vectorAvailable()) return false;
  const r = await vectorFetch('/delete', { ids: [String(id)] });
  return !!r;
}

// Reindexação em batch — usado pelo seed do admin
export async function reindexBatch(docs) {
  if (!vectorAvailable()) return { success: 0, failed: docs.length };
  let success = 0, failed = 0;
  for (const doc of docs) {
    const ok = await indexDoc(doc);
    if (ok) success++; else failed++;
    // Rate limit suave: pausa pequena entre chamadas
    await new Promise(r => setTimeout(r, 50));
  }
  return { success, failed };
}

// Estatísticas do índice
export async function vectorStats() {
  if (!vectorAvailable()) return { available: false };
  try {
    const res = await fetch(`${VECTOR_URL()}/info`, {
      headers: { 'Authorization': `Bearer ${VECTOR_TOKEN()}` },
    });
    if (!res.ok) return { available: true, error: 'fetch failed' };
    const data = await res.json();
    return { available: true, ...data.result };
  } catch (e) {
    return { available: true, error: e.message };
  }
}
