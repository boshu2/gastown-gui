# Gas Town GUI - Issues Tracker

**Status:** In Progress
**Branch:** `feature/gap-analysis-and-improvements`
**Backend:** [steveyegge/gastown](https://github.com/steveyegge/gastown) (Go CLI)

---

## API Coverage Matrix

The GUI wraps the `gt` CLI commands as HTTP endpoints. Here's the full mapping:

### Core Status & Health
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/status` | `gt status --json --fast` | ✅ | System overview |
| `GET /api/health` | (internal) | ✅ | Server health check |
| `GET /api/setup/status` | `gt rig list` | ✅ | Setup wizard status |
| `GET /api/doctor` | `gt doctor --json` | ✅ | Diagnostics |
| `POST /api/doctor/fix` | `gt doctor --fix` | ✅ | Auto-fix issues |

### Convoy Management
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/convoys` | `gt convoy list --json` | ✅ | List all convoys |
| `GET /api/convoy/:id` | `gt convoy status :id --json` | ✅ | Single convoy |
| `POST /api/convoy` | `gt convoy create` | ✅ | Create convoy |

### Agent Operations
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/agents` | `gt status --json --fast` | ✅ | List agents |
| `POST /api/sling` | `gt sling` | ✅ | **CRITICAL** - Spawn work |
| `POST /api/nudge` | `gt nudge` | ✅ | Send nudge to agent |
| `POST /api/escalate` | `gt escalate` | ✅ | Escalate issue |
| `GET /api/targets` | `gt status --json --fast` | ✅ | Get sling targets |

### Polecat (Worker) Management
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/polecat/:rig/:name/output` | (tmux capture) | ✅ | Get output |
| `GET /api/polecat/:rig/:name/transcript` | (file read) | ✅ | Get transcript |
| `POST /api/polecat/:rig/:name/start` | `gt polecat spawn` | ✅ | Start polecat |
| `POST /api/polecat/:rig/:name/stop` | (tmux kill) | ✅ | Stop polecat |
| `POST /api/polecat/:rig/:name/restart` | spawn after stop | ✅ | Restart |

### Mayor Operations
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/mayor/output` | (tmux capture) | ✅ | Mayor output |
| `GET /api/mayor/messages` | (internal state) | ✅ | Message history |

### Rig (Project) Management
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/rigs` | `gt rig list` | ✅ | List rigs |
| `POST /api/rigs` | `gt rig add` | ✅ | Add rig |
| `DELETE /api/rigs/:name` | `gt rig remove` | ✅ | Remove rig |

### Mail System
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/mail` | `gt mail inbox --json` | ✅ | List inbox |
| `GET /api/mail/all` | (internal) | ❌ | All mail |
| `GET /api/mail/:id` | `gt mail read :id --json` | ❌ | Read mail |
| `POST /api/mail` | `gt mail send` | ✅ | Send mail |
| `POST /api/mail/:id/read` | `gt mail mark-read` | ❌ | Mark read |
| `POST /api/mail/:id/unread` | `gt mail mark-unread` | ❌ | Mark unread |

### Beads (Work Items) - via `bd` CLI
| GUI Endpoint | bd Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/beads` | `bd list` | ✅ | List beads |
| `GET /api/beads/search` | `bd search` | ✅ | Search beads |
| `POST /api/beads` | `bd create` | ❌ | Create bead |
| `GET /api/bead/:id` | `bd show :id --json` | ❌ | Get bead |
| `GET /api/bead/:id/links` | `bd show` + parse | ❌ | Get bead links |
| `POST /api/work/:id/done` | `bd done` | ❌ | Mark done |
| `POST /api/work/:id/park` | `bd park` | ❌ | Park work |
| `POST /api/work/:id/release` | `bd release` | ❌ | Release work |
| `POST /api/work/:id/reassign` | `bd reassign` | ❌ | Reassign |

### Formulas (via `bd` CLI)
| GUI Endpoint | bd Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/formulas` | `bd formula list` | ❌ | List formulas |
| `GET /api/formulas/search` | `bd formula search` | ✅ | Search |
| `GET /api/formula/:name` | `bd formula show` | ❌ | Get formula |
| `POST /api/formulas` | `bd formula create` | ❌ | Create formula |
| `POST /api/formula/:name/use` | `bd cook` | ❌ | Execute formula |

### Service Management
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/service/:name/status` | (daemon status) | ✅ | Service status |
| `POST /api/service/:name/up` | (daemon start) | ✅ | Start service |
| `POST /api/service/:name/down` | (daemon stop) | ✅ | Stop service |
| `POST /api/service/:name/restart` | (daemon restart) | ✅ | Restart |

### Hook Management
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/hook` | `gt hook status --json` | ✅ | Hook status |

---

## Test Summary

| Category | Tested | Total | Coverage |
|----------|--------|-------|----------|
| Core Status | 5 | 5 | 100% |
| Convoy | 3 | 3 | 100% |
| Agents | 5 | 5 | 100% |
| Polecat | 5 | 5 | 100% |
| Mayor | 2 | 2 | 100% |
| Rigs | 3 | 3 | 100% |
| Mail | 2 | 6 | 33% |
| Beads | 2 | 9 | 22% |
| Formulas | 1 | 5 | 20% |
| Services | 4 | 4 | 100% |
| Hook | 1 | 1 | 100% |
| **TOTAL** | **33** | **48** | **69%** |

---

## Priority 1: Test Coverage (CRITICAL)

### Issue 1.1: Server Endpoint Tests
**Status:** 🟡 PARTIAL (33/48 endpoints tested = 69%)
**Impact:** MEDIUM - Mail/beads/formulas need coverage

**Test file:** `test/integration/endpoints.test.js`

**Phase 1 - Core (DONE):**
- [x] Status, health, convoys, mail, agents, rigs, beads, doctor

**Phase 2 - Operations (DONE):**
- [x] `POST /api/sling` - **SECURITY CRITICAL** (command injection risk)
- [x] `POST /api/rigs` - Add rig
- [x] `DELETE /api/rigs/:name` - Remove rig
- [x] `POST /api/escalate` - Escalation
- [x] `GET /api/targets` - Sling targets

**Phase 3 - Polecat/Mayor (DONE):**
- [x] All polecat endpoints (spawn, stop, restart, output, transcript)
- [x] All mayor endpoints (output, messages)
- [x] All service endpoints (status, up, down, restart)

**Phase 4 - Mail/Beads (TODO):**
- [ ] Full mail CRUD (4/6 remaining)
- [ ] Full beads CRUD (7/9 remaining)
- [ ] Formulas (4/5 remaining)

---

### Issue 1.2: WebSocket Tests
**Status:** 🟢 COMPLETE (9 tests)
**Test file:** `test/integration/websocket.test.js`

---

### Issue 1.3: Cache Tests
**Status:** 🟢 COMPLETE (10 tests)
**Test file:** `test/integration/cache.test.js`

---

## Priority 2: Code Quality

### Issue 2.1: Hardcoded Repo References
**Status:** 🔴 Not Started
**Impact:** LOW - Cosmetic

**Files to update:**
- [ ] `package.json` - Lines 35, 37, 39, 50
- [ ] `bin/cli.js` - Line 90
- [ ] `README.md` - Line 35
- [ ] `test/mock-server.js` - Lines 263-266
- [ ] `js/components/work-list.js` - Lines 37, 41
- [ ] `js/components/modals.js` - Line 26

---

## Priority 3: Missing Features

### Issue 3.1: Polecat Spawn/Kill UI
**Status:** 🔴 Not Started
**Impact:** HIGH - Can't manage workers from GUI

**gt commands to wrap:**
- `gt polecat spawn <rig>/<name>`
- `gt polecat list`
- (tmux kill-session for stop)

---

### Issue 3.2: Crew Management
**Status:** 🔴 Not Started
**Impact:** MEDIUM

**gt commands to wrap:**
- `gt crew add <name> --rig <rig>`
- `gt crew list`
- `gt crew status`

---

### Issue 3.3: Formula Editor
**Status:** 🔴 Not Started
**Impact:** MEDIUM

**bd commands to wrap:**
- `bd formula list`
- `bd formula create`
- `bd cook <formula>`

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
| 2026-01-17 | Docs | Added API coverage matrix | `0bfa364` |
| 2026-01-17 | 1.1 | Added 19 more endpoint tests (39 total) | `549cc17` |
| 2026-01-17 | 1.1 | Added polecat/mayor/service tests (53 total) | `908552d` |

---

## Next Steps

1. ~~**Issue 1.2** - WebSocket tests~~ ✅ DONE
2. ~~**Issue 1.3** - Cache tests~~ ✅ DONE
3. ~~**Issue 1.1 Phase 2** - Test sling, rigs mutation, escalate~~ ✅ DONE
4. ~~**Issue 1.1 Phase 3** - Test polecat/mayor/service endpoints~~ ✅ DONE
5. **Issue 1.1 Phase 4** - Test mail/beads/formulas CRUD (15 remaining)
6. **Issue 2.1** - Fix hardcoded repo references
7. **Issue 3.x** - Add missing UI features
