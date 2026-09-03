# personal_projects

A modern full-stack **Task Manager** demo, used to exercise and validate the
Cloud Agent development environment.

- **`server/`** — Express REST API (`/api/tasks`) with a dependency-free
  JSON-file task store. Runs on port `3001`.
- **`web/`** — Vite + React single-page app with a polished UI. Runs on port
  `5173` and proxies `/api` to the server.

## Getting started

```bash
npm install      # install all workspaces
npm run dev      # start API (3001) + web (5173) together
```

Then open http://localhost:5173.

## Common commands

| Command | Description |
| --- | --- |
| `npm run dev` | Run the API and web dev servers concurrently. |
| `npm run build` | Build the production web bundle. |
| `npm test` | Run server (Vitest + Supertest) and web (Vitest + Testing Library) tests. |
| `npm run lint` | Lint both workspaces with ESLint. |

## Cloud Agent environment

`.cursor/environment.json` runs `npm install` on setup and launches the
`server` and `web` dev servers as persistent terminals.
