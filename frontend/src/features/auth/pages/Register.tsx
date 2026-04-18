// import { Field, FieldLabel } from "@/components/ui/field";
// import LoginImg from "../../../assets/LoginImg.jpg";
// import { Input } from "@/components/ui/input";
// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { type RegisterSchema, registerSchema } from "@/lib/schema/auth.schema";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Eye, EyeOff } from "lucide-react";
// import { registerUser } from "@/api/authApi";
// import { Link } from "react-router-dom";

// export default function Register() {
//   const [showPassword, setShowPassword] = useState(false);

//   const {
//     register,
//     handleSubmit,

//     formState: { errors, isSubmitting },
//   } = useForm<RegisterSchema>({
//     resolver: zodResolver(registerSchema),
//     defaultValues: {
//       user_name: "",
//       email: "",
//       password: "",
//       phone_number: "",
//       vehicle: "",
//     },
//   });

// const onSubmit = async (data: RegisterSchema) => {
//   try {
//     const res = await registerUser(data);
//     console.log("User registered:", res);
//     alert("Registration successful!");
//   } catch (error: any) {
//     console.error("Registration failed:", error.response?.data || error.message);
//     alert("Registration failed");
//   }
// };

//   return (
//     <main className="container mx-auto mt-20">
//       <div className="flex">

//         {/* ── Left: Image ── */}
//         <div>
//           <img
//             src={LoginImg}
//             alt="Register"
//             className="h-150 w-165"
//           />
//         </div>

//         {/* ── Right: Form panel ── */}
//         <div className="px-8 flex-1 space-y-2">

//           {/* ── Branding header ── */}
//           <div>

//             <h1 className="text-2xl font-bold text-gray-900">
//               Create your account
//             </h1>
//             <p className="text-sm text-gray-500 mt-1">
//               Join us! Fill in your details below to get started.
//             </p>
//           </div>

//           {/* ── Form ── */}
//           <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

//             {/* Username */}
//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">
//                 Username
//               </FieldLabel>
//               <Input
//                 className="h-10 border border-[#B6B6B6]"
//                 placeholder="e.g. johndoe"
//                 {...register("user_name")}
//               />
//               {errors.user_name && (
//                 <p className="text-sm text-red-500">{errors.user_name.message}</p>
//               )}
//             </Field>

//             {/* Email */}
//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">
//                 Email
//               </FieldLabel>
//               <Input
//                 className="h-10 border border-[#B6B6B6]"
//                 placeholder="you@example.com"
//                 {...register("email")}
//               />
//               {errors.email && (
//                 <p className="text-sm text-red-500">{errors.email.message}</p>
//               )}
//             </Field>

//             {/* Password */}
//             <Field className="gap-2">
//               <FieldLabel className="text-base text-title_brand font-medium">
//                 Password
//               </FieldLabel>
//               <div className="relative">
//                 <Input
//                   className="h-10 border-[#B6B6B6] pr-12"
//                   type={showPassword ? "text" : "password"}
//                   placeholder="Min. 8 characters"
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
//                 <p className="text-sm text-red-500">{errors.password.message}</p>
//               )}
//             </Field>

//             {/* Phone Number */}
//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">
//                 Phone Number{" "}
//               </FieldLabel>
//               <Input
//                 className="h-10 border border-[#B6B6B6]"
//                 placeholder="e.g. 9800000000"
//                 {...register("phone_number")}
//               />
//               {errors.phone_number && (
//                 <p className="text-sm text-red-500">{errors.phone_number.message}</p>
//               )}
//             </Field>

//             {/* Vehicle */}
//             <Field className="gap-2">
//               <FieldLabel className="text-base font-medium">
//                 Vehicle{" "}
//               </FieldLabel>
//               <Input
//                 className="h-10 border border-[#B6B6B6]"
//                 placeholder="e.g. Tesla Model 3"
//                 {...register("vehicle")}
//               />
//               {errors.vehicle && (
//                 <p className="text-sm text-red-500">{errors.vehicle.message}</p>
//               )}
//             </Field>

//             {/* Submit */}
//             <Button
//               type="submit"
//               disabled={isSubmitting}
//               className="w-full h-14 bg-green-400"
//             >
//               {isSubmitting ? "Creating account..." : "Create Account"}
//             </Button>

//           </form>

//           {/* ── Login link ── */}
//           <div className="text-center text-[14px]">
//             Already have an account?{" "}

//             <Link to="/">
//               <span className="text-secondary_brand cursor-pointer">
//               Sign in
//             </span>
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
import { type RegisterSchema, registerSchema } from "@/lib/schema/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Zap } from "lucide-react";
import { registerUser } from "@/api/authApi";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      user_name: "",
      email: "",
      password: "",
      phone_number: "",
      vehicle: "",
    },
  });

  const onSubmit = async (data: RegisterSchema) => {
    try {
      const res = await registerUser(data);
      console.log("User registered:", res);
      toast.success("Registration successful", {
        description: "You can sign in with your new account.",
      });
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        "Registration failed. Please try again.";
      console.error(
        "Registration failed:",
        error.response?.data || error.message,
      );
      toast.error("Registration failed", {
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
              Join the network.
              <br />
              Drive further, charge smarter.
            </p>
            <p className="mt-2 text-sm text-white/70">
              Create your account and get access to thousands of EV charging
              stations.
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
              Create account
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Fill in your details below to get started.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username + Email side by side */}
            <div className="grid grid-cols-2 gap-3">
              <Field className="gap-1.5">
                <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Username
                </FieldLabel>
                <Input
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="johndoe"
                  {...register("user_name")}
                />
                {errors.user_name && (
                  <p className="text-xs text-red-500">
                    {errors.user_name.message}
                  </p>
                )}
              </Field>

              <Field className="gap-1.5">
                <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Phone
                </FieldLabel>
                <Input
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="9800000000"
                  {...register("phone_number")}
                />
                {errors.phone_number && (
                  <p className="text-xs text-red-500">
                    {errors.phone_number.message}
                  </p>
                )}
              </Field>
            </div>

            {/* Email */}
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

            {/* Password */}
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Password
              </FieldLabel>
              <div className="relative">
                <Input
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
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

            {/* Vehicle */}
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Vehicle
              </FieldLabel>
              <Input
                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g. Tesla Model 3"
                {...register("vehicle")}
              />
              {errors.vehicle && (
                <p className="text-xs text-red-500">{errors.vehicle.message}</p>
              )}
            </Field>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-1 h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{" "}
            <Link
              to="/"
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline underline-offset-2"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
