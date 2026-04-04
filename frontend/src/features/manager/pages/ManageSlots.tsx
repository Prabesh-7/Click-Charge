import { useEffect, useMemo, useState } from "react";
import {
  getMyChargers,
  getManagerSlots,
  createManagerSlot,
  updateManagerSlot,
  deleteManagerSlot,
  releaseManagerSlotReservation,
  type Slot,
} from "@/api/managerApi";

interface ConnectorOption {
  connector_id: number;
  label: string;
}

const MIN_DURATION_MINUTES = 20;
const MAX_DURATION_MINUTES = 180;

const toLocalTimeValue = (value: string) => {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const timeToTodayDate = (timeValue: string) => {
  const [h, m] = timeValue.split(":").map(Number);
  const now = new Date();
  const local = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    h,
    m,
    0,
    0,
  );
  return local;
};

const toUtcIsoFromTodayTime = (value: string) =>
  timeToTodayDate(value).toISOString();

export default function ManageSlots() {
  const [connectors, setConnectors] = useState<ConnectorOption[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(
    null,
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const slotStats = useMemo(() => {
    const open = slots.filter((slot) => slot.status === "OPEN").length;
    const reserved = slots.filter((slot) => slot.status === "RESERVED").length;
    const closed = slots.filter((slot) => slot.status === "CLOSED").length;
    return { open, reserved, closed, total: slots.length };
  }, [slots]);

  const sortedSlots = useMemo(
    () =>
      [...slots].sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
      ),
    [slots],
  );

  const fetchConnectors = async () => {
    const chargers = await getMyChargers();
    const options: ConnectorOption[] = [];

    for (const charger of chargers) {
      for (const connector of charger.connectors || []) {
        options.push({
          connector_id: connector.connector_id,
          label: `${charger.name} - Connector ${connector.connector_number} (${connector.charge_point_id})`,
        });
      }
    }

    setConnectors(options);
    if (!selectedConnectorId && options.length > 0) {
      setSelectedConnectorId(options[0].connector_id);
    }
  };

  const fetchSlots = async () => {
    const data = await getManagerSlots();
    setSlots(data);
  };

  const bootstrap = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchConnectors(), fetchSlots()]);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load slots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      void fetchSlots();
    }, 3000);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (startTime || endTime) return;

    const now = new Date();
    const rounded = new Date(now);
    rounded.setMinutes(Math.ceil(now.getMinutes() / 15) * 15, 0, 0);

    const defaultStart = new Date(rounded.getTime() + 15 * 60000);
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60000);

    const start = `${String(defaultStart.getHours()).padStart(2, "0")}:${String(defaultStart.getMinutes()).padStart(2, "0")}`;
    const end = `${String(defaultEnd.getHours()).padStart(2, "0")}:${String(defaultEnd.getMinutes()).padStart(2, "0")}`;

    setStartTime(start);
    setEndTime(end);
  }, [startTime, endTime]);

  const handleCreateSlot = async () => {
    if (!selectedConnectorId || !startTime || !endTime) {
      setError("Please select connector and provide start/end time.");
      return;
    }

    const start = timeToTodayDate(startTime);
    const end = timeToTodayDate(endTime);
    const now = new Date();
    const durationMinutes = Math.floor(
      (end.getTime() - start.getTime()) / 60000,
    );

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Please provide valid start and end time.");
      return;
    }

    if (start <= now) {
      setError("Start time must be in the future.");
      return;
    }

    if (
      durationMinutes < MIN_DURATION_MINUTES ||
      durationMinutes > MAX_DURATION_MINUTES
    ) {
      setError(
        `Slot duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`,
      );
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await createManagerSlot({
        connector_id: selectedConnectorId,
        start_time: toUtcIsoFromTodayTime(startTime),
        end_time: toUtcIsoFromTodayTime(endTime),
      });
      setSuccess("Slot created successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSlot = async (slot: Slot) => {
    const newStart = window.prompt(
      "Update start time (HH:mm) for today",
      toLocalTimeValue(slot.start_time),
    );
    if (!newStart) return;

    const newEnd = window.prompt(
      "Update end time (HH:mm) for today",
      toLocalTimeValue(slot.end_time),
    );
    if (!newEnd) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await updateManagerSlot(slot.slot_id, {
        start_time: toUtcIsoFromTodayTime(newStart),
        end_time: toUtcIsoFromTodayTime(newEnd),
      });
      setSuccess("Slot updated successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId: number) => {
    const confirmed = window.confirm("Delete this slot?");
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await deleteManagerSlot(slotId);
      setSuccess("Slot deleted successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseReservation = async (slotId: number) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await releaseManagerSlotReservation(slotId);
      setSuccess("Reservation released successfully.");
      await fetchSlots();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to release slot reservation.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const applyDuration = (minutes: number) => {
    if (!startTime) {
      setError("Select a start time first.");
      return;
    }
    setError(null);
    const start = timeToTodayDate(startTime);
    const end = new Date(start.getTime() + minutes * 60000);
    if (end.getDate() !== start.getDate()) {
      setError("End time must stay within today.");
      return;
    }
    const hh = String(end.getHours()).padStart(2, "0");
    const mm = String(end.getMinutes()).padStart(2, "0");
    setEndTime(`${hh}:${mm}`);
  };

  return (
    <main className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Time Slots</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create bookable time windows for connectors. Users can reserve
          available slots.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded">
          <p>{success}</p>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Total
            </p>
            <p className="text-xl font-semibold text-gray-900 mt-1">
              {slotStats.total}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs text-emerald-700 uppercase tracking-wide">
              Open
            </p>
            <p className="text-xl font-semibold text-emerald-800 mt-1">
              {slotStats.open}
            </p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-xs text-amber-700 uppercase tracking-wide">
              Reserved
            </p>
            <p className="text-xl font-semibold text-amber-800 mt-1">
              {slotStats.reserved}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-700 uppercase tracking-wide">
              Closed
            </p>
            <p className="text-xl font-semibold text-slate-800 mt-1">
              {slotStats.closed}
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <p className="font-semibold mb-1">Balanced Reservation Policy</p>
        <ul className="space-y-1 text-blue-800">
          <li>Slots must be 20 to 180 minutes.</li>
          <li>Reservations must be made at least 15 minutes before start.</li>
          <li>
            No-show reservations are auto-released after 20 minutes from slot
            start.
          </li>
          <li>Users can hold up to 2 active reservations.</li>
        </ul>
      </div>

      {!loading && (
        <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Create Slot</h2>
          <p className="text-xs text-gray-500">
            Date is system-managed: {todayLabel()}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Connector
              </label>
              <select
                className="w-full h-10 border border-[#B6B6B6] rounded px-2 text-sm"
                value={selectedConnectorId ?? ""}
                onChange={(e) => setSelectedConnectorId(Number(e.target.value))}
              >
                {connectors.map((connector) => (
                  <option
                    key={connector.connector_id}
                    value={connector.connector_id}
                  >
                    {connector.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                className="w-full h-10 border border-[#B6B6B6] rounded px-2 text-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                className="w-full h-10 border border-[#B6B6B6] rounded px-2 text-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-gray-600">Quick Duration:</p>
            {[30, 60, 90, 120].map((minutes) => (
              <button
                key={minutes}
                type="button"
                className="px-3 py-1.5 rounded border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                onClick={() => applyDuration(minutes)}
              >
                {minutes} min
              </button>
            ))}
          </div>

          <button
            type="button"
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
            disabled={actionLoading || connectors.length === 0}
            onClick={() => void handleCreateSlot()}
          >
            {actionLoading ? "Saving..." : "Create Slot"}
          </button>
        </div>
      )}

      <div className="bg-white border border-[#B6B6B6] rounded-lg p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Existing Slots
        </h2>

        {loading && <p className="text-sm text-gray-500">Loading slots...</p>}

        {!loading && sortedSlots.length === 0 && (
          <p className="text-sm text-gray-500">No slots created yet.</p>
        )}

        {!loading && sortedSlots.length > 0 && (
          <div className="space-y-2">
            {sortedSlots.map((slot) => {
              const isReserved = slot.status === "RESERVED";
              const isClosed = slot.status === "CLOSED";
              const hasStarted =
                new Date(slot.start_time).getTime() <= Date.now();

              const statusClass =
                slot.status === "OPEN"
                  ? "bg-emerald-100 text-emerald-700"
                  : slot.status === "RESERVED"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-700";

              return (
                <div
                  key={slot.slot_id}
                  className="border border-gray-200 rounded px-3 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {slot.charger_name} - Connector {slot.connector_number}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(slot.start_time).toLocaleString()} to{" "}
                      {new Date(slot.end_time).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Status:{" "}
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}
                      >
                        {slot.status}
                      </span>
                      {slot.reserved_by_user_name
                        ? ` | Reserved by ${slot.reserved_by_user_name}${slot.reserved_by_email ? ` (${slot.reserved_by_email})` : ""}${slot.reserved_by_phone_number ? ` | Contact: ${slot.reserved_by_phone_number}` : ""}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs disabled:opacity-50"
                      disabled={
                        actionLoading || isReserved || isClosed || hasStarted
                      }
                      onClick={() => void handleEditSlot(slot)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs disabled:opacity-50"
                      disabled={
                        actionLoading || isReserved || isClosed || hasStarted
                      }
                      onClick={() => void handleDeleteSlot(slot.slot_id)}
                    >
                      Delete
                    </button>

                    {isReserved && (
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-amber-700 text-white text-xs disabled:opacity-50"
                        disabled={actionLoading}
                        onClick={() =>
                          void handleReleaseReservation(slot.slot_id)
                        }
                      >
                        Release
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
