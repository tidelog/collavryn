import { z } from "zod";

const taskFields = {
  title: z.string().trim().min(2).max(150),
  description: z.string().trim().max(5000).nullable(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  assigneeId: z.uuid().nullable(),
  dueDate: z.iso.date().nullable(),
};

export const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.optional(),
  priority: taskFields.priority.optional(),
  assigneeId: taskFields.assigneeId.optional(),
  dueDate: taskFields.dueDate.optional(),
}).strict();

export const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  description: taskFields.description.optional(),
  status: taskFields.status.optional(),
  priority: taskFields.priority.optional(),
  assigneeId: taskFields.assigneeId.optional(),
  dueDate: taskFields.dueDate.optional(),
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  { message: "At least one field must be updated" },
);
