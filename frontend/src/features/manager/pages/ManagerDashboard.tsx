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
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your station and chargers.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Total Chargers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {totalChargers}
            </p>
          </div>

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              Rs {totalBalance.toFixed(2)}
            </p>
          </div>

          <div className="bg-white border border-[#B6B6B6] rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-sm text-gray-500">Station</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {station?.station_name || "-"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {station?.address || "-"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
