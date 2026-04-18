import {
  Activity,
  Banknote,
  Bell,
  Building2,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Package,
  ReceiptText,
  Star,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type MenuItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  section: string;
};

export type Role = "user" | "admin" | "staff" | "manager";

const sidebarMenu: Record<Role, MenuItem[]> = {
  user: [
    {
      label: "Find Stations",
      path: "/user/stations",
      icon: MapPinned,
      section: "Explore",
    },
    {
      label: "Charger Availability",
      path: "/user/availability",
      icon: Activity,
      section: "Explore",
    },
    {
      label: "My Reservations",
      path: "/user/reservations",
      icon: ReceiptText,
      section: "Explore",
    },
    {
      label: "Wallet",
      path: "/user/wallet",
      icon: Wallet,
      section: "Payments",
    },
    {
      label: "Add Balance",
      path: "/user/wallet",
      icon: Banknote,
      section: "Payments",
    },
  ],

  admin: [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
      section: "Overview",
    },
    {
      label: "Stations",
      path: "/admin/stations",
      icon: Building2,
      section: "Management",
    },
 
  ],

  staff: [
    {
      label: "Dashboard",
      path: "/staff/dashboard",
      icon: LayoutDashboard,
      section: "Overview",
    },
    {
      label: "My Chargers",
      path: "/staff/myChargers",
      icon: Package,
      section: "Operations",
    },
    {
      label: "Charger Control",
      path: "/staff/chargerControl",
      icon: Wrench,
      section: "Operations",
    },
    {
      label: "Manage Slots",
      path: "/staff/manageSlots",
      icon: ListChecks,
      section: "Operations",
    },
    {
      label: "Slot List",
      path: "/staff/slotList",
      icon: Bell,
      section: "Operations",
    },
  ],

  manager: [
    {
      label: "Dashboard",
      path: "/manager/dashboard",
      icon: LayoutDashboard,
      section: "Overview",
    },
    {
      label: "Station Details",
      path: "/manager/stationDetails",
      icon: MapPinned,
      section: "Stations",
    },
    {
      label: "Station Reviews",
      path: "/manager/stationReviews",
      icon: Star,
      section: "Stations",
    },
    {
      label: "My Chargers",
      path: "/manager/myChargers",
      icon: Package,
      section: "Charger",
    },
    {
      label: "Pricing",
      path: "/manager/pricing",
      icon: SlidersHorizontal,
      section: "Stations",
    },
    {
      label: "Charging Sessions",
      path: "/manager/chargingSessions",
      icon: ReceiptText,
      section: "Charger",
    },
    {
      label: "Payments",
      path: "/manager/sessionRevenue",
      icon: Banknote,
      section: "Charger",
    },
    {
      label: "Revenue Reports",
      path: "/manager/revenueReports",
      icon: ReceiptText,
      section: "Charger",
    },
    {
      label: "Manage Slots",
      path: "/manager/manageSlots",
      icon: ListChecks,
      section: "Stations",
    },
    {
      label: "Slot List",
      path: "/manager/slotList",
      icon: Bell,
      section: "Stations",
    },
    {
      label: "Reservations",
      path: "/manager/reservations",
      icon: Settings2,
      section: "Stations",
    },
    {
      label: "My Staff",
      path: "/manager/myStaff",
      icon: Users,
      section: "Team",
    },
    {
      label: "Charger Control",
      path: "/manager/chargerControl",
      icon: Wrench,
      section: "Charger",
    },
  ],
};

export default sidebarMenu;