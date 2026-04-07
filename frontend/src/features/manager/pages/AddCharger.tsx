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
      alert("Charger added successfully!");
    } catch (error: any) {
      console.error(
        "Failed to add charger:",
        error.response?.data || error.message,
      );
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        alert(detail);
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        alert(detail[0].msg);
      } else {
        alert("Failed to add charger. Please try again.");
      }
    }
  };

  return (
    <main className="container mx-auto mt-5 max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Charger</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a new charger to one of your stations.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Charger Name */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Charger Name
          </FieldLabel>
          <Input
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. Charger A1"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
          )}
        </Field>

        {/* Connector Count */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Number of Connectors
          </FieldLabel>
          <Input
            type="number"
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. 2"
            min={1}
            max={20}
            {...register("connector_count", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
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
          <FieldLabel className="text-sm font-medium text-gray-700">
            Charger Type
          </FieldLabel>
          <select
            className="h-10 border border-gray-300 rounded-lg px-3 text-sm w-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900"
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
            <p className="text-xs text-red-600 mt-1">{errors.type.message}</p>
          )}
        </Field>

        {/* Max Power (kW) */}
        <Field className="gap-2">
          <FieldLabel className="text-sm font-medium text-gray-700">
            Max Power (kW)
          </FieldLabel>
          <Input
            type="number"
            className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
            placeholder="e.g. 50"
            min={1}
            {...register("max_power_kw", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
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
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add Charger"}
        </Button>
      </form>
    </main>
  );
}
