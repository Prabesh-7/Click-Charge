import { useEffect, useState } from "react";
import { getMyChargersByStaff } from "@/api/staffApi";

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

export default function StaffMyChargers() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChargers = async () => {
      try {
        setLoading(true);
        const data = await getMyChargersByStaff();
        setChargers(data);
        setError(null);
      } catch (err: any) {
        console.error(
          "Failed to fetch staff chargers:",
          err.response?.data || err.message,
        );
        if (err.response?.status === 404) {
          setChargers([]);
          setError(null);
          return;
        }
        setError(
          err.response?.data?.detail ||
            "Failed to load chargers. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchChargers();
  }, []);

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
          View chargers assigned to your station.
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
                No chargers found for your station.
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
