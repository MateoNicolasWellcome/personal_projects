import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export const TIMESPANS = {
  daily: { label: "Daily", days: 1 },
  weekly: { label: "Weekly", days: 7 },
  monthly: { label: "Monthly", days: 30 },
  yearly: { label: "Yearly", days: 365 },
};

/** Local calendar date as YYYY-MM-DD. */
export function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDay(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return isoDay(date);
}

/**
 * A tiny JSON-file backed habit store. Dependency-free (no external database)
 * while still exercising real, durable persistence.
 */
export class HabitStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.habits = [];
    if (this.filePath && existsSync(this.filePath)) {
      try {
        this.habits = JSON.parse(readFileSync(this.filePath, "utf8"));
      } catch {
        this.habits = [];
      }
    }
  }

  #persist() {
    if (!this.filePath) return;
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.habits, null, 2));
  }

  #decorate(habit, today = isoDay()) {
    const logs = habit.logs || {};
    const timesPerDay = habit.timesPerDay;
    const todayCount = logs[today] || 0;
    const todayComplete = todayCount >= timesPerDay;

    // Current streak: consecutive completed days ending today (today counts
    // only once it's complete, so an unfinished today doesn't break a streak).
    let streak = 0;
    let cursor = todayComplete ? today : shiftDay(today, -1);
    while ((logs[cursor] || 0) >= timesPerDay) {
      streak += 1;
      cursor = shiftDay(cursor, -1);
    }

    const completedDays = Object.values(logs).filter((c) => c >= timesPerDay).length;

    return {
      ...habit,
      todayCount,
      todayComplete,
      streak,
      completedDays,
      timespanDays: TIMESPANS[habit.timespan]?.days ?? null,
    };
  }

  list() {
    const today = isoDay();
    return [...this.habits]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((h) => this.#decorate(h, today));
  }

  get(id) {
    const habit = this.habits.find((h) => h.id === id);
    return habit ? this.#decorate(habit) : null;
  }

  add({ name, goal, timespan, timesPerDay }) {
    const cleanName = String(name ?? "").trim();
    if (!cleanName) {
      throw new ValidationError("Habit name is required.");
    }
    const cleanGoal = String(goal ?? "").trim();
    if (!cleanGoal) {
      throw new ValidationError("Goal is required.");
    }
    if (!TIMESPANS[timespan]) {
      throw new ValidationError(
        `Timespan must be one of: ${Object.keys(TIMESPANS).join(", ")}.`,
      );
    }
    const times = Number(timesPerDay);
    if (!Number.isInteger(times) || times < 1) {
      throw new ValidationError("Times per day must be a whole number of at least 1.");
    }

    const habit = {
      id: randomUUID(),
      name: cleanName,
      goal: cleanGoal,
      timespan,
      timesPerDay: times,
      logs: {},
      createdAt: new Date().toISOString(),
    };
    this.habits.push(habit);
    this.#persist();
    return this.#decorate(habit);
  }

  update(id, changes) {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return null;

    if (changes.name !== undefined) {
      const cleanName = String(changes.name).trim();
      if (!cleanName) throw new ValidationError("Habit name is required.");
      habit.name = cleanName;
    }
    if (changes.goal !== undefined) {
      const cleanGoal = String(changes.goal).trim();
      if (!cleanGoal) throw new ValidationError("Goal is required.");
      habit.goal = cleanGoal;
    }
    if (changes.timespan !== undefined) {
      if (!TIMESPANS[changes.timespan]) {
        throw new ValidationError(
          `Timespan must be one of: ${Object.keys(TIMESPANS).join(", ")}.`,
        );
      }
      habit.timespan = changes.timespan;
    }
    if (changes.timesPerDay !== undefined) {
      const times = Number(changes.timesPerDay);
      if (!Number.isInteger(times) || times < 1) {
        throw new ValidationError("Times per day must be a whole number of at least 1.");
      }
      habit.timesPerDay = times;
    }

    this.#persist();
    return this.#decorate(habit);
  }

  /** Record progress for a day. delta defaults to +1; clamped to [0, timesPerDay]. */
  checkIn(id, { date, delta = 1 } = {}) {
    const habit = this.habits.find((h) => h.id === id);
    if (!habit) return null;
    const day = date || isoDay();
    habit.logs = habit.logs || {};
    const next = (habit.logs[day] || 0) + Number(delta);
    const clamped = Math.max(0, Math.min(habit.timesPerDay, next));
    if (clamped === 0) {
      delete habit.logs[day];
    } else {
      habit.logs[day] = clamped;
    }
    this.#persist();
    return this.#decorate(habit);
  }

  remove(id) {
    const index = this.habits.findIndex((h) => h.id === id);
    if (index === -1) return false;
    this.habits.splice(index, 1);
    this.#persist();
    return true;
  }

  stats() {
    const today = isoDay();
    const decorated = this.habits.map((h) => this.#decorate(h, today));
    const total = decorated.length;
    const completedToday = decorated.filter((h) => h.todayComplete).length;
    return { total, completedToday, activeToday: total - completedToday };
  }
}

export class ValidationError extends Error {}
