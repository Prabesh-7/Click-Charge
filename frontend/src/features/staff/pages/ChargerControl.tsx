import { useEffect, useState } from "react";
import {
  getMyChargersByStaff,
  startChargingByStaff,
  stopChargingByStaff,
  reserveConnectorByStaff,
  releaseConnectorByStaff,
  getStaffReservations,
  getChargerMeterValuesByStaff,
} from "@/api/staffApi";

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

interface MeterValues {
  charger_id: number;
  connector_id?: number | null;
  connector_number?: number | null;
  charge_point_id: string;
  status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  transaction_id?: number | null;
  power_kw: number;
  reactive_power_kvar: number;
  voltage_v: number;
  current_a: number;
  power_factor: number;
  frequency_hz: number;
  energy_kwh: number;
  reactive_energy_kvarh: number;
  price_per_kwh?: number;
  running_amount?: number;
  currency?: string;
  temperature_c: number;
  soc_percent: number;
  timestamp: string;
}

interface ChargingSummary {
  invoice_id?: string;
  issued_at?: string;
  charger_name?: string;
  charge_point_id?: string;
  connector_number?: number | null;
  total_energy_kwh?: number;
  price_per_kwh?: number;
  total_amount?: number;
  currency?: string;
}

interface ReservationItem {
  charger_id: number;
  charger_name: string;
  connector_id: number;
  connector_number: number;
  reserved_by_user_name?: string | null;
  reserved_by_email?: string | null;
}

export default function StaffChargerControl() {
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(
    null,
  );
  const [meterValues, setMeterValues] = useState<MeterValues | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSummary, setLastSummary] = useState<ChargingSummary | null>(null);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);

  const selectedCharger =
    chargers.find((c) => c.charger_id === selectedId) || null;
  const selectedConnector =
    selectedCharger?.connectors?.find(
      (c) => c.connector_id === selectedConnectorId,
    ) ||
    selectedCharger?.connectors?.[0] ||
    null;

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

  const fetchChargers = async () => {
    try {
      setLoading(true);
      const data = await getMyChargersByStaff();
      setChargers(data);
      if (data.length > 0 && selectedId === null) {
        setSelectedId(data[0].charger_id);
        const firstConnector = data[0].connectors?.[0];
        setSelectedConnectorId(
          firstConnector ? firstConnector.connector_id : null,
        );
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
      const data = await getChargerMeterValuesByStaff(
        chargerId,
        selectedConnectorId || undefined,
      );
      setMeterValues(data);
    } catch (err: any) {
      console.error(
        "Failed to load meter values:",
        err.response?.data || err.message,
      );
    }
  };

  const fetchReservations = async () => {
    try {
      const data = await getStaffReservations();
      setReservations(data);
    } catch (err: any) {
      console.error(
        "Failed to load reservations:",
        err.response?.data || err.message,
      );
    }
  };

  useEffect(() => {
    fetchChargers();
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchMeterValues(selectedId);

    const interval = setInterval(() => {
      fetchMeterValues(selectedId);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedId, selectedConnectorId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchReservations();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selectedCharger) {
      setSelectedConnectorId(null);
      return;
    }

    const exists = selectedCharger.connectors?.some(
      (item) => item.connector_id === selectedConnectorId,
    );
    if (!exists) {
      setSelectedConnectorId(
        selectedCharger.connectors?.[0]?.connector_id || null,
      );
    }
  }, [selectedCharger, selectedConnectorId]);

  const handleStart = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      const response = await startChargingByStaff(
        selectedId,
        selectedConnectorId || undefined,
      );
      const updated = response.charger;
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      await fetchMeterValues(selectedId);
      await fetchReservations();
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
      const response = await stopChargingByStaff(
        selectedId,
        selectedConnectorId || undefined,
      );
      const updated = response.charger;
      if (response?.invoice) {
        const invoice = response.invoice;
        setLastSummary({
          invoice_id: invoice.invoice_id,
          issued_at: invoice.issued_at,
          charger_name: invoice.charger_name,
          charge_point_id: invoice.charge_point_id,
          connector_number: invoice.connector_number,
          total_energy_kwh: invoice.total_energy_kwh,
          price_per_kwh: invoice.price_per_kwh,
          total_amount: invoice.total_amount,
          currency: invoice.currency,
        });
        alert(
          `Charging stopped. Invoice ${invoice.invoice_id} | Total: ${invoice.currency || "NPR"} ${invoice.total_amount} for ${invoice.total_energy_kwh ?? 0} kWh`,
        );
      } else if (typeof response.total_amount === "number") {
        setLastSummary({
          charger_name: selectedCharger?.name,
          charge_point_id: selectedConnector?.charge_point_id,
          connector_number: selectedConnector?.connector_number,
          total_energy_kwh: response.total_energy_kwh,
          price_per_kwh: response.price_per_kwh,
          total_amount: response.total_amount,
          currency: response.currency || "NPR",
        });
      }
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      await fetchMeterValues(selectedId);
      await fetchReservations();
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

  const handleReserve = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      const response = await reserveConnectorByStaff(
        selectedId,
        selectedConnectorId || undefined,
      );
      const updated = response.charger;
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      await fetchMeterValues(selectedId);
      await fetchReservations();
      alert(response.message || "Connector reserved successfully.");
    } catch (err: any) {
      console.error(
        "Failed to reserve connector:",
        err.response?.data || err.message,
      );
      alert(err.response?.data?.detail || "Failed to reserve connector.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!selectedId) return;
    try {
      setActionLoading(true);
      const response = await releaseConnectorByStaff(
        selectedId,
        selectedConnectorId || undefined,
      );
      const updated = response.charger;
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      await fetchMeterValues(selectedId);
      await fetchReservations();
      alert(response.message || "Connector released successfully.");
    } catch (err: any) {
      console.error(
        "Failed to release connector:",
        err.response?.data || err.message,
      );
      alert(err.response?.data?.detail || "Failed to release connector.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseReservation = async (
    chargerId: number,
    connectorId: number,
  ) => {
    try {
      setActionLoading(true);
      const response = await releaseConnectorByStaff(chargerId, connectorId);
      const updated = response.charger;
      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );
      if (selectedId) {
        await fetchMeterValues(selectedId);
      }
      await fetchReservations();
    } catch (err: any) {
      console.error(
        "Failed to release reservation:",
        err.response?.data || err.message,
      );
      alert(err.response?.data?.detail || "Failed to release reservation.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Charger Control</h1>
        <p className="text-sm text-gray-500 mt-1">
          Start or stop charging and monitor live charging telemetry.
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Connector
              </label>
              <select
                className="w-full md:w-105 h-10 border border-[#B6B6B6] rounded px-2 text-sm"
                value={selectedConnectorId ?? ""}
                onChange={(e) => setSelectedConnectorId(Number(e.target.value))}
              >
                {(selectedCharger.connectors || []).map((connector) => (
                  <option
                    key={connector.connector_id}
                    value={connector.connector_id}
                  >
                    Connector {connector.connector_number} (
                    {connector.charge_point_id}) -{" "}
                    {connector.status.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {lastSummary && (
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Last Charging Bill
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice ID:</span>
                  <span className="text-gray-900 font-medium">
                    {lastSummary.invoice_id ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Charger:</span>
                  <span className="text-gray-900 font-medium">
                    {lastSummary.charger_name ?? "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Connector:</span>
                  <span className="text-gray-900 font-medium">
                    {lastSummary.connector_number ?? "-"}
                    {lastSummary.charge_point_id
                      ? ` (${lastSummary.charge_point_id})`
                      : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Energy Consumed:</span>
                  <span className="text-gray-900 font-medium">
                    {lastSummary.total_energy_kwh ?? 0} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rate:</span>
                  <span className="text-gray-900 font-medium">
                    {(lastSummary.currency || "NPR") +
                      " " +
                      (lastSummary.price_per_kwh ?? 0)}
                    /kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="text-gray-900 font-semibold">
                    {(lastSummary.currency || "NPR") +
                      " " +
                      (lastSummary.total_amount ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {selectedCharger && (
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Connector Availability
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {(selectedCharger.connectors || []).map((connector) => (
                  <div
                    key={connector.connector_id}
                    className="flex items-center justify-between border border-gray-200 rounded px-3 py-2"
                  >
                    <div className="text-gray-900">
                      C{connector.connector_number} ({connector.charge_point_id}
                      )
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(connector.status)}`}
                    >
                      {connector.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedCharger && (
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedCharger.name}
                </h2>
                <span className="text-sm text-gray-600">
                  Status:{" "}
                  {(
                    selectedConnector?.status || selectedCharger.status
                  ).replace("_", " ")}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-green-500 text-white text-sm disabled:opacity-50"
                  disabled={
                    selectedConnector?.status !== "AVAILABLE" ||
                    actionLoading ||
                    !selectedConnector
                  }
                  onClick={handleStart}
                >
                  {actionLoading && selectedConnector?.status === "AVAILABLE"
                    ? "Starting..."
                    : "Start Charging"}
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded bg-red-500 text-white text-sm disabled:opacity-50"
                  disabled={
                    selectedConnector?.status !== "IN_CHARGING" ||
                    actionLoading ||
                    !selectedConnector
                  }
                  onClick={handleStop}
                >
                  {actionLoading && selectedConnector?.status === "IN_CHARGING"
                    ? "Stopping..."
                    : "Stop Charging"}
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded bg-yellow-500 text-white text-sm disabled:opacity-50"
                  disabled={
                    selectedConnector?.status !== "AVAILABLE" ||
                    actionLoading ||
                    !selectedConnector
                  }
                  onClick={handleReserve}
                >
                  {actionLoading && selectedConnector?.status === "AVAILABLE"
                    ? "Reserving..."
                    : "Reserve Slot"}
                </button>

                <button
                  type="button"
                  className="px-3 py-2 rounded bg-amber-700 text-white text-sm disabled:opacity-50"
                  disabled={
                    selectedConnector?.status !== "RESERVED" ||
                    actionLoading ||
                    !selectedConnector
                  }
                  onClick={handleRelease}
                >
                  {actionLoading && selectedConnector?.status === "RESERVED"
                    ? "Releasing..."
                    : "Release Slot"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Active Reservations
            </h3>

            {reservations.length === 0 && (
              <p className="text-sm text-gray-500">No active reservations.</p>
            )}

            {reservations.length > 0 && (
              <div className="space-y-2">
                {reservations.map((reservation) => (
                  <div
                    key={`${reservation.connector_id}-${reservation.charger_id}`}
                    className="border border-gray-200 rounded px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-gray-900 font-medium">
                        {reservation.charger_name} - Connector{" "}
                        {reservation.connector_number}
                      </p>
                      <p className="text-gray-600 text-xs mt-1">
                        Reserved by:{" "}
                        {reservation.reserved_by_user_name || "Unknown"}
                        {reservation.reserved_by_email
                          ? ` (${reservation.reserved_by_email})`
                          : ""}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-amber-700 text-white text-xs disabled:opacity-50"
                      disabled={actionLoading}
                      onClick={() =>
                        void handleReleaseReservation(
                          reservation.charger_id,
                          reservation.connector_id,
                        )
                      }
                    >
                      Release
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {meterValues && (
            <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Live Meter Values
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="border border-blue-100 bg-blue-50 rounded p-3 space-y-2">
                  <h4 className="font-semibold text-blue-900">
                    Power & Energy
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Power:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.power_kw} kW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reactive Power:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.reactive_power_kvar} kVAr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Energy:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.energy_kwh} kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reactive Energy:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.reactive_energy_kvarh} kVArh
                    </span>
                  </div>
                </div>

                <div className="border border-green-100 bg-green-50 rounded p-3 space-y-2">
                  <h4 className="font-semibold text-green-900">Electrical</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Voltage:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.voltage_v} V
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.current_a} A
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Power Factor:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.power_factor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Frequency:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.frequency_hz} Hz
                    </span>
                  </div>
                </div>

                <div className="border border-orange-100 bg-orange-50 rounded p-3 space-y-2">
                  <h4 className="font-semibold text-orange-900">
                    Environmental
                  </h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Temperature:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.temperature_c} C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SOC:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.soc_percent} %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connector:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.connector_number ?? "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction:</span>
                    <span className="text-gray-900 font-medium">
                      {meterValues.transaction_id ?? "-"}
                    </span>
                  </div>
                </div>

                <div className="border border-emerald-100 bg-emerald-50 rounded p-3 space-y-2">
                  <h4 className="font-semibold text-emerald-900">Billing</h4>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tariff:</span>
                    <span className="text-gray-900 font-medium">
                      {(meterValues.currency || "NPR") + " "}
                      {Number(meterValues.price_per_kwh ?? 0).toFixed(2)}/kWh
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Running Amount:</span>
                    <span className="text-gray-900 font-semibold">
                      {(meterValues.currency || "NPR") + " "}
                      {Number(meterValues.running_amount ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-3 text-sm">
                <span className="text-gray-500">Updated At: </span>
                <span className="text-gray-900 font-medium ml-1">
                  {new Date(meterValues.timestamp).toLocaleTimeString()}
                </span>
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
