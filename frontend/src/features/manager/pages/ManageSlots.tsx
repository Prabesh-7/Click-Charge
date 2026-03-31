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

const toLocalInputValue = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};

const toUtcIso = (value: string) => new Date(value).toISOString();

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

  const handleCreateSlot = async () => {
    if (!selectedConnectorId || !startTime || !endTime) {
      setError("Please select connector and provide start/end time.");
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await createManagerSlot({
        connector_id: selectedConnectorId,
        start_time: toUtcIso(startTime),
        end_time: toUtcIso(endTime),
      });
      setStartTime("");
      setEndTime("");
      await fetchSlots();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create slot.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSlot = async (slot: Slot) => {
    const newStart = window.prompt(
      "Update start time (YYYY-MM-DDTHH:mm)",
      toLocalInputValue(slot.start_time),
    );
    if (!newStart) return;

    const newEnd = window.prompt(
      "Update end time (YYYY-MM-DDTHH:mm)",
      toLocalInputValue(slot.end_time),
    );
    if (!newEnd) return;

    try {
      setActionLoading(true);
      setError(null);
      await updateManagerSlot(slot.slot_id, {
        start_time: toUtcIso(newStart),
        end_time: toUtcIso(newEnd),
      });
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
      await deleteManagerSlot(slotId);
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
      await releaseManagerSlotReservation(slotId);
      await fetchSlots();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to release slot reservation.",
      );
    } finally {
      setActionLoading(false);
    }
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

      {!loading && (
        <div className="bg-white border border-[#B6B6B6] rounded-lg p-5 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Create Slot</h2>

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
                type="datetime-local"
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
                type="datetime-local"
                className="w-full h-10 border border-[#B6B6B6] rounded px-2 text-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
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
                      Status: {slot.status}
                      {slot.reserved_by_user_name
                        ? ` | Reserved by ${slot.reserved_by_user_name}${slot.reserved_by_email ? ` (${slot.reserved_by_email})` : ""}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-gray-100 text-gray-700 text-xs disabled:opacity-50"
                      disabled={actionLoading || isReserved}
                      onClick={() => void handleEditSlot(slot)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="px-3 py-1 rounded bg-red-100 text-red-700 text-xs disabled:opacity-50"
                      disabled={actionLoading || isReserved}
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
