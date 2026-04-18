import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Clock3,
  History,
  MapPin,
  PlugZap,
  ReceiptText,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  getUserReservations,
  payPendingReservationAmount,
  type UserReservationItem,
} from "@/api/userApi";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useClientPagination } from "@/hooks/useClientPagination";
import { toast } from "sonner";

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatShortDate = (value: string | null) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeRange = (startTime: string | null, endTime: string | null) => {
  if (!startTime || !endTime) {
    return "Open-ended";
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Open-ended";
  }

  return `${start.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${end.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const getStatusClasses = (status: UserReservationItem["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "RELEASED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "EXPIRED":
      return "border-orange-200 bg-orange-50 text-orange-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
};

const getTypeLabel = (
  reservationType: UserReservationItem["reservation_type"],
) =>
  reservationType === "SLOT" ? "Slot reservation" : "Connector reservation";

export default function MyReservations() {
  const [reservations, setReservations] = useState<UserReservationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingReservationId, setPayingReservationId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [showPreviousReservations, setShowPreviousReservations] =
    useState(false);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await getUserReservations();
      setReservations(data);
      setError(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || "Failed to load your reservations.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchReservations();
  }, []);

  const handlePayPending = async (reservationId: number) => {
    try {
      setPayingReservationId(reservationId);
      const result = await payPendingReservationAmount(reservationId);
      toast.success(result.message, {
        description: `Paid NPR ${result.paid_amount.toFixed(2)} | Balance NPR ${result.remaining_balance.toFixed(2)}`,
      });
      await fetchReservations();
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        "Failed to pay pending amount from wallet.";
      toast.error("Payment failed", { description: message });
    } finally {
      setPayingReservationId(null);
    }
  };

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const left = a.reserved_at ? new Date(a.reserved_at).getTime() : 0;
      const right = b.reserved_at ? new Date(b.reserved_at).getTime() : 0;
      return right - left;
    });
  }, [reservations]);

  const todayWindow = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    return { start, end };
  }, []);

  const getReservationTimestamp = (reservation: UserReservationItem) => {
    const sourceValue = reservation.start_time || reservation.reserved_at;
    if (!sourceValue) {
      return null;
    }

    const parsed = new Date(sourceValue);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed;
  };

  const currentDayReservations = useMemo(
    () =>
      sortedReservations.filter((reservation) => {
        const timestamp = getReservationTimestamp(reservation);
        if (!timestamp) {
          return false;
        }

        return timestamp >= todayWindow.start && timestamp < todayWindow.end;
      }),
    [sortedReservations, todayWindow.end, todayWindow.start],
  );

  const pastReservations = useMemo(
    () =>
      sortedReservations.filter((reservation) => {
        const timestamp = getReservationTimestamp(reservation);
        if (!timestamp) {
          return false;
        }

        return timestamp < todayWindow.start;
      }),
    [sortedReservations, todayWindow.start],
  );

  const visibleReservations = showPreviousReservations
    ? pastReservations
    : currentDayReservations;

  const summary = useMemo(() => {
    const active = currentDayReservations.filter(
      (reservation) => reservation.status === "ACTIVE",
    ).length;
    const upcoming = currentDayReservations.filter(
      (reservation) =>
        reservation.status === "ACTIVE" && Boolean(reservation.start_time),
    ).length;
    const completed = currentDayReservations.filter(
      (reservation) => reservation.status === "COMPLETED",
    ).length;

    return { active, upcoming, completed };
  }, [currentDayReservations]);

  const {
    paginatedItems: paginatedReservations,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
    pageSizeOptions,
    setCurrentPage,
    setPageSize,
  } = useClientPagination(visibleReservations, {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    resetOnChange: [showPreviousReservations],
  });

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Reservations</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Review today’s reservations first, then switch to previous history
            when needed.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={14} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <div className="h-112 animate-pulse rounded-xl border border-gray-100 bg-white" />
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-xl border border-gray-100 bg-white" />
              <div className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white" />
            </div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
            <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {showPreviousReservations
                      ? "Previous Reservations"
                      : "Today's Reservations"}
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {showPreviousReservations
                      ? "Showing reservation records from earlier days."
                      : "Showing only reservations scheduled for today."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPreviousReservations(false)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                      !showPreviousReservations
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <CalendarClock size={12} />
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreviousReservations(true)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition active:scale-[0.98] ${
                      showPreviousReservations
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <History size={12} />
                    Previous
                  </button>
                </div>
              </div>

              <div className="px-5 py-5">
                {visibleReservations.length === 0 ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-500">
                    {showPreviousReservations
                      ? "No previous reservations found."
                      : "No reservations found for today."}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="grid gap-4 p-4">
                      {paginatedReservations.map((reservation) => (
                        <article
                          key={reservation.reservation_id}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {reservation.charger_name}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {reservation.station_name ||
                                  `Station ${reservation.station_id ?? "N/A"}`}
                                <span className="mx-1">·</span>
                                {reservation.charger_type}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(reservation.status)}`}
                              >
                                {reservation.status}
                              </span>
                              <span className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] font-semibold text-gray-600">
                                {getTypeLabel(reservation.reservation_type)}
                              </span>
                            </div>
                          </div>

                          <div className="grid gap-4 px-5 py-5 md:grid-cols-4">
                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                <MapPin size={14} />
                                Location
                              </div>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {reservation.station_name ||
                                  "Station not available"}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Charger {reservation.charger_id} · Connector{" "}
                                {reservation.connector_number}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                <CalendarClock size={14} />
                                Reserved At
                              </div>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {formatDateTime(reservation.reserved_at)}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Reservation #{reservation.reservation_id}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                <Clock3 size={14} />
                                Time Window
                              </div>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {formatTimeRange(
                                  reservation.start_time,
                                  reservation.end_time,
                                )}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {formatShortDate(reservation.start_time)}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                                <ShieldCheck size={14} />
                                Connector
                              </div>
                              <p className="mt-2 text-sm font-semibold text-gray-900">
                                {reservation.charge_point_id}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Connector {reservation.connector_number} ·{" "}
                                {reservation.connector_id}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2">
                                <ReceiptText size={14} />
                                <span>
                                  {reservation.reserved_by_user_name ||
                                    "Reserved by you"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <PlugZap size={14} />
                                <span>
                                  {reservation.reserved_by_email ||
                                    "No email on file"}
                                </span>
                              </div>
                              {(reservation.pending_payment_amount ?? 0) >
                                0 && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                  Pending Amount: NPR{" "}
                                  {Number(
                                    reservation.pending_payment_amount ?? 0,
                                  ).toFixed(2)}
                                </span>
                              )}
                            </div>

                            <div>
                              {(reservation.pending_payment_amount ?? 0) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handlePayPending(
                                      reservation.reservation_id,
                                    )
                                  }
                                  disabled={
                                    payingReservationId ===
                                    reservation.reservation_id
                                  }
                                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {payingReservationId ===
                                  reservation.reservation_id
                                    ? "Paying..."
                                    : "Pay From Wallet"}
                                </button>
                              ) : (
                                <span className="text-[11px] text-gray-400">
                                  No pending payment
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      startItem={startItem}
                      endItem={endItem}
                      pageSizeOptions={pageSizeOptions}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                    />
                  </div>
                )}
              </div>
            </section>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3.5">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Overview
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gray-100">
                  <div className="bg-white px-4 py-4">
                    <p className="text-[11px] text-gray-400">Active</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {summary.active}
                    </p>
                  </div>
                  <div className="bg-white px-4 py-4">
                    <p className="text-[11px] text-gray-400">Upcoming</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {summary.upcoming}
                    </p>
                  </div>
                  <div className="bg-white px-4 py-4">
                    <p className="text-[11px] text-gray-400">Completed</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {summary.completed}
                    </p>
                  </div>
                  <div className="bg-white px-4 py-4">
                    <p className="text-[11px] text-gray-400">Visible</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      {visibleReservations.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3.5">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Quick Guide
                  </h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-start gap-3 px-4 py-3">
                    <CalendarClock
                      size={14}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    <p className="text-xs leading-relaxed text-gray-500">
                      Today&apos;s reservations are shown first for a cleaner
                      daily view.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <History
                      size={14}
                      className="mt-0.5 shrink-0 text-gray-400"
                    />
                    <p className="text-xs leading-relaxed text-gray-500">
                      Use previous reservations to review older booking records.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
