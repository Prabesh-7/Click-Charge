import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  cancelSlotReservation,
  getStationSlots,
  reserveSlot,
  type StationSlot,
} from "@/api/userApi";

export default function StationSlots() {
  const navigate = useNavigate();
  const { stationId } = useParams();
  const [searchParams] = useSearchParams();

  const currentUserId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const rawId = user?.user_id ?? user?.id ?? user?.sub;
      const parsed = Number(rawId);
      return Number.isFinite(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  const connectorFilter = searchParams.get("connector");
  const stationIdNum = Number(stationId);

  const [slots, setSlots] = useState<StationSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingSlotId, setActionLoadingSlotId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredSlots = useMemo(() => {
    const list = Number.isFinite(stationIdNum) ? slots : [];
    if (!connectorFilter) return list;
    return list.filter((slot) => String(slot.connector_id) === connectorFilter);
  }, [slots, connectorFilter, stationIdNum]);

  const grouped = useMemo(() => {
    const map = new Map<string, StationSlot[]>();
    filteredSlots
      .slice()
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      )
      .forEach((slot) => {
        const key = `${slot.charger_name}-${slot.connector_number}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(slot);
      });
    return [...map.entries()];
  }, [filteredSlots]);

  const fetchSlots = async () => {
    if (!Number.isFinite(stationIdNum)) {
      setError("Invalid station id.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getStationSlots(stationIdNum);
      setSlots(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load slots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSlots();
  }, [stationIdNum]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchSlots();
    }, 5000);

    return () => window.clearInterval(id);
  }, [stationIdNum]);

  const handleReserve = async (slotId: number) => {
    try {
      setActionLoadingSlotId(slotId);
      setError(null);
      setSuccess(null);
      await reserveSlot(slotId);
      setSuccess("Slot reserved successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to reserve slot.");
    } finally {
      setActionLoadingSlotId(null);
    }
  };

  const handleCancel = async (slotId: number) => {
    try {
      setActionLoadingSlotId(slotId);
      setError(null);
      setSuccess(null);
      await cancelSlotReservation(slotId);
      setSuccess("Reservation cancelled successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to cancel reservation.");
    } finally {
      setActionLoadingSlotId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book A Slot</h1>
              <p className="mt-1 text-sm text-gray-500">
                Select and reserve available slots for your visit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            Loading slots...
          </div>
        )}

        {!loading && grouped.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No slots found for this station.
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <div className="space-y-4">
            {grouped.map(([groupKey, groupSlots]) => (
              <section
                key={groupKey}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <h2 className="mb-3 text-base font-semibold text-gray-900">
                  {groupKey}
                </h2>

                <div className="space-y-2">
                  {groupSlots.map((slot) => {
                    const isOpen = slot.status === "OPEN";
                    const isReserved = slot.status === "RESERVED";
                    const isClosed = slot.status === "CLOSED";
                    const isOwnReservation =
                      isReserved &&
                      currentUserId !== null &&
                      slot.reserved_by_user_id === currentUserId;
                    const isActionLoading =
                      actionLoadingSlotId === slot.slot_id;

                    const statusClass = isOpen
                      ? "bg-emerald-100 text-emerald-700"
                      : isReserved
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700";

                    return (
                      <div
                        key={slot.slot_id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(slot.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(slot.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(slot.start_time).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {slot.status}
                          </span>

                          {isOpen && (
                            <button
                              type="button"
                              onClick={() => void handleReserve(slot.slot_id)}
                              disabled={isActionLoading}
                              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isActionLoading ? "Reserving..." : "Reserve"}
                            </button>
                          )}

                          {isOwnReservation && (
                            <button
                              type="button"
                              onClick={() => void handleCancel(slot.slot_id)}
                              disabled={isActionLoading}
                              className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {isActionLoading ? "Cancelling..." : "Cancel"}
                            </button>
                          )}

                          {isReserved && !isOwnReservation && (
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                              Reserved
                            </span>
                          )}

                          {isClosed && (
                            <span className="text-xs text-gray-400">
                              Not bookable
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
