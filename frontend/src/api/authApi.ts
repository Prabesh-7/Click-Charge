import api from "./axiosInstance";
import {
  type RegisterSchema,
  type LoginSchema,
  type ForgotPasswordSchema,
  type VerifyOtpSchema,
  type ResetPasswordRequestPayload,
} from "@/lib/schema/auth.schema";

export const registerUser = async (data: RegisterSchema) => {
  const response = await api.post("/register", data);


  
  return response.data;
};


export const loginUser = async (data: LoginSchema) => {
  const response = await api.post("/login", data);
  return response.data;
};


export const forgotPassword = async (data: ForgotPasswordSchema) => {
  const response = await api.post("/forgot-password", data);
  return response.data as { message: string };
};


export const verifyResetOtp = async (data: VerifyOtpSchema) => {
  const response = await api.post("/verify-reset-otp", data);
  return response.data as { message: string; reset_token: string };
};


export const resetPassword = async (data: ResetPasswordRequestPayload) => {
  const response = await api.post("/reset-password", data);
  return response.data as { message: string };
};