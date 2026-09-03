import { describe, expect, it } from "vitest";
import {
  ValidationError,
  applyCheckIn,
  computeStats,
  decorate,
  isoDay,
  shiftDay,
  validateHabitInput,
} from "./habitEngine.js";

const base = { name: "Drink water", goal: "Stay hydrated", timespan: "daily", timesPerDay: 3 };

describe("validateHabitInput", () => {
  it("normalizes valid input", () => {
    expect(validateHabitInput({ ...base, name: "  Drink water  " })).toEqual(base);
  });

  it("rejects a missing name", () => {
    expect(() => validateHabitInput({ ...base, name: " " })).toThrow(ValidationError);
  });

  it("rejects a missing goal", () => {
    expect(() => validateHabitInput({ ...base, goal: "" })).toThrow(/goal is required/i);
  });

  it("rejects an invalid timespan", () => {
    expect(() => validateHabitInput({ ...base, timespan: "hourly" })).toThrow(/timespan/i);
  });

  it("rejects a non-positive times per day", () => {
    expect(() => validateHabitInput({ ...base, timesPerDay: 0 })).toThrow(/times per day/i);
  });
});

describe("decorate + applyCheckIn", () => {
  it("computes today's progress and completion", () => {
    const today = isoDay();
    let habit = { ...base, logs: {} };
    habit = applyCheckIn(habit, { delta: 1 });
    habit = applyCheckIn(habit, { delta: 1 });
    const d1 = decorate(habit, today);
    expect(d1.todayCount).toBe(2);
    expect(d1.todayComplete).toBe(false);

    habit = applyCheckIn(habit, { delta: 1 });
    const d2 = decorate(habit, today);
    expect(d2.todayCount).toBe(3);
    expect(d2.todayComplete).toBe(true);
    expect(d2.streak).toBe(1);
  });

  it("clamps check-ins to the daily goal and floors at zero", () => {
    let habit = { ...base, timesPerDay: 1, logs: {} };
    habit = applyCheckIn(habit, { delta: 5 });
    expect(decorate(habit).todayCount).toBe(1);
    habit = applyCheckIn(habit, { delta: -5 });
    expect(decorate(habit).todayCount).toBe(0);
  });

  it("counts a multi-day streak ending today", () => {
    const today = isoDay();
    const logs = {
      [today]: 3,
      [shiftDay(today, -1)]: 3,
      [shiftDay(today, -2)]: 3,
      [shiftDay(today, -4)]: 3,
    };
    expect(decorate({ ...base, logs }, today).streak).toBe(3);
  });
});

describe("computeStats", () => {
  it("summarizes today's completion across habits", () => {
    const today = isoDay();
    const habits = [
      { ...base, timesPerDay: 1, logs: { [today]: 1 } },
      { ...base, timesPerDay: 2, logs: { [today]: 1 } },
    ];
    expect(computeStats(habits, today)).toEqual({ total: 2, completedToday: 1, activeToday: 1 });
  });
});
