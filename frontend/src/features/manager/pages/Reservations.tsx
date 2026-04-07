import { useEffect, useMemo, useState } from "react";
import {
  getManagerSlots,
  releaseManagerSlotReservation,
  type Slot,
} from "@/api/managerApi";

const getTodayDateParam = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatClock = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTimeRange = (startTime: string, endTime: string) =>
  `${formatClock(startTime)} - ${formatClock(endTime)}`;

const getInitials = (name: string | null) => {
  const safeName = (name || "Unknown user").trim();
  const parts = safeName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getDisplayName = (name: string | null) => {
  if (!name) return "Unknown user";
  const trimmed = name.trim();
  if (!trimmed) return "Unknown user";
  return trimmed;
};

const formatDuration = (startTime: string, endTime: string) => {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const diffMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
};

export default function Reservations() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reservedSlots = useMemo(
    () =>
      slots
        .filter((slot) => slot.status === "RESERVED")
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        ),
    [slots],
  );

  const reservationsWithPhone = useMemo(
    () =>
      reservedSlots.filter((slot) => Boolean(slot.reserved_by_phone_number))
        .length,
    [reservedSlots],
  );

  const nextReservation = reservedSlots[0] ?? null;

  const groupedReservations = useMemo(() => {
    const grouped = new Map<
      number,
      {
        charger_id: number;
        charger_name: string;
        charger_type: string;
        slots: Slot[];
      }
    >();

    reservedSlots.forEach((slot) => {
      const existing = grouped.get(slot.charger_id);
      if (existing) {
        existing.slots.push(slot);
        return;
      }

      grouped.set(slot.charger_id, {
        charger_id: slot.charger_id,
        charger_name: slot.charger_name,
        charger_type: slot.charger_type,
        slots: [slot],
      });
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.charger_name.localeCompare(b.charger_name),
    );
  }, [reservedSlots]);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getManagerSlots(getTodayDateParam());
      setSlots(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load reservations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSlots();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchSlots();
    }, 5000);

    return () => window.clearInterval(id);
  }, []);

  const handleRelease = async (slotId: number) => {
    try {
      setActionLoadingId(slotId);
      setError(null);
      setSuccess(null);
      await releaseManagerSlotReservation(slotId);
      setSuccess("Reservation released successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to release reservation.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
              <p className="mt-1 text-sm text-gray-600">
                Simple and easy view of today&apos;s reservations.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                This page refreshes every 5 seconds.
              </p>
            </div>
            <p className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
              {todayLabel()}
            </p>
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
            Loading reservations...
          </div>
        )}

        {!loading && reservedSlots.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No active reservations.
          </div>
        )}

        {!loading && reservedSlots.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Charger Reservations
                </h2>
                <p className="text-xs text-gray-500">
                  Grouped by charger for easier connector-level viewing.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  Total {reservedSlots.length}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  Contact {reservationsWithPhone}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  Next{" "}
                  {nextReservation
                    ? formatClock(nextReservation.start_time)
                    : "None"}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 md:p-5">
              {groupedReservations.map((chargerGroup) => {
                const connectorNumbers = Array.from(
                  new Set(
                    chargerGroup.slots.map((slot) => slot.connector_number),
                  ),
                );

                return (
                  <section
                    key={chargerGroup.charger_id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {chargerGroup.charger_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {chargerGroup.charger_type} •{" "}
                          {chargerGroup.slots.length} slot
                          {chargerGroup.slots.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {connectorNumbers.map((connectorNumber) => (
                          <span
                            key={connectorNumber}
                            className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-700"
                          >
                            Connector {connectorNumber}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {chargerGroup.slots.map((slot) => (
                        <article
                          key={slot.slot_id}
                          className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:items-center"
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                              {getInitials(slot.reserved_by_user_name)}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {getDisplayName(slot.reserved_by_user_name)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(slot.start_time)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Contact
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                              {slot.reserved_by_phone_number || "Not provided"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Time / Duration
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {formatTimeRange(slot.start_time, slot.end_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDuration(slot.start_time, slot.end_time)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                              Reserved
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleRelease(slot.slot_id)}
                              disabled={actionLoadingId === slot.slot_id}
                              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                            >
                              {actionLoadingId === slot.slot_id
                                ? "Releasing..."
                                : "Release"}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
