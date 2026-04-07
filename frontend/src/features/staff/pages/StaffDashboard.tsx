import { useNavigate } from "react-router-dom";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-7 md:px-6 md:py-10">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#22C55E]">
                  Staff Workspace
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Welcome, {user.user_name || "Staff"}
              </h1>
              <p className="mt-1.5 text-sm text-gray-500">
                Manage assigned chargers with a clean, easy-to-read workspace.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-right shadow-sm">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Role
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Staff</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/staff/myChargers")}
            className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Operations
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900">My Chargers</p>
            <p className="mt-1 text-sm text-gray-600">
              Review chargers assigned to your station.
            </p>
          </button>

          <button
            type="button"
            onClick={() => navigate("/staff/chargerControl")}
            className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Operations
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900">
              Charger Control
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Start charging and monitor live connector activity.
            </p>
          </button>
        </section>
      </div>
    </main>
  );
}
