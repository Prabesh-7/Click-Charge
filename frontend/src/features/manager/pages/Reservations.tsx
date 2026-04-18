import { useEffect, useMemo, useState } from "react";
import {
  getManagerSlots,
  releaseManagerSlotReservation,
  sendManagerSlotCancelConfirmation,
  sendManagerSlotConfirmation,
  type Slot,
} from "@/api/managerApi";
import { toast } from "sonner";

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
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getActionKey = (
    slotId: number,
    action: "release" | "confirm" | "cancel-confirm",
  ) => `${slotId}:${action}`;

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
      setActionLoadingKey(getActionKey(slotId, "release"));
      setError(null);
      setSuccess(null);
      await releaseManagerSlotReservation(slotId);
      const message = "Reservation released successfully.";
      setSuccess(message);
      toast.success(message);
      await fetchSlots();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to release reservation.";
      setError(message);
      toast.error("Release failed.", { description: message });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleSendConfirmation = async (slotId: number) => {
    try {
      setActionLoadingKey(getActionKey(slotId, "confirm"));
      setError(null);
      setSuccess(null);
      await sendManagerSlotConfirmation(slotId);
      const message = "Confirmation email sent successfully.";
      setSuccess(message);
      toast.success(message);
      await fetchSlots();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to send confirmation email.";
      setError(message);
      toast.error("Confirmation failed.", { description: message });
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleSendCancelConfirmation = async (slotId: number) => {
    try {
      setActionLoadingKey(getActionKey(slotId, "cancel-confirm"));
      setError(null);
      setSuccess(null);

      const response = await sendManagerSlotCancelConfirmation(slotId);
      const emailStatus = response?.email_status;

      if (typeof emailStatus === "string" && emailStatus.trim()) {
        toast.warning("Reservation cancelled and refunded.", {
          description: emailStatus,
        });
      } else {
        toast.success("Reservation cancelled and refunded.", {
          description: "Cancellation email sent to user.",
        });
      }

      await fetchSlots();
    } catch (err: any) {
      toast.error("Cancellation failed.", {
        description:
          err.response?.data?.detail ||
          "Failed to cancel reservation and send cancellation email.",
      });
    } finally {
      setActionLoadingKey(null);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {loading && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            Loading reservations...
          </div>
        )}

        {!loading && reservedSlots.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            No active reservations.
          </div>
        )}

        {!loading && reservedSlots.length > 0 && (
          <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
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

            <div className="space-y-4 p-5 md:p-6">
              {groupedReservations.map((chargerGroup) => {
                const connectorNumbers = Array.from(
                  new Set(
                    chargerGroup.slots.map((slot) => slot.connector_number),
                  ),
                );

                return (
                  <section
                    key={chargerGroup.charger_id}
                    className="overflow-hidden rounded-md border border-gray-200 bg-white"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-4 py-4">
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
                          className="grid grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_auto] md:items-center"
                        >
                          <div className="flex items-center gap-4">
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
                            <p className="mt-1 text-xs text-gray-500">
                              {slot.reserved_by_email || "No email available"}
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
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                              Reserved
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                void handleSendConfirmation(slot.slot_id)
                              }
                              disabled={
                                actionLoadingKey !== null ||
                                !slot.reserved_by_email
                              }
                              className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoadingKey ===
                              getActionKey(slot.slot_id, "confirm")
                                ? "Sending..."
                                : "Send confirmation"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleSendCancelConfirmation(slot.slot_id)
                              }
                              disabled={actionLoadingKey !== null}
                              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                            >
                              {actionLoadingKey ===
                              getActionKey(slot.slot_id, "cancel-confirm")
                                ? "Cancelling..."
                                : "Send cancel confirmation"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRelease(slot.slot_id)}
                              disabled={actionLoadingKey !== null}
                              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 disabled:opacity-50"
                            >
                              {actionLoadingKey ===
                              getActionKey(slot.slot_id, "release")
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
