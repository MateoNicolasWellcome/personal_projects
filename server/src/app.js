import cors from "cors";
import express from "express";
import { HabitStore, TIMESPANS, ValidationError } from "./store.js";

/**
 * Build the Express app. The store is injected so tests can use an
 * in-memory instance while production uses a file-backed one.
 */
export function createApp({ store } = {}) {
  const app = express();
  const habitStore = store ?? new HabitStore();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/timespans", (_req, res) => {
    res.json({
      timespans: Object.entries(TIMESPANS).map(([id, meta]) => ({ id, ...meta })),
    });
  });

  app.get("/api/habits", (_req, res) => {
    res.json({ habits: habitStore.list(), stats: habitStore.stats() });
  });

  app.post("/api/habits", (req, res) => {
    try {
      const habit = habitStore.add(req.body ?? {});
      res.status(201).json(habit);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/habits/:id", (req, res) => {
    try {
      const habit = habitStore.update(req.params.id, req.body ?? {});
      if (!habit) {
        res.status(404).json({ error: "Habit not found." });
        return;
      }
      res.json(habit);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.post("/api/habits/:id/check-in", (req, res) => {
    try {
      const habit = habitStore.checkIn(req.params.id, req.body ?? {});
      if (!habit) {
        res.status(404).json({ error: "Habit not found." });
        return;
      }
      res.json(habit);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/habits/:id", (req, res) => {
    const removed = habitStore.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Habit not found." });
      return;
    }
    res.status(204).end();
  });

  return app;
}

function handleError(err, res) {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error." });
}
