import { useEffect, useState } from "react";
import { getStations } from "@/api/adminApi";

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

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const data = await getStations();
        setStations(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to fetch stations:", err.response?.data || err.message);
        setError(err.response?.data?.detail || "Failed to load stations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

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
              <p className="text-gray-500">No stations found. Create your first station to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stations.map((station) => (
                <div
                  key={station.station_id}
                  className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{station.station_name}</h3>
                    <p className="text-sm text-gray-600">{station.address}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Station ID:</span>
                      <span className="text-gray-900 font-medium">#{station.station_id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Chargers:</span>
                      <span className="text-gray-900 font-medium">{station.total_charger}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Manager ID:</span>
                      <span className="text-gray-900 font-medium">
                        {station.manager_id ? `#${station.manager_id}` : "Not assigned"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-900 font-medium text-xs">
                        {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-900 font-medium text-xs">
                        {new Date(station.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
