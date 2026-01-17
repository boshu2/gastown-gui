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
├── server.js              # Express server + 61 API endpoints wrapping gt CLI
├── index.html             # Main HTML entry point
├── package.json           # Dependencies & npm scripts
├── bin/
│   └── cli.js             # CLI entry: npx gastown-gui --port 4000
├── js/
│   ├── api.js             # Frontend HTTP client for /api/* endpoints
│   ├── app.js             # App init, routing, event wiring
│   ├── state.js           # Global reactive state store
│   ├── components/
│   │   ├── activity-feed.js   # Real-time event stream display
│   │   ├── agent-grid.js      # Agent cards with status/actions
│   │   ├── autocomplete.js    # Search input with suggestions
│   │   ├── convoy-list.js     # Convoy management panel
│   │   ├── crew-list.js       # Crew CRUD operations
│   │   ├── dashboard.js       # Main dashboard layout
│   │   ├── formula-list.js    # Formula editor/executor
│   │   ├── health-check.js    # System health display
│   │   ├── issue-list.js      # Beads/issues list
│   │   ├── mail-list.js       # Mail inbox/compose
│   │   ├── modals.js          # Modal dialogs (sling, nudge, etc.)
│   │   ├── onboarding.js      # First-run setup wizard
│   │   ├── pr-list.js         # GitHub PR list
│   │   ├── rig-list.js        # Rig management + polecat spawn/stop
│   │   ├── sidebar.js         # Navigation sidebar
│   │   ├── toast.js           # Toast notifications
│   │   ├── tutorial.js        # Interactive tutorial
│   │   └── work-list.js       # Work items display
│   ├── shared/
│   │   ├── agent-types.js     # Agent type definitions & colors
│   │   └── events.js          # Custom event bus
│   └── utils/
│       ├── formatting.js      # Date/number formatters
│       ├── html.js            # HTML escape/template helpers
│       ├── performance.js     # Debounce/throttle utilities
│       └── tooltip.js         # Tooltip positioning
├── css/
│   ├── variables.css      # CSS custom properties (colors, spacing)
│   ├── reset.css          # Browser reset styles
│   ├── layout.css         # Grid/flex layouts
│   ├── components.css     # Component-specific styles
│   └── animations.css     # Transitions & keyframes
├── test/
│   ├── setup.js           # Test environment setup
│   ├── globalSetup.js     # Vitest global setup
│   ├── mock-server.js     # Mock gt CLI responses
│   ├── e2e.test.js        # Puppeteer browser tests (24)
│   ├── integration.test.js # Legacy integration tests
│   ├── unit/
│   │   ├── state.test.js      # State management tests (53)
│   │   └── quoteArg.test.js   # Shell injection security tests (22)
│   └── integration/
│       ├── endpoints.test.js  # API endpoint tests (78)
│       ├── websocket.test.js  # WebSocket lifecycle tests (9)
│       └── cache.test.js      # Cache invalidation tests (10)
├── vitest.config.js       # Main test config
└── vitest.unit.config.js  # Unit-only test config
```

## Key Patterns

**API Pattern:** GUI wraps `gt` CLI commands as HTTP endpoints
- `GET /api/status` → `gt status --json --fast`
- `POST /api/sling` → `gt sling`
- `POST /api/polecat/:rig/:name/start` → `gt polecat spawn`
- `POST /api/polecat/:rig/:name/stop` → tmux kill

**State:** Global state in `js/state.js`, components subscribe to updates

## Feature Status

| Feature | Status |
|---------|--------|
| Convoy Management | ✅ Create/list |
| Sling Work | ✅ Basic |
| Beads/Issues | ✅ Full CRUD |
| Mail | ✅ Full |
| GitHub Integration | ✅ Full |
| Polecat Control | ✅ spawn/stop/restart |
| Crew Management | ✅ Create/List/View |
| Rig Management | ✅ Create/List/Delete |
| Formula Editor | ✅ Create/List/Use |
| Agent Config | ❌ List only (90% missing) |

## When to Use GUI vs CLI

**Use GUI for:**
- Monitor work progress
- Create/track convoys
- View agent output
- Check system health
- Send mail/nudges

**Use CLI for:**
- Agent configuration
- Advanced polecat management
- Creating formulas

## Testing

- **206 tests** total (unit: 53, integration: 129, e2e: 24)
- **61 API endpoints** - all tested (100% coverage)
- CI runs on Node 18, 20, 22
