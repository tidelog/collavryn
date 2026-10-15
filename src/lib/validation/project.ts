import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(2000).optional(),
}).strict();

export const updateProjectSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required" },
);
