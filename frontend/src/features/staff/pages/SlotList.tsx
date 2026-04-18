import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStaffSlots, type StaffSlot } from "@/api/staffApi";

const getTodayDateParam = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatClock = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const formatSlotDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTimeRange = (startTime: string, endTime: string) =>
  `${formatClock(startTime)} - ${formatClock(endTime)}`;

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

const formatStatus = (value: string) => value.replace(/_/g, " ");

const getStatusClass = (status: string) => {
  if (status === "OPEN") return "bg-green-50 text-green-700";
  if (status === "RESERVED") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

export default function StaffSlotList() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState<StaffSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const data = await getStaffSlots(getTodayDateParam());
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

  const openSlotsCount = useMemo(
    () => visibleSlots.filter((slot) => slot.status === "OPEN").length,
    [visibleSlots],
  );

  const groupedSlots = useMemo(() => {
    const grouped = new Map<
      number,
      {
        charger_id: number;
        charger_name: string;
        charger_type: string;
        slots: StaffSlot[];
      }
    >();

    visibleSlots.forEach((slot) => {
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
  }, [visibleSlots]);

  return (
    <main className="min-h-screen bg-white px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Created Slots
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View all today slots grouped by charger.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/staff/manageSlots")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back to Manage Slots
            </button>
          </div>
        </section>

        {!loading && (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Total Slots
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {visibleSlots.length}
              </p>
            </div>
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-green-700">
                Open
              </p>
              <p className="mt-1 text-2xl font-bold text-green-900">
                {openSlotsCount}
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
            Loading slot list...
          </div>
        )}

        {!loading && visibleSlots.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            No created slots yet.
          </div>
        )}

        {!loading && visibleSlots.length > 0 && (
          <section className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Created Slots
                </h2>
                <p className="text-xs text-gray-500">
                  Grouped by charger so connector slots are easier to scan.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  Total {visibleSlots.length}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  Open {openSlotsCount}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-4 md:p-5">
              {groupedSlots.map((chargerGroup) => {
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
                          className="grid grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-gray-50 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto] md:items-center"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                              C{slot.connector_number}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                Connector {slot.connector_number}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatSlotDate(slot.start_time)}
                              </p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Time
                            </p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {formatTimeRange(slot.start_time, slot.end_time)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDuration(slot.start_time, slot.end_time)}
                            </p>
                          </div>

                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                              Status
                            </p>
                            <p className="mt-1">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(slot.status)}`}
                              >
                                {formatStatus(slot.status)}
                              </span>
                            </p>
                          </div>

                          <div className="md:text-right">
                            <p className="text-xs text-gray-500">
                              Slot ID {slot.slot_id}
                            </p>
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
