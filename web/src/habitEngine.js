// Framework-agnostic habit logic, shared by the localStorage store.
// Mirrors the server's behavior so the app works identically with or
// without a backend (e.g. when hosted statically on GitHub Pages).

export const TIMESPANS = {
  daily: { label: "Daily", days: 1 },
  weekly: { label: "Weekly", days: 7 },
  monthly: { label: "Monthly", days: 30 },
  yearly: { label: "Yearly", days: 365 },
};

export class ValidationError extends Error {}

/** Local calendar date as YYYY-MM-DD. */
export function isoDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDay(isoDate, deltaDays) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  return isoDay(date);
}

export function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Validate and normalize the fields required to register a habit. */
export function validateHabitInput({ name, goal, timespan, timesPerDay }) {
  const cleanName = String(name ?? "").trim();
  if (!cleanName) throw new ValidationError("Habit name is required.");

  const cleanGoal = String(goal ?? "").trim();
  if (!cleanGoal) throw new ValidationError("Goal is required.");

  if (!TIMESPANS[timespan]) {
    throw new ValidationError(
      `Timespan must be one of: ${Object.keys(TIMESPANS).join(", ")}.`,
    );
  }

  const times = Number(timesPerDay);
  if (!Number.isInteger(times) || times < 1) {
    throw new ValidationError("Times per day must be a whole number of at least 1.");
  }

  return { name: cleanName, goal: cleanGoal, timespan, timesPerDay: times };
}

/** Add computed progress fields (today's count, completion, streak). */
export function decorate(habit, today = isoDay()) {
  const logs = habit.logs || {};
  const timesPerDay = habit.timesPerDay;
  const todayCount = logs[today] || 0;
  const todayComplete = todayCount >= timesPerDay;

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

export function computeStats(habits, today = isoDay()) {
  const decorated = habits.map((h) => decorate(h, today));
  const total = decorated.length;
  const completedToday = decorated.filter((h) => h.todayComplete).length;
  return { total, completedToday, activeToday: total - completedToday };
}

/** Apply a check-in delta for a day, clamped to [0, timesPerDay]. */
export function applyCheckIn(habit, { date, delta = 1 } = {}) {
  const day = date || isoDay();
  const logs = { ...(habit.logs || {}) };
  const next = (logs[day] || 0) + Number(delta);
  const clamped = Math.max(0, Math.min(habit.timesPerDay, next));
  if (clamped === 0) {
    delete logs[day];
  } else {
    logs[day] = clamped;
  }
  return { ...habit, logs };
}
