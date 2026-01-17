/**
 * Gas Town GUI - Combined Worker View Component
 *
 * Unified view showing BOTH local polecats (from gt CLI) AND K8s polecats side by side.
 * Each card shows source badge: "Local" (tmux icon) or "K8s" (cloud icon).
 * Supports filtering by source (All / Local / K8s).
 */

import { AGENT_TYPES, STATUS_COLORS } from '../shared/agent-types.js';
import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

// Source configuration
const SOURCE_CONFIG = {
  local: { color: '#f59e0b', icon: 'terminal', label: 'Local' },
  k8s: { color: '#3b82f6', icon: 'cloud', label: 'K8s' },
};

// Phase configuration (for K8s polecats)
const PHASE_CONFIG = {
  Queued: { color: '#6b7280', icon: 'schedule', label: 'Queued' },
  Claimed: { color: '#f59e0b', icon: 'front_hand', label: 'Claimed' },
  Running: { color: '#22c55e', icon: 'play_circle', label: 'Running' },
  Succeeded: { color: '#10b981', icon: 'check_circle', label: 'Succeeded' },
  Failed: { color: '#ef4444', icon: 'error', label: 'Failed' },
  Unknown: { color: '#6b7280', icon: 'help', label: 'Unknown' },
};

// Local status configuration
const LOCAL_STATUS_CONFIG = {
  running: { color: '#22c55e', icon: 'play_circle', label: 'Running' },
  idle: { color: '#6b7280', icon: 'schedule', label: 'Idle' },
  working: { color: '#22c55e', icon: 'sync', label: 'Working' },
  complete: { color: '#10b981', icon: 'check_circle', label: 'Complete' },
  error: { color: '#ef4444', icon: 'error', label: 'Error' },
};

// Store workers for updates
let workersCache = [];
let currentSourceFilter = 'all'; // 'all', 'local', 'k8s'

/**
 * Normalize a local agent to unified worker format
 * @param {Object} agent - Local agent from /api/agents
 * @returns {Object} Normalized worker object
 */
function normalizeLocalWorker(agent) {
  // Local agents have format: { address: "rig/polecats/name", name: "name", role: "polecat", running: true, has_work: false }
  const parts = (agent.address || '').split('/');
  const rig = parts[0] || '';
  const name = agent.name || parts[parts.length - 1] || 'unknown';

  return {
    id: agent.address || agent.id || `local-${name}`,
    source: 'local',
    name: name,
    rig: rig,
    status: mapLocalStatus(agent),
    objective: agent.hook?.title || agent.current_task || null,
    running: agent.running || false,
    hasWork: agent.has_work || false,
    createdAt: agent.createdAt || null,
    raw: agent, // Keep original for details
  };
}

/**
 * Map local agent status to unified status
 */
function mapLocalStatus(agent) {
  if (!agent.running) return 'idle';
  if (agent.has_work) return 'working';
  return 'running';
}

/**
 * Normalize a K8s polecat to unified worker format
 * @param {Object} polecat - K8s polecat from /api/k8s/polecats
 * @returns {Object} Normalized worker object
 */
function normalizeK8sWorker(polecat) {
  return {
    id: polecat.id || `${polecat.namespace}/${polecat.name}`,
    source: 'k8s',
    name: polecat.name,
    namespace: polecat.namespace,
    rig: polecat.rigRef || polecat.forgeRef || null,
    status: polecat.phase || 'Unknown',
    objective: polecat.objective || null,
    healthState: polecat.healthState,
    agentType: polecat.agentType,
    executionMode: polecat.executionMode,
    claimedBy: polecat.claimedBy,
    metrics: polecat.metrics,
    createdAt: polecat.createdAt,
    raw: polecat, // Keep original for details
  };
}

/**
 * Load combined workers from both local and K8s sources
 * @returns {Promise<Array>} Array of normalized worker objects
 */
export async function loadCombinedWorkers() {
  const results = await Promise.allSettled([
    loadLocalWorkers(),
    loadK8sWorkers(),
  ]);

  const workers = [];

  // Process local workers
  if (results[0].status === 'fulfilled') {
    workers.push(...results[0].value);
  } else {
    console.warn('[CombinedWorkerView] Failed to load local workers:', results[0].reason);
  }

  // Process K8s workers
  if (results[1].status === 'fulfilled') {
    workers.push(...results[1].value);
  } else {
    console.warn('[CombinedWorkerView] Failed to load K8s workers:', results[1].reason);
  }

  // Sort by name
  workers.sort((a, b) => a.name.localeCompare(b.name));

  workersCache = workers;
  return workers;
}

/**
 * Load local polecats from /api/agents
 */
async function loadLocalWorkers() {
  try {
    const response = await api.getAgents();
    const agents = response.agents || [];

    // Filter to only polecats
    const polecats = agents.filter(a =>
      a.role === 'polecat' ||
      (a.address && a.address.includes('polecats/'))
    );

    return polecats.map(normalizeLocalWorker);
  } catch (err) {
    console.error('[CombinedWorkerView] Local workers error:', err);
    return [];
  }
}

/**
 * Load K8s polecats from /api/k8s/polecats
 */
async function loadK8sWorkers() {
  try {
    const response = await api.get('/api/k8s/polecats');
    const polecats = response.items || [];
    return polecats.map(normalizeK8sWorker);
  } catch (err) {
    console.error('[CombinedWorkerView] K8s workers error:', err);
    return [];
  }
}

/**
 * Render the combined worker view
 * @param {HTMLElement} container - The container element
 * @param {Array} workers - Array of normalized worker objects
 */
export function renderCombinedWorkerView(container, workers) {
  if (!container) return;

  workersCache = workers || [];

  // Count by source
  const localCount = workers.filter(w => w.source === 'local').length;
  const k8sCount = workers.filter(w => w.source === 'k8s').length;

  if (!workers || workers.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons empty-icon">engineering</span>
        <h3>No Workers</h3>
        <p>No polecats found from either local (tmux) or Kubernetes sources</p>
        <p class="empty-hint">Workers appear here when work is dispatched via <code>gt sling</code></p>
      </div>
    `;
    return;
  }

  // Filter workers based on current filter
  const filteredWorkers = currentSourceFilter === 'all'
    ? workers
    : workers.filter(w => w.source === currentSourceFilter);

  container.innerHTML = `
    <div class="combined-worker-header">
      <div class="worker-counts">
        <span class="material-icons">engineering</span>
        <span>${workers.length} Worker${workers.length !== 1 ? 's' : ''}</span>
        <span class="count-divider">|</span>
        <span class="source-count local" title="Local (tmux)">
          <span class="material-icons">terminal</span>
          ${localCount}
        </span>
        <span class="source-count k8s" title="Kubernetes">
          <span class="material-icons">cloud</span>
          ${k8sCount}
        </span>
      </div>
      <div class="source-filter-group">
        <button class="source-filter-btn ${currentSourceFilter === 'all' ? 'active' : ''}" data-filter="all">
          All
        </button>
        <button class="source-filter-btn ${currentSourceFilter === 'local' ? 'active' : ''}" data-filter="local">
          <span class="material-icons">terminal</span>
          Local
        </button>
        <button class="source-filter-btn ${currentSourceFilter === 'k8s' ? 'active' : ''}" data-filter="k8s">
          <span class="material-icons">cloud</span>
          K8s
        </button>
      </div>
    </div>
    <div class="combined-worker-cards">
      ${filteredWorkers.length > 0
        ? filteredWorkers.map((worker, index) => renderWorkerCard(worker, index)).join('')
        : `<div class="empty-state-inline">
            <span class="material-icons">filter_alt_off</span>
            <span>No ${currentSourceFilter === 'local' ? 'local' : 'K8s'} workers found</span>
          </div>`
      }
    </div>
  `;

  // Add filter listeners
  setupFilterListeners(container);

  // Add card action listeners
  setupCardActions(container);
}

/**
 * Render a single worker card
 */
function renderWorkerCard(worker, index) {
  const sourceConfig = SOURCE_CONFIG[worker.source] || SOURCE_CONFIG.local;
  const statusConfig = worker.source === 'k8s'
    ? (PHASE_CONFIG[worker.status] || PHASE_CONFIG.Unknown)
    : (LOCAL_STATUS_CONFIG[worker.status] || LOCAL_STATUS_CONFIG.idle);

  return `
    <div class="worker-card animate-spawn stagger-${Math.min(index, 6)}"
         data-worker-id="${escapeHtml(worker.id)}"
         data-source="${worker.source}">
      <div class="worker-header">
        <div class="worker-icon">
          <span class="material-icons" style="color: ${AGENT_TYPES.polecat.color}">${AGENT_TYPES.polecat.icon}</span>
        </div>
        <div class="worker-info">
          <h3 class="worker-name">${escapeHtml(worker.name)}</h3>
          <div class="worker-location">
            ${worker.source === 'k8s' && worker.namespace ? `
              <span class="material-icons">folder</span>
              ${escapeHtml(worker.namespace)}
            ` : worker.rig ? `
              <span class="material-icons">folder_special</span>
              ${escapeHtml(worker.rig)}
            ` : ''}
          </div>
        </div>
        <div class="worker-badges">
          <span class="source-badge source-${worker.source}" title="Source: ${sourceConfig.label}">
            <span class="material-icons">${sourceConfig.icon}</span>
            ${sourceConfig.label}
          </span>
          <span class="status-badge" style="--status-color: ${statusConfig.color}" title="Status: ${statusConfig.label}">
            <span class="material-icons${worker.status === 'working' || worker.status === 'Running' ? ' spinning' : ''}">${statusConfig.icon}</span>
            ${statusConfig.label}
          </span>
        </div>
      </div>

      ${worker.objective ? `
        <div class="worker-objective">
          <span class="material-icons">flag</span>
          <span class="objective-text">${escapeHtml(truncate(worker.objective, 100))}</span>
        </div>
      ` : ''}

      <div class="worker-details">
        ${worker.rig && worker.source === 'k8s' ? `
          <div class="worker-detail">
            <span class="material-icons">folder_special</span>
            <span class="detail-label">Rig:</span>
            <span class="detail-value">${escapeHtml(worker.rig)}</span>
          </div>
        ` : ''}
        ${worker.agentType ? `
          <div class="worker-detail">
            <span class="material-icons">smart_toy</span>
            <span class="detail-label">Agent:</span>
            <span class="detail-value">${escapeHtml(worker.agentType)}</span>
          </div>
        ` : ''}
        ${worker.createdAt ? `
          <div class="worker-detail">
            <span class="material-icons">schedule</span>
            <span class="detail-label">Age:</span>
            <span class="detail-value">${formatAge(worker.createdAt)}</span>
          </div>
        ` : ''}
      </div>

      ${worker.source === 'k8s' && worker.metrics ? `
        <div class="worker-metrics">
          ${worker.metrics.iterations !== undefined ? `
            <div class="metric">
              <span class="metric-value">${worker.metrics.iterations}</span>
              <span class="metric-label">iterations</span>
            </div>
          ` : ''}
          ${worker.metrics.tokensUsed !== undefined ? `
            <div class="metric">
              <span class="metric-value">${formatNumber(worker.metrics.tokensUsed)}</span>
              <span class="metric-label">tokens</span>
            </div>
          ` : ''}
          ${worker.metrics.duration !== undefined ? `
            <div class="metric">
              <span class="metric-value">${formatDuration(worker.metrics.duration)}</span>
              <span class="metric-label">duration</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${worker.claimedBy ? `
        <div class="worker-claimed">
          <span class="material-icons">person</span>
          Claimed by: ${escapeHtml(worker.claimedBy)}
        </div>
      ` : ''}

      <div class="worker-actions">
        ${worker.source === 'local' ? `
          <button class="btn btn-sm btn-secondary" data-action="peek" data-worker="${escapeHtml(worker.id)}" title="View output">
            <span class="material-icons">visibility</span>
            Peek
          </button>
          ${worker.running ? `
            <button class="btn btn-sm btn-danger-ghost" data-action="stop" data-worker="${escapeHtml(worker.id)}" title="Stop polecat">
              <span class="material-icons">stop</span>
            </button>
          ` : `
            <button class="btn btn-sm btn-success-ghost" data-action="start" data-worker="${escapeHtml(worker.id)}" title="Start polecat">
              <span class="material-icons">play_arrow</span>
            </button>
          `}
        ` : `
          <button class="btn btn-sm btn-secondary" data-action="logs" data-worker="${escapeHtml(worker.id)}" title="View logs">
            <span class="material-icons">terminal</span>
            Logs
          </button>
        `}
        <button class="btn btn-sm btn-secondary" data-action="details" data-worker="${escapeHtml(worker.id)}" title="View details">
          <span class="material-icons">info</span>
          Details
        </button>
      </div>
    </div>
  `;
}

/**
 * Set up filter button listeners
 */
function setupFilterListeners(container) {
  container.querySelectorAll('.source-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSourceFilter = btn.dataset.filter;
      // Re-render with new filter
      renderCombinedWorkerView(container, workersCache);
    });
  });
}

/**
 * Set up worker card action listeners
 */
function setupCardActions(container) {
  // Peek button (local)
  container.querySelectorAll('[data-action="peek"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const workerId = btn.dataset.worker;
      showWorkerOutput(workerId);
    });
  });

  // Logs button (K8s)
  container.querySelectorAll('[data-action="logs"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const workerId = btn.dataset.worker;
      showWorkerLogs(workerId);
    });
  });

  // Details button
  container.querySelectorAll('[data-action="details"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const workerId = btn.dataset.worker;
      showWorkerDetails(workerId);
    });
  });

  // Start button (local)
  container.querySelectorAll('[data-action="start"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const workerId = btn.dataset.worker;
      await handleWorkerStart(workerId, btn);
    });
  });

  // Stop button (local/K8s)
  container.querySelectorAll('[data-action="stop"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const workerId = btn.dataset.worker;
      await handleWorkerStop(workerId, btn);
    });
  });
}

/**
 * Show worker output (local polecats)
 */
function showWorkerOutput(workerId) {
  const worker = workersCache.find(w => w.id === workerId);
  if (worker) {
    // Dispatch event to open peek modal
    document.dispatchEvent(new CustomEvent('agent:peek', {
      detail: { agentId: worker.id }
    }));
  }
}

/**
 * Show worker logs (K8s polecats)
 */
function showWorkerLogs(workerId) {
  document.dispatchEvent(new CustomEvent('polecat:logs', {
    detail: { polecatId: workerId }
  }));
  showToast(`Loading logs for ${workerId}...`, 'info');
}

/**
 * Show worker details
 */
function showWorkerDetails(workerId) {
  const worker = workersCache.find(w => w.id === workerId);
  if (worker) {
    if (worker.source === 'k8s') {
      document.dispatchEvent(new CustomEvent('polecat:details', {
        detail: { polecat: worker.raw }
      }));
    } else {
      document.dispatchEvent(new CustomEvent('agent:detail', {
        detail: { agentId: worker.id }
      }));
    }
  }
}

/**
 * Handle starting a local worker
 */
async function handleWorkerStart(workerId, btn) {
  const worker = workersCache.find(w => w.id === workerId);
  if (!worker || worker.source !== 'local') return;

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="material-icons spinning">sync</span>';
  btn.disabled = true;

  try {
    // Parse rig and name from worker ID
    const parts = workerId.split('/');
    const rig = parts[0];
    const name = parts[parts.length - 1];

    await api.startAgent(rig, name);
    showToast(`Started polecat ${name}`, 'success');

    // Trigger refresh
    document.dispatchEvent(new CustomEvent('workers:refresh'));
  } catch (err) {
    showToast(`Error starting polecat: ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

/**
 * Handle stopping a worker
 */
async function handleWorkerStop(workerId, btn) {
  const worker = workersCache.find(w => w.id === workerId);
  if (!worker) return;

  if (!confirm(`Are you sure you want to stop polecat "${worker.name}"?`)) {
    return;
  }

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="material-icons spinning">sync</span>';
  btn.disabled = true;

  try {
    if (worker.source === 'local') {
      // Parse rig and name from worker ID
      const parts = workerId.split('/');
      const rig = parts[0];
      const name = parts[parts.length - 1];

      await api.stopAgent(rig, name);
      showToast(`Stopped polecat ${name}`, 'success');
    } else {
      // K8s - not yet implemented
      showToast('K8s write operations not yet implemented', 'warning');
    }

    // Trigger refresh
    document.dispatchEvent(new CustomEvent('workers:refresh'));
  } catch (err) {
    showToast(`Error stopping polecat: ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

// === Utility Functions ===

function formatAge(timestamp) {
  if (!timestamp) return 'unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) return `${diffDay}d`;
  if (diffHour > 0) return `${diffHour}h`;
  if (diffMin > 0) return `${diffMin}m`;
  return `${diffSec}s`;
}

function formatNumber(num) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${m}m`;
  if (m > 0) return `${m}m${s}s`;
  return `${s}s`;
}

function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}
