---
name: project-learning-dashboard
description: Start the local learning graph dashboard for a target repository and open the existing `.project-learning/graph.json` automatically. Use when the user wants to view or explore an already-generated learning graph. Do not use when the graph has not been initialized yet, or when the user is only updating learning writeback data.
---

# Project Learning Dashboard

1. Confirm the target project root.
2. Check that `<project-root>/.project-learning/graph.json` exists.
3. If the graph does not exist, stop and tell the user to run `project-learning-init` first.
4. This skill is installed inside the target project, but the dashboard implementation lives in `D:\Projects\aiteach`.
5. Start the dashboard with `pnpm dashboard:dev` using `D:\Projects\aiteach` as the working directory.
6. Read the local Vite URL from the command output.
7. Return the dashboard URL with the encoded `projectRoot` query parameter:
   - `http://127.0.0.1:<port>/?projectRoot=<encoded-project-root>`
8. Tell the user that the dashboard should load the graph automatically from that target project.
