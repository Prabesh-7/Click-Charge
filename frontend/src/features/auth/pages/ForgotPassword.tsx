import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import LoginImg from "../../../assets/LoginImg.jpg";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/api/authApi";
import {
  forgotPasswordSchema,
  type ForgotPasswordSchema,
} from "@/lib/schema/auth.schema";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordSchema) => {
    try {
      setError(null);
      const response = await forgotPassword(data);
      setMessage(response.message);
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`, {
        state: { notice: response.message },
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to send reset email.");
    }
  };

  return (
    <main className="container mx-auto mt-20">
      <div className="flex">
        <div>
          <img src={LoginImg} alt="Forgot password" className="h-150 w-165" />
        </div>

        <div className="mt-10 flex-1 space-y-4 px-8">
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-800">
              Click&Charge
            </h2>
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot your password?
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter your registered email and we&apos;ll send an OTP code.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">Email</FieldLabel>
              <Input
                className="h-14 border border-[#B6B6B6]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full bg-green-400"
            >
              Send OTP
            </Button>
          </form>

          <div className="text-center text-[14px]">
            <Link to="/" className="cursor-pointer text-secondary_brand">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
