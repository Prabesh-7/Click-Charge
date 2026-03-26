import { useEffect, useState } from "react";
import { getMyChargers, updateCharger, deleteCharger } from "@/api/managerApi";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
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
        return "bg-green-100 text-green-800";
      case "IN_CHARGING":
        return "bg-blue-100 text-blue-800";
      case "RESERVED":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Chargers</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all chargers in your station.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading chargers...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {chargers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No chargers found. Add your first charger to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chargers.map((charger) => (
                <div
                  key={charger.charger_id}
                  className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {charger.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(charger.status)}`}
                    >
                      {charger.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="text-gray-900 font-medium">
                        {charger.type}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Charger ID:</span>
                      <span className="text-gray-900 font-medium">
                        #{charger.charger_id}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Station ID:</span>
                      <span className="text-gray-900 font-medium">
                        #{charger.station_id}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Connectors:</span>
                      <span className="text-gray-900 font-medium">
                        {charger.connectors?.length || 0}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Connector CPIDs:</span>
                      <div className="text-gray-900 mt-1">
                        {(charger.connectors || []).map((connector) => (
                          <div key={connector.connector_id}>
                            C{connector.connector_number}:{" "}
                            {connector.charge_point_id}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Max Power:</span>
                      <span className="text-gray-900 font-medium">
                        {charger.max_power_kw} kW
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transaction ID:</span>
                      <span className="text-gray-900 font-medium">
                        {charger.current_transaction_id ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900 font-medium">
                        {charger.created_at
                          ? new Date(charger.created_at).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Status Change:</span>
                      <span className="text-gray-900 font-medium">
                        {charger.last_status_change
                          ? new Date(
                              charger.last_status_change,
                            ).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleEditClick(charger)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(charger.charger_id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
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
                  className="flex-1 h-10 bg-green-400"
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
