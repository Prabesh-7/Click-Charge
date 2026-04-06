import { useEffect, useMemo, useState } from "react";
import { CreditCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  confirmEsewaTopup,
  initiateEsewaTopup,
  type EsewaInitResponse,
} from "@/api/walletApi";

export default function EsewaPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const totalAmount = useMemo(() => {
    const raw = location.state?.total;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
  }, [location.state]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verificationInfo, setVerificationInfo] = useState<string | null>(null);
  const [payload, setPayload] = useState<EsewaInitResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const data = params.get("data");

    if (!data) {
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await confirmEsewaTopup(data);
        navigate("/user/wallet/payment-success", {
          replace: true,
          state: {
            balance: res.balance,
            transaction_uuid: res.transaction_uuid,
            message: res.message,
          },
        });
      } catch (err: any) {
        const statusCode = err.response?.status;
        const detail =
          err.response?.data?.detail || "Payment could not be verified.";

        if (statusCode === 503) {
          setVerificationInfo(detail);
          return;
        }

        navigate("/user/wallet/payment-failure", {
          replace: true,
          state: {
            message: detail,
          },
        });
      }
    };

    void verifyPayment();
  }, [location.search, navigate]);

  useEffect(() => {
    if (location.search.includes("data=")) {
      return;
    }

    const initialize = async () => {
      try {
        setLoading(true);
        const data = await initiateEsewaTopup(totalAmount);
        setPayload(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.detail || "Unable to initialize eSewa payment.",
        );
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [location.search, totalAmount]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CreditCard className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Secure Payment</h1>
          <p className="text-gray-600 mt-2">Complete your payment via eSewa</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="mb-10 text-center">
            <p className="text-sm text-gray-600 font-medium">Total Amount</p>
            <p className="text-5xl font-bold text-green-600 mt-2">
              Rs {totalAmount.toFixed(2)}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {verificationInfo && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              {verificationInfo}
            </div>
          )}

          {loading && (
            <p className="text-center text-sm text-gray-500">
              Preparing payment request...
            </p>
          )}

          {!loading && payload && (
            <form
              action={payload.action_url}
              method="POST"
              className="space-y-6"
            >
              {Object.entries(payload.fields).map(([name, value]) => (
                <input key={name} type="hidden" name={name} value={value} />
              ))}

              <button
                type="submit"
                className="w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-xl transition-all transform active:scale-95 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
              >
                <img
                  src="https://esewa.com.np/common/images/esewa-logo.png"
                  alt="eSewa"
                  className="h-9"
                />
                Pay with eSewa
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You will be redirected to eSewa secure gateway
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
