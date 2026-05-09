// =====================================================================
// TOOL HELPERS — utilitários compartilhados pelas ferramentas
// =====================================================================
window.ToolUI = {
  setStatus(text, type = '') {
    const el = document.getElementById('status');
    const t  = document.getElementById('statusText');
    if (!el || !t) return;
    el.className = 'tool-status show' + (type ? ' ' + type : '');
    t.textContent = text;
  },
  hideStatus() {
    document.getElementById('status')?.classList.remove('show');
  },
  setProgress(pct) {
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = pct + '%';
  },
  showResult(html) {
    const el = document.getElementById('result');
    const body = document.getElementById('resultBody');
    if (!el || !body) return;
    body.innerHTML = html;
    el.classList.add('show');
  },
  hideResult() {
    document.getElementById('result')?.classList.remove('show');
  },
  fileLabel(file) {
    return `${file.name} <span style="opacity:0.7;font-weight:400">(${(file.size/1024/1024).toFixed(1)} MB)</span>`;
  },
};

window.ToolFile = {
  setupDropZone({ dropZoneId = 'dropZone', fileInputId = 'fileInput', titleId = 'dropTitle', processBtnId = 'processBtn', accept = null, onFile }) {
    const drop = document.getElementById(dropZoneId);
    const input = document.getElementById(fileInputId);
    const title = document.getElementById(titleId);
    const btn = document.getElementById(processBtnId);
    if (!drop || !input) return;

    ['dragenter','dragover'].forEach(ev =>
      drop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); drop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev =>
      drop.addEventListener(ev, e => { e.preventDefault(); e.stopPropagation(); drop.classList.remove('dragover'); }));

    function handle(f) {
      if (!f) return;
      if (accept && !accept(f)) {
        if (title) title.innerHTML = `<span style="color:#fca5a5">⚠ Formato não suportado: ${f.name}</span>`;
        return;
      }
      if (title) title.innerHTML = `<span class="file-selected">${ToolFile.escapeHtml(f.name)} <span style="opacity:0.7;font-weight:400">(${(f.size/1024/1024).toFixed(1)} MB)</span></span>`;
      if (btn) btn.disabled = false;
      onFile?.(f);
    }

    drop.addEventListener('drop', e => {
      const f = e.dataTransfer.files[0];
      if (f) { input.files = e.dataTransfer.files; handle(f); }
    });
    input.addEventListener('change', e => handle(e.target.files[0]));
  },
  escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  },
  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async readPdfBytes(file) {
    return new Uint8Array(await file.arrayBuffer());
  },
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onloadend = () => {
        const s = String(r.result || '');
        const idx = s.indexOf(',');
        resolve(idx >= 0 ? s.slice(idx + 1) : s);
      };
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  },
};

// Helper genérico de chamada Gemini pra resumo/tradução com PDF
window.ToolAI = {
  async callGeminiWithFile(file, prompt, opts = {}) {
    const b64 = await ToolFile.fileToBase64(file);
    const res = await fetch('/api/gemini-doc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: b64,
        mimeType: file.type || 'application/pdf',
        prompt,
        mode: opts.mode || 'flash',
      }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `Falha (${res.status})`);
    }
    return res.json();
  },
};
