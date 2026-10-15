export type TaskMetric = {
  status: "TODO" | "IN_PROGRESS" | "DONE";
  dueDate: Date | null;
};

export function calculateTaskMetrics(
  tasks: TaskMetric[],
  now: Date = new Date(),
) {
  const today = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );

  const nextWeek = new Date(today);
  nextWeek.setUTCDate(nextWeek.getUTCDate() + 7);

  return {
    total: tasks.length,
    todo: tasks.filter(
      (task) => task.status === "TODO",
    ).length,
    inProgress: tasks.filter(
      (task) => task.status === "IN_PROGRESS",
    ).length,
    completed: tasks.filter(
      (task) => task.status === "DONE",
    ).length,
    overdue: tasks.filter(
      (task) =>
        task.status !== "DONE" &&
        task.dueDate !== null &&
        task.dueDate < today,
    ).length,
    upcoming: tasks.filter(
      (task) =>
        task.status !== "DONE" &&
        task.dueDate !== null &&
        task.dueDate >= today &&
        task.dueDate <= nextWeek,
    ).length,
  };
}
