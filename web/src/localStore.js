import {
  TIMESPANS,
  applyCheckIn,
  computeStats,
  decorate,
  uid,
  validateHabitInput,
} from "./habitEngine.js";

const STORAGE_KEY = "habit-tracker:habits";

function read() {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(habits) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(habits));
  } catch {
    // Ignore quota/availability errors — the UI still works in-memory.
  }
}

/**
 * A localStorage-backed store exposing the same async interface as the API
 * client, so the app runs fully client-side (e.g. on GitHub Pages).
 */
export const localStore = {
  isLocal: true,

  async listTimespans() {
    return {
      timespans: Object.entries(TIMESPANS).map(([id, meta]) => ({ id, ...meta })),
    };
  },

  async listHabits() {
    const habits = read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { habits: habits.map((h) => decorate(h)), stats: computeStats(habits) };
  },

  async createHabit(input) {
    const clean = validateHabitInput(input);
    const habits = read();
    const habit = {
      id: uid(),
      ...clean,
      logs: {},
      createdAt: new Date().toISOString(),
    };
    habits.push(habit);
    write(habits);
    return decorate(habit);
  },

  async updateHabit(id, changes) {
    const habits = read();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return null;
    const merged = validateHabitInput({ ...habit, ...changes });
    Object.assign(habit, merged);
    write(habits);
    return decorate(habit);
  },

  async checkIn(id, delta = 1) {
    const habits = read();
    const index = habits.findIndex((h) => h.id === id);
    if (index === -1) return null;
    habits[index] = applyCheckIn(habits[index], { delta });
    write(habits);
    return decorate(habits[index]);
  },

  async deleteHabit(id) {
    const habits = read().filter((h) => h.id !== id);
    write(habits);
    return null;
  },
};
