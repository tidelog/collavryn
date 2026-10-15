import { z } from "zod";

export const createOrganisationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organisation name must contain at least 2 characters")
    .max(100, "Organisation name cannot exceed 100 characters"),
}).strict();
