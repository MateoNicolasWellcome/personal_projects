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
  listHabits: () => request("/habits"),
  listTimespans: () => request("/timespans"),
  createHabit: (habit) => request("/habits", { method: "POST", body: JSON.stringify(habit) }),
  updateHabit: (id, changes) =>
    request(`/habits/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  checkIn: (id, delta = 1) =>
    request(`/habits/${id}/check-in`, { method: "POST", body: JSON.stringify({ delta }) }),
  deleteHabit: (id) => request(`/habits/${id}`, { method: "DELETE" }),
};
