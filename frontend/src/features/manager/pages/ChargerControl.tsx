import { useEffect, useMemo, useState } from "react";
import { getMyChargers, startCharging } from "@/api/managerApi";
import { BatteryCharging, Plug, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const formatStatus = (status: string) => status.replace(/_/g, " ");

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
      toast.error("Failed to start charging.", {
        description: err.response?.data?.detail,
      });
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
              onClick={() => navigate("/manager/chargerControl/live-session")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              View Live Sessions
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  My Chargers
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Choose one available connector, then start charging.
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
                  selectedChargerId === charger.charger_id;

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
                          const isSelectable = connector.status === "AVAILABLE";

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
                                    setSelectedChargerId(charger.charger_id);
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
                        className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                        disabled={
                          actionLoading ||
                          !selectedForThisCharger ||
                          selectedConnector === null
                        }
                        onClick={() => void handleStartCharging()}
                      >
                        {actionLoading ? "Starting..." : "Start Charging"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
