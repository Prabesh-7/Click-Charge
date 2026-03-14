import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  type CreateChargerSchema,
  createChargerSchema,
  chargerTypes,
} from "@/lib/schema/CreateChargerSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addCharger } from "@/api/managerApi";

export default function AddCharger() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateChargerSchema>({
    resolver: zodResolver(createChargerSchema),
    defaultValues: {
      name: "",
      type: "CCS2",
    },
  });

  const onSubmit = async (data: CreateChargerSchema) => {
    try {
      const res = await addCharger(data);
      console.log("Charger created:", res);
      alert("Charger added successfully!");
    } catch (error: any) {
      console.error("Failed to add charger:", error.response?.data || error.message);
      alert("Failed to add charger. Please try again.");
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
          <FieldLabel className="text-base font-medium">Charger Name</FieldLabel>
          <Input
            className="h-10 border border-[#B6B6B6]"
            placeholder="e.g. Charger A1"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name.message}</p>
          )}
        </Field>

        {/* Charger Type */}
        <Field className="gap-2">
          <FieldLabel className="text-base font-medium">Charger Type</FieldLabel>
          <select
            className="h-10 border border-[#B6B6B6] rounded px-2 text-sm w-full"
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
            <p className="text-sm text-red-500">{errors.type.message}</p>
          )}
        </Field>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 bg-green-400"
        >
          {isSubmitting ? "Adding..." : "Add Charger"}
        </Button>
      </form>
    </main>
  );
}
