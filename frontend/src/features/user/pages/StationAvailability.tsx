import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plug, ArrowLeft } from "lucide-react";
import { getUserStations, type UserStation } from "@/api/userApi";
import { Button } from "@/components/ui/button";

export default function StationAvailability() {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [stations, setStations] = useState<UserStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async (isInitialLoad = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        }

        const data = await getUserStations();
        setStations(data);
        setError(null);
      } catch (err: any) {
        if (isInitialLoad) {
          console.error(
            "Failed to load station availability:",
            err.response?.data || err.message,
          );
          setError(
            err.response?.data?.detail ||
              "Failed to load station availability. Please try again.",
          );
        }
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        }
      }
    };

    void fetchStations(true);

    const intervalId = window.setInterval(() => {
      void fetchStations(false);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const selectedStation = useMemo(() => {
    const parsedStationId = Number(stationId);
    if (!Number.isFinite(parsedStationId)) {
      return stations[0] || null;
    }

    return (
      stations.find((station) => station.station_id === parsedStationId) || null
    );
  }, [stationId, stations]);

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Charger Availability
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live availability updates every 3 seconds.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate("/user/stations")}
          className="h-10 bg-gray-800 hover:bg-gray-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Stations
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading availability...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !selectedStation && (
        <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
          <p className="text-sm text-gray-600">Station not found.</p>
        </div>
      )}

      {!loading && !error && selectedStation && (
        <div className="space-y-4">
          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedStation.station_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedStation.address}
            </p>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                Chargers: {selectedStation.available_chargers}/
                {selectedStation.total_chargers} available
              </div>
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                Connectors: {selectedStation.available_connectors}/
                {selectedStation.total_connectors} available
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {selectedStation.chargers.length === 0 && (
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                No chargers available for this station.
              </div>
            )}

            {selectedStation.chargers.map((charger) => (
              <div
                key={charger.charger_id}
                className="rounded-md border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {charger.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Type: {charger.type} | Connectors:{" "}
                      {charger.available_connectors}/{charger.total_connectors}{" "}
                      available
                    </p>
                  </div>

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      charger.available_connectors > 0
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {charger.available_connectors > 0 ? "Available" : "Busy"}
                  </span>
                </div>

                {charger.connectors.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {charger.connectors.map((connector) => {
                      const isAvailable = connector.status === "AVAILABLE";
                      return (
                        <div
                          key={connector.connector_id}
                          className={`rounded-md border px-3 py-2 text-xs ${
                            isAvailable
                              ? "border-green-200 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-50 text-gray-700"
                          }`}
                        >
                          <p className="font-medium flex items-center gap-1">
                            <Plug size={12} /> Connector{" "}
                            {connector.connector_number}
                          </p>
                          <p className="mt-1">Status: {connector.status}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
