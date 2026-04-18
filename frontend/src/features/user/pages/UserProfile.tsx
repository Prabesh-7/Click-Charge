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
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { getWalletSummary } from "@/api/walletApi";
import {
  getUserProfile,
  updateUserProfile,
  type UserProfile,
} from "@/api/userApi";
import { toast } from "sonner";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatRole = (role: string) => {
  if (!role) return "User";
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
    if (!profile) return 0;
    const checks = [
      Boolean(profile.user_name),
      Boolean(profile.email),
      Boolean(profile.phone_number),
      Boolean(profile.vehicle),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const handleEditCancel = () => {
    if (!profile) return;
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
      const message = "Name is required.";
      setError(message);
      toast.error(message);
      return;
    }
    if (!formData.email.trim()) {
      const message = "Email is required.";
      setError(message);
      toast.error(message);
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
      const message = "Profile updated successfully.";
      setSaveMessage(message);
      toast.success(message);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail || "Unable to update profile.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Manage your personal details and account settings.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={14} className="shrink-0" />
            <p className="flex-1">{error}</p>
            <button type="button" onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <X size={14} />
            </button>
          </div>
        )}

        {saveMessage && (
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2 size={14} className="shrink-0" />
            <p className="flex-1">{saveMessage}</p>
            <button type="button" onClick={() => setSaveMessage(null)} className="shrink-0 text-emerald-400 hover:text-emerald-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">
            <div className="h-96 animate-pulse rounded-xl border border-gray-100 bg-white" />
            <div className="space-y-4">
              <div className="h-44 animate-pulse rounded-xl border border-gray-100 bg-white" />
              <div className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white" />
              <div className="h-20 animate-pulse rounded-xl border border-gray-100 bg-white" />
            </div>
          </div>
        )}

        {!loading && profile && (
          <div className="grid gap-5 md:grid-cols-[1fr_300px]">

            {/* Left: Personal details */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Personal Details</h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Contact info for bookings and account communication.
                  </p>
                </div>
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(true); setSaveMessage(null); setError(null); }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 active:scale-[0.98]"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEditCancel}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 active:scale-[0.98]"
                    >
                      <X size={12} />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleProfileSave()}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Save size={12} />
                      {saving ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-100">
                {(
                  [
                    { icon: CircleUserRound, label: "Full Name",     field: "user_name"    as const, type: "text",  placeholder: "Your full name" },
                    { icon: Mail,            label: "Email Address", field: "email"         as const, type: "email", placeholder: "you@example.com" },
                    { icon: Phone,           label: "Phone Number",  field: "phone_number"  as const, type: "tel",   placeholder: "+977-9800000000" },
                    { icon: Car,             label: "Vehicle",       field: "vehicle"       as const, type: "text",  placeholder: "e.g. Tesla Model 3" },
                  ] as const
                ).map(({ icon: Icon, label, field, type, placeholder }) => (
                  <div key={field} className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-gray-100 bg-gray-50">
                      <Icon size={13} className="text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
                      {isEditing ? (
                        <input
                          type={type}
                          value={formData[field]}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                          placeholder={placeholder}
                          className="mt-1.5 h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                        />
                      ) : (
                        <p className="mt-0.5 text-sm font-medium text-gray-900">
                          {formData[field] || (
                            <span className="font-normal text-gray-400">Not set</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">

              {/* Account summary */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3.5">
                  <h2 className="text-sm font-semibold text-gray-900">Account</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <ShieldCheck size={14} className="shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-[11px] text-gray-400">Status</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-sm font-medium text-gray-900">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    <CircleUserRound size={14} className="shrink-0 text-gray-400" />
                    <div>
                      <p className="text-[11px] text-gray-400">Role</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900">{formatRole(profile.role)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    <CalendarDays size={14} className="shrink-0 text-gray-400" />
                    <div>
                      <p className="text-[11px] text-gray-400">Member since</p>
                      <p className="mt-0.5 text-sm font-medium text-gray-900">{formatDate(profile.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wallet */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="border-b border-gray-100 px-4 py-3.5">
                  <h2 className="text-sm font-semibold text-gray-900">Wallet</h2>
                </div>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Wallet size={14} className="text-gray-400" />
                      <div>
                        <p className="text-[11px] text-gray-400">Balance</p>
                        <p className="mt-0.5 text-base font-bold text-gray-900">
                          Rs {walletBalance === null ? "—" : walletBalance.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate("/user/wallet")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <CreditCard size={12} />
                      Manage
                    </button>
                  </div>
                </div>
              </div>

         

              <div className="flex flex-wrap gap-2"> <button type="button" onClick={() => navigate("/user/reservations")} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50" > My Reservations </button> </div>
              

            </div>
          </div>
        )}
      </div>
    </main>
  );
}