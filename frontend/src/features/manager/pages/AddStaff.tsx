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
      alert("Staff created successfully!");
    } catch (error: any) {
      console.error("Failed to create staff:", error.response?.data || error.message);
      alert("Failed to create staff. Please try again.");
    }
  };

  return (
    <main className="container mx-auto mt-5 max-w-lg ">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Staff</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to register a new staff for your station.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username */}
        <Field className="gap-2">
          <FieldLabel className="text-base font-medium">Username</FieldLabel>
          <Input
            className="h-10 border border-[#B6B6B6]"
            placeholder="e.g. staffuser"
            {...register("user_name")}
          />
          {errors.user_name && (
            <p className="text-sm text-red-500">{errors.user_name.message}</p>
          )}
        </Field>

        {/* Email */}
        <Field className="gap-2">
          <FieldLabel className="text-base font-medium">Email</FieldLabel>
          <Input
            className="h-10 border border-[#B6B6B6]"
            placeholder="staff@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </Field>

        {/* Password */}
        <Field className="gap-2">
          <FieldLabel className="text-base font-medium">Password</FieldLabel>
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
          <FieldLabel className="text-base font-medium">Phone Number</FieldLabel>
          <Input
            className="h-10 border border-[#B6B6B6]"
            placeholder="e.g. 9800000000"
            {...register("phone_number")}
          />
          {errors.phone_number && (
            <p className="text-sm text-red-500">{errors.phone_number.message}</p>
          )}
        </Field>

        {/* Vehicle (optional) */}
        <Field className="gap-2">
          <FieldLabel className="text-base font-medium">Vehicle (optional)</FieldLabel>
          <Input
            className="h-10 border border-[#B6B6B6]"
            placeholder="e.g. Hyundai Kona"
            {...register("vehicle")}
          />
          {errors.vehicle && (
            <p className="text-sm text-red-500">{errors.vehicle.message}</p>
          )}
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-green-400"
        >
          {isSubmitting ? "Creating..." : "Create Staff"}
        </Button>
      </form>
    </main>
  );
}

