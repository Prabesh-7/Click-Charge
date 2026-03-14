import { Routes, Route } from "react-router-dom";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import UserDashboard from "@/features/user/pages/UserDashboard";


import ManagerDashboard from "@/features/manager/pages/ManagerDashboard";


import FindStations from "@/features/user/pages/FindStations";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";

import AddStations from "@/features/admin/pages/AddStations";
import DashboardLayout from "@/layout/DashboardLayout";
import ViewStations from "@/features/admin/pages/ViewStations";
import AddCharger from "@/features/manager/pages/AddCharger";
import AddStaff from "@/features/manager/pages/AddStaff";
import MyChargers from "@/features/manager/pages/MyChargers";

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
        <Route path="stations" element={<ViewStations />} />
        <Route path="addStation" element={<AddStations />} />
      </Route>


            {/* manager */}
       
      <Route path="/manager" element={<DashboardLayout />}>
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="addCharger" element={<AddCharger />} />
        <Route path="addStaff" element={<AddStaff />} />
        <Route path="myChargers" element={<MyChargers />} />
        </Route>
      
    </Routes>
  );
}