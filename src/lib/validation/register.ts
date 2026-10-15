import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name must contain at most 100 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(254, "Email address is too long"),

  password: z
    .string()
    .min(12, "Password must contain at least 12 characters")
    .max(128, "Password must contain at most 128 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
