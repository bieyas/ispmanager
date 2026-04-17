import { CreditCard, LayoutDashboard, Package2, Settings2, ShieldCheck, UserRoundPlus, UsersRound, WalletCards, Wrench } from "lucide-react";
import { createScopedStorageKeys } from "@ispmanager/web-utils";

export const storageKeys = createScopedStorageKeys("admin");

export const defaultMapView = {
  latitude: -7.5918921,
  longitude: 112.2676439,
  zoom: 14,
};

export const routes = [
  {
    key: "dashboard",
    path: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    permissions: ["dashboard.admin.read", "dashboard.teknisi.read", "dashboard.finance.read", "dashboard.customer.read"],
  },
  { key: "prospects", path: "/prospects", label: "PSB", icon: UserRoundPlus, permissions: ["prospects.list", "prospects.create"] },
  { key: "customers", path: "/customers", label: "Customers", icon: UsersRound, permissions: ["customers.list", "customers.read"] },
  { key: "subscriptions", path: "/subscriptions", label: "Subscriptions", icon: CreditCard, permissions: ["subscriptions.list", "subscriptions.read"] },
  { key: "finance", path: "/finance", label: "Finance", icon: WalletCards, permissions: ["cash_transactions.list", "reports.revenue.read"] },
  { key: "operations", path: "/operations", label: "Operations", icon: Wrench, permissions: ["tickets.list", "work_orders.list", "installation_verifications.read"] },
  { key: "service-plans", path: "/service-plans", label: "Plans", icon: Package2, permissions: ["service_plans.list", "service_plans.create"] },
  { key: "settings", path: "/settings", label: "Pengaturan", icon: Settings2, permissions: ["settings.general.read", "settings.general.update"] },
];
