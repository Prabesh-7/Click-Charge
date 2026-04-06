import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getManagerSlots, type Slot } from "@/api/managerApi";

const getTodayDateParam = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatStatus = (value: string) => value.replace(/_/g, " ");

const getStatusClass = (status: string) => {
  if (status === "OPEN") return "bg-emerald-100 text-emerald-700";
  if (status === "RESERVED") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
};

export default function SlotList() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getManagerSlots(getTodayDateParam());
      setSlots(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load slot list.");
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

  const visibleSlots = useMemo(
    () =>
      [...slots].sort((a, b) => {
        const statusRank = (status: string) => {
          if (status === "OPEN") return 0;
          if (status === "RESERVED") return 1;
          return 2;
        };

        const statusDiff = statusRank(a.status) - statusRank(b.status);
        if (statusDiff !== 0) return statusDiff;

        return (
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      }),
    [slots],
  );

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Created Slots
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View all created slots in a simple table.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/manager/manageSlots")}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Manage Slots
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            Loading slot list...
          </div>
        )}

        {!loading && visibleSlots.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No created slots yet.
          </div>
        )}

        {!loading && visibleSlots.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Charger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Connector
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Time Window
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {visibleSlots.map((slot) => (
                    <tr key={slot.slot_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top">
                        <div className="font-semibold text-gray-900">
                          {slot.charger_name}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {slot.charger_type}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        Connector {slot.connector_number}
                        <div className="mt-1 text-xs text-gray-500">
                          ID {slot.connector_id}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        <div>{formatDateTime(slot.start_time)}</div>
                        <div className="text-xs text-gray-500">
                          to {formatDateTime(slot.end_time)}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(slot.status)}`}
                        >
                          {formatStatus(slot.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        <div className="space-y-1">
                          <p>
                            <span className="font-semibold text-gray-900">
                              Created By:
                            </span>{" "}
                            {slot.created_by_manager_id ?? "System"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">
                              Reserved By:
                            </span>{" "}
                            {slot.reserved_by_user_name || "None"}
                          </p>
                          <p>
                            <span className="font-semibold text-gray-900">
                              Reserved Email:
                            </span>{" "}
                            {slot.reserved_by_email || "None"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
