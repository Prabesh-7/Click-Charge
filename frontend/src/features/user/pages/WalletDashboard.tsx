import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CircleDollarSign,
  CreditCard,
  Shield,
  Wallet,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
      const message = "Please enter a valid amount.";
      setError(message);
      toast.error(message);
      return;
    }
    navigate("/user/wallet/add-funds/esewa", { state: { total: parsed } });
  };

  const quickTopupValues = [200, 500, 1000, 2000];

  const formatMoney = (value: number) => `Rs ${value.toFixed(2)}`;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Wallet</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Add balance and manage your charging payments.
          </p>
        </div>

        {/* Alert */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={14} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-red-400 hover:text-red-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">
            <div className="h-64 animate-pulse rounded-xl border border-gray-100 bg-white" />
            <div className="space-y-4">
              <div className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white" />
              <div className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white" />
            </div>
          </div>
        )}

        {!loading && (
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">

            {/* Left: Add balance */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <CircleDollarSign size={15} className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Add Balance</h2>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  Choose a quick amount or enter a custom value.
                </p>
              </div>

              <div className="px-5 py-5 space-y-4">
                {/* Current balance */}
                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Wallet size={14} className="text-gray-400" />
                    <div>
                      <p className="text-[11px] text-gray-400">Current Balance</p>
                      <p className="mt-0.5 text-base font-bold text-gray-900">
                        {formatMoney(balance)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600">
                    <BadgeCheck size={13} />
                    eSewa verified
                  </div>
                </div>

                {/* Quick amounts */}
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Quick select
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {quickTopupValues.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(String(value))}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition active:scale-[0.97] ${
                          amount === String(value)
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Rs {value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom input + CTA */}
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Custom amount
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                        Rs
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTopup}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <CreditCard size={14} />
                      Pay via eSewa
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Trust & Safety */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3.5">
                  <h2 className="text-sm font-semibold text-gray-900">Trust & Safety</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-start gap-3 px-4 py-3">
                    <Shield size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                    <p className="text-xs leading-relaxed text-gray-500">
                      Payments are verified through the official eSewa gateway.
                    </p>
                  </div>
                  <div className="flex items-start gap-3 px-4 py-3">
                    <Wallet size={14} className="mt-0.5 shrink-0 text-gray-400" />
                    <p className="text-xs leading-relaxed text-gray-500">
                      Balance updates automatically after successful confirmation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tip */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                  Tip
                </p>
                <p className="text-xs leading-relaxed text-emerald-800">
                  Keep at least Rs 50 in your wallet for faster slot reservation checkout.
                </p>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}