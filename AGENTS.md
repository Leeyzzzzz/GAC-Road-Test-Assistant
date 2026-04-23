# Repository Guidelines

## Project Structure & Module Organization
This repository has two independent apps:

- `client/`: UniApp + Vue 3 frontend managed in HBuilderX. Main screens live in `client/pages/`, shared API/config code in `client/services/`, and app routing/config in `client/pages.json`, `client/manifest.json`, and `client/vite.config.js`.
- `server/`: Express backend. Entry point is `server/src/app.js`; database code is in `server/src/models/`; HTTP routes are in `server/src/routes/`; AI adapters are in `server/src/services/`.
- `server/tests/`: Jest + supertest API and data-layer tests.
- `scripts/`: local helper scripts such as `scripts/sync-client-api-env.ps1` for updating `client/.env` during device testing.
- `docs/`: product notes, setup docs, and implementation plans.

## Build, Test, and Development Commands
- `cd server && npm install`: install backend dependencies.
- `cd server && npm run dev`: start the backend with `nodemon` on port `3000`.
- `cd server && npm start`: run the backend without auto-reload.
- `cd server && npm test`: run all Jest tests.
- `cd server && npx jest tests/ai-service.test.js --forceExit`: run one test file.
- `.\scripts\sync-client-api-env.ps1`: refresh `client/.env` with the current LAN IP before mobile or mini-program debugging.

Frontend development is not CLI-driven here. Open `client/` in HBuilderX and use Run to Browser or Run to Device.

## Coding Style & Naming Conventions
Use 2-space indentation in both backend JS and frontend Vue files. Keep backend modules small and organized by responsibility: `models`, `routes`, `services`. Use `camelCase` for variables/functions, kebab-case for page directories such as `session-detail`, and descriptive route filenames like `records.js`.

Prefer existing patterns over new abstractions. For frontend env access, use `process.env.VITE_*`, not `import.meta.env`. Save `client/.env` as UTF-8 without BOM.

## Testing Guidelines
Tests live under `server/tests/` and follow the `*.test.js` pattern configured in `server/jest.config.js`. Add or update tests with every route, query, or adapter change. Keep tests isolated by setting a test `DB_PATH` and cleaning up temporary SQLite files, matching current test practice.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commits with optional prefixes, for example `docs: update README...` or `MVP complete: ...`. Follow that format and keep each commit focused.

PRs should include a brief summary, impacted areas (`client`, `server`, `scripts`, or `docs`), test evidence, and screenshots for UI changes. Link related issues or design docs when applicable.

## Agent-Specific Notes
When answering library or framework questions for this repo, use Context7 to fetch current documentation before responding.

## Personal Mandatory Rules
- When writing an implementation plan that includes concrete technical implementation details, always use Context7 to fetch the latest documentation and technical specifics first to reduce hallucinations.
- Minimize general web search because it can introduce serious context pollution. Only use web search when Context7 cannot provide relevant results.
- Prefer existing libraries, frameworks, and built-in platform capabilities over custom implementations. Check official docs, Context7, or web sources before reinventing functionality.
- For new UI work, reuse the same components and visual patterns already used in this project. Keep color usage and styling consistent with the current product, and avoid hand-written CSS when an existing component or established pattern can be used instead.
