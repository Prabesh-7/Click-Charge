import { useEffect, useMemo, useState } from "react";
import {
  getMyChargersByStaff,
  startChargingByStaff,
  stopChargingByStaff,
  reserveConnectorByStaff,
  releaseConnectorByStaff,
  getStaffReservations,
  getChargerMeterValuesByStaff,
} from "@/api/staffApi";
import { BatteryCharging, Plug, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Charger = {
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
};

type MeterValues = {
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
};

type ChargingSummary = {
  invoice_id?: string;
  issued_at?: string;
  charger_name?: string;
  charge_point_id?: string;
  connector_number?: number | null;
  total_energy_kwh?: number;
  price_per_kwh?: number;
  total_amount?: number;
  currency?: string;
};

type ReservationItem = {
  charger_id: number;
  charger_name: string;
  connector_id: number;
  connector_number: number;
  reserved_by_user_name?: string | null;
  reserved_by_email?: string | null;
};

const formatStatus = (status: string) => status.replace(/_/g, " ");

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "IN_CHARGING":
      return "border border-blue-200 bg-blue-50 text-blue-700";
    case "RESERVED":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
};

export default function StaffChargerControl() {
  const navigate = useNavigate();
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

  const chargerConnectors = useMemo(
    () => selectedCharger?.connectors || [],
    [selectedCharger],
  );

  const selectableConnectors = useMemo(
    () =>
      chargerConnectors.filter((connector) => connector.status === "AVAILABLE"),
    [chargerConnectors],
  );

  const selectedConnectorLabel = useMemo(() => {
    for (const charger of chargers) {
      for (const connector of charger.connectors) {
        if (connector.connector_id === selectedConnectorId) {
          return `${charger.name} - Connector ${connector.connector_number}`;
        }
      }
    }
    return "No connector selected";
  }, [chargers, selectedConnectorId]);

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
    void fetchChargers();
    void fetchReservations();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void fetchMeterValues(selectedId);

    const interval = window.setInterval(() => {
      void fetchMeterValues(selectedId);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [selectedId, selectedConnectorId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void fetchReservations();
    }, 3000);

    return () => window.clearInterval(interval);
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
      void fetchMeterValues(selectedId);
      void fetchReservations();
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
      void fetchMeterValues(selectedId);
      void fetchReservations();
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
      void fetchMeterValues(selectedId);
      void fetchReservations();
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
      void fetchMeterValues(selectedId);
      void fetchReservations();
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
        void fetchMeterValues(selectedId);
      }
      void fetchReservations();
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
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Charger Control
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Select a connector and start charging directly from the card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/staff/dashboard")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Active connector: {selectedConnectorLabel}
          </p>
        </section>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            Loading chargers...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && chargers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Zap size={22} />
            </div>
            <p className="text-base font-semibold text-gray-700">
              No chargers found.
            </p>
          </div>
        )}

        {!loading && !error && chargers.length > 0 && (
          <div className="space-y-4">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    My Chargers
                  </h2>
                  <p className="mt-1 text-sm text-gray-600">
                    Choose one connector, then run charging actions.
                  </p>
                </div>
                <div className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  Selected: {selectedConnectorLabel}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {chargers.map((charger) => {
                  const availableCount = charger.connectors.filter(
                    (connector) => connector.status === "AVAILABLE",
                  ).length;
                  const chargingCount = charger.connectors.filter(
                    (connector) => connector.status === "IN_CHARGING",
                  ).length;
                  const totalConnectors = charger.connectors.length;
                  const selectedForThisCharger =
                    selectedId === charger.charger_id;

                  const statusClass =
                    availableCount > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : chargingCount > 0
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700";

                  const statusLabel =
                    availableCount > 0
                      ? `${availableCount}/${totalConnectors} Available`
                      : `0/${totalConnectors} Available`;

                  return (
                    <article
                      key={charger.charger_id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-gray-900">
                            {charger.name}
                          </h3>
                          <p className="mt-1 text-xs text-gray-600">
                            {charger.type} | {charger.max_power_kw} kW
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Charge Point:{" "}
                            <span className="font-semibold text-gray-700">
                              {charger.charge_point_id}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <BatteryCharging className="h-9 w-9 text-gray-400" />
                        <div className="text-xs text-gray-500">
                          <p>
                            Type:{" "}
                            <span className="font-semibold text-gray-800">
                              {charger.type}
                            </span>
                          </p>
                          <p>
                            Max Power:{" "}
                            <span className="font-semibold text-gray-800">
                              {charger.max_power_kw} kW
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                            Connectors
                          </p>
                          <span className="rounded-md bg-[#22C55E]/10 px-2 py-1 text-xs font-bold text-[#22C55E]">
                            {availableCount}/{totalConnectors} free
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {charger.connectors.map((connector) => {
                            const isSelected =
                              selectedConnectorId === connector.connector_id;
                            const isSelectable = true;

                            return (
                              <label
                                key={connector.connector_id}
                                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
                                  isSelected
                                    ? "border-blue-300 bg-blue-50"
                                    : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#22C55E] shadow-sm">
                                    <Plug size={15} />
                                  </span>
                                  <input
                                    type="radio"
                                    name={`connector-select-${charger.charger_id}`}
                                    checked={isSelected}
                                    disabled={!isSelectable}
                                    onChange={() => {
                                      setSelectedId(charger.charger_id);
                                      setSelectedConnectorId(
                                        connector.connector_id,
                                      );
                                    }}
                                    className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      Connector {connector.connector_number}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {connector.charge_point_id}
                                    </p>
                                    <p className="mt-1 text-xs font-medium text-gray-500">
                                      Status: {formatStatus(connector.status)}
                                    </p>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                          disabled={
                            !selectedForThisCharger ||
                            selectedConnector?.status !== "AVAILABLE" ||
                            actionLoading ||
                            !selectedConnector
                          }
                          onClick={handleStart}
                        >
                          {actionLoading &&
                          selectedForThisCharger &&
                          selectedConnector?.status === "AVAILABLE"
                            ? "Starting..."
                            : "Start Charging"}
                        </button>

                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            disabled={
                              !selectedForThisCharger ||
                              selectedConnector?.status !== "IN_CHARGING" ||
                              actionLoading ||
                              !selectedConnector
                            }
                            onClick={handleStop}
                          >
                            {actionLoading &&
                            selectedForThisCharger &&
                            selectedConnector?.status === "IN_CHARGING"
                              ? "Stopping..."
                              : "Stop Charging"}
                          </button>

                          <button
                            type="button"
                            className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                            disabled={
                              !selectedForThisCharger ||
                              selectedConnector?.status !== "AVAILABLE" ||
                              actionLoading ||
                              !selectedConnector
                            }
                            onClick={handleReserve}
                          >
                            {actionLoading &&
                            selectedForThisCharger &&
                            selectedConnector?.status === "AVAILABLE"
                              ? "Reserving..."
                              : "Reserve Slot"}
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
                            disabled={
                              !selectedForThisCharger ||
                              selectedConnector?.status !== "RESERVED" ||
                              actionLoading ||
                              !selectedConnector
                            }
                            onClick={handleRelease}
                          >
                            {actionLoading &&
                            selectedForThisCharger &&
                            selectedConnector?.status === "RESERVED"
                              ? "Releasing..."
                              : "Release Slot"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {lastSummary && (
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-base font-semibold text-gray-900">
                    Last Charging Bill
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">Invoice ID:</span>
                      <span className="font-medium text-gray-900">
                        {lastSummary.invoice_id ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">Charger:</span>
                      <span className="font-medium text-gray-900">
                        {lastSummary.charger_name ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">Connector:</span>
                      <span className="font-medium text-gray-900">
                        {lastSummary.connector_number ?? "-"}
                        {lastSummary.charge_point_id
                          ? ` (${lastSummary.charge_point_id})`
                          : ""}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">Energy Consumed:</span>
                      <span className="font-medium text-gray-900">
                        {lastSummary.total_energy_kwh ?? 0} kWh
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">Rate:</span>
                      <span className="font-medium text-gray-900">
                        {(lastSummary.currency || "NPR") + " "}
                        {lastSummary.price_per_kwh ?? 0}/kWh
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {(lastSummary.currency || "NPR") + " "}
                        {lastSummary.total_amount ?? 0}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {selectedCharger && (
                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-3 text-base font-semibold text-gray-900">
                    Connector Availability
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
                    {(selectedCharger.connectors || []).map((connector) => (
                      <div
                        key={connector.connector_id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="text-gray-900">
                          C{connector.connector_number} (
                          {connector.charge_point_id})
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(connector.status)}`}
                        >
                          {connector.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-gray-900">
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
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {reservation.charger_name} - Connector{" "}
                          {reservation.connector_number}
                        </p>
                        <p className="mt-1 text-xs text-gray-600">
                          Reserved by:{" "}
                          {reservation.reserved_by_user_name || "Unknown"}
                          {reservation.reserved_by_email
                            ? ` (${reservation.reserved_by_email})`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
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
            </section>

            {meterValues && (
              <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-gray-900">
                  Live Meter Values
                </h3>
                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                  <div className="space-y-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <h4 className="font-semibold text-blue-900">
                      Power & Energy
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Power:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.power_kw} kW
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reactive Power:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.reactive_power_kvar} kVAr
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Energy:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.energy_kwh} kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reactive Energy:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.reactive_energy_kvarh} kVArh
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <h4 className="font-semibold text-emerald-900">
                      Electrical
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Voltage:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.voltage_v} V
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.current_a} A
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Power Factor:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.power_factor}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.frequency_hz} Hz
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-orange-100 bg-orange-50 p-3">
                    <h4 className="font-semibold text-orange-900">
                      Environmental
                    </h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Temperature:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.temperature_c} C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">SOC:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.soc_percent} %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Connector:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.connector_number ?? "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction:</span>
                      <span className="font-medium text-gray-900">
                        {meterValues.transaction_id ?? "-"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:col-span-3">
                    <h4 className="font-semibold text-slate-900">Billing</h4>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tariff:</span>
                      <span className="font-medium text-gray-900">
                        {(meterValues.currency || "NPR") + " "}
                        {Number(meterValues.price_per_kwh ?? 0).toFixed(2)}/kWh
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Running Amount:</span>
                      <span className="font-semibold text-gray-900">
                        {(meterValues.currency || "NPR") + " "}
                        {Number(meterValues.running_amount ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-end text-sm">
                      <span className="text-gray-500">Updated At:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {new Date(meterValues.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {!loading && !error && chargers.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No chargers found.
          </div>
        )}
      </div>
    </main>
  );
}
