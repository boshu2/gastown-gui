/**
 * Gas Town GUI - Settings Panel Component
 *
 * Modal-based settings panel for configuring K8s integration and display preferences.
 * Settings are persisted to localStorage.
 */

import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

// Storage key for settings
const STORAGE_KEY = 'gastown-settings';

// Default settings
const DEFAULT_SETTINGS = {
  k8s: {
    defaultNamespace: 'default',
    autoRefresh: true,
    refreshInterval: 30000,
  },
  display: {
    defaultMode: 'hybrid',
    showLocalWorkers: true,
    showK8sWorkers: true,
  },
  notifications: {
    k8sEvents: true,
    convoyUpdates: true,
  },
};

// Current settings (in-memory cache)
let currentSettings = null;

/**
 * Load settings from localStorage
 */
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Deep merge with defaults to ensure all keys exist
      currentSettings = deepMerge(DEFAULT_SETTINGS, parsed);
    } else {
      currentSettings = { ...DEFAULT_SETTINGS };
    }
  } catch (err) {
    console.error('[Settings] Failed to load settings:', err);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
  return currentSettings;
}

/**
 * Save settings to localStorage
 */
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    currentSettings = settings;
    return true;
  } catch (err) {
    console.error('[Settings] Failed to save settings:', err);
    return false;
  }
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Get current settings
 */
export function getSettings() {
  if (!currentSettings) {
    loadSettings();
  }
  return { ...currentSettings };
}

/**
 * Update settings (partial update)
 */
export function updateSettings(partial) {
  const current = getSettings();
  const updated = deepMerge(current, partial);
  if (saveSettings(updated)) {
    // Dispatch event for listeners
    document.dispatchEvent(new CustomEvent('settings:changed', { detail: updated }));
    return updated;
  }
  return current;
}

/**
 * Reset settings to defaults
 */
export function resetSettings() {
  saveSettings({ ...DEFAULT_SETTINGS });
  document.dispatchEvent(new CustomEvent('settings:changed', { detail: currentSettings }));
  return currentSettings;
}

/**
 * Initialize settings panel
 */
export function initSettingsPanel() {
  // Load settings on init
  loadSettings();

  // Register modal handlers
  const modal = document.getElementById('settings-modal');
  const openBtn = document.getElementById('settings-btn');

  if (openBtn) {
    openBtn.addEventListener('click', () => openSettingsModal());
  }

  if (modal) {
    // Close button
    modal.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', () => closeSettingsModal());
    });

    // Form submission
    const form = modal.querySelector('#settings-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleSettingsSubmit(form);
      });
    }

    // Reset button
    const resetBtn = modal.querySelector('#settings-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Reset all settings to defaults?')) {
          resetSettings();
          populateSettingsForm();
          showToast('Settings reset to defaults', 'info');
        }
      });
    }
  }

  // Apply saved settings
  applySettings(currentSettings);

  console.log('[Settings] Panel initialized');
}

/**
 * Open settings modal
 */
function openSettingsModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('settings-modal');

  if (overlay && modal) {
    // Hide any other open modals
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));

    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');

    // Populate form with current settings
    populateSettingsForm();

    // Fetch K8s context info
    fetchK8sContext();
  }
}

/**
 * Close settings modal
 */
function closeSettingsModal() {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('settings-modal');

  if (modal) modal.classList.add('hidden');
  if (overlay) overlay.classList.add('hidden');
}

/**
 * Populate settings form with current values
 */
function populateSettingsForm() {
  const settings = getSettings();
  const form = document.getElementById('settings-form');
  if (!form) return;

  // K8s settings
  const namespaceInput = form.querySelector('[name="k8s-namespace"]');
  const autoRefreshCheck = form.querySelector('[name="k8s-auto-refresh"]');
  const refreshIntervalSelect = form.querySelector('[name="k8s-refresh-interval"]');

  if (namespaceInput) namespaceInput.value = settings.k8s.defaultNamespace;
  if (autoRefreshCheck) autoRefreshCheck.checked = settings.k8s.autoRefresh;
  if (refreshIntervalSelect) refreshIntervalSelect.value = settings.k8s.refreshInterval.toString();

  // Display settings
  const defaultModeSelect = form.querySelector('[name="display-mode"]');
  const showLocalCheck = form.querySelector('[name="show-local-workers"]');
  const showK8sCheck = form.querySelector('[name="show-k8s-workers"]');

  if (defaultModeSelect) defaultModeSelect.value = settings.display.defaultMode;
  if (showLocalCheck) showLocalCheck.checked = settings.display.showLocalWorkers;
  if (showK8sCheck) showK8sCheck.checked = settings.display.showK8sWorkers;

  // Notification settings
  const k8sEventsCheck = form.querySelector('[name="notify-k8s-events"]');
  const convoyUpdatesCheck = form.querySelector('[name="notify-convoy-updates"]');

  if (k8sEventsCheck) k8sEventsCheck.checked = settings.notifications.k8sEvents;
  if (convoyUpdatesCheck) convoyUpdatesCheck.checked = settings.notifications.convoyUpdates;
}

/**
 * Handle settings form submission
 */
function handleSettingsSubmit(form) {
  const formData = new FormData(form);

  const newSettings = {
    k8s: {
      defaultNamespace: formData.get('k8s-namespace') || 'default',
      autoRefresh: formData.get('k8s-auto-refresh') === 'on',
      refreshInterval: parseInt(formData.get('k8s-refresh-interval') || '30000', 10),
    },
    display: {
      defaultMode: formData.get('display-mode') || 'hybrid',
      showLocalWorkers: formData.get('show-local-workers') === 'on',
      showK8sWorkers: formData.get('show-k8s-workers') === 'on',
    },
    notifications: {
      k8sEvents: formData.get('notify-k8s-events') === 'on',
      convoyUpdates: formData.get('notify-convoy-updates') === 'on',
    },
  };

  updateSettings(newSettings);
  applySettings(newSettings);
  closeSettingsModal();
  showToast('Settings saved', 'success');
}

/**
 * Fetch and display K8s context info
 */
async function fetchK8sContext() {
  const contextEl = document.getElementById('k8s-context-info');
  const statusEl = document.getElementById('k8s-connection-status');

  if (!contextEl && !statusEl) return;

  try {
    const res = await fetch('/api/k8s/health');
    const data = await res.json();

    if (data.ok) {
      if (contextEl) {
        contextEl.innerHTML = `
          <div class="k8s-context-item">
            <span class="context-label">Context:</span>
            <span class="context-value">${escapeHtml(data.status?.context || 'unknown')}</span>
          </div>
          <div class="k8s-context-item">
            <span class="context-label">Mode:</span>
            <span class="context-value">${escapeHtml(data.status?.mode || 'unknown')}</span>
          </div>
        `;
      }
      if (statusEl) {
        statusEl.className = 'settings-status-badge connected';
        statusEl.innerHTML = '<span class="material-icons">check_circle</span> Connected';
      }
    } else {
      if (contextEl) {
        contextEl.innerHTML = '<div class="k8s-context-error">Not connected to cluster</div>';
      }
      if (statusEl) {
        statusEl.className = 'settings-status-badge disconnected';
        statusEl.innerHTML = '<span class="material-icons">cancel</span> Disconnected';
      }
    }
  } catch (err) {
    if (contextEl) {
      contextEl.innerHTML = '<div class="k8s-context-error">Unable to fetch K8s status</div>';
    }
    if (statusEl) {
      statusEl.className = 'settings-status-badge error';
      statusEl.innerHTML = '<span class="material-icons">error</span> Error';
    }
  }
}

/**
 * Apply settings to the application
 */
function applySettings(settings) {
  // Dispatch event for components to react
  document.dispatchEvent(new CustomEvent('settings:applied', { detail: settings }));

  // Apply K8s auto-refresh
  if (settings.k8s.autoRefresh) {
    startK8sAutoRefresh(settings.k8s.refreshInterval);
  } else {
    stopK8sAutoRefresh();
  }
}

// K8s auto-refresh interval handle
let k8sRefreshInterval = null;

function startK8sAutoRefresh(interval) {
  stopK8sAutoRefresh();

  k8sRefreshInterval = setInterval(() => {
    // Dispatch event for K8s views to refresh
    document.dispatchEvent(new CustomEvent('k8s:auto-refresh'));
  }, interval);
}

function stopK8sAutoRefresh() {
  if (k8sRefreshInterval) {
    clearInterval(k8sRefreshInterval);
    k8sRefreshInterval = null;
  }
}

// Export for external use
export { openSettingsModal, closeSettingsModal };
