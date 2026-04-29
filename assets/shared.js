// =============================================================================
// SINDICOMPANY HUB — SHARED HELPERS
// =============================================================================

// Logo Sindicompany — usa o PNG oficial (texto branco para tema dark)
const SINDI_LOGO_SVG = `<img src="/assets/brand/logo-full-white.png" alt="Sindicompany" class="sindi-logo-img">`;

// Lucide SVG icons usados no navbar (stroke 1.75)
const NAV_ICONS = {
  arrowLeft: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  chart:     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16V9M12 16V5M17 16v-7"/></svg>',
  shield:    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  logout:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
};

// Renderiza navbar padrão (recebe optional "back to hub" link)
function renderNav({ backToHub = true } = {}) {
  const back = backToHub ? `<a href="/hub.html" class="btn-icon">${NAV_ICONS.arrowLeft} Hub</a>` : '';
  return `
    <nav class="app-nav">
      <div class="nav-inner">
        <a href="/hub.html" class="logo">${SINDI_LOGO_SVG}</a>
        <div class="nav-actions">
          ${back}
          <a href="/dashboard.html" class="btn-icon" title="Meu uso">${NAV_ICONS.chart} Dashboard</a>
          <span class="badge">${NAV_ICONS.shield} Interno</span>
          <a href="/api/logout" class="btn-icon" title="Sair">${NAV_ICONS.logout}</a>
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

// =============================================================================
// USAGE TRACKING (localStorage) — alimenta o Dashboard
// =============================================================================
const TIME_SAVED_MIN = {
  'juntar-pdf': 5, 'dividir-pdf': 5, 'comprimir-pdf': 3, 'girar-pdf': 2,
  'numerar-paginas': 4, 'marca-dagua': 5, 'proteger-pdf': 3, 'jpg-para-pdf': 4,
  'whatsapp-fotos': 30, 'pdf-para-jpg': 4, 'organizar-pdf': 6, 'desbloquear-pdf': 2,
  'ocr': 10, 'gerador-notificacao': 20, 'gerador-ata': 30, 'gerador-contrato': 20,
  'sindi': 5, 'calculadoras': 4, 'word-para-pdf': 3, 'excel-para-pdf': 3,
  'corretor-texto': 8, 'comparar-pdf': 15, 'redigir-lgpd': 12, 'assinatura': 10,
  'conversor-imagens': 5, 'pdf-para-excel': 12, 'editor-pdf': 8,
};

// =============================================================================
// SINDI HANDOFF — qualquer ferramenta passa contexto para a Sindi via localStorage
// =============================================================================
function askSindiAbout(filename, textContent, suggestedQuestion) {
  try {
    sessionStorage.setItem('sf_sindi_handoff', JSON.stringify({
      filename, text: (textContent || '').slice(0, 30000), question: suggestedQuestion || '',
      ts: Date.now(),
    }));
  } catch (e) { console.warn('handoff failed', e); }
  window.location.href = '/tools/sindi.html?from=tool';
}

function trackUsage(toolSlug, meta = {}) {
  try {
    const KEY = 'sf_usage_v1';
    const now = Date.now();
    const data = JSON.parse(localStorage.getItem(KEY) || '{"tools":{}, "history":[]}');
    if (!data.tools[toolSlug]) {
      data.tools[toolSlug] = { count: 0, firstUsed: now, lastUsed: now, savedMinutes: 0 };
    }
    const t = data.tools[toolSlug];
    t.count += 1;
    t.lastUsed = now;
    t.savedMinutes += TIME_SAVED_MIN[toolSlug] || 5;
    data.history.unshift({ slug: toolSlug, ts: now, ...meta });
    if (data.history.length > 200) data.history = data.history.slice(0, 200);
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) { console.warn('tracking failed', e); }
}

function getUsage() {
  try {
    return JSON.parse(localStorage.getItem('sf_usage_v1') || '{"tools":{}, "history":[]}');
  } catch (e) { return { tools: {}, history: [] }; }
}

// =============================================================================
// DOTTED SURFACE — 3D animated dot grid no fundo (Three.js)
// =============================================================================
function loadThreeJS() {
  return new Promise((res, rej) => {
    if (window.THREE) return res(window.THREE);
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js';
    s.onload = () => res(window.THREE);
    s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function initDottedSurface() {
  if (window.__dottedSurfaceMounted) return;
  // Pula se reduce-motion
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Pula em telas muito pequenas (mobile) por performance
  if (window.innerWidth < 600) return;

  try {
    const THREE = await loadThreeJS();
    window.__dottedSurfaceMounted = true;

    const container = document.createElement('div');
    container.id = 'dotted-surface';
    document.body.appendChild(container);

    const SEPARATION = 150;
    const AMOUNTX = 40;
    const AMOUNTY = 60;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 2000, 10000);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff, 0);
    container.appendChild(renderer.domElement);

    const positions = [];
    const colors = [];
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;
        positions.push(x, 0, z);
        colors.push(0.78, 0.85, 0.95); // tom claro azulado pra combinar com tema dark
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;
    let animId;
    let isVisible = true;
    document.addEventListener('visibilitychange', () => {
      isVisible = !document.hidden;
    });

    function animate() {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;
      const arr = geometry.attributes.position.array;
      let i = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          arr[i * 3 + 1] = Math.sin((ix + count) * 0.3) * 50 + Math.sin((iy + count) * 0.5) * 50;
          i++;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
      count += 0.1;
    }
    animate();

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);
  } catch (e) {
    console.warn('DottedSurface init failed', e);
  }
}

// =============================================================================
// Auto-mount nav/footer + DottedSurface
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const navSlot = document.getElementById('app-nav');
  if (navSlot) navSlot.innerHTML = renderNav({ backToHub: navSlot.dataset.hub !== 'self' });
  const footSlot = document.getElementById('app-footer');
  if (footSlot) footSlot.innerHTML = renderFooter();
  // Inicia o background animado depois do paint inicial
  setTimeout(initDottedSurface, 100);
});
