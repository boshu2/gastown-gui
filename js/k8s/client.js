/**
 * Gas Town GUI - Kubernetes Client
 *
 * Handles communication with Kubernetes API for gastown.gastown.io CRDs.
 * Supports both in-cluster and local kubeconfig authentication.
 */

import * as k8s from '@kubernetes/client-node';

// CRD configuration for Gas Town
const CRD_GROUP = 'gastown.gastown.io';
const CRD_VERSION = 'v1alpha1';

// Connection state
let kubeConfig = null;
let customApi = null;
let coreApi = null;
let connectionStatus = {
  connected: false,
  mode: null, // 'in-cluster' | 'kubeconfig'
  context: null,
  namespace: 'default',
  error: null,
  lastCheck: null,
};

/**
 * Initialize Kubernetes client
 * Tries in-cluster config first, falls back to kubeconfig
 */
export function initClient(options = {}) {
  kubeConfig = new k8s.KubeConfig();

  const isInCluster = process.env.KUBERNETES_SERVICE_HOST !== undefined;

  try {
    if (isInCluster) {
      kubeConfig.loadFromCluster();
      connectionStatus.mode = 'in-cluster';
      connectionStatus.context = 'in-cluster';
    } else if (options.kubeconfigPath) {
      kubeConfig.loadFromFile(options.kubeconfigPath);
      connectionStatus.mode = 'kubeconfig';
      connectionStatus.context = kubeConfig.getCurrentContext();
    } else {
      kubeConfig.loadFromDefault();
      connectionStatus.mode = 'kubeconfig';
      connectionStatus.context = kubeConfig.getCurrentContext();
    }

    customApi = kubeConfig.makeApiClient(k8s.CustomObjectsApi);
    coreApi = kubeConfig.makeApiClient(k8s.CoreV1Api);

    connectionStatus.connected = true;
    connectionStatus.error = null;
    connectionStatus.namespace = options.namespace || 'default';
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    console.error('[k8s] Failed to initialize client:', err.message);
  }

  connectionStatus.lastCheck = new Date().toISOString();
  return connectionStatus;
}

/**
 * Get current connection status
 */
export function getStatus() {
  return { ...connectionStatus };
}

/**
 * Test connection by listing namespaces
 */
export async function testConnection() {
  if (!coreApi) {
    return {
      ok: false,
      error: 'Client not initialized',
    };
  }

  try {
    await coreApi.listNamespace({ limit: 1 });
    connectionStatus.connected = true;
    connectionStatus.error = null;
    connectionStatus.lastCheck = new Date().toISOString();
    return { ok: true };
  } catch (err) {
    connectionStatus.connected = false;
    connectionStatus.error = err.message;
    connectionStatus.lastCheck = new Date().toISOString();
    return {
      ok: false,
      error: err.message,
    };
  }
}

/**
 * List available namespaces
 */
export async function listNamespaces() {
  if (!coreApi) throw new Error('Client not initialized');

  const res = await coreApi.listNamespace();
  return res.items.map(ns => ns.metadata.name);
}

/**
 * List Polecats in a namespace
 */
export async function listPolecats(namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const res = await customApi.listNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'polecats',
  });

  return res.items.map(normalizePolecat);
}

/**
 * Get a specific Polecat
 */
export async function getPolecat(name, namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const res = await customApi.getNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'polecats',
    name,
  });

  return normalizePolecat(res);
}

/**
 * List Convoys in a namespace
 */
export async function listConvoys(namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const res = await customApi.listNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'convoys',
  });

  return res.items.map(normalizeConvoy);
}

/**
 * Get a specific Convoy
 */
export async function getConvoy(name, namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const res = await customApi.getNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'convoys',
    name,
  });

  return normalizeConvoy(res);
}

/**
 * Watch Polecats for changes
 */
export function watchPolecats(namespace, callback) {
  if (!kubeConfig) throw new Error('Client not initialized');

  const watch = new k8s.Watch(kubeConfig);
  const path = `/apis/${CRD_GROUP}/${CRD_VERSION}/namespaces/${namespace}/polecats`;

  return watch.watch(
    path,
    {},
    (type, obj) => {
      callback(type.toLowerCase(), normalizePolecat(obj));
    },
    (err) => {
      console.error('[k8s] Watch error:', err);
      callback('error', { error: err.message });
    }
  );
}

/**
 * Watch Convoys for changes
 */
export function watchConvoys(namespace, callback) {
  if (!kubeConfig) throw new Error('Client not initialized');

  const watch = new k8s.Watch(kubeConfig);
  const path = `/apis/${CRD_GROUP}/${CRD_VERSION}/namespaces/${namespace}/convoys`;

  return watch.watch(
    path,
    {},
    (type, obj) => {
      callback(type.toLowerCase(), normalizeConvoy(obj));
    },
    (err) => {
      console.error('[k8s] Watch error:', err);
      callback('error', { error: err.message });
    }
  );
}

/**
 * Normalize Polecat CRD to UI-friendly format
 */
function normalizePolecat(obj) {
  const meta = obj.metadata || {};
  const spec = obj.spec || {};
  const status = obj.status || {};

  return {
    id: `${meta.namespace}/${meta.name}`,
    name: meta.name,
    namespace: meta.namespace,
    source: 'k8s',
    objective: spec.objective,
    phase: status.phase || 'Unknown',
    healthState: status.healthState || 'Unknown',
    rigRef: spec.rigRef,
    engine: spec.engine,
    executionMode: spec.executionMode,
    agentType: spec.agentType,
    agentConfig: spec.agentConfig,
    limits: spec.limits,
    metrics: status.metrics,
    conditions: status.conditions,
    claimedBy: status.claimedBy,
    activeRunRef: status.activeRunRef,
    createdAt: meta.creationTimestamp,
    labels: meta.labels,
    annotations: meta.annotations,
  };
}

/**
 * Normalize Convoy CRD to UI-friendly format
 */
function normalizeConvoy(obj) {
  const meta = obj.metadata || {};
  const spec = obj.spec || {};
  const status = obj.status || {};

  return {
    id: `${meta.namespace}/${meta.name}`,
    name: meta.name,
    namespace: meta.namespace,
    source: 'k8s',
    title: spec.title,
    selector: spec.selector,
    phase: status.phase || 'Pending',
    total: status.total || 0,
    succeeded: status.succeeded || 0,
    failed: status.failed || 0,
    running: status.running || 0,
    members: status.members || [],
    conditions: status.conditions,
    createdAt: meta.creationTimestamp,
    labels: meta.labels,
  };
}

/**
 * Get available contexts from kubeconfig
 */
export function getContexts() {
  if (!kubeConfig) return [];
  return kubeConfig.getContexts().map(ctx => ctx.name);
}

/**
 * Switch to a different context
 */
export function setContext(contextName) {
  if (!kubeConfig) throw new Error('Client not initialized');

  kubeConfig.setCurrentContext(contextName);
  customApi = kubeConfig.makeApiClient(k8s.CustomObjectsApi);
  coreApi = kubeConfig.makeApiClient(k8s.CoreV1Api);
  connectionStatus.context = contextName;

  return getStatus();
}

/**
 * Set default namespace
 */
export function setNamespace(namespace) {
  connectionStatus.namespace = namespace;
  return getStatus();
}

/**
 * Create a Polecat/Automaton in K8s
 * @param {Object} spec - Polecat specification
 * @param {string} spec.namespace - Target namespace
 * @param {string} spec.name - Resource name (DNS-compliant)
 * @param {string} spec.objective - Work objective
 * @param {Object} spec.sdk - SDK configuration
 * @param {Object} spec.limits - Execution limits
 * @param {string} spec.forgeRef - Reference to Forge/Rig
 */
export async function createPolecat(spec) {
  if (!customApi) throw new Error('Client not initialized');

  const namespace = spec.namespace || connectionStatus.namespace;
  const body = {
    apiVersion: `${CRD_GROUP}/${CRD_VERSION}`,
    kind: 'Polecat',
    metadata: {
      name: spec.name,
      namespace,
      labels: spec.labels || {},
    },
    spec: {
      objective: spec.objective,
      sdk: spec.sdk || {
        type: 'claude',
        modelConfig: { model: 'claude-sonnet-4' },
      },
      limits: spec.limits || {
        maxDuration: '1h',
        maxIterations: 50,
      },
      forgeRef: spec.forgeRef,
    },
  };

  const res = await customApi.createNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'polecats',
    body,
  });

  return normalizePolecat(res);
}

/**
 * Delete a Polecat/Automaton from K8s
 * @param {string} name - Polecat name
 * @param {string} namespace - Namespace (optional, uses default)
 * @param {boolean} graceful - If true, sets phase to Failed before delete
 */
export async function deletePolecat(name, namespace = connectionStatus.namespace, graceful = false) {
  if (!customApi) throw new Error('Client not initialized');

  if (graceful) {
    // First check if running, and if so, patch to Failed
    try {
      const polecat = await getPolecat(name, namespace);
      if (polecat.phase === 'Running' || polecat.phase === 'Claimed') {
        await customApi.patchNamespacedCustomObject({
          group: CRD_GROUP,
          version: CRD_VERSION,
          namespace,
          plural: 'polecats',
          name,
          body: {
            spec: {
              desiredState: 'Terminated',
            },
          },
        }, {
          headers: { 'Content-Type': 'application/merge-patch+json' },
        });
        // Wait briefly for controller to process
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (err) {
      // Continue with deletion even if patch fails
      console.warn('[k8s] Graceful shutdown patch failed:', err.message);
    }
  }

  await customApi.deleteNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'polecats',
    name,
  });

  return { deleted: true, name, namespace };
}

/**
 * Create a Convoy in K8s
 * @param {Object} spec - Convoy specification
 * @param {string} spec.namespace - Target namespace
 * @param {string} spec.name - Resource name
 * @param {string} spec.title - Display title
 * @param {Object} spec.selector - Label selector for matching Polecats
 */
export async function createConvoy(spec) {
  if (!customApi) throw new Error('Client not initialized');

  const namespace = spec.namespace || connectionStatus.namespace;
  const body = {
    apiVersion: `${CRD_GROUP}/${CRD_VERSION}`,
    kind: 'Convoy',
    metadata: {
      name: spec.name,
      namespace,
      labels: spec.labels || {},
    },
    spec: {
      title: spec.title,
      selector: spec.selector || {},
    },
  };

  const res = await customApi.createNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'convoys',
    body,
  });

  return normalizeConvoy(res);
}

/**
 * Delete a Convoy from K8s
 * @param {string} name - Convoy name
 * @param {string} namespace - Namespace (optional, uses default)
 */
export async function deleteConvoy(name, namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  await customApi.deleteNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'convoys',
    name,
  });

  return { deleted: true, name, namespace };
}

/**
 * Preview which Polecats match a selector
 * @param {Object} selector - Label selector
 * @param {string} namespace - Namespace to search
 */
export async function previewConvoyMembers(selector, namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const polecats = await listPolecats(namespace);
  const matchLabels = selector?.matchLabels || {};

  return polecats.filter(p => {
    const labels = p.labels || {};
    return Object.entries(matchLabels).every(([key, value]) => labels[key] === value);
  });
}

/**
 * List available Forges/Rigs
 */
export async function listForges(namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  try {
    const res = await customApi.listNamespacedCustomObject({
      group: CRD_GROUP,
      version: CRD_VERSION,
      namespace,
      plural: 'rigs',
    });

    return res.items.map(rig => ({
      name: rig.metadata.name,
      namespace: rig.metadata.namespace,
      gitURL: rig.spec?.gitURL,
      status: rig.status?.phase || 'Unknown',
    }));
  } catch (err) {
    // Rigs might be cluster-scoped, try that
    try {
      const res = await customApi.listClusterCustomObject({
        group: CRD_GROUP,
        version: CRD_VERSION,
        plural: 'rigs',
      });

      return res.items.map(rig => ({
        name: rig.metadata.name,
        namespace: null,
        gitURL: rig.spec?.gitURL,
        status: rig.status?.phase || 'Unknown',
      }));
    } catch (clusterErr) {
      console.warn('[k8s] Could not list rigs:', clusterErr.message);
      return [];
    }
  }
}

export default {
  initClient,
  getStatus,
  testConnection,
  listNamespaces,
  listPolecats,
  getPolecat,
  listConvoys,
  getConvoy,
  watchPolecats,
  watchConvoys,
  getContexts,
  setContext,
  setNamespace,
  // Wave 3: Create/Delete operations
  createPolecat,
  deletePolecat,
  createConvoy,
  deleteConvoy,
  previewConvoyMembers,
  listForges,
};
