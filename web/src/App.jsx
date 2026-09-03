import { useEffect, useState } from "react";
import { getStore } from "./storage.js";

const DEFAULT_FORM = {
  name: "",
  goal: "",
  timespan: "daily",
  timesPerDay: 1,
};

export default function App() {
  const [habits, setHabits] = useState([]);
  const [stats, setStats] = useState({ total: 0, completedToday: 0, activeToday: 0 });
  const [timespans, setTimespans] = useState([]);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const store = await getStore();
    const data = await store.listHabits();
    setHabits(data.habits);
    setStats(data.stats);
  }

  useEffect(() => {
    (async () => {
      const store = await getStore();
      const [data, ts] = await Promise.all([store.listHabits(), store.listTimespans()]);
      setHabits(data.habits);
      setStats(data.stats);
      setTimespans(ts.timespans);
    })()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const store = await getStore();
      await store.createHabit({
        name: form.name,
        goal: form.goal,
        timespan: form.timespan,
        timesPerDay: Number(form.timesPerDay),
      });
      setForm(DEFAULT_FORM);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function checkIn(habit, delta) {
    setError("");
    try {
      const store = await getStore();
      await store.checkIn(habit.id, delta);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(habit) {
    setError("");
    try {
      const store = await getStore();
      await store.deleteHabit(habit.id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div className="badge" aria-hidden="true">🔥</div>
        <h1>Habit Tracker</h1>
        <p>Register a habit, set your goal, and check in every day.</p>
      </header>

      <section className="card form-card">
        <h2>New habit</h2>
        <form className="habit-form" onSubmit={submit}>
          <label className="field span-2">
            <span>Name</span>
            <input
              aria-label="Habit name"
              placeholder="e.g. Drink water"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
            />
          </label>

          <label className="field span-2">
            <span>Goal</span>
            <input
              aria-label="Goal"
              placeholder="e.g. Stay hydrated and energized"
              value={form.goal}
              onChange={(e) => setField("goal", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Timespan</span>
            <select
              aria-label="Timespan"
              value={form.timespan}
              onChange={(e) => setField("timespan", e.target.value)}
            >
              {timespans.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Times per day</span>
            <input
              type="number"
              min="1"
              step="1"
              aria-label="Times per day"
              value={form.timesPerDay}
              onChange={(e) => setField("timesPerDay", e.target.value)}
            />
          </label>

          <div className="field span-2 submit-row">
            <button type="submit">Add habit</button>
          </div>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      <div className="stats-bar">
        <span><strong>{stats.total}</strong> habits</span>
        <span><strong>{stats.completedToday}</strong> done today</span>
        <span><strong>{stats.activeToday}</strong> left today</span>
      </div>

      {loading ? (
        <p className="empty">Loading…</p>
      ) : habits.length === 0 ? (
        <p className="empty">No habits yet. Register your first one above.</p>
      ) : (
        <ul className="habits">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} onCheckIn={checkIn} onRemove={remove} />
          ))}
        </ul>
      )}

      <footer className="foot">Progress persists to the API's JSON store.</footer>
    </div>
  );
}

function HabitCard({ habit, onCheckIn, onRemove }) {
  const percent = Math.min(100, Math.round((habit.todayCount / habit.timesPerDay) * 100));
  const timespanLabel = habit.timespan.charAt(0).toUpperCase() + habit.timespan.slice(1);

  return (
    <li className={habit.todayComplete ? "habit done" : "habit"}>
      <div className="habit-head">
        <div>
          <h3>{habit.name}</h3>
          <p className="goal">{habit.goal}</p>
        </div>
        <button
          className="delete"
          onClick={() => onRemove(habit)}
          aria-label={`Delete ${habit.name}`}
        >
          ✕
        </button>
      </div>

      <div className="meta">
        <span className="pill">{timespanLabel}</span>
        <span className="pill">{habit.timesPerDay}× / day</span>
        {habit.streak > 0 && <span className="pill streak">🔥 {habit.streak} day streak</span>}
      </div>

      <div className="progress">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <span className="progress-label">
          {habit.todayCount}/{habit.timesPerDay} today
        </span>
      </div>

      <div className="actions">
        <button
          className="ghost"
          onClick={() => onCheckIn(habit, -1)}
          disabled={habit.todayCount === 0}
          aria-label={`Undo a check-in for ${habit.name}`}
        >
          −
        </button>
        <button
          className="checkin"
          onClick={() => onCheckIn(habit, 1)}
          disabled={habit.todayComplete}
          aria-label={`Check in ${habit.name}`}
        >
          {habit.todayComplete ? "Completed ✓" : "Check in +1"}
        </button>
      </div>
    </li>
  );
}
