import { Field, FieldLabel } from "@/components/ui/field";
import LoginImg from "../../../assets/LoginImg.jpg";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type RegisterSchema, registerSchema } from "@/lib/schema/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/api/authApi";


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

//   async function onSubmit(data: RegisterSchema) {
//     console.log("Form Data:", data);
//     // await registerUser(data); ← replace with your useAuth call
//   }

// const onSubmit = async (data:RegisterSchema) => {
//   try {
//     const res = await registerUser(data);

//     console.log("User registered:", res);

//     alert("Registration successful!");

//   } catch (error) {
//     console.error("fai;ed");
//     alert("Registration failed");
//   }
// };


const onSubmit = async (data: RegisterSchema) => {
  try {
    const res = await registerUser(data);
    console.log("User registered:", res);
    alert("Registration successful!");
  } catch (error: any) {
    console.error("Registration failed:", error.response?.data || error.message);
    alert("Registration failed");
  }
};



  return (
    <main className="container mx-auto mt-20">
      <div className="flex">

        {/* ── Left: Image ── */}
        <div>
          <img
            src={LoginImg}
            alt="Register"
            className="h-150 w-165"
          />
        </div>

        {/* ── Right: Form panel ── */}
        <div className="px-8 flex-1 space-y-2">

          {/* ── Branding header ── */}
          <div>

            <h1 className="text-2xl font-bold text-gray-900">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Join us! Fill in your details below to get started.
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Username */}
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                Username
              </FieldLabel>
              <Input
                className="h-10 border border-[#B6B6B6]"
                placeholder="e.g. johndoe"
                {...register("user_name")}
              />
              {errors.user_name && (
                <p className="text-sm text-red-500">{errors.user_name.message}</p>
              )}
            </Field>

            {/* Email */}
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                Email
              </FieldLabel>
              <Input
                className="h-10 border border-[#B6B6B6]"
                placeholder="you@example.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </Field>

            {/* Password */}
            <Field className="gap-2">
              <FieldLabel className="text-base text-title_brand font-medium">
                Password
              </FieldLabel>
              <div className="relative">
                <Input
                  className="h-10 border-[#B6B6B6] pr-12"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </Field>

            {/* Phone Number */}
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                Phone Number{" "}
              </FieldLabel>
              <Input
                className="h-10 border border-[#B6B6B6]"
                placeholder="e.g. 9800000000"
                {...register("phone_number")}
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number.message}</p>
              )}
            </Field>

            {/* Vehicle */}
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">
                Vehicle{" "}
              </FieldLabel>
              <Input
                className="h-10 border border-[#B6B6B6]"
                placeholder="e.g. Tesla Model 3"
                {...register("vehicle")}
              />
              {errors.vehicle && (
                <p className="text-sm text-red-500">{errors.vehicle.message}</p>
              )}
            </Field>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-green-400"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>

          </form>



          {/* ── Login link ── */}
          <div className="text-center text-[14px]">
            Already have an account?{" "}
            <span className="text-secondary_brand cursor-pointer">
              Sign in
            </span>
          </div>

        </div>
      </div>
    </main>
  );
}