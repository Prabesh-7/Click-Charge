import { useEffect, useState } from "react";

import { getStations, updateStation, deleteStation } from "@/api/adminApi";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import CreateManagerStationForm from "@/features/admin/components/CreateManagerStationForm";
import { useClientPagination } from "@/hooks/useClientPagination";
import {
  stationUpdateSchema,
  type StationUpdateFormValues,
  type StationUpdateSubmitValues,
} from "@/lib/schema/StationUpdateSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
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
  const [showAddModal, setShowAddModal] = useState(false);
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

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleAddSuccess = async () => {
    setShowAddModal(false);
    await fetchStations();
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

  const {
    paginatedItems: paginatedStations,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
    pageSizeOptions,
    setCurrentPage,
    setPageSize,
  } = useClientPagination(stations, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  return (
    <main className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all charging stations in the system.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleAddClick}
          className="h-11 bg-green-500 px-4 hover:bg-green-600"
        >
          <Plus size={18} />
          Add Station
        </Button>
      </div>

      {loading && (
        <div className="py-8 text-center">
          <p className="text-gray-500">Loading stations...</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-[#B6B6B6] bg-white shadow-sm">
          {stations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <p className="text-gray-500">
                No stations found. Create your first station to get started.
              </p>
              <Button
                type="button"
                onClick={handleAddClick}
                className="mt-5 h-11 bg-green-500 px-4 hover:bg-green-600"
              >
                <Plus size={18} />
                Add Station
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">ID</th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Station
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Address
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Chargers
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Manager
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left font-semibold">
                        Created
                      </th>
                      <th className="px-4 py-3 text-center font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStations.map((station) => (
                      <tr
                        key={station.station_id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          #{station.station_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {station.station_name}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {station.address}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {station.total_charger}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {station.manager_id
                            ? `#${station.manager_id}`
                            : "Not assigned"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {station.latitude.toFixed(4)},{" "}
                          {station.longitude.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(station.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditClick(station)}
                              className="h-8 px-3 text-blue-600"
                            >
                              <Edit2 size={16} />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(station.station_id)}
                              className="h-8 px-3 text-red-500"
                            >
                              <Trash2 size={16} />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                startItem={startItem}
                endItem={endItem}
                pageSizeOptions={pageSizeOptions}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </>
          )}
        </div>
      )}

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Station</DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Create a new manager account and charging station from the same
              form.
            </DialogDescription>
          </DialogHeader>
          <CreateManagerStationForm
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEditModal}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseModal();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Edit Station
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              Update station details and save your changes.
            </DialogDescription>
          </DialogHeader>

          {editingStation && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Station Name
                </FieldLabel>
                <Input
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Downtown Charging Hub"
                  {...register("station_name")}
                />
                {errors.station_name && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.station_name.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Address
                </FieldLabel>
                <Input
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="Street address"
                  {...register("address")}
                />
                {errors.address && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.address.message}
                  </p>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field className="gap-2">
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    Longitude
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g. 85.3243"
                    {...register("longitude")}
                  />
                  {errors.longitude && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.longitude.message}
                    </p>
                  )}
                </Field>

                <Field className="gap-2">
                  <FieldLabel className="text-sm font-medium text-gray-700">
                    Latitude
                  </FieldLabel>
                  <Input
                    type="number"
                    step="0.0001"
                    className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                    placeholder="e.g. 27.7172"
                    {...register("latitude")}
                  />
                  {errors.latitude && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.latitude.message}
                    </p>
                  )}
                </Field>
              </div>

              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Total Chargers
                </FieldLabel>
                <Input
                  type="number"
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. 10"
                  min={1}
                  {...register("total_charger")}
                />
                {errors.total_charger && (
                  <p className="text-xs text-red-600 mt-1">
                    {errors.total_charger.message}
                  </p>
                )}
              </Field>

              <DialogFooter className="gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
