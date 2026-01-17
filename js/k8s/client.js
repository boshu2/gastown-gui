/**
 * Gas Town GUI - Kubernetes Client
 *
 * Handles communication with Kubernetes API for olympus.io CRDs.
 * Supports both in-cluster and local kubeconfig authentication.
 */

import * as k8s from '@kubernetes/client-node';

// CRD configuration for olympus.io
const CRD_GROUP = 'olympus.io';
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
 * List Automatons in a namespace
 */
export async function listAutomatons(namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const res = await customApi.listNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'automatons',
  });

  return res.items.map(normalizeAutomaton);
}

/**
 * Get a specific Automaton
 */
export async function getAutomaton(name, namespace = connectionStatus.namespace) {
  if (!customApi) throw new Error('Client not initialized');

  const res = await customApi.getNamespacedCustomObject({
    group: CRD_GROUP,
    version: CRD_VERSION,
    namespace,
    plural: 'automatons',
    name,
  });

  return normalizeAutomaton(res);
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
 * Watch Automatons for changes
 */
export function watchAutomatons(namespace, callback) {
  if (!kubeConfig) throw new Error('Client not initialized');

  const watch = new k8s.Watch(kubeConfig);
  const path = `/apis/${CRD_GROUP}/${CRD_VERSION}/namespaces/${namespace}/automatons`;

  return watch.watch(
    path,
    {},
    (type, obj) => {
      callback(type.toLowerCase(), normalizeAutomaton(obj));
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
 * Normalize Automaton CRD to UI-friendly format
 */
function normalizeAutomaton(obj) {
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
    forgeRef: spec.forgeRef,
    engine: spec.engine,
    executionMode: spec.executionMode,
    sdk: spec.sdk,
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

export default {
  initClient,
  getStatus,
  testConnection,
  listNamespaces,
  listAutomatons,
  getAutomaton,
  listConvoys,
  getConvoy,
  watchAutomatons,
  watchConvoys,
  getContexts,
  setContext,
  setNamespace,
};
