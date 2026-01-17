/**
 * Gas Town GUI - Polecat List Component
 *
 * Renders the list of K8s Polecats (gastown.gastown.io/v1alpha1).
 * Shows phase, health, rig reference, and metrics.
 */

import { AGENT_TYPES, STATUS_COLORS } from '../shared/agent-types.js';
import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

// Phase configuration
const PHASE_CONFIG = {
  Queued: { color: '#6b7280', icon: 'schedule', label: 'Queued' },
  Claimed: { color: '#f59e0b', icon: 'front_hand', label: 'Claimed' },
  Running: { color: '#22c55e', icon: 'play_circle', label: 'Running' },
  Succeeded: { color: '#10b981', icon: 'check_circle', label: 'Succeeded' },
  Failed: { color: '#ef4444', icon: 'error', label: 'Failed' },
  Unknown: { color: '#6b7280', icon: 'help', label: 'Unknown' },
};

// Health configuration
const HEALTH_CONFIG = {
  Healthy: { color: '#22c55e', icon: 'favorite', label: 'Healthy' },
  Degraded: { color: '#f59e0b', icon: 'healing', label: 'Degraded' },
  Unhealthy: { color: '#ef4444', icon: 'heart_broken', label: 'Unhealthy' },
  Unknown: { color: '#6b7280', icon: 'help', label: 'Unknown' },
};

// Store polecats for updates
let polecatsCache = [];

/**
 * Render the polecat list
 * @param {HTMLElement} container - The polecat list container
 * @param {Array} polecats - Array of polecat objects from K8s API
 */
export function renderPolecatList(container, polecats) {
  if (!container) return;

  polecatsCache = polecats || [];

  if (!polecats || polecats.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons empty-icon">cloud_off</span>
        <h3>No K8s Polecats</h3>
        <p>No Polecat resources found in the Kubernetes cluster</p>
        <p class="empty-hint">Polecats are created when work is dispatched to K8s execution mode</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="polecat-list-header">
      <div class="polecat-count">
        <span class="material-icons">${AGENT_TYPES.polecat.icon}</span>
        <span>${polecats.length} Polecat${polecats.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="polecat-filters">
        <select id="polecat-phase-filter" class="filter-select">
          <option value="">All Phases</option>
          <option value="Running">Running</option>
          <option value="Queued">Queued</option>
          <option value="Claimed">Claimed</option>
          <option value="Succeeded">Succeeded</option>
          <option value="Failed">Failed</option>
        </select>
      </div>
    </div>
    <div class="polecat-cards">
      ${polecats.map((polecat, index) => renderPolecatCard(polecat, index)).join('')}
    </div>
  `;

  // Add filter listener
  const filterSelect = container.querySelector('#polecat-phase-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      filterPolecats(container, e.target.value);
    });
  }

  // Add event listeners for actions
  setupPolecatActions(container);
}

/**
 * Render a single polecat card
 */
function renderPolecatCard(polecat, index) {
  const phase = PHASE_CONFIG[polecat.phase] || PHASE_CONFIG.Unknown;
  const health = HEALTH_CONFIG[polecat.healthState] || HEALTH_CONFIG.Unknown;
  const age = formatAge(polecat.createdAt);

  return `
    <div class="polecat-card animate-spawn stagger-${Math.min(index, 6)}"
         data-polecat-id="${escapeHtml(polecat.id)}"
         data-phase="${polecat.phase}">
      <div class="polecat-header">
        <div class="polecat-icon">
          <span class="material-icons" style="color: ${AGENT_TYPES.polecat.color}">${AGENT_TYPES.polecat.icon}</span>
        </div>
        <div class="polecat-info">
          <h3 class="polecat-name">${escapeHtml(polecat.name)}</h3>
          <div class="polecat-namespace">
            <span class="material-icons">folder</span>
            ${escapeHtml(polecat.namespace)}
          </div>
        </div>
        <div class="polecat-badges">
          <span class="phase-badge" style="--phase-color: ${phase.color}" title="Phase: ${phase.label}">
            <span class="material-icons">${phase.icon}</span>
            ${phase.label}
          </span>
          <span class="health-badge" style="--health-color: ${health.color}" title="Health: ${health.label}">
            <span class="material-icons">${health.icon}</span>
          </span>
        </div>
      </div>

      ${polecat.objective ? `
        <div class="polecat-objective">
          <span class="material-icons">flag</span>
          <span class="objective-text">${escapeHtml(truncate(polecat.objective, 100))}</span>
        </div>
      ` : ''}

      <div class="polecat-details">
        ${polecat.rigRef ? `
          <div class="polecat-detail">
            <span class="material-icons">folder_special</span>
            <span class="detail-label">Rig:</span>
            <span class="detail-value">${escapeHtml(polecat.rigRef)}</span>
          </div>
        ` : ''}
        ${polecat.agentType ? `
          <div class="polecat-detail">
            <span class="material-icons">smart_toy</span>
            <span class="detail-label">Agent:</span>
            <span class="detail-value">${escapeHtml(polecat.agentType)}</span>
          </div>
        ` : ''}
        ${polecat.executionMode ? `
          <div class="polecat-detail">
            <span class="material-icons">play_arrow</span>
            <span class="detail-label">Mode:</span>
            <span class="detail-value">${escapeHtml(polecat.executionMode)}</span>
          </div>
        ` : ''}
        <div class="polecat-detail">
          <span class="material-icons">schedule</span>
          <span class="detail-label">Age:</span>
          <span class="detail-value">${age}</span>
        </div>
      </div>

      ${polecat.metrics ? `
        <div class="polecat-metrics">
          ${polecat.metrics.iterations !== undefined ? `
            <div class="metric">
              <span class="metric-value">${polecat.metrics.iterations}</span>
              <span class="metric-label">iterations</span>
            </div>
          ` : ''}
          ${polecat.metrics.tokensUsed !== undefined ? `
            <div class="metric">
              <span class="metric-value">${formatNumber(polecat.metrics.tokensUsed)}</span>
              <span class="metric-label">tokens</span>
            </div>
          ` : ''}
          ${polecat.metrics.duration !== undefined ? `
            <div class="metric">
              <span class="metric-value">${formatDuration(polecat.metrics.duration)}</span>
              <span class="metric-label">duration</span>
            </div>
          ` : ''}
        </div>
      ` : ''}

      ${polecat.claimedBy ? `
        <div class="polecat-claimed">
          <span class="material-icons">person</span>
          Claimed by: ${escapeHtml(polecat.claimedBy)}
        </div>
      ` : ''}

      <div class="polecat-actions">
        <button class="btn btn-sm btn-secondary" data-action="logs" data-polecat="${escapeHtml(polecat.id)}" title="View logs">
          <span class="material-icons">terminal</span>
          Logs
        </button>
        <button class="btn btn-sm btn-secondary" data-action="details" data-polecat="${escapeHtml(polecat.id)}" title="View details">
          <span class="material-icons">info</span>
          Details
        </button>
        ${polecat.phase === 'Running' ? `
          <button class="btn btn-sm btn-danger-ghost" data-action="stop" data-polecat="${escapeHtml(polecat.id)}" title="Stop polecat">
            <span class="material-icons">stop</span>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Set up event listeners for polecat actions
 */
function setupPolecatActions(container) {
  // Logs button
  container.querySelectorAll('[data-action="logs"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const polecatId = btn.dataset.polecat;
      showPolecatLogs(polecatId);
    });
  });

  // Details button
  container.querySelectorAll('[data-action="details"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const polecatId = btn.dataset.polecat;
      showPolecatDetails(polecatId);
    });
  });

  // Stop button
  container.querySelectorAll('[data-action="stop"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const polecatId = btn.dataset.polecat;
      await handlePolecatStop(polecatId, btn);
    });
  });
}

/**
 * Filter polecats by phase
 */
function filterPolecats(container, phase) {
  const cards = container.querySelectorAll('.polecat-card');
  cards.forEach(card => {
    if (!phase || card.dataset.phase === phase) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * Show polecat logs modal
 */
function showPolecatLogs(polecatId) {
  const event = new CustomEvent('polecat:logs', { detail: { polecatId } });
  document.dispatchEvent(event);
  showToast(`Loading logs for ${polecatId}...`, 'info');
}

/**
 * Show polecat details modal
 */
function showPolecatDetails(polecatId) {
  const polecat = polecatsCache.find(p => p.id === polecatId);
  if (polecat) {
    const event = new CustomEvent('polecat:details', { detail: { polecat } });
    document.dispatchEvent(event);
  }
}

/**
 * Handle stopping a polecat
 */
async function handlePolecatStop(polecatId, btn) {
  if (!confirm(`Are you sure you want to stop polecat "${polecatId}"?`)) {
    return;
  }

  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="material-icons spinning">sync</span>';
  btn.disabled = true;

  try {
    // TODO: Implement K8s delete when write operations are added
    showToast('K8s write operations not yet implemented', 'warning');
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

/**
 * Load polecats from K8s API
 */
export async function loadPolecats(namespace = '') {
  try {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    const response = await api.get(`/api/k8s/polecats${params}`);
    return response.items || [];
  } catch (err) {
    console.error('[PolecatList] Failed to load polecats:', err);
    return [];
  }
}

/**
 * Handle WebSocket polecat events
 */
export function handlePolecatEvent(type, polecat) {
  switch (type) {
    case 'added':
      polecatsCache = [...polecatsCache.filter(p => p.id !== polecat.id), polecat];
      break;
    case 'modified':
      polecatsCache = polecatsCache.map(p => p.id === polecat.id ? polecat : p);
      break;
    case 'deleted':
      polecatsCache = polecatsCache.filter(p => p.id !== polecat.id);
      break;
  }

  // Trigger re-render
  document.dispatchEvent(new CustomEvent('polecats:updated', { detail: { polecats: polecatsCache } }));
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
