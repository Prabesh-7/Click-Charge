import { useEffect, useMemo, useState } from "react";
import {
  getManagerChargingSessions,
  type ChargingSessionItem,
} from "@/api/managerApi";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const formatDateTime = (value: string | null) => {
  if (!value) return "In Progress";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatSessionDate = (value: string) => {
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatClock = (value: string) => {
  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

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

const isSameLocalDay = (value: string, reference: Date) => {
  const date = new Date(value);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
};

const formatAmount = (
  value: number | null | undefined,
  currency: string | null,
) => {
  if (value == null) return "N/A";
  return `${currency || "NPR"} ${value.toFixed(2)}`;
};

export default function ChargingSessions() {
  const [sessions, setSessions] = useState<ChargingSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<ChargingSessionItem | null>(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getManagerChargingSessions();
      setSessions(data);
      setError(null);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to load charging sessions.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSessions();
  }, []);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
      ),
    [sessions],
  );

  const today = useMemo(() => new Date(), []);

  const todaySessions = useMemo(
    () =>
      sortedSessions.filter((session) =>
        isSameLocalDay(session.start_time, today),
      ),
    [sortedSessions, today],
  );

  const activeSessionsCount = useMemo(
    () => todaySessions.filter((session) => !session.end_time).length,
    [todaySessions],
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Charging Sessions
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Showing only today&apos;s sessions with a clean time range and
            aligned details.
          </p>
        </section>

        {!loading && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total Sessions
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {todaySessions.length}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                In Progress
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {activeSessionsCount}
              </p>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            Loading charging sessions...
          </div>
        )}

        {!loading && todaySessions.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No charging sessions found for today.
          </div>
        )}

        {!loading && todaySessions.length > 0 && (
          <section className="space-y-3">
            {todaySessions.map((session) => {
              const isActive = !session.end_time;

              return (
                <article
                  key={session.session_id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Session #{session.session_id}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatSessionDate(session.start_time)}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isActive ? "In Progress" : "Completed"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
                      <p className="text-xs uppercase tracking-wide text-gray-500 sm:pt-1">
                        Charger
                      </p>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {session.charger_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID {session.charger_id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
                      <p className="text-xs uppercase tracking-wide text-gray-500 sm:pt-1">
                        Connector
                      </p>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Connector {session.connector_number}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID {session.connector_id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)] sm:items-start">
                      <p className="text-xs uppercase tracking-wide text-gray-500 sm:pt-1">
                        Time
                      </p>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatTimeRange(
                            session.start_time,
                            session.end_time,
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          Duration:{" "}
                          {formatDuration(session.start_time, session.end_time)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Invoice
                        </p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">
                          {session.invoice_id ? "Available" : "Pending"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!session.invoice_id}
                        onClick={() => setSelectedSession(session)}
                      >
                        View Invoice
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <Dialog
        open={Boolean(selectedSession)}
        onOpenChange={(open) => {
          if (!open) setSelectedSession(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Charging Session Invoice</DialogTitle>
          </DialogHeader>

          {!selectedSession?.invoice_id ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Invoice is not available for this session.
            </div>
          ) : (
            <div className="space-y-3 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-gray-500">Invoice ID</p>
                <p className="font-semibold text-gray-900">
                  {selectedSession.invoice_id}
                </p>

                <p className="text-gray-500">Issued At</p>
                <p className="font-medium text-gray-900">
                  {formatDateTime(selectedSession.invoice_issued_at)}
                </p>

                <p className="text-gray-500">Session Time</p>
                <p className="font-medium text-gray-900">
                  {formatTimeRange(
                    selectedSession.start_time,
                    selectedSession.end_time,
                  )}
                </p>

                <p className="text-gray-500">Session Date</p>
                <p className="font-medium text-gray-900">
                  {formatSessionDate(selectedSession.start_time)}
                </p>

                <p className="text-gray-500">Charger</p>
                <p className="font-medium text-gray-900">
                  {selectedSession.charger_name} (ID{" "}
                  {selectedSession.charger_id})
                </p>

                <p className="text-gray-500">Connector</p>
                <p className="font-medium text-gray-900">
                  Connector {selectedSession.connector_number} (ID{" "}
                  {selectedSession.connector_id})
                </p>

                <p className="text-gray-500">Energy</p>
                <p className="font-medium text-gray-900">
                  {selectedSession.invoice_total_energy_kwh?.toFixed(3) ??
                    "N/A"}{" "}
                  kWh
                </p>

                <p className="text-gray-500">Price Per kWh</p>
                <p className="font-medium text-gray-900">
                  {formatAmount(
                    selectedSession.invoice_price_per_kwh,
                    selectedSession.invoice_currency,
                  )}
                </p>

                <p className="text-gray-500">Total Amount</p>
                <p className="text-lg font-bold text-gray-900">
                  {formatAmount(
                    selectedSession.invoice_total_amount,
                    selectedSession.invoice_currency,
                  )}
                </p>
              </div>

              <p className="text-xs text-gray-500">
                Showing invoice in this list is practical because managers can
                verify billing per session instantly without leaving the page.
              </p>
            </div>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </main>
  );
}
