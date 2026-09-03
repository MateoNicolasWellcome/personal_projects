import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { TaskStore } from "../src/store.js";

function makeApp() {
  // File-less store => pure in-memory, isolated per test.
  return createApp({ store: new TaskStore() });
}

describe("Task API", () => {
  let app;

  beforeEach(() => {
    app = makeApp();
  });

  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("starts with no tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks).toEqual([]);
    expect(res.body.stats).toEqual({ total: 0, completed: 0, active: 0 });
  });

  it("creates a task", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "Write docs" });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: "Write docs", completed: false });
    expect(res.body.id).toBeTruthy();
  });

  it("rejects an empty title", async () => {
    const res = await request(app).post("/api/tasks").send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/must not be empty/i);
  });

  it("toggles completion and updates stats", async () => {
    const created = await request(app).post("/api/tasks").send({ title: "Ship it" });
    const id = created.body.id;

    const patched = await request(app).patch(`/api/tasks/${id}`).send({ completed: true });
    expect(patched.status).toBe(200);
    expect(patched.body.completed).toBe(true);

    const list = await request(app).get("/api/tasks");
    expect(list.body.stats).toEqual({ total: 1, completed: 1, active: 0 });
  });

  it("deletes a task", async () => {
    const created = await request(app).post("/api/tasks").send({ title: "Temporary" });
    const id = created.body.id;

    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get("/api/tasks");
    expect(list.body.tasks).toEqual([]);
  });

  it("returns 404 for unknown tasks", async () => {
    const res = await request(app).patch("/api/tasks/does-not-exist").send({ completed: true });
    expect(res.status).toBe(404);
  });
});
