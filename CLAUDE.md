# CLAUDE.md - Gas Town GUI

Web GUI for [steveyegge/gastown](https://github.com/steveyegge/gastown) multi-agent orchestrator.

## Commands

```bash
npm start          # Start server (port 4000)
npm run dev        # Dev mode with auto-reload
npm test           # Run all tests (206 tests)
npm run test:unit  # Unit tests only
npm run test:e2e   # E2E tests only
```

## Architecture

```
gastown-gui/
├── server.js           # Express server + all API endpoints (~1400 lines)
├── js/
│   ├── api.js          # Frontend API client
│   ├── app.js          # Main app initialization
│   ├── state.js        # Global state management
│   ├── components/     # UI components (18 files)
│   │   ├── agent-grid.js
│   │   ├── rig-list.js
│   │   ├── crew-list.js
│   │   ├── mail-list.js
│   │   └── ...
│   ├── shared/         # Shared utilities
│   └── utils/          # Helper functions
├── test/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests (endpoints.test.js)
│   └── e2e.test.js     # End-to-end tests
└── public/             # Static assets (CSS, icons)
```

## Key Patterns

**API Pattern:** GUI wraps `gt` CLI commands as HTTP endpoints
- `GET /api/status` → `gt status --json --fast`
- `POST /api/sling` → `gt sling`
- See `API.md` for full endpoint mapping

**Polecat Control:** Spawn/stop/restart via rig-list.js
- `POST /api/polecat/:rig/:name/start` → `gt polecat spawn`
- `POST /api/polecat/:rig/:name/stop` → tmux kill
- `POST /api/polecat/:rig/:name/restart` → stop + spawn

**State:** Global state in `js/state.js`, components subscribe to updates

## Testing

- **206 tests** across unit, integration, and E2E
- **61 API endpoints** - all tested (100% coverage)
- Mock server in `test/mock-server.js` for isolated testing

## Docs

- `README.md` - User documentation
- `API.md` - Endpoint → CLI command mapping
- `GAP_ANALYSIS.md` - Feature roadmap for contributors
