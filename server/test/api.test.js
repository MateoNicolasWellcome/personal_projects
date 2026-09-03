import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { HabitStore } from "../src/store.js";

function makeApp() {
  // File-less store => pure in-memory, isolated per test.
  return createApp({ store: new HabitStore() });
}

const sampleHabit = {
  name: "Drink water",
  goal: "Stay hydrated",
  timespan: "daily",
  timesPerDay: 3,
};

describe("Habit API", () => {
  let app;

  beforeEach(() => {
    app = makeApp();
  });

  it("reports health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("lists available timespans", async () => {
    const res = await request(app).get("/api/timespans");
    expect(res.status).toBe(200);
    expect(res.body.timespans.map((t) => t.id)).toEqual([
      "daily",
      "weekly",
      "monthly",
      "yearly",
    ]);
  });

  it("starts with no habits", async () => {
    const res = await request(app).get("/api/habits");
    expect(res.status).toBe(200);
    expect(res.body.habits).toEqual([]);
    expect(res.body.stats).toEqual({ total: 0, completedToday: 0, activeToday: 0 });
  });

  it("registers a habit with name, goal, timespan and times per day", async () => {
    const res = await request(app).post("/api/habits").send(sampleHabit);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Drink water",
      goal: "Stay hydrated",
      timespan: "daily",
      timesPerDay: 3,
      todayCount: 0,
      todayComplete: false,
      streak: 0,
    });
    expect(res.body.id).toBeTruthy();
  });

  it("rejects a missing name", async () => {
    const res = await request(app).post("/api/habits").send({ ...sampleHabit, name: " " });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/name is required/i);
  });

  it("rejects a missing goal", async () => {
    const res = await request(app).post("/api/habits").send({ ...sampleHabit, goal: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/goal is required/i);
  });

  it("rejects an invalid timespan", async () => {
    const res = await request(app).post("/api/habits").send({ ...sampleHabit, timespan: "hourly" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/timespan/i);
  });

  it("rejects a non-positive times per day", async () => {
    const res = await request(app).post("/api/habits").send({ ...sampleHabit, timesPerDay: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/times per day/i);
  });

  it("records check-ins, completes the day and builds a streak", async () => {
    const created = await request(app).post("/api/habits").send(sampleHabit);
    const id = created.body.id;

    let latest;
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app).post(`/api/habits/${id}/check-in`).send({});
      latest = res.body;
    }
    expect(latest.todayCount).toBe(3);
    expect(latest.todayComplete).toBe(true);
    expect(latest.streak).toBe(1);

    // Clamped at timesPerDay — a fourth check-in does not overshoot.
    const overshoot = await request(app).post(`/api/habits/${id}/check-in`).send({});
    expect(overshoot.body.todayCount).toBe(3);

    const list = await request(app).get("/api/habits");
    expect(list.body.stats).toEqual({ total: 1, completedToday: 1, activeToday: 0 });
  });

  it("allows undoing a check-in", async () => {
    const created = await request(app).post("/api/habits").send(sampleHabit);
    const id = created.body.id;

    await request(app).post(`/api/habits/${id}/check-in`).send({});
    const undone = await request(app).post(`/api/habits/${id}/check-in`).send({ delta: -1 });
    expect(undone.body.todayCount).toBe(0);
  });

  it("updates a habit", async () => {
    const created = await request(app).post("/api/habits").send(sampleHabit);
    const patched = await request(app)
      .patch(`/api/habits/${created.body.id}`)
      .send({ timesPerDay: 5, timespan: "weekly" });
    expect(patched.status).toBe(200);
    expect(patched.body.timesPerDay).toBe(5);
    expect(patched.body.timespan).toBe("weekly");
  });

  it("deletes a habit", async () => {
    const created = await request(app).post("/api/habits").send(sampleHabit);
    const del = await request(app).delete(`/api/habits/${created.body.id}`);
    expect(del.status).toBe(204);

    const list = await request(app).get("/api/habits");
    expect(list.body.habits).toEqual([]);
  });

  it("returns 404 for unknown habits", async () => {
    const res = await request(app).post("/api/habits/nope/check-in").send({});
    expect(res.status).toBe(404);
  });
});
