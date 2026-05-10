// =============================================================================
// SINDICOMPANY HUB — SHARED HELPERS
// =============================================================================

// Logo Sindicompany — usa o PNG oficial (texto branco para tema dark)
const SINDI_LOGO_SVG = `<img src="/assets/brand/icon-color.png" alt="Sindicompany" class="sindi-logo-img">`;

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
            <button id="notifBell" class="nav-btn-outline nav-bell" title="Notificações" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
              <span class="bell-count" id="bellCount" hidden>0</span>
            </button>
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

    <!-- Popover de notificações -->
    <div class="nav-popover" id="notifPopover" hidden style="display:none">
      <header><strong>Notificações</strong> <button id="notifMarkAll">Marcar todas como lidas</button></header>
      <div class="nav-popover-list" id="notifList"></div>
    </div>

  `;
}

function setupNavInteractions() {
  // Detecta se é admin + carrega perfil pra preencher condos + mostra notificações
  fetch('/api/sindi-os?action=me-stats').then(r => r.ok ? r.json() : null).then(d => {
    if (!d) return;
    if (d.isAdmin) document.querySelectorAll('.nav-admin-link').forEach(el => el.hidden = false);
  }).catch(() => {});

  setupNotifBell();

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
  // Local (rápido pra dashboard pessoal)
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

  // Server (pra email diário e analytics) — fire and forget, ignora erro
  try {
    fetch('/api/track-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: toolSlug, meta }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
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
// =============================================================================
// CONDO SELECTOR + NOTIFICATIONS BELL — globais
// =============================================================================
let _activeCondo = null;

function setupCondoSelector(profile) {
  const btn = document.getElementById('condoSelector');
  const label = document.getElementById('condoLabel');
  if (!btn) return;
  // Carrega condomínios do perfil
  const condos = (profile?.condos || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
  if (!condos.length) {
    btn.hidden = true;
    return;
  }
  btn.hidden = false;
  // Popula popover
  const list = document.getElementById('condoList');
  if (list) {
    list.innerHTML = condos.map(c =>
      `<button class="nav-popover-item" data-condo="${c.replace(/"/g, '&quot;')}">${c}</button>`
    ).join('');
    list.querySelectorAll('[data-condo]').forEach(el => {
      el.addEventListener('click', () => setActiveCondo(el.dataset.condo));
    });
  }
  // Carrega selecionado atual via API
  fetch('/api/sindi-os', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'profile' /* placeholder noop */ })
  }).catch(() => {});
  // Pega valor salvo do localStorage como cache visual rápido
  const cached = localStorage.getItem('sf_active_condo');
  if (cached) {
    _activeCondo = cached;
    label.textContent = cached.length > 22 ? cached.slice(0, 20) + '…' : cached;
    btn.classList.add('has-value');
  }
}

async function setActiveCondo(condo) {
  _activeCondo = condo;
  localStorage.setItem('sf_active_condo', condo);
  const label = document.getElementById('condoLabel');
  const btn = document.getElementById('condoSelector');
  if (label) label.textContent = condo.length > 22 ? condo.slice(0, 20) + '…' : condo;
  if (btn) btn.classList.add('has-value');
  document.getElementById('condoPopover').hidden = true;
  await fetch('/api/sindi-os', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'set-active-condo', condo })
  });
}

// Helpers globais — única forma de abrir popover (class-based, à prova de cache CSS)
function _hidePopover(el) {
  if (!el) return;
  el.classList.remove('is-open');
  el.hidden = true;
  el.style.display = '';
}
function _showPopover(el) {
  if (!el) return;
  // Fecha todos os outros primeiro
  document.querySelectorAll('.nav-popover').forEach(p => p !== el && _hidePopover(p));
  el.hidden = false;
  el.classList.add('is-open');
}
function _isPopoverOpen(el) {
  return el && el.classList.contains('is-open');
}

function setupCondoPopover() {
  const btn = document.getElementById('condoSelector');
  const pop = document.getElementById('condoPopover');
  if (!btn || !pop) return;
  // FORÇA hidden inicial
  _hidePopover(pop);

  btn.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = _isPopoverOpen(pop);
    if (isOpen) _hidePopover(pop);
    else _showPopover(pop);
  });
  document.getElementById('condoCustomSet')?.addEventListener('click', () => {
    const v = document.getElementById('condoCustom').value.trim();
    if (v) setActiveCondo(v);
  });
  document.getElementById('condoClear')?.addEventListener('click', async () => {
    _activeCondo = null;
    localStorage.removeItem('sf_active_condo');
    const label = document.getElementById('condoLabel');
    if (label) label.textContent = 'Condomínio';
    btn.classList.remove('has-value');
    _hidePopover(pop);
    await fetch('/api/sindi-os', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set-active-condo', condo: '' })
    });
  });
}

function setupNotifBell() {
  const bell = document.getElementById('notifBell');
  const pop = document.getElementById('notifPopover');
  const list = document.getElementById('notifList');
  const count = document.getElementById('bellCount');
  if (!bell || !pop || !list) return;
  // FORÇA hidden inicial
  _hidePopover(pop);

  async function load() {
    try {
      const r = await fetch('/api/sindi-os?action=notifications');
      if (!r.ok) return;
      const { notifications, unread } = await r.json();
      if (unread > 0) { count.hidden = false; count.textContent = unread > 9 ? '9+' : String(unread); }
      else { count.hidden = true; }
      if (!notifications.length) {
        list.innerHTML = '<div class="nav-popover-empty">Nenhuma notificação ainda.</div>';
        return;
      }
      list.innerHTML = notifications.map(n => `
        <div class="nav-popover-notif ${n.read ? '' : 'unread'}">
          <div class="notif-title">${(n.title || '').replace(/[<>]/g, '')}</div>
          <div class="notif-body">${(n.body || '').replace(/[<>]/g, '')}</div>
          <div class="notif-meta">${fmtRelTime(n.ts)} ${n.link ? `· <a href="${n.link}">abrir</a>` : ''}</div>
        </div>
      `).join('');
    } catch (e) {}
  }

  bell.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = _isPopoverOpen(pop);
    if (isOpen) _hidePopover(pop);
    else { _showPopover(pop); load(); }
  });
  document.getElementById('notifMarkAll')?.addEventListener('click', async () => {
    await fetch('/api/sindi-os', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notif-read', id: '*' })
    });
    load();
  });
  // Carrega contador (sem mostrar popover)
  load();
  setInterval(load, 60000);
}

// Global: clique em qualquer lugar fora dos popovers fecha todos
document.addEventListener('click', e => {
  const insidePop = e.target.closest('.nav-popover');
  const insideTrigger = e.target.closest('#condoSelector, #notifBell');
  if (!insidePop && !insideTrigger) {
    document.querySelectorAll('.nav-popover').forEach(p => _hidePopover(p));
  }
});
// Esc fecha
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.nav-popover').forEach(p => _hidePopover(p));
  }
});

function fmtRelTime(ts) {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'agora';
  if (sec < 3600) return `${Math.floor(sec/60)}min`;
  if (sec < 86400) return `${Math.floor(sec/3600)}h`;
  return `${Math.floor(sec/86400)}d`;
}

// =============================================================================
// CMD+K — Command Palette global
// =============================================================================
// Cada ferramenta + página. Acionável com Cmd+K (Mac) ou Ctrl+K (Win/Linux).
// Indexa nome, descrição e palavras-chave (português) pra busca natural.
const CMDK_INDEX = [
  // --- Páginas principais ---
  { kind: 'page', id: 'hub',       name: 'Hub',         desc: 'Página inicial do hub Sindicompany',     url: '/hub.html',       kw: 'hub inicio home' },
  { kind: 'page', id: 'dashboard', name: 'Dashboard',   desc: 'Métricas de uso e tempo economizado',    url: '/dashboard.html', kw: 'dashboard metricas uso analytics' },
  { kind: 'page', id: 'perfil',    name: 'Perfil',      desc: 'Seu perfil e preferências',              url: '/perfil.html',    kw: 'perfil conta usuario profile' },
  { kind: 'page', id: 'admin',     name: 'Admin',       desc: 'Configuração administrativa',            url: '/admin.html',     kw: 'admin configuracao settings' },

  // --- IA ---
  { kind: 'tool', id: 'sindi',           name: 'Sindi (IA)',           desc: 'Copiloto IA generativo da equipe',                            url: '/tools/sindi.html',              kw: 'ia inteligencia artificial chat copiloto bot gemini sindi assistente' },
  { kind: 'tool', id: 'corretor-texto',  name: 'Corretor de Texto',    desc: 'Correção ortográfica/gramatical PT-BR',                       url: '/tools/corretor-texto.html',     kw: 'corretor ortografia gramatica revisao texto portugues' },
  { kind: 'tool', id: 'resumir-pdf',     name: 'Resumir PDF com IA',   desc: 'Resumo executivo, detalhado, ação ou risco',                  url: '/tools/resumir-pdf.html',        kw: 'resumir resumo sumario sintese pdf ia gemini executivo' },
  { kind: 'tool', id: 'traduzir-pdf',    name: 'Traduzir PDF com IA',  desc: 'Tradução natural multi-idioma preservando layout',            url: '/tools/traduzir-pdf.html',       kw: 'traduzir traducao translate pdf ingles espanhol frances ia gemini' },

  // --- Geradores ---
  { kind: 'tool', id: 'gerador-notificacao', name: 'Notificação',  desc: 'Gera notificação extrajudicial pronta',     url: '/tools/gerador-notificacao.html', kw: 'notificacao multa advertencia inadimplencia condomino' },
  { kind: 'tool', id: 'gerador-ata',         name: 'Ata',          desc: 'Wizard de ata de assembleia',               url: '/tools/gerador-ata.html',         kw: 'ata assembleia reuniao ordinaria extraordinaria' },
  { kind: 'tool', id: 'gerador-contrato',    name: 'Contrato',     desc: 'Modelos de prestação, locação, manutenção', url: '/tools/gerador-contrato.html',    kw: 'contrato prestacao servico locacao acordo' },
  { kind: 'tool', id: 'wizard-inadimplencia', name: 'Wizard Inadimplência', desc: 'Fluxo de cobrança guiado',         url: '/tools/wizard-inadimplencia.html',kw: 'inadimplencia cobranca taxa atraso wizard' },

  // --- Calculadoras ---
  { kind: 'tool', id: 'calculadoras', name: 'Calculadoras', desc: 'Reajuste, multa, rateio, projeção de caixa', url: '/tools/calculadoras.html', kw: 'calculo calculadora rateio reajuste juros multa' },

  // --- Conversões ---
  { kind: 'tool', id: 'word-para-pdf',   name: 'Word → PDF',     desc: 'Converte .docx em PDF',                          url: '/tools/word-para-pdf.html',   kw: 'word docx pdf converter conversao documento' },
  { kind: 'tool', id: 'excel-para-pdf',  name: 'Excel → PDF',    desc: 'Converte .xlsx em PDF (múltiplas abas)',         url: '/tools/excel-para-pdf.html',  kw: 'excel xlsx planilha pdf converter' },
  { kind: 'tool', id: 'pdf-para-excel',  name: 'PDF → Excel',    desc: 'Extrai tabelas de PDFs em planilha',             url: '/tools/pdf-para-excel.html',  kw: 'pdf excel xlsx tabela extrair' },
  { kind: 'tool', id: 'pdf-para-jpg',    name: 'PDF → JPG',      desc: 'Converte páginas em imagem JPG',                 url: '/tools/pdf-para-jpg.html',    kw: 'pdf jpg imagem foto pagina' },
  { kind: 'tool', id: 'jpg-para-pdf',    name: 'Imagens → PDF',  desc: 'Junta várias imagens em um PDF',                 url: '/tools/jpg-para-pdf.html',    kw: 'jpg png imagem pdf juntar combinar' },
  { kind: 'tool', id: 'conversor-imagens', name: 'Conversor de Imagens', desc: 'PNG ↔ JPG ↔ WEBP, redimensiona em lote', url: '/tools/conversor-imagens.html', kw: 'imagem png jpg webp redimensionar comprimir' },
  { kind: 'tool', id: 'html-para-pdf',   name: 'HTML → PDF',           desc: 'Converte página web ou HTML em PDF',           url: '/tools/html-para-pdf.html',     kw: 'html para pdf web pagina url converter' },
  { kind: 'tool', id: 'pdf-para-word',   name: 'PDF → Word',           desc: 'Converte PDF para .docx (em desenvolvimento)', url: '/tools/pdf-para-word.html',     kw: 'pdf para word docx conversao em breve' },
  { kind: 'tool', id: 'pdf-para-powerpoint', name: 'PDF → PowerPoint', desc: 'Cada página vira slide (em desenvolvimento)',  url: '/tools/pdf-para-powerpoint.html', kw: 'pdf para powerpoint pptx slide apresentacao em breve' },
  { kind: 'tool', id: 'powerpoint-para-pdf', name: 'PowerPoint → PDF', desc: 'Converte .pptx para PDF (em desenvolvimento)', url: '/tools/powerpoint-para-pdf.html', kw: 'powerpoint pptx para pdf conversao em breve' },
  { kind: 'tool', id: 'pdf-para-pdfa',   name: 'PDF → PDF/A',          desc: 'Conformidade ISO 19005 (em desenvolvimento)',  url: '/tools/pdf-para-pdfa.html',     kw: 'pdf pdfa iso 19005 arquivamento conformidade em breve' },

  // --- PDF ---
  { kind: 'tool', id: 'editor-pdf',      name: 'Editor de PDF',     desc: 'Adiciona texto, destaque, anotação',    url: '/tools/editor-pdf.html',     kw: 'editor pdf editar anotar destacar' },
  { kind: 'tool', id: 'juntar-pdf',      name: 'Juntar PDF',        desc: 'Combina vários PDFs em um arquivo',     url: '/tools/juntar-pdf.html',     kw: 'juntar combinar merge pdf arquivos' },
  { kind: 'tool', id: 'dividir-pdf',     name: 'Dividir PDF',       desc: 'Separa páginas ou intervalos',          url: '/tools/dividir-pdf.html',    kw: 'dividir split separar pdf paginas' },
  { kind: 'tool', id: 'comprimir-pdf',   name: 'Comprimir PDF',     desc: 'Reduz tamanho do arquivo',              url: '/tools/comprimir-pdf.html',  kw: 'comprimir reduzir tamanho pdf otimizar' },
  { kind: 'tool', id: 'comparar-pdf',    name: 'Comparar Documentos', desc: 'Diff visual entre versões',           url: '/tools/comparar-pdf.html',   kw: 'comparar diff diferenca pdf versao' },
  { kind: 'tool', id: 'reparar-pdf',     name: 'Reparar PDF',       desc: 'Recupera PDFs danificados ou corrompidos', url: '/tools/reparar-pdf.html',  kw: 'reparar recuperar danificado corrompido pdf consertar' },
  { kind: 'tool', id: 'recortar-pdf',    name: 'Recortar PDF',      desc: 'Remove margens (crop) em todas páginas',  url: '/tools/recortar-pdf.html',  kw: 'recortar crop margem corte aparar pdf' },
  { kind: 'tool', id: 'formularios-pdf', name: 'Formulários PDF',   desc: 'Detecta, preenche e cria formulários (em desenvolvimento)', url: '/tools/formularios-pdf.html', kw: 'formulario form pdf preencher campos em breve' },

  // --- Organização ---
  { kind: 'tool', id: 'organizar-pdf',   name: 'Organizar Páginas',  desc: 'Reordena e remove páginas',            url: '/tools/organizar-pdf.html',  kw: 'organizar ordem pagina pdf arrastar' },
  { kind: 'tool', id: 'girar-pdf',       name: 'Girar PDF',          desc: 'Rotaciona páginas',                    url: '/tools/girar-pdf.html',      kw: 'girar rotacao rotate pdf pagina' },
  { kind: 'tool', id: 'numerar-paginas', name: 'Numerar Páginas',    desc: 'Adiciona número em cada página',       url: '/tools/numerar-paginas.html',kw: 'numerar numero pagina pdf' },
  { kind: 'tool', id: 'marca-dagua',     name: 'Marca d\'água',      desc: 'Texto como marca d\'água',             url: '/tools/marca-dagua.html',    kw: 'marca dagua watermark pdf texto' },

  // --- Documentos ---
  { kind: 'tool', id: 'whatsapp-fotos',  name: 'Fotos do WhatsApp', desc: 'Extrai fotos com legenda/data/remetente', url: '/tools/whatsapp-fotos.html', kw: 'whatsapp fotos midia legenda export zip' },
  { kind: 'tool', id: 'ocr',             name: 'OCR',               desc: 'Extrai texto de fotos e PDFs escaneados', url: '/tools/ocr.html',            kw: 'ocr texto imagem foto reconhecimento scan' },
  { kind: 'tool', id: 'digitalizar-pdf', name: 'Digitalizar (Câmera)', desc: 'Escaneia documentos físicos pela câmera (em desenvolvimento)', url: '/tools/digitalizar-pdf.html', kw: 'digitalizar escanear scan camera celular pdf em breve' },

  // --- Segurança ---
  { kind: 'tool', id: 'proteger-pdf',    name: 'Proteger PDF',         desc: 'Senha AES-256',                  url: '/tools/proteger-pdf.html',    kw: 'proteger senha lock criptografia pdf' },
  { kind: 'tool', id: 'desbloquear-pdf', name: 'Desbloquear PDF',      desc: 'Remove senha (sabendo a senha)', url: '/tools/desbloquear-pdf.html', kw: 'desbloquear remover senha unlock pdf' },
  { kind: 'tool', id: 'redigir-lgpd',    name: 'Redigir LGPD',         desc: 'Tarja CPF/RG/email/telefone',    url: '/tools/redigir-lgpd.html',    kw: 'lgpd redigir tarjar cpf rg email privacidade' },
  { kind: 'tool', id: 'assinatura',      name: 'Assinatura Eletrônica', desc: 'Assina PDF com trilha de auditoria', url: '/tools/assinatura.html', kw: 'assinatura assinar pdf eletronica digital' },
  { kind: 'tool', id: 'ocultar-pdf',     name: 'Ocultar PDF',          desc: 'Tarja manual irreversível (em desenvolvimento)', url: '/tools/ocultar-pdf.html', kw: 'ocultar tarjar redact apagar areas pdf em breve' },

  // --- Automação ---
  { kind: 'tool', id: 'workflows',       name: 'Fluxos de trabalho',   desc: 'Encadeie ferramentas em sequências (em desenvolvimento)', url: '/tools/workflows.html', kw: 'workflow fluxo automacao sequencia em breve' },
];

const CMDK_RECENTS_KEY = 'sf_cmdk_recents';
function cmdkRecents() {
  try { return JSON.parse(localStorage.getItem(CMDK_RECENTS_KEY) || '[]'); } catch { return []; }
}
function cmdkAddRecent(id) {
  let rec = cmdkRecents().filter(r => r !== id);
  rec.unshift(id);
  rec = rec.slice(0, 5);
  try { localStorage.setItem(CMDK_RECENTS_KEY, JSON.stringify(rec)); } catch {}
}

function setupCmdK() {
  if (document.getElementById('cmdk-backdrop')) return;
  const dom = document.createElement('div');
  dom.innerHTML = `
    <div id="cmdk-backdrop" class="cmdk-backdrop" hidden role="dialog" aria-modal="true" aria-label="Comandos">
      <div class="cmdk-modal" id="cmdk-modal">
        <div class="cmdk-input-wrap">
          <svg class="cmdk-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="cmdk-input" type="text" placeholder="Buscar ferramenta, página, ação…" autocomplete="off" spellcheck="false">
          <kbd class="cmdk-esc">esc</kbd>
        </div>
        <div id="cmdk-list" class="cmdk-list"></div>
        <div class="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navegar</span>
          <span><kbd>↵</kbd> abrir</span>
          <span><kbd>esc</kbd> fechar</span>
          <span class="cmdk-foot-spacer"></span>
          <span class="cmdk-brand">Sindicompany</span>
        </div>
      </div>
    </div>`;
  document.body.appendChild(dom.firstElementChild);

  const backdrop = document.getElementById('cmdk-backdrop');
  const input    = document.getElementById('cmdk-input');
  const list     = document.getElementById('cmdk-list');
  let active = 0;
  let results = [];

  function open() {
    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = '';
    render('');
    requestAnimationFrame(() => input.focus());
  }
  function close() {
    backdrop.hidden = true;
    document.body.style.overflow = '';
  }
  function score(item, q) {
    if (!q) return 1;
    const hay = `${item.name} ${item.desc} ${item.kw || ''}`.toLowerCase();
    const ql = q.toLowerCase();
    if (item.name.toLowerCase() === ql) return 100;
    if (item.name.toLowerCase().startsWith(ql)) return 50;
    if (hay.includes(ql)) return 10;
    // tokens (todas precisam estar em alguma parte)
    const tokens = ql.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every(t => hay.includes(t))) return 5;
    return 0;
  }
  function render(q) {
    const ranked = CMDK_INDEX
      .map(it => ({ it, s: score(it, q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);

    // Quando query vazia, mostra recentes primeiro, depois resto
    if (!q) {
      const recents = cmdkRecents();
      const recItems = recents
        .map(id => CMDK_INDEX.find(i => i.id === id))
        .filter(Boolean);
      const recIds = new Set(recItems.map(i => i.id));
      const rest = ranked.map(r => r.it).filter(i => !recIds.has(i.id));
      results = [...recItems.map(i => ({ ...i, _section: 'Recentes' })), ...rest];
    } else {
      results = ranked.map(r => r.it);
    }

    if (!results.length) {
      list.innerHTML = `<div class="cmdk-empty">Nada encontrado pra "${q}". <kbd>esc</kbd> pra fechar.</div>`;
      return;
    }
    let lastSection = null;
    let html = '';
    results.forEach((item, i) => {
      if (item._section && item._section !== lastSection) {
        html += `<div class="cmdk-section-title">${item._section}</div>`;
        lastSection = item._section;
      } else if (!item._section && lastSection !== '_main') {
        if (lastSection) html += `<div class="cmdk-section-title">Tudo</div>`;
        lastSection = '_main';
      }
      const tag = item.kind === 'page' ? 'Página' : item.kind === 'tool' ? 'Ferramenta' : '';
      html += `
        <div class="cmdk-item${i === active ? ' is-active' : ''}" data-idx="${i}">
          <div class="cmdk-item-main">
            <div class="cmdk-item-name">${item.name}</div>
            <div class="cmdk-item-desc">${item.desc}</div>
          </div>
          <div class="cmdk-item-tag">${tag}</div>
        </div>`;
    });
    list.innerHTML = html;
    // scroll active into view
    const el = list.querySelector('.cmdk-item.is-active');
    if (el) el.scrollIntoView({ block: 'nearest' });
  }
  function go(idx) {
    const item = results[idx];
    if (!item) return;
    cmdkAddRecent(item.id);
    close();
    if (item.url) location.href = item.url;
  }

  input.addEventListener('input', () => { active = 0; render(input.value.trim()); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, results.length - 1); render(input.value.trim()); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); render(input.value.trim()); }
    else if (e.key === 'Enter') { e.preventDefault(); go(active); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  list.addEventListener('click', e => {
    const el = e.target.closest('.cmdk-item');
    if (!el) return;
    const idx = parseInt(el.dataset.idx, 10);
    if (!isNaN(idx)) go(idx);
  });
  list.addEventListener('mousemove', e => {
    const el = e.target.closest('.cmdk-item');
    if (!el) return;
    const idx = parseInt(el.dataset.idx, 10);
    if (!isNaN(idx) && idx !== active) { active = idx; render(input.value.trim()); }
  });
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  document.addEventListener('keydown', e => {
    // Cmd+K (Mac) ou Ctrl+K (Win/Linux)
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      backdrop.hidden ? open() : close();
    }
    // "/" abre cmdk se nada estiver focado
    else if (e.key === '/' && backdrop.hidden) {
      const tag = document.activeElement?.tagName;
      const editable = document.activeElement?.isContentEditable;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && !editable) {
        e.preventDefault();
        open();
      }
    }
  });

  // Expõe API global pra outros módulos abrirem
  window.SindiCmdK = { open, close };
}

// =============================================================================
// SINDI FLUTUANTE — botão fixo bottom-right + drawer com mini-chat
// =============================================================================
// Aparece em todas as páginas (exceto na própria sindi.html, login, index).
function setupSindiFloat() {
  // Não duplicar e não mostrar onde já há Sindi nativa
  if (document.getElementById('sindi-float')) return;
  const path = location.pathname;
  if (path === '/tools/sindi.html' || path === '/login.html' || path === '/' || path === '/index.html') return;

  const btn = document.createElement('button');
  btn.id = 'sindi-float';
  btn.className = 'sindi-float';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Abrir Sindi (IA)');
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 8V4H8"/><rect x="4" y="8" width="16" height="12" rx="2"/>
      <path d="M2 14h2M20 14h2M15 13v2M9 13v2"/>
    </svg>
    <span class="sindi-float-label">Sindi</span>`;
  document.body.appendChild(btn);

  const drawer = document.createElement('div');
  drawer.id = 'sindi-drawer';
  drawer.className = 'sindi-drawer';
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="sindi-drawer-head">
      <div class="sindi-drawer-title">
        <span class="sindi-drawer-dot"></span>
        Sindi
      </div>
      <a class="sindi-drawer-expand" href="/tools/sindi.html" title="Abrir tela cheia">⤢</a>
      <button class="sindi-drawer-close" type="button" aria-label="Fechar">×</button>
    </div>
    <div class="sindi-drawer-msgs" id="sindi-drawer-msgs">
      <div class="sindi-drawer-empty">
        <div class="sindi-drawer-empty-title">Em que posso ajudar?</div>
        <div class="sindi-drawer-empty-sub">Pergunte sobre condomínio, redija um comunicado, peça um cálculo, qualquer coisa.</div>
      </div>
    </div>
    <form class="sindi-drawer-input" id="sindi-drawer-form">
      <input type="text" id="sindi-drawer-text" placeholder="Pergunte algo à Sindi…" autocomplete="off">
      <button type="submit" class="sindi-drawer-send" aria-label="Enviar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
      </button>
    </form>`;
  document.body.appendChild(drawer);

  const msgsEl = drawer.querySelector('#sindi-drawer-msgs');
  const form   = drawer.querySelector('#sindi-drawer-form');
  const input  = drawer.querySelector('#sindi-drawer-text');
  const messages = []; // memória curta da conversa neste drawer

  function open() { drawer.hidden = false; requestAnimationFrame(() => input.focus()); }
  function close() { drawer.hidden = true; }
  btn.addEventListener('click', () => drawer.hidden ? open() : close());
  drawer.querySelector('.sindi-drawer-close').addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) close(); });

  function bubbleHTML(role, text) {
    const cls = role === 'user' ? 'sd-msg sd-user' : 'sd-msg sd-bot';
    return `<div class="${cls}"><div class="sd-bubble">${escapeHtml(text)}</div></div>`;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function send(text) {
    msgsEl.querySelector('.sindi-drawer-empty')?.remove();
    msgsEl.insertAdjacentHTML('beforeend', bubbleHTML('user', text));
    messages.push({ role: 'user', content: text });
    msgsEl.scrollTop = msgsEl.scrollHeight;

    // bolha "pensando"
    const botWrap = document.createElement('div');
    botWrap.className = 'sd-msg sd-bot';
    botWrap.innerHTML = `<div class="sd-bubble sd-streaming"><span class="sd-typing">...</span></div>`;
    msgsEl.appendChild(botWrap);
    const bubble = botWrap.querySelector('.sd-bubble');

    try {
      const res = await fetch('/api/sindi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, mode: null }),
      });
      const ctype = res.headers.get('Content-Type') || '';
      if (!res.ok || !ctype.includes('text/event-stream')) {
        const data = await res.json().catch(() => ({}));
        bubble.classList.remove('sd-streaming');
        bubble.innerHTML = `<span class="sd-err">⚠️ ${escapeHtml(data.error || 'Erro')}</span>`;
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let full = '';
      bubble.innerHTML = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() || '';
        for (const ev of events) {
          let dataStr = '';
          let evType = 'message';
          for (const ln of ev.split('\n')) {
            if (ln.startsWith('event: ')) evType = ln.slice(7).trim();
            else if (ln.startsWith('data: ')) dataStr += ln.slice(6);
          }
          if (!dataStr || dataStr.trim() === '[DONE]') continue;
          try {
            const json = JSON.parse(dataStr);
            if (evType === 'meta') continue;
            const cand = json.candidates?.[0];
            for (const part of cand?.content?.parts || []) {
              if (part.text) full += part.text;
            }
            // markdown leve via formatMd se disponível, senão texto puro
            bubble.innerHTML = (typeof formatMd === 'function')
              ? formatMd(full)
              : escapeHtml(full).replace(/\n/g, '<br>');
          } catch {}
        }
        msgsEl.scrollTop = msgsEl.scrollHeight;
      }
      bubble.classList.remove('sd-streaming');
      messages.push({ role: 'assistant', content: full });
    } catch (e) {
      bubble.classList.remove('sd-streaming');
      bubble.innerHTML = `<span class="sd-err">⚠️ Sem conexão</span>`;
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const t = input.value.trim();
    if (!t) return;
    input.value = '';
    send(t);
  });
}

// =============================================================================
// ONBOARDING HINT — Cmd+K toast na primeira visita do usuário logado
// =============================================================================
function setupCmdKHint() {
  const KEY = 'sf_cmdk_hint_shown';
  if (localStorage.getItem(KEY)) return;
  // Não mostra na landing/login (são páginas públicas)
  const path = location.pathname;
  if (path === '/' || path === '/index.html' || path === '/login.html') return;

  // Mostra depois de 4s pra não interromper o load inicial
  setTimeout(() => {
    if (document.getElementById('cmdk-hint')) return;
    const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || '');
    const key = isMac ? '⌘K' : 'Ctrl+K';
    const hint = document.createElement('div');
    hint.id = 'cmdk-hint';
    hint.className = 'cmdk-hint';
    hint.innerHTML = `
      <div class="cmdk-hint-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <div class="cmdk-hint-text">
        <strong>Acessar tudo rápido:</strong> aperta <kbd>${key}</kbd> a qualquer momento.
      </div>
      <button class="cmdk-hint-close" type="button" aria-label="Fechar">×</button>`;
    document.body.appendChild(hint);
    requestAnimationFrame(() => hint.classList.add('show'));
    const dismiss = () => {
      hint.classList.remove('show');
      setTimeout(() => hint.remove(), 250);
      try { localStorage.setItem(KEY, '1'); } catch {}
    };
    hint.querySelector('.cmdk-hint-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 8000);
  }, 4000);
}

// =============================================================================
// PWA INSTALL — captura beforeinstallprompt + mostra banner discreto em mobile
// =============================================================================
function setupPwaInstall() {
  let deferredPrompt = null;
  const KEY_DISMISSED = 'sf_pwa_install_dismissed';
  const KEY_INSTALLED = 'sf_pwa_installed';

  // Já instalado (display-mode standalone)
  if (window.matchMedia?.('(display-mode: standalone)').matches) {
    try { localStorage.setItem(KEY_INSTALLED, '1'); } catch {}
    return;
  }
  if (localStorage.getItem(KEY_INSTALLED)) return;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    if (localStorage.getItem(KEY_DISMISSED)) return;

    // Mostra banner depois de 6s (depois do hint do Cmd+K)
    setTimeout(showInstallBanner, 6000);
  });

  window.addEventListener('appinstalled', () => {
    try { localStorage.setItem(KEY_INSTALLED, '1'); } catch {}
    document.getElementById('pwa-install')?.remove();
  });

  function showInstallBanner() {
    if (!deferredPrompt) return;
    if (document.getElementById('pwa-install')) return;
    const path = location.pathname;
    if (path === '/' || path === '/index.html' || path === '/login.html') return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install';
    banner.className = 'pwa-install';
    banner.innerHTML = `
      <div class="pwa-install-icon">
        <img src="/assets/brand/icon-color.png" alt="" width="32" height="32" loading="lazy">
      </div>
      <div class="pwa-install-text">
        <strong>Instalar Sindicompany</strong>
        <span>Acesso rápido sem abrir navegador.</span>
      </div>
      <button class="pwa-install-cta" type="button">Instalar</button>
      <button class="pwa-install-close" type="button" aria-label="Fechar">×</button>`;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('show'));

    banner.querySelector('.pwa-install-cta').addEventListener('click', async () => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 200);
      const result = await deferredPrompt.prompt();
      if (result.outcome === 'accepted') {
        try { localStorage.setItem(KEY_INSTALLED, '1'); } catch {}
      }
      deferredPrompt = null;
    });
    banner.querySelector('.pwa-install-close').addEventListener('click', () => {
      banner.classList.remove('show');
      setTimeout(() => banner.remove(), 200);
      try { localStorage.setItem(KEY_DISMISSED, '1'); } catch {}
    });
  }
}

// formatMd simples (caso a página atual não tenha um próprio)
if (typeof window.formatMd !== 'function') {
  window.formatMd = function(text) {
    if (!text) return '';
    let html = String(text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
    return html;
  };
}

// =============================================================================
// Auto-mount nav/footer + DottedSurface + CmdK + SindiFloat
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // PWA: registra service worker + manifest dinâmico
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.webmanifest';
    document.head.appendChild(link);
  }
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

  const navSlot = document.getElementById('app-nav');
  if (navSlot) {
    navSlot.innerHTML = renderNav();
    setupNavInteractions();
  }
  const footSlot = document.getElementById('app-footer');
  if (footSlot) footSlot.innerHTML = renderFooter();
  // Inicia o background animado depois do paint inicial
  setTimeout(initDottedSurface, 100);

  // Cmd+K em todas as páginas
  setupCmdK();
  // Sindi flutuante (exceto sindi.html, login, index)
  setupSindiFloat();
  // Onboarding hint (1ª visita)
  setupCmdKHint();
  // PWA install banner (Android/desktop com beforeinstallprompt)
  setupPwaInstall();
});
