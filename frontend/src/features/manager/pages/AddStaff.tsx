import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  type CreateStaffSchema,
  createStaffSchema,
} from "@/lib/schema/CreateStaffSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { createStaff } from "@/api/managerApi";
import { toast } from "sonner";

export default function AddStaff() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffSchema>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      user_name: "",
      email: "",
      password: "",
      phone_number: "",
      vehicle: "",
    },
  });

  const onSubmit = async (data: CreateStaffSchema) => {
    try {
      const res = await createStaff(data);
      console.log("Staff created:", res);
      toast.success("Staff added successfully.");
    } catch (error: any) {
      const message =
        error.response?.data?.detail ||
        "Failed to create staff. Please try again.";
      console.error(
        "Failed to create staff:",
        error.response?.data || error.message,
      );
      toast.error("Failed to create staff", { description: message });
    }
  };

  return (
    <main className="container mx-auto mt-5 max-w-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create Staff</h1>
        <p className="text-sm text-gray-600 mt-2">
          Fill in the details below to register a new staff for your station.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Username
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. staffuser"
            {...register("user_name")}
          />
          {errors.user_name && (
            <p className="text-xs text-red-600 mt-1">
              {errors.user_name.message}
            </p>
          )}
        </Field>

        {/* Email */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Email
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="staff@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>
          )}
        </Field>

        {/* Password */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Password
          </FieldLabel>
          <div className="relative">
            <Input
              className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400 pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </Field>

        {/* Phone Number */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Phone Number
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. 9800000000"
            {...register("phone_number")}
          />
          {errors.phone_number && (
            <p className="text-xs text-red-600 mt-1">
              {errors.phone_number.message}
            </p>
          )}
        </Field>

        {/* Vehicle (optional) */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Vehicle (optional)
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. Hyundai Kona"
            {...register("vehicle")}
          />
          {errors.vehicle && (
            <p className="text-xs text-red-600 mt-1">
              {errors.vehicle.message}
            </p>
          )}
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Staff"}
        </Button>
      </form>
    </main>
  );
}
