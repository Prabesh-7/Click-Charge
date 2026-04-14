import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Link } from "react-router-dom";

import LoginImg from "../../../assets/LoginImg.jpg";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/api/authApi";
import {
  resetPasswordSchema,
  type ResetPasswordSchema,
} from "@/lib/schema/auth.schema";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") || "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      setError(null);
      if (!resetToken) {
        setError("Reset session is missing or expired.");
        return;
      }

      const { confirm_password, ...requestPayload } = data;
      const response = await resetPassword({
        reset_token: resetToken,
        new_password: requestPayload.new_password,
      });
      setMessage(response.message);
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    }
  };

  return (
    <main className="container mx-auto mt-20">
      <div className="flex">
        <div>
          <img src={LoginImg} alt="Reset password" className="h-150 w-165" />
        </div>

        <div className="mt-10 flex-1 space-y-4 px-8">
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-800">
              Click&Charge
            </h2>
            <h1 className="text-2xl font-bold text-gray-900">
              Set a new password
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Choose a new password for your account.
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                New password
              </FieldLabel>
              <Input
                className="h-14 border border-[#B6B6B6]"
                type="password"
                {...register("new_password")}
              />
              {errors.new_password && (
                <p className="text-sm text-red-500">
                  {errors.new_password.message}
                </p>
              )}
            </Field>

            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                Confirm password
              </FieldLabel>
              <Input
                className="h-14 border border-[#B6B6B6]"
                type="password"
                {...register("confirm_password")}
              />
              {errors.confirm_password && (
                <p className="text-sm text-red-500">
                  {errors.confirm_password.message}
                </p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full bg-green-400"
            >
              Reset password
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
