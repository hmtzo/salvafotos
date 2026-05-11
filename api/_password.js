// =====================================================================
// PASSWORD — utilitários PBKDF2 via Web Crypto (Edge runtime nativo)
// =====================================================================
// Storage no KV: chave `sindi-password:<email>` valor `salt$hash` (hex).
// Senha padrão (DEFAULT_PASSWORD) usada quando user ainda não trocou.
// =====================================================================

const PBKDF2_ITERATIONS = 120000;
const PBKDF2_KEYLEN_BITS = 256;
const PBKDF2_HASH = 'SHA-256';
const SALT_BYTES = 16;

export const DEFAULT_PASSWORD = '123Mudar@@2026';

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function randomSaltHex() {
  const buf = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(buf);
  return bytesToHex(buf);
}

export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password),
    { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey, PBKDF2_KEYLEN_BITS
  );
  return bytesToHex(bits);
}

export async function makeStoredHash(password) {
  const salt = randomSaltHex();
  const hash = await hashPassword(password, salt);
  return `${salt}$${hash}`;
}

// Comparação de tempo constante (evita timing attack)
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function verifyStoredPassword(password, stored) {
  if (!stored || typeof stored !== 'string') return false;
  const idx = stored.indexOf('$');
  if (idx <= 0) return false;
  const salt = stored.slice(0, idx);
  const expectedHash = stored.slice(idx + 1);
  const computed = await hashPassword(password, salt);
  return constantTimeEqual(computed, expectedHash);
}

/**
 * Verifica senha contra KV-stored hash, com fallback pra DEFAULT_PASSWORD.
 * @param {string} password — senha enviada pelo usuário
 * @param {string|null} storedHash — valor em sindi-password:<email>, ou null
 */
export async function authenticatePassword(password, storedHash) {
  if (storedHash) {
    return await verifyStoredPassword(password, storedHash);
  }
  // Sem senha custom → usa a padrão
  return password === DEFAULT_PASSWORD;
}

/**
 * Valida complexidade mínima de uma senha nova.
 * Não exige absurdo — só evita "1", "abc", senha vazia, etc.
 */
export function validatePasswordStrength(password) {
  if (typeof password !== 'string') return 'senha inválida';
  if (password.length < 8) return 'senha precisa ter pelo menos 8 caracteres';
  if (password.length > 200) return 'senha muito longa (máx 200)';
  if (password === DEFAULT_PASSWORD) return 'use uma senha diferente da padrão';
  if (/^\d+$/.test(password)) return 'senha não pode ser só números';
  if (/^[a-z]+$/i.test(password)) return 'senha precisa ter pelo menos um número ou símbolo';
  return null;
}
