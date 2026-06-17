const folderInput = document.querySelector('#folder');
const includeAllInput = document.querySelector('#includeAll');
const scanBtn = document.querySelector('#scanBtn');
const statusBox = document.querySelector('#status');
const summaryBox = document.querySelector('#summary');
const actionsBox = document.querySelector('#actions');
const resultsBox = document.querySelector('#results');
const selectRecommendedBtn = document.querySelector('#selectRecommendedBtn');
const clearSelectionBtn = document.querySelector('#clearSelectionBtn');
const quarantineBtn = document.querySelector('#quarantineBtn');

let lastScan = null;

function setStatus(message, isError = false) {
  statusBox.classList.remove('hidden');
  statusBox.textContent = message;
  statusBox.style.borderColor = isError ? 'rgba(239,68,68,.65)' : 'rgba(255,255,255,.12)';
}

function hideStatus() {
  statusBox.classList.add('hidden');
}

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString('de-DE');
}

function renderSummary(summary) {
  summaryBox.classList.remove('hidden');
  summaryBox.innerHTML = `
    <div class="summary-item"><strong>${summary.scanned_files}</strong><span>gescannte Dateien</span></div>
    <div class="summary-item"><strong>${summary.duplicate_groups}</strong><span>Duplikat-Gruppen</span></div>
    <div class="summary-item"><strong>${summary.duplicate_files}</strong><span>Duplikate</span></div>
    <div class="summary-item"><strong>${formatBytes(summary.wasted_bytes)}</strong><span>potenziell frei</span></div>
    <div class="summary-item"><strong>${summary.duration_seconds}s</strong><span>Scan-Zeit</span></div>
  `;
}

function renderResults(data) {
  resultsBox.innerHTML = '';
  actionsBox.classList.toggle('hidden', data.groups.length === 0);

  if (data.groups.length === 0) {
    resultsBox.innerHTML = '<section class="group-card">Keine echten Duplikate gefunden.</section>';
    return;
  }

  for (const [groupIndex, group] of data.groups.entries()) {
    const card = document.createElement('section');
    card.className = 'group-card';
    card.innerHTML = `
      <div class="group-head">
        <div>
          <div class="group-title">Gruppe ${groupIndex + 1}: ${group.all_files.length} identische Dateien</div>
          <div class="file-meta">Platzverschwendung: ${formatBytes(group.wasted_bytes)}</div>
        </div>
        <div class="file-meta">Hash: ${group.hash.slice(0, 12)}…</div>
      </div>
      <div class="file-list"></div>
    `;

    const list = card.querySelector('.file-list');
    const rows = [group.keep, ...group.duplicates];
    for (const file of rows) {
      const isKeep = file.path === group.keep.path;
      const row = document.createElement('label');
      row.className = 'file-row';
      row.innerHTML = `
        <input type="checkbox" class="file-check" value="${escapeHtml(file.path)}" ${isKeep ? 'disabled' : 'data-recommended="true"'}>
        <div>
          <div class="file-path">${escapeHtml(file.path)}</div>
          <div class="file-meta">${formatBytes(file.size)} · geändert: ${formatDate(file.modified)}</div>
        </div>
        <span class="${isKeep ? 'keep-label' : 'delete-label'}">${isKeep ? 'Behalten' : 'Duplikat'}</span>
      `;
      list.appendChild(row);
    }

    resultsBox.appendChild(card);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function selectedFiles() {
  return [...document.querySelectorAll('.file-check:checked')].map(input => input.value);
}

scanBtn.addEventListener('click', async () => {
  const folder = folderInput.value.trim();
  if (!folder) {
    setStatus('Bitte gib einen Ordnerpfad ein.', true);
    return;
  }

  scanBtn.disabled = true;
  resultsBox.innerHTML = '';
  summaryBox.classList.add('hidden');
  actionsBox.classList.add('hidden');
  setStatus('Scan läuft. Bei großen Ordnern mit vielen Videos kann das etwas dauern …');

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder, include_all_files: includeAllInput.checked }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Scan fehlgeschlagen');

    lastScan = data;
    hideStatus();
    renderSummary(data.summary);
    renderResults(data);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    scanBtn.disabled = false;
  }
});

selectRecommendedBtn.addEventListener('click', () => {
  document.querySelectorAll('.file-check[data-recommended="true"]').forEach(input => {
    input.checked = true;
  });
});

clearSelectionBtn.addEventListener('click', () => {
  document.querySelectorAll('.file-check').forEach(input => {
    input.checked = false;
  });
});

quarantineBtn.addEventListener('click', async () => {
  if (!lastScan) return;
  const filePaths = selectedFiles();
  if (filePaths.length === 0) {
    setStatus('Bitte wähle zuerst mindestens ein Duplikat aus.', true);
    return;
  }

  const ok = confirm(`${filePaths.length} Datei(en) in Quarantäne verschieben? Sie werden nicht endgültig gelöscht.`);
  if (!ok) return;

  quarantineBtn.disabled = true;
  setStatus('Dateien werden in Quarantäne verschoben …');

  try {
    const response = await fetch('/api/quarantine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: lastScan.folder, file_paths: filePaths }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Verschieben fehlgeschlagen');

    setStatus(`${data.moved.length} Datei(en) verschoben. Quarantäne: ${data.quarantine_folder}`);
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    quarantineBtn.disabled = false;
  }
});
