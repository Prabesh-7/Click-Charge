import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const hideSidebar = location.pathname.startsWith("/user");

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-foreground md:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-400 gap-3 md:min-h-[calc(100vh-2rem)]">
        {!hideSidebar && <Sidebar />}
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
