import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createManagerStation } from "@/api/adminApi";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createManagerStationSchema,
  type CreateManagerStationSchema,
} from "@/lib/schema/CreateManagerStationSchema";

type CreateManagerStationFormProps = {
  onSuccess?: () => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
};

const defaultValues: CreateManagerStationSchema = {
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
    total_charger: 1,
  },
};

export default function CreateManagerStationForm({
  onSuccess,
  onCancel,
  submitLabel = "Create Manager & Station",
}: CreateManagerStationFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateManagerStationSchema>({
    resolver: zodResolver(createManagerStationSchema),
    defaultValues,
  });

  const onSubmit = async (data: CreateManagerStationSchema) => {
    try {
      const res = await createManagerStation(data);
      console.log("Manager & Station created:", res);
      toast.success("Manager and station created successfully.");
      reset(defaultValues);
      await onSuccess?.();
    } catch (error: any) {
      const message =
        error.response?.data?.detail || "Creation failed. Please try again.";
      console.error("Creation failed:", error.response?.data || error.message);
      toast.error("Creation failed", { description: message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          Manager Details
        </h2>

        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Username
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. johndoe"
            {...register("manager.user_name")}
          />
          {errors.manager?.user_name && (
            <p className="text-xs text-red-600 mt-1">
              {errors.manager.user_name.message}
            </p>
          )}
        </Field>

        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Email
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="manager@example.com"
            {...register("manager.email")}
          />
          {errors.manager?.email && (
            <p className="text-xs text-red-600 mt-1">
              {errors.manager.email.message}
            </p>
          )}
        </Field>

        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Password
          </FieldLabel>
          <div className="relative">
            <Input
              className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400 pr-12"
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
            <p className="text-xs text-red-600 mt-1">
              {errors.manager.password.message}
            </p>
          )}
        </Field>

        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Phone Number
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. 9800000000"
            {...register("manager.phone_number")}
          />
          {errors.manager?.phone_number && (
            <p className="text-xs text-red-600 mt-1">
              {errors.manager.phone_number.message}
            </p>
          )}
        </Field>
      </div>

      <div className="space-y-4">
        <h2 className="border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          Station Details
        </h2>

        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Station Name
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. Downtown EV Hub"
            {...register("station.station_name")}
          />
          {errors.station?.station_name && (
            <p className="text-xs text-red-600 mt-1">
              {errors.station.station_name.message}
            </p>
          )}
        </Field>

        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Address
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. 123 Main St, Kathmandu"
            {...register("station.address")}
          />
          {errors.station?.address && (
            <p className="text-xs text-red-600 mt-1">
              {errors.station.address.message}
            </p>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field className="gap-2">
            <FieldLabel className="text-sm font-medium text-gray-700">
              Longitude
            </FieldLabel>
            <Input
              className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
              type="number"
              step="any"
              placeholder="e.g. 85.3240"
              {...register("station.longitude", { valueAsNumber: true })}
            />
            {errors.station?.longitude && (
              <p className="text-xs text-red-600 mt-1">
                {errors.station.longitude.message}
              </p>
            )}
          </Field>

          <Field className="gap-2">
            <FieldLabel className="text-sm font-medium text-gray-700">
              Latitude
            </FieldLabel>
            <Input
              className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
              type="number"
              step="any"
              placeholder="e.g. 27.7172"
              {...register("station.latitude", { valueAsNumber: true })}
            />
            {errors.station?.latitude && (
              <p className="text-xs text-red-600 mt-1">
                {errors.station.latitude.message}
              </p>
            )}
          </Field>
        </div>

        <input
          type="hidden"
          {...register("station.total_charger", { valueAsNumber: true })}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 px-5"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 bg-emerald-600 px-5 text-white hover:bg-emerald-700"
        >
          {isSubmitting ? "Creating..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
