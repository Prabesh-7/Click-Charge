import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";

import ManagerDashboard from "@/features/manager/pages/ManagerDashboard";

import FindStations from "@/features/user/pages/FindStations";
import StationAvailability from "@/features/user/pages/StationAvailability";
import StationSlots from "@/features/user/pages/StationSlots";
import UserStationDetails from "@/features/user/pages/StationDetails";
import WalletDashboard from "@/features/user/pages/WalletDashboard";
import EsewaPaymentPage from "@/features/user/pages/EsewaPaymentPage";
import PaymentSuccess from "@/features/user/pages/PaymentSuccess";
import PaymentFailure from "@/features/user/pages/PaymentFailure";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";

import AddStations from "@/features/admin/pages/AddStations";
import DashboardLayout from "@/layout/DashboardLayout";
import ViewStations from "@/features/admin/pages/ViewStations";
import AddCharger from "@/features/manager/pages/AddCharger";
import AddStaff from "@/features/manager/pages/AddStaff";
import MyChargers from "@/features/manager/pages/MyChargers";
import ChargerControl from "@/features/manager/pages/ChargerControl";
import StationDetails from "@/features/manager/pages/StationDetails";
import ManageSlots from "@/features/manager/pages/ManageSlots";
import SlotList from "@/features/manager/pages/SlotList";
import Pricing from "@/features/manager/pages/Pricing";
import ChargingSessions from "@/features/manager/pages/ChargingSessions";
import LiveSession from "@/features/manager/pages/LiveSession";
import Reservations from "@/features/manager/pages/Reservations";
import StaffDashboard from "@/features/staff/pages/StaffDashboard";
import MyStaff from "@/features/manager/pages/MyStaff";
import StaffMyChargers from "@/features/staff/pages/MyChargers";
import StaffChargerControl from "@/features/staff/pages/ChargerControl";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* user*/}
      <Route path="/user" element={<DashboardLayout />}>
        <Route index element={<Navigate to="stations" replace />} />
        <Route path="stations" element={<FindStations />} />
        <Route
          path="stations/:stationId/details"
          element={<UserStationDetails />}
        />
        <Route path="availability" element={<StationAvailability />} />
        <Route
          path="stations/:stationId/availability"
          element={<StationAvailability />}
        />
        <Route path="stations/:stationId/slots" element={<StationSlots />} />
        <Route path="wallet" element={<WalletDashboard />} />
        <Route path="wallet/add-funds/esewa" element={<EsewaPaymentPage />} />
        <Route path="wallet/payment-success" element={<PaymentSuccess />} />
        <Route path="wallet/payment-failure" element={<PaymentFailure />} />
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
        <Route path="stationDetails" element={<StationDetails />} />
        <Route path="addCharger" element={<AddCharger />} />
        <Route path="addStaff" element={<AddStaff />} />
        <Route path="myStaff" element={<MyStaff />} />
        <Route path="myChargers" element={<MyChargers />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="chargingSessions" element={<ChargingSessions />} />
        <Route path="chargerControl" element={<ChargerControl />} />
        <Route path="chargerControl/live-session" element={<LiveSession />} />
        <Route path="manageSlots" element={<ManageSlots />} />
        <Route path="slotList" element={<SlotList />} />
        <Route path="reservations" element={<Reservations />} />
      </Route>

      {/* staff */}
      <Route path="/staff" element={<DashboardLayout />}>
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="myChargers" element={<StaffMyChargers />} />
        <Route path="chargerControl" element={<StaffChargerControl />} />
      </Route>
    </Routes>
  );
}
