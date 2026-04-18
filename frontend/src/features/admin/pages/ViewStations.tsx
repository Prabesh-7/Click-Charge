import { useEffect, useState } from "react";
import { getStations, updateStation, deleteStation } from "@/api/adminApi";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  stationUpdateSchema,
  type StationUpdateFormValues,
  type StationUpdateSubmitValues,
} from "@/lib/schema/StationUpdateSchema";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Station {
  station_id: number;
  station_name: string;
  address: string;
  longitude: number;
  latitude: number;
  total_charger: number;
  manager_id: number | null;
  created_at: string;
}

export default function ViewStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<StationUpdateFormValues, unknown, StationUpdateSubmitValues>({
    resolver: zodResolver(stationUpdateSchema),
  });

  const fetchStations = async () => {
    try {
      setLoading(true);
      const data = await getStations();
      setStations(data);
      setError(null);
    } catch (err: any) {
      console.error(
        "Failed to fetch stations:",
        err.response?.data || err.message,
      );
      setError(
        err.response?.data?.detail ||
          "Failed to load stations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleEditClick = (station: Station) => {
    setEditingStation(station);
    setValue("station_name", station.station_name);
    setValue("address", station.address);
    setValue("longitude", station.longitude);
    setValue("latitude", station.latitude);
    setValue("total_charger", station.total_charger);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingStation(null);
    reset();
  };

  const onSubmit = async (data: StationUpdateSubmitValues) => {
    if (!editingStation) return;

    try {
      setIsSubmitting(true);
      await updateStation(editingStation.station_id, data);
      toast.success("Station updated successfully.");
      handleCloseModal();
      await fetchStations();
    } catch (error: any) {
      console.error(
        "Failed to update station:",
        error.response?.data || error.message,
      );
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        toast.error("Update failed", { description: detail });
      } else {
        toast.error("Failed to update station. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (stationId: number) => {
    if (!confirm("Are you sure you want to delete this station?")) {
      return;
    }

    try {
      await deleteStation(stationId);
      toast.success("Station deleted successfully.");
      await fetchStations();
    } catch (error: any) {
      console.error(
        "Failed to delete station:",
        error.response?.data || error.message,
      );
      const detail = error.response?.data?.detail;
      if (typeof detail === "string") {
        toast.error("Delete failed", { description: detail });
      } else {
        toast.error("Failed to delete station. Please try again.");
      }
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
        <p className="text-sm text-gray-500 mt-1">
          View all charging stations in the system.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stations...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          {stations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No stations found. Create your first station to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => (
                <div
                  key={station.station_id}
                  className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {station.station_name}
                    </h3>
                    <p className="text-sm text-gray-600">{station.address}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Station ID:</span>
                      <span className="text-gray-900 font-medium">
                        #{station.station_id}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Chargers:</span>
                      <span className="text-gray-900 font-medium">
                        {station.total_charger}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Manager ID:</span>
                      <span className="text-gray-900 font-medium">
                        {station.manager_id
                          ? `#${station.manager_id}`
                          : "Not assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-900 font-medium text-xs">
                        {station.latitude.toFixed(4)},{" "}
                        {station.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900 font-medium text-xs">
                        {new Date(station.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleEditClick(station)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(station.station_id)}
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

      {showEditModal && editingStation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Station
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Station Name
                </FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. Downtown Charging Hub"
                  {...register("station_name")}
                />
                {errors.station_name && (
                  <p className="text-sm text-red-500">
                    {errors.station_name.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Address
                </FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="Street address"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">
                    {errors.address.message}
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field className="gap-2">
                  <FieldLabel className="text-base font-medium">
                    Longitude
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    className="h-10 border border-[#B6B6B6]"
                    placeholder="e.g. 85.3243"
                    {...register("longitude")}
                  />
                  {errors.longitude && (
                    <p className="text-sm text-red-500">
                      {errors.longitude.message}
                    </p>
                  )}
                </Field>

                <Field className="gap-2">
                  <FieldLabel className="text-base font-medium">
                    Latitude
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    className="h-10 border border-[#B6B6B6]"
                    placeholder="e.g. 27.7172"
                    {...register("latitude")}
                  />
                  {errors.latitude && (
                    <p className="text-sm text-red-500">
                      {errors.latitude.message}
                    </p>
                  )}
                </Field>
              </div>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Total Chargers
                </FieldLabel>
                <Input
                  type="number"
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. 10"
                  min={1}
                  {...register("total_charger")}
                />
                {errors.total_charger && (
                  <p className="text-sm text-red-500">
                    {errors.total_charger.message}
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
