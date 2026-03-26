import { useEffect, useState } from "react";
import {
  getMyChargersByStaff,
  startChargingByStaff,
  stopChargingByStaff,
  getChargerMeterValuesByStaff,
} from "@/api/staffApi";

interface Charger {
  charger_id: number;
  station_id: number;
  name: string;
  charge_point_id: string;
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO";
  max_power_kw: number;
  current_transaction_id?: number | null;
  created_at: string;
  last_status_change: string;
}

interface MeterValues {
  charger_id: number;
  charge_point_id: string;
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  transaction_id?: number | null;
  power_kw: number;
  voltage_v: number;
  current_a: number;
  energy_kwh: number;
  timestamp: string;
}

export default function StaffChargerControl() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [meterValues, setMeterValues] = useState<MeterValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCharger =
    chargers.find((c) => c.charger_id === selectedId) || null;

  const fetchChargers = async () => {
    try {
      setLoading(true);
      const data = await getMyChargersByStaff();
      setChargers(data);
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].charger_id);
      }
      if (data.length === 0) {
        setSelectedId(null);
        setMeterValues(null);
      }
      setError(null);
    } catch (err: any) {
      console.error(
        "Failed to load staff chargers:",
        err.response?.data || err.message,
      );
      if (err.response?.status === 404) {
        setChargers([]);
        setSelectedId(null);
        setMeterValues(null);
        setError(null);
      } else {
        setError(err.response?.data?.detail || "Failed to load chargers.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMeterValues = async (chargerId: number) => {
    try {
      const data = await getChargerMeterValuesByStaff(chargerId);
      setMeterValues(data);
    } catch (err: any) {
      console.error(
        "Failed to load meter values:",
        err.response?.data || err.message,
      );
    }
  };

  useEffect(() => {
    fetchChargers();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchMeterValues(selectedId);

    const interval = setInterval(() => {
      fetchMeterValues(selectedId);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedId]);

  const handleStart = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      const response = await startChargingByStaff(selectedId);
      const updated = response.charger;
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      await fetchMeterValues(selectedId);
    } catch (err: any) {
      console.error(
        "Failed to start charger:",
        err.response?.data || err.message,
      );
      alert(err.response?.data?.detail || "Failed to start charger.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      const response = await stopChargingByStaff(selectedId);
      const updated = response.charger;
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      await fetchMeterValues(selectedId);
    } catch (err: any) {
      console.error(
        "Failed to stop charger:",
        err.response?.data || err.message,
      );
      alert(err.response?.data?.detail || "Failed to stop charger.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Charger Control</h1>
        <p className="text-sm text-gray-500 mt-1">
          Start or stop charging and view live meter values.
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

      {!loading && !error && chargers.length > 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Charger
            </label>
            <select
              className="w-full md:w-105 h-10 border border-[#B6B6B6] rounded px-2 text-sm"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
            >
              {chargers.map((charger) => (
                <option key={charger.charger_id} value={charger.charger_id}>
                  {charger.name} ({charger.charge_point_id})
                </option>
              ))}
            </select>
          </div>

          {selectedCharger && (
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCharger.name}
                </h2>
                <span className="text-sm text-gray-600">
                  Status: {selectedCharger.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-green-500 text-white text-sm disabled:opacity-50"
                  disabled={
                    selectedCharger.status === "IN_CHARGING" || actionLoading
                  }
                  onClick={handleStart}
                >
                  {actionLoading && selectedCharger.status !== "IN_CHARGING"
                    ? "Starting..."
                    : "Start Charging"}
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded bg-red-500 text-white text-sm disabled:opacity-50"
                  disabled={
                    selectedCharger.status !== "IN_CHARGING" || actionLoading
                  }
                  onClick={handleStop}
                >
                  {actionLoading && selectedCharger.status === "IN_CHARGING"
                    ? "Stopping..."
                    : "Stop Charging"}
                </button>
              </div>
            </div>
          )}

          {meterValues && (
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Meter Values
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Power:</span>
                  <span className="text-gray-900 font-medium">
                    {meterValues.power_kw} kW
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Energy:</span>
                  <span className="text-gray-900 font-medium">
                    {meterValues.energy_kwh} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Voltage:</span>
                  <span className="text-gray-900 font-medium">
                    {meterValues.voltage_v} V
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current:</span>
                  <span className="text-gray-900 font-medium">
                    {meterValues.current_a} A
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="text-gray-900 font-medium">
                    {meterValues.transaction_id ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated At:</span>
                  <span className="text-gray-900 font-medium">
                    {new Date(meterValues.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && !error && chargers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No chargers found.</p>
        </div>
      )}
    </main>
  );
}
