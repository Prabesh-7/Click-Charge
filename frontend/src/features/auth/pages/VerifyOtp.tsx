import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useNavigate,
  useSearchParams,
  Link,
  useLocation,
} from "react-router-dom";

import LoginImg from "../../../assets/LoginImg.jpg";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { verifyResetOtp } from "@/api/authApi";
import {
  verifyOtpSchema,
  type VerifyOtpSchema,
} from "@/lib/schema/auth.schema";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { ArrowLeft, KeyRound, Zap } from "lucide-react";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailFromQuery = searchParams.get("email") || "";
  const notice = (location.state as { notice?: string } | null)?.notice || null;
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
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
    <main className="flex min-h-screen bg-gray-50">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img
          src={LoginImg}
          alt="EV Charging Station"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gray-900/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Click&Charge
            </span>
          </div>
          <div>
            <p className="text-2xl font-bold leading-snug text-white">
              One step away.
              <br />
              Verify your code and continue.
            </p>
            <p className="mt-2 text-sm text-white/70">
              Secure access starts with a quick one-time password check.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">
              Click&Charge
            </span>
          </div>

          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <KeyRound size={20} className="text-emerald-600" />
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Verify OTP
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Enter the 6-digit code sent to your registered email address.
            </p>
          </div>

          {notice && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              <span className="shrink-0">✓</span>
              {notice}
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <span className="shrink-0">⚠</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <input type="hidden" {...register("email")} />

            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                OTP code
              </FieldLabel>
              <div>
                <Controller
                  control={control}
                  name="otp"
                  render={({ field }) => (
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      containerClassName="justify-center"
                    >
                      <InputOTPGroup className="gap-2 justify-center">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="h-11 w-11 rounded-md border border-gray-300 bg-white text-base font-semibold text-gray-900 shadow-none transition-colors data-[active=true]:border-emerald-600 data-[active=true]:ring-1 data-[active=true]:ring-emerald-600/20"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  )}
                />
              </div>
              <div className="text-xs text-gray-400">
                Use the 6-digit code from your inbox.
              </div>
              {errors.otp && (
                <p className="text-xs text-red-500">{errors.otp.message}</p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Verifying OTP…" : "Verify OTP"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={13} />
              Back
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
