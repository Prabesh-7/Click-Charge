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

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Charging Sessions
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            All charging sessions with charger, connector, start time, and end
            time.
          </p>
        </section>

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

        {!loading && sortedSessions.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No charging sessions found.
          </div>
        )}

        {!loading && sortedSessions.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Session ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Charger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Connector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Start Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      End Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedSessions.map((session) => (
                    <tr key={session.session_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                        {session.session_id}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">
                          {session.charger_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID {session.charger_id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        Connector {session.connector_number}
                        <p className="text-xs text-gray-500">
                          ID {session.connector_id}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDateTime(session.start_time)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDateTime(session.end_time)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!session.invoice_id}
                          onClick={() => setSelectedSession(session)}
                        >
                          View Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
            </div>
          )}

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </main>
  );
}
