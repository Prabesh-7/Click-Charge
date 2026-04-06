import { Link, useLocation } from "react-router-dom";
import sidebarMenu, { type Role } from "@/config/sidebarMenu";

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
  const menu = sidebarMenu[role] ?? [];

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 border-r bg-sidebar text-sidebar-foreground p-4">
      <div className="mb-4 text-sm font-semibold opacity-80">
        {role.toUpperCase()}
      </div>
      <ul className="space-y-2">
        {menu.map((item) => {
          const active = location.pathname === item.path;
          return (
            <li key={`${item.label}-${item.path}`}>
              <Link
                to={item.path}
                className={[
                  "block p-2 rounded transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/70",
                ].join(" ")}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
