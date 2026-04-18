import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Zap,
  MapPin,
  Phone,
  Plug,
  Battery,
  AlertCircle,
} from "lucide-react";
import {
  getUserStations,
  getStationSlots,
  type StationSlot,
  type UserStation,
  type UserStationCharger,
  type UserStationConnector,
} from "@/api/userApi";

export default function StationAvailability() {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [stations, setStations] = useState<UserStation[]>([]);
  const [stationSlots, setStationSlots] = useState<StationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedStation = useMemo(() => {
    const parsedStationId = Number(stationId);
    if (!Number.isFinite(parsedStationId)) {
      return stations[0] || null;
    }

    return (
      stations.find((station) => station.station_id === parsedStationId) || null
    );
  }, [stationId, stations]);

  const fetchStations = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }

      const data = await getUserStations();
      setStations(data);
      setError(null);
    } catch (err: any) {
      if (isInitialLoad) {
        setError(
          err.response?.data?.detail || "Failed to load station chargers.",
        );
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchStations(true);

    const stationInterval = window.setInterval(() => {
      void fetchStations(false);
    }, 3000);

    return () => {
      window.clearInterval(stationInterval);
    };
  }, []);

  useEffect(() => {
    if (!selectedStation) {
      setStationSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        const data = await getStationSlots(selectedStation.station_id);
        setStationSlots(data);
      } catch {
        // Slot timing is supplementary info; keep availability usable.
      }
    };

    void fetchSlots();

    const slotInterval = window.setInterval(() => {
      void fetchSlots();
    }, 5000);

    return () => window.clearInterval(slotInterval);
  }, [selectedStation]);

  const reservedSlotTimesByConnector = useMemo(() => {
    const now = Date.now();
    const map = new Map<number, Array<{ start: string; end: string }>>();

    stationSlots.forEach((slot) => {
      if (slot.status !== "RESERVED") return;

      const endMs = new Date(slot.end_time).getTime();
      if (endMs <= now) return;

      const list = map.get(slot.connector_id) || [];
      list.push({
        start: slot.start_time,
        end: slot.end_time,
      });
      map.set(slot.connector_id, list);
    });

    map.forEach((list, connectorId) => {
      list.sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
      );
      map.set(connectorId, list);
    });

    return map;
  }, [stationSlots]);

  const formatReservationWindow = (start: string, end: string) => {
    const formatFriendlyTime = (d: Date) => {
      return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${formatFriendlyTime(startDate)} to ${formatFriendlyTime(endDate)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-[#22C55E]/10 text-[#22C55E]";
      case "IN_CHARGING":
        return "bg-orange-100 text-orange-700";
      case "RESERVED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-500";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "border-[#22C55E]/20 bg-[#22C55E]/5 text-[#22C55E]";
      case "IN_CHARGING":
        return "border-orange-200 bg-orange-50 text-orange-700";
      case "RESERVED":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Plug size={16} className="shrink-0" />;
      case "IN_CHARGING":
        return <Battery size={16} className="shrink-0" />;
      case "RESERVED":
        return <AlertCircle size={16} className="shrink-0" />;
      default:
        return <Zap size={16} className="shrink-0" />;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => navigate("/user/stations")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              >
                <ArrowLeft size={18} />
              </button>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Available Chargers
            </h1>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            <p className="m-0">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl border border-gray-200 bg-white animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Station Not Found */}
        {!loading && !error && !selectedStation && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Zap size={22} />
            </div>
            <p className="text-base font-semibold text-gray-700">
              Station not found
            </p>
            <p className="mt-1 max-w-xs text-sm text-gray-500">
              The station you're looking for doesn't exist. Please go back and
              try again.
            </p>
          </div>
        )}

        {/* Station Content */}
        {!loading && !error && selectedStation && (
          <div className="space-y-6">
            {/* Station Header Card */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedStation.station_name}
                    </h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin size={14} className="shrink-0" />
                      {selectedStation.address}
                    </p>
                    {selectedStation.phone_number && (
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone size={14} className="shrink-0" />
                        {selectedStation.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                      Chargers
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedStation.available_chargers}
                      <span className="text-lg text-gray-500">
                        /{selectedStation.total_chargers}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                    Total Connectors
                  </p>
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#22C55E]/10 px-3 py-1.5 text-sm font-bold text-[#22C55E]">
                    {selectedStation.available_connectors}/
                    {selectedStation.total_connectors} Available
                  </div>
                </div>
              </div>
            </div>

            {/* Chargers Grid */}
            {selectedStation.chargers && selectedStation.chargers.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">
                    Chargers ({selectedStation.chargers.length})
                  </h3>
                  <p className="text-xs text-gray-500">Real-time status</p>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-2">
                  {selectedStation.chargers.map(
                    (charger: UserStationCharger) => {
                      const totalConnectors = charger.connectors?.length || 0;
                      const availableConnectors = (
                        charger.connectors || []
                      ).filter(
                        (connector) => connector.status === "AVAILABLE",
                      ).length;

                      return (
                        <div
                          key={charger.charger_id}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg"
                        >
                          <div className="border-b border-gray-100 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h4 className="truncate text-base font-bold text-gray-900">
                                  {charger.name}
                                </h4>
                                <p className="mt-1 text-xs text-gray-500">
                                  Type:{" "}
                                  <span className="font-semibold text-gray-700">
                                    {charger.type}
                                  </span>
                                </p>
                              </div>
                              <span
                                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeColor(charger.status)}`}
                              >
                                {getStatusIcon(charger.status)}
                                {charger.status}
                              </span>
                            </div>

                            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-xs font-semibold text-[#22C55E]">
                              {availableConnectors}/{totalConnectors} connectors
                              available
                            </div>
                          </div>

                          <div className="space-y-2 p-4">
                            {(charger.connectors || []).map(
                              (connector: UserStationConnector) => {
                                const reservationWindows =
                                  reservedSlotTimesByConnector.get(
                                    connector.connector_id,
                                  ) || [];

                                return (
                                  <div
                                    key={connector.connector_id}
                                    className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#22C55E] shadow-sm">
                                          <Plug size={15} />
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-gray-900">
                                            Connector{" "}
                                            {connector.connector_number}
                                          </p>
                                          <p
                                            className={`mt-0.5 inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${getStatusColor(connector.status)}`}
                                          >
                                            {getStatusIcon(connector.status)}
                                            {connector.status}
                                          </p>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigate(
                                            `/user/stations/${selectedStation.station_id}/slots?connector=${connector.connector_id}`,
                                          );
                                        }}
                                        className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                                      >
                                        View Slot
                                      </button>
                                    </div>

                                    {reservationWindows.length > 0 && (
                                      <div className="mt-2 space-y-1 pl-10">
                                        {reservationWindows.map(
                                          (window, index) => (
                                            <p
                                              key={`${connector.connector_id}-${window.start}-${index}`}
                                              className="text-xs text-amber-700"
                                            >
                                              Reserved from{" "}
                                              {formatReservationWindow(
                                                window.start,
                                                window.end,
                                              )}
                                            </p>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-16 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                  <Zap size={22} />
                </div>
                <p className="text-base font-semibold text-gray-700">
                  No chargers available
                </p>
                <p className="mt-1 max-w-xs text-sm text-gray-500">
                  This station doesn't have any chargers configured yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}