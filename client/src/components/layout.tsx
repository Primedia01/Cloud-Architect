/**
 * @file Main application layout with role-based sidebar navigation.
 * Renders a persistent sidebar, a top header bar, and a scrollable main content area.
 * Navigation items are filtered based on the authenticated user's role.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Megaphone,
  CalendarCheck,
  FileImage,
  Camera,
  FileCheck,
  Receipt,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Monitor,
} from "lucide-react";

/** Describes a sidebar navigation link with its label, route, icon, and permitted roles. */
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

/** Sidebar navigation entries. Each item specifies which user roles may see it. */
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    roles: ["department_admin", "campaign_planner", "finance_officer", "supplier_admin", "supplier_user", "auditor"],
  },
  {
    label: "Campaigns",
    href: "/campaigns",
    icon: Megaphone,
    roles: ["department_admin", "campaign_planner", "auditor"],
  },
  {
    label: "Bookings",
    href: "/bookings",
    icon: CalendarCheck,
    roles: ["department_admin", "campaign_planner", "supplier_admin", "supplier_user", "auditor"],
  },
  {
    label: "Live Inventory",
    href: "/inventory",
    icon: Monitor,
    roles: ["department_admin", "campaign_planner", "supplier_admin", "supplier_user", "auditor"],
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileImage,
    roles: ["department_admin", "campaign_planner", "supplier_admin", "supplier_user", "auditor"],
  },
  {
    label: "Invoices & Reports",
    href: "/invoices",
    icon: Receipt,
    roles: ["department_admin", "finance_officer", "auditor"],
  },
  {
    label: "Administration",
    href: "/admin",
    icon: Settings,
    roles: ["department_admin"],
  },
];

/** Maps internal role identifiers to human-readable display names. */
const roleLabels: Record<string, string> = {
  department_admin: "Department Admin",
  campaign_planner: "Campaign Planner",
  finance_officer: "Finance Officer",
  supplier_admin: "Supplier Admin",
  supplier_user: "Supplier User",
  auditor: "Auditor",
};

/**
 * Root layout component that renders the collapsible sidebar, top header bar,
 * and scrollable main content area. Navigation links are filtered by user role.
 */
export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  return (
    <div className="flex h-screen overflow-hidden" data-testid="layout-container">
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "hsl(220 25% 14%)" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-5 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white tracking-tight">OOH Booking</h1>
              <p className="text-[11px] text-white/50">Government Platform</p>
            </div>
          </div>

          <Separator className="bg-white/10" />

          <ScrollArea className="flex-1 px-3 py-3">
            <nav className="space-y-1">
              {filteredNav.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "text-white/60 hover:bg-white/8 hover:text-white/90"
                      }`}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      {isActive && <ChevronRight className="ml-auto h-3 w-3" />}
                    </button>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>

          <Separator className="bg-white/10" />

          <div className="px-4 py-4">
            <div className="mb-3">
              <p className="text-[13px] font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-[11px] text-white/40">{user?.role ? roleLabels[user.role] || user.role : ""}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              data-testid="button-logout"
              className="w-full justify-start text-white/50 hover:text-white hover:bg-white/8 text-[13px]"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-4 border-b bg-white px-4 py-3 lg:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-toggle-sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            System Online
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-background">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
