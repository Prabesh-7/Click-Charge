// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Link, useNavigate } from "react-router-dom";

// import LoginImg from "../../../assets/LoginImg.jpg";
// import { Field, FieldLabel } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { forgotPassword } from "@/api/authApi";
// import {
//   forgotPasswordSchema,
//   type ForgotPasswordSchema,
// } from "@/lib/schema/auth.schema";

// export default function ForgotPassword() {
//   const navigate = useNavigate();
//   const [message, setMessage] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<ForgotPasswordSchema>({
//     resolver: zodResolver(forgotPasswordSchema),
//     defaultValues: { email: "" },
//   });

//   const onSubmit = async (data: ForgotPasswordSchema) => {
//     try {
//       setError(null);
//       const response = await forgotPassword(data);
//       setMessage(response.message);
//       navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`, {
//         state: { notice: response.message },
//       });
//     } catch (err: any) {
//       setError(err.response?.data?.detail || "Failed to send reset email.");
//     }
//   };

//   return (
//     <main className="container mx-auto mt-20">
//       <div className="flex">
//         <div>
//           <img src={LoginImg} alt="Forgot password" className="h-150 w-165" />
//         </div>

//         <div className="mt-10 flex-1 space-y-4 px-8">
//           <div className="space-y-2">
//             <h2 className="text-lg font-bold tracking-tight text-gray-800">
//               Click&Charge
//             </h2>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Forgot your password?
//             </h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Enter your registered email and we&apos;ll send an OTP code.
//             </p>
//           </div>

//           {error && <p className="text-sm text-red-500">{error}</p>}
//           {message && <p className="text-sm text-green-600">{message}</p>}

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">Email</FieldLabel>
//               <Input
//                 className="h-14 border border-[#B6B6B6]"
//                 {...register("email")}
//               />
//               {errors.email && (
//                 <p className="text-sm text-red-500">{errors.email.message}</p>
//               )}
//             </Field>

//             <Button
//               type="submit"
//               disabled={isSubmitting}
//               className="h-14 w-full bg-green-400"
//             >
//               Send OTP
//             </Button>
//           </form>

//           <div className="text-center text-[14px]">
//             <Link to="/" className="cursor-pointer text-secondary_brand">
//               Back to login
//             </Link>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

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
import { ArrowLeft, Mail, Zap } from "lucide-react";
import { toast } from "sonner";

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
      toast.success(response.message);
      navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`, {
        state: { notice: response.message },
      });
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to send reset email.";
      setError(message);
      toast.error(message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex">
      {/* Left — image panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
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
              No worries,
              <br />
              we've got you covered.
            </p>
            <p className="mt-2 text-sm text-white/70">
              We'll send a one-time code to your registered email address.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">
              Click&Charge
            </span>
          </div>

          {/* Icon */}
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
            <Mail size={20} className="text-emerald-600" />
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Forgot password?
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Enter your registered email and we'll send you an OTP code to
              reset your password.
            </p>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
              <span className="shrink-0">⚠</span>
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
              <span className="shrink-0">✓</span>
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Email address
              </FieldLabel>
              <Input
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending OTP…" : "Send OTP"}
            </Button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-emerald-600"
            >
              <ArrowLeft size={13} />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
