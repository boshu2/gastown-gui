# Gas Town GUI - Gap Analysis & Implementation Plan

**Generated:** 2026-01-17
**Last Updated:** 2026-01-17
**Official Gas Town:** https://github.com/steveyegge/gastown
**This GUI:** https://github.com/web3dev1337/gastown-gui

---

## Executive Summary

| Category | Status | Priority |
|----------|--------|----------|
| **Hardcoded Paths** | 🟢 GOOD - Only branding refs | P3 Low |
| **Security** | 🟢 GOOD - No exposed secrets | N/A |
| **Test Coverage** | 🟢 **206 tests passing** | ✅ CLOSED |
| **Feature Parity** | 🟢 ~80% of Gas Town | P2 Medium |

---

## 1. Hardcoded Paths (LOW Priority)

The codebase is **highly portable**. Only cosmetic/branding references found:

| File | Line | Issue | Severity |
|------|------|-------|----------|
| `package.json` | 35,37,39,50 | `web3dev1337` in repo URLs & author | Low |
| `bin/cli.js` | 90 | GitHub URL in help text | Low |
| `README.md` | 35 | Clone URL | Low |
| `test/mock-server.js` | 263-266 | Mock repo data | Low |
| `js/components/work-list.js` | 37,41 | Repo mapping | Low |
| `js/components/modals.js` | 26 | Repo mapping | Low |

**Good practices found:**
- ✅ Uses `process.env.HOME || require('os').homedir()` for paths
- ✅ Uses `process.env.GT_ROOT || path.join(HOME, 'gt')`
- ✅ No hardcoded API keys or secrets
- ✅ Port configurable via CLI flags and env vars

**Action:** Update `web3dev1337` references if transferring to another org.

---

## 2. Test Coverage ✅ CLOSED

### Current State: 206 Tests Passing

**What's Tested:**
- ✅ State management (53 unit tests)
- ✅ quoteArg security (22 test cases for shell injection)
- ✅ E2E tests (24 Puppeteer tests) - **NOW RUNNING IN CI**
- ✅ Server endpoints (129 integration tests) - **NEW**
- ✅ WebSocket connections - **NEW**
- ✅ Cache/TTL system - **NEW**

| Component | Tests | Status |
|-----------|-------|--------|
| Unit tests | 53 | ✅ TESTED |
| Integration tests | 129 | ✅ TESTED |
| E2E tests (Puppeteer) | 24 | ✅ TESTED |
| **Total** | **206** | ✅ ALL PASSING |

### Test Files Added

- ✅ `test/integration/endpoints.test.js` - 30KB of endpoint tests
- ✅ `test/integration/websocket.test.js` - WebSocket lifecycle tests
- ✅ `test/integration/cache.test.js` - Cache invalidation tests
- ✅ `.github/workflows/ci.yml` - E2E tests now run in CI

### CI Status

Tests run on Node 18, 20, and 22. All passing.

---

## 3. Feature Parity with Gas Town (MEDIUM Priority)

### Coverage by Area

| Feature | Gas Town | GUI Has | Gap |
|---------|----------|---------|-----|
| **Convoy Management** | Full lifecycle | Create/list | 40% missing |
| **Sling Work** | Full w/ overrides | Basic | 30% missing |
| **Beads/Issues** | Full CRUD | Full CRUD | ✅ Good |
| **Mail/Communication** | Full | Full | ✅ Good |
| **GitHub Integration** | Full | Full | ✅ Good |
| **Polecat Control** | spawn/kill/logs | ✅ spawn/stop/restart | ✅ **IMPLEMENTED** |
| **Crew Management** | Full | ✅ Create/List/View | ✅ **IMPLEMENTED** |
| **Agent Config** | Full | List only | ⚠️ 90% missing |
| **Rig Management** | Full | ✅ Create/List/Delete | ✅ **IMPLEMENTED** |
| **Formula Editor** | Full | ✅ Create/List/Use | ✅ **IMPLEMENTED** |

### ✅ Recently Implemented

**1. CREW MANAGEMENT** - `js/components/crew-list.js`
- ✅ Create crews
- ✅ List crews with status
- ✅ View crew details
- ⚠️ Still needs: visibility settings, session attachment

**2. FORMULA OPERATIONS** - `js/components/formula-list.js`
- ✅ Formula list view
- ✅ Create new formulas
- ✅ Execute formulas on targets
- ⚠️ Still needs: molecule workflows

### ✅ Polecat Lifecycle - IMPLEMENTED

- ✅ `spawn` - Spawn Polecat button in Rig list
- ✅ `stop` - Stop via API
- ✅ `restart` - Restart via API
- ⚠️ Detailed logs view - basic output only
- ⚠️ 3-layer monitoring - not implemented

### Still Missing Features

**AGENT CONFIGURATION**
- ❌ Custom agent definitions
- ❌ Runtime overrides
- ❌ Per-rig settings

### Recommended Usage

**✅ USE GUI FOR:**
- Monitor work progress
- Create/track convoys
- View agent output
- Check system health
- Send mail/nudges
- Team visibility

**❌ USE CLI FOR:**
- Creating new polecats
- Killing workers
- Setting up crews
- Configuring agents
- Creating formulas

---

## 4. Implementation Roadmap

### Phase 1: Tests ✅ COMPLETE
- [x] Enable E2E tests in CI
- [x] Add 129 endpoint tests
- [x] Add WebSocket tests
- [x] Add cache tests

**Status:** ✅ 206 tests passing

### Phase 2: Crew & Formula ✅ COMPLETE
- [x] Crew management panel (`js/components/crew-list.js`)
- [x] Formula list with create/use (`js/components/formula-list.js`)

**Status:** ✅ Implemented

### Phase 3: Critical Features (REMAINING)
- [ ] Polecat spawn UI
- [ ] Polecat kill/nuke UI
- [ ] Polecat logs viewer

**Estimated effort:** 20-30 hours

### Phase 4: Agent Config (REMAINING)
- [ ] Agent configuration UI
- [ ] Runtime override support
- [ ] Per-rig settings

**Estimated effort:** 25-35 hours

---

## 5. Files Modified/Added

### Tests ✅ ADDED
- [x] `test/integration/endpoints.test.js` - 30KB, 129 tests
- [x] `test/integration/websocket.test.js` - WebSocket lifecycle
- [x] `test/integration/cache.test.js` - Cache invalidation
- [x] `.github/workflows/ci.yml` - E2E step added

### Features ✅ ADDED
- [x] `js/components/crew-list.js` - Crew management
- [x] `js/components/formula-list.js` - Formula operations

### Features Still Needed
- [ ] `js/components/polecat-controls.js` - Spawn/kill UI
- [ ] `js/components/agent-config.js` - Agent settings
- [ ] `server.js` - Add polecat spawn/kill endpoints

---

## 6. Success Criteria

### MVP ✅ ACHIEVED
- ✅ No exposed secrets
- ✅ Portable paths
- ✅ E2E tests in CI
- ✅ 206 tests passing
- ✅ Crew management
- ✅ Formula operations

### Full Release (Remaining)
- [ ] Polecat spawn/kill
- [ ] Agent configuration
- [ ] Rig deletion

---

## Current Known Limitations

**Still Not Implemented:**
- Polecat management (spawn, kill, view logs)
- Agent configuration UI
- Rig removal/deletion

**Now Implemented:**
- ✅ Crew management - basic create/list/view
- ✅ Formula editor/creator - create/list/use
- ✅ Comprehensive test coverage (206 tests)
