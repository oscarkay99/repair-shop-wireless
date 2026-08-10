import type { RouteObject } from "react-router-dom";
import AppShell from "@/components/feature/AppShell";
import NotFound from "../pages/NotFound";
import SignInPage from "../pages/signin/page";
import AuthGuard from "../components/feature/AuthGuard";
import DashboardPage from "../pages/dashboard/page";
import PaymentsPage from "../pages/payments/page";
import AIStudioPage from "../pages/ai-studio/page";
import SettingsPage from "../pages/settings/page";
import InventoryPage from "../pages/inventory/page";
import CustomersPage from "../pages/customers/page";
import RepairsPage from "../pages/repairs/page";
import AnalyticsPage from "../pages/analytics/page";
import AuthenticationPage from "../pages/authentication/page";
import DeliveryPage from "../pages/delivery/page";
import LoyaltyPage from "../pages/loyalty/page";
import ExpensesPage from "../pages/expenses/page";
import WarrantyPage from "../pages/warranty/page";
import ReportsPage from "../pages/reports/page";
import ProfilePage from "../pages/profile/page";
import AccessDeniedPage from "../pages/AccessDenied";
import AuditLogsPage from "../pages/audit-logs/page";
import TechniciansPage from "../pages/technicians/page";
import AccessoriesSalesPage from "../pages/sales/page";
import InvoicesPage from "../pages/invoices/page";
import TechPortalPage from "../pages/tech-portal/page";
import InventoryPortalPage from "../pages/inventory-portal/page";
import ReceptionPortalPage from "../pages/reception/page";
import ActivityPage from "../pages/activity/page";
import AttendancePage from "../pages/attendance/page";

const routes: RouteObject[] = [
  { path: "/signin", element: <SignInPage /> },
  { path: "/tech-portal", element: <AuthGuard><TechPortalPage /></AuthGuard> },
  { path: "/reception", element: <AuthGuard requiredModule="Portal"><ReceptionPortalPage /></AuthGuard> },
  { path: "/inventory-portal", element: <AuthGuard requiredModule="Portal"><InventoryPortalPage /></AuthGuard> },

  {
    element: <AppShell />,
    children: [
      { path: "/",                   element: <AuthGuard requiredModule="Dashboard"><DashboardPage /></AuthGuard> },
      { path: "/access-denied",      element: <AuthGuard><AccessDeniedPage /></AuthGuard> },
      { path: "/analytics",          element: <AuthGuard requiredModule="Analytics"><AnalyticsPage /></AuthGuard> },
      { path: "/inventory",          element: <AuthGuard requiredModule="Inventory"><InventoryPage /></AuthGuard> },
      { path: "/payments",           element: <AuthGuard requiredModule="Payments"><PaymentsPage /></AuthGuard> },
      { path: "/sales",              element: <AuthGuard requiredModule="Sales"><AccessoriesSalesPage /></AuthGuard> },
      { path: "/customers",          element: <AuthGuard requiredModule="Customers"><CustomersPage /></AuthGuard> },
      { path: "/tickets",            element: <AuthGuard requiredModule="Tickets"><RepairsPage /></AuthGuard> },
      { path: "/technicians",        element: <AuthGuard requiredModule="Technicians"><TechniciansPage /></AuthGuard> },
      { path: "/attendance",         element: <AuthGuard requiredModule="Attendance"><AttendancePage /></AuthGuard> },
      { path: "/invoices",           element: <AuthGuard requiredModule="Invoices"><InvoicesPage /></AuthGuard> },
      { path: "/activity",           element: <AuthGuard requiredModule="Activity"><ActivityPage /></AuthGuard> },
      { path: "/ai-studio",          element: <AuthGuard requiredModule="AI Studio"><AIStudioPage /></AuthGuard> },
      { path: "/settings",           element: <AuthGuard requiredModule="Settings"><SettingsPage /></AuthGuard> },
      { path: "/authentication",     element: <AuthGuard requiredModule="Authentication"><AuthenticationPage /></AuthGuard> },
      { path: "/delivery",           element: <AuthGuard requiredModule="Delivery"><DeliveryPage /></AuthGuard> },
      { path: "/loyalty",            element: <AuthGuard requiredModule="Loyalty"><LoyaltyPage /></AuthGuard> },
      { path: "/expenses",           element: <AuthGuard requiredModule="Expenses"><ExpensesPage /></AuthGuard> },
      { path: "/warranty",           element: <AuthGuard requiredModule="Warranty"><WarrantyPage /></AuthGuard> },
      { path: "/reports",            element: <AuthGuard requiredModule="Reports"><ReportsPage /></AuthGuard> },
      { path: "/audit-logs",         element: <AuthGuard requiredModule="Audit Logs"><AuditLogsPage /></AuthGuard> },
      { path: "/profile",            element: <AuthGuard><ProfilePage /></AuthGuard> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
