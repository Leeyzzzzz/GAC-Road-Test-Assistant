# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

路测助手 (Road Test Assistant) — 智驾场地试验用例管理系统。自动驾驶/ADAS路测场景下，副驾记录员通过语音快速记录问题，AI自动提取结构化信息。

## Common Commands

```bash
# Backend (from server/)
cd server && npm install
npm run dev          # Start with nodemon (port 3000)
npm start            # Production start
npm test             # Run all tests
npx jest tests/ai-service.test.js --forceExit  # Run single test file

# Client env sync (before mobile debugging)
.\scripts\sync-client-api-env.ps1    # PowerShell
scripts\sync-client-api-env.cmd      # CMD

# Frontend (HBuilderX managed UniApp project, NOT Vue CLI)
# Open client/ in HBuilderX IDE, then Run > Run to Browser/Device
# H5 dev URL: http://localhost:8080
```

## Architecture

**Two independent apps** — `server/` and `client/` are separate, no monorepo workspace.

### Backend (server/)

```
src/app.js              → Express entry point, mounts routes, inits DB
src/models/database.js  → SQLite schema (better-sqlite3), single db instance
src/models/queries.js   → All CRUD functions (no ORM, raw SQL)
src/routes/             → Express routers: projects, sessions, records, upload, export, ai
src/services/
  ai-service.js         → Adapter selector singleton (picks by env var)
  base-adapter.js       → Abstract base class: speechToText(), extractFields()
  zhipu-adapter.js      → ZhiPu GLM (current default)
  qwen-adapter.js       → Qwen/DashScope (alternative)
  mock-adapter.js       → For testing
```

**Data model:** projects → test_sessions → records (3-tier, foreign keys enforced).

**AI adapter pattern:** Set `ZHIPU_API_KEY` or `DASHSCOPE_API_KEY` in `.env`. The singleton in `ai-service.js` auto-selects. Audio URLs starting with `/uploads/` are resolved to filesystem paths before reaching adapters.

**Key gotcha:** `form-data` npm package streams don't work with Node.js native `fetch`. Must use `form.getBuffer()` + explicit `Content-Length` header. See `_postMultipart()` in zhipu-adapter.js.

**Timestamps:** SQLite defaults use `datetime('now','localtime')` (NOT `CURRENT_TIMESTAMP` which returns UTC). All `UPDATE` statements also use `datetime('now','localtime')`.

### Frontend (client/)

HBuilderX-managed UniApp + Vue3 project. No `package.json` at root — managed by HBuilderX IDE. `client/package.json` exists only for Vite dependency (`vite.config.js`).

```
vite.config.js          → loadEnv(mode, __dirname) + define to inject VITE_* into process.env
pages.json              → Routes & tab bar config
manifest.json           → UniApp config (H5 dev server proxies /api → localhost:3000)
services/config.js      → Reads process.env.VITE_API_BASE_URL (statically replaced by Vite define)
services/api.js         → All HTTP calls, base URL from config.js
pages/
  index/                → Project list (home)
  project-detail/       → Project detail + create/edit form
  project-archive/      → Archived projects list (restore/delete)
  session-detail/       → Session detail + create form (dual-purpose via ?new=1)
  record/               → Core recording page (RecorderManager → upload → ASR → AI extract)
  export/               → Export Excel/CSV (conditional compilation for H5 vs App)
```

**Conditional compilation:** `// #ifdef H5` / `// #ifndef H5` for platform-specific code (browser download vs uni.downloadFile+uni.openDocument).

**TDesign UI:** `@tdesign/uniapp` ^0.8.1 (npm package). CSS import: `@tdesign/uniapp/common/style/theme/index.css`. Easycom in `pages.json`: `@tdesign/uniapp/$1/$1.vue`. Package uses `exports` field to map requests to `dist/` directory internally — do NOT include `dist/` in import paths.

**Env var loading:** HBuilderX does NOT auto-load `.env`. `vite.config.js` must call `loadEnv(mode, __dirname)` and inject values via `define`. Use `process.env.VITE_*` in code (not `import.meta.env.*` which only works on H5). Client `.env` must be saved as **UTF-8 without BOM** — Windows editors (Notepad) add BOM by default which silently breaks variable names.

**Real device debugging:** Copy `client/.env.example` to `client/.env`, set `VITE_API_BASE_URL` to dev machine's LAN IP, then run `scripts/sync-client-api-env.ps1` or `.cmd` to auto-detect and update the IP.

## Coding Conventions

- 2-space indentation in both JS and Vue files
- `camelCase` for variables/functions, `kebab-case` for page directories (e.g., `session-detail`)
- Backend modules organized by responsibility: `models`, `routes`, `services`
- Frontend: reuse existing UI components and patterns before writing custom CSS

## Testing

Server tests use Jest + supertest. Each test file sets its own `process.env.DB_PATH` to an in-memory/temp database and clears require cache between tests. The Express `app` is exported (not started) for supertest.

## Environment

```bash
# server/.env
ZHIPU_API_KEY=xxx       # Uses ZhiPu adapter
# DASHSCOPE_API_KEY=xxx  # Alternative: uses Qwen adapter
# PORT=3000              # Default port

# client/.env  (from .env.example, UTF-8 without BOM)
VITE_API_BASE_URL=http://192.168.x.x:3000
VITE_API_TIMEOUT=10000
```

## Research & Documentation

**CRITICAL — Context7 First Rule:** When implementing code, fixing bugs, or troubleshooting errors related to any library or framework (especially UniApp, TDesign, Vue3, Vite, Express), **ALWAYS use Context7 first** to fetch current official documentation before attempting fixes or falling back to general web search. UniApp's framework behavior is version-sensitive and platform-specific (H5 vs mp-weixin vs App), making official docs essential for correct solutions.

- Use `mcp__context7__resolve-library-id` to find the correct library ID, then `mcp__context7__query-docs` to query documentation
- For TDesign UniApp issues, the library ID is `/novlan1/tdesign-uniapp`
- Prefer existing libraries and platform capabilities over custom implementations

## PRD / Design Doc

The living PRD is at `docs/superpowers/specs/2026-04-09-road-test-assistant-design.md`. User maintains this file directly; Claude reads it when told to update per PRD.

## Business Flow Map

`docs/business-flow-map.md` — complete business flow documentation with all API endpoints, data flows, and known bugs. Updated by scanning actual code state.

## Known Issues

- ZhiPu ASR has 30-second audio limit; Qwen adapter recommended but not yet switched
- GPS collection happens before record creation, so GPS data is never actually saved (dead code in `collectLocation()`)
- QwenAdapter ASR likely broken with local files (passes filesystem path instead of base64/URL)
- `weather` and `gps_address` fields exist in schema but are never populated by any code
- CSV export has 4 fewer columns than Excel export
- `POST /api/ai/process-record` and `POST /api/upload/multiple` exist but are never called by frontend
- No pagination, authentication, or individual record deletion
- **TDesign font loading error (dev tools only):** `Failed to load font https://tdesign.gtimg.com/icon/x.x.x/fonts/t.woff ERR_CACHE_MISS` is a known WeChat DevTools simulator bug, NOT a real error. Fonts load correctly on real devices. Can be safely ignored during development. See [TDesign issue #3214](https://github.com/Tencent/tdesign-miniprogram/issues/3214).
