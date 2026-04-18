// import { Field, FieldLabel } from "@/components/ui/field";
// import LoginImg from "../../../assets/LoginImg.jpg";
// import { Input } from "@/components/ui/input";
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { type LoginSchema, loginSchema } from "@/lib/schema/auth.schema";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Eye, EyeOff } from "lucide-react";
// import { GoogleIcon } from "@/assets/icon";
// import { Link, useNavigate } from "react-router-dom";
// import { loginUser } from "@/api/authApi";

// type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "USER";

// const roleRedirectMap: Record<UserRole, string> = {
//   ADMIN: "/admin/dashboard",
//   MANAGER: "/manager/dashboard",
//   STAFF: "/staff/dashboard",
//   USER: "/user/stations",
// };

// function normalizeUserRole(role: unknown): UserRole {
//   if (typeof role !== "string") return "USER";
//   const normalized = role.trim().toUpperCase();
//   if (normalized === "ADMIN") return "ADMIN";
//   if (normalized === "MANAGER") return "MANAGER";
//   if (normalized === "STAFF") return "STAFF";
//   return "USER";
// }

// export default function Login() {
//   const navigate = useNavigate();

//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,
//     formState: { errors, isSubmitting },
//   } = useForm<LoginSchema>({
//     resolver: zodResolver(loginSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   });

//   const onSubmit = async (data: LoginSchema) => {
//     try {
//       const res = await loginUser(data);
//       console.log("logged in succesfully:", res);

//       console.log("Form Data:", data);

//       // Store the token
//       localStorage.setItem("access_token", res.access_token);
//       // Optional: store user info
//       localStorage.setItem("user", JSON.stringify(res.user));

//       const role = normalizeUserRole(res.user?.role);
//       navigate(roleRedirectMap[role]);

//       alert("login successful!");
//     } catch (error: any) {
//       console.error("login failed:", error.response?.data || error.message);
//       alert("login failed");
//     }
//   };

//   return (
//     <main className="container mx-auto  mt-20">
//       <div className=" flex ">
//         <div>
//           <img src={LoginImg} alt="Login" className="h-150 w-165" />
//         </div>

//         <div className="px-8  flex-1 space-y-4 mt-10 ">
//           <div className="space-y-2">
//             <h2 className="text-lg font-bold text-gray-800 tracking-tight">
//               Click&Charge
//             </h2>
//             <h1 className="text-2xl font-bold text-gray-900">
//               Sign in to your account
//             </h1>
//             <p className="text-sm text-gray-500 mt-1">
//               Welcome back! Enter your details below.
//             </p>
//           </div>
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
//             <Field className="gap-2 ">
//               <FieldLabel className="text-base font-medium "> Email</FieldLabel>

//               <Input
//                 className="h-14  border border-[#B6B6B6]"
//                 {...register("email")}
//               />
//               {errors.email && (
//                 <p className="text-sm text-red-500">{errors.email.message}</p>
//               )}
//             </Field>

//             <Field className="gap-2">
//               <FieldLabel className="text-base text-title_brand font-medium">
//                 {" "}
//                 Password
//               </FieldLabel>

//               <div className="relative">
//                 <Input
//                   className="h-12 border-[#B6B6B6] pr-12"
//                   type={showPassword ? "text" : "password"}
//                   {...register("password")}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((prev) => !prev)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                 >
//                   {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
//                 </button>
//               </div>

//               {errors.password && (
//                 <p className="text-sm text-red-500">
//                   {errors.password.message}
//                 </p>
//               )}
//               <div className="text-right">
//                 <Link
//                   to="/forgot-password"
//                   className="text-sm font-medium text-secondary_brand hover:underline"
//                 >
//                   Forgot password?
//                 </Link>
//               </div>
//             </Field>

//             <Button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full h-14 bg-green-400"
//             >
//               Login
//             </Button>
//           </form>

//           <div className="flex items-center gap-4">
//             <hr className="flex-1 border-t border-[#B6B6B6]" />
//             <span className="text-sm text-body-text_brand">OR</span>
//             <hr className="flex-1 border-t border-[#B6B6B6]" />
//           </div>

//           <Button className="w-full h-16 bg-[#D7D7D7]">
//             <GoogleIcon />
//             Log in with google
//           </Button>

//           <div className="text-center text-[14px] ">
//             Dont have an account?{" "}
//             <Link to="/register">
//               <span className="text-secondary_brand cursor-pointer">
//                 Create a account
//               </span>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

import { Field, FieldLabel } from "@/components/ui/field";
import LoginImg from "../../../assets/LoginImg.jpg";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type LoginSchema, loginSchema } from "@/lib/schema/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Zap } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, loginWithGoogle } from "@/api/authApi";
import { toast } from "sonner";

type UserRole = "ADMIN" | "MANAGER" | "STAFF" | "USER";

const roleRedirectMap: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  MANAGER: "/manager/dashboard",
  STAFF: "/staff/dashboard",
  USER: "/user/stations",
};

function normalizeUserRole(role: unknown): UserRole {
  if (typeof role !== "string") return "USER";
  const normalized = role.trim().toUpperCase();
  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "MANAGER") return "MANAGER";
  if (normalized === "STAFF") return "STAFF";
  return "USER";
}

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleAuthSuccess = (res: {
    access_token: string;
    user?: { role?: unknown };
  }) => {
    setAuthError(null);
    localStorage.setItem("access_token", res.access_token);
    localStorage.setItem("user", JSON.stringify(res.user));
    const role = normalizeUserRole(res.user?.role);
    toast.success("Login successful", {
      description: "Redirecting to your dashboard.",
    });
    navigate(roleRedirectMap[role]);
  };

  const onSubmit = async (data: LoginSchema) => {
    try {
      setAuthError(null);
      const res = await loginUser(data);
      console.log("logged in successfully:", res);
      console.log("Form Data:", data);
      handleAuthSuccess(res);
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        "Invalid email or password. Please try again.";
      console.error("login failed:", error.response?.data || error.message);
      setAuthError(message);
      toast.error("Login failed", {
        description: message,
      });
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      const message = "Google login failed";
      setAuthError(message);
      toast.error(message);
      return;
    }

    try {
      setAuthError(null);
      const res = await loginWithGoogle(credentialResponse.credential);
      handleAuthSuccess(res);
    } catch (error: any) {
      const message = error.response?.data?.detail || "Google login failed";
      console.error(
        "google login failed:",
        error.response?.data || error.message,
      );
      setAuthError(message);
      toast.error("Google login failed", {
        description: message,
      });
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
        {/* Overlay with brand info */}
        <div className="absolute inset-0 bg-gray-900/40" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <Zap size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">
              Click&Charge
            </span>
          </div>
          {/* Bottom tagline */}
          <div>
            <p className="text-2xl font-bold leading-snug text-white">
              Power your journey,
              <br />
              charge with confidence.
            </p>
            <p className="mt-2 text-sm text-white/70">
              Access thousands of EV charging stations across the network.
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
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Sign in
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Welcome back! Enter your details to continue.
            </p>
          </div>

          {/* Form */}
          {authError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}
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

            <Field className="gap-1.5">
              <div className="flex items-center justify-between">
                <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Password
                </FieldLabel>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-2"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <hr className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">or continue with</span>
            <hr className="flex-1 border-t border-gray-200" />
          </div>

          {/* Google */}
          <div>
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={() => {
                const message = "Google login failed";
                setAuthError(message);
                toast.error(message);
              }}
              text="signin_with"
              shape="rectangular"
              logo_alignment="center"
              width="384"
              size="large"
            />
          </div>

          {/* Register link */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-2"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
