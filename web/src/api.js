const BASE = "/api";

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  listTasks: () => request("/tasks"),
  createTask: (title) => request("/tasks", { method: "POST", body: JSON.stringify({ title }) }),
  updateTask: (id, changes) =>
    request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
