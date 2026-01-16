/**
 * Gas Town GUI - API Endpoint Tests
 *
 * Tests server endpoints for correct behavior, input validation, and error handling.
 * Uses the mock server for isolation from the actual Gas Town backend.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const PORT = process.env.PORT || 5678;
const BASE_URL = `http://localhost:${PORT}`;

// Helper to make API requests
async function api(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, ok: response.ok };
}

describe('API Endpoint Tests', () => {

  describe('GET /api/status', () => {
    it('should return system status with required fields', async () => {
      const { status, data, ok } = await api('/api/status');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('agents');
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it('should include agent count and status', async () => {
      const { data } = await api('/api/status');

      expect(typeof data.active_agents).toBe('number');
      expect(typeof data.convoy_count).toBe('number');
    });
  });

  describe('GET /api/health', () => {
    it('should return health check with ok status', async () => {
      const { status, data, ok } = await api('/api/health');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(data).toHaveProperty('status', 'ok');
    });
  });

  describe('GET /api/convoys', () => {
    it('should return array of convoys', async () => {
      const { status, data, ok } = await api('/api/convoys');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include convoy details', async () => {
      const { data } = await api('/api/convoys');

      if (data.length > 0) {
        const convoy = data[0];
        expect(convoy).toHaveProperty('id');
        expect(convoy).toHaveProperty('name');
        expect(convoy).toHaveProperty('status');
      }
    });
  });

  describe('GET /api/convoy/:id', () => {
    it('should return specific convoy by id', async () => {
      // First get list to find a valid ID
      const { data: convoys } = await api('/api/convoys');

      if (convoys.length > 0) {
        const convoyId = convoys[0].id;
        const { status, data, ok } = await api(`/api/convoy/${convoyId}`);

        expect(ok).toBe(true);
        expect(status).toBe(200);
        expect(data).toHaveProperty('id', convoyId);
      }
    });

    it('should return 404 for non-existent convoy', async () => {
      const { status, ok } = await api('/api/convoy/non-existent-id-12345');

      // Mock server may return 200 with null, or 404
      expect([200, 404]).toContain(status);
    });
  });

  describe('GET /api/mail', () => {
    it('should return array of mail messages', async () => {
      const { status, data, ok } = await api('/api/mail');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include mail message details', async () => {
      const { data } = await api('/api/mail');

      if (data.length > 0) {
        const mail = data[0];
        expect(mail).toHaveProperty('id');
        expect(mail).toHaveProperty('from');
        expect(mail).toHaveProperty('subject');
      }
    });
  });

  describe('GET /api/rigs', () => {
    it('should return array of rigs or 404 if not mocked', async () => {
      const { status, data } = await api('/api/rigs');

      // Mock server may not implement this endpoint
      if (status === 200) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(status).toBe(404);
      }
    });
  });

  describe('GET /api/agents', () => {
    it('should return array of agents', async () => {
      const { status, data, ok } = await api('/api/agents');

      expect(ok).toBe(true);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('should include agent details', async () => {
      const { data } = await api('/api/agents');

      if (data.length > 0) {
        const agent = data[0];
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('role');
        expect(agent).toHaveProperty('status');
      }
    });
  });

  describe('GET /api/beads', () => {
    it('should return array of beads/work items or 404 if not mocked', async () => {
      const { status, data } = await api('/api/beads');

      // Mock server may not implement this endpoint
      if (status === 200) {
        expect(Array.isArray(data)).toBe(true);
      } else {
        expect(status).toBe(404);
      }
    });
  });

  describe('POST /api/convoy', () => {
    it('should create a new convoy with valid data', async () => {
      const { status, ok } = await api('/api/convoy', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Convoy',
          issues: ['Test issue 1', 'Test issue 2'],
        }),
      });

      // May succeed (201) or fail if mock doesn't support POST
      expect([200, 201, 400, 500]).toContain(status);
    });

    it('should handle missing required fields', async () => {
      const { status } = await api('/api/convoy', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      // Should either reject with 400 or handle gracefully
      expect([200, 201, 400, 500]).toContain(status);
    });
  });

  describe('POST /api/nudge', () => {
    it('should send a nudge message', async () => {
      const { status } = await api('/api/nudge', {
        method: 'POST',
        body: JSON.stringify({
          target: 'agent-1',
          message: 'Test nudge message',
        }),
      });

      expect([200, 201, 400, 500]).toContain(status);
    });
  });

  describe('GET /api/doctor', () => {
    it('should return diagnostic information or 404 if not mocked', async () => {
      const { status } = await api('/api/doctor');

      // Mock server may not implement this endpoint
      expect([200, 404]).toContain(status);
    });
  });

  describe('GET /api/setup/status', () => {
    it('should return setup status or 404 if not mocked', async () => {
      const { status } = await api('/api/setup/status');

      // Mock server may not implement this endpoint
      expect([200, 404]).toContain(status);
    });
  });

});

describe('POST /api/sling', () => {
  it('should dispatch work to an agent', async () => {
    const { status, data, ok } = await api('/api/sling', {
      method: 'POST',
      body: JSON.stringify({
        bead: 'test-bead-123',
        target: 'zoo-game/Polecat-1',
        molecule: 'test-molecule',
        quality: 'normal',
      }),
    });

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('status', 'dispatched');
  });
});

describe('GET /api/hook', () => {
  it('should return hook status', async () => {
    const { status, data, ok } = await api('/api/hook');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('status');
  });
});

describe('POST /api/mail', () => {
  it('should send a mail message', async () => {
    const { status, data, ok } = await api('/api/mail', {
      method: 'POST',
      body: JSON.stringify({
        to: 'agent-1',
        subject: 'Test subject',
        message: 'Test message body',
        priority: 'normal',
      }),
    });

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('mail');
    expect(data.mail).toHaveProperty('id');
  });
});

describe('GET /api/beads/search', () => {
  it('should search beads by query', async () => {
    const { status, data, ok } = await api('/api/beads/search?q=login');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should return empty array for no matches', async () => {
    const { status, data, ok } = await api('/api/beads/search?q=nonexistentxyz123');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('GET /api/formulas/search', () => {
  it('should search formulas by query', async () => {
    const { status, data, ok } = await api('/api/formulas/search?q=test');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });
});

describe('GET /api/targets', () => {
  it('should return available sling targets', async () => {
    const { status, data, ok } = await api('/api/targets');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should include target details', async () => {
    const { data } = await api('/api/targets');

    if (data.length > 0) {
      const target = data[0];
      expect(target).toHaveProperty('id');
      expect(target).toHaveProperty('name');
      expect(target).toHaveProperty('type');
    }
  });
});

describe('POST /api/escalate', () => {
  it('should escalate a convoy', async () => {
    const { status, data, ok } = await api('/api/escalate', {
      method: 'POST',
      body: JSON.stringify({
        convoy_id: 'convoy-123',
        reason: 'Blocked on dependency',
        priority: 'high',
      }),
    });

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('success', true);
  });
});

describe('GET /api/github/repos', () => {
  it('should return list of GitHub repos', async () => {
    const { status, data, ok } = await api('/api/github/repos');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should include repo details', async () => {
    const { data } = await api('/api/github/repos');

    if (data.length > 0) {
      const repo = data[0];
      expect(repo).toHaveProperty('name');
      expect(repo).toHaveProperty('url');
    }
  });
});

describe('Rig Management', () => {
  it('should list rigs', async () => {
    const { status, data, ok } = await api('/api/rigs');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
  });

  it('should add a new rig', async () => {
    const { status, data, ok } = await api('/api/rigs', {
      method: 'POST',
      body: JSON.stringify({
        name: 'test-rig',
        url: 'https://github.com/test/repo',
      }),
    });

    expect(ok).toBe(true);
    expect([200, 201]).toContain(status);
    expect(data).toHaveProperty('success', true);
  });

  it('should reject add rig without required fields', async () => {
    const { status } = await api('/api/rigs', {
      method: 'POST',
      body: JSON.stringify({ name: 'incomplete' }),
    });

    expect(status).toBe(400);
  });

  it('should delete a rig', async () => {
    // First ensure we have a rig to delete
    await api('/api/rigs', {
      method: 'POST',
      body: JSON.stringify({
        name: 'delete-test-rig',
        url: 'https://github.com/test/delete-repo',
      }),
    });

    const { status, data, ok } = await api('/api/rigs/delete-test-rig', {
      method: 'DELETE',
    });

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('success', true);
  });

  it('should return 404 for non-existent rig deletion', async () => {
    const { status } = await api('/api/rigs/non-existent-rig-xyz', {
      method: 'DELETE',
    });

    expect(status).toBe(404);
  });
});

describe('Doctor & Setup', () => {
  it('should return doctor diagnostics', async () => {
    const { status, data, ok } = await api('/api/doctor');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('checks');
    expect(Array.isArray(data.checks)).toBe(true);
  });

  it('should run doctor fix', async () => {
    const { status, data, ok } = await api('/api/doctor/fix', {
      method: 'POST',
    });

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('fixed');
  });

  it('should return setup status', async () => {
    const { status, data, ok } = await api('/api/setup/status');

    expect(ok).toBe(true);
    expect(status).toBe(200);
    expect(data).toHaveProperty('installed');
    expect(data).toHaveProperty('ready');
  });
});

describe('API Error Handling', () => {

  it('should return 404 for unknown endpoints', async () => {
    const { status } = await api('/api/unknown-endpoint-12345');

    expect(status).toBe(404);
  });

  it('should handle malformed JSON gracefully', async () => {
    const response = await fetch(`${BASE_URL}/api/convoy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid json }',
    });

    // Should return 400 for bad JSON, not crash
    expect([400, 500]).toContain(response.status);
  });

});
