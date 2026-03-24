type MenuItem = {
  label: string;
  path: string;
};

export type Role = "user" | "admin" | "staff" | "manager";

const sidebarMenu: Record<Role, MenuItem[]> = {
  user: [
    { label: "Dashboard", path: "/user/dashboard" },
    { label: "Find Stations", path: "/user/stations" },
  ],

  admin: [
    { label: "Dashboard", path: "/admin/dashboard" },
    { label: "Stations", path: "/admin/stations" },
    { label: "Add Stations", path: "/admin/addStation" },
  ],

  staff: [{ label: "Dashboard", path: "/staff/dashboard" }],

  manager: [
    
    { label: "Dashboard", path: "/manager/dashboard" },
    { label: "Station Details", path: "/manager/stationDetails" },
    { label: "My Chargers", path: "/manager/myChargers" },
    { label: "Charger Control", path: "/manager/chargerControl" },
    { label: "Add Charger", path: "/manager/addCharger" },
    { label: "Add Staff", path: "/manager/addStaff" },
  
  ],
};

export default sidebarMenu;