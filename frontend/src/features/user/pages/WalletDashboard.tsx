import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Wallet } from "lucide-react";

import { getWalletSummary } from "@/api/walletApi";

export default function WalletDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [amount, setAmount] = useState<string>("10");
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const data = await getWalletSummary();
      setBalance(Number(data.balance || 0));
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchWallet();
  }, []);

  const handleTopup = () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    navigate("/user/wallet/add-funds/esewa", { state: { total: parsed } });
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-700">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-sm text-gray-500">
                Top up using eSewa and pay from wallet balance.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            Current Balance
          </p>
          <p className="mt-2 text-4xl font-bold text-emerald-800">
            Rs {loading ? "..." : balance.toFixed(2)}
          </p>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Add Money</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 rounded-xl border border-gray-300 px-4 text-gray-900 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleTopup}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700"
            >
              <CreditCard className="h-5 w-5" />
              Add via eSewa
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
