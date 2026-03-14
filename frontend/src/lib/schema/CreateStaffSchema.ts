import { z } from "zod";

export const createStaffSchema = z.object({
  user_name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username cannot exceed 100 characters"),

  email: z.string().email("Invalid email address"),

  password: z.string().min(8, "Password must be at least 8 characters"),

  phone_number: z.string().optional(),

  vehicle: z.string().optional(),
});

export type CreateStaffSchema = z.infer<typeof createStaffSchema>;

