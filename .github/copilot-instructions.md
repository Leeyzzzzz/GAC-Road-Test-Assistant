# 路测助手 — Copilot Instructions

## Project Overview

Road Test Assistant (路测助手): ADAS/autonomous driving field test case management system. Co-pilot recorders use voice to log issues; AI extracts structured fields automatically.

**Two independent apps** — `server/` (Express + SQLite) and `client/` (UniApp + Vue3, HBuilderX-managed). No monorepo workspace.

## Build & Test

```bash
# Backend
cd server && npm install
npm run dev          # nodemon, port 3000
npm test             # Jest + supertest
npx jest tests/ai-service.test.js --forceExit  # single test file

# Frontend — HBuilderX only (no npm scripts)
# Open client/ in HBuilderX → Run > Run to Browser/Device
```

## Architecture

### Backend (`server/`)
- `src/app.js` — Express entry, mounts routes, inits DB
- `src/models/database.js` — better-sqlite3 schema, singleton
- `src/models/queries.js` — all CRUD, raw SQL (no ORM)
- `src/routes/` — projects, sessions, records, upload, export, ai
- `src/services/ai-service.js` — adapter selector singleton; auto-picks by env var
- Adapters: `zhipu-adapter.js` (default), `qwen-adapter.js`, `mock-adapter.js`

**Data model:** `projects → test_sessions → records` (3-tier, FK enforced)

### Frontend (`client/`)
- HBuilderX UniApp + Vue3. No `package.json` at root.
- `services/api.js` — all HTTP, reads base URL from `process.env.VITE_API_BASE_URL` (injected via `vite.config.js` `define`)
- `services/config.js` — `process.env.VITE_*` only (static Vite replacement; no dynamic key access on `import.meta.env`)
- `pages/record/` — core flow: RecorderManager → upload → ASR → AI extract
- Conditional compilation: `// #ifdef H5` / `// #ifndef H5` for platform-specific code

## Key Gotchas

- **`form-data` streams**: Don't work with Node.js native `fetch`. Use `form.getBuffer()` + explicit `Content-Length`. See `_postMultipart()` in `zhipu-adapter.js`.
- **SQLite timestamps**: Use `datetime('now','localtime')`, never `CURRENT_TIMESTAMP` (UTC). All `UPDATE` statements must also use localtime.
- **UniApp env vars**: `vite.config.js` must use `loadEnv(mode, __dirname)` + `define` to inject into `process.env.*`. HBuilderX does NOT auto-load `.env` without `vite.config.js`.
- **Conditional compilation**: `import.meta.env.VITE_*` only works in H5; use `process.env.VITE_*` (via define) for all platforms.

## Environment

```bash
# server/.env
ZHIPU_API_KEY=xxx         # ZhiPu GLM adapter (default)
# DASHSCOPE_API_KEY=xxx   # Qwen/DashScope adapter (alternative)
# PORT=3000

# client/.env  (no BOM — use UTF-8 without BOM)
VITE_API_BASE_URL=http://<dev-machine-ip>:3000
VITE_API_TIMEOUT=10000
```

## Testing Conventions

- Each test file sets `process.env.DB_PATH` to in-memory/temp DB and clears require cache.
- Express `app` is exported (not started) — supertest handles the server lifecycle.

## PRD

Living design doc: `docs/superpowers/specs/2026-04-09-road-test-assistant-design.md`
