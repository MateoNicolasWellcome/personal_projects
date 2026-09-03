# personal_projects

A modern full-stack **Habit Tracker** web app. Register a habit with a name,
goal, timespan, and how many times per day you want to do it — then check in
each day to build progress and streaks.

- **`server/`** — Express REST API (`/api/habits`) with a dependency-free
  JSON-file store. Runs on port `3001`.
- **`web/`** — Vite + React single-page app with a polished UI. Runs on port
  `5173` and proxies `/api` to the server.

## Features

- Register a habit: **name**, **goal**, **timespan** (daily / weekly / monthly /
  yearly), and **times per day**.
- Daily check-ins with a progress bar (`2/3 today`) and undo.
- Automatic **streak** counting and a today summary (done / left).
- Durable persistence via a JSON file (no external database required).

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

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/habits` | List habits with today's progress and stats. |
| `POST` | `/api/habits` | Register a habit `{ name, goal, timespan, timesPerDay }`. |
| `PATCH` | `/api/habits/:id` | Update any habit field. |
| `POST` | `/api/habits/:id/check-in` | Record progress `{ delta }` (default `+1`). |
| `DELETE` | `/api/habits/:id` | Remove a habit. |
| `GET` | `/api/timespans` | List available timespans. |

## Cloud Agent environment

`.cursor/environment.json` runs `npm install` on setup and launches the
`server` and `web` dev servers as persistent terminals.
