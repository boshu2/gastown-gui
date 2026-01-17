# Retrospective: Hybrid K8s Integration (gg-9kp)

**Date:** 2026-01-17
**Epic:** gg-9kp - Hybrid K8s Integration
**Duration:** ~1 day (single session)
**Outcome:** SUCCESS - All 5 waves delivered

## Summary

Extended gastown-gui to query both local workspace AND K8s resources, providing a unified dashboard for hybrid local/cluster execution. Delivered 14 features across 5 waves.

## Delivery Timeline

| Wave | Features | Commits |
|------|----------|---------|
| Wave 0 | Fork setup, K8s client | `de5f4bb`, `ed4c1b8` |
| Wave 1 | Polecat list, detail, convoy views | `68ff5b4`, `f2a9399`, `47e6ce1` |
| Wave 2 | Combined view, settings, mode toggle | `1686c3b`, `3953c2b`, `5eaf32f` |
| Wave 3 | Create/delete operations | `99bf739` |
| Wave 4 | Logs, metrics, cross-sling | `eee431d`, `b23a0b6` |

## What Went Well

### 1. Wave-Based Decomposition
Breaking the epic into 5 waves with clear dependencies worked excellently:
- Each wave was self-contained and testable
- Clear progression from read-only → full CRUD → advanced features
- Easy to track progress and communicate status

### 2. Parallel Component Development
The architecture allowed parallel development of:
- K8s client (`js/k8s/client.js`)
- Server endpoints (`server.js`)
- API layer (`js/api.js`)
- UI components (`js/components/*.js`)

### 3. Consistent Patterns
Established patterns in earlier waves accelerated later development:
- Modal component pattern (create/delete/logs/sling all follow same structure)
- API → Server → K8s client data flow
- CSS naming conventions (`.k8s-*`, `.metric-*`, `.logs-*`)

### 4. Vibe Check Caught Real Bug
The /vibe prescan identified a legitimate issue: `api.js` was calling `response.json()` on a text endpoint. Fixed before it became a runtime error.

## Friction Points

### 1. Shell CWD Reset
Every bash command reset the working directory to `/Users/fullerbt/gt/labyrinth/crew/boden` instead of staying in `gastown_gui`. Required prefixing every command with `cd /Users/fullerbt/gt/gastown_gui/crew/boden &&`.

**Mitigation:** Used absolute paths consistently.

### 2. Fork Resource Exhaustion
Multiple `fork: Resource temporarily unavailable` errors during git operations. Required retry logic with sleep delays.

**Mitigation:** Added `sleep 2 &&` before retry commands.

### 3. Context Window Pressure
Epic implementation consumed significant context, triggering compaction mid-session. Lost some earlier context about Wave 0-2 implementations.

**Mitigation:** Summary preserved key details. Todo list helped maintain state.

### 4. Vibe False Positives
Prescan flagged K8s API call syntax as "BLOCKER" but was actually correct for `@kubernetes/client-node` 1.0+ which uses object destructuring.

**Learning:** Verify tool version before flagging API patterns as incorrect.

## Patterns Extracted

### Pattern: Text Response Endpoints
When an API endpoint returns plain text (not JSON):
```javascript
// DON'T: Use JSON wrapper
return this.request(url).then(res => res.text());

// DO: Use direct fetch
const response = await fetch(url, { headers: { Accept: 'text/plain' } });
return response.text();
```

### Pattern: K8s Client 1.0+ API Calls
```javascript
// Use object destructuring for parameters
await customApi.listNamespacedCustomObject({
  group: 'gastown.gastown.io',
  version: 'v1alpha1',
  namespace: 'default',
  plural: 'polecats',
});
```

### Pattern: Modal Component Structure
```javascript
export async function showXModal(data, onSuccess) {
  const content = `...modal HTML...`;
  const modal = showDynamicModal('modal-id', content);
  // Load async data
  await loadDependencies(modal);
  // Wire up submit button
  modal.querySelector('#submit-btn').addEventListener('click', async () => {
    try {
      const result = await api.doAction(data);
      showToast('Success', 'success');
      closeModal(modal);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      showWarning(modal, err.message);
    }
  });
}
```

## Metrics

| Metric | Value |
|--------|-------|
| Issues closed | 14 |
| Commits | 12 |
| New files | 7 |
| Lines added | ~3,000 |
| Bugs caught by vibe | 1 |
| Session compactions | 1 |

## Recommendations

### For Future Epics
1. **Pin tool versions** in research phase to avoid API signature confusion
2. **Create text endpoint pattern** in api.js for reuse (not just logs)
3. **Consider K8s mock** for faster local development without cluster

### For gastown-gui
1. Add E2E tests for K8s integration (currently untested)
2. Consider WebSocket streaming for logs (current: polling every 5s)
3. Add K8s resource quota display to prevent DoS

## Conclusion

The epic was delivered successfully in a single session. The wave-based approach proved effective for managing complexity. Key learnings around text responses and K8s client patterns have been documented for future reference.
