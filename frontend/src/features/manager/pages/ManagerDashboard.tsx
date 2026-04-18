import { useEffect, useState } from "react";
import {
  getManagerWallet,
  getMyChargers,
  getMyStation,
  type ManagerStation,
} from "@/api/managerApi";

export default function ManagerDashboard() {
  const [totalChargers, setTotalChargers] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [station, setStation] = useState<ManagerStation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [chargersData, stationData, walletData] = await Promise.all([
          getMyChargers(),
          getMyStation(),
          getManagerWallet(),
        ]);
        setTotalChargers(chargersData.length);
        setStation(stationData);
        setTotalBalance(Number(walletData.balance || 0));
        setError(null);
      } catch (err: any) {
        console.error(
          "Failed to load manager dashboard:",
          err.response?.data || err.message,
        );
        setError(
          err.response?.data?.detail ||
            "Failed to load dashboard data. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Manager Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Overview of your station and chargers.
          </p>
        </div>

        {loading && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-6 py-12 text-center text-gray-600">
            Loading dashboard...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-md border border-gray-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Total Chargers
              </p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">
                {totalChargers}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Total Balance
              </p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">
                Rs {totalBalance.toFixed(2)}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Station
              </p>
              <p className="mt-4 text-lg font-semibold text-gray-900">
                {station?.station_name || "-"}
              </p>
              <p className="mt-2 text-xs text-gray-600">
                {station?.address || "-"}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
