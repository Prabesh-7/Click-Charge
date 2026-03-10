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
    { label: "Add Manager", path: "/admin/addManager" },
    { label: "Add Stations", path: "/admin/addStation" },
  ],

  staff: [{ label: "Dashboard", path: "/staff/dashboard" }],

  manager: [
    
    { label: "Dashboard", path: "/manager/dashboard" },
     { label: "Add Staff", path: "/manager/addStaff" }
  
  ],
};

export default sidebarMenu;