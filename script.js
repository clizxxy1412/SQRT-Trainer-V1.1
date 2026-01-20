// Square Root Speed Trainer
// - History is independently scrollable
// - Import replaces entire logs (save slot behavior)
// - Spacebar starts a new round when not typing in inputs

(() => {
  const generateBtn = document.getElementById('generateBtn');
  const roundArea = document.getElementById('roundArea');
  const squareNumberEl = document.getElementById('squareNumber');
  const timerEl = document.getElementById('timer');
  const answerForm = document.getElementById('answerForm');
  const answerInput = document.getElementById('answerInput');
  const resultMessage = document.getElementById('resultMessage');
  const logList = document.getElementById('logList');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importBtn = document.getElementById('importBtn');
  const exportArea = document.getElementById('exportArea');
  const exportText = document.getElementById('exportText');
  const copyExportBtn = document.getElementById('copyExportBtn');
  const closeExportBtn = document.getElementById('closeExportBtn');

  let currentRoot = null;
  let currentSquare = null;
  let startTime = null;
  let timerId = null;
  let logs = [];

  // Load logs from localStorage
  try {
    const saved = localStorage.getItem('sqrt-trainer-logs');
    if (saved) logs = JSON.parse(saved) || [];
  } catch (e) {
    logs = [];
  }
  renderLogs();

  function saveLogs(){
    try { localStorage.setItem('sqrt-trainer-logs', JSON.stringify(logs)); } catch(e){}
  }

  function randomTwoDigit(){
    return Math.floor(Math.random() * 90) + 10; // 10..99
  }

  function startRound(){
    // Prevent starting if a round is already active
    if (timerId) return;

    currentRoot = randomTwoDigit();
    currentSquare = currentRoot * currentRoot;
    squareNumberEl.textContent = String(currentSquare);
    resultMessage.textContent = '';
    timerEl.textContent = '0.0 s';
    answerInput.value = '';
    answerInput.focus();

    generateBtn.disabled = true;
    generateBtn.classList.add('hidden');
    roundArea.classList.remove('hidden');

    startTime = performance.now();
    timerId = setInterval(updateTimer, 50); // update every 50ms
  }

  function updateTimer(){
    const elapsed = (performance.now() - startTime) / 1000;
    timerEl.textContent = elapsed.toFixed(1) + ' s';
  }

  function stopRoundAndLog(){
    if (timerId) clearInterval(timerId);
    const elapsed = (performance.now() - startTime) / 1000;
    const elapsedFixed = Number(elapsed.toFixed(1)); // one decimal
    resultMessage.textContent = `Your time was ${elapsedFixed} s.`;

    // Add to logs (most recent first)
    logs.unshift({
      square: currentSquare,
      root: currentRoot,
      time: elapsedFixed,
      at: new Date().toISOString()
    });
    saveLogs();
    renderLogs();

    // reset UI
    roundArea.classList.add('hidden');
    generateBtn.disabled = false;
    generateBtn.classList.remove('hidden');
    currentRoot = null;
    currentSquare = null;
    startTime = null;
    timerId = null;
  }

  // Handle answer submission (enter key)
  answerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!startTime || !currentRoot) return;

    const val = answerInput.value.trim();
    if (!/^\d{1,2}$/.test(val)) return;
    const numeric = Number(val);
    if (numeric === currentRoot) {
      stopRoundAndLog();
    } else {
      // subtle visual feedback for wrong entry
      try {
        answerInput.animate([
          { boxShadow: '0 0 0 0 rgba(201,42,42,0)' },
          { boxShadow: '0 0 0 6px rgba(201,42,42,0.06)' },
          { boxShadow: '0 0 0 0 rgba(201,42,42,0)' }
        ], { duration: 300, easing: 'ease-out' });
      } catch (er) {}
    }
  });

  // Generate button
  generateBtn.addEventListener('click', () => startRound());

  clearAllBtn.addEventListener('click', () => {
    if (!logs.length) return;
    if (confirm('Clear all logs?')) {
      logs = [];
      saveLogs();
      renderLogs();
    }
  });

  // Render logs (most recent first)
  function renderLogs(){
    logList.innerHTML = '';
    if (logs.length === 0){
      const li = document.createElement('li');
      li.className = 'log-item';
      li.textContent = 'No attempts yet.';
      logList.appendChild(li);
      return;
    }

    logs.forEach((entry, idx) => {
      const li = document.createElement('li');
      li.className = 'log-item';

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';

      const label = document.createElement('div');
      label.className = 'log-label';
      label.textContent = `${entry.square} —`;

      const time = document.createElement('div');
      time.className = 'log-time';
      time.textContent = ` ${entry.time} s`;

      left.appendChild(label);
      left.appendChild(time);

      const actions = document.createElement('div');
      actions.className = 'log-actions';

      const del = document.createElement('button');
      del.type = 'button';
      del.title = 'Delete this log';
      del.textContent = 'Delete';
      del.addEventListener('click', () => {
        logs.splice(idx, 1);
        saveLogs();
        renderLogs();
      });

      actions.appendChild(del);

      li.appendChild(left);
      li.appendChild(actions);

      logList.appendChild(li);
    });
  }

  // --- Import/Export (save code) ---
  // Use a small wrapper object to allow future extension.
  function encodeSaveCode(obj) {
    const json = JSON.stringify(obj);
    // base64 encode using TextEncoder for UTF-8 safety
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function decodeSaveCode(code) {
    try {
      const binary = atob(code);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    } catch (e) {
      throw new Error('Invalid save code');
    }
  }

  exportBtn.addEventListener('click', () => {
    if (!logs.length) {
      alert('No logs to export.');
      return;
    }
    const payload = { logs };
    const code = encodeSaveCode(payload);
    exportText.value = code;
    exportArea.classList.remove('hidden');
    // select text for easy copy
    exportText.select();
  });

  copyExportBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(exportText.value);
      copyExportBtn.textContent = 'Copied';
      setTimeout(() => { copyExportBtn.textContent = 'Copy'; }, 1200);
    } catch (e) {
      alert('Copy failed — select and copy manually.');
    }
  });

  closeExportBtn.addEventListener('click', () => {
    exportArea.classList.add('hidden');
  });

  importBtn.addEventListener('click', async () => {
    const code = prompt('Paste the save code you exported from another device:');
    if (!code) return;
    try {
      const parsed = decodeSaveCode(code.trim());
      // Accept either { logs: [...] } or direct array
      let newLogs = null;
      if (parsed && Array.isArray(parsed.logs)) newLogs = parsed.logs;
      else if (Array.isArray(parsed)) newLogs = parsed;
      else throw new Error('No logs array found');

      // Basic validation of entries and normalize types
      const normalized = newLogs.map(entry => ({
        square: Number(entry.square),
        root: Number(entry.root),
        time: Number(entry.time),
        at: entry.at || new Date().toISOString()
      }));

      const ok = normalized.every(entry =>
        Number.isFinite(entry.square) && Number.isFinite(entry.root) && Number.isFinite(entry.time)
      );
      if (!ok) throw new Error('Save code structure invalid');

      if (!confirm(`Replace your current ${logs.length} log(s) with the ${normalized.length} imported log(s)? This will overwrite your local logs.`)) return;

      // REPLACE the entire logs array with the imported data (save slot behavior)
      logs = normalized;
      saveLogs();
      renderLogs();
      alert('Import successful — logs replaced.');
    } catch (err) {
      alert('Failed to import save code: ' + (err.message || err));
    }
  });

  // Keyboard shortcuts:
  // - Escape cancels current round
  // - Space starts a new round when focus is not inside an input/textarea/select/contentEditable
  document.addEventListener('keydown', (e) => {
    // Escape: cancel current round
    if (e.key === 'Escape') {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
        startTime = null;
        roundArea.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.classList.remove('hidden');
        resultMessage.textContent = 'Attempt canceled.';
      }
      return;
    }

    // Space: start the round (only when not typing)
    if (e.code === 'Space' || e.key === ' ') {
      const active = document.activeElement;
      const tag = active && active.tagName ? active.tagName.toUpperCase() : '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || active.isContentEditable;
      if (!isTyping) {
        // only start if no round active and generate button is enabled
        if (!timerId && !generateBtn.disabled) {
          e.preventDefault();
          startRound();
        }
      }
    }
  });

  // Initial UI state
  roundArea.classList.add('hidden');
})();
