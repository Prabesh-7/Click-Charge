import { useEffect, useState } from "react";
import { getMyChargers, updateCharger, deleteCharger } from "@/api/managerApi";
import { Button } from "@/components/ui/button";
import { Edit2, Plug, Trash2, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createChargerSchema,
  chargerTypes,
} from "@/lib/schema/CreateChargerSchema";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { z } from "zod";

type CreateChargerFormValues = z.input<typeof createChargerSchema>;
type CreateChargerSubmitValues = z.output<typeof createChargerSchema>;

interface Charger {
  charger_id: number;
  station_id: number;
  name: string;
  charge_point_id: string;
  connectors: {
    connector_id: number;
    connector_number: number;
    charge_point_id: string;
    status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
    current_transaction_id?: number | null;
    created_at: string;
    last_status_change: string;
  }[];
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO";
  max_power_kw: number;
  current_transaction_id?: number | null;
  created_at: string;
  last_status_change: string;
}

export default function MyChargers() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingCharger, setEditingCharger] = useState<Charger | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateChargerFormValues, unknown, CreateChargerSubmitValues>({
    resolver: zodResolver(createChargerSchema),
  });

  const fetchChargers = async () => {
    try {
      setLoading(true);
      const data = await getMyChargers();
      setChargers(data);
      setError(null);
    } catch (err: any) {
      console.error(
        "Failed to fetch chargers:",
        err.response?.data || err.message,
      );
      if (err.response?.status === 404) {
        setChargers([]);
        setError(null);
        return;
      }
      if (Array.isArray(err.response?.data?.detail)) {
        setError(
          err.response.data.detail[0]?.msg ||
            "Failed to load chargers. Please try again.",
        );
      } else {
        setError(
          err.response?.data?.detail ||
            "Failed to load chargers. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChargers();
  }, []);

  const handleEditClick = (charger: Charger) => {
    setEditingCharger(charger);
    setValue("name", charger.name);
    setValue("connector_count", charger.connectors?.length || 1);
    setValue("type", charger.type);
    setValue("max_power_kw", charger.max_power_kw);
    setValue(
      "current_transaction_id",
      charger.current_transaction_id ?? undefined,
    );
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingCharger(null);
    reset();
  };

  const onSubmit = async (data: CreateChargerSubmitValues) => {
    if (!editingCharger) return;

    try {
      setIsSubmitting(true);
      await updateCharger(editingCharger.charger_id, data);
      alert("Charger updated successfully!");
      handleCloseModal();
      await fetchChargers();
    } catch (error: any) {
      console.error(
        "Failed to update charger:",
        error.response?.data || error.message,
      );
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        alert(detail);
      } else if (Array.isArray(detail) && detail[0]?.msg) {
        alert(detail[0].msg);
      } else {
        alert("Failed to update charger. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (chargerId: number) => {
    if (!confirm("Are you sure you want to delete this charger?")) {
      return;
    }

    try {
      await deleteCharger(chargerId);
      alert("Charger deleted successfully!");
      await fetchChargers();
    } catch (error: any) {
      console.error(
        "Failed to delete charger:",
        error.response?.data || error.message,
      );
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        alert(detail);
      } else {
        alert("Failed to delete charger. Please try again.");
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20";
      case "IN_CHARGING":
        return "bg-orange-100 text-orange-700 border border-orange-200";
      case "RESERVED":
        return "bg-red-100 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const formatStatus = (status: string) => status.replace("_", " ");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">
              Charger Network
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            My Chargers
          </h1>
          <p className="mt-1.5 text-sm text-gray-500">
            View and manage chargers in your station.
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-24 animate-pulse bg-gray-100" />
              <div className="space-y-3 p-4">
                <div className="h-4 w-1/2 animate-pulse rounded-full bg-gray-100" />
                <div className="h-3 w-2/3 animate-pulse rounded-full bg-gray-100" />
                <div className="h-8 w-full animate-pulse rounded-lg bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {chargers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Zap size={22} />
              </div>
              <p className="text-base font-semibold text-gray-700">
                No chargers found. Add your first charger to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
              {chargers.map((charger) => (
                <div
                  key={charger.charger_id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
                >
                  <div className="border-b border-gray-100 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-bold text-gray-900">
                          {charger.name}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Charge Point:{" "}
                          <span className="font-semibold text-gray-700">
                            {charger.charge_point_id}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(charger.status)}`}
                      >
                        {formatStatus(charger.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                        <p className="text-gray-500">Type</p>
                        <p className="font-semibold text-gray-800">
                          {charger.type}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                        <p className="text-gray-500">Max Power</p>
                        <p className="font-semibold text-gray-800">
                          {charger.max_power_kw} kW
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                        Connectors
                      </p>
                      <span className="rounded-md bg-[#22C55E]/10 px-2 py-1 text-xs font-bold text-[#22C55E]">
                        {
                          (charger.connectors || []).filter(
                            (connector) => connector.status === "AVAILABLE",
                          ).length
                        }
                        /{charger.connectors?.length || 0} free
                      </span>
                    </div>

                    {(charger.connectors || []).map((connector) => (
                      <div
                        key={connector.connector_id}
                        className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#22C55E] shadow-sm">
                            <Plug size={15} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              Connector {connector.connector_number}
                            </p>
                            <p className="truncate text-xs text-gray-500">
                              {connector.charge_point_id}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusColor(connector.status)}`}
                        >
                          {formatStatus(connector.status)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-4">
                    <button
                      onClick={() => handleEditClick(charger)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(charger.charger_id)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showEditModal && editingCharger && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Charger
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Charger Name
                </FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. Charger A1"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Number of Connectors
                </FieldLabel>
                <Input
                  type="number"
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. 2"
                  min={1}
                  max={20}
                  disabled
                  {...register("connector_count", {
                    setValueAs: (value) =>
                      value === "" ? undefined : Number(value),
                  })}
                />
                {errors.connector_count && (
                  <p className="text-sm text-red-500">
                    {errors.connector_count.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Charger Type
                </FieldLabel>
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

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Max Power (kW)
                </FieldLabel>
                <Input
                  type="number"
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. 50"
                  min={1}
                  {...register("max_power_kw", {
                    setValueAs: (value) =>
                      value === "" ? undefined : Number(value),
                  })}
                />
                {errors.max_power_kw && (
                  <p className="text-sm text-red-500">
                    {errors.max_power_kw.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Current Transaction ID (optional)
                </FieldLabel>
                <Input
                  type="number"
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="Leave empty if none"
                  {...register("current_transaction_id", {
                    setValueAs: (value) =>
                      value === "" ? undefined : Number(value),
                  })}
                />
                {errors.current_transaction_id && (
                  <p className="text-sm text-red-500">
                    {errors.current_transaction_id.message}
                  </p>
                )}
              </Field>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 h-10 bg-gray-200 text-gray-900 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-[#22C55E] text-white hover:bg-[#16a34a]"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
