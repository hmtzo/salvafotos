// =============================================================================
// SINDICOMPANY HUB — SHARED HELPERS
// =============================================================================

// HTML do logo Sindicompany (SVG inline reutilizável)
const SINDI_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 392 81" width="160" height="33" aria-label="Sindicompany"><path fill="#84c7d3" fill-rule="evenodd" d="M 29 12 L 27 14 L 26 14 L 20 20 L 19 20 L 14 25 L 13 25 L 9 29 L 9 58 L 40 58 L 40 50 L 41 49 L 48 49 L 49 48 L 49 29 L 43 23 L 42 23 L 36 17 L 35 17 L 30 12 Z M 29 30 L 31 32 L 32 32 L 35 35 L 35 43 L 34 44 L 24 44 L 23 43 L 23 35 L 25 33 L 26 33 Z M 28 19 L 29 18 L 30 18 L 34 22 L 35 22 L 40 27 L 41 27 L 45 31 L 45 43 L 44 44 L 41 44 L 40 43 L 40 33 L 39 33 L 33 27 L 32 27 L 29 24 L 24 29 L 23 29 L 19 33 L 19 49 L 34 49 L 35 50 L 35 53 L 34 54 L 14 54 L 13 53 L 13 31 L 14 30 L 15 30 L 21 24 L 22 24 L 27 19 Z"/><path fill="#84c7d3" fill-rule="evenodd" d="M 29 0 L 26 3 L 25 3 L 20 8 L 19 8 L 13 14 L 12 14 L 7 19 L 6 19 L 0 25 L 0 67 L 45 67 L 45 65 L 46 64 L 46 63 L 5 63 L 4 62 L 4 27 L 7 24 L 8 24 L 14 18 L 15 18 L 20 13 L 21 13 L 27 7 L 28 7 L 29 6 L 30 6 L 35 11 L 36 11 L 41 16 L 42 16 L 48 22 L 49 22 L 54 27 L 54 55 L 56 55 L 57 54 L 58 54 L 58 24 L 57 23 L 56 23 L 50 17 L 49 17 L 44 12 L 43 12 L 37 6 L 36 6 L 31 1 L 30 1 Z"/><path fill="#dabda9" fill-rule="evenodd" d="M 57 55 L 56 56 L 53 56 L 52 57 L 51 57 L 48 60 L 48 61 L 47 62 L 47 64 L 46 65 L 46 72 L 47 73 L 47 74 L 52 79 L 53 79 L 54 80 L 62 80 L 63 79 L 64 79 L 65 78 L 66 78 L 69 75 L 69 74 L 70 73 L 70 72 L 71 71 L 71 65 L 70 64 L 70 62 L 68 60 L 68 59 L 67 58 L 66 58 L 64 56 L 62 56 L 61 55 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 385 31 L 384 32 L 383 32 L 382 33 L 382 34 L 381 35 L 381 37 L 382 38 L 382 39 L 383 39 L 385 41 L 387 41 L 388 40 L 389 40 L 391 38 L 391 34 L 388 31 Z M 385 38 L 386 37 L 387 38 L 386 39 Z M 388 35 L 389 34 L 390 35 L 390 37 L 389 38 L 388 38 L 387 37 L 388 36 Z M 383 34 L 384 33 L 385 34 L 385 37 L 384 38 L 383 37 Z M 385 33 L 386 32 L 387 32 L 388 33 L 387 34 L 386 34 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 339 31 L 338 32 L 337 32 L 336 33 L 335 32 L 326 32 L 326 55 L 335 55 L 335 40 L 337 38 L 340 38 L 342 40 L 342 55 L 351 55 L 351 38 L 352 37 L 353 38 L 353 39 L 354 40 L 354 42 L 355 43 L 355 44 L 356 45 L 356 46 L 357 47 L 357 49 L 358 50 L 358 51 L 359 52 L 359 54 L 360 55 L 358 57 L 356 57 L 355 58 L 354 58 L 354 64 L 357 64 L 358 63 L 360 63 L 361 62 L 362 62 L 363 61 L 364 61 L 368 57 L 368 56 L 369 55 L 369 54 L 370 53 L 370 52 L 371 51 L 371 49 L 372 48 L 372 46 L 373 45 L 373 44 L 374 43 L 374 41 L 375 40 L 375 38 L 376 37 L 376 35 L 377 34 L 377 33 L 378 32 L 368 32 L 367 33 L 367 35 L 366 36 L 366 39 L 365 40 L 365 42 L 364 43 L 363 42 L 363 40 L 362 39 L 362 37 L 361 36 L 361 33 L 360 32 L 350 32 L 351 33 L 351 34 L 350 35 L 346 31 Z M 350 35 L 351 34 L 352 35 L 352 37 L 351 38 L 350 37 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 282 31 L 280 33 L 279 32 L 270 32 L 270 62 L 279 62 L 279 53 L 280 52 L 282 54 L 289 54 L 290 53 L 291 53 L 295 49 L 295 48 L 296 47 L 298 49 L 298 50 L 300 52 L 300 53 L 301 53 L 303 55 L 305 55 L 306 56 L 309 56 L 310 55 L 312 55 L 313 54 L 314 55 L 323 55 L 323 32 L 314 32 L 313 33 L 312 32 L 310 32 L 309 31 L 307 31 L 306 32 L 303 32 L 301 34 L 300 34 L 300 35 L 298 37 L 298 38 L 297 39 L 295 37 L 295 36 L 291 32 L 290 32 L 289 31 Z M 307 39 L 308 38 L 313 38 L 314 39 L 314 47 L 312 49 L 308 49 L 307 48 L 307 47 L 306 46 L 306 42 L 307 41 Z M 281 38 L 282 37 L 283 37 L 284 38 L 285 38 L 286 39 L 286 40 L 287 41 L 287 44 L 286 45 L 286 46 L 284 48 L 282 48 L 281 47 L 280 47 L 279 46 L 279 39 L 280 38 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 241 31 L 238 34 L 237 33 L 237 32 L 229 32 L 229 55 L 237 55 L 237 41 L 238 40 L 238 39 L 239 38 L 241 38 L 244 41 L 244 55 L 252 55 L 252 41 L 253 40 L 253 39 L 254 38 L 256 38 L 258 40 L 258 41 L 259 42 L 259 55 L 267 55 L 267 36 L 266 35 L 266 34 L 264 32 L 263 32 L 262 31 L 256 31 L 255 32 L 254 32 L 252 34 L 251 34 L 249 32 L 248 32 L 247 31 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 188 30 L 187 31 L 183 31 L 181 33 L 180 33 L 177 36 L 177 37 L 176 38 L 176 39 L 175 40 L 174 39 L 174 32 L 165 32 L 165 55 L 173 55 L 174 54 L 174 47 L 175 46 L 176 47 L 176 49 L 181 54 L 182 54 L 183 55 L 184 55 L 185 56 L 192 56 L 193 55 L 195 55 L 196 54 L 197 54 L 201 50 L 205 54 L 206 54 L 207 55 L 208 55 L 209 56 L 218 56 L 219 55 L 220 55 L 222 53 L 223 53 L 224 52 L 224 51 L 226 49 L 226 48 L 227 47 L 227 40 L 226 39 L 226 37 L 221 32 L 220 32 L 219 31 L 217 31 L 216 30 L 212 30 L 211 31 L 208 31 L 207 32 L 206 32 L 201 37 L 200 36 L 200 35 L 197 32 L 196 32 L 195 31 L 192 31 L 191 30 Z M 199 49 L 200 48 L 201 49 L 200 50 Z M 212 38 L 213 37 L 214 37 L 215 38 L 216 38 L 217 39 L 217 42 L 218 43 L 217 44 L 217 47 L 215 49 L 211 49 L 210 48 L 210 46 L 209 45 L 209 41 L 210 40 L 210 39 L 211 38 Z M 199 37 L 200 36 L 201 37 L 201 38 L 200 39 L 200 48 L 199 49 L 198 49 L 196 47 L 194 47 L 193 48 L 192 48 L 191 49 L 188 49 L 187 48 L 186 48 L 184 46 L 184 41 L 185 40 L 185 39 L 186 38 L 187 38 L 188 37 L 190 37 L 191 38 L 192 38 L 194 40 L 195 39 L 196 39 L 198 37 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 84 30 L 83 31 L 79 31 L 78 32 L 77 32 L 75 34 L 75 35 L 74 36 L 74 41 L 75 42 L 75 43 L 76 44 L 77 44 L 78 45 L 79 45 L 80 46 L 83 46 L 84 47 L 85 47 L 87 49 L 86 50 L 82 50 L 81 49 L 78 49 L 77 48 L 76 48 L 74 50 L 74 51 L 73 52 L 73 53 L 74 54 L 75 54 L 76 55 L 78 55 L 79 56 L 90 56 L 91 55 L 92 55 L 95 52 L 95 50 L 96 49 L 97 50 L 97 54 L 98 55 L 106 55 L 106 32 L 97 32 L 97 47 L 96 48 L 95 47 L 95 45 L 92 42 L 91 42 L 90 41 L 88 41 L 87 40 L 84 40 L 83 39 L 83 38 L 84 37 L 88 37 L 89 38 L 92 38 L 93 37 L 93 36 L 94 35 L 94 34 L 95 33 L 94 33 L 93 32 L 92 32 L 91 31 L 87 31 L 86 30 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 165 23 L 165 29 L 173 29 L 174 28 L 174 23 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 153 23 L 153 32 L 152 33 L 151 33 L 150 32 L 148 32 L 147 31 L 145 31 L 144 32 L 141 32 L 137 36 L 137 37 L 136 38 L 136 39 L 135 40 L 134 39 L 134 38 L 133 37 L 133 35 L 129 31 L 122 31 L 121 32 L 120 32 L 119 33 L 118 32 L 109 32 L 109 55 L 118 55 L 118 40 L 120 38 L 123 38 L 125 40 L 125 55 L 134 55 L 134 47 L 135 46 L 136 47 L 136 49 L 137 50 L 137 51 L 140 54 L 141 54 L 142 55 L 143 55 L 144 56 L 147 56 L 148 55 L 150 55 L 151 54 L 152 54 L 153 55 L 162 55 L 162 23 Z M 147 38 L 151 38 L 153 40 L 153 46 L 152 47 L 152 48 L 151 49 L 147 49 L 145 47 L 145 40 Z"/><path fill="#1a1c29" fill-rule="evenodd" d="M 97 23 L 97 28 L 98 29 L 106 29 L 106 23 Z"/></svg>`;

// Renderiza navbar padrão (recebe optional "back to hub" link)
function renderNav({ backToHub = true } = {}) {
  const back = backToHub ? `<a href="/" class="btn-icon">← Hub</a>` : '';
  return `
    <nav class="app-nav">
      <div class="nav-inner">
        <a href="/" class="logo">${SINDI_LOGO_SVG}</a>
        <div class="nav-actions">
          ${back}
          <span class="badge">🔒 Interno</span>
          <a href="/api/logout" class="btn-icon" title="Sair">Sair</a>
        </div>
      </div>
    </nav>
  `;
}

function renderFooter() {
  return `
    <footer class="app-footer">
      <p><strong>Sindicompany</strong> · Hub de ferramentas internas</p>
      <p style="margin-top:4px;opacity:0.7">Os dados processados aqui são confidenciais e não saem do seu navegador.</p>
    </footer>
  `;
}

// Helpers de UI
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function setupDropZone(zone, input, onFiles) {
  ['dragenter', 'dragover'].forEach(ev =>
    zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); zone.classList.add('dragover'); })
  );
  ['dragleave', 'drop'].forEach(ev =>
    zone.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); zone.classList.remove('dragover'); })
  );
  zone.addEventListener('drop', e => {
    if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files));
  });
  input.addEventListener('change', e => {
    if (e.target.files.length) onFiles(Array.from(e.target.files));
  });
}

function showStatus(el, msg, type) {
  el.className = 'status show' + (type ? ' ' + type : '');
  el.querySelector('.status-text').textContent = msg;
}
function setProgress(el, pct) {
  el.querySelector('.progress-bar').style.width = pct + '%';
}

// Auto-mount nav/footer se o documento tiver placeholders
document.addEventListener('DOMContentLoaded', () => {
  const navSlot = document.getElementById('app-nav');
  if (navSlot) navSlot.innerHTML = renderNav({ backToHub: navSlot.dataset.hub !== 'self' });
  const footSlot = document.getElementById('app-footer');
  if (footSlot) footSlot.innerHTML = renderFooter();
});
