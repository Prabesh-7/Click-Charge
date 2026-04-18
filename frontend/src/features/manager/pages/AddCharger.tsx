import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createChargerSchema,
  chargerTypes,
} from "@/lib/schema/CreateChargerSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addCharger } from "@/api/managerApi";
import { z } from "zod";
import { toast } from "sonner";

type CreateChargerFormValues = z.input<typeof createChargerSchema>;
type CreateChargerSubmitValues = z.output<typeof createChargerSchema>;

export default function AddCharger() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateChargerFormValues, unknown, CreateChargerSubmitValues>({
    resolver: zodResolver(createChargerSchema),
    defaultValues: {
      name: "",
      connector_count: 1,
      type: "CCS2",
      max_power_kw: 50,
      current_transaction_id: undefined,
    },
  });

  const onSubmit = async (data: CreateChargerSubmitValues) => {
    try {
      const res = await addCharger(data);
      console.log("Charger created:", res);
      toast.success("Charger added successfully.");
    } catch (error: any) {
      console.error(
        "Failed to add charger:",
        error.response?.data || error.message,
      );
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        toast.error("Failed to add charger", { description: detail });
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        toast.error("Failed to add charger", { description: detail[0].msg });
      } else {
        toast.error("Failed to add charger. Please try again.");
      }
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Add Charger</h1>
          <p className="mt-2 text-sm text-gray-600">
            Add a new charger to your station.
          </p>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Charger Name */}
            <Field className="gap-2">
              <FieldLabel className="text-sm font-medium text-gray-900">
                Charger Name
              </FieldLabel>
              <Input
                className="h-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="e.g. Charger A1"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </Field>

            {/* Connector Count */}
            <Field className="gap-2">
              <FieldLabel className="text-sm font-medium text-gray-900">
                Number of Connectors
              </FieldLabel>
              <Input
                type="number"
                className="h-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="e.g. 2"
                min={1}
                max={20}
                {...register("connector_count", {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                })}
              />
              {errors.connector_count && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.connector_count.message}
                </p>
              )}
            </Field>

            {/* Charger Type */}
            <Field className="gap-2">
              <FieldLabel className="text-sm font-medium text-gray-900">
                Charger Type
              </FieldLabel>
              <select
                className="h-10 border border-gray-300 rounded-md px-3 text-sm w-full focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors bg-white text-gray-900"
                {...register("type")}
              >
                <option value="">Select type</option>
                {chargerTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.type.message}
                </p>
              )}
            </Field>

            {/* Max Power (kW) */}
            <Field className="gap-2">
              <FieldLabel className="text-sm font-medium text-gray-900">
                Max Power (kW)
              </FieldLabel>
              <Input
                type="number"
                className="h-10 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-colors bg-white text-gray-900 placeholder:text-gray-500"
                placeholder="e.g. 50"
                min={1}
                {...register("max_power_kw", {
                  setValueAs: (value) =>
                    value === "" ? undefined : Number(value),
                })}
              />
              {errors.max_power_kw && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.max_power_kw.message}
                </p>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Charger"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
