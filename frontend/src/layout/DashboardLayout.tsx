import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";

export default function DashboardLayout() {
  const location = useLocation();
  const hideSidebar = location.pathname.startsWith("/user");

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {!hideSidebar && <Sidebar />}
      <div className="flex-1  min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
