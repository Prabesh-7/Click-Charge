import { useEffect, useMemo, useState } from "react";
import {
  getMyChargers,
  updateChargerPricing,
  type ManagerCharger,
} from "@/api/managerApi";

export default function Pricing() {
  const [chargers, setChargers] = useState<ManagerCharger[]>([]);
  const [draftPrices, setDraftPrices] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchChargers = async () => {
    try {
      setLoading(true);
      const data = await getMyChargers();
      const typed = data as ManagerCharger[];
      setChargers(typed);
      setDraftPrices(
        typed.reduce<Record<number, string>>((acc, charger) => {
          acc[charger.charger_id] = String(charger.price_per_kwh ?? 0);
          return acc;
        }, {}),
      );
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load charger pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchChargers();
  }, []);

  const sortedChargers = useMemo(
    () =>
      [...chargers].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [chargers],
  );

  const handleSave = async (chargerId: number) => {
    const raw = draftPrices[chargerId] ?? "";
    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }

    try {
      setSavingId(chargerId);
      setError(null);
      setSuccess(null);

      const updated = await updateChargerPricing(chargerId, parsed);

      setChargers((prev) =>
        prev.map((charger) =>
          charger.charger_id === chargerId ? updated : charger,
        ),
      );
      setDraftPrices((prev) => ({
        ...prev,
        [chargerId]: String(Number(updated.price_per_kwh ?? 0)),
      }));

      setSuccess("Pricing updated successfully.");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update pricing.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Charger Pricing</h1>
          <p className="mt-1 text-sm text-gray-600">
            Set energy tariff per charger. Session billing is calculated as:
            <span className="font-semibold text-gray-800">
              {" "}
              Energy (kWh) x Price per kWh
            </span>
            .
          </p>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {loading && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            Loading charger pricing...
          </div>
        )}

        {!loading && sortedChargers.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center text-gray-500 shadow-sm">
            No chargers found. Add a charger first, then set pricing.
          </div>
        )}

        {!loading && sortedChargers.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Charger
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Max Power
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Price (Rs/kWh)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedChargers.map((charger) => (
                    <tr key={charger.charger_id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 align-top text-sm">
                        <p className="font-semibold text-gray-900">
                          {charger.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          ID {charger.charger_id}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {charger.type}
                      </td>
                      <td className="px-4 py-4 align-top text-sm text-gray-700">
                        {charger.max_power_kw} kW
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          value={draftPrices[charger.charger_id] ?? ""}
                          onChange={(e) =>
                            setDraftPrices((prev) => ({
                              ...prev,
                              [charger.charger_id]: e.target.value,
                            }))
                          }
                          className="h-10 w-40 rounded-lg border border-gray-300 px-3 text-sm"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <button
                          type="button"
                          onClick={() => void handleSave(charger.charger_id)}
                          disabled={savingId === charger.charger_id}
                          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingId === charger.charger_id
                            ? "Saving..."
                            : "Save"}
                        </button>
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
