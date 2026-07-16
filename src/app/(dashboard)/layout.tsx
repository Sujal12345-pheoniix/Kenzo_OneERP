"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users2,
  FolderKanban,
  Contact2,
  DollarSign,
  Bot,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Loader2,
  Building2,
  Layers,
  UserCheck,
  BarChart3,
  Bell,
  Clock,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

type MenuItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

function getMenuGroups(role: string): MenuGroup[] {
  switch (role) {
    case "COMPANY_ADMIN":
    case "SUPER_ADMIN":
      return [
        {
          label: "Overview",
          items: [
            { name: "Admin Control Hub", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          label: "Organization",
          items: [
            { name: "Companies", href: "/dashboard/companies", icon: Building2 },
            { name: "Departments", href: "/dashboard/departments", icon: Layers },
            { name: "Employee Tracker", href: "/dashboard/employees", icon: UserCheck },
          ],
        },
        {
          label: "Operations",
          items: [
            { name: "Projects & Tasks", href: "/dashboard/projects", icon: FolderKanban },
            { name: "CRM & Clients", href: "/dashboard/crm", icon: Contact2 },
            { name: "HR & Leaves", href: "/dashboard/hrms", icon: Users2 },
          ],
        },
        {
          label: "Finance & Reports",
          items: [
            { name: "Finance Overview", href: "/dashboard/finance", icon: DollarSign },
            { name: "Analytics & Reports", href: "/dashboard/analytics", icon: BarChart3 },
          ],
        },
        {
          label: "Communication",
          items: [
            { name: "Notice Board", href: "/dashboard/notices", icon: Bell },
          ],
        },
        {
          label: "Intelligence",
          items: [
            { name: "AI Copilot", href: "/dashboard/copilot", icon: Bot },
          ],
        },
      ];

    case "CEO":
      return [
        {
          label: "Overview",
          items: [
            { name: "CEO Strategic Suite", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          label: "Company",
          items: [
            { name: "Company Overview", href: "/dashboard/companies", icon: Building2 },
            { name: "Departments", href: "/dashboard/departments", icon: Layers },
          ],
        },
        {
          label: "Operations",
          items: [
            { name: "Projects Overview", href: "/dashboard/projects", icon: FolderKanban },
            { name: "CRM & Pipeline", href: "/dashboard/crm", icon: Contact2 },
          ],
        },
        {
          label: "Finance & Intelligence",
          items: [
            { name: "Finance Dashboard", href: "/dashboard/finance", icon: DollarSign },
            { name: "Analytics & KPIs", href: "/dashboard/analytics", icon: TrendingUp },
          ],
        },
        {
          label: "People",
          items: [
            { name: "Employee Directory", href: "/dashboard/employees", icon: UserCheck },
          ],
        },
        {
          label: "Communication",
          items: [
            { name: "Notice Board", href: "/dashboard/notices", icon: Bell },
          ],
        },
        {
          label: "Intelligence",
          items: [
            { name: "AI Copilot", href: "/dashboard/copilot", icon: Bot },
          ],
        },
      ];

    case "HR":
      return [
        {
          label: "Overview",
          items: [
            { name: "HR Insights Portal", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          label: "People & Attendance",
          items: [
            { name: "Employee Directory", href: "/dashboard/employees", icon: Users2 },
            { name: "HRMS Operations", href: "/dashboard/hrms", icon: Clock },
          ],
        },
        {
          label: "Communication",
          items: [
            { name: "Notice Board", href: "/dashboard/notices", icon: Bell },
          ],
        },
        {
          label: "Intelligence",
          items: [
            { name: "AI Copilot", href: "/dashboard/copilot", icon: Bot },
          ],
        },
      ];

    default: // DEVELOPER, PROJECT_MANAGER, EMPLOYEE
      return [
        {
          label: "My Workspace",
          items: [
            { name: "My Dashboard", href: "/dashboard", icon: LayoutDashboard },
          ],
        },
        {
          label: "My Work",
          items: [
            { name: "My Projects", href: "/dashboard/projects", icon: FolderKanban },
          ],
        },
        {
          label: "My Records",
          items: [
            { name: "Attendance & Leave", href: "/dashboard/hrms", icon: Clock },
          ],
        },
        {
          label: "Company",
          items: [
            { name: "Company Notices", href: "/dashboard/notices", icon: Bell },
          ],
        },
        {
          label: "Intelligence",
          items: [
            { name: "AI Copilot", href: "/dashboard/copilot", icon: Bot },
          ],
        },
      ];
  }
}

const roleConfig: Record<string, { label: string; badgeCls: string; dotCls: string; avatarCls: string }> = {
  COMPANY_ADMIN: {
    label: "Company Admin",
    badgeCls: "text-rose-700 bg-rose-50 border-rose-200",
    dotCls: "bg-rose-500",
    avatarCls: "from-rose-50 to-rose-100 border-rose-200 text-rose-700",
  },
  SUPER_ADMIN: {
    label: "Super Admin",
    badgeCls: "text-rose-700 bg-rose-50 border-rose-200",
    dotCls: "bg-rose-500",
    avatarCls: "from-rose-50 to-rose-100 border-rose-200 text-rose-700",
  },
  CEO: {
    label: "Chief Executive Officer",
    badgeCls: "text-amber-700 bg-amber-50 border-amber-200",
    dotCls: "bg-amber-500",
    avatarCls: "from-amber-50 to-amber-100 border-amber-200 text-amber-700",
  },
  HR: {
    label: "HR Manager",
    badgeCls: "text-violet-700 bg-violet-50 border-violet-200",
    dotCls: "bg-violet-500",
    avatarCls: "from-violet-50 to-violet-100 border-violet-200 text-violet-700",
  },
  DEVELOPER: {
    label: "Developer",
    badgeCls: "text-sky-700 bg-sky-50 border-sky-200",
    dotCls: "bg-sky-500",
    avatarCls: "from-sky-50 to-sky-100 border-sky-200 text-sky-700",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    badgeCls: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dotCls: "bg-emerald-500",
    avatarCls: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700",
  },
  EMPLOYEE: {
    label: "Employee",
    badgeCls: "text-slate-600 bg-slate-50 border-slate-200",
    dotCls: "bg-slate-400",
    avatarCls: "from-slate-50 to-slate-100 border-slate-200 text-slate-700",
  },
  FINANCE: {
    label: "Finance Manager",
    badgeCls: "text-teal-700 bg-teal-50 border-teal-200",
    dotCls: "bg-teal-500",
    avatarCls: "from-teal-50 to-teal-100 border-teal-200 text-teal-700",
  },
};

function SidebarContent({
  user,
  pathname,
  handleLogout,
  onLinkClick,
}: {
  user: any;
  pathname: string;
  handleLogout: () => void;
  onLinkClick?: () => void;
}) {
  const menuGroups = getMenuGroups(user?.role || "EMPLOYEE");
  const rc = roleConfig[user?.role] || roleConfig.EMPLOYEE;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center justify-center border-b border-slate-100/80 shrink-0">
        <img src="/logo.png" alt="Kenzo OneERP" className="h-9 w-auto object-contain" />
      </div>

      {/* Workspace badge */}
      <div className="px-4 py-3 border-b border-slate-100/80 bg-slate-50/60 shrink-0">
        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-[0.12em] mb-0.5">
          Active Workspace
        </span>
        <span className="block text-xs font-bold text-slate-800 truncate">{user?.tenant?.name}</span>
        <span className="block text-[10px] text-sky-600 font-semibold truncate">{user?.tenant?.domain}</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {menuGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-3" : ""}>
            <p className="px-2 mb-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400 select-none">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                // exact match for dashboard, prefix match for subpages
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    onClick={onLinkClick}
                    className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-150 cursor-pointer ${
                      active
                        ? "bg-sky-600 text-white shadow-sm shadow-sky-600/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`h-[15px] w-[15px] shrink-0 transition-colors ${
                        active ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span className="leading-none truncate">{item.name}</span>
                    {active && (
                      <ChevronRight className="h-3 w-3 ml-auto text-white/60 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-slate-100/80 bg-white/60 shrink-0">
        <div className="flex items-center gap-2.5 px-1 mb-2.5">
          <div
            className={`h-8 w-8 rounded-lg bg-gradient-to-br ${rc.avatarCls} border flex items-center justify-center font-bold text-[11px] shrink-0`}
          >
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[12px] font-bold text-slate-800 truncate leading-tight">
              {user?.name}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${rc.badgeCls} mt-0.5`}
            >
              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${rc.dotCls}`} />
              {rc.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout Session
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        } else {
          router.push("/");
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 text-sky-600 animate-spin" />
        <span className="text-slate-500 text-sm mt-4 font-semibold tracking-wide">
          Loading Your Portal...
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-sky-500/4 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-500/4 blur-3xl" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 sidebar-glass shrink-0 z-20 relative">
        {user && (
          <SidebarContent
            user={user}
            pathname={pathname}
            handleLogout={handleLogout}
          />
        )}
      </aside>

      {/* Mobile menu button */}
      <div className="md:hidden absolute top-4 left-4 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer shadow-sm hover:shadow-md transition-all"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-60 h-full bg-white border-r border-slate-200 z-30 overflow-hidden">
            {user && (
              <SidebarContent
                user={user}
                pathname={pathname}
                handleLogout={handleLogout}
                onLinkClick={() => setSidebarOpen(false)}
              />
            )}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10">
        <div className="flex-1 px-5 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
