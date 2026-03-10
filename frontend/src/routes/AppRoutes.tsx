import { Routes, Route } from "react-router-dom";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import UserDashboard from "@/features/user/pages/UserDashboard";


import ManagerDashboard from "@/features/manager/pages/ManagerDashboard";


import FindStations from "@/features/user/pages/FindStations";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import AddManagers from "@/features/admin/pages/AddManagers";
import AddStations from "@/features/admin/pages/AddStations";
import DashboardLayout from "@/layout/DashboardLayout";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* user*/}
      <Route path="/user" element={<DashboardLayout />}>
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="stations" element={<FindStations />} />
      </Route>


       {/* admin */}
       
      <Route path="/admin" element={<DashboardLayout />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="addManager" element={<AddManagers />} />
        <Route path="addStation" element={<AddStations />} />
      </Route>


            {/* admin */}
       
      <Route path="/manager" element={<DashboardLayout />}>
        <Route path="dashboard" element={<ManagerDashboard />} />
        </Route>
      
    </Routes>
  );
}