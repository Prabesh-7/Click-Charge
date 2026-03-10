import { Outlet } from "react-router-dom";
import Sidebar from "@/layout/Sidebar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

