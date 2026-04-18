import { useEffect, useMemo, useState } from "react";
import {
  getManagerChargingSessions,
  type ChargingSessionItem,
} from "@/api/managerApi";

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
    <main className="min-h-screen bg-white px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Charging Sessions
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Showing only today&apos;s sessions with a clean time range and
            aligned details.
          </p>
        </section>

        {!loading && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total Sessions
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {todaySessions.length}
              </p>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-green-700">
                In Progress
              </p>
              <p className="mt-1 text-2xl font-bold text-green-900">
                {activeSessionsCount}
              </p>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            Loading charging sessions...
          </div>
        )}

        {!loading && todaySessions.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            No charging sessions found for today.
          </div>
        )}

        {!loading && todaySessions.length > 0 && (
          <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Session
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Time Range
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Duration
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Charger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Connector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {todaySessions.map((session) => {
                    const isActive = !session.end_time;

                    return (
                      <tr
                        key={session.session_id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          #{session.session_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatSessionDate(session.start_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatTimeRange(
                            session.start_time,
                            session.end_time,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDuration(session.start_time, session.end_time)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="font-medium">{session.charger_name}</p>
                          <p className="text-xs text-gray-500">
                            ID {session.charger_id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <p className="font-medium">
                            Connector {session.connector_number}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID {session.connector_id}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {session.invoice_id || "Pending"}
                        </td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                          {formatAmount(
                            session.invoice_total_amount,
                            session.invoice_currency,
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isActive
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {isActive ? "In Progress" : "Completed"}
                          </span>
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
