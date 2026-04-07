import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getMyStation } from "@/api/managerApi";
import sidebarMenu, { type Role } from "@/config/sidebarMenu";
import { ScrollArea } from "@/components/ui/scroll-area";

function normalizeRole(raw: unknown): Role | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (v === "admin") return "admin";
  if (v === "user") return "user";
  if (v === "staff") return "staff";
  if (v === "manager") return "manager";
  return null;
}

function safeReadUser(): any {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

export default function Sidebar() {
  const location = useLocation();
  const user = safeReadUser();
  const role = normalizeRole(user?.role) ?? "user";
  const [stationName, setStationName] = useState<string | null>(null);
  const menu = sidebarMenu[role] ?? [];
  const groupedMenu = menu.reduce<Record<string, typeof menu>>((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  useEffect(() => {
    let cancelled = false;

    const loadStationName = async () => {
      if (role !== "manager") {
        setStationName(null);
        return;
      }

      try {
        const station = await getMyStation();
        if (!cancelled) {
          setStationName(station?.station_name || null);
        }
      } catch {
        if (!cancelled) {
          setStationName(null);
        }
      }
    };

    void loadStationName();

    return () => {
      cancelled = true;
    };
  }, [role]);

  return (
    <aside className="sticky top-4 h-[calc(100vh-2rem)] w-72 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900">
              <span className="text-sm font-semibold">C</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900">
                Click & Charge
              </p>
              <p className="truncate text-xs text-slate-500">
                {role.toUpperCase()}
              </p>
            </div>
          </div>
          {stationName && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Station
              </p>
              <p className="mt-1 truncate text-sm font-medium text-slate-700">
                {stationName}
              </p>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <nav className="space-y-4 px-3 py-4">
            {Object.entries(groupedMenu).map(([section, items]) => (
              <div key={section}>
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {section}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {items.map((item) => {
                    const active = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                      <li key={`${item.label}-${item.path}`}>
                        <Link
                          to={item.path}
                          className={[
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            active
                              ? "bg-slate-100 text-slate-900"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                              active
                                ? "border-slate-200 bg-white text-slate-900"
                                : "border-transparent bg-slate-50 text-slate-500",
                            ].join(" ")}
                          >
                            <Icon size={15} strokeWidth={2.1} />
                          </span>
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </aside>
  );
}
