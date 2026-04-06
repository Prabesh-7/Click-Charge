import { CheckCircle2, Home, Wallet } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PaymentSuccess() {
  const location = useLocation();
  const balance = Number(location.state?.balance ?? 0);
  const transactionUuid = location.state?.transaction_uuid as
    | string
    | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-cyan-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-emerald-100 bg-white shadow-2xl">
        <div className="rounded-t-3xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-12 text-center">
          <div className="mx-auto mb-5 inline-flex h-24 w-24 items-center justify-center rounded-full bg-white/20">
            <CheckCircle2 className="h-14 w-14 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white">
            Payment Successful
          </h1>
          <p className="mt-2 text-emerald-50">
            Your wallet has been topped up successfully.
          </p>
        </div>

        <div className="space-y-4 px-8 py-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              Updated Wallet Balance
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-800">
              Rs {balance.toFixed(2)}
            </p>
          </div>

          {transactionUuid && (
            <p className="rounded-xl bg-gray-50 p-3 text-center text-sm text-gray-600">
              Transaction ID: {transactionUuid}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <Link
              to="/user/wallet"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              <Wallet className="h-5 w-5" />
              Go to Wallet
            </Link>

            <Link
              to="/user/stations"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Home className="h-5 w-5" />
              Back to Stations
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
