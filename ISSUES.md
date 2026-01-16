# Gas Town GUI - Issues Tracker

**Status:** In Progress
**Branch:** `feature/gap-analysis-and-improvements`

---

## Priority 1: Test Coverage (CRITICAL)

### Issue 1.1: Server Endpoint Tests Missing
**Status:** 🟢 COMPLETE (20 tests added)
**Impact:** HIGH - 40+ endpoints untested, security risk

**Endpoints tested:**
- [x] `GET /api/status` - System status
- [x] `GET /api/health` - Health check
- [x] `POST /api/convoy` - Create convoy (input validation)
- [x] `GET /api/convoys` - List convoys
- [x] `GET /api/convoy/:id` - Single convoy
- [x] `GET /api/rigs` - List rigs
- [x] `GET /api/beads` - List work items
- [x] `GET /api/mail` - List mail
- [x] `GET /api/agents` - List agents
- [x] `POST /api/nudge` - Send nudge
- [x] `GET /api/doctor` - Diagnostics
- [x] `GET /api/setup/status` - Setup status
- [x] Error handling (404, malformed JSON)

**Still needed:**
- [ ] `POST /api/sling` - Send work to agents (SECURITY: command injection)
- [ ] `POST /api/rigs` - Add rig (state mutation)
- [ ] `DELETE /api/rigs/:name` - Delete rig
- [ ] `POST /api/beads` - Create bead

**Test file:** `test/integration/endpoints.test.js`

---

### Issue 1.2: WebSocket Tests Missing
**Status:** 🟢 COMPLETE (9 tests added)
**Impact:** HIGH - Real-time features untested

**Tests added:**
- [x] Connection establishment
- [x] Multiple concurrent connections
- [x] Clean disconnect handling
- [x] Abrupt disconnect handling
- [x] Ping/pong handling
- [x] Invalid JSON handling
- [x] Empty message handling
- [x] Reconnection after disconnect

**Test file:** `test/integration/websocket.test.js`

---

### Issue 1.3: Cache/TTL Tests Missing
**Status:** 🟢 COMPLETE (10 tests added)
**Impact:** MEDIUM - Subtle bugs possible

**Tests added:**
- [x] Response time consistency (status, convoys, mail)
- [x] Cache bypass with refresh parameter
- [x] Data consistency from cache
- [x] Concurrent requests for same endpoint
- [x] Concurrent requests for different endpoints
- [x] Cache under load (10 rapid requests)

**Test file:** `test/integration/cache.test.js`

---

## Priority 2: Code Quality

### Issue 2.1: Hardcoded Repo References
**Status:** 🔴 Not Started
**Impact:** LOW - Cosmetic, affects branding only

**Files to update:**
- [ ] `package.json` - Lines 35, 37, 39, 50
- [ ] `bin/cli.js` - Line 90
- [ ] `README.md` - Line 35
- [ ] `test/mock-server.js` - Lines 263-266
- [ ] `js/components/work-list.js` - Lines 37, 41
- [ ] `js/components/modals.js` - Line 26

**Action:** Make repo references configurable or use official Gas Town URLs

---

## Priority 3: Missing Features

### Issue 3.1: Polecat Spawn/Kill UI
**Status:** 🔴 Not Started
**Impact:** HIGH - Can't create/terminate workers from GUI

**Needs:**
- [ ] Spawn polecat button/form
- [ ] Kill polecat confirmation dialog
- [ ] Polecat logs viewer

---

### Issue 3.2: Crew Management
**Status:** 🔴 Not Started
**Impact:** MEDIUM - Long-lived workers need CLI

**Needs:**
- [ ] Crew list view
- [ ] Create crew form
- [ ] Crew visibility settings

---

### Issue 3.3: Formula Editor
**Status:** 🔴 Not Started
**Impact:** MEDIUM - Repeatable workflows need CLI

**Needs:**
- [ ] Formula creation wizard
- [ ] Variable support
- [ ] Formula execution

---

## Progress Log

| Date | Issue | Action | Commit |
|------|-------|--------|--------|
| 2026-01-17 | Setup | Created GAP_ANALYSIS.md | `65d0d35` |
| 2026-01-17 | CI | Enabled E2E tests in CI | `22a0b89` |
| 2026-01-17 | 1.1 | Added 20 endpoint tests | `08794ba` |
| 2026-01-17 | Fix | Fixed integration test (convoy issue tree) | `9beea51` |
| 2026-01-17 | 1.2 | Added 9 WebSocket tests | `e332003` |
| 2026-01-17 | 1.3 | Added 10 cache tests | `17a24ae` |

---

## Next Steps

1. ~~**Issue 1.1** - Add server endpoint tests~~ ✅ DONE
2. ~~**Issue 1.2** - Add WebSocket tests~~ ✅ DONE
3. ~~**Issue 1.3** - Add cache tests~~ ✅ DONE
4. **Issue 1.1 (continued)** - Add remaining endpoint tests (sling, rigs, beads)
5. Continue with Priority 2 and 3...
