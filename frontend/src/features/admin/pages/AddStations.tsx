import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type CreateManagerStationSchema,
  createManagerStationSchema,
} from "@/lib/schema/CreateManagerStationSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { createManagerStation } from "@/api/adminApi";
import { Link } from "react-router-dom";

export default function CreateManagerStation() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateManagerStationSchema>({
    resolver: zodResolver(createManagerStationSchema),
    defaultValues: {
      manager: {
        user_name: "",
        email: "",
        password: "",
        phone_number: "",
      },
      station: {
        station_name: "",
        address: "",
        longitude: 0,
        latitude: 0,
        total_charger: 0,
      },
    },
  });

  const onSubmit = async (data: CreateManagerStationSchema) => {
    try {
      const res = await createManagerStation(data);
      console.log("Manager & Station created:", res);
      alert("Manager and Station created successfully!");
    } catch (error: any) {
      console.error("Creation failed:", error.response?.data || error.message);
      alert("Creation failed. Please try again.");
    }
  };

  return (
    <main className="container mx-auto mt-5 max-w-lg ">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Manager & Station
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to register a new manager and charging station.
        </p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* ── Manager Section ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2">
            Manager Details
          </h2>

          {/* Username */}
          <Field className="gap-2">
            <FieldLabel className="text-base font-medium">Username</FieldLabel>
            <Input
              className="h-10 border border-[#B6B6B6]"
              placeholder="e.g. johndoe"
              {...register("manager.user_name")}
            />
            {errors.manager?.user_name && (
              <p className="text-sm text-red-500">{errors.manager.user_name.message}</p>
            )}
          </Field>

          {/* Email */}
          <Field className="gap-2">
            <FieldLabel className="text-base font-medium">Email</FieldLabel>
            <Input
              className="h-10 border border-[#B6B6B6]"
              placeholder="manager@example.com"
              {...register("manager.email")}
            />
            {errors.manager?.email && (
              <p className="text-sm text-red-500">{errors.manager.email.message}</p>
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
                {...register("manager.password")}
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
            {errors.manager?.password && (
              <p className="text-sm text-red-500">{errors.manager.password.message}</p>
            )}
          </Field>

          {/* Phone Number */}
          <Field className="gap-2">
            <FieldLabel className="text-base font-medium">Phone Number</FieldLabel>
            <Input
              className="h-10 border border-[#B6B6B6]"
              placeholder="e.g. 9800000000"
              {...register("manager.phone_number")}
            />
            {errors.manager?.phone_number && (
              <p className="text-sm text-red-500">{errors.manager.phone_number.message}</p>
            )}
          </Field>
        </div>

        {/* ── Station Section ── */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2">
            Station Details
          </h2>

          {/* Station Name */}
          <Field className="gap-2">
            <FieldLabel className="text-base font-medium">Station Name</FieldLabel>
            <Input
              className="h-10 border border-[#B6B6B6]"
              placeholder="e.g. Downtown EV Hub"
              {...register("station.station_name")}
            />
            {errors.station?.station_name && (
              <p className="text-sm text-red-500">{errors.station.station_name.message}</p>
            )}
          </Field>

          {/* Address */}
          <Field className="gap-2">
            <FieldLabel className="text-base font-medium">Address</FieldLabel>
            <Input
              className="h-10 border border-[#B6B6B6]"
              placeholder="e.g. 123 Main St, Kathmandu"
              {...register("station.address")}
            />
            {errors.station?.address && (
              <p className="text-sm text-red-500">{errors.station.address.message}</p>
            )}
          </Field>

          {/* Longitude & Latitude */}
          <div className="grid grid-cols-2 gap-4">
            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">Longitude</FieldLabel>
              <Input
                className="h-10 border border-[#B6B6B6]"
                type="number"
                step="any"
                placeholder="e.g. 85.3240"
                {...register("station.longitude", { valueAsNumber: true })}
              />
              {errors.station?.longitude && (
                <p className="text-sm text-red-500">{errors.station.longitude.message}</p>
              )}
            </Field>

            <Field className="gap-2">
              <FieldLabel className="text-base font-medium">Latitude</FieldLabel>
              <Input
                className="h-10 border border-[#B6B6B6]"
                type="number"
                step="any"
                placeholder="e.g. 27.7172"
                {...register("station.latitude", { valueAsNumber: true })}
              />
              {errors.station?.latitude && (
                <p className="text-sm text-red-500">{errors.station.latitude.message}</p>
              )}
            </Field>
          </div>

          {/* Total Chargers */}
          <Field className="gap-2">
            <FieldLabel className="text-base font-medium">Total Chargers</FieldLabel>
            <Input
              className="h-10 border border-[#B6B6B6]"
              type="number"
              placeholder="e.g. 10"
              {...register("station.total_charger", { valueAsNumber: true })}
            />
            {errors.station?.total_charger && (
              <p className="text-sm text-red-500">{errors.station.total_charger.message}</p>
            )}
          </Field>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-green-400"
        >
          {isSubmitting ? "Creating..." : "Create Manager & Station"}
        </Button>

      </form>

   

    </main>
  );
}