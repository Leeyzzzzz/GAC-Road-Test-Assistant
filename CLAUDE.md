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

# Frontend (HBuilderX managed UniApp project, NOT Vue CLI)
# Open client/ in HBuilderX IDE, then Run > Run to Browser/Device
# No npm scripts — this is a HBuilderX project, not a Vite/CLI project
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

HBuilderX-managed UniApp + Vue3 project. No `package.json` at root — managed by HBuilderX IDE.

```
pages.json              → Routes & tab bar config
manifest.json           → UniApp config (H5 dev server proxies /api → localhost:3000)
services/api.js         → All HTTP calls, BASE_URL = 'http://192.168.1.10:3000'
pages/
  index/                → Session list (home)
  session-detail/       → Session detail + create form (dual-purpose via ?new=1)
  record/               → Core recording page (RecorderManager → upload → ASR → AI)
  export/               → Export Excel/CSV (uses conditional compilation for H5 vs App)
```

**Conditional compilation:** `// #ifdef H5` / `// #ifndef H5` for platform-specific code (browser download vs uni.downloadFile+uni.openDocument).

## Testing

Server tests use Jest + supertest. Each test file sets its own `process.env.DB_PATH` to an in-memory/temp database and clears require cache between tests. The Express `app` is exported (not started) for supertest.

## Environment

```bash
# server/.env
ZHIPU_API_KEY=xxx       # Uses ZhiPu adapter
# DASHSCOPE_API_KEY=xxx  # Alternative: uses Qwen adapter
# PORT=3000              # Default port
```

## PRD / Design Doc

The living PRD is at `docs/superpowers/specs/2026-04-09-road-test-assistant-design.md`. User maintains this file directly; Claude reads it when told to update per PRD.

## Known Issues

- ZhiPu ASR has 30-second audio limit; Qwen adapter recommended but not yet switched
- GPS collection happens before record creation, so GPS data gets discarded
- Client `BASE_URL` is hardcoded IP (192.168.1.10:3000) — needs to match dev machine
- No loading indicator during ASR transcription
