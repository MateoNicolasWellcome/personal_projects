# personal_projects

A modern full-stack **Habit Tracker** web app. Register a habit with a name,
goal, timespan, and how many times per day you want to do it — then check in
each day to build progress and streaks.

- **`web/`** — Vite + React single-page app with a polished UI. Runs on port
  `5173`. Works **with or without a backend**: it uses the API when a server is
  reachable, and falls back to browser `localStorage` otherwise — so it can be
  hosted as a fully static site (e.g. GitHub Pages).
- **`server/`** — optional Express REST API (`/api/habits`) with a
  dependency-free JSON-file store, used for the full-stack dev experience. Runs
  on port `3001`.

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

## Deploy to GitHub Pages

The web app is deployed as a static site via GitHub Actions
([`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)).
When hosted statically there is no backend, so habit data is stored in the
browser's `localStorage`.

One-time setup in the GitHub repository:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.

After that, every push to `main` builds `web/` and publishes it. You can also
trigger it manually from the **Actions** tab (**Deploy to GitHub Pages →
Run workflow**). The site will be available at
`https://<owner>.github.io/<repo>/`.

The build uses a relative asset base (`base: "./"` in `web/vite.config.js`), so
it works from the project subpath without extra configuration.

## Cloud Agent environment

`.cursor/environment.json` runs `npm install` on setup and launches the
`server` and `web` dev servers as persistent terminals.
