---
name: project-learning-init
description: Initialize a project learning graph for a target repository. Use when the user wants to create or refresh `.project-learning/graph.json` for a project before using the learning dashboard. Do not use when the graph already exists and the user only wants to view it, or when the user only wants to write back a learning update.
---

# Project Learning Init

1. Confirm the target project root.
2. Check whether `<project-root>/.project-learning/profile.json` already exists.
3. If the profile exists, reuse it by default and tell the user that the saved profile is being reused.
4. If the profile does not exist, do not ask the user to fill raw enum fields directly unless they explicitly prefer that format.
5. Ask 3-5 short natural-language questions instead, one at a time when possible, covering:
   - how familiar they are with the product or business context
   - how comfortable they are reading frontend code
   - how comfortable they are reading backend code
   - how comfortable they are with database or data model work
   - whether this session is mainly for understanding the project or making safe changes
6. Infer the saved profile internally from the conversation and map it to the schema values:
   - `businessFamiliarity`: `low` | `medium` | `high`
   - `frontendLevel`: `low` | `medium` | `high`
   - `backendLevel`: `low` | `medium` | `high`
   - `databaseLevel`: `low` | `medium` | `high`
   - `goal`: `read-project` | `safe-change`
7. Before saving, give the user a short plain-language summary of the inferred profile and ask for confirmation only if the mapping is uncertain or materially affects the result.
8. Save the inferred profile to `<project-root>/.project-learning/profile.json`.
9. This skill is installed inside the target project, but the graph tooling lives in `D:\Projects\aiteach`.
10. Run `pnpm graph:init <project-root> <project-root>/.project-learning/profile.json` using `D:\Projects\aiteach` as the working directory.
11. Confirm that `<project-root>/.project-learning/graph.json` was generated.
12. Report the graph path and recommend using `project-learning-dashboard` next to open the visualization.
