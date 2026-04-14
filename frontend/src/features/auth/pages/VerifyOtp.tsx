import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useNavigate,
  useSearchParams,
  Link,
  useLocation,
} from "react-router-dom";

import LoginImg from "../../../assets/LoginImg.jpg";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { verifyResetOtp } from "@/api/authApi";
import {
  verifyOtpSchema,
  type VerifyOtpSchema,
} from "@/lib/schema/auth.schema";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailFromQuery = searchParams.get("email") || "";
  const notice = (location.state as { notice?: string } | null)?.notice || null;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpSchema>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      email: emailFromQuery,
      otp: "",
    },
  });

  const onSubmit = async (data: VerifyOtpSchema) => {
    try {
      setError(null);
      const response = await verifyResetOtp(data);
      navigate(
        `/reset-password?token=${encodeURIComponent(response.reset_token)}`,
      );
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid OTP code.");
    }
  };

  return (
    <main className="container mx-auto mt-20">
      <div className="flex">
        <div>
          <img src={LoginImg} alt="Verify OTP" className="h-150 w-165" />
        </div>

        <div className="mt-10 flex-1 space-y-4 px-8">
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-gray-800">
              Click&Charge
            </h2>
            <h1 className="text-2xl font-bold text-gray-900">Verify OTP</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter the 6-digit OTP sent to your registered email.
            </p>
          </div>

          {notice && <p className="text-sm text-green-600">{notice}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

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

            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                OTP code
              </FieldLabel>
              <Input
                className="h-14 border border-[#B6B6B6]"
                inputMode="numeric"
                maxLength={6}
                {...register("otp")}
              />
              {errors.otp && (
                <p className="text-sm text-red-500">{errors.otp.message}</p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full bg-green-400"
            >
              Verify OTP
            </Button>
          </form>

          <div className="text-center text-[14px]">
            <Link
              to="/forgot-password"
              className="cursor-pointer text-secondary_brand"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
