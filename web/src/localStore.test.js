import { afterEach, describe, expect, it } from "vitest";
import { localStore } from "./localStore.js";

afterEach(() => {
  globalThis.localStorage?.clear();
});

const sample = { name: "Read", goal: "Finish 12 books", timespan: "weekly", timesPerDay: 1 };

describe("localStore (localStorage-backed)", () => {
  it("starts empty", async () => {
    const { habits, stats } = await localStore.listHabits();
    expect(habits).toEqual([]);
    expect(stats).toEqual({ total: 0, completedToday: 0, activeToday: 0 });
  });

  it("creates, persists and completes a habit", async () => {
    const created = await localStore.createHabit(sample);
    expect(created).toMatchObject({ name: "Read", timespan: "weekly", timesPerDay: 1 });

    // Persisted to localStorage — a "fresh" read still sees it.
    const reloaded = await localStore.listHabits();
    expect(reloaded.habits).toHaveLength(1);

    const checked = await localStore.checkIn(created.id, 1);
    expect(checked.todayComplete).toBe(true);
    expect(checked.streak).toBe(1);

    const stats = (await localStore.listHabits()).stats;
    expect(stats).toEqual({ total: 1, completedToday: 1, activeToday: 0 });
  });

  it("rejects invalid input", async () => {
    await expect(localStore.createHabit({ ...sample, name: "" })).rejects.toThrow(/name/i);
  });

  it("deletes a habit", async () => {
    const created = await localStore.createHabit(sample);
    await localStore.deleteHabit(created.id);
    expect((await localStore.listHabits()).habits).toEqual([]);
  });

  it("exposes the available timespans", async () => {
    const { timespans } = await localStore.listTimespans();
    expect(timespans.map((t) => t.id)).toEqual(["daily", "weekly", "monthly", "yearly"]);
  });
});
