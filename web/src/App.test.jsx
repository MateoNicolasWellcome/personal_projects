import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

/**
 * The frontend talks to the API via fetch. We stub a tiny in-memory
 * backend so the component can be exercised end-to-end without a server.
 */
function installFakeApi() {
  const tasks = [];
  globalThis.fetch = vi.fn(async (url, options = {}) => {
    const method = options.method || "GET";
    const json = (status, body) => ({
      ok: status < 400,
      status,
      json: async () => body,
    });

    if (url === "/api/tasks" && method === "GET") {
      const completed = tasks.filter((t) => t.completed).length;
      return json(200, {
        tasks: [...tasks].reverse(),
        stats: { total: tasks.length, completed, active: tasks.length - completed },
      });
    }
    if (url === "/api/tasks" && method === "POST") {
      const { title } = JSON.parse(options.body);
      const task = { id: String(tasks.length + 1), title, completed: false, createdAt: new Date().toISOString() };
      tasks.push(task);
      return json(201, task);
    }
    if (url.startsWith("/api/tasks/") && method === "PATCH") {
      const id = url.split("/").pop();
      const task = tasks.find((t) => t.id === id);
      Object.assign(task, JSON.parse(options.body));
      return json(200, task);
    }
    return json(404, { error: "not found" });
  });
}

beforeEach(() => installFakeApi());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App", () => {
  it("shows the empty state, then adds and completes a task", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText(/nothing here yet/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/new task title/i), "Buy milk");
    await user.click(screen.getByRole("button", { name: /add task/i }));

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();

    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);

    await waitFor(() => expect(screen.getByText("Buy milk")).toBeInTheDocument());
    expect(checkbox).toBeChecked();
  });
});
