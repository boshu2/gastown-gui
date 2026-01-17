/**
 * Gas Town GUI - K8s Convoy List Component
 *
 * Renders the list of K8s Convoys (gastown.gastown.io/v1alpha1).
 * Shows phase, progress, and member polecats.
 */

import { AGENT_TYPES } from '../shared/agent-types.js';
import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

// Phase configuration for Convoy
const PHASE_CONFIG = {
  Pending: { color: '#6b7280', icon: 'schedule', label: 'Pending' },
  Running: { color: '#f59e0b', icon: 'play_circle', label: 'Running' },
  Succeeded: { color: '#22c55e', icon: 'check_circle', label: 'Succeeded' },
  Failed: { color: '#ef4444', icon: 'error', label: 'Failed' },
  Unknown: { color: '#6b7280', icon: 'help', label: 'Unknown' },
};

// Store convoys for updates
let convoysCache = [];

/**
 * Render the convoy list
 * @param {HTMLElement} container - The convoy list container
 * @param {Array} convoys - Array of convoy objects from K8s API
 */
export function renderK8sConvoyList(container, convoys) {
  if (!container) return;

  convoysCache = convoys || [];

  if (!convoys || convoys.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="material-icons empty-icon">local_shipping</span>
        <h3>No K8s Convoys</h3>
        <p>No Convoy resources found in the Kubernetes cluster</p>
        <p class="empty-hint">Convoys group related Polecats for coordinated execution</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="k8s-convoy-list-header">
      <div class="k8s-convoy-count">
        <span class="material-icons">local_shipping</span>
        <span>${convoys.length} Convoy${convoys.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="k8s-convoy-filters">
        <select id="k8s-convoy-phase-filter" class="filter-select">
          <option value="">All Phases</option>
          <option value="Running">Running</option>
          <option value="Pending">Pending</option>
          <option value="Succeeded">Succeeded</option>
          <option value="Failed">Failed</option>
        </select>
      </div>
    </div>
    <div class="k8s-convoy-cards">
      ${convoys.map((convoy, index) => renderConvoyCard(convoy, index)).join('')}
    </div>
  `;

  // Add filter listener
  const filterSelect = container.querySelector('#k8s-convoy-phase-filter');
  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      filterConvoys(container, e.target.value);
    });
  }

  // Add event listeners for actions
  setupConvoyActions(container);
}

/**
 * Render a single convoy card
 */
function renderConvoyCard(convoy, index) {
  const phase = PHASE_CONFIG[convoy.phase] || PHASE_CONFIG.Unknown;
  const age = formatAge(convoy.createdAt);
  const total = convoy.total || 0;
  const succeeded = convoy.succeeded || 0;
  const failed = convoy.failed || 0;
  const running = convoy.running || 0;
  const pending = total - succeeded - failed - running;
  const progress = total > 0 ? Math.round((succeeded / total) * 100) : 0;

  return `
    <div class="k8s-convoy-card animate-spawn stagger-${Math.min(index, 6)}"
         data-convoy-id="${escapeHtml(convoy.id)}"
         data-phase="${convoy.phase}">
      <div class="k8s-convoy-header">
        <div class="k8s-convoy-icon">
          <span class="material-icons" style="color: #f59e0b">local_shipping</span>
        </div>
        <div class="k8s-convoy-info">
          <h3 class="k8s-convoy-name">${escapeHtml(convoy.name)}</h3>
          <div class="k8s-convoy-namespace">
            <span class="material-icons">folder</span>
            ${escapeHtml(convoy.namespace)}
          </div>
        </div>
        <div class="k8s-convoy-badges">
          <span class="phase-badge" style="--phase-color: ${phase.color}" title="Phase: ${phase.label}">
            <span class="material-icons">${phase.icon}</span>
            ${phase.label}
          </span>
        </div>
      </div>

      ${convoy.title ? `
        <div class="k8s-convoy-title-row">
          <span class="material-icons">flag</span>
          <span class="title-text">${escapeHtml(convoy.title)}</span>
        </div>
      ` : ''}

      <div class="k8s-convoy-progress-section">
        <div class="k8s-convoy-progress-bar">
          <div class="progress-bar-track">
            <div class="progress-bar-fill progress-succeeded" style="width: ${total > 0 ? (succeeded / total) * 100 : 0}%"></div>
            <div class="progress-bar-fill progress-running" style="width: ${total > 0 ? (running / total) * 100 : 0}%; left: ${total > 0 ? (succeeded / total) * 100 : 0}%"></div>
            <div class="progress-bar-fill progress-failed" style="width: ${total > 0 ? (failed / total) * 100 : 0}%; left: ${total > 0 ? ((succeeded + running) / total) * 100 : 0}%"></div>
          </div>
        </div>
        <div class="k8s-convoy-stats">
          <span class="stat stat-succeeded" title="Succeeded">
            <span class="material-icons">check_circle</span>
            ${succeeded}
          </span>
          <span class="stat stat-running" title="Running">
            <span class="material-icons">play_circle</span>
            ${running}
          </span>
          <span class="stat stat-failed" title="Failed">
            <span class="material-icons">error</span>
            ${failed}
          </span>
          <span class="stat stat-pending" title="Pending">
            <span class="material-icons">schedule</span>
            ${pending}
          </span>
          <span class="stat stat-total" title="Total">
            <span class="material-icons">groups</span>
            ${total}
          </span>
        </div>
      </div>

      <div class="k8s-convoy-details">
        <div class="k8s-convoy-detail">
          <span class="material-icons">schedule</span>
          <span class="detail-label">Age:</span>
          <span class="detail-value">${age}</span>
        </div>
        ${convoy.selector ? `
          <div class="k8s-convoy-detail">
            <span class="material-icons">filter_list</span>
            <span class="detail-label">Selector:</span>
            <span class="detail-value">${escapeHtml(formatSelector(convoy.selector))}</span>
          </div>
        ` : ''}
      </div>

      ${convoy.members && convoy.members.length > 0 ? `
        <div class="k8s-convoy-members">
          <div class="members-header">
            <span class="material-icons">smart_toy</span>
            <span>Members (${convoy.members.length})</span>
          </div>
          <div class="members-list">
            ${convoy.members.slice(0, 5).map(member => `
              <div class="member-item" title="${escapeHtml(member.name)}">
                <span class="member-phase-dot" style="background: ${getMemberPhaseColor(member.phase)}"></span>
                <span class="member-name">${escapeHtml(member.name)}</span>
              </div>
            `).join('')}
            ${convoy.members.length > 5 ? `
              <div class="member-item member-more">
                +${convoy.members.length - 5} more
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div class="k8s-convoy-actions">
        <button class="btn btn-sm btn-secondary" data-action="details" data-convoy="${escapeHtml(convoy.id)}" title="View details">
          <span class="material-icons">info</span>
          Details
        </button>
        <button class="btn btn-sm btn-secondary" data-action="refresh" data-convoy="${escapeHtml(convoy.id)}" title="Refresh">
          <span class="material-icons">refresh</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Get color for member phase
 */
function getMemberPhaseColor(phase) {
  switch (phase) {
    case 'Succeeded': return '#22c55e';
    case 'Running': return '#f59e0b';
    case 'Failed': return '#ef4444';
    case 'Claimed': return '#3b82f6';
    case 'Queued': return '#6b7280';
    default: return '#6b7280';
  }
}

/**
 * Format label selector object to string
 */
function formatSelector(selector) {
  if (!selector) return '';
  if (typeof selector === 'string') return selector;
  if (selector.matchLabels) {
    return Object.entries(selector.matchLabels)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
  }
  return JSON.stringify(selector);
}

/**
 * Set up event listeners for convoy actions
 */
function setupConvoyActions(container) {
  // Details button
  container.querySelectorAll('[data-action="details"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const convoyId = btn.dataset.convoy;
      showConvoyDetails(convoyId);
    });
  });

  // Refresh button
  container.querySelectorAll('[data-action="refresh"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const convoyId = btn.dataset.convoy;
      refreshConvoy(convoyId, btn);
    });
  });
}

/**
 * Filter convoys by phase
 */
function filterConvoys(container, phase) {
  const cards = container.querySelectorAll('.k8s-convoy-card');
  cards.forEach(card => {
    if (!phase || card.dataset.phase === phase) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * Show convoy details modal
 */
function showConvoyDetails(convoyId) {
  const convoy = convoysCache.find(c => c.id === convoyId);
  if (convoy) {
    const event = new CustomEvent('k8s:convoy:details', { detail: { convoy } });
    document.dispatchEvent(event);
    showToast(`Convoy: ${convoy.name}`, 'info');
  }
}

/**
 * Refresh a single convoy
 */
async function refreshConvoy(convoyId, btn) {
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<span class="material-icons spinning">sync</span>';
  btn.disabled = true;

  try {
    // Trigger full refresh of convoy list
    document.dispatchEvent(new CustomEvent('k8s:convoys:refresh'));
    showToast('Refreshing convoys...', 'info');
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }, 500);
  }
}

/**
 * Load convoys from K8s API
 */
export async function loadK8sConvoys(namespace = '') {
  try {
    const params = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    const response = await api.get(`/api/k8s/convoys${params}`);
    return response.items || [];
  } catch (err) {
    console.error('[K8sConvoyList] Failed to load convoys:', err);
    return [];
  }
}

/**
 * Handle WebSocket convoy events
 */
export function handleConvoyEvent(type, convoy) {
  switch (type) {
    case 'added':
      convoysCache = [...convoysCache.filter(c => c.id !== convoy.id), convoy];
      break;
    case 'modified':
      convoysCache = convoysCache.map(c => c.id === convoy.id ? convoy : c);
      break;
    case 'deleted':
      convoysCache = convoysCache.filter(c => c.id !== convoy.id);
      break;
  }

  // Trigger re-render
  document.dispatchEvent(new CustomEvent('k8s:convoys:updated', { detail: { convoys: convoysCache } }));
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
