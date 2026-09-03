import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/**
 * A tiny JSON-file backed task store. This keeps the demo dependency-free
 * (no external database) while still exercising real, durable persistence.
 */
export class TaskStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.tasks = [];
    if (this.filePath && existsSync(this.filePath)) {
      try {
        this.tasks = JSON.parse(readFileSync(this.filePath, "utf8"));
      } catch {
        this.tasks = [];
      }
    }
  }

  #persist() {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.tasks, null, 2));
  }

  list() {
    return [...this.tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  add(title) {
    const trimmed = String(title ?? "").trim();
    if (!trimmed) {
      throw new ValidationError("Task title must not be empty.");
    }
    const task = {
      id: randomUUID(),
      title: trimmed,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    this.#persist();
    return task;
  }

  update(id, changes) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    if (typeof changes.title === "string") {
      const trimmed = changes.title.trim();
      if (!trimmed) {
        throw new ValidationError("Task title must not be empty.");
      }
      task.title = trimmed;
    }
    if (typeof changes.completed === "boolean") {
      task.completed = changes.completed;
    }
    this.#persist();
    return task;
  }

  remove(id) {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    this.#persist();
    return true;
  }

  stats() {
    const total = this.tasks.length;
    const completed = this.tasks.filter((t) => t.completed).length;
    return { total, completed, active: total - completed };
  }
}

export class ValidationError extends Error {}
