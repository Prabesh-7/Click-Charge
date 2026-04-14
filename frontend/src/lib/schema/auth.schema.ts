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

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordSchema = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
});

export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirm_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;

export type ResetPasswordRequestPayload = {
  reset_token: string;
  new_password: string;
};