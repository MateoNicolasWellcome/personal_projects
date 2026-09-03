import { useEffect, useMemo, useState } from "react";
import { api } from "./api.js";

const FILTERS = {
  all: () => true,
  active: (t) => !t.completed,
  completed: (t) => t.completed,
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, active: 0 });
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const data = await api.listTasks();
    setTasks(data.tasks);
    setStats(data.stats);
  }

  useEffect(() => {
    refresh()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function addTask(event) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    setError("");
    try {
      await api.createTask(value);
      setTitle("");
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggle(task) {
    setError("");
    try {
      await api.updateTask(task.id, { completed: !task.completed });
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(task) {
    setError("");
    try {
      await api.deleteTask(task.id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const visible = useMemo(() => tasks.filter(FILTERS[filter]), [tasks, filter]);

  return (
    <div className="app">
      <header className="hero">
        <div className="badge" aria-hidden="true">✓</div>
        <h1>Task Manager</h1>
        <p>A tiny full-stack demo — Express API + React, wired for Cloud Agents.</p>
      </header>

      <main className="card">
        <form className="composer" onSubmit={addTask}>
          <input
            aria-label="New task title"
            placeholder="What needs doing?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit">Add task</button>
        </form>

        {error && <p className="error" role="alert">{error}</p>}

        <div className="toolbar">
          <div className="stats">
            <span><strong>{stats.active}</strong> active</span>
            <span><strong>{stats.completed}</strong> done</span>
            <span><strong>{stats.total}</strong> total</span>
          </div>
          <div className="filters" role="tablist">
            {Object.keys(FILTERS).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={filter === key}
                className={filter === key ? "chip active" : "chip"}
                onClick={() => setFilter(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="empty">Loading…</p>
        ) : visible.length === 0 ? (
          <p className="empty">Nothing here yet. Add your first task above.</p>
        ) : (
          <ul className="tasks">
            {visible.map((task) => (
              <li key={task.id} className={task.completed ? "task done" : "task"}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggle(task)}
                    aria-label={`Mark ${task.title} as ${task.completed ? "active" : "done"}`}
                  />
                  <span className="title">{task.title}</span>
                </label>
                <button className="delete" onClick={() => remove(task)} aria-label={`Delete ${task.title}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="foot">Data persists to the API's JSON store.</footer>
    </div>
  );
}
