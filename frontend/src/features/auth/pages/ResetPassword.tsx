// import { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useNavigate, useSearchParams, Link } from "react-router-dom";

// import LoginImg from "../../../assets/LoginImg.jpg";
// import { Field, FieldLabel } from "@/components/ui/field";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { resetPassword } from "@/api/authApi";
// import {
//   resetPasswordSchema,
//   type ResetPasswordSchema,
// } from "@/lib/schema/auth.schema";

// export default function ResetPasswordPage() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const resetToken = searchParams.get("token") || "";
//   const [message, setMessage] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<ResetPasswordSchema>({
//     resolver: zodResolver(resetPasswordSchema),
//     defaultValues: {
//       new_password: "",
//       confirm_password: "",
//     },
//   });

//   const onSubmit = async (data: ResetPasswordSchema) => {
//     try {
//       setError(null);
//       if (!resetToken) {
//         setError("Reset session is missing or expired.");
//         return;
//       }

//       const { confirm_password, ...requestPayload } = data;
//       const response = await resetPassword({
//         reset_token: resetToken,
//         new_password: requestPayload.new_password,
//       });
//       setMessage(response.message);
//       setTimeout(() => {
//         navigate("/");
//       }, 1200);
//     } catch (err: any) {
//       setError(err.response?.data?.detail || "Failed to reset password.");
//     }
//   };

//   return (
//     <main className="container mx-auto mt-20">
//       <div className="flex">
//         <div>
//           <img src={LoginImg} alt="Reset password" className="h-150 w-165" />
//         </div>

//         <div className="mt-10 flex-1 space-y-4 px-8">
//           <div className="space-y-2">
//             <h2 className="text-lg font-bold tracking-tight text-gray-800">
//               Click&Charge
//             </h2>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Set a new password
//             </h1>
//             <p className="mt-1 text-sm text-gray-500">
//               Choose a new password for your account.
//             </p>
//           </div>

//           {error && <p className="text-sm text-red-500">{error}</p>}
//           {message && <p className="text-sm text-green-600">{message}</p>}

//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">
//                 New password
//               </FieldLabel>
//               <Input
//                 className="h-14 border border-[#B6B6B6]"
//                 type="password"
//                 {...register("new_password")}
//               />
//               {errors.new_password && (
//                 <p className="text-sm text-red-500">
//                   {errors.new_password.message}
//                 </p>
//               )}
//             </Field>

//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">
//                 Confirm password
//               </FieldLabel>
//               <Input
//                 className="h-14 border border-[#B6B6B6]"
//                 type="password"
//                 {...register("confirm_password")}
//               />
//               {errors.confirm_password && (
//                 <p className="text-sm text-red-500">
//                   {errors.confirm_password.message}
//                 </p>
//               )}
//             </Field>

//             <Button
//               type="submit"
//               disabled={isSubmitting}
//               className="h-14 w-full bg-green-400"
//             >
//               Reset password
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
import { ArrowLeft, Eye, EyeOff, KeyRound, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token") || "";
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const onSubmit = async (data: ResetPasswordSchema) => {
    try {
      setError(null);
      if (!resetToken) {
        const message = "Reset session is missing or expired.";
        setError(message);
        toast.error(message);
        return;
      }
      const { confirm_password, ...requestPayload } = data;
      const response = await resetPassword({
        reset_token: resetToken,
        new_password: requestPayload.new_password,
      });
      setMessage(response.message);
      toast.success(response.message);
      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to reset password.";
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
              Almost there.
              <br />
              Set a strong new password.
            </p>
            <p className="mt-2 text-sm text-white/70">
              Your new password must be at least 8 characters long.
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

     

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Set new password
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Choose a strong password for your account.
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

          {/* Missing token warning */}
          {!resetToken && (
            <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <span className="shrink-0">⚠</span>
              Reset link is invalid or expired. Please request a new one.
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold   text-[#1A1A1A]">
                New password
              </FieldLabel>
              <div className="relative">
                <Input
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  type={showNew ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  {...register("new_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-xs text-red-500">
                  {errors.new_password.message}
                </p>
              )}
            </Field>

            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold   text-[#1A1A1A]">
                Confirm password
              </FieldLabel>
              <div className="relative">
                <Input
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  {...register("confirm_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-xs text-red-500">
                  {errors.confirm_password.message}
                </p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting || !resetToken}
              className="mt-1 h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting…" : "Reset Password"}
            </Button>
          </form>

       
        </div>
      </div>
    </main>
  );
}
