import { AlertCircle, ArrowRight, XCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function PaymentFailure() {
  const location = useLocation();
  const message =
    (location.state?.message as string | undefined) ||
    "We could not process your payment. Please try again.";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-16">
      <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-10 text-center shadow-2xl">
        <XCircle className="mx-auto mb-6 h-24 w-24 text-red-600" />
        <h1 className="mb-3 text-4xl font-bold text-gray-800">
          Payment Failed
        </h1>
        <p className="mb-7 text-lg text-gray-600">
          Wallet top-up could not be completed.
        </p>

        <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 text-left">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span className="font-semibold">Transaction Declined</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>

        <div className="space-y-3">
          <Link
            to="/user/wallet"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white hover:bg-red-700"
          >
            Try Again
            <ArrowRight className="h-4 w-4" />
          </Link>

          <Link
            to="/user/stations"
            className="block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to Stations
          </Link>
        </div>
      </div>
    </div>
  );
}
