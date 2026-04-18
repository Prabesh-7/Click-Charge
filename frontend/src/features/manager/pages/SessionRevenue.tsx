import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getManagerChargingRevenueSummary,
  getManagerChargingSessions,
  getManagerReservationRecords,
  requestManagerReservationPayment,
  saveManagerChargingSessionPayment,
  type ChargingRevenueSummary,
  type ChargingSessionItem,
  type ReservationItem,
} from "@/api/managerApi";
import { toast } from "sonner";

const formatMoney = (
  value: number | null | undefined,
  currency: string | null,
) => {
  if (value == null) return "N/A";
  return `${currency || "NPR"} ${value.toFixed(2)}`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatClock = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatSessionDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTimeRange = (startTime: string, endTime: string | null) => {
  const start = formatClock(startTime);
  const end = endTime ? formatClock(endTime) : "Now";
  return `${start} to ${end}`;
};

const formatDuration = (startTime: string, endTime: string | null) => {
  if (!endTime) return "Running";

  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const diffMinutes = Math.max(0, Math.round((endMs - startMs) / 60000));

  if (diffMinutes < 60) return `${diffMinutes} min`;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
};

export default function SessionRevenue() {
  const [sessions, setSessions] = useState<ChargingSessionItem[]>([]);
  const [reservationRecords, setReservationRecords] = useState<
    ReservationItem[]
  >([]);
  const [summary, setSummary] = useState<ChargingRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSessionId, setSavingSessionId] = useState<number | null>(null);
  const [requestingReservationId, setRequestingReservationId] = useState<
    number | null
  >(null);
  const [requestAmounts, setRequestAmounts] = useState<Record<number, string>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionData, summaryData, reservationData] = await Promise.all([
        getManagerChargingSessions(),
        getManagerChargingRevenueSummary(),
        getManagerReservationRecords(),
      ]);
      setSessions(sessionData);
      setSummary(summaryData);
      setReservationRecords(reservationData);
      setRequestAmounts(
        reservationData.reduce<Record<number, string>>((acc, item) => {
          if (item.reservation_id) {
            acc[item.reservation_id] = item.pending_payment_amount
              ? String(Number(item.pending_payment_amount).toFixed(2))
              : "50";
          }
          return acc;
        }, {}),
      );
      setError(null);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Failed to load payment and revenue data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const refreshId = window.setInterval(() => {
      void fetchData();
    }, 15000);

    return () => window.clearInterval(refreshId);
  }, [fetchData]);

  const completedInvoiceSessions = useMemo(
    () =>
      sessions.filter(
        (session) =>
          Boolean(session.invoice_id) &&
          session.end_time !== null &&
          session.invoice_total_amount !== null,
      ),
    [sessions],
  );

  const activeReservations = useMemo(
    () =>
      reservationRecords.filter(
        (item) =>
          item.reservation_id &&
          item.reserved_by_user_id &&
          item.status === "ACTIVE",
      ),
    [reservationRecords],
  );

  const unifiedRows = useMemo(() => {
    const physicalRows = completedInvoiceSessions.map((session) => ({
      rowId: `physical-${session.session_id}`,
      createdAt: new Date(session.start_time).getTime(),
      paymentType: "Physical" as const,
      reference: `Session #${session.session_id}`,
      entity: {
        title: session.charger_name,
        subtitle: `Connector ${session.connector_number}`,
      },
      user: {
        name: "At Station",
        email: "-",
      },
      amount: formatMoney(
        session.invoice_total_amount,
        session.invoice_currency,
      ),
      statusLabel: session.payment_saved ? "Saved" : "Pending Save",
      statusTone: session.payment_saved ? "success" : "warning",
      actionType: "physical" as const,
      session,
      reservation: null,
      pendingAmount: 0,
      pendingCount: 0,
    }));

    const reservationRows = activeReservations.map((reservation) => {
      const pendingAmount = Number(reservation.pending_payment_amount ?? 0);
      const pendingCount = Number(reservation.pending_payment_count ?? 0);
      const hasPendingRequest = pendingAmount > 0 && pendingCount > 0;

      return {
        rowId: `reservation-${reservation.reservation_id}`,
        createdAt: new Date(reservation.reserved_at || 0).getTime(),
        paymentType: "Wallet" as const,
        reference: `Reservation #${reservation.reservation_id}`,
        entity: {
          title: reservation.charger_name,
          subtitle: `Connector ${reservation.connector_number}`,
        },
        user: {
          name: reservation.reserved_by_user_name || "User",
          email: reservation.reserved_by_email || "No email",
        },
        amount: `NPR ${pendingAmount.toFixed(2)}`,
        statusLabel: hasPendingRequest
          ? "Pending with User"
          : "Paid / No Pending",
        statusTone: hasPendingRequest ? "warning" : "success",
        actionType: "reservation" as const,
        session: null,
        reservation,
        pendingAmount,
        pendingCount,
      };
    });

    return [...physicalRows, ...reservationRows].sort(
      (a, b) => b.createdAt - a.createdAt,
    );
  }, [completedInvoiceSessions, activeReservations]);

  const handleSavePayment = async (sessionId: number) => {
    try {
      setSavingSessionId(sessionId);
      const result = await saveManagerChargingSessionPayment(sessionId);
      toast.success(result.message);
      await fetchData();
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to save payment.";
      toast.error("Payment save failed", { description: message });
    } finally {
      setSavingSessionId(null);
    }
  };

  const handleRequestReservationPayment = async (
    reservation: ReservationItem,
  ) => {
    if (!reservation.reservation_id) {
      toast.error("Reservation ID is missing.");
      return;
    }

    const amountRaw = requestAmounts[reservation.reservation_id] ?? "";
    const amount = Number(amountRaw);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }

    try {
      setRequestingReservationId(reservation.reservation_id);
      const result = await requestManagerReservationPayment(
        reservation.reservation_id,
        amount,
        "Pending reservation payment request from station",
      );
      toast.success(result.message);
      await fetchData();
    } catch (err: any) {
      const message =
        err.response?.data?.detail || "Failed to send payment request.";
      toast.error("Request failed", { description: message });
    } finally {
      setRequestingReservationId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            Session Payments & Revenue
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Unified payment operations for station sessions and reservation
            wallet requests.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && summary && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total Billable Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {summary.total_sessions}
              </p>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 p-4">
              <p className="text-xs uppercase tracking-wide text-green-700">
                Paid Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold text-green-900">
                {summary.paid_sessions}
              </p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Unpaid Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">
                {summary.unpaid_sessions}
              </p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                NPR {summary.total_revenue.toFixed(2)}
              </p>
            </div>
          </section>
        )}

        {loading && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-600">
            Loading payment sessions...
          </div>
        )}

        {!loading && unifiedRows.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-600">
            No payment records available yet.
          </div>
        )}

        {!loading && unifiedRows.length > 0 && (
          <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Payments Queue
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Pending reservation requests update automatically after user
                wallet payment.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Charger / Connector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedRows.map((row) => {
                    const isPhysical = row.actionType === "physical";
                    const isSaving =
                      isPhysical &&
                      row.session &&
                      savingSessionId === row.session.session_id;
                    const reservationId = row.reservation?.reservation_id as
                      | number
                      | undefined;
                    const isRequesting =
                      !isPhysical && reservationId
                        ? requestingReservationId === reservationId
                        : false;
                    const hasPendingRequest =
                      !isPhysical &&
                      row.pendingAmount > 0 &&
                      row.pendingCount > 0;

                    return (
                      <tr
                        key={row.rowId}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <span className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">
                            {row.paymentType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="font-medium">{row.reference}</p>
                          {isPhysical && row.session?.invoice_id && (
                            <p className="text-xs text-gray-500">
                              Invoice {row.session.invoice_id}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="text-xs text-gray-500">
                            {isPhysical && row.session
                              ? formatSessionDate(row.session.start_time)
                              : formatDateTime(
                                  row.reservation?.reserved_at ?? null,
                                )}
                          </p>
                          <p className="font-medium text-gray-900">
                            {isPhysical && row.session
                              ? formatTimeRange(
                                  row.session.start_time,
                                  row.session.end_time,
                                )
                              : "Reservation Request"}
                          </p>
                          {isPhysical && row.session && (
                            <p className="text-xs text-gray-500">
                              Duration:{" "}
                              {formatDuration(
                                row.session.start_time,
                                row.session.end_time,
                              )}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="font-medium">{row.entity.title}</p>
                          <p className="text-xs text-gray-500">
                            {row.entity.subtitle}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p>{row.user.name}</p>
                          <p className="text-xs text-gray-500">
                            {row.user.email}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {row.amount}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {row.statusTone === "success" ? (
                            <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                              {row.statusLabel}
                            </span>
                          ) : (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                              {row.statusLabel}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isPhysical && row.session ? (
                            <button
                              type="button"
                              disabled={
                                row.session.payment_saved || Boolean(isSaving)
                              }
                              onClick={() =>
                                void handleSavePayment(row.session!.session_id)
                              }
                              className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {row.session.payment_saved
                                ? "Saved"
                                : isSaving
                                  ? "Saving..."
                                  : "Save Payment"}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={1}
                                step="0.01"
                                value={
                                  reservationId
                                    ? (requestAmounts[reservationId] ?? "")
                                    : ""
                                }
                                onChange={(e) => {
                                  if (!reservationId) return;
                                  setRequestAmounts((prev) => ({
                                    ...prev,
                                    [reservationId]: e.target.value,
                                  }));
                                }}
                                disabled={hasPendingRequest}
                                className="h-10 w-28 rounded-md border border-gray-300 px-3 text-sm focus:border-green-600 focus:ring-1 focus:ring-green-600 disabled:bg-gray-100"
                              />
                              <button
                                type="button"
                                disabled={
                                  Boolean(isRequesting) ||
                                  hasPendingRequest ||
                                  !row.reservation
                                }
                                onClick={() => {
                                  if (!row.reservation) return;
                                  void handleRequestReservationPayment(
                                    row.reservation,
                                  );
                                }}
                                className="rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isRequesting
                                  ? "Sending..."
                                  : hasPendingRequest
                                    ? "Pending"
                                    : "Send To User"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
