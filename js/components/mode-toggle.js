/**
 * Gas Town GUI - Mode Toggle Component
 *
 * Allows users to switch between Local-only, K8s-only, and Hybrid views.
 * Persists selection to localStorage and dispatches mode:changed events.
 */

const STORAGE_KEY = 'gastown-mode';
const MODES = {
  LOCAL: 'local',
  HYBRID: 'hybrid',
  K8S: 'k8s'
};

// Mode configuration with icons and labels
const MODE_CONFIG = {
  [MODES.LOCAL]: {
    icon: 'computer',
    label: 'Local',
    tooltip: 'Show only local Gas Town data'
  },
  [MODES.HYBRID]: {
    icon: 'compare_arrows',
    label: 'Hybrid',
    tooltip: 'Show both local and K8s data'
  },
  [MODES.K8S]: {
    icon: 'cloud',
    label: 'K8s',
    tooltip: 'Show only Kubernetes data'
  }
};

// Tabs to hide/show based on mode
const TAB_VISIBILITY = {
  [MODES.LOCAL]: {
    hide: ['k8s-polecats', 'k8s-convoys'],
    show: ['dashboard', 'convoys', 'work', 'agents', 'rigs', 'crews', 'prs', 'formulas', 'issues', 'mail', 'health']
  },
  [MODES.HYBRID]: {
    hide: [],
    show: ['dashboard', 'convoys', 'work', 'agents', 'rigs', 'k8s-polecats', 'k8s-convoys', 'crews', 'prs', 'formulas', 'issues', 'mail', 'health']
  },
  [MODES.K8S]: {
    hide: ['convoys', 'rigs', 'crews'],
    show: ['dashboard', 'work', 'agents', 'k8s-polecats', 'k8s-convoys', 'prs', 'formulas', 'issues', 'mail', 'health']
  }
};

let currentMode = MODES.HYBRID;
let containerEl = null;

/**
 * Get the current mode from localStorage or default to hybrid
 */
export function getCurrentMode() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && Object.values(MODES).includes(stored)) {
    return stored;
  }
  return MODES.HYBRID;
}

/**
 * Set the current mode and persist to localStorage
 */
export function setMode(mode) {
  if (!Object.values(MODES).includes(mode)) {
    console.warn(`[ModeToggle] Invalid mode: ${mode}`);
    return;
  }

  const previousMode = currentMode;
  currentMode = mode;
  localStorage.setItem(STORAGE_KEY, mode);

  // Update UI
  updateToggleUI();

  // Update tab visibility
  updateTabVisibility();

  // Dispatch event for other components
  document.dispatchEvent(new CustomEvent('mode:changed', {
    detail: { mode, previousMode }
  }));

  console.log(`[ModeToggle] Mode changed: ${previousMode} -> ${mode}`);
}

/**
 * Update the toggle button UI to reflect current mode
 */
function updateToggleUI() {
  if (!containerEl) return;

  const buttons = containerEl.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    const btnMode = btn.dataset.mode;
    btn.classList.toggle('active', btnMode === currentMode);
  });
}

/**
 * Update nav tab visibility based on current mode
 */
function updateTabVisibility() {
  const config = TAB_VISIBILITY[currentMode];
  if (!config) return;

  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    const viewId = tab.dataset.view;
    if (config.hide.includes(viewId)) {
      tab.classList.add('mode-hidden');
    } else {
      tab.classList.remove('mode-hidden');
    }
  });

  // If current view is hidden, switch to dashboard
  const activeTab = document.querySelector('.nav-tab.active');
  if (activeTab && activeTab.classList.contains('mode-hidden')) {
    const dashboardTab = document.querySelector('.nav-tab[data-view="dashboard"]');
    if (dashboardTab) {
      dashboardTab.click();
    }
  }
}

/**
 * Create the mode toggle HTML
 */
function createToggleHTML() {
  const modeOrder = [MODES.LOCAL, MODES.HYBRID, MODES.K8S];

  return `
    <div class="mode-toggle" id="mode-toggle">
      ${modeOrder.map(mode => {
        const config = MODE_CONFIG[mode];
        return `
          <button class="mode-btn ${mode === currentMode ? 'active' : ''}"
                  data-mode="${mode}"
                  title="${config.tooltip}">
            <span class="material-icons">${config.icon}</span>
            <span class="mode-label">${config.label}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Initialize the mode toggle component
 * @param {HTMLElement} container - The container element to insert the toggle into
 */
export function initModeToggle(container) {
  if (!container) {
    console.error('[ModeToggle] No container provided');
    return;
  }

  // Load saved mode
  currentMode = getCurrentMode();

  // Insert toggle HTML
  container.insertAdjacentHTML('afterbegin', createToggleHTML());

  // Get reference to container element
  containerEl = container.querySelector('.mode-toggle');

  // Set up click handlers
  const buttons = containerEl.querySelectorAll('.mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode !== currentMode) {
        setMode(mode);
      }
    });
  });

  // Apply initial tab visibility
  updateTabVisibility();

  console.log(`[ModeToggle] Initialized with mode: ${currentMode}`);
}

// Export modes constant for external use
export { MODES };
