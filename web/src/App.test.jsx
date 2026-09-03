import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { __resetStore } from "./storage.js";

/**
 * The frontend talks to the API via fetch. We stub a tiny in-memory
 * backend so the component can be exercised end-to-end without a server.
 */
function installFakeApi() {
  const habits = [];

  function decorate(h) {
    const todayCount = h._today || 0;
    const todayComplete = todayCount >= h.timesPerDay;
    return { ...h, todayCount, todayComplete, streak: todayComplete ? 1 : 0 };
  }

  function stats() {
    const completedToday = habits.filter((h) => (h._today || 0) >= h.timesPerDay).length;
    return { total: habits.length, completedToday, activeToday: habits.length - completedToday };
  }

  globalThis.fetch = vi.fn(async (url, options = {}) => {
    const method = options.method || "GET";
    const json = (status, body) => ({ ok: status < 400, status, json: async () => body });

    if (url === "/api/health") {
      return json(200, { status: "ok" });
    }
    if (url === "/api/timespans") {
      return json(200, {
        timespans: [
          { id: "daily", label: "Daily", days: 1 },
          { id: "weekly", label: "Weekly", days: 7 },
        ],
      });
    }
    if (url === "/api/habits" && method === "GET") {
      return json(200, { habits: habits.map(decorate), stats: stats() });
    }
    if (url === "/api/habits" && method === "POST") {
      const body = JSON.parse(options.body);
      const habit = { id: String(habits.length + 1), logs: {}, _today: 0, ...body };
      habits.push(habit);
      return json(201, decorate(habit));
    }
    if (url.endsWith("/check-in") && method === "POST") {
      const id = url.split("/").at(-2);
      const habit = habits.find((h) => h.id === id);
      const { delta } = JSON.parse(options.body);
      habit._today = Math.max(0, Math.min(habit.timesPerDay, (habit._today || 0) + delta));
      return json(200, decorate(habit));
    }
    return json(404, { error: "not found" });
  });
}

beforeEach(() => {
  __resetStore();
  installFakeApi();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Habit Tracker App", () => {
  it("registers a habit and checks in to complete it", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText(/no habits yet/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/habit name/i), "Meditate");
    await user.type(screen.getByLabelText(/^goal$/i), "Calm mornings");
    await user.selectOptions(screen.getByLabelText(/timespan/i), "daily");
    const times = screen.getByLabelText(/times per day/i);
    await user.clear(times);
    await user.type(times, "2");
    await user.click(screen.getByRole("button", { name: /add habit/i }));

    expect(await screen.findByText("Meditate")).toBeInTheDocument();
    expect(screen.getByText("Calm mornings")).toBeInTheDocument();
    expect(screen.getByText("0/2 today")).toBeInTheDocument();

    const checkIn = screen.getByRole("button", { name: /check in meditate/i });
    await user.click(checkIn);
    expect(await screen.findByText("1/2 today")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /check in meditate/i }));
    await waitFor(() => expect(screen.getByText("2/2 today")).toBeInTheDocument());
    const completed = screen.getByRole("button", { name: /check in meditate/i });
    expect(completed).toBeDisabled();
    expect(completed).toHaveTextContent(/completed/i);
  });
});
