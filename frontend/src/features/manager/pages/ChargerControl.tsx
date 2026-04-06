import { useEffect, useMemo, useState } from "react";
import { getMyChargers, startCharging } from "@/api/managerApi";
import { BatteryCharging, Plug, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

type Charger = {
  charger_id: number;
  name: string;
  charge_point_id: string;
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO";
  price_per_kwh: number;
  max_power_kw: number;
  connectors: {
    connector_id: number;
    connector_number: number;
    charge_point_id: string;
    status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  }[];
};

export default function ChargerControl() {
  const navigate = useNavigate();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedChargerId, setSelectedChargerId] = useState<number | null>(
    null,
  );
  const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(
    null,
  );
  const [isConnectorDialogOpen, setIsConnectorDialogOpen] = useState(false);

  const selectedCharger = useMemo(
    () =>
      chargers.find((charger) => charger.charger_id === selectedChargerId) ||
      null,
    [chargers, selectedChargerId],
  );

  const chargerConnectors = useMemo(
    () => selectedCharger?.connectors || [],
    [selectedCharger],
  );

  const selectableConnectors = useMemo(
    () =>
      chargerConnectors.filter((connector) => connector.status === "AVAILABLE"),
    [chargerConnectors],
  );

  const selectedConnector = useMemo(
    () =>
      chargerConnectors.find(
        (connector) =>
          connector.connector_id === selectedConnectorId &&
          connector.status === "AVAILABLE",
      ) || null,
    [chargerConnectors, selectedConnectorId],
  );

  const fetchChargers = async () => {
    try {
      setLoading(true);
      const data = await getMyChargers();
      setChargers(data);
      setError(null);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setChargers([]);
        setError(null);
        return;
      }
      setError(err.response?.data?.detail || "Failed to load chargers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChargers();
  }, []);

  useEffect(() => {
    if (
      selectedChargerId &&
      !chargers.some((item) => item.charger_id === selectedChargerId)
    ) {
      setSelectedChargerId(chargers[0]?.charger_id ?? null);
    }
  }, [chargers, selectedChargerId]);

  useEffect(() => {
    if (!selectedCharger) return;

    if (
      selectedConnectorId &&
      selectableConnectors.some(
        (connector) => connector.connector_id === selectedConnectorId,
      )
    ) {
      return;
    }

    setSelectedConnectorId(selectableConnectors[0]?.connector_id ?? null);
  }, [selectedCharger, selectableConnectors, selectedConnectorId]);

  const handleStartCharging = async () => {
    if (!selectedCharger || !selectedConnector) return;

    try {
      setActionLoading(true);
      const response = await startCharging(
        selectedCharger.charger_id,
        selectedConnector.connector_id,
      );
      const updated = response.charger;

      setChargers((prev) =>
        prev.map((item) =>
          item.charger_id === updated.charger_id ? updated : item,
        ),
      );

      setIsConnectorDialogOpen(false);
      navigate("/manager/chargerControl/live-session", {
        state: {
          chargerId: selectedCharger.charger_id,
          connectorId: selectedConnector.connector_id,
          chargerName: selectedCharger.name,
          connectorNumber: selectedConnector.connector_number,
          connectorLabel: selectedConnector.charge_point_id,
        },
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to start charging.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">
              Charger Control
            </h1>
            <button
              type="button"
              onClick={() => navigate("/manager/chargerControl/live-session")}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              View Live Sessions
            </button>
          </div>
          <p className="mt-1.5 text-sm text-slate-600">
            Select a charger to view connectors, then start charging.
          </p>
        </section>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
            Loading chargers...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
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
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              My Chargers
            </h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
              {chargers.map((charger) => {
                const availableCount = (charger.connectors || []).filter(
                  (connector) => connector.status === "AVAILABLE",
                ).length;
                const chargingCount = (charger.connectors || []).filter(
                  (connector) => connector.status === "IN_CHARGING",
                ).length;
                const totalConnectors = charger.connectors?.length || 0;

                const statusClass =
                  availableCount > 0
                    ? "bg-emerald-100 text-emerald-700"
                    : chargingCount > 0
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700";

                const statusLabel =
                  availableCount > 0
                    ? `${availableCount}/${totalConnectors} Available`
                    : chargingCount > 0
                      ? `0/${totalConnectors} Available`
                      : `0/${totalConnectors} Available`;

                return (
                  <button
                    key={charger.charger_id}
                    type="button"
                    onClick={() => {
                      const availableForCharger = (
                        charger.connectors || []
                      ).filter((connector) => connector.status === "AVAILABLE");
                      setSelectedChargerId(charger.charger_id);
                      setSelectedConnectorId(
                        availableForCharger[0]?.connector_id ?? null,
                      );
                      setIsConnectorDialogOpen(true);
                    }}
                    className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm transition-all duration-200 hover:shadow-lg"
                  >
                    <div className="border-b border-gray-100 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-bold text-gray-900">
                            {charger.name}
                          </h3>
                          <p className="mt-1 text-xs text-gray-500">
                            Charge Point:{" "}
                            <span className="font-semibold text-gray-700">
                              {charger.charge_point_id}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Tariff:{" "}
                            <span className="font-semibold text-gray-700">
                              Rs {Number(charger.price_per_kwh ?? 0).toFixed(2)}
                              /kWh
                            </span>
                          </p>
                        </div>
                        <span
                          className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
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
                    </div>

                    <div className="space-y-2 p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                          Connectors
                        </p>
                        <span className="rounded-md bg-[#22C55E]/10 px-2 py-1 text-xs font-bold text-[#22C55E]">
                          {availableCount}/{totalConnectors} free
                        </span>
                      </div>

                      {(charger.connectors || [])
                        .slice(0, 3)
                        .map((connector) => (
                          <div
                            key={connector.connector_id}
                            className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#22C55E] shadow-sm">
                                <Plug size={15} />
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900">
                                  Connector {connector.connector_number}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {connector.charge_point_id}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                                connector.status === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : connector.status === "IN_CHARGING"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {connector.status === "IN_CHARGING"
                                ? "IN CHARGING"
                                : connector.status.replace("_", " ")}
                            </span>
                          </div>
                        ))}

                      {totalConnectors > 3 && (
                        <p className="text-xs font-medium text-gray-500">
                          +{totalConnectors - 3} more connectors
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <Dialog
          open={isConnectorDialogOpen && !!selectedCharger}
          onOpenChange={(open) => {
            setIsConnectorDialogOpen(open);
            if (!open) {
              setSelectedChargerId(null);
              setSelectedConnectorId(null);
            }
          }}
        >
          <DialogContent className="max-w-lg border border-slate-200 bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Select Connector
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600">
                {selectedCharger
                  ? `${selectedCharger.name} • ${selectedCharger.type} • ${selectedCharger.max_power_kw} kW • Rs ${Number(selectedCharger.price_per_kwh ?? 0).toFixed(2)}/kWh`
                  : "Choose one available connector."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {chargerConnectors.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  No connectors found for this charger.
                </div>
              )}

              {chargerConnectors.length > 0 &&
                selectableConnectors.length === 0 && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    No available connectors on this charger right now. You can
                    monitor running sessions from Live Sessions.
                  </div>
                )}

              {chargerConnectors.map((connector) => {
                const isSelectable = connector.status === "AVAILABLE";
                const statusText =
                  connector.status === "AVAILABLE"
                    ? "Available"
                    : connector.status === "IN_CHARGING"
                      ? "IN CHARGING"
                      : "Reserved";
                const statusBadgeClass =
                  connector.status === "AVAILABLE"
                    ? "bg-emerald-100 text-emerald-700"
                    : connector.status === "IN_CHARGING"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-amber-100 text-amber-700";

                return (
                  <label
                    key={connector.connector_id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2.5 ${
                      isSelectable
                        ? "cursor-pointer border-slate-200 bg-slate-50"
                        : "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="connector"
                        checked={selectedConnectorId === connector.connector_id}
                        disabled={!isSelectable}
                        onChange={() =>
                          setSelectedConnectorId(connector.connector_id)
                        }
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {connector.connector_number}.{" "}
                          {connector.charge_point_id}
                        </p>
                        <p className="text-xs text-slate-500">
                          DC {selectedCharger?.max_power_kw} kW
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass}`}
                    >
                      {statusText}
                    </span>
                  </label>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => void handleStartCharging()}
              disabled={!selectedConnector || actionLoading}
              className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actionLoading ? "Starting..." : "Start Charging"}
            </button>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
