import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Phone, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserStations, type UserStation } from "@/api/userApi";

export default function StationDetails() {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [stations, setStations] = useState<UserStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const parsedStationId = Number(stationId);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await getUserStations();
        setStations(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Failed to load station details.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchStations();
  }, []);

  const station = useMemo(() => {
    if (!Number.isFinite(parsedStationId)) {
      return null;
    }

    return stations.find((item) => item.station_id === parsedStationId) || null;
  }, [parsedStationId, stations]);

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Station Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Full station information.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate("/user/stations")}
          className="h-10 bg-white border "
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Stations
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading station details...</p>
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !station && (
        <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
          <p className="text-sm text-gray-600">Station not found.</p>
        </div>
      )}

      {!loading && !error && station && (
        <div className="space-y-4">
          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">
              {station.station_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <MapPin size={14} />
              {station.address}
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Chargers</p>
                <p className="text-gray-900 font-semibold">
                  {station.available_chargers}/{station.total_chargers}{" "}
                  available
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Connectors</p>
                <p className="text-gray-900 font-semibold">
                  {station.available_connectors}/{station.total_connectors}{" "}
                  available
                </p>
              </div>
           
            </div>
          </div>

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Contact and Charging
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-2">
                <Phone size={15} />
                <span>{station.phone_number || "Phone not available"}</span>
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 flex items-center gap-2">
                <Plug size={15} />
                <span>
                  {station.charger_types.length > 0
                    ? station.charger_types.join(", ")
                    : "Plug types not available"}
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-700">
              {station.station_description ||
                "No station description available."}
            </p>
          </div>

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Amenities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
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
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Station Images
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {station.station_images.map((imageUrl) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={station.station_name}
                    className="w-full h-40 object-cover rounded-md border border-gray-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
