# Gas Town GUI - API Reference

Maps GUI HTTP endpoints to `gt` CLI commands.

**Backend:** [steveyegge/gastown](https://github.com/steveyegge/gastown) (Go CLI)

---

## Endpoints

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
| `GET /api/mail/all` | (internal) | ✅ | All mail |
| `GET /api/mail/:id` | `gt mail read :id --json` | ✅ | Read mail |
| `POST /api/mail` | `gt mail send` | ✅ | Send mail |
| `POST /api/mail/:id/read` | `gt mail mark-read` | ✅ | Mark read |
| `POST /api/mail/:id/unread` | `gt mail mark-unread` | ✅ | Mark unread |

### Beads (Work Items) - via `bd` CLI
| GUI Endpoint | bd Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/beads` | `bd list` | ✅ | List beads |
| `GET /api/beads/search` | `bd search` | ✅ | Search beads |
| `POST /api/beads` | `bd create` | ✅ | Create bead |
| `GET /api/bead/:id` | `bd show :id --json` | ✅ | Get bead |
| `GET /api/bead/:id/links` | `bd show` + parse | ✅ | Get bead links |
| `POST /api/work/:id/done` | `bd done` | ✅ | Mark done |
| `POST /api/work/:id/park` | `bd park` | ✅ | Park work |
| `POST /api/work/:id/release` | `bd release` | ✅ | Release work |
| `POST /api/work/:id/reassign` | `bd reassign` | ✅ | Reassign |

### Formulas (via `bd` CLI)
| GUI Endpoint | bd Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/formulas` | `bd formula list` | ✅ | List formulas |
| `GET /api/formulas/search` | `bd formula search` | ✅ | Search |
| `GET /api/formula/:name` | `bd formula show` | ✅ | Get formula |
| `POST /api/formulas` | `bd formula create` | ✅ | Create formula |
| `PUT /api/formula/:name` | (file update) | ✅ | Update formula |
| `DELETE /api/formula/:name` | (file delete) | ✅ | Delete formula |
| `POST /api/formula/:name/use` | `bd cook` | ✅ | Execute formula |

### Crew Management
| GUI Endpoint | gt Command | Tested | Notes |
|--------------|------------|--------|-------|
| `GET /api/crews` | `gt crew list` | ✅ | List crews |
| `GET /api/crew/:name/status` | `gt crew status` | ✅ | Crew status |
| `POST /api/crews` | `gt crew add` | ✅ | Add crew |
| `DELETE /api/crew/:name` | `gt crew remove` | ✅ | Remove crew |

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
| Mail | 6 | 6 | 100% |
| Beads | 9 | 9 | 100% |
| Formulas | 10 | 10 | 100% |
| Crews | 8 | 8 | 100% |
| Services | 4 | 4 | 100% |
| Hook | 1 | 1 | 100% |
| **TOTAL** | **61** | **61** | **100%** |

