import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Car,
  CircleUserRound,
  CreditCard,
  Pencil,
  Save,
  X,
  Mail,
  Phone,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { getWalletSummary } from "@/api/walletApi";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/api/userApi";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRole = (role: string) => {
  if (!role) {
    return "User";
  }
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

export default function UserProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    phone_number: "",
    vehicle: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [profileData, walletData] = await Promise.all([
          getUserProfile(),
          getWalletSummary(),
        ]);
        setProfile(profileData);
        setFormData({
          user_name: profileData.user_name ?? "",
          email: profileData.email ?? "",
          phone_number: profileData.phone_number ?? "",
          vehicle: profileData.vehicle ?? "",
        });
        setWalletBalance(Number(walletData.balance || 0));
        setError(null);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const accountHealth = useMemo(() => {
    if (!profile) {
      return 0;
    }

    const checks = [
      Boolean(profile.user_name),
      Boolean(profile.email),
      Boolean(profile.phone_number),
      Boolean(profile.vehicle),
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [profile]);

  const handleEditCancel = () => {
    if (!profile) {
      return;
    }
    setFormData({
      user_name: profile.user_name ?? "",
      email: profile.email ?? "",
      phone_number: profile.phone_number ?? "",
      vehicle: profile.vehicle ?? "",
    });
    setIsEditing(false);
    setError(null);
    setSaveMessage(null);
  };

  const handleProfileSave = async () => {
    if (!formData.user_name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveMessage(null);

      const updated = await updateUserProfile({
        user_name: formData.user_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim() || null,
        vehicle: formData.vehicle.trim() || null,
      });

      setProfile(updated);
      setFormData({
        user_name: updated.user_name ?? "",
        email: updated.email ?? "",
        phone_number: updated.phone_number ?? "",
        vehicle: updated.vehicle ?? "",
      });
      setIsEditing(false);
      setSaveMessage("Profile updated successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e2f4e9_0%,#f8fafc_38%,#f8fafc_100%)] px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-[linear-gradient(120deg,#0f172a,#134e4a)] px-6 py-7 text-white md:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-emerald-200">
                  Account Center
                </p>
                <h1 className="mt-2 text-3xl font-bold">My Profile</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-200">
                  Keep your account details up to date. This page is designed to
                  be clear and simple for everyday use.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/user/wallet")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                <CreditCard size={16} />
                Manage Wallet
              </button>
            </div>
          </div>

          <div className="grid gap-4 border-t border-slate-200 bg-white px-6 py-5 md:grid-cols-3 md:px-8">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Wallet Balance
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                Rs {walletBalance === null ? "0.00" : walletBalance.toFixed(2)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Profile Completeness
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {accountHealth}%
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Access Role
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {profile ? formatRole(profile.role) : "User"}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {saveMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saveMessage}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Personal Details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Contact information used for bookings and account
                  communication.
                </p>
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    setSaveMessage(null);
                    setError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEditCancel}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <X size={14} />
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleProfileSave()}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={14} />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <CircleUserRound className="h-5 w-5 text-slate-500" />
                <div className="w-full">
                  <p className="text-xs text-slate-500">Full Name</p>
                  {isEditing ? (
                    <input
                      value={formData.user_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          user_name: e.target.value,
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">
                      {loading
                        ? "Loading..."
                        : profile?.user_name || "Not available"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Mail className="h-5 w-5 text-slate-500" />
                <div className="w-full">
                  <p className="text-xs text-slate-500">Email Address</p>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">
                      {loading
                        ? "Loading..."
                        : profile?.email || "Not available"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Phone className="h-5 w-5 text-slate-500" />
                <div className="w-full">
                  <p className="text-xs text-slate-500">Phone Number</p>
                  {isEditing ? (
                    <input
                      value={formData.phone_number}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone_number: e.target.value,
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">
                      {loading
                        ? "Loading..."
                        : profile?.phone_number || "Not available"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Car className="h-5 w-5 text-slate-500" />
                <div className="w-full">
                  <p className="text-xs text-slate-500">Vehicle</p>
                  {isEditing ? (
                    <input
                      value={formData.vehicle}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vehicle: e.target.value,
                        }))
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">
                      {loading
                        ? "Loading..."
                        : profile?.vehicle || "Not added yet"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Account Summary
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Account timeline and status for trust and transparency.
            </p>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-500">Account Status</p>
                  <p className="font-medium text-slate-900">Active</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="font-medium text-slate-900">
                    {loading || !profile
                      ? "Loading..."
                      : formatDate(profile.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <Wallet className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-500">Available Wallet</p>
                  <p className="font-medium text-slate-900">
                    Rs{" "}
                    {walletBalance === null ? "0.00" : walletBalance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Your account details are securely managed. If any information is
              missing, contact support to update it.
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
