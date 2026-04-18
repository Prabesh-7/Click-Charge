import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStaffSlot, getMyChargersByStaff } from "@/api/staffApi";
import { toast } from "sonner";

interface ChargerCard {
  charger_id: number;
  name: string;
  type: string;
  max_power_kw: number;
  connectors: Array<{
    connector_id: number;
    connector_number: number;
    charge_point_id: string;
    status: string;
  }>;
}

const MIN_DURATION_MINUTES = 20;
const MAX_DURATION_MINUTES = 180;

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
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
};

const toUtcIsoFromTodayTime = (value: string) =>
  timeToTodayDate(value).toISOString();

const formatStatus = (status: string) => status.replace(/_/g, " ");

export default function StaffManageSlots() {
  const navigate = useNavigate();
  const [chargerCards, setChargerCards] = useState<ChargerCard[]>([]);
  const [selectedConnectorId, setSelectedConnectorId] = useState<number | null>(
    null,
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchChargers = async () => {
    const chargers = await getMyChargersByStaff();
    const normalizedChargers: ChargerCard[] = chargers.map((charger: any) => ({
      charger_id: charger.charger_id,
      name: charger.name,
      type: String(charger.type),
      max_power_kw: charger.max_power_kw,
      connectors: (charger.connectors || []).map((connector: any) => ({
        connector_id: connector.connector_id,
        connector_number: connector.connector_number,
        charge_point_id: connector.charge_point_id,
        status: String(connector.status),
      })),
    }));

    setChargerCards(normalizedChargers);

    const firstConnector =
      normalizedChargers[0]?.connectors?.[0]?.connector_id ?? null;
    setSelectedConnectorId((current) => current ?? firstConnector);
  };

  const bootstrap = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchChargers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load chargers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void bootstrap();
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

  const applyDuration = (minutes: number) => {
    if (!startTime) {
      const message = "Select a start time first.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);
    const start = timeToTodayDate(startTime);
    const end = new Date(start.getTime() + minutes * 60000);

    if (end.getDate() !== start.getDate()) {
      const message = "End time must stay within today.";
      setError(message);
      toast.error(message);
      return;
    }

    const hh = String(end.getHours()).padStart(2, "0");
    const mm = String(end.getMinutes()).padStart(2, "0");
    setEndTime(`${hh}:${mm}`);
  };

  const handleCreateSlot = async (connectorId: number) => {
    if (!startTime || !endTime) {
      const message = "Please provide start and end time.";
      setError(message);
      toast.error(message);
      return;
    }

    const start = timeToTodayDate(startTime);
    const end = timeToTodayDate(endTime);
    const now = new Date();
    const durationMinutes = Math.floor(
      (end.getTime() - start.getTime()) / 60000,
    );

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      const message = "Please provide valid start and end time.";
      setError(message);
      toast.error(message);
      return;
    }

    if (start <= now) {
      const message = "Start time must be in the future.";
      setError(message);
      toast.error(message);
      return;
    }

    if (
      durationMinutes < MIN_DURATION_MINUTES ||
      durationMinutes > MAX_DURATION_MINUTES
    ) {
      const message = `Slot duration must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`;
      setError(message);
      toast.error(message);
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await createStaffSlot({
        connector_id: connectorId,
        start_time: toUtcIsoFromTodayTime(startTime),
        end_time: toUtcIsoFromTodayTime(endTime),
      });
      const message = "Slot created successfully.";
      setSuccess(message);
      toast.success(message);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Failed to create slot.";
      setError(message);
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSelectedSlot = async () => {
    if (selectedConnectorId === null) {
      const message = "Select a connector first.";
      setError(message);
      toast.error(message);
      return;
    }

    await handleCreateSlot(selectedConnectorId);
  };

  const selectedConnectorLabel = useMemo(() => {
    for (const charger of chargerCards) {
      for (const connector of charger.connectors) {
        if (connector.connector_id === selectedConnectorId) {
          return `${charger.name} - Connector ${connector.connector_number}`;
        }
      }
    }
    return "No connector selected";
  }, [chargerCards, selectedConnectorId]);

  return (
    <main className="min-h-screen bg-white px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-md border border-gray-200 bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Slots</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create booking windows directly from each charger card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/staff/slotList")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              View Created Slots
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">{todayLabel()}</p>
        </section>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <p>{success}</p>
          </div>
        )}

        {loading && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            Loading chargers...
          </div>
        )}

        {!loading && chargerCards.length === 0 && (
          <div className="rounded-md border border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            No chargers available.
          </div>
        )}

        {!loading && chargerCards.length > 0 && (
          <section className="rounded-md border border-gray-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Charger Cards
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Select a connector and create a slot right from the charger.
                </p>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                Selected: {selectedConnectorLabel}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {chargerCards.map((charger) => (
                <article
                  key={charger.charger_id}
                  className="rounded-md border border-gray-200 bg-gray-50 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-bold text-gray-900">
                        {charger.name}
                      </h3>
                      <p className="mt-1 text-xs text-gray-600">
                        {charger.type} | {charger.max_power_kw} kW
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {charger.connectors.map((connector) => {
                      const isSelected =
                        selectedConnectorId === connector.connector_id;

                      return (
                        <div
                          key={connector.connector_id}
                          className={`rounded-lg border p-3 transition ${
                            isSelected
                              ? "border-gray-300 bg-gray-100"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-4">
                              <input
                                type="radio"
                                name="connector-select"
                                checked={isSelected}
                                onChange={() =>
                                  setSelectedConnectorId(connector.connector_id)
                                }
                                className="mt-1 h-4 w-4 border-gray-300"
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  Connector {connector.connector_number}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {connector.charge_point_id}
                                </p>
                                <p className="mt-1 text-xs font-medium text-gray-500">
                                  Status: {formatStatus(connector.status)}
                                </p>
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Start Time
                        </label>
                        <input
                          type="time"
                          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-black focus:ring-1 focus:ring-green-600"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          End Time
                        </label>
                        <input
                          type="time"
                          className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-black focus:ring-1 focus:ring-green-600"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <p className="text-xs font-medium text-gray-600">
                        Quick Duration:
                      </p>
                      {[30, 60, 90, 120].map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          onClick={() => applyDuration(minutes)}
                        >
                          {minutes} min
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="mt-4 rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      disabled={actionLoading || selectedConnectorId === null}
                      onClick={() => void handleCreateSelectedSlot()}
                    >
                      Create Slot
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
