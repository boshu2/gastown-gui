/**
 * Gas Town GUI - K8s Logs Viewer Component
 *
 * Real-time log viewing for K8s Automatons.
 * Features: auto-scroll, search, timestamps toggle, download.
 */

import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

// Logs viewer state
let currentLogs = '';
let autoScroll = true;
let showTimestamps = true;
let refreshInterval = null;

/**
 * Show logs viewer modal for a polecat
 * @param {Object} polecat - Polecat object with name and namespace
 */
export async function showLogsViewer(polecat) {
  const { name, namespace } = polecat;

  const content = `
    <div class="modal-header">
      <h2>
        <span class="material-icons">terminal</span>
        Logs: ${escapeHtml(name)}
      </h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body logs-viewer-body">
      <div class="logs-toolbar">
        <div class="logs-controls-left">
          <label class="checkbox-label">
            <input type="checkbox" id="logs-auto-scroll" checked>
            Auto-scroll
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="logs-timestamps" checked>
            Timestamps
          </label>
          <select id="logs-tail-lines" class="filter-select">
            <option value="50">Last 50 lines</option>
            <option value="100" selected>Last 100 lines</option>
            <option value="500">Last 500 lines</option>
            <option value="1000">Last 1000 lines</option>
          </select>
        </div>
        <div class="logs-controls-right">
          <div class="logs-search">
            <span class="material-icons">search</span>
            <input type="text" id="logs-search-input" placeholder="Search logs...">
          </div>
          <button class="btn btn-sm btn-secondary" id="logs-refresh-btn" title="Refresh">
            <span class="material-icons">refresh</span>
          </button>
          <button class="btn btn-sm btn-secondary" id="logs-download-btn" title="Download">
            <span class="material-icons">download</span>
          </button>
        </div>
      </div>
      <div class="logs-container" id="logs-container">
        <div class="logs-loading">
          <span class="loading-spinner"></span>
          Loading logs...
        </div>
      </div>
      <div class="logs-footer">
        <span id="logs-line-count">0 lines</span>
        <span id="logs-status">Loading...</span>
      </div>
    </div>
  `;

  const modal = showDynamicModal('k8s-logs', content, 'modal-large');

  // Store polecat info for refresh
  modal.dataset.polecatName = name;
  modal.dataset.polecatNamespace = namespace;

  // Wire up controls
  setupLogsControls(modal, name, namespace);

  // Initial load
  await refreshLogs(modal, name, namespace);
}

/**
 * Set up logs viewer controls
 */
function setupLogsControls(modal, name, namespace) {
  const container = modal.querySelector('#logs-container');
  const autoScrollCheckbox = modal.querySelector('#logs-auto-scroll');
  const timestampsCheckbox = modal.querySelector('#logs-timestamps');
  const tailLinesSelect = modal.querySelector('#logs-tail-lines');
  const searchInput = modal.querySelector('#logs-search-input');
  const refreshBtn = modal.querySelector('#logs-refresh-btn');
  const downloadBtn = modal.querySelector('#logs-download-btn');

  // Auto-scroll toggle
  autoScrollCheckbox.addEventListener('change', (e) => {
    autoScroll = e.target.checked;
    if (autoScroll) {
      container.scrollTop = container.scrollHeight;
    }
  });

  // Timestamps toggle
  timestampsCheckbox.addEventListener('change', (e) => {
    showTimestamps = e.target.checked;
    renderLogs(modal);
  });

  // Tail lines change
  tailLinesSelect.addEventListener('change', () => {
    refreshLogs(modal, name, namespace);
  });

  // Search
  searchInput.addEventListener('input', debounce((e) => {
    highlightSearch(modal, e.target.value);
  }, 200));

  // Refresh button
  refreshBtn.addEventListener('click', () => {
    refreshLogs(modal, name, namespace);
  });

  // Download button
  downloadBtn.addEventListener('click', () => {
    downloadLogs(name, namespace);
  });

  // Auto-refresh every 5 seconds
  refreshInterval = setInterval(() => {
    if (document.contains(modal) && !modal.classList.contains('hidden')) {
      refreshLogs(modal, name, namespace, true);
    } else {
      clearInterval(refreshInterval);
    }
  }, 5000);

  // Clear interval on close
  modal.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      clearInterval(refreshInterval);
    });
  });
}

/**
 * Refresh logs from API
 */
async function refreshLogs(modal, name, namespace, silent = false) {
  const container = modal.querySelector('#logs-container');
  const statusEl = modal.querySelector('#logs-status');
  const tailLines = modal.querySelector('#logs-tail-lines').value;

  if (!silent) {
    statusEl.textContent = 'Loading...';
  }

  try {
    const logs = await api.getK8sPolecatLogs(namespace, name, {
      tailLines: parseInt(tailLines, 10),
      timestamps: showTimestamps,
    });

    currentLogs = logs || '';
    renderLogs(modal);
    statusEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    if (!silent) {
      container.innerHTML = `
        <div class="logs-error">
          <span class="material-icons">error</span>
          <span>${escapeHtml(err.message)}</span>
        </div>
      `;
      statusEl.textContent = 'Error loading logs';
    }
  }
}

/**
 * Render logs to container
 */
function renderLogs(modal) {
  const container = modal.querySelector('#logs-container');
  const lineCountEl = modal.querySelector('#logs-line-count');
  const searchInput = modal.querySelector('#logs-search-input');

  if (!currentLogs) {
    container.innerHTML = '<div class="logs-empty">No logs available</div>';
    lineCountEl.textContent = '0 lines';
    return;
  }

  const lines = currentLogs.split('\n').filter(Boolean);
  lineCountEl.textContent = `${lines.length} lines`;

  // Format lines
  let html = '<pre class="logs-content">';
  lines.forEach((line, i) => {
    const formattedLine = formatLogLine(line, i + 1);
    html += formattedLine;
  });
  html += '</pre>';

  container.innerHTML = html;

  // Re-apply search highlighting
  if (searchInput.value) {
    highlightSearch(modal, searchInput.value);
  }

  // Auto-scroll
  if (autoScroll) {
    container.scrollTop = container.scrollHeight;
  }
}

/**
 * Format a single log line
 */
function formatLogLine(line, lineNum) {
  // Try to parse timestamp and level
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z?)\s*(.*)/);

  let timestamp = '';
  let content = line;

  if (timestampMatch && showTimestamps) {
    timestamp = `<span class="log-timestamp">${escapeHtml(timestampMatch[1])}</span> `;
    content = timestampMatch[2];
  } else if (timestampMatch && !showTimestamps) {
    content = timestampMatch[2];
  }

  // Detect log level
  let levelClass = '';
  if (/\b(ERROR|FATAL|PANIC)\b/i.test(content)) {
    levelClass = 'log-error';
  } else if (/\bWARN(ING)?\b/i.test(content)) {
    levelClass = 'log-warn';
  } else if (/\bINFO\b/i.test(content)) {
    levelClass = 'log-info';
  } else if (/\bDEBUG\b/i.test(content)) {
    levelClass = 'log-debug';
  }

  return `<div class="log-line ${levelClass}" data-line="${lineNum}"><span class="log-line-num">${lineNum}</span>${timestamp}<span class="log-content">${escapeHtml(content)}</span></div>`;
}

/**
 * Highlight search matches
 */
function highlightSearch(modal, query) {
  const container = modal.querySelector('#logs-container');
  const lines = container.querySelectorAll('.log-line');

  lines.forEach(line => {
    line.classList.remove('log-highlight');
  });

  if (!query) return;

  const regex = new RegExp(escapeRegex(query), 'gi');
  let matchCount = 0;

  lines.forEach(line => {
    const content = line.querySelector('.log-content');
    if (content && regex.test(content.textContent)) {
      line.classList.add('log-highlight');
      matchCount++;
    }
  });

  const statusEl = modal.querySelector('#logs-status');
  statusEl.textContent = matchCount > 0 ? `${matchCount} matches` : 'No matches';
}

/**
 * Download logs as file
 */
function downloadLogs(name, namespace) {
  if (!currentLogs) {
    showToast('No logs to download', 'warning');
    return;
  }

  const blob = new Blob([currentLogs], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}-${namespace}-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Logs downloaded', 'success');
}

// Utility functions
function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showDynamicModal(id, content, extraClass = '') {
  const overlay = document.getElementById('modal-overlay');

  const existing = document.getElementById(`${id}-modal`);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = `${id}-modal`;
  modal.className = `modal ${extraClass}`;
  modal.innerHTML = content;

  overlay.appendChild(modal);
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');

  modal.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      overlay.classList.add('hidden');
      modal.classList.add('hidden');
      clearInterval(refreshInterval);
    });
  });

  return modal;
}

export default {
  showLogsViewer,
};
