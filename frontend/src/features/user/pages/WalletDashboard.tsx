import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  CircleDollarSign,
  CreditCard,
  Shield,
  Wallet,
} from "lucide-react";

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

  const quickTopupValues = [200, 500, 1000, 2000];

  const formatMoney = (value: number) => `Rs ${value.toFixed(2)}`;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#dff4e9_0%,#f8fafc_42%,#f8fafc_100%)] px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[linear-gradient(130deg,#0f172a,#14532d)] px-6 py-7 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-emerald-200">
                  Payments Workspace
                </p>
                <h1 className="mt-2 text-3xl font-bold">My Wallet</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-200">
                  Add balance in a few taps and use it instantly for
                  reservations and charging payments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/user/profile")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                View Profile
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200 bg-white px-6 py-5 md:grid-cols-3 md:px-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Available Balance
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {loading ? "..." : formatMoney(balance)}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Top-up Method
              </p>
              <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                <BadgeCheck size={16} className="text-emerald-600" />
                eSewa (Secure)
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Support
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                24/7 transaction assistance
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <CircleDollarSign size={19} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Add Balance
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Choose a quick amount or enter your own value.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickTopupValues.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setAmount(String(value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50"
                >
                  Rs {value}
                </button>
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12 rounded-xl border border-slate-300 px-4 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                placeholder="Enter amount"
              />

              <button
                type="button"
                onClick={handleTopup}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 font-semibold text-white transition hover:bg-emerald-700"
              >
                <CreditCard className="h-5 w-5" />
                Add via eSewa
              </button>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Trust & Safety
            </h2>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>Payments are verified through the official eSewa gateway.</p>
              </div>

              <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>
                  Wallet updates appear automatically after successful
                  confirmation.
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
                Tip: Keep at least Rs 50 in wallet for faster slot reservation
                checkout.
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
