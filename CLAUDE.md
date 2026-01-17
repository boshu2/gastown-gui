# Gas Town GUI

Web GUI for Gas Town multi-agent orchestrator.

## Project Overview

This is a fork of [web3dev1337/gastown-gui](https://github.com/web3dev1337/gastown-gui), extended with K8s/Olympus.io integration for hybrid local/cluster execution.

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript (no framework)
- **Communication**: WebSocket for real-time updates
- **Testing**: Vitest (unit), Puppeteer (E2E)

## Architecture

```
Browser → HTTP/WS → gastown-gui server → [gt CLI | K8s API] → [~/gt | olympus.io]
```

The server acts as a bridge:
- **Local Adapter**: Wraps `gt` and `bd` CLI commands via child_process
- **K8s Adapter**: Uses @kubernetes/client-node for olympus.io CRDs (in progress)

## Key Files

| Path | Purpose |
|------|---------|
| `server.js` | Express server, WebSocket, CLI bridge |
| `js/api.js` | REST/WebSocket client |
| `js/state.js` | Reactive state management |
| `js/app.js` | Main application entry |
| `js/components/` | UI components |
| `index.html` | Single-page app entry |

## Commands

```bash
npm install          # Install dependencies
npm start            # Start server (port 7667)
npm run dev          # Development mode
npm test             # Run all tests
npm run test:unit    # Unit tests only
npm run test:e2e     # E2E tests only
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GASTOWN_PORT` | 7667 | Server port |
| `HOST` | 127.0.0.1 | Server host |
| `GT_ROOT` | ~/gt | Gas Town workspace root |
| `KUBECONFIG` | ~/.kube/config | K8s config (for hybrid mode) |

## API Endpoints

### Local (existing)
- `GET /api/status` - Town status
- `GET /api/convoys` - List convoys
- `POST /api/sling` - Sling work to target
- `GET /api/mail` - Inbox messages
- `GET /api/agents` - List agents

### K8s (in progress)
- `GET /api/k8s/health` - K8s connection status
- `GET /api/k8s/automatons` - List Automatons
- `GET /api/k8s/convoys` - List K8s Convoys

## Epic: Hybrid K8s Integration (gg-9kp)

Current work: Extending GUI to query both local workspace AND K8s resources.

### Waves
- **Wave 0**: Foundation (setup, K8s client) - IN PROGRESS
- **Wave 1**: Read-only K8s integration
- **Wave 2**: Unified dashboard
- **Wave 3**: K8s operations (create/delete)
- **Wave 4**: Advanced features (logs, metrics)

See `bd show gg-9kp` for full epic details.

## Beads

```bash
bd ready --parent gg-9kp   # Ready features
bd show gg-9kp             # Epic overview
bd sync                    # Sync changes
```

## Testing

Tests use Vitest. Run with:
```bash
npm test                   # All tests
npm run test:unit          # Unit tests (fast)
npm run test:e2e           # E2E with Puppeteer
```

## Contributing

1. Pick an issue: `bd ready --parent gg-9kp`
2. Create branch: `git checkout -b feat/gg-xxx-description`
3. Implement with tests
4. Run CI: `npm test`
5. Submit PR
