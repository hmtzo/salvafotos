// =============================================================================
// SINDICOMPANY HUB — SHARED HELPERS
// =============================================================================

// Logo Sindicompany — usa o PNG oficial (texto branco para tema dark)
const SINDI_LOGO_SVG = `<img src="/assets/brand/logo-full-white.png" alt="Sindicompany" class="sindi-logo-img">`;

// Lucide SVG icons (stroke 1.75)
const NAV_ICONS = {
  chev:    '<svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
  menu:    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  close:   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  shield:  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  logout:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  bot:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>',
  fileText:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/></svg>',
  filePen: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L20 7.5V11"/><path d="m18.4 9.6 3 3-7 7H11v-3.4z"/></svg>',
  fileSign:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/><path d="m11 14-3 3 1.5 1.5L13 15"/></svg>',
  pdfEdit: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
  calc:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/></svg>',
  swap:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3l4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/></svg>',
  shieldBig:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  chart:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16V9M12 16V5M17 16v-7"/></svg>',
};

// Estrutura do menu Navbar1
const NAV_MENU = [
  { title: 'Início', url: '/hub.html' },
  { title: 'Ferramentas', items: [
    { title: 'Sindi (IA)',     url: '/tools/sindi.html',              icon: 'bot',     desc: 'Copiloto que lê documentos e responde dúvidas' },
    { title: 'Notificação',    url: '/tools/gerador-notificacao.html', icon: 'fileText',desc: 'Notificações extrajudiciais prontas' },
    { title: 'Ata',            url: '/tools/gerador-ata.html',         icon: 'filePen', desc: 'Wizard de ata de assembleia' },
    { title: 'Contrato',       url: '/tools/gerador-contrato.html',    icon: 'fileSign',desc: 'Modelos de prestação de serviço, locação' },
    { title: 'Editor de PDF',  url: '/tools/editor-pdf.html',          icon: 'pdfEdit', desc: 'Adicione texto, imagens, anote o PDF' },
    { title: 'Calculadoras',   url: '/tools/calculadoras.html',        icon: 'calc',    desc: 'Reajuste, multa, rateio e projeção' },
  ]},
  { title: 'Recursos', items: [
    { title: 'Conversões',     url: '/hub.html',                      icon: 'swap',     desc: 'Word, Excel, JPG, PDF — converte tudo' },
    { title: 'Segurança',      url: '/tools/redigir-lgpd.html',       icon: 'shieldBig',desc: 'LGPD, proteger PDF, assinatura' },
    { title: 'Dashboard',      url: '/dashboard.html',                icon: 'chart',    desc: 'Veja seu uso e tempo economizado' },
  ]},
  { title: 'Dashboard', url: '/dashboard.html' },
];

// Marca link ativo baseado em location
function isActiveUrl(url) {
  const path = window.location.pathname;
  if (url === '/hub.html' && (path === '/hub.html' || path === '/')) return true;
  return path === url;
}

function renderDesktopMenuItem(item) {
  if (item.items) {
    const subs = item.items.map(s => `
      <li>
        <a href="${s.url}" class="nav-sub-item">
          <span class="nav-sub-icon">${NAV_ICONS[s.icon] || ''}</span>
          <span class="nav-sub-text">
            <span class="nav-sub-title">${s.title}</span>
            <span class="nav-sub-desc">${s.desc}</span>
          </span>
        </a>
      </li>
    `).join('');
    return `
      <li class="nav-menu-item has-submenu">
        <button type="button" class="nav-link nav-trigger" aria-expanded="false">
          ${item.title} ${NAV_ICONS.chev}
        </button>
        <div class="nav-submenu" role="menu">
          <ul class="nav-submenu-list">${subs}</ul>
        </div>
      </li>
    `;
  }
  const active = isActiveUrl(item.url) ? ' is-active' : '';
  return `<li class="nav-menu-item"><a href="${item.url}" class="nav-link${active}">${item.title}</a></li>`;
}

function renderMobileMenuItem(item, idx) {
  if (item.items) {
    const subs = item.items.map(s => `
      <a href="${s.url}" class="nav-sub-item">
        <span class="nav-sub-icon">${NAV_ICONS[s.icon] || ''}</span>
        <span class="nav-sub-text">
          <span class="nav-sub-title">${s.title}</span>
          <span class="nav-sub-desc">${s.desc}</span>
        </span>
      </a>
    `).join('');
    return `
      <div class="nav-acc-item">
        <button type="button" class="nav-acc-trigger" aria-expanded="false" data-acc="${idx}">
          <span>${item.title}</span> ${NAV_ICONS.chev}
        </button>
        <div class="nav-acc-content">${subs}</div>
      </div>
    `;
  }
  return `<a href="${item.url}" class="nav-acc-link">${item.title}</a>`;
}

function renderNav() {
  const desktopMenu = NAV_MENU.map(renderDesktopMenuItem).join('');
  const mobileMenu = NAV_MENU.map(renderMobileMenuItem).join('');
  return `
    <header class="nav-header">
      <div class="nav-container">
        <!-- Desktop -->
        <nav class="nav-desktop">
          <div class="nav-left">
            <a href="/hub.html" class="nav-logo">${SINDI_LOGO_SVG}</a>
            <ul class="nav-menu">${desktopMenu}</ul>
          </div>
          <div class="nav-right">
            <a href="/perfil.html" class="nav-btn-outline" title="Meu perfil">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Perfil
            </a>
            <a href="/admin.html" class="nav-btn-outline nav-admin-link" id="navAdminLink" hidden title="Admin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Admin
            </a>
            <a href="/api/logout" class="nav-btn-outline">${NAV_ICONS.logout} Sair</a>
          </div>
        </nav>
        <!-- Mobile -->
        <nav class="nav-mobile">
          <a href="/hub.html" class="nav-logo">${SINDI_LOGO_SVG}</a>
          <button class="nav-burger" id="navBurger" aria-label="Abrir menu" aria-expanded="false">
            ${NAV_ICONS.menu}
          </button>
        </nav>
      </div>
    </header>

    <!-- Sheet (mobile) -->
    <div class="nav-sheet-overlay" id="navSheetOverlay"></div>
    <aside class="nav-sheet" id="navSheet" role="dialog" aria-label="Menu" aria-hidden="true">
      <header class="nav-sheet-head">
        <a href="/hub.html" class="nav-logo">${SINDI_LOGO_SVG}</a>
        <button class="nav-sheet-close" id="navSheetClose" aria-label="Fechar">${NAV_ICONS.close}</button>
      </header>
      <div class="nav-sheet-body">
        <div class="nav-acc">${mobileMenu}</div>
        <div class="nav-sheet-footer">
          <a href="/perfil.html" class="nav-btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21v-2a4 4 0 014-4h10a4 4 0 014 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Meu perfil
          </a>
          <a href="/admin.html" class="nav-btn-outline nav-admin-link" hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Painel Admin
          </a>
          <a href="/api/logout" class="nav-btn-outline">${NAV_ICONS.logout} Sair</a>
        </div>
      </div>
    </aside>
  `;
}

function setupNavInteractions() {
  // Detecta se é admin → mostra link Admin
  fetch('/api/sindi-os?action=me-stats').then(r => r.ok ? r.json() : null).then(d => {
    if (d?.isAdmin) {
      document.querySelectorAll('.nav-admin-link').forEach(el => el.hidden = false);
    }
  }).catch(() => {});

  // Desktop dropdowns: hover + click
  document.querySelectorAll('.nav-menu-item.has-submenu').forEach(item => {
    const trigger = item.querySelector('.nav-trigger');
    let timeout;
    const open = () => {
      clearTimeout(timeout);
      document.querySelectorAll('.nav-menu-item.has-submenu.is-open').forEach(el => {
        if (el !== item) el.classList.remove('is-open');
      });
      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      timeout = setTimeout(() => {
        item.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }, 150);
    };
    item.addEventListener('mouseenter', open);
    item.addEventListener('mouseleave', close);
    trigger.addEventListener('click', e => {
      e.preventDefault();
      item.classList.contains('is-open') ? (item.classList.remove('is-open'), trigger.setAttribute('aria-expanded','false')) : open();
    });
  });
  // Click outside fecha dropdowns
  document.addEventListener('click', e => {
    if (!e.target.closest('.nav-menu-item.has-submenu')) {
      document.querySelectorAll('.nav-menu-item.has-submenu.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.nav-trigger')?.setAttribute('aria-expanded','false');
      });
    }
  });

  // Mobile sheet
  const sheet = document.getElementById('navSheet');
  const overlay = document.getElementById('navSheetOverlay');
  const burger = document.getElementById('navBurger');
  const close = document.getElementById('navSheetClose');
  const openSheet = () => {
    sheet.classList.add('is-open');
    overlay.classList.add('is-open');
    sheet.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeSheet = () => {
    sheet.classList.remove('is-open');
    overlay.classList.remove('is-open');
    sheet.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };
  burger?.addEventListener('click', openSheet);
  close?.addEventListener('click', closeSheet);
  overlay?.addEventListener('click', closeSheet);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheet.classList.contains('is-open')) closeSheet();
  });

  // Mobile accordion
  document.querySelectorAll('.nav-acc-trigger').forEach(t => {
    t.addEventListener('click', () => {
      const item = t.closest('.nav-acc-item');
      const isOpen = item.classList.contains('is-open');
      document.querySelectorAll('.nav-acc-item.is-open').forEach(el => {
        el.classList.remove('is-open');
        el.querySelector('.nav-acc-trigger')?.setAttribute('aria-expanded','false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        t.setAttribute('aria-expanded','true');
      }
    });
  });
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
  if (navSlot) {
    navSlot.innerHTML = renderNav();
    setupNavInteractions();
  }
  const footSlot = document.getElementById('app-footer');
  if (footSlot) footSlot.innerHTML = renderFooter();
  // Inicia o background animado depois do paint inicial
  setTimeout(initDottedSurface, 100);
});
