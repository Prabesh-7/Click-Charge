import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getChargerMeterValuesByStaff,
  getMyChargersByStaff,
  stopChargingByStaff,
} from "@/api/staffApi";
import { toast } from "sonner";

type MeterValues = {
  connector_number?: number | null;
  transaction_id?: number | null;
  power_kw: number;
  voltage_v: number;
  current_a: number;
  energy_kwh: number;
  price_per_kwh?: number;
  running_amount?: number;
  currency?: string;
  soc_percent: number;
  timestamp: string;
};

type ChargingInvoice = {
  invoice_id: string;
  issued_at: string;
  currency: string;
  charger_id: number;
  charger_name: string;
  connector_id: number;
  connector_number: number;
  charge_point_id: string;
  total_energy_kwh: number;
  price_per_kwh: number;
  total_amount: number;
};

type LiveSessionState = {
  chargerId: number;
  connectorId: number;
  chargerName: string;
  connectorNumber: number;
  connectorLabel: string;
};

type Charger = {
  charger_id: number;
  name: string;
  charge_point_id: string;
  type: "CCS2" | "GBT" | "TYPE2" | "CHAdeMO";
  max_power_kw: number;
  connectors: {
    connector_id: number;
    connector_number: number;
    charge_point_id: string;
    status: "AVAILABLE" | "IN_CHARGING" | "RESERVED";
  }[];
};

type ActiveConnector = {
  chargerId: number;
  chargerName: string;
  chargerType: Charger["type"];
  maxPowerKw: number;
  connectorId: number;
  connectorNumber: number;
  connectorLabel: string;
};

export default function StaffLiveSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const preferredSession =
    (location.state as LiveSessionState | undefined) ?? null;

  const [chargers, setChargers] = useState<Charger[]>([]);
  const [meterByConnector, setMeterByConnector] = useState<
    Record<string, MeterValues | undefined>
  >({});
  const [loading, setLoading] = useState(true);
  const [stopLoadingKey, setStopLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latestInvoice, setLatestInvoice] = useState<ChargingInvoice | null>(
    null,
  );

  const activeConnectors = useMemo<ActiveConnector[]>(() => {
    const list: ActiveConnector[] = [];
    chargers.forEach((charger) => {
      (charger.connectors || []).forEach((connector) => {
        if (connector.status === "IN_CHARGING") {
          list.push({
            chargerId: charger.charger_id,
            chargerName: charger.name,
            chargerType: charger.type,
            maxPowerKw: charger.max_power_kw,
            connectorId: connector.connector_id,
            connectorNumber: connector.connector_number,
            connectorLabel: connector.charge_point_id,
          });
        }
      });
    });

    if (!preferredSession) return list;

    return [...list].sort((a, b) => {
      const aPreferred =
        a.chargerId === preferredSession.chargerId &&
        a.connectorId === preferredSession.connectorId;
      const bPreferred =
        b.chargerId === preferredSession.chargerId &&
        b.connectorId === preferredSession.connectorId;
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      return 0;
    });
  }, [chargers, preferredSession]);

  const meterKey = (chargerId: number, connectorId: number) =>
    `${chargerId}:${connectorId}`;

  const fetchChargers = async () => {
    try {
      setLoading(true);
      const data = await getMyChargersByStaff();
      setChargers(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load active sessions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMeterValues = async (sessions: ActiveConnector[]) => {
    if (sessions.length === 0) {
      setMeterByConnector({});
      return;
    }

    const results = await Promise.all(
      sessions.map(async (item) => {
        try {
          const data = await getChargerMeterValuesByStaff(
            item.chargerId,
            item.connectorId,
          );
          return { key: meterKey(item.chargerId, item.connectorId), data };
        } catch {
          return {
            key: meterKey(item.chargerId, item.connectorId),
            data: undefined,
          };
        }
      }),
    );

    setMeterByConnector((prev) => {
      const next = { ...prev };
      results.forEach(({ key, data }) => {
        next[key] = data;
      });
      return next;
    });
  };

  useEffect(() => {
    void fetchChargers();
  }, []);

  useEffect(() => {
    void fetchAllMeterValues(activeConnectors);

    const meterInterval = window.setInterval(() => {
      void fetchAllMeterValues(activeConnectors);
    }, 3000);

    return () => window.clearInterval(meterInterval);
  }, [activeConnectors]);

  useEffect(() => {
    const chargerInterval = window.setInterval(() => {
      void fetchChargers();
    }, 5000);

    return () => window.clearInterval(chargerInterval);
  }, []);

  const handleStopCharging = async (chargerId: number, connectorId: number) => {
    const key = meterKey(chargerId, connectorId);

    try {
      setStopLoadingKey(key);
      const response = await stopChargingByStaff(chargerId, connectorId);
      if (response?.invoice) {
        const invoice = response.invoice as ChargingInvoice;
        setLatestInvoice(invoice);
        toast.success("Charging stopped successfully.", {
          description: `Invoice ${invoice.invoice_id} | Total ${invoice.currency} ${invoice.total_amount}`,
        });
      }
      await fetchChargers();
    } catch (err: any) {
      toast.error("Failed to stop charging.", {
        description: err.response?.data?.detail,
      });
    } finally {
      setStopLoadingKey(null);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
        <div className="mx-auto max-w-3xl rounded-md border border-gray-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-gray-900">Live Sessions</h1>
          <p className="mt-1.5 text-sm text-gray-600">
            Loading active charging sessions...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Live Sessions
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monitor and control all charging connectors in real time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/staff/chargerControl")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back To Charger Control
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {latestInvoice && (
          <section className="rounded-md border border-green-200 bg-green-50 p-4">
            <h2 className="text-base font-semibold text-green-900">
              Latest Invoice
            </h2>
            <div className="mt-2 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
              <p className="text-green-900">
                Invoice: {latestInvoice.invoice_id}
              </p>
              <p className="text-green-900">
                Charger: {latestInvoice.charger_name}
              </p>
              <p className="text-green-900">
                Connector: {latestInvoice.connector_number} (
                {latestInvoice.charge_point_id})
              </p>
              <p className="text-green-900">
                Energy: {latestInvoice.total_energy_kwh} kWh
              </p>
              <p className="text-green-900">
                Rate: {latestInvoice.currency} {latestInvoice.price_per_kwh}/kWh
              </p>
              <p className="font-semibold text-green-900">
                Total: {latestInvoice.currency} {latestInvoice.total_amount}
              </p>
            </div>
          </section>
        )}

        {activeConnectors.length === 0 && (
          <section className="rounded-md border border-gray-200 bg-white p-8 text-center text-gray-600">
            No active charging sessions right now.
          </section>
        )}

        {activeConnectors.length > 0 && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeConnectors.map((item) => {
              const key = meterKey(item.chargerId, item.connectorId);
              const meter = meterByConnector[key];
              const isStopping = stopLoadingKey === key;

              return (
                <article
                  key={key}
                  className="rounded-md border border-gray-200 bg-white p-5"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">
                        {item.chargerName}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {item.chargerType} • {item.maxPowerKw} kW
                      </p>
                      <p className="text-xs text-gray-500">
                        Connector {item.connectorNumber} • {item.connectorLabel}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                      IN CHARGING
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-gray-500">Power</p>
                      <p className="font-semibold text-gray-900">
                        {meter?.power_kw ?? "-"} kW
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-gray-500">Voltage</p>
                      <p className="font-semibold text-gray-900">
                        {meter?.voltage_v ?? "-"} V
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-gray-500">Current</p>
                      <p className="font-semibold text-gray-900">
                        {meter?.current_a ?? "-"} A
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-gray-500">Energy</p>
                      <p className="font-semibold text-gray-900">
                        {meter?.energy_kwh ?? "-"} kWh
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-gray-500">SOC</p>
                      <p className="font-semibold text-gray-900">
                        {meter?.soc_percent ?? "-"} %
                      </p>
                    </div>
                    <div className="rounded-md bg-green-50 px-3 py-2">
                      <p className="text-green-700">Tariff</p>
                      <p className="font-semibold text-green-900">
                        {(meter?.currency || "NPR") + " "}
                        {Number(meter?.price_per_kwh ?? 0).toFixed(2)}/kWh
                      </p>
                    </div>
                    <div className="rounded-md bg-green-50 px-3 py-2">
                      <p className="text-green-700">Running Amount</p>
                      <p className="font-semibold text-green-900">
                        {(meter?.currency || "NPR") + " "}
                        {Number(meter?.running_amount ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-md bg-gray-50 px-3 py-2">
                      <p className="text-gray-500">Updated</p>
                      <p className="font-semibold text-gray-900">
                        {meter?.timestamp
                          ? new Date(meter.timestamp).toLocaleTimeString()
                          : "Waiting..."}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void handleStopCharging(item.chargerId, item.connectorId)
                    }
                    disabled={isStopping}
                    className="mt-3 w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isStopping ? "Stopping..." : "Stop Charging"}
                  </button>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
