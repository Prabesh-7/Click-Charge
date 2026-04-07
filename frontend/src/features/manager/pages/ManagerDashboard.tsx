import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
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
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-sm text-gray-600 mt-2">
          Overview of your station and chargers.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      )}

      {error && (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Total Chargers
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              {totalChargers}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Total Balance
            </p>
            <p className="text-3xl font-bold text-gray-900 mt-3">
              Rs {totalBalance.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              Station
            </p>
            <p className="text-lg font-semibold text-gray-900 mt-3">
              {station?.station_name || "-"}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {station?.address || "-"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
