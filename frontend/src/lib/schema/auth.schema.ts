import { z } from "zod";


export const registerSchema = z.object({
  user_name: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username cannot exceed 100 characters"),

  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  phone_number: z
    .string()
  .min(8, "Phone number is required"),

  vehicle: z
    .string()
   .min(3, "vehicle name  is required"),
});


export type RegisterSchema = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export type LoginSchema = z.infer<typeof loginSchema>;