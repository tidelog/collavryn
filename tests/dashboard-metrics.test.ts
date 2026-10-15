import { describe, expect, it } from "vitest";

import {
  calculateTaskMetrics,
} from "../src/lib/dashboard-metrics";

const now = new Date("2026-10-15T12:00:00.000Z");

describe("workspace dashboard metrics", () => {
  it("handles an empty workspace", () => {
    expect(calculateTaskMetrics([], now)).toEqual({
      total: 0,
      todo: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
      upcoming: 0,
    });
  });

  it("counts task statuses", () => {
    const result = calculateTaskMetrics(
      [
        { status: "TODO", dueDate: null },
        { status: "IN_PROGRESS", dueDate: null },
        { status: "DONE", dueDate: null },
      ],
      now,
    );

    expect(result.total).toBe(3);
    expect(result.todo).toBe(1);
    expect(result.inProgress).toBe(1);
    expect(result.completed).toBe(1);
  });

  it("recognises overdue tasks", () => {
    const result = calculateTaskMetrics(
      [
        {
          status: "TODO",
          dueDate: new Date("2026-10-14T00:00:00.000Z"),
        },
      ],
      now,
    );

    expect(result.overdue).toBe(1);
  });

  it("excludes completed tasks from overdue counts", () => {
    const result = calculateTaskMetrics(
      [
        {
          status: "DONE",
          dueDate: new Date("2026-10-01T00:00:00.000Z"),
        },
      ],
      now,
    );

    expect(result.overdue).toBe(0);
  });

  it("counts tasks due within seven days", () => {
    const result = calculateTaskMetrics(
      [
        {
          status: "TODO",
          dueDate: new Date("2026-10-17T00:00:00.000Z"),
        },
        {
          status: "TODO",
          dueDate: new Date("2026-11-01T00:00:00.000Z"),
        },
      ],
      now,
    );

    expect(result.upcoming).toBe(1);
  });

  it("does not count today's tasks as overdue", () => {
    const result = calculateTaskMetrics(
      [
        {
          status: "TODO",
          dueDate: new Date("2026-10-15T00:00:00.000Z"),
        },
      ],
      now,
    );

    expect(result.overdue).toBe(0);
    expect(result.upcoming).toBe(1);
  });
});
