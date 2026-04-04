import { useEffect, useMemo, useState } from "react";
import {
  getManagerSlots,
  releaseManagerSlotReservation,
  type Slot,
} from "@/api/managerApi";

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

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getManagerSlots();
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
      <div className="mx-auto max-w-6xl space-y-4">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage all current slot reservations for your station.
          </p>
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
          <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            {reservedSlots.map((slot) => (
              <div
                key={slot.slot_id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {slot.charger_name} - Connector {slot.connector_number}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    {new Date(slot.start_time).toLocaleString()} to{" "}
                    {new Date(slot.end_time).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Reserved by: {slot.reserved_by_user_name || "Unknown"}
                    {slot.reserved_by_email
                      ? ` (${slot.reserved_by_email})`
                      : ""}
                    {slot.reserved_by_phone_number
                      ? ` | Contact: ${slot.reserved_by_phone_number}`
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRelease(slot.slot_id)}
                  disabled={actionLoadingId === slot.slot_id}
                  className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
                >
                  {actionLoadingId === slot.slot_id
                    ? "Releasing..."
                    : "Release"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
