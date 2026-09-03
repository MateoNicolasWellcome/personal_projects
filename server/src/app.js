import cors from "cors";
import express from "express";
import { TaskStore, ValidationError } from "./store.js";

/**
 * Build the Express app. The store is injected so tests can use an
 * in-memory instance while production uses a file-backed one.
 */
export function createApp({ store } = {}) {
  const app = express();
  const taskStore = store ?? new TaskStore();

  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.get("/api/tasks", (_req, res) => {
    res.json({ tasks: taskStore.list(), stats: taskStore.stats() });
  });

  app.post("/api/tasks", (req, res) => {
    try {
      const task = taskStore.add(req.body?.title);
      res.status(201).json(task);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.patch("/api/tasks/:id", (req, res) => {
    try {
      const task = taskStore.update(req.params.id, req.body ?? {});
      if (!task) {
        res.status(404).json({ error: "Task not found." });
        return;
      }
      res.json(task);
    } catch (err) {
      handleError(err, res);
    }
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const removed = taskStore.remove(req.params.id);
    if (!removed) {
      res.status(404).json({ error: "Task not found." });
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
