/**
 * Gas Town GUI - K8s Modals Component
 *
 * Modals for K8s resource management (Wave 3):
 * - Create Polecat/Automaton
 * - Delete Polecat with confirmation
 * - Create Convoy with selector preview
 */

import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml, escapeAttr } from '../utils/html.js';
import { state } from '../state.js';

// SDK model options
const SDK_MODELS = [
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 (Recommended)' },
  { value: 'claude-opus-4', label: 'Claude Opus 4' },
  { value: 'claude-haiku-3', label: 'Claude Haiku 3' },
];

// Default limits
const DEFAULT_LIMITS = {
  maxDuration: '1h',
  maxIterations: 50,
};

/**
 * Show Create Polecat Modal
 */
export async function showCreatePolecatModal() {
  // Fetch available data for dropdowns
  let namespaces = [];
  let forges = [];

  try {
    const [nsRes, forgeRes] = await Promise.all([
      api.getK8sNamespaces().catch(() => ({ namespaces: [] })),
      api.getK8sForges().catch(() => ({ items: [] })),
    ]);
    namespaces = nsRes.namespaces || [];
    forges = forgeRes.items || [];
  } catch (err) {
    console.warn('[K8s] Failed to fetch dropdown data:', err);
  }

  const namespaceOptions = namespaces
    .map(ns => `<option value="${escapeAttr(ns)}">${escapeHtml(ns)}</option>`)
    .join('');

  const forgeOptions = forges
    .map(f => `<option value="${escapeAttr(f.name)}">${escapeHtml(f.name)}</option>`)
    .join('');

  const modelOptions = SDK_MODELS
    .map(m => `<option value="${escapeAttr(m.value)}">${escapeHtml(m.label)}</option>`)
    .join('');

  const content = `
    <div class="modal-header">
      <h2>Create K8s Automaton</h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body">
      <form id="create-k8s-polecat-form">
        <div class="form-row">
          <div class="form-group">
            <label for="k8s-polecat-namespace">Namespace</label>
            <select id="k8s-polecat-namespace" name="namespace" required>
              <option value="default">default</option>
              ${namespaceOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="k8s-polecat-name">Name</label>
            <input type="text" id="k8s-polecat-name" name="name" required
                   placeholder="auto-feature-x"
                   pattern="[a-z0-9]([-a-z0-9]*[a-z0-9])?"
                   title="Lowercase alphanumeric, may contain hyphens">
          </div>
        </div>

        <div class="form-group">
          <label for="k8s-polecat-objective">Objective <span class="required">*</span></label>
          <textarea id="k8s-polecat-objective" name="objective" rows="4" required
                    placeholder="Implement feature X with comprehensive tests..."></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="k8s-polecat-model">Model</label>
            <select id="k8s-polecat-model" name="model">
              ${modelOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="k8s-polecat-forge">Forge</label>
            <select id="k8s-polecat-forge" name="forgeRef">
              <option value="">None</option>
              ${forgeOptions}
            </select>
          </div>
        </div>

        <details class="form-details">
          <summary>Advanced Options</summary>
          <div class="form-row">
            <div class="form-group">
              <label for="k8s-polecat-duration">Max Duration</label>
              <input type="text" id="k8s-polecat-duration" name="maxDuration"
                     value="${DEFAULT_LIMITS.maxDuration}" placeholder="1h">
            </div>
            <div class="form-group">
              <label for="k8s-polecat-iterations">Max Iterations</label>
              <input type="number" id="k8s-polecat-iterations" name="maxIterations"
                     value="${DEFAULT_LIMITS.maxIterations}" min="1" max="1000">
            </div>
          </div>
          <div class="form-group">
            <label for="k8s-polecat-labels">Labels (JSON)</label>
            <input type="text" id="k8s-polecat-labels" name="labels"
                   placeholder='{"wave": "1", "team": "platform"}'>
          </div>
        </details>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">
            <span class="material-icons">add</span>
            Create Automaton
          </button>
        </div>
      </form>
    </div>
  `;

  const modal = showDynamicModal('create-k8s-polecat', content);

  // Wire up form submission
  const form = modal.querySelector('#create-k8s-polecat-form');
  form.addEventListener('submit', handleCreatePolecatSubmit);
}

/**
 * Handle Create Polecat form submission
 */
async function handleCreatePolecatSubmit(e) {
  e.preventDefault();
  const form = e.target;

  const namespace = form.querySelector('[name="namespace"]').value;
  const name = form.querySelector('[name="name"]').value;
  const objective = form.querySelector('[name="objective"]').value;
  const model = form.querySelector('[name="model"]').value;
  const forgeRef = form.querySelector('[name="forgeRef"]').value || undefined;
  const maxDuration = form.querySelector('[name="maxDuration"]').value || '1h';
  const maxIterations = parseInt(form.querySelector('[name="maxIterations"]').value, 10) || 50;
  const labelsStr = form.querySelector('[name="labels"]').value;

  // Parse labels JSON
  let labels = {};
  if (labelsStr) {
    try {
      labels = JSON.parse(labelsStr);
    } catch (err) {
      showToast('Invalid labels JSON format', 'error');
      return;
    }
  }

  // Show loading state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="material-icons spinning">sync</span> Creating...';

  try {
    const polecat = await api.createK8sPolecat({
      namespace,
      name,
      objective,
      sdk: {
        type: 'claude',
        modelConfig: { model },
      },
      limits: {
        maxDuration,
        maxIterations,
      },
      forgeRef,
      labels,
    });

    showToast(`Automaton "${name}" created`, 'success');
    closeAllModals();

    // Dispatch event for list refresh
    document.dispatchEvent(new CustomEvent('k8s:polecat:created', { detail: polecat }));
  } catch (err) {
    showToast(`Failed to create automaton: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

/**
 * Show Delete Polecat Confirmation Modal
 */
export function showDeletePolecatModal(polecat) {
  const { name, namespace, phase } = polecat;
  const isRunning = phase === 'Running' || phase === 'Claimed';

  const content = `
    <div class="modal-header">
      <h2>Delete Automaton</h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="warning-message ${isRunning ? 'warning-danger' : ''}">
        <span class="material-icons">${isRunning ? 'warning' : 'info'}</span>
        <div>
          ${isRunning
            ? `<strong>This automaton is currently ${phase.toLowerCase()}.</strong><br>Deleting it will stop any in-progress work.`
            : `You are about to delete automaton <strong>${escapeHtml(name)}</strong>.`
          }
        </div>
      </div>

      <form id="delete-k8s-polecat-form">
        <input type="hidden" name="namespace" value="${escapeAttr(namespace)}">
        <input type="hidden" name="name" value="${escapeAttr(name)}">

        ${isRunning ? `
          <div class="form-group">
            <label for="delete-confirm-name">Type "<strong>${escapeHtml(name)}</strong>" to confirm:</label>
            <input type="text" id="delete-confirm-name" name="confirmName" required
                   placeholder="Enter automaton name" autocomplete="off">
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" name="graceful" checked>
              Graceful shutdown (attempt to stop cleanly before delete)
            </label>
          </div>
        ` : ''}

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-danger">
            <span class="material-icons">delete</span>
            Delete Automaton
          </button>
        </div>
      </form>
    </div>
  `;

  const modal = showDynamicModal('delete-k8s-polecat', content);

  // Wire up form submission
  const form = modal.querySelector('#delete-k8s-polecat-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formNamespace = form.querySelector('[name="namespace"]').value;
    const formName = form.querySelector('[name="name"]').value;
    const confirmNameInput = form.querySelector('[name="confirmName"]');
    const gracefulInput = form.querySelector('[name="graceful"]');

    // Validate confirmation for running polecats
    if (isRunning && confirmNameInput) {
      if (confirmNameInput.value !== formName) {
        showToast('Name does not match. Please type the exact automaton name.', 'error');
        return;
      }
    }

    const graceful = gracefulInput?.checked ?? false;

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons spinning">sync</span> Deleting...';

    try {
      await api.deleteK8sPolecat(formNamespace, formName, graceful);
      showToast(`Automaton "${formName}" deleted`, 'success');
      closeAllModals();

      // Dispatch event for list refresh
      document.dispatchEvent(new CustomEvent('k8s:polecat:deleted', {
        detail: { name: formName, namespace: formNamespace },
      }));
    } catch (err) {
      showToast(`Failed to delete automaton: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

/**
 * Show Create Convoy Modal
 */
export async function showCreateConvoyModal() {
  // Fetch namespaces
  let namespaces = [];
  try {
    const nsRes = await api.getK8sNamespaces().catch(() => ({ namespaces: [] }));
    namespaces = nsRes.namespaces || [];
  } catch (err) {
    console.warn('[K8s] Failed to fetch namespaces:', err);
  }

  const namespaceOptions = namespaces
    .map(ns => `<option value="${escapeAttr(ns)}">${escapeHtml(ns)}</option>`)
    .join('');

  const content = `
    <div class="modal-header">
      <h2>Create K8s Convoy</h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body">
      <form id="create-k8s-convoy-form">
        <div class="form-row">
          <div class="form-group">
            <label for="k8s-convoy-namespace">Namespace</label>
            <select id="k8s-convoy-namespace" name="namespace" required>
              <option value="default">default</option>
              ${namespaceOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="k8s-convoy-name">Name</label>
            <input type="text" id="k8s-convoy-name" name="name" required
                   placeholder="convoy-wave1"
                   pattern="[a-z0-9]([-a-z0-9]*[a-z0-9])?"
                   title="Lowercase alphanumeric, may contain hyphens">
          </div>
        </div>

        <div class="form-group">
          <label for="k8s-convoy-title">Title <span class="required">*</span></label>
          <input type="text" id="k8s-convoy-title" name="title" required
                 placeholder="Wave 1 Implementation">
        </div>

        <div class="form-group">
          <label>Label Selector</label>
          <div id="k8s-convoy-selectors" class="selector-list">
            <div class="selector-row">
              <input type="text" name="selectorKey[]" placeholder="Key (e.g., wave)">
              <input type="text" name="selectorValue[]" placeholder="Value (e.g., 1)">
              <button type="button" class="btn btn-icon btn-small remove-selector" disabled>
                <span class="material-icons">remove</span>
              </button>
            </div>
          </div>
          <button type="button" class="btn btn-secondary btn-small add-selector">
            <span class="material-icons">add</span>
            Add Label
          </button>
        </div>

        <div class="form-group">
          <label>Matching Automatons Preview</label>
          <div id="k8s-convoy-preview" class="convoy-preview">
            <p class="text-muted">Add label selectors to preview matching automatons</p>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-primary">
            <span class="material-icons">add</span>
            Create Convoy
          </button>
        </div>
      </form>
    </div>
  `;

  const modal = showDynamicModal('create-k8s-convoy', content);

  // Wire up selector management
  const selectorsContainer = modal.querySelector('#k8s-convoy-selectors');
  const addBtn = modal.querySelector('.add-selector');
  const namespaceSelect = modal.querySelector('[name="namespace"]');

  addBtn.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'selector-row';
    row.innerHTML = `
      <input type="text" name="selectorKey[]" placeholder="Key">
      <input type="text" name="selectorValue[]" placeholder="Value">
      <button type="button" class="btn btn-icon btn-small remove-selector">
        <span class="material-icons">remove</span>
      </button>
    `;
    selectorsContainer.appendChild(row);
    updateRemoveButtons();
    updatePreview();
  });

  selectorsContainer.addEventListener('click', (e) => {
    if (e.target.closest('.remove-selector')) {
      e.target.closest('.selector-row').remove();
      updateRemoveButtons();
      updatePreview();
    }
  });

  // Update preview on selector change
  selectorsContainer.addEventListener('input', debounce(updatePreview, 300));
  namespaceSelect.addEventListener('change', updatePreview);

  function updateRemoveButtons() {
    const rows = selectorsContainer.querySelectorAll('.selector-row');
    rows.forEach((row, i) => {
      const removeBtn = row.querySelector('.remove-selector');
      removeBtn.disabled = rows.length === 1;
    });
  }

  async function updatePreview() {
    const previewEl = modal.querySelector('#k8s-convoy-preview');
    const namespace = namespaceSelect.value;

    // Gather selectors
    const keys = Array.from(selectorsContainer.querySelectorAll('[name="selectorKey[]"]'));
    const values = Array.from(selectorsContainer.querySelectorAll('[name="selectorValue[]"]'));
    const matchLabels = {};

    keys.forEach((keyInput, i) => {
      const key = keyInput.value.trim();
      const value = values[i]?.value.trim();
      if (key && value) {
        matchLabels[key] = value;
      }
    });

    if (Object.keys(matchLabels).length === 0) {
      previewEl.innerHTML = '<p class="text-muted">Add label selectors to preview matching automatons</p>';
      return;
    }

    previewEl.innerHTML = '<p class="text-muted"><span class="loading-spinner"></span> Loading...</p>';

    try {
      const result = await api.previewK8sConvoyMembers({ matchLabels }, namespace);
      const items = result.items || [];

      if (items.length === 0) {
        previewEl.innerHTML = '<p class="text-muted">No automatons match this selector</p>';
      } else {
        previewEl.innerHTML = `
          <div class="preview-count">${items.length} automaton${items.length === 1 ? '' : 's'} match</div>
          <ul class="preview-list">
            ${items.map(p => `
              <li>
                <span class="preview-name">${escapeHtml(p.name)}</span>
                <span class="status-badge status-${(p.phase || 'unknown').toLowerCase()}">${escapeHtml(p.phase || 'Unknown')}</span>
              </li>
            `).join('')}
          </ul>
        `;
      }
    } catch (err) {
      previewEl.innerHTML = `<p class="text-error">Failed to load preview: ${escapeHtml(err.message)}</p>`;
    }
  }

  // Wire up form submission
  const form = modal.querySelector('#create-k8s-convoy-form');
  form.addEventListener('submit', handleCreateConvoySubmit);
}

/**
 * Handle Create Convoy form submission
 */
async function handleCreateConvoySubmit(e) {
  e.preventDefault();
  const form = e.target;

  const namespace = form.querySelector('[name="namespace"]').value;
  const name = form.querySelector('[name="name"]').value;
  const title = form.querySelector('[name="title"]').value;

  // Gather selectors
  const keys = Array.from(form.querySelectorAll('[name="selectorKey[]"]'));
  const values = Array.from(form.querySelectorAll('[name="selectorValue[]"]'));
  const matchLabels = {};

  keys.forEach((keyInput, i) => {
    const key = keyInput.value.trim();
    const value = values[i]?.value.trim();
    if (key && value) {
      matchLabels[key] = value;
    }
  });

  // Show loading state
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="material-icons spinning">sync</span> Creating...';

  try {
    const convoy = await api.createK8sConvoy({
      namespace,
      name,
      title,
      selector: Object.keys(matchLabels).length > 0 ? { matchLabels } : undefined,
    });

    showToast(`Convoy "${name}" created`, 'success');
    closeAllModals();

    // Dispatch event for list refresh
    document.dispatchEvent(new CustomEvent('k8s:convoy:created', { detail: convoy }));
  } catch (err) {
    showToast(`Failed to create convoy: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

/**
 * Show Delete Convoy Confirmation Modal
 */
export function showDeleteConvoyModal(convoy) {
  const { name, namespace } = convoy;

  const content = `
    <div class="modal-header">
      <h2>Delete Convoy</h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="warning-message">
        <span class="material-icons">info</span>
        <div>
          You are about to delete convoy <strong>${escapeHtml(name)}</strong>.
          <br><small>This will not delete the automatons in the convoy.</small>
        </div>
      </div>

      <form id="delete-k8s-convoy-form">
        <input type="hidden" name="namespace" value="${escapeAttr(namespace)}">
        <input type="hidden" name="name" value="${escapeAttr(name)}">

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" data-modal-close>Cancel</button>
          <button type="submit" class="btn btn-danger">
            <span class="material-icons">delete</span>
            Delete Convoy
          </button>
        </div>
      </form>
    </div>
  `;

  const modal = showDynamicModal('delete-k8s-convoy', content);

  // Wire up form submission
  const form = modal.querySelector('#delete-k8s-convoy-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formNamespace = form.querySelector('[name="namespace"]').value;
    const formName = form.querySelector('[name="name"]').value;

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-icons spinning">sync</span> Deleting...';

    try {
      await api.deleteK8sConvoy(formNamespace, formName);
      showToast(`Convoy "${formName}" deleted`, 'success');
      closeAllModals();

      // Dispatch event for list refresh
      document.dispatchEvent(new CustomEvent('k8s:convoy:deleted', {
        detail: { name: formName, namespace: formNamespace },
      }));
    } catch (err) {
      showToast(`Failed to delete convoy: ${err.message}`, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// === Utility Functions ===

function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Show a dynamic modal (borrowed from modals.js pattern)
 */
function showDynamicModal(id, content) {
  const overlay = document.getElementById('modal-overlay');

  // Remove existing dynamic modal if present
  const existing = document.getElementById(`${id}-modal`);
  if (existing) existing.remove();

  // Create new modal
  const modal = document.createElement('div');
  modal.id = `${id}-modal`;
  modal.className = 'modal';
  modal.innerHTML = content;

  // Add to overlay
  overlay.appendChild(modal);

  // Show overlay and modal
  overlay.classList.remove('hidden');
  modal.classList.remove('hidden');

  // Wire up close buttons
  modal.querySelectorAll('[data-modal-close]').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });

  return modal;
}

/**
 * Close all modals
 */
function closeAllModals() {
  const overlay = document.getElementById('modal-overlay');
  overlay?.classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

// Export for use in other components
export default {
  showCreatePolecatModal,
  showDeletePolecatModal,
  showCreateConvoyModal,
  showDeleteConvoyModal,
};
