/**
 * Gas Town GUI - K8s Metrics Dashboard Component
 *
 * Visualizes K8s Automaton metrics with summary cards and charts.
 * Features: aggregated stats, phase breakdown, export to CSV.
 */

import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

/**
 * Render the metrics dashboard
 * @param {HTMLElement} container - Container element
 * @param {string} namespace - Optional namespace filter
 */
export async function renderMetricsDashboard(container, namespace = null) {
  if (!container) return;

  container.innerHTML = `
    <div class="metrics-loading">
      <span class="loading-spinner"></span>
      Loading metrics...
    </div>
  `;

  try {
    const metrics = await api.getK8sMetrics(namespace);
    renderMetricsContent(container, metrics, namespace);
  } catch (err) {
    container.innerHTML = `
      <div class="metrics-error">
        <span class="material-icons">error</span>
        <span>Failed to load metrics: ${escapeHtml(err.message)}</span>
      </div>
    `;
  }
}

/**
 * Render metrics content
 */
function renderMetricsContent(container, metrics, namespace) {
  const successRate = metrics.total > 0
    ? Math.round(((metrics.byPhase['Succeeded'] || 0) / metrics.total) * 100)
    : 0;

  container.innerHTML = `
    <div class="metrics-header">
      <h2>
        <span class="material-icons">analytics</span>
        K8s Metrics Dashboard
      </h2>
      <div class="metrics-actions">
        <select id="metrics-namespace-filter" class="filter-select">
          <option value="">All Namespaces</option>
        </select>
        <button class="btn btn-sm btn-secondary" id="metrics-refresh-btn" title="Refresh">
          <span class="material-icons">refresh</span>
        </button>
        <button class="btn btn-sm btn-secondary" id="metrics-export-btn" title="Export CSV">
          <span class="material-icons">download</span>
          Export CSV
        </button>
      </div>
    </div>

    <div class="metrics-summary-cards">
      <div class="metric-card">
        <div class="metric-icon" style="background: #3b82f6;">
          <span class="material-icons">smart_toy</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">${metrics.total}</div>
          <div class="metric-label">Total Automatons</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon" style="background: #22c55e;">
          <span class="material-icons">check_circle</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">${successRate}%</div>
          <div class="metric-label">Success Rate</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon" style="background: #f59e0b;">
          <span class="material-icons">token</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">${formatNumber(metrics.totals.tokensUsed)}</div>
          <div class="metric-label">Total Tokens</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon" style="background: #8b5cf6;">
          <span class="material-icons">attach_money</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">$${metrics.totals.costUsd.toFixed(2)}</div>
          <div class="metric-label">Total Cost</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon" style="background: #ec4899;">
          <span class="material-icons">timer</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">${formatDuration(metrics.averages.durationSeconds)}</div>
          <div class="metric-label">Avg Duration</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon" style="background: #14b8a6;">
          <span class="material-icons">repeat</span>
        </div>
        <div class="metric-content">
          <div class="metric-value">${Math.round(metrics.averages.iterations)}</div>
          <div class="metric-label">Avg Iterations</div>
        </div>
      </div>
    </div>

    <div class="metrics-charts">
      <div class="chart-card">
        <h3>Phase Distribution</h3>
        <div class="phase-chart" id="phase-chart">
          ${renderPhaseChart(metrics.byPhase, metrics.total)}
        </div>
      </div>

      <div class="chart-card">
        <h3>Top Automatons by Tokens</h3>
        <div class="top-list" id="top-tokens-list">
          ${renderTopList(metrics.polecats, 'tokensUsed', 'tokens')}
        </div>
      </div>

      <div class="chart-card">
        <h3>Top Automatons by Cost</h3>
        <div class="top-list" id="top-cost-list">
          ${renderTopList(metrics.polecats, 'costUsd', 'cost', v => `$${v.toFixed(2)}`)}
        </div>
      </div>

      <div class="chart-card full-width">
        <h3>Recent Automatons</h3>
        <div class="metrics-table-container">
          ${renderMetricsTable(metrics.polecats)}
        </div>
      </div>
    </div>
  `;

  // Wire up controls
  setupMetricsControls(container, namespace);
}

/**
 * Render phase distribution chart (horizontal bar)
 */
function renderPhaseChart(byPhase, total) {
  if (total === 0) {
    return '<div class="chart-empty">No data</div>';
  }

  const phases = [
    { key: 'Succeeded', color: '#22c55e', icon: 'check_circle' },
    { key: 'Running', color: '#f59e0b', icon: 'play_circle' },
    { key: 'Failed', color: '#ef4444', icon: 'error' },
    { key: 'Queued', color: '#6b7280', icon: 'schedule' },
    { key: 'Claimed', color: '#3b82f6', icon: 'front_hand' },
  ];

  return phases.map(phase => {
    const count = byPhase[phase.key] || 0;
    const pct = Math.round((count / total) * 100);
    return `
      <div class="phase-bar-row">
        <div class="phase-label">
          <span class="material-icons" style="color: ${phase.color}">${phase.icon}</span>
          <span>${phase.key}</span>
        </div>
        <div class="phase-bar-container">
          <div class="phase-bar" style="width: ${pct}%; background: ${phase.color}"></div>
        </div>
        <div class="phase-count">${count} (${pct}%)</div>
      </div>
    `;
  }).join('');
}

/**
 * Render top list by metric
 */
function renderTopList(polecats, metricKey, label, formatter = v => formatNumber(v)) {
  const sorted = [...polecats]
    .filter(p => p.metrics && p.metrics[metricKey] > 0)
    .sort((a, b) => (b.metrics[metricKey] || 0) - (a.metrics[metricKey] || 0))
    .slice(0, 5);

  if (sorted.length === 0) {
    return '<div class="chart-empty">No data</div>';
  }

  const max = sorted[0].metrics[metricKey];

  return sorted.map((p, i) => {
    const value = p.metrics[metricKey] || 0;
    const pct = Math.round((value / max) * 100);
    return `
      <div class="top-item">
        <div class="top-rank">#${i + 1}</div>
        <div class="top-info">
          <div class="top-name">${escapeHtml(p.name)}</div>
          <div class="top-bar" style="width: ${pct}%"></div>
        </div>
        <div class="top-value">${formatter(value)}</div>
      </div>
    `;
  }).join('');
}

/**
 * Render metrics table
 */
function renderMetricsTable(polecats) {
  if (polecats.length === 0) {
    return '<div class="chart-empty">No automatons</div>';
  }

  const sorted = [...polecats].sort((a, b) =>
    new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  ).slice(0, 10);

  return `
    <table class="metrics-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Phase</th>
          <th>Iterations</th>
          <th>Tokens</th>
          <th>Cost</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        ${sorted.map(p => `
          <tr>
            <td class="name-cell">${escapeHtml(p.name)}</td>
            <td><span class="phase-badge-sm phase-${(p.phase || 'unknown').toLowerCase()}">${p.phase || 'Unknown'}</span></td>
            <td>${p.metrics?.iterations || 0}</td>
            <td>${formatNumber(p.metrics?.tokensUsed || 0)}</td>
            <td>$${(p.metrics?.costUsd || 0).toFixed(2)}</td>
            <td>${formatDuration(p.metrics?.duration || 0)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Set up metrics controls
 */
function setupMetricsControls(container, currentNamespace) {
  const refreshBtn = container.querySelector('#metrics-refresh-btn');
  const exportBtn = container.querySelector('#metrics-export-btn');
  const namespaceSelect = container.querySelector('#metrics-namespace-filter');

  // Refresh
  refreshBtn.addEventListener('click', () => {
    const ns = namespaceSelect.value || null;
    renderMetricsDashboard(container, ns);
  });

  // Export
  exportBtn.addEventListener('click', () => {
    const ns = namespaceSelect.value || null;
    const url = api.getK8sMetricsExportUrl(ns);
    window.open(url, '_blank');
    showToast('Downloading CSV...', 'info');
  });

  // Namespace filter
  namespaceSelect.addEventListener('change', () => {
    const ns = namespaceSelect.value || null;
    renderMetricsDashboard(container, ns);
  });

  // Load namespaces
  loadNamespaces(namespaceSelect, currentNamespace);
}

/**
 * Load namespaces for filter
 */
async function loadNamespaces(select, current) {
  try {
    const res = await api.getK8sNamespaces();
    const namespaces = res.namespaces || [];

    namespaces.forEach(ns => {
      const option = document.createElement('option');
      option.value = ns;
      option.textContent = ns;
      if (ns === current) option.selected = true;
      select.appendChild(option);
    });
  } catch (err) {
    console.warn('[metrics] Failed to load namespaces:', err);
  }
}

// Utility functions
function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function formatDuration(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default {
  renderMetricsDashboard,
};
