import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getManagerChargingRevenueSummary,
  getManagerChargingSessions,
  type ChargingRevenueSummary,
  type ChargingSessionItem,
} from "@/api/managerApi";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useClientPagination } from "@/hooks/useClientPagination";
import { toast } from "sonner";

const toLocalDateKey = (value: string) => {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDateKey = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const getTodayDateKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function RevenueReports() {
  const [sessions, setSessions] = useState<ChargingSessionItem[]>([]);
  const [summary, setSummary] = useState<ChargingRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sessionData, summaryData] = await Promise.all([
        getManagerChargingSessions(),
        getManagerChargingRevenueSummary(),
      ]);
      setSessions(sessionData);
      setSummary(summaryData);
      setError(null);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to load revenue report data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
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

  const dailyRevenueRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        dateKey: string;
        totalSessions: number;
        savedSessions: number;
        pendingSessions: number;
        dailyRevenue: number;
      }
    >();

    completedInvoiceSessions.forEach((session) => {
      const dateKey = toLocalDateKey(session.start_time);
      const existing = grouped.get(dateKey) ?? {
        dateKey,
        totalSessions: 0,
        savedSessions: 0,
        pendingSessions: 0,
        dailyRevenue: 0,
      };

      existing.totalSessions += 1;

      if (session.payment_saved) {
        existing.savedSessions += 1;
        existing.dailyRevenue += Number(
          session.revenue_amount ?? session.invoice_total_amount ?? 0,
        );
      } else {
        existing.pendingSessions += 1;
      }

      grouped.set(dateKey, existing);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      b.dateKey.localeCompare(a.dateKey),
    );
  }, [completedInvoiceSessions]);

  const todayRevenue = useMemo(() => {
    const todayKey = getTodayDateKey();
    const todayRow = dailyRevenueRows.find((row) => row.dateKey === todayKey);
    return todayRow?.dailyRevenue ?? 0;
  }, [dailyRevenueRows]);

  const pendingPhysicalAmount = useMemo(
    () =>
      completedInvoiceSessions
        .filter((session) => !session.payment_saved)
        .reduce(
          (sum, session) => sum + Number(session.invoice_total_amount ?? 0),
          0,
        ),
    [completedInvoiceSessions],
  );

  const {
    paginatedItems: paginatedDailyRevenueRows,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
    pageSizeOptions,
    setCurrentPage,
    setPageSize,
  } = useClientPagination(dailyRevenueRows, {
    initialPageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
  });

  const handleDownloadRevenueReport = () => {
    if (dailyRevenueRows.length === 0) {
      toast.error("No daily revenue data available to export.");
      return;
    }

    const lines = [
      [
        "Date",
        "Total Sessions",
        "Saved Sessions",
        "Pending Sessions",
        "Daily Revenue (NPR)",
      ].join(","),
      ...dailyRevenueRows.map((row) =>
        [
          row.dateKey,
          row.totalSessions,
          row.savedSessions,
          row.pendingSessions,
          row.dailyRevenue.toFixed(2),
        ].join(","),
      ),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `manager-daily-revenue-${getTodayDateKey()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Revenue report generated.");
  };

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <h1 className="text-3xl font-semibold text-gray-900">
            Revenue Reports
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Daily revenue tracking and reporting for your station operations.
          </p>
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-12 text-center text-sm text-gray-600">
            Loading revenue report...
          </div>
        )}

        {!loading && summary && (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
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
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-700">
                Today Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold text-blue-900">
                NPR {todayRevenue.toFixed(2)}
              </p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Pending Physical Amount
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-900">
                NPR {pendingPhysicalAmount.toFixed(2)}
              </p>
            </div>
          </section>
        )}

        {!loading && (
          <section className="rounded-md border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <button
                type="button"
                onClick={handleDownloadRevenueReport}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Generate Revenue Report
              </button>
            </div>
          </section>
        )}

        {!loading && dailyRevenueRows.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-sm text-gray-600">
            No completed sessions available for daily revenue report.
          </div>
        )}

        {!loading && dailyRevenueRows.length > 0 && (
          <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">
                Daily Revenue
              </h2>
              <p className="mt-1 text-xs text-gray-600">
                Revenue grouped by day from saved physical payments.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Total Sessions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Saved
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDailyRevenueRows.map((row) => (
                    <tr
                      key={row.dateKey}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {formatDateKey(row.dateKey)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {row.totalSessions}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-700">
                        {row.savedSessions}
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-700">
                        {row.pendingSessions}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        NPR {row.dailyRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          </section>
        )}
      </div>
    </main>
  );
}
