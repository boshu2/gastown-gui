/**
 * Gas Town GUI - Polecat Detail Modal Component
 *
 * Shows full polecat details when clicking the "Details" button in the polecat list.
 * Displays all polecat fields with nice formatting in Spec, Status, and Metadata sections.
 */

import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

// Phase configuration (copied from polecat-list.js for consistent display)
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

// Modal elements
let modalElement = null;
let overlayElement = null;

/**
 * Initialize the polecat detail modal
 */
export function initPolecatDetailModal() {
  modalElement = document.getElementById('polecat-detail-modal');
  overlayElement = document.getElementById('modal-overlay');

  if (!modalElement) {
    console.warn('[PolecatDetailModal] Modal element not found');
    return;
  }

  // Set up close button handler
  const closeBtn = modalElement.querySelector('[data-modal-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Set up copy JSON button
  const copyBtn = modalElement.querySelector('#polecat-detail-copy-json');
  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyJson);
  }

  // Listen for polecat:details event
  document.addEventListener('polecat:details', handlePolecatDetails);
}

/**
 * Handle polecat:details event
 */
function handlePolecatDetails(e) {
  const { polecat } = e.detail;
  if (polecat) {
    showPolecatDetailModal(polecat);
  }
}

/**
 * Show the polecat detail modal with full polecat data
 */
function showPolecatDetailModal(polecat) {
  if (!modalElement) return;

  // Store polecat data for copy function
  modalElement.dataset.polecatJson = JSON.stringify(polecat, null, 2);

  // Update modal content
  renderPolecatDetails(polecat);

  // Show modal
  overlayElement?.classList.remove('hidden');
  modalElement.classList.remove('hidden');
}

/**
 * Render polecat details in the modal
 */
function renderPolecatDetails(polecat) {
  const phase = PHASE_CONFIG[polecat.phase] || PHASE_CONFIG.Unknown;
  const health = HEALTH_CONFIG[polecat.healthState] || HEALTH_CONFIG.Unknown;

  // Header
  const headerName = modalElement.querySelector('#polecat-detail-name');
  if (headerName) {
    headerName.textContent = polecat.name;
  }

  // Body content
  const bodyEl = modalElement.querySelector('.polecat-detail-body');
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <!-- Spec Section -->
    <div class="polecat-detail-section">
      <h3 class="section-header">
        <span class="material-icons">settings</span>
        Spec
      </h3>
      <div class="detail-grid">
        ${renderDetailRow('Objective', polecat.objective, 'flag')}
        ${renderDetailRow('Rig Ref', polecat.rigRef, 'folder_special')}
        ${renderDetailRow('Agent Type', polecat.agentType, 'smart_toy')}
        ${renderDetailRow('Execution Mode', polecat.executionMode, 'play_arrow')}
        ${polecat.agentConfig ? renderDetailRow('Agent Config', JSON.stringify(polecat.agentConfig, null, 2), 'code', true) : ''}
        ${polecat.limits ? `
          <div class="detail-row detail-row-block">
            <div class="detail-label">
              <span class="material-icons">timer</span>
              Limits
            </div>
            <div class="detail-value limits-grid">
              ${polecat.limits.maxIterations ? `<span class="limit-item"><strong>Max Iterations:</strong> ${polecat.limits.maxIterations}</span>` : ''}
              ${polecat.limits.maxTokens ? `<span class="limit-item"><strong>Max Tokens:</strong> ${formatNumber(polecat.limits.maxTokens)}</span>` : ''}
              ${polecat.limits.maxDuration ? `<span class="limit-item"><strong>Max Duration:</strong> ${polecat.limits.maxDuration}</span>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Status Section -->
    <div class="polecat-detail-section">
      <h3 class="section-header">
        <span class="material-icons">monitoring</span>
        Status
      </h3>
      <div class="detail-grid">
        <div class="detail-row">
          <div class="detail-label">
            <span class="material-icons">sync_alt</span>
            Phase
          </div>
          <div class="detail-value">
            <span class="phase-badge" style="--phase-color: ${phase.color}">
              <span class="material-icons">${phase.icon}</span>
              ${phase.label}
            </span>
          </div>
        </div>
        <div class="detail-row">
          <div class="detail-label">
            <span class="material-icons">health_and_safety</span>
            Health
          </div>
          <div class="detail-value">
            <span class="health-badge" style="--health-color: ${health.color}">
              <span class="material-icons">${health.icon}</span>
              ${health.label}
            </span>
          </div>
        </div>
        ${renderDetailRow('Claimed By', polecat.claimedBy, 'person')}
        ${renderDetailRow('Active Run Ref', polecat.activeRunRef, 'directions_run')}
        ${polecat.metrics ? `
          <div class="detail-row detail-row-block">
            <div class="detail-label">
              <span class="material-icons">analytics</span>
              Metrics
            </div>
            <div class="detail-value metrics-grid">
              ${polecat.metrics.iterations !== undefined ? `
                <div class="metric-item">
                  <span class="metric-value">${polecat.metrics.iterations}</span>
                  <span class="metric-label">iterations</span>
                </div>
              ` : ''}
              ${polecat.metrics.tokensUsed !== undefined ? `
                <div class="metric-item">
                  <span class="metric-value">${formatNumber(polecat.metrics.tokensUsed)}</span>
                  <span class="metric-label">tokens used</span>
                </div>
              ` : ''}
              ${polecat.metrics.duration !== undefined ? `
                <div class="metric-item">
                  <span class="metric-value">${formatDuration(polecat.metrics.duration)}</span>
                  <span class="metric-label">duration</span>
                </div>
              ` : ''}
            </div>
          </div>
        ` : ''}
        ${polecat.conditions && polecat.conditions.length > 0 ? `
          <div class="detail-row detail-row-block">
            <div class="detail-label">
              <span class="material-icons">checklist</span>
              Conditions
            </div>
            <div class="detail-value conditions-list">
              ${polecat.conditions.map(c => renderConditionBadge(c)).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Metadata Section -->
    <div class="polecat-detail-section">
      <h3 class="section-header">
        <span class="material-icons">info</span>
        Metadata
      </h3>
      <div class="detail-grid">
        ${renderDetailRow('Name', polecat.name, 'label')}
        ${renderDetailRow('Namespace', polecat.namespace, 'folder')}
        ${renderDetailRow('Created At', polecat.createdAt ? new Date(polecat.createdAt).toLocaleString() : null, 'schedule')}
        ${polecat.labels && Object.keys(polecat.labels).length > 0 ? `
          <div class="detail-row detail-row-block">
            <div class="detail-label">
              <span class="material-icons">sell</span>
              Labels
            </div>
            <div class="detail-value labels-list">
              ${Object.entries(polecat.labels).map(([k, v]) => `
                <span class="label-tag">${escapeHtml(k)}: ${escapeHtml(v)}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${polecat.annotations && Object.keys(polecat.annotations).length > 0 ? `
          <div class="detail-row detail-row-block">
            <div class="detail-label">
              <span class="material-icons">notes</span>
              Annotations
            </div>
            <div class="detail-value annotations-list">
              ${Object.entries(polecat.annotations).map(([k, v]) => `
                <div class="annotation-item">
                  <span class="annotation-key">${escapeHtml(k)}</span>
                  <span class="annotation-value">${escapeHtml(truncate(v, 100))}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Render a single detail row
 */
function renderDetailRow(label, value, icon, isCode = false) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const displayValue = isCode
    ? `<pre class="detail-code">${escapeHtml(value)}</pre>`
    : `<span>${escapeHtml(String(value))}</span>`;

  return `
    <div class="detail-row ${isCode ? 'detail-row-block' : ''}">
      <div class="detail-label">
        <span class="material-icons">${icon}</span>
        ${label}
      </div>
      <div class="detail-value">${displayValue}</div>
    </div>
  `;
}

/**
 * Render a condition badge
 */
function renderConditionBadge(condition) {
  const statusColors = {
    True: '#22c55e',
    False: '#ef4444',
    Unknown: '#6b7280',
  };
  const color = statusColors[condition.status] || statusColors.Unknown;

  return `
    <div class="condition-badge" style="--condition-color: ${color}">
      <span class="condition-type">${escapeHtml(condition.type)}</span>
      <span class="condition-status">${escapeHtml(condition.status)}</span>
      ${condition.message ? `<span class="condition-message" title="${escapeHtml(condition.message)}">${escapeHtml(truncate(condition.message, 50))}</span>` : ''}
    </div>
  `;
}

/**
 * Handle copy JSON button click
 */
function handleCopyJson() {
  const json = modalElement?.dataset.polecatJson;
  if (json) {
    navigator.clipboard.writeText(json).then(() => {
      showToast('Polecat JSON copied to clipboard', 'success');
    }).catch(err => {
      showToast('Failed to copy: ' + err.message, 'error');
    });
  }
}

/**
 * Close the modal
 */
function closeModal() {
  modalElement?.classList.add('hidden');
  overlayElement?.classList.add('hidden');
}

// === Utility Functions ===

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
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function truncate(str, maxLen) {
  if (!str || str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}
