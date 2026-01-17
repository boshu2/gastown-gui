/**
 * Gas Town GUI - K8s Cross-Sling Modals
 *
 * Modals for slinging work between local and K8s environments.
 * - Sling local bead to K8s (create automaton)
 * - Import K8s automaton results to local bead
 */

import { api } from '../api.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/html.js';

/**
 * Show modal to sling a local bead to K8s
 * @param {Object} bead - Bead object with id, title
 * @param {Function} onSuccess - Callback after successful sling
 */
export async function showSlingToK8sModal(bead, onSuccess) {
  const content = `
    <div class="modal-header">
      <h2>
        <span class="material-icons">cloud_upload</span>
        Sling to K8s
      </h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="sling-target-section">
        <h4>
          <span class="material-icons">description</span>
          Selected Bead
        </h4>
        <div class="form-group">
          <div class="bead-preview">
            <strong>${escapeHtml(bead.id)}</strong>
            <p class="text-muted">${escapeHtml(bead.title || 'Untitled')}</p>
          </div>
        </div>
      </div>

      <div class="sling-target-section">
        <h4>
          <span class="material-icons">cloud</span>
          Target Configuration
        </h4>

        <div class="form-group">
          <label for="sling-namespace">Namespace</label>
          <select id="sling-namespace" class="filter-select">
            <option value="">Loading...</option>
          </select>
        </div>

        <div class="form-group">
          <label for="sling-forge">Forge (optional)</label>
          <select id="sling-forge" class="filter-select">
            <option value="">Default forge</option>
          </select>
        </div>

        <div class="form-group">
          <label for="sling-sdk">SDK</label>
          <select id="sling-sdk" class="filter-select">
            <option value="claude-code">Claude Code</option>
            <option value="aider">Aider</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      <div class="warning-message" id="sling-warning" style="display: none;">
        <span class="material-icons">warning</span>
        <span id="sling-warning-text"></span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="sling-to-k8s-btn">
        <span class="material-icons">rocket_launch</span>
        Sling to K8s
      </button>
    </div>
  `;

  const modal = showDynamicModal('sling-to-k8s', content);

  // Load namespaces and forges
  await loadNamespacesAndForges(modal);

  // Wire up sling button
  const slingBtn = modal.querySelector('#sling-to-k8s-btn');
  slingBtn.addEventListener('click', async () => {
    const namespace = modal.querySelector('#sling-namespace').value;
    const forgeRef = modal.querySelector('#sling-forge').value;
    const sdk = modal.querySelector('#sling-sdk').value;

    if (!namespace) {
      showWarning(modal, 'Please select a namespace');
      return;
    }

    slingBtn.disabled = true;
    slingBtn.innerHTML = '<span class="material-icons spinning">sync</span> Slinging...';

    try {
      const result = await api.slingToK8s(bead.id, {
        namespace,
        forgeRef: forgeRef || undefined,
        sdk,
      });

      showToast(`Created automaton: ${result.automatonName}`, 'success');
      closeModal(modal);

      if (onSuccess) onSuccess(result);
    } catch (err) {
      showWarning(modal, err.message);
      slingBtn.disabled = false;
      slingBtn.innerHTML = '<span class="material-icons">rocket_launch</span> Sling to K8s';
    }
  });
}

/**
 * Show modal to import K8s automaton results to local
 * @param {Object} automaton - Automaton object with name, namespace
 * @param {Function} onSuccess - Callback after successful import
 */
export async function showSlingToLocalModal(automaton, onSuccess) {
  const content = `
    <div class="modal-header">
      <h2>
        <span class="material-icons">cloud_download</span>
        Import to Local
      </h2>
      <button class="btn btn-icon" data-modal-close>
        <span class="material-icons">close</span>
      </button>
    </div>
    <div class="modal-body">
      <div class="sling-target-section">
        <h4>
          <span class="material-icons">smart_toy</span>
          K8s Automaton
        </h4>
        <div class="form-group">
          <div class="automaton-preview">
            <strong>${escapeHtml(automaton.name)}</strong>
            <p class="text-muted">Namespace: ${escapeHtml(automaton.namespace)}</p>
            ${automaton.phase ? `<span class="phase-badge-sm phase-${automaton.phase.toLowerCase()}">${automaton.phase}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="sling-target-section">
        <h4>
          <span class="material-icons">folder</span>
          Target Rig
        </h4>

        <div class="form-group">
          <label for="import-rig">Rig</label>
          <select id="import-rig" class="filter-select">
            <option value="">Loading...</option>
          </select>
        </div>
      </div>

      <p class="text-muted" style="font-size: var(--text-sm);">
        This will create or update a local bead with the automaton's results,
        including any output artifacts and completion status.
      </p>

      <div class="warning-message" id="import-warning" style="display: none;">
        <span class="material-icons">warning</span>
        <span id="import-warning-text"></span>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" data-modal-close>Cancel</button>
      <button class="btn btn-primary" id="import-to-local-btn">
        <span class="material-icons">download</span>
        Import to Local
      </button>
    </div>
  `;

  const modal = showDynamicModal('sling-to-local', content);

  // Load rigs
  await loadRigs(modal);

  // Wire up import button
  const importBtn = modal.querySelector('#import-to-local-btn');
  importBtn.addEventListener('click', async () => {
    const rig = modal.querySelector('#import-rig').value;

    if (!rig) {
      showImportWarning(modal, 'Please select a rig');
      return;
    }

    importBtn.disabled = true;
    importBtn.innerHTML = '<span class="material-icons spinning">sync</span> Importing...';

    try {
      const result = await api.slingToLocal(automaton.name, automaton.namespace, rig);

      showToast(`Imported to bead: ${result.beadId}`, 'success');
      closeModal(modal);

      if (onSuccess) onSuccess(result);
    } catch (err) {
      showImportWarning(modal, err.message);
      importBtn.disabled = false;
      importBtn.innerHTML = '<span class="material-icons">download</span> Import to Local';
    }
  });
}

/**
 * Load namespaces and forges for the sling modal
 */
async function loadNamespacesAndForges(modal) {
  const namespaceSelect = modal.querySelector('#sling-namespace');
  const forgeSelect = modal.querySelector('#sling-forge');

  try {
    // Load namespaces
    const nsRes = await api.getK8sNamespaces();
    const namespaces = nsRes.namespaces || [];

    namespaceSelect.innerHTML = '<option value="">Select namespace...</option>';
    namespaces.forEach(ns => {
      const option = document.createElement('option');
      option.value = ns;
      option.textContent = ns;
      namespaceSelect.appendChild(option);
    });

    // Load forges when namespace changes
    namespaceSelect.addEventListener('change', async () => {
      const ns = namespaceSelect.value;
      if (!ns) {
        forgeSelect.innerHTML = '<option value="">Default forge</option>';
        return;
      }

      try {
        const forges = await api.getK8sForges(ns);
        forgeSelect.innerHTML = '<option value="">Default forge</option>';
        (forges.items || []).forEach(forge => {
          const option = document.createElement('option');
          option.value = `${forge.metadata.namespace}/${forge.metadata.name}`;
          option.textContent = forge.metadata.name;
          forgeSelect.appendChild(option);
        });
      } catch (err) {
        console.warn('[sling] Failed to load forges:', err);
      }
    });
  } catch (err) {
    console.error('[sling] Failed to load namespaces:', err);
    namespaceSelect.innerHTML = '<option value="">Failed to load</option>';
  }
}

/**
 * Load rigs for the import modal
 */
async function loadRigs(modal) {
  const rigSelect = modal.querySelector('#import-rig');

  try {
    const res = await api.getRigs();
    const rigs = res.rigs || [];

    rigSelect.innerHTML = '<option value="">Select rig...</option>';
    rigs.forEach(rig => {
      const option = document.createElement('option');
      option.value = rig.name;
      option.textContent = rig.name;
      rigSelect.appendChild(option);
    });
  } catch (err) {
    console.error('[sling] Failed to load rigs:', err);
    rigSelect.innerHTML = '<option value="">Failed to load</option>';
  }
}

function showWarning(modal, message) {
  const warning = modal.querySelector('#sling-warning');
  const text = modal.querySelector('#sling-warning-text');
  warning.style.display = 'flex';
  text.textContent = message;
}

function showImportWarning(modal, message) {
  const warning = modal.querySelector('#import-warning');
  const text = modal.querySelector('#import-warning-text');
  warning.style.display = 'flex';
  text.textContent = message;
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
    btn.addEventListener('click', () => closeModal(modal));
  });

  return modal;
}

function closeModal(modal) {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
  modal.classList.add('hidden');
}

export default {
  showSlingToK8sModal,
  showSlingToLocalModal,
};
