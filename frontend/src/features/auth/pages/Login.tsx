import { Field, FieldLabel } from "@/components/ui/field";
import LoginImg from "../../../assets/LoginImg.jpg";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type LoginSchema, loginSchema } from "@/lib/schema/auth.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "@/assets/icon";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "@/api/authApi";

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchema) => {
    try {
      const res = await loginUser(data);
      console.log("logged in succesfully:", res);

      console.log("Form Data:", data);

      // Store the token
      localStorage.setItem("access_token", res.access_token);
      // Optional: store user info
      localStorage.setItem("user", JSON.stringify(res.user));

      const role = normalizeUserRole(res.user?.role);
      navigate(roleRedirectMap[role]);

      alert("login successful!");
    } catch (error: any) {
      console.error("login failed:", error.response?.data || error.message);
      alert("login failed");
    }
  };

  return (
    <main className="container mx-auto  mt-20">
      <div className=" flex ">
        <div>
          <img src={LoginImg} alt="Login" className="h-150 w-165" />
        </div>

        <div className="px-8  flex-1 space-y-4 mt-10 ">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">
              Click&Charge
            </h2>
            <h1 className="text-2xl font-bold text-gray-900">
              Sign in to your account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back! Enter your details below.
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 ">
            <Field className="gap-2 ">
              <FieldLabel className="text-base font-medium "> Email</FieldLabel>

              <Input
                className="h-14  border border-[#B6B6B6]"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </Field>

            <Field className="gap-2">
              <FieldLabel className="text-base text-title_brand font-medium">
                {" "}
                Password
              </FieldLabel>

              <div className="relative">
                <Input
                  className="h-12 border-[#B6B6B6] pr-12"
                  type={showPassword ? "text" : "password"}
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
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-secondary_brand hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-green-400"
            >
              Login
            </Button>
          </form>

          <div className="flex items-center gap-4">
            <hr className="flex-1 border-t border-[#B6B6B6]" />
            <span className="text-sm text-body-text_brand">OR</span>
            <hr className="flex-1 border-t border-[#B6B6B6]" />
          </div>

          <Button className="w-full h-16 bg-[#D7D7D7]">
            <GoogleIcon />
            Log in with google
          </Button>

          <div className="text-center text-[14px] ">
            Dont have an account?{" "}
            <Link to="/register">
              <span className="text-secondary_brand cursor-pointer">
                Create a account
              </span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
