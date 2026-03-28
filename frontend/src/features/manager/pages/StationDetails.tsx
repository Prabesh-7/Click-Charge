import { useEffect, useState, type ChangeEvent } from "react";
import {
  getMyChargers,
  getMyStation,
  updateMyStation,
  uploadStationImage,
  type ManagerCharger,
  type ManagerStation,
} from "@/api/managerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Plug, MapPin, FileText } from "lucide-react";

type StationFormState = {
  station_description: string;
  phone_number: string;
  has_wifi: boolean;
  has_parking: boolean;
  has_food: boolean;
  has_coffee: boolean;
  has_bedroom: boolean;
  has_restroom: boolean;
  station_images: string[];
};

const emptyFormState: StationFormState = {
  station_description: "",
  phone_number: "",
  has_wifi: false,
  has_parking: false,
  has_food: false,
  has_coffee: false,
  has_bedroom: false,
  has_restroom: false,
  station_images: [],
};

export default function StationDetails() {
  const [station, setStation] = useState<ManagerStation | null>(null);
  const [chargers, setChargers] = useState<ManagerCharger[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [form, setForm] = useState<StationFormState>(emptyFormState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hydrateForm = (data: ManagerStation) => {
    setForm({
      station_description: data.station_description || "",
      phone_number: data.phone_number || "",
      has_wifi: data.has_wifi,
      has_parking: data.has_parking,
      has_food: data.has_food,
      has_coffee: data.has_coffee,
      has_bedroom: data.has_bedroom,
      has_restroom: data.has_restroom,
      station_images: data.station_images || [],
    });
  };

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const [stationData, chargerData] = await Promise.all([
          getMyStation(),
          getMyChargers(),
        ]);
        setStation(stationData);
        setChargers(chargerData);
        hydrateForm(stationData);
        setError(null);
      } catch (err: any) {
        console.error(
          "Failed to load station details:",
          err.response?.data || err.message,
        );
        setError(
          err.response?.data?.detail ||
            "Failed to load station details. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStation();
  }, []);

  const handleAmenityChange = (
    key: keyof StationFormState,
    checked: boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const uploaded = await uploadStationImage(file);
      setForm((prev) => ({
        ...prev,
        station_images: [...prev.station_images, uploaded.image_url],
      }));
      setSuccessMessage("Image uploaded successfully.");
    } catch (err: any) {
      console.error(
        "Failed to upload station image:",
        err.response?.data || err.message,
      );
      setError(
        err.response?.data?.detail ||
          "Failed to upload image. Please try again.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeImage = (imageUrl: string) => {
    setForm((prev) => ({
      ...prev,
      station_images: prev.station_images.filter((url) => url !== imageUrl),
    }));
  };

  const handleSaveDetails = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await updateMyStation({
        station_description: form.station_description || undefined,
        phone_number: form.phone_number || undefined,
        has_wifi: form.has_wifi,
        has_parking: form.has_parking,
        has_food: form.has_food,
        has_coffee: form.has_coffee,
        has_bedroom: form.has_bedroom,
        has_restroom: form.has_restroom,
        station_images: form.station_images,
      });

      setStation(updated);
      hydrateForm(updated);
      setSuccessMessage("Station details updated successfully.");
    } catch (err: any) {
      console.error(
        "Failed to update station details:",
        err.response?.data || err.message,
      );
      setError(
        err.response?.data?.detail ||
          "Failed to update station details. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const amenityItems: Array<{ key: keyof StationFormState; label: string }> = [
    { key: "has_wifi", label: "WiFi" },
    { key: "has_parking", label: "Parking" },
    { key: "has_food", label: "Food" },
    { key: "has_coffee", label: "Coffee" },
    { key: "has_bedroom", label: "Bedroom" },
    { key: "has_restroom", label: "Restroom" },
  ];

  const chargerTypes = Array.from(
    new Set(chargers.map((charger) => charger.type)),
  );

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Station Details</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your station information.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading station details...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          <p>{successMessage}</p>
        </div>
      )}

      {!loading && !error && station && (
        <div className="space-y-4">
          <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {station.station_name}
                </h3>
                <p className="text-sm text-gray-600">{station.address}</p>
              </div>

              <Button
                type="button"
                onClick={() => setShowDetails((prev) => !prev)}
                className="h-10 bg-blue-600 hover:bg-blue-700"
              >
                {showDetails ? "Hide Details" : "Get Details"}
              </Button>
            </div>

            {showDetails && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Phone size={16} />
                      <span>Phone</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {station.phone_number || "Not set"}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <Plug size={16} />
                      <span>Plug Types</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {chargerTypes.length > 0
                        ? chargerTypes.join(", ")
                        : "No chargers added yet"}
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-md p-3 bg-gray-50 md:col-span-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <FileText size={16} />
                      <span>Description</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {station.station_description ||
                        "No station description added."}
                    </p>
                  </div>
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
                    <span className="text-gray-900 font-medium text-xs flex items-center gap-1">
                      <MapPin size={14} />
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

                <div className="mt-5">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Amenities
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      WiFi: {station.has_wifi ? "Yes" : "No"}
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      Parking: {station.has_parking ? "Yes" : "No"}
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      Food: {station.has_food ? "Yes" : "No"}
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      Coffee: {station.has_coffee ? "Yes" : "No"}
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      Bedroom: {station.has_bedroom ? "Yes" : "No"}
                    </div>
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      Restroom: {station.has_restroom ? "Yes" : "No"}
                    </div>
                  </div>
                </div>

                {station.station_images.length > 0 && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Station Images
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {station.station_images.map((imageUrl) => (
                        <div
                          key={imageUrl}
                          className="border border-gray-200 rounded-md p-2"
                        >
                          <img
                            src={imageUrl}
                            alt="Station"
                            className="w-full h-36 object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Additional Information
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Add your station contact, amenities, and photos.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Station Description
              </label>
              <textarea
                value={form.station_description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    station_description: event.target.value,
                  }))
                }
                placeholder="Describe station highlights, operation hours, and service notes."
                className="min-h-24 w-full rounded-md border border-[#B6B6B6] px-3 py-2 text-sm text-gray-900 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <Input
                value={form.phone_number}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    phone_number: event.target.value,
                  }))
                }
                placeholder="e.g. +977-9800000000"
                className="h-10 border border-[#B6B6B6]"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Amenities
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {amenityItems.map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form[item.key])}
                      onChange={(event) =>
                        handleAmenityChange(item.key, event.target.checked)
                      }
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Station Images
              </p>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-700"
              />
              {uploading && (
                <p className="text-sm text-gray-500">Uploading image...</p>
              )}

              {form.station_images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {form.station_images.map((imageUrl) => (
                    <div
                      key={imageUrl}
                      className="border border-gray-200 rounded-md p-2"
                    >
                      <img
                        src={imageUrl}
                        alt="Station"
                        className="w-full h-36 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(imageUrl)}
                        className="text-xs text-red-600 mt-2 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="button"
                onClick={handleSaveDetails}
                disabled={saving || uploading}
                className="h-11 bg-green-500 hover:bg-green-600"
              >
                {saving ? "Saving..." : "Save Details"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
