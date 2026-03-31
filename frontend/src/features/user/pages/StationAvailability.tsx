import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, ArrowLeft } from "lucide-react";
import {
  getUserStations,
  getStationSlots,
  reserveSlot,
  cancelSlotReservation,
  type UserStation,
  type StationSlot,
} from "@/api/userApi";
import { Button } from "@/components/ui/button";

export default function StationAvailability() {
  const { stationId } = useParams();
  const navigate = useNavigate();

  const [stations, setStations] = useState<UserStation[]>([]);
  const [slots, setSlots] = useState<StationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return typeof user.user_id === "number" ? user.user_id : null;
    } catch {
      return null;
    }
  }, []);

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
          err.response?.data?.detail || "Failed to load station availability.",
        );
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const fetchSlots = async (stationIdValue: number, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setSlotsLoading(true);
      }

      const data = await getStationSlots(stationIdValue);
      setSlots(data);
      setError(null);
    } catch (err: any) {
      if (isInitialLoad) {
        setError(err.response?.data?.detail || "Failed to load station slots.");
      }
    } finally {
      if (isInitialLoad) {
        setSlotsLoading(false);
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
      setSlots([]);
      setSlotsLoading(false);
      return;
    }

    void fetchSlots(selectedStation.station_id, true);

    const slotInterval = window.setInterval(() => {
      void fetchSlots(selectedStation.station_id, false);
    }, 3000);

    return () => {
      window.clearInterval(slotInterval);
    };
  }, [selectedStation?.station_id]);

  const handleReserve = async (slotId: number) => {
    try {
      setActionLoadingKey(`reserve-${slotId}`);
      setError(null);
      await reserveSlot(slotId);
      if (selectedStation) {
        await fetchSlots(selectedStation.station_id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reserve slot.");
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleCancelReservation = async (slotId: number) => {
    try {
      setActionLoadingKey(`cancel-${slotId}`);
      setError(null);
      await cancelSlotReservation(slotId);
      if (selectedStation) {
        await fetchSlots(selectedStation.station_id);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to cancel reservation.");
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Time Slot Availability
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Live slot updates every 3 seconds.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => navigate("/user/stations")}
          className="h-10 bg-gray-800 hover:bg-gray-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Stations
        </Button>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading stations...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && !selectedStation && (
        <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
          <p className="text-sm text-gray-600">Station not found.</p>
        </div>
      )}

      {!loading && !error && selectedStation && (
        <div className="space-y-4">
          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedStation.station_name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedStation.address}
            </p>
          </div>

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Bookable Slots
            </h3>

            {slotsLoading && (
              <p className="text-sm text-gray-500">Loading slots...</p>
            )}

            {!slotsLoading && slots.length === 0 && (
              <p className="text-sm text-gray-500">
                No time slots are available right now.
              </p>
            )}

            {!slotsLoading && slots.length > 0 && (
              <div className="space-y-2">
                {slots.map((slot) => {
                  const isOpen = slot.status === "OPEN";
                  const isReservedByMe =
                    slot.status === "RESERVED" &&
                    slot.reserved_by_user_id === currentUserId;
                  const isReservedByOther =
                    slot.status === "RESERVED" &&
                    slot.reserved_by_user_id !== currentUserId;
                  const reserveLoading =
                    actionLoadingKey === `reserve-${slot.slot_id}`;
                  const cancelLoading =
                    actionLoadingKey === `cancel-${slot.slot_id}`;

                  return (
                    <div
                      key={slot.slot_id}
                      className="border border-gray-200 rounded px-3 py-3 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {slot.charger_name} - Connector{" "}
                          {slot.connector_number}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                          <CalendarClock size={12} />
                          {new Date(slot.start_time).toLocaleString()} to{" "}
                          {new Date(slot.end_time).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Status: {slot.status}
                          {isReservedByOther && slot.reserved_by_user_name
                            ? ` | Reserved by ${slot.reserved_by_user_name}`
                            : ""}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          isReservedByMe
                            ? void handleCancelReservation(slot.slot_id)
                            : void handleReserve(slot.slot_id)
                        }
                        disabled={
                          isReservedByOther ||
                          slot.status === "CLOSED" ||
                          reserveLoading ||
                          cancelLoading ||
                          actionLoadingKey !== null
                        }
                        className={`px-3 py-1 rounded text-xs font-medium disabled:opacity-50 ${
                          isReservedByMe
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {reserveLoading
                          ? "Reserving..."
                          : cancelLoading
                            ? "Cancelling..."
                            : isReservedByMe
                              ? "Cancel My Reservation"
                              : isOpen
                                ? "Reserve Slot"
                                : "Unavailable"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
