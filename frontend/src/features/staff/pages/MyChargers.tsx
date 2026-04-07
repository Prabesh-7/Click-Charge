import { useEffect, useMemo, useState } from "react";
import { Plug, Zap } from "lucide-react";
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

const formatStatus = (value: string) => value.replace(/_/g, " ");

const getStatusColor = (status: string) => {
  switch (status) {
    case "AVAILABLE":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "IN_CHARGING":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "RESERVED":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
};

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

    void fetchChargers();
  }, []);

  const summary = useMemo(() => {
    const totalConnectors = chargers.reduce(
      (count, charger) => count + (charger.connectors?.length || 0),
      0,
    );
    const availableConnectors = chargers.reduce(
      (count, charger) =>
        count +
        (charger.connectors || []).filter(
          (connector) => connector.status === "AVAILABLE",
        ).length,
      0,
    );

    return {
      totalChargers: chargers.length,
      totalConnectors,
      availableConnectors,
    };
  }, [chargers]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">
                  Staff Operations
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                My Chargers
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                View chargers assigned to your station.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Chargers
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {summary.totalChargers}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Connectors
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {summary.totalConnectors}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Available
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {summary.availableConnectors}
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            Loading chargers...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {chargers.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Zap size={22} />
                </div>
                <p className="text-base font-semibold text-gray-700">
                  No chargers found for your station.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
                {chargers.map((charger) => {
                  const availableCount = charger.connectors.filter(
                    (connector) => connector.status === "AVAILABLE",
                  ).length;

                  return (
                    <article
                      key={charger.charger_id}
                      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="border-b border-gray-100 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-lg font-bold text-gray-900">
                              {charger.name}
                            </h3>
                            <p className="mt-1 text-xs text-gray-500">
                              Charge Point: {charger.charge_point_id}
                            </p>
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(charger.status)}`}
                          >
                            {formatStatus(charger.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
                          <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                            <p className="text-gray-500">Type</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {charger.type}
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-2.5 py-2">
                            <p className="text-gray-500">Max Power</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {charger.max_power_kw} kW
                            </p>
                          </div>
                          <div className="rounded-lg bg-gray-50 px-2.5 py-2 col-span-2 sm:col-span-1">
                            <p className="text-gray-500">Available</p>
                            <p className="mt-1 font-semibold text-gray-800">
                              {availableCount}/{charger.connectors?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                          <Plug size={14} className="text-emerald-600" />
                          Connectors
                        </div>

                        {charger.connectors.length === 0 ? (
                          <p className="text-sm text-gray-500">
                            No connectors configured.
                          </p>
                        ) : (
                          charger.connectors.map((connector) => (
                            <div
                              key={connector.connector_id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  Connector {connector.connector_number}
                                </p>
                                <p className="truncate text-xs text-gray-500">
                                  {connector.charge_point_id}
                                </p>
                              </div>
                              <span
                                className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusColor(connector.status)}`}
                              >
                                {formatStatus(connector.status)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
