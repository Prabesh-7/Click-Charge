type MenuItem = {
  label: string;
  path: string;
};

export type Role = "user" | "admin" | "staff" | "manager";

const sidebarMenu: Record<Role, MenuItem[]> = {
  user: [
    { label: "Find Stations", path: "/user/stations" },
    { label: "Charger Availability", path: "/user/availability" },
  ],

  admin: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Stations", path: "/admin/stations" },
    { label: "Add Stations", path: "/admin/addStation" },
  ],

  staff: [
    { label: "Dashboard", path: "/staff/dashboard" },
    { label: "My Chargers", path: "/staff/myChargers" },
    { label: "Charger Control", path: "/staff/chargerControl" },
  ],

  manager: [
    { label: "Dashboard", path: "/manager/dashboard" },
    { label: "Station Details", path: "/manager/stationDetails" },
    { label: "My Chargers", path: "/manager/myChargers" },
    { label: "Manage Slots", path: "/manager/manageSlots" },
    { label: "Reservations", path: "/manager/reservations" },
    { label: "My Staff", path: "/manager/myStaff" },
    { label: "Charger Control", path: "/manager/chargerControl" },
    { label: "Add Charger", path: "/manager/addCharger" },
    { label: "Add Staff", path: "/manager/addStaff" },
  ],
};

export default sidebarMenu;