// ============================================================
// STATE
// ============================================================
const state = {
  currentStep: 1,
  data: [],
  headers: [],
  rawHeaders: [],
  fileName: '',
  template: '',
  delayMin: 7,
  delayMax: 12,
  status: 'idle',
  currentIndex: 0,
  results: [],
  tabId: null,
  timeoutId: null,
  rowCount: 0,
  defaultCountry: 'ID',
  extractedData: null,
  extractedGroupName: '',
  attachments: []
};

// ============================================================
// DOM REFERENCES
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  steps: [1, 2, 3].map((n) => ({
    panel: $(`#step${n}`),
    dot: $(`#dot${n}`),
    label: $(`#label${n}`),
    line: $(`#line${n}`)
  })),
  statusBadge: $('#statusBadge'),
  headerTitle: $('.header-title'),
  // Step 1
  dropzone: $('#dropzone'),
  fileInput: $('#fileInput'),
  fileInfo: $('#fileInfo'),
  fileName: $('#fileName'),
  fileMeta: $('#fileMeta'),
  removeFile: $('#removeFile'),
  dataPreview: $('#dataPreview'),
  rowCount: $('#rowCount'),
  columnList: $('#columnList'),
  previewHeader: $('#previewHeader'),
  previewBody: $('#previewBody'),
  toStep2: $('#toStep2'),
  // Step 2
  messageTemplate: $('#messageTemplate'),
  placeholderHints: $('#placeholderHints'),
  previewBox: $('#previewBox'),
  delaySlider: $('#delaySlider'),
  delayValue: $('#delayValue'),
  backTo1: $('#backTo1'),
  toStep3: $('#toStep3'),
  // Step 3
  totalCount: $('#totalCount'),
  successCount: $('#successCount'),
  failCount: $('#failCount'),
  remainingCount: $('#remainingCount'),
  progressFill: $('#progressFill'),
  progressText: $('#progressText'),
  logContainer: $('#logContainer'),
  pauseBtn: $('#pauseBtn'),
  resumeBtn: $('#resumeBtn'),
  stopBtn: $('#stopBtn'),
  downloadBtn: $('#downloadBtn'),
  backTo2: $('#backTo2'),
  finishBtn: $('#finishBtn'),
  backFrom3: $('#backFrom3'),
  countrySelect: $('#countrySelect'),
  downloadTemplate: $('#downloadTemplate'),
  attachmentDropzone: $('#attachmentDropzone'),
  attachmentInput: $('#attachmentInput'),
  attachmentList: $('#attachmentList')
};

// ============================================================
// TOAST
// ============================================================
function toast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ============================================================
// STEP NAVIGATION
// ============================================================
function goToStep(step) {
  state.currentStep = step;
  dom.steps.forEach((s, i) => {
    const num = i + 1;
    s.panel.classList.toggle('active', num === step);
    s.dot.classList.toggle('active', num === step);
    s.dot.classList.toggle('done', num < step);
    s.label.classList.toggle('active', num === step);
    s.label.classList.toggle('done', num < step);
    if (s.line) s.line.classList.toggle('done', num < step);
  });
}

// ============================================================
// FILE HANDLING
// ============================================================
function handleFile(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    toast('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
      const nonEmpty = rows.filter(r => r.some(c => c !== ''));
      if (nonEmpty.length < 2) {
        toast('File kosong atau hanya 1 baris (tidak ada data)', 'error');
        return;
      }

      const rawHeaders = nonEmpty[0].map(h => String(h).trim());
      state.rawHeaders = rawHeaders;
      state.headers = rawHeaders.filter(h => h.length > 0);

      const json = nonEmpty.slice(1).map(row => {
        const obj = {};
        rawHeaders.forEach((h, i) => {
          if (!h) return;
          const val = row[i];
          obj[h] = val !== undefined && val !== null ? String(val).trim() : '';
        });
        return obj;
      });

      console.log('[Pesawat] rawHeaders:', JSON.stringify(rawHeaders));
      console.log('[Pesawat] state.headers:', JSON.stringify(state.headers));
      console.log('[Pesawat] First data row:', JSON.stringify(json[0]));

      if (json.length === 0) {
        toast('Tidak ada data setelah header', 'error');
        return;
      }

      state.data = json;
      state.fileName = file.name;
      state.rowCount = json.length;

      showFileInfo();
      showDataPreview();
      updatePlaceholderHints();
      updatePreview();

      dom.toStep2.disabled = false;
      toast(`Berhasil membaca ${json.length} baris data`, 'success');
    } catch (err) {
      toast('Gagal membaca file: ' + err.message, 'error');
    }
  };
  reader.readAsArrayBuffer(file);
}

function showFileInfo() {
  dom.fileInfo.style.display = 'flex';
  dom.fileName.textContent = state.fileName;
  dom.fileMeta.textContent = `${state.rowCount} kontak • ${state.headers.length} kolom`;
  dom.dropzone.classList.add('has-file');
}

function showDataPreview() {
  dom.dataPreview.style.display = 'block';
  dom.rowCount.textContent = state.rowCount;

  const cols = state.headers.map((h) => {
    const col = document.createElement('span');
    col.className = 'column-tag';
    col.innerHTML = `<var>{{${h}}}</var>`;
    col.title = `Klik untuk menyalip`;
    col.addEventListener('click', () => {
      navigator.clipboard.writeText(`{{${h}}}`).then(() => toast(`Disalin: {{${h}}}`, 'success'));
    });
    return col;
  });
  dom.columnList.replaceChildren(...cols);

  // Table preview (first 5 rows)
  const headerRow = document.createElement('tr');
  headerRow.style.cssText = 'font-size:11px;color:var(--text-secondary);text-align:left';
  state.headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    th.style.padding = '4px 6px';
    headerRow.appendChild(th);
  });
  dom.previewHeader.replaceChildren(headerRow);

  const tbody = document.createDocumentFragment();
  const previewData = state.data.slice(0, 5);
  previewData.forEach((row) => {
    const tr = document.createElement('tr');
    tr.style.cssText = 'border-top:1px solid var(--border)';
    state.headers.forEach((h) => {
      const td = document.createElement('td');
      td.textContent = String(row[h] || '');
      td.style.padding = '4px 6px';
      td.style.fontSize = '12px';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  dom.previewBody.replaceChildren(tbody);
}

function removeFile() {
  state.data = [];
  state.headers = [];
  state.fileName = '';
  state.rowCount = 0;
  dom.fileInfo.style.display = 'none';
  dom.dataPreview.style.display = 'none';
  dom.dropzone.classList.remove('has-file');
  dom.toStep2.disabled = true;
  dom.fileInput.value = '';
  dom.placeholderHints.innerHTML = '';
  dom.messageTemplate.value = '';
  dom.previewBox.innerHTML = '<span class="placeholder">Isi template pesan untuk melihat pratinjau</span>';
}

// ============================================================
// DRAG & DROP + FILE INPUT
// ============================================================
dom.dropzone.addEventListener('click', () => dom.fileInput.click());

dom.dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dom.dropzone.classList.add('drag-over');
});
dom.dropzone.addEventListener('dragleave', () => {
  dom.dropzone.classList.remove('drag-over');
});
dom.dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dom.dropzone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

dom.fileInput.addEventListener('change', () => {
  if (dom.fileInput.files[0]) handleFile(dom.fileInput.files[0]);
});

dom.removeFile.addEventListener('click', removeFile);

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['No Urut', 'Nama', 'No WA', 'Keterangan'],
    ['1', 'Andi', '6281234567890', 'Pelanggan A'],
    ['2', 'Budi', '6289876543210', 'Pelanggan B']
  ]);
  ws['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 18 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'template_wa_blast.xlsx';
  a.click();
  URL.revokeObjectURL(url);
  toast('Template berhasil di-download', 'success');
}

dom.downloadTemplate.addEventListener('click', downloadTemplate);

// ============================================================
// ATTACHMENTS
// ============================================================
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg'].includes(ext)) return 'IMG';
  if (['mp4', 'mov', '3gp'].includes(ext)) return 'VID';
  if (ext === 'pdf') return 'PDF';
  return 'FILE';
}

function renderAttachmentList() {
  if (state.attachments.length === 0) {
    dom.attachmentList.innerHTML = '';
    return;
  }
  const html = state.attachments.map((a, i) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#F0F2F5;border-radius:6px;margin-bottom:4px">
      <span style="font-size:10px;font-weight:700;color:var(--primary);background:var(--primary-light);padding:2px 6px;border-radius:4px">${getFileIcon(a.name)}</span>
      <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.name}</span>
      <span style="font-size:10px;color:var(--text-secondary)">${formatFileSize(a.size)}</span>
      <button data-index="${i}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:16px;padding:0 4px">&times;</button>
    </div>`
  ).join('');
  dom.attachmentList.innerHTML = html;
  dom.attachmentList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => removeAttachment(Number(btn.dataset.index)));
  });
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      resolve(btoa(binary));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function handleAttachmentFiles(files) {
  for (const file of files) {
    if (state.attachments.some(a => a.name === file.name && a.size === file.size)) continue;
    try {
      const base64 = await readFileAsBase64(file);
      state.attachments.push({
        name: file.name,
        mime: file.type || 'application/octet-stream',
        size: file.size,
        base64
      });
    } catch (e) {
      toast('Gagal membaca file: ' + file.name, 'error');
    }
  }
  renderAttachmentList();
  toast(state.attachments.length + ' file lampiran', 'success');
}

function removeAttachment(index) {
  state.attachments.splice(index, 1);
  renderAttachmentList();
  if (state.attachments.length === 0) toast('Semua lampiran dihapus', 'info');
}

dom.attachmentDropzone.addEventListener('click', () => dom.attachmentInput.click());

dom.attachmentDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dom.attachmentDropzone.style.borderColor = 'var(--primary)';
  dom.attachmentDropzone.style.background = 'var(--primary-light)';
});
dom.attachmentDropzone.addEventListener('dragleave', () => {
  dom.attachmentDropzone.style.borderColor = '';
  dom.attachmentDropzone.style.background = '';
});
dom.attachmentDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dom.attachmentDropzone.style.borderColor = '';
  dom.attachmentDropzone.style.background = '';
  if (e.dataTransfer.files.length) handleAttachmentFiles(e.dataTransfer.files);
});

dom.attachmentInput.addEventListener('change', () => {
  if (dom.attachmentInput.files.length) handleAttachmentFiles(dom.attachmentInput.files);
  dom.attachmentInput.value = '';
});

dom.countrySelect.addEventListener('change', function () {
  state.defaultCountry = this.value;
  let cc = '';
  try { cc = '+' + libphonenumber.getCountryCallingCode(this.value); } catch (_) { cc = ''; }
  toast('Negara default: ' + this.value + ' (' + cc + ')', 'info');
});



// ============================================================
// MESSAGE TEMPLATE
// ============================================================
function renderTemplate(template, data) {
  return template.replace(/\{\{(.+?)\}\}/g, (match, key) => {
    const value = data[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

function updatePreview() {
  const template = dom.messageTemplate.value;
  state.template = template;

  if (!template.trim() || state.data.length === 0) {
    dom.previewBox.innerHTML = '<span class="placeholder">Isi template pesan untuk melihat pratinjau</span>';
    return;
  }

  const preview = renderTemplate(template, state.data[0]);
  const hasUnreplaced = preview.includes('{{');
  dom.previewBox.innerHTML = hasUnreplaced
    ? preview.replace(/\{\{(.+?)\}\}/g, '<span style="color:var(--error);font-weight:600">{$1}</span>')
    : preview;
}

function updatePlaceholderHints() {
  if (state.headers.length === 0) return;
  const hints = state.headers.map((h) => {
    const el = document.createElement('span');
    el.className = 'hint';
    el.textContent = `{{${h}}}`;
    el.addEventListener('click', () => {
      const ta = dom.messageTemplate;
      const start = ta.selectionStart;
      const before = ta.value.substring(0, start);
      const after = ta.value.substring(ta.selectionEnd);
      ta.value = before + `{{${h}}}` + after;
      ta.selectionStart = ta.selectionEnd = start + h.length + 4;
      ta.focus();
      updatePreview();
    });
    return el;
  });
  dom.placeholderHints.replaceChildren(...hints);
}

dom.messageTemplate.addEventListener('input', updatePreview);

// ============================================================
// DELAY SLIDER
// ============================================================
const DELAY_PRESETS = {
  1: [3, 6],
  2: [5, 10],
  3: [7, 12],
  4: [10, 18],
  5: [15, 25]
};

dom.delaySlider.addEventListener('input', function () {
  const val = Number(this.value);
  const [min, max] = DELAY_PRESETS[val];
  state.delayMin = min;
  state.delayMax = max;
  const labels = { 1: 'Super Cepat', 2: 'Cepat', 3: 'Normal', 4: 'Lambat', 5: 'Super Lambat' };
  dom.delayValue.textContent = `${min} - ${max} detik (${labels[val]})`;
});

// ============================================================
// NAVIGATION EVENTS
// ============================================================
dom.toStep2.addEventListener('click', () => goToStep(2));
dom.backTo1.addEventListener('click', () => goToStep(1));
dom.backTo2.addEventListener('click', () => {
  if (['idle', 'stopped', 'completed'].includes(state.status)) {
    dom.backFrom3.style.display = 'flex';
    dom.downloadBtn.style.display = state.results.length > 0 ? 'inline-flex' : 'none';
    dom.pauseBtn.style.display = 'none';
    dom.resumeBtn.style.display = 'none';
    dom.stopBtn.style.display = 'none';
    goToStep(2);
  }
});

dom.finishBtn.addEventListener('click', () => {
  if (state.timeoutId) clearTimeout(state.timeoutId);
  state.currentIndex = 0;
  state.results = [];
  state.status = 'idle';
  state.attachments = [];
  renderAttachmentList();
  setStatus('idle');
  dom.backFrom3.style.display = 'flex';
  dom.downloadBtn.style.display = 'none';
  dom.pauseBtn.style.display = 'none';
  dom.resumeBtn.style.display = 'none';
  dom.stopBtn.style.display = 'none';
  dom.logContainer.innerHTML =
    '<div style="text-align:center;color:var(--text-secondary);font-size:12px;padding:20px">Menunggu eksekusi dimulai...</div>';
  dom.progressFill.style.width = '0%';
  dom.progressText.textContent = '0 / 0';
  goToStep(1);
});
dom.toStep3.addEventListener('click', startBlast);

// ============================================================
// WHATSAPP TAB & CONTENT SCRIPT
// ============================================================
async function getWATab() {
  const tabs = await chrome.tabs.query({ url: 'https://web.whatsapp.com/*' });
  return tabs.length > 0 ? tabs[0] : null;
}

function ensureContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error('Gagal inject content script'));
          } else {
            setTimeout(() => resolve(), 500);
          }
        });
      } else {
        resolve();
      }
    });
  });
}

// ============================================================
// STATUS HELPERS
// ============================================================
function setStatus(newStatus) {
  state.status = newStatus;
  const labels = { idle: 'Siaga', running: 'Mengirim...', paused: 'DiJeda', stopped: 'Berhenti', completed: 'Selesai' };
  dom.statusBadge.textContent = labels[newStatus] || newStatus;
  dom.statusBadge.className = `badge ${newStatus}`;
}

// ============================================================
// BLAST EXECUTION
// ============================================================
async function startBlast() {
  if (state.data.length === 0) {
    toast('Tidak ada data untuk dikirim', 'error');
    return;
  }

  const tab = await getWATab();
  if (!tab) {
    toast('WhatsApp Web tidak ditemukan. Buka web.whatsapp.com terlebih dahulu', 'error');
    return;
  }
  state.tabId = tab.id;

  try {
    await ensureContentScript(tab.id);
  } catch (e) {
    toast('Gagal menghubungkan ke WhatsApp Web. Coba refresh halaman', 'error');
    return;
  }

  if (!state.template.trim() && state.attachments.length === 0) {
    toast('Silakan isi template pesan atau upload lampiran terlebih dahulu', 'error');
    return;
  }

  goToStep(3);
  dom.backFrom3.style.display = 'none';
  dom.pauseBtn.style.display = 'inline-flex';
  dom.stopBtn.style.display = 'inline-flex';

  state.currentIndex = 0;
  state.results = [];
  setStatus('running');
  updateStats();

  dom.logContainer.innerHTML = '';
  addLog('info', 'Memulai pengiriman...');

  sendNext();
}

function sendNext() {
  if (state.status !== 'running') return;

  if (state.currentIndex >= state.data.length) {
    completeBlast();
    return;
  }

  const row = state.data[state.currentIndex];
  const phone = extractPhone(row);
  const message = renderTemplate(state.template, row);

  if (!phone) {
    recordResult(state.currentIndex, 'gagal', 'No. telepon tidak ditemukan');
    addLog('error', `Baris ${state.currentIndex + 1}: No. telepon kosong`);
    state.currentIndex++;
    updateStats();
    scheduleNext();
    return;
  }

  const attachments = state.attachments.map(a => ({
    name: a.name,
    mime: a.mime,
    size: a.size,
    base64: a.base64
  }));

  if (attachments.length > 0) {
    addLog('info', `Mengirim ke ${phone} dengan ${attachments.length} lampiran...`);
  } else {
    addLog('info', `Mengirim ke ${phone}...`);
  }

  chrome.tabs.sendMessage(state.tabId, { action: 'send', phone, message, attachments }, (response) => {
    if (chrome.runtime.lastError) {
      recordResult(state.currentIndex, 'gagal', 'Content script tidak merespons');
      addLog('error', `${phone}: Gagal - Content script tidak merespons`);
      state.currentIndex++;
      updateStats();
      scheduleNext();
      return;
    }

    if (response && response.status === 'success') {
      const attachInfo = attachments.length > 0 ? ` (${attachments.length} lampiran)` : '';
      recordResult(state.currentIndex, 'berhasil', '');
      addLog('success', `${phone}: Berhasil${attachInfo}`);
      state.currentIndex++;
      updateStats();
      scheduleNext();
    } else if (response && response.status === 'navigating') {
      addLog('info', `${phone}: WA navigasi, menunggu...`);
    } else {
      const reason = response && response.reason ? response.reason : 'Error tidak diketahui';
      recordResult(state.currentIndex, 'gagal', reason);
      addLog('error', `${phone}: Gagal - ${reason}`);
      state.currentIndex++;
      updateStats();
      scheduleNext();
    }
  });
}

function scheduleNext() {
  const delay = randomInt(state.delayMin, state.delayMax) * 1000;
  state.timeoutId = setTimeout(() => sendNext(), delay);
}

function cleanPhone(raw) {
  let p = String(raw).replace(/[\s\-\+\(\)\.]/g, '');

  if (typeof libphonenumber !== 'undefined') {
    try {
      const parsed = libphonenumber.parsePhoneNumber(raw);
      if (parsed && parsed.isPossible()) {
        return parsed.number.slice(1);
      }
    } catch (_) {}

    try {
      const parsed = libphonenumber.parsePhoneNumber(p, state.defaultCountry);
      if (parsed && parsed.isPossible()) {
        return parsed.number.slice(1);
      }
    } catch (_) {}
  }

  try {
    const cc = libphonenumber.getCountryCallingCode(state.defaultCountry);
    p = p.replace(/^0+/, cc);
  } catch (_) {
    p = p.replace(/^0+/, '62');
  }

  return /^\d{8,15}$/.test(p) ? p : '';
}

function extractPhone(row) {
  const phoneKeys = ['Phone', 'Telepon', 'HP', 'No HP', 'No.HP', 'WA', 'WhatsApp', 'No WA', 'No.WA', 'Nomor WA', 'Nomor Telepon', 'Nomor HP', 'Nomor WhatsApp'];
  for (const key of phoneKeys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return cleanPhone(String(row[key]));
    }
  }
  for (const h of state.headers) {
    const val = row[h];
    if (val !== undefined && val !== null && val !== '') {
      const result = cleanPhone(String(val));
      if (result) return result;
    }
  }
  return '';
}

function recordResult(index, status, reason) {
  const row = state.data[index];
  const phone = extractPhone(row);
  state.results.push({
    index: index + 1,
    phone,
    message: renderTemplate(state.template, row),
    status,
    reason,
    timestamp: new Date().toISOString()
  });
}

// ============================================================
// PAUSE / RESUME / STOP
// ============================================================
dom.pauseBtn.addEventListener('click', pauseBlast);
dom.resumeBtn.addEventListener('click', resumeBlast);
dom.stopBtn.addEventListener('click', stopBlast);

function pauseBlast() {
  if (state.status !== 'running') return;
  if (state.timeoutId) clearTimeout(state.timeoutId);
  setStatus('paused');
  dom.pauseBtn.style.display = 'none';
  dom.resumeBtn.style.display = 'inline-flex';
  addLog('info', '⏸ Eksekusi dijeda');
}

function resumeBlast() {
  if (state.status !== 'paused') return;
  setStatus('running');
  dom.pauseBtn.style.display = 'inline-flex';
  dom.resumeBtn.style.display = 'none';
  addLog('info', '▶ Melanjutkan pengiriman...');
  sendNext();
}

function stopBlast() {
  if (state.timeoutId) clearTimeout(state.timeoutId);
  setStatus('stopped');
  dom.pauseBtn.style.display = 'none';
  dom.resumeBtn.style.display = 'none';
  dom.stopBtn.style.display = 'none';
  dom.backFrom3.style.display = 'flex';
  dom.downloadBtn.style.display = 'inline-flex';
  addLog('info', '⏹ Eksekusi dihentikan pengguna');
  toast('Eksekusi dihentikan', 'info');
}

function completeBlast() {
  setStatus('completed');
  dom.pauseBtn.style.display = 'none';
  dom.resumeBtn.style.display = 'none';
  dom.stopBtn.style.display = 'none';
  dom.backFrom3.style.display = 'flex';
  dom.downloadBtn.style.display = 'inline-flex';
  addLog('info', '✅ Semua pengiriman selesai!');
  toast('Semua pesan berhasil dikirim!', 'success');
}

// ============================================================
// STATS & PROGRESS
// ============================================================
function updateStats() {
  const total = state.data.length;
  const sent = state.results.length;
  const success = state.results.filter((r) => r.status === 'berhasil').length;
  const fail = state.results.filter((r) => r.status === 'gagal').length;
  const remaining = total - sent;

  dom.totalCount.textContent = total;
  dom.successCount.textContent = success;
  dom.failCount.textContent = fail;
  dom.remainingCount.textContent = remaining;

  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;
  dom.progressFill.style.width = pct + '%';
  dom.progressText.textContent = `${sent} / ${total} (${pct}%)`;
}

// ============================================================
// LOG
// ============================================================
function addLog(type, message) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  const time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const msg = document.createElement('span');
  msg.textContent = ' ' + message;

  entry.appendChild(time);
  entry.appendChild(msg);
  dom.logContainer.appendChild(entry);
  dom.logContainer.scrollTop = dom.logContainer.scrollHeight;
}

// ============================================================
// DOWNLOAD REPORT
// ============================================================
dom.downloadBtn.addEventListener('click', downloadReport);

function downloadReport() {
  if (state.results.length === 0) {
    toast('Tidak ada data untuk di-download', 'error');
    return;
  }

  const rows = state.results.map((r) => ({
    No: r.index,
    Telepon: r.phone,
    Status: r.status,
    Keterangan: r.reason,
    Waktu: r.timestamp
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan');
  const wbout = XLSX.write(wb, { bookType: 'csv', type: 'binary' });

  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) view[i] = wbout.charCodeAt(i) & 0xFF;

  const blob = new Blob([buf], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `laporan_blast_${formatDate()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Laporan berhasil di-download', 'success');
}

// ============================================================
// UTILITIES
// ============================================================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// ============================================================
// KEYBOARD SHORTCUTS FROM BACKGROUND
// ============================================================
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'start-blast') {
    if (state.status === 'paused') resumeBlast();
    else if (state.status === 'idle' && state.currentStep === 2) startBlast();
  } else if (message.action === 'pause-blast') {
    if (state.status === 'running') pauseBlast();
  } else if (message.action === 'blast-result') {
    if (state.status !== 'running') return;
    if (message.status === 'success') {
      recordResult(state.currentIndex, 'berhasil', '');
      addLog('success', `${message.phone}: Berhasil`);
    } else {
      recordResult(state.currentIndex, 'gagal', message.reason || 'Error');
      addLog('error', `${message.phone}: Gagal - ${message.reason || 'Error'}`);
    }
    state.currentIndex++;
    updateStats();
    scheduleNext();
  }
});

// ============================================================
// INIT
// ============================================================
goToStep(1);
