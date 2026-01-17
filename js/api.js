/**
 * Gas Town GUI - API Client
 *
 * Handles communication with the Node bridge server.
 * - REST API for commands
 * - WebSocket for real-time updates
 */

const API_BASE = window.location.origin;
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss' : 'ws';
const WS_URL = `${WS_PROTOCOL}://${window.location.host}/ws`;

// REST API Client
export const api = {
  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      // Create error with message but also attach the full error data
      const error = new Error(errorData.error || 'Request failed');
      // Attach structured error data for better error handling
      if (errorData.errorType) {
        error.errorType = errorData.errorType;
        error.errorData = errorData;
      }
      throw error;
    }

    return response.json();
  },

  // GET request
  get(endpoint) {
    return this.request(endpoint);
  },

  // POST request
  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body });
  },

  // === Status ===
  getStatus() {
    return this.get('/api/status');
  },

  getHealth() {
    return this.get('/api/health');
  },

  // === Convoys ===
  getConvoys(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/api/convoys${query ? '?' + query : ''}`);
  },

  getConvoy(id) {
    return this.get(`/api/convoy/${id}`);
  },

  createConvoy(name, issues = [], notify = null) {
    return this.post('/api/convoy', { name, issues, notify });
  },

  // === Work ===
  sling(bead, target, options = {}) {
    return this.post('/api/sling', {
      bead,
      target,
      molecule: options.molecule,
      quality: options.quality,
      args: options.args,
    });
  },

  getHook() {
    return this.get('/api/hook');
  },

  // === Mail ===
  getMail() {
    return this.get('/api/mail');
  },

  getMailMessage(id) {
    return this.get(`/api/mail/${encodeURIComponent(id)}`);
  },

  sendMail(to, subject, message, priority = 'normal') {
    return this.post('/api/mail', { to, subject, message, priority });
  },

  markMailRead(id) {
    return this.post(`/api/mail/${encodeURIComponent(id)}/read`);
  },

  markMailUnread(id) {
    return this.post(`/api/mail/${encodeURIComponent(id)}/unread`);
  },

  // === Agents ===
  getAgents() {
    return this.get('/api/agents');
  },

  nudge(target, message, autoStart = true) {
    return this.post('/api/nudge', { target, message, autoStart });
  },

  getMayorMessages(limit = 50) {
    return this.get(`/api/mayor/messages?limit=${limit}`);
  },

  getMayorOutput(lines = 100) {
    return this.get(`/api/mayor/output?lines=${lines}`);
  },

  // === Beads ===
  createBead(title, options = {}) {
    return this.post('/api/beads', {
      title,
      description: options.description,
      priority: options.priority,
      labels: options.labels,
    });
  },

  getBead(beadId) {
    return this.get(`/api/bead/${encodeURIComponent(beadId)}`);
  },

  getBeadLinks(beadId) {
    return this.get(`/api/bead/${encodeURIComponent(beadId)}/links`);
  },

  // === Work Actions ===
  markWorkDone(beadId, summary) {
    return this.post(`/api/work/${encodeURIComponent(beadId)}/done`, { summary });
  },

  parkWork(beadId, reason) {
    return this.post(`/api/work/${encodeURIComponent(beadId)}/park`, { reason });
  },

  releaseWork(beadId) {
    return this.post(`/api/work/${encodeURIComponent(beadId)}/release`);
  },

  reassignWork(beadId, target) {
    return this.post(`/api/work/${encodeURIComponent(beadId)}/reassign`, { target });
  },

  searchBeads(query) {
    return this.get(`/api/beads/search?q=${encodeURIComponent(query)}`);
  },

  searchFormulas(query) {
    return this.get(`/api/formulas/search?q=${encodeURIComponent(query)}`);
  },

  getFormulas() {
    return this.get('/api/formulas');
  },

  getFormula(name) {
    return this.get(`/api/formula/${encodeURIComponent(name)}`);
  },

  createFormula(name, description, template) {
    return this.post('/api/formulas', { name, description, template });
  },

  useFormula(name, target, args) {
    return this.post(`/api/formula/${encodeURIComponent(name)}/use`, { target, args });
  },

  updateFormula(name, description, template) {
    return this.request(`/api/formula/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, template }),
    });
  },

  deleteFormula(name) {
    return this.request(`/api/formula/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },

  getTargets() {
    return this.get('/api/targets');
  },

  // === Escalation ===
  escalate(convoyId, reason, priority = 'normal') {
    return this.post('/api/escalate', { convoy_id: convoyId, reason, priority });
  },

  // === Setup & Onboarding ===
  getSetupStatus() {
    return this.get('/api/setup/status');
  },

  getRigs() {
    return this.get('/api/rigs');
  },

  addRig(name, url) {
    return this.post('/api/rigs', { name, url });
  },

  removeRig(name) {
    return this.request(`/api/rigs/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },

  // === Crew Management ===
  getCrews() {
    return this.get('/api/crews');
  },

  getCrewStatus(name) {
    return this.get(`/api/crew/${encodeURIComponent(name)}/status`);
  },

  addCrew(name, rig) {
    return this.post('/api/crews', { name, rig });
  },

  removeCrew(name) {
    return this.request(`/api/crew/${encodeURIComponent(name)}`, { method: 'DELETE' });
  },

  runDoctor(options = {}) {
    const params = options.refresh ? '?refresh=true' : '';
    return this.get(`/api/doctor${params}`);
  },

  runDoctorFix() {
    return this.post('/api/doctor/fix');
  },

  // === Polecat Output ===
  getPeekOutput(rig, name) {
    return this.get(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/output`);
  },

  getAgentTranscript(rig, name) {
    return this.get(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/transcript`);
  },

  // === Agent Controls ===
  startAgent(rig, name) {
    return this.post(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/start`);
  },

  stopAgent(rig, name) {
    return this.post(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/stop`);
  },

  restartAgent(rig, name) {
    return this.post(`/api/polecat/${encodeURIComponent(rig)}/${encodeURIComponent(name)}/restart`);
  },

  // === Service Controls ===
  startService(name) {
    return this.post(`/api/service/${encodeURIComponent(name)}/up`);
  },

  stopService(name) {
    return this.post(`/api/service/${encodeURIComponent(name)}/down`);
  },

  restartService(name) {
    return this.post(`/api/service/${encodeURIComponent(name)}/restart`);
  },

  getServiceStatus(name) {
    return this.get(`/api/service/${encodeURIComponent(name)}/status`);
  },

  // === GitHub Integration ===
  getGitHubPRs(state = 'open') {
    return this.get(`/api/github/prs?state=${encodeURIComponent(state)}`);
  },

  getGitHubPR(repo, number) {
    return this.get(`/api/github/pr/${encodeURIComponent(repo)}/${number}`);
  },

  // === GitHub Issues ===
  getGitHubIssues(state = 'open') {
    return this.get(`/api/github/issues?state=${encodeURIComponent(state)}`);
  },

  getGitHubIssue(repo, number) {
    return this.get(`/api/github/issue/${encodeURIComponent(repo)}/${number}`);
  },

  // === GitHub Repos ===
  getGitHubRepos(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit);
    if (options.visibility) params.set('visibility', options.visibility);
    if (options.refresh) params.set('refresh', 'true');
    const query = params.toString();
    return this.get(`/api/github/repos${query ? '?' + query : ''}`);
  },

  // === K8s Integration (Wave 3) ===

  // K8s Health & Configuration
  getK8sHealth() {
    return this.get('/api/k8s/health');
  },

  getK8sContexts() {
    return this.get('/api/k8s/contexts');
  },

  setK8sContext(context) {
    return this.post('/api/k8s/context', { context });
  },

  getK8sNamespaces() {
    return this.get('/api/k8s/namespaces');
  },

  setK8sNamespace(namespace) {
    return this.post('/api/k8s/namespace', { namespace });
  },

  // K8s Polecats
  getK8sPolecats(namespace) {
    const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return this.get(`/api/k8s/polecats${query}`);
  },

  getK8sPolecat(namespace, name) {
    return this.get(`/api/k8s/polecats/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`);
  },

  createK8sPolecat(spec) {
    return this.post('/api/k8s/polecats', spec);
  },

  deleteK8sPolecat(namespace, name, graceful = false) {
    const query = graceful ? '?graceful=true' : '';
    return this.request(`/api/k8s/polecats/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}${query}`, {
      method: 'DELETE',
    });
  },

  // K8s Convoys
  getK8sConvoys(namespace) {
    const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return this.get(`/api/k8s/convoys${query}`);
  },

  getK8sConvoy(namespace, name) {
    return this.get(`/api/k8s/convoys/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`);
  },

  createK8sConvoy(spec) {
    return this.post('/api/k8s/convoys', spec);
  },

  deleteK8sConvoy(namespace, name) {
    return this.request(`/api/k8s/convoys/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  },

  previewK8sConvoyMembers(selector, namespace) {
    return this.post('/api/k8s/convoys/preview', { selector, namespace });
  },

  // K8s Forges/Rigs
  getK8sForges(namespace) {
    const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return this.get(`/api/k8s/forges${query}`);
  },

  // === K8s Wave 4: Logs, Metrics, Cross-Sling ===

  // Get polecat logs (returns plain text, bypasses JSON wrapper)
  async getK8sPolecatLogs(namespace, name, options = {}) {
    const params = new URLSearchParams();
    if (options.tailLines) params.set('tailLines', options.tailLines);
    if (options.timestamps === false) params.set('timestamps', 'false');
    if (options.previous) params.set('previous', 'true');
    if (options.sinceSeconds) params.set('sinceSeconds', options.sinceSeconds);
    const query = params.toString();
    const url = `${API_BASE}/api/k8s/polecats/${encodeURIComponent(namespace)}/${encodeURIComponent(name)}/logs${query ? '?' + query : ''}`;
    const response = await fetch(url, { headers: { Accept: 'text/plain' } });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to fetch logs');
    }
    return response.text();
  },

  // Get aggregated K8s metrics
  getK8sMetrics(namespace) {
    const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return this.get(`/api/k8s/metrics${query}`);
  },

  // Export K8s metrics as CSV (returns URL for download)
  getK8sMetricsExportUrl(namespace) {
    const query = namespace ? `?namespace=${encodeURIComponent(namespace)}` : '';
    return `${window.location.origin}/api/k8s/metrics/export${query}`;
  },

  // Sling local bead to K8s
  slingToK8s(beadId, options = {}) {
    return this.post('/api/sling-to-k8s', {
      beadId,
      namespace: options.namespace,
      forgeRef: options.forgeRef,
      sdk: options.sdk,
    });
  },

  // Sling K8s automaton result to local bead
  slingToLocal(automatonName, namespace, rig) {
    return this.post('/api/sling-to-local', {
      automatonName,
      namespace,
      rig,
    });
  },
};

// WebSocket Client
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.listeners = {
      open: [],
      close: [],
      error: [],
      message: [],
    };
  }

  connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = (event) => {
        this.reconnectAttempts = 0;
        this.listeners.open.forEach(cb => cb(event));
      };

      this.socket.onclose = (event) => {
        this.listeners.close.forEach(cb => cb(event));
        this.attemptReconnect();
      };

      this.socket.onerror = (event) => {
        this.listeners.error.forEach(cb => cb(event));
      };

      this.socket.onmessage = (event) => {
        this.listeners.message.forEach(cb => cb(event));
      };
    } catch (err) {
      console.error('[WS] Connection error:', err);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => this.connect(), delay);
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send - not connected');
    }
  }

  set onopen(callback) {
    this.listeners.open.push(callback);
  }

  set onclose(callback) {
    this.listeners.close.push(callback);
  }

  set onerror(callback) {
    this.listeners.error.push(callback);
  }

  set onmessage(callback) {
    this.listeners.message.push(callback);
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }
}

export const ws = new WebSocketClient(WS_URL);
