const foldersInput = document.querySelector('#folders');
const keepRuleInput = document.querySelector('#keepRule');
const findExactInput = document.querySelector('#findExact');
const findSimilarImagesInput = document.querySelector('#findSimilarImages');
const includeAllInput = document.querySelector('#includeAll');
const startBtn = document.querySelector('#startBtn');
const stopBtn = document.querySelector('#stopBtn');
const selectBtn = document.querySelector('#selectBtn');
const applyBtn = document.querySelector('#applyBtn');
const statusBox = document.querySelector('#status');
const summaryBox = document.querySelector('#summary');
const resultsBox = document.querySelector('#results');

let currentScanId = null;
let pollTimer = null;
let lastResult = null;

function setStatus(message, isError = false) {
  statusBox.classList.remove('hidden');
  statusBox.textContent = message;
  statusBox.style.borderColor = isError ? 'rgba(239,68,68,.65)' : 'rgba(255,255,255,.12)';
}

function folders() {
  return foldersInput.value.split('\n').map(value => value.trim()).filter(Boolean);
}

function selectedFiles() {
  return [...document.querySelectorAll('.file-check:checked')].map(input => input.value);
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function renderSummary(summary) {
  summaryBox.classList.remove('hidden');
  summaryBox.innerHTML = `
    <div class="summary-item"><strong>${summary.scanned_files}</strong><span>gescannte Dateien</span></div>
    <div class="summary-item"><strong>${summary.duplicate_groups}</strong><span>Gruppen</span></div>
    <div class="summary-item"><strong>${summary.duplicate_files}</strong><span>Vorschläge</span></div>
    <div class="summary-item"><strong>${formatBytes(summary.wasted_bytes)}</strong><span>potenziell frei</span></div>
  `;
}

function renderResults(data) {
  lastResult = data;
  resultsBox.innerHTML = '';
  selectBtn.classList.toggle('hidden', data.groups.length === 0);
  applyBtn.classList.toggle('hidden', data.groups.length === 0);
  if (!data.groups.length) {
    resultsBox.innerHTML = '<section class="group-card">Keine Duplikate gefunden.</section>';
    return;
  }
  resultsBox.innerHTML = data.groups.map((group, index) => `
    <section class="group-card">
      <div class="group-head">
        <div>
          <div class="group-title">Gruppe ${index + 1}: ${group.all_files.length} Dateien</div>
          <div class="file-meta">${escapeHtml(group.type)} · ${formatBytes(group.wasted_bytes)}</div>
        </div>
      </div>
      <div class="file-list">
        ${group.all_files.map(file => {
          const keep = file.path === group.keep.path;
          return `
            <label class="file-row ${keep ? 'keep-row' : ''}">
              <input type="checkbox" class="file-check" value="${escapeHtml(file.path)}" ${keep ? 'disabled' : 'data-recommended="true"'}>
              <div class="preview placeholder">${file.category === 'image' ? '🖼️' : '📄'}</div>
              <div>
                <div class="file-path">${escapeHtml(file.path)}</div>
                <div class="file-meta">${escapeHtml(file.category)} · ${formatBytes(file.size)}</div>
              </div>
              <span class="${keep ? 'keep-label' : 'delete-label'}">${keep ? 'Behalten' : 'Vorschlag'}</span>
            </label>
          `;
        }).join('')}
      </div>
    </section>
  `).join('');
}

async function pollStatus() {
  if (!currentScanId) return;
  const response = await fetch(`/api/v1/scans/${encodeURIComponent(currentScanId)}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail || 'Status konnte nicht geladen werden');
  const totalText = data.progress_total ? `/${data.progress_total}` : '';
  setStatus(`${data.stage || data.status}: ${data.progress_current || 0}${totalText} · ${data.message}`);
  if (data.status === 'completed') {
    clearInterval(pollTimer);
    stopBtn.classList.add('hidden');
    const resultResponse = await fetch(`/api/v1/scans/${encodeURIComponent(currentScanId)}/result`);
    const result = await resultResponse.json();
    renderSummary(result.summary);
    renderResults(result);
  }
  if (data.status === 'failed' || data.status === 'cancelled') {
    clearInterval(pollTimer);
    stopBtn.classList.add('hidden');
    setStatus(data.message || data.status, data.status === 'failed');
  }
}

startBtn.addEventListener('click', async () => {
  if (!folders().length) {
    setStatus('Bitte mindestens einen Ordner eintragen.', true);
    return;
  }
  startBtn.disabled = true;
  resultsBox.innerHTML = '';
  summaryBox.classList.add('hidden');
  setStatus('Enterprise-Scan wird gestartet …');
  try {
    const response = await fetch('/api/v1/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        folders: folders(),
        keep_rule: keepRuleInput.value,
        include_all_files: includeAllInput.checked,
        find_exact: findExactInput.checked,
        find_similar_images: findSimilarImagesInput.checked,
        categories: includeAllInput.checked ? [] : ['image', 'video', 'document', 'archive'],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Scan konnte nicht gestartet werden');
    currentScanId = data.scan_id;
    stopBtn.classList.remove('hidden');
    pollTimer = setInterval(() => pollStatus().catch(error => setStatus(error.message, true)), 1000);
    await pollStatus();
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    startBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', async () => {
  if (!currentScanId) return;
  await fetch(`/api/v1/scans/${encodeURIComponent(currentScanId)}/stop`, { method: 'POST' });
  setStatus('Stopp wurde angefordert …');
});

selectBtn.addEventListener('click', () => {
  document.querySelectorAll('.file-check[data-recommended="true"]').forEach(input => { input.checked = true; });
});

applyBtn.addEventListener('click', async () => {
  const files = selectedFiles();
  if (!currentScanId || !lastResult || !files.length) {
    setStatus('Bitte zuerst Vorschläge auswählen.', true);
    return;
  }
  const response = await fetch(`/api/v1/scans/${encodeURIComponent(currentScanId)}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file_paths: files, mode: 'quarantine' }),
  });
  const data = await response.json();
  if (!response.ok) {
    setStatus(data.detail || 'Aktion fehlgeschlagen', true);
    return;
  }
  setStatus(`${data.changed.length} Aktion(en) protokolliert.`);
});
