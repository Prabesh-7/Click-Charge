import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, Plug, Timer, Zap } from "lucide-react";
import {
  getStationSlots,
  getUserStations,
  reserveSlot,
  type StationSlot,
  type UserStation,
  type UserStationConnector,
} from "@/api/userApi";
import { toast } from "sonner";

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSlotStatusClasses = (status: string) => {
  switch (status) {
    case "OPEN":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "RESERVED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "CLOSED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-gray-200 bg-gray-50 text-gray-500";
  }
};

const getFriendlySlotStatus = (status: string) => {
  switch (status) {
    case "OPEN":
      return "Available";
    case "RESERVED":
      return "Reserved";
    case "CLOSED":
      return "Closed";
    default:
      return status;
  }
};

export default function StationSlots() {
  const { stationId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [station, setStation] = useState<UserStation | null>(null);
  const [slots, setSlots] = useState<StationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservingSlotId, setReservingSlotId] = useState<number | null>(null);

  const selectedConnectorId = useMemo(() => {
    const raw = searchParams.get("connector");
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const fetchData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      const parsedStationId = Number(stationId);
      if (!Number.isFinite(parsedStationId)) {
        setError("Invalid station selected.");
        setStation(null);
        setSlots([]);
        return;
      }

      const [stationList, stationSlots] = await Promise.all([
        getUserStations(),
        getStationSlots(parsedStationId),
      ]);

      const selectedStation =
        stationList.find((item) => item.station_id === parsedStationId) || null;

      setStation(selectedStation);
      setSlots(stationSlots);
      setError(null);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to load slot data.");
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchData(true);

    const intervalId = window.setInterval(() => {
      void fetchData(false);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [stationId]);

  const stationConnectors = useMemo<UserStationConnector[]>(() => {
    if (!station) {
      return [];
    }

    return station.chargers.flatMap((charger) => charger.connectors || []);
  }, [station]);

  const visibleSlots = useMemo(() => {
    const sorted = [...slots].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

    if (!selectedConnectorId) {
      return sorted;
    }

    return sorted.filter((slot) => slot.connector_id === selectedConnectorId);
  }, [slots, selectedConnectorId]);

  const connectorLabel = useMemo(() => {
    if (selectedConnectorId === null) {
      return "All connectors";
    }

    const selectedConnector = stationConnectors.find(
      (connector) => connector.connector_id === selectedConnectorId,
    );

    if (!selectedConnector) {
      return `Connector ${selectedConnectorId}`;
    }

    return `Connector ${selectedConnector.connector_number}`;
  }, [selectedConnectorId, stationConnectors]);

  const handleReserveSlot = async (slotId: number) => {
    try {
      setReservingSlotId(slotId);
      await reserveSlot(slotId);
      toast.success("Slot reserved successfully.");
      await fetchData(false);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || "Failed to reserve this slot.";
      toast.error(message);
    } finally {
      setReservingSlotId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ecf5ff_0%,#f8fafc_42%,#f8fafc_100%)] px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (stationId) {
                      navigate(`/user/stations/${stationId}/availability`);
                      return;
                    }
                    navigate("/user/stations");
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                Slot Schedule
              </h1>
        
            </div>
            {station && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold text-gray-800">Station: </span>
                {station.station_name}
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && stationConnectors.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-500">
              Filter By Connector
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedConnectorId === null
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                All Connectors
              </button>

              {stationConnectors.map((connector) => (
                <button
                  key={connector.connector_id}
                  type="button"
                  onClick={() =>
                    setSearchParams({
                      connector: String(connector.connector_id),
                    })
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selectedConnectorId === connector.connector_id
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Connector {connector.connector_number}
                </button>
              ))}
            </div>
          </section>
        )}

  

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">
              {connectorLabel}
            </p>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-20 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
                  />
                ))}
              </div>
            ) : visibleSlots.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">
                No slots found for the selected connector.
              </div>
            ) : (
              <div className="space-y-3">
                {visibleSlots.map((slot) => {
                  const canReserve = slot.status === "OPEN";
                  const isReserving = reservingSlotId === slot.slot_id;

                  return (
                    <article
                      key={slot.slot_id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-gray-900">
                            {slot.charger_name} · Connector{" "}
                            {slot.connector_number}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-gray-600">
                            <CalendarClock size={13} />
                            {formatDateTime(slot.start_time)}
                          </p>
                          <p className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Timer size={13} />
                            Ends {formatDateTime(slot.end_time)}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSlotStatusClasses(slot.status)}`}
                          >
                            {getFriendlySlotStatus(slot.status)}
                          </span>

                          {canReserve ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleReserveSlot(slot.slot_id)
                              }
                              disabled={isReserving}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#16a34a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Zap size={13} />
                              {isReserving ? "Reserving..." : "Reserve Slot"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500"
                            >
                              <Plug size={13} />
                              Not available
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
