"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  Loader2,
  Building2,
  Layers,
  UserCheck,
  BarChart3,
  Bell,
  Clock,
  TrendingUp,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  Zap,
  ArrowUpRight,
} from "lucide-react";

/* ─────────────────────────── Types ─────────────────────────── */
type MenuItem  = { name: string; href: string; icon: React.ElementType };
type MenuGroup = { label: string; items: MenuItem[] };

/* ─────────────────────── Role → Menus ──────────────────────── */
function getMenuGroups(role: string): MenuGroup[] {
  switch (role) {
    case "COMPANY_ADMIN":
    case "SUPER_ADMIN":
      return [
        { label: "Overview", items: [{ name: "Admin Control Hub", href: "/dashboard", icon: LayoutDashboard }] },
        {
          label: "Organization",
          items: [
            { name: "Companies",        href: "/dashboard/companies",   icon: Building2  },
            { name: "Departments",      href: "/dashboard/departments", icon: Layers     },
            { name: "Employee Tracker", href: "/dashboard/employees",   icon: UserCheck  },
          ],
        },
        {
          label: "Operations",
          items: [
            { name: "Projects & Tasks", href: "/dashboard/projects", icon: FolderKanban },
            { name: "CRM & Clients",    href: "/dashboard/crm",      icon: Contact2     },
            { name: "HR & Leaves",      href: "/dashboard/hrms",     icon: Users2       },
          ],
        },
        {
          label: "Finance & Reports",
          items: [
            { name: "Finance Overview",    href: "/dashboard/finance",    icon: DollarSign },
            { name: "Analytics & Reports", href: "/dashboard/analytics",  icon: BarChart3  },
          ],
        },
        {
          label: "Communication",
          items: [{ name: "Notice Board", href: "/dashboard/notices", icon: Bell }],
        },
        {
          label: "Intelligence",
          items: [{ name: "AI Copilot", href: "/dashboard/copilot", icon: Bot }],
        },
      ];

    case "CEO":
      return [
        { label: "Overview", items: [{ name: "CEO Strategic Suite", href: "/dashboard", icon: LayoutDashboard }] },
        {
          label: "Company",
          items: [
            { name: "Company Overview", href: "/dashboard/companies",   icon: Building2 },
            { name: "Departments",      href: "/dashboard/departments", icon: Layers    },
          ],
        },
        {
          label: "Operations",
          items: [
            { name: "Projects Overview", href: "/dashboard/projects", icon: FolderKanban },
            { name: "CRM & Pipeline",    href: "/dashboard/crm",      icon: Contact2     },
          ],
        },
        {
          label: "Finance & Intelligence",
          items: [
            { name: "Finance Dashboard", href: "/dashboard/finance",    icon: DollarSign },
            { name: "Analytics & KPIs",  href: "/dashboard/analytics",  icon: TrendingUp },
          ],
        },
        {
          label: "People",
          items: [{ name: "Employee Directory", href: "/dashboard/employees", icon: UserCheck }],
        },
        {
          label: "Communication",
          items: [{ name: "Notice Board", href: "/dashboard/notices", icon: Bell }],
        },
        {
          label: "Intelligence",
          items: [{ name: "AI Copilot", href: "/dashboard/copilot", icon: Bot }],
        },
      ];

    case "HR":
      return [
        { label: "Overview", items: [{ name: "HR Insights Portal", href: "/dashboard", icon: LayoutDashboard }] },
        {
          label: "People & Attendance",
          items: [
            { name: "Employee Directory", href: "/dashboard/employees", icon: Users2 },
            { name: "HRMS Operations",    href: "/dashboard/hrms",      icon: Clock  },
          ],
        },
        {
          label: "Communication",
          items: [{ name: "Notice Board", href: "/dashboard/notices", icon: Bell }],
        },
        {
          label: "Intelligence",
          items: [{ name: "AI Copilot", href: "/dashboard/copilot", icon: Bot }],
        },
      ];

    default: // DEVELOPER, PROJECT_MANAGER, EMPLOYEE
      return [
        { label: "My Workspace", items: [{ name: "My Dashboard",       href: "/dashboard",         icon: LayoutDashboard }] },
        { label: "My Work",      items: [{ name: "My Projects",         href: "/dashboard/projects", icon: FolderKanban   }] },
        { label: "My Records",   items: [{ name: "Attendance & Leave",  href: "/dashboard/hrms",     icon: Clock          }] },
        {
          label: "Company",
          items: [{ name: "Company Notices", href: "/dashboard/notices", icon: Bell }],
        },
        {
          label: "Intelligence",
          items: [{ name: "AI Copilot", href: "/dashboard/copilot", icon: Bot }],
        },
      ];
  }
}

/* ─────────────────────── Role badge config ─────────────────── */
const roleConfig: Record<string, { label: string; color: string; dot: string }> = {
  COMPANY_ADMIN:   { label: "Company Admin",         color: "#ef4444", dot: "#ef4444" },
  SUPER_ADMIN:     { label: "Super Admin",            color: "#ef4444", dot: "#ef4444" },
  CEO:             { label: "Chief Executive Officer",color: "#f59e0b", dot: "#f59e0b" },
  HR:              { label: "HR Manager",             color: "#8b5cf6", dot: "#8b5cf6" },
  DEVELOPER:       { label: "Developer",              color: "#0ea5e9", dot: "#0ea5e9" },
  PROJECT_MANAGER: { label: "Project Manager",        color: "#10b981", dot: "#10b981" },
  EMPLOYEE:        { label: "Employee",               color: "#6366f1", dot: "#6366f1" },
  FINANCE:         { label: "Finance Manager",        color: "#14b8a6", dot: "#14b8a6" },
};

/* ───────────────────── Notice Ping Dot ─────────────────────── */
function NoticePingDot({ hasHigh }: { hasHigh: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 ml-auto shrink-0">
      <span
        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${
          hasHigh ? "bg-red-400" : "bg-amber-400"
        }`}
      />
      <span
        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
          hasHigh ? "bg-red-500" : "bg-amber-400"
        }`}
      />
    </span>
  );
}

/* ──────────────────────── Theme Toggle ──────────────────────── */
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    setIsDark(current === "dark");
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("kenzo_theme", next); } catch {}
    setIsDark(!isDark);
  };

  return (
    <button
      onClick={toggle}
      className="theme-toggle"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
    >
      <span
        className="theme-toggle-icon"
        style={{ transform: isDark ? "rotate(0deg)" : "rotate(180deg)" }}
      >
        {isDark ? (
          <Sun className="h-4 w-4" style={{ color: "var(--accent-warning)" }} />
        ) : (
          <Moon className="h-4 w-4" style={{ color: "var(--accent-violet)" }} />
        )}
      </span>
    </button>
  );
}

/* ──────────────────────── Sidebar Content ───────────────────── */
function SidebarContent({
  user,
  pathname,
  handleLogout,
  onLinkClick,
  hasUnread,
  hasHighPriority,
  onNoticeRead,
}: {
  user: any;
  pathname: string;
  handleLogout: () => void;
  onLinkClick?: () => void;
  hasUnread: boolean;
  hasHighPriority: boolean;
  onNoticeRead: () => void;
}) {
  const menuGroups = getMenuGroups(user?.role || "EMPLOYEE");
  const rc = roleConfig[user?.role] || roleConfig.EMPLOYEE;
  const initials = user?.name?.slice(0, 2).toUpperCase() || "KZ";

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: "var(--bg-sidebar)" }}>
      {/* ── Logo ── */}
      <div
        className="px-5 py-4 flex items-center justify-between shrink-0"
        style={{ borderBottom: "1px solid var(--border-base)" }}
      >
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20">
            <span className="text-lg select-none">💎</span>
          </div>
          <span className="text-xl font-black tracking-wider text-slate-900 dark:text-white uppercase">KORE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <div
            className="h-2 w-2 rounded-full animate-pulse"
            style={{ background: "var(--accent-success)" }}
            title="System Online"
          />
        </div>
      </div>

      {/* ── Workspace badge ── */}
      <div
        className="px-4 py-3 shrink-0"
        style={{
          borderBottom: "1px solid var(--border-base)",
          background: "var(--bg-card-alt)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <Zap className="h-2.5 w-2.5" style={{ color: "var(--accent-primary)" }} />
          <span
            className="text-[9px] font-black uppercase tracking-[0.18em]"
            style={{ color: "var(--text-muted)" }}
          >
            Active Workspace
          </span>
        </div>
        <span
          className="block text-xs font-bold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {user?.tenant?.name}
        </span>
        <span
          className="block text-[10px] font-semibold truncate"
          style={{ color: "var(--accent-secondary)" }}
        >
          {user?.tenant?.domain}
        </span>
      </div>

      {/* ── Nav groups ── */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {menuGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            <p
              className="px-2 mb-1.5 text-[9px] font-black uppercase tracking-[0.18em] select-none"
              style={{ color: "var(--text-muted)" }}
            >
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isNotices = item.href === "/dashboard/notices";
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                const showDot = isNotices && hasUnread && !active;

                return (
                  <Link
                    key={item.name + item.href}
                    href={item.href}
                    onClick={() => {
                      if (isNotices) onNoticeRead();
                      onLinkClick?.();
                    }}
                    className="group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 cursor-pointer relative overflow-hidden"
                    style={
                      active
                        ? {
                            background: "var(--sidebar-active-bg)",
                            color: "var(--sidebar-active-text)",
                            boxShadow: "0 3px 14px var(--glow-primary)",
                          }
                        : {
                            color: "var(--text-secondary)",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = "";
                        (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                      }
                    }}
                  >
                    {/* Left accent bar on active */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full"
                        style={{ background: "rgba(255,255,255,0.6)" }}
                      />
                    )}

                    <Icon
                      className="h-[15px] w-[15px] shrink-0 transition-transform duration-200 group-hover:scale-110"
                      style={{ opacity: active ? 1 : 0.7 }}
                    />

                    <span className="leading-none truncate flex-1">{item.name}</span>

                    {showDot ? (
                      <NoticePingDot hasHigh={hasHighPriority} />
                    ) : (
                      active && (
                        <ChevronRight className="h-3 w-3 ml-auto shrink-0" style={{ opacity: 0.6 }} />
                      )
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── User footer ── */}
      <div
        className="px-3 py-3 shrink-0"
        style={{
          borderTop: "1px solid var(--border-base)",
          background: "var(--bg-card-alt)",
        }}
      >
        <div className="flex items-center gap-2.5 px-1 mb-2.5">
          {/* Avatar circle */}
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center font-black text-[11px] text-white shrink-0 shadow-md"
            style={{ background: `linear-gradient(135deg, ${rc.color} 0%, ${rc.dot} 100%)` }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className="block text-[12px] font-bold truncate leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.name}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold mt-0.5"
              style={{ color: rc.color }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: rc.dot }}
              />
              {user?.employee?.position || rc.label}
            </span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-all"
          style={{ color: "var(--accent-danger)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout Session
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────── Layout (root) ─────────────────────── */
const LS_KEY = "kenzo_notices_last_seen";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  const [user,            setUser]            = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [sidebarOpen,     setSidebarOpen]     = useState(false);
  const [hasUnread,       setHasUnread]       = useState(false);
  const [hasHighPriority, setHasHighPriority] = useState(false);
  const [latestTask,      setLatestTask]      = useState<any>(null);
  const [showTaskPopup,   setShowTaskPopup]   = useState(false);

  const checkAssignedTaskPopup = useCallback(async (curUser: any) => {
    if (!curUser) return;
    try {
      const res = await fetch("/api/projects/tasks");
      if (!res.ok) return;
      const tasksList = await res.json();
      if (Array.isArray(tasksList) && tasksList.length > 0) {
        const myTask = tasksList.find((t: any) => {
          if (!t || t.status === "DONE" || !t.assignee) return false;
          const matchUserId = t.assignee.userId === curUser.id;
          const matchEmail  = t.assignee.email === curUser.email || t.assignee.user?.email === curUser.email;
          const empFullName = `${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim().toLowerCase();
          const matchName   = empFullName === (curUser.name || '').trim().toLowerCase();
          return matchUserId || matchEmail || matchName;
        });

        if (myTask) {
          setLatestTask(myTask);
          setShowTaskPopup(true);
        } else {
          setLatestTask(null);
          setShowTaskPopup(false);
        }
      }
    } catch (e) {
      console.error("Task popup fetch error:", e);
    }
  }, []);

  /* ── Mark notices as read ── */
  const markNoticesRead = useCallback(() => {
    try { localStorage.setItem(LS_KEY, new Date().toISOString()); } catch {}
    setHasUnread(false);
    setHasHighPriority(false);
  }, []);

  /* ── Check for unread notices ── */
  const checkUnread = useCallback(async () => {
    try {
      const res  = await fetch("/api/notices");
      if (!res.ok) return;
      const json = await res.json();
      const notices: any[] = json.notices || [];
      if (notices.length === 0) { setHasUnread(false); return; }

      const lastSeen = (() => {
        try { return localStorage.getItem(LS_KEY); } catch { return null; }
      })();

      let anyNew  = false;
      let anyHigh = false;

      if (!lastSeen) {
        anyNew  = notices.length > 0;
        anyHigh = notices.some((n: any) => n.priority === "HIGH");
      } else {
        const lastSeenDate = new Date(lastSeen);
        const newNotices   = notices.filter((n: any) => new Date(n.timestamp) > lastSeenDate);
        anyNew  = newNotices.length > 0;
        anyHigh = newNotices.some((n: any) => n.priority === "HIGH");
      }

      setHasUnread(anyNew);
      setHasHighPriority(anyHigh);
    } catch {}
  }, []);

  /* ── Auth + initial notice check ── */
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
          checkUnread();
          checkAssignedTaskPopup(data.user);
        } else {
          router.push("/");
        }
        setLoading(false);
      })
      .catch(() => { router.push("/"); });
  }, [router, checkUnread, checkAssignedTaskPopup]);

  /* ── Poll for new notices and tasks ── */
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      checkUnread();
      checkAssignedTaskPopup(user);
    }, 20_000);
    return () => clearInterval(interval);
  }, [user, checkUnread, checkAssignedTaskPopup]);

  /* ── Auto-clear dot when navigating to notices ── */
  useEffect(() => {
    if (pathname === "/dashboard/notices" && hasUnread) {
      markNoticesRead();
    }
  }, [pathname, hasUnread, markNoticesRead]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  if (loading) {
    return (
      <div
        className="flex-1 min-h-screen flex flex-col items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        {/* Animated brand loader */}
        <div className="relative flex items-center justify-center">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Sparkles className="h-7 w-7 text-white animate-pulse" />
          </div>
          <div
            className="absolute h-20 w-20 rounded-2xl border-2 animate-spin"
            style={{
              borderColor: "var(--accent-primary)",
              borderTopColor: "transparent",
              animationDuration: "1.2s",
            }}
          />
        </div>
        <span
          className="text-sm mt-5 font-semibold tracking-wide"
          style={{ color: "var(--text-muted)" }}
        >
          Loading Your Portal...
        </span>
        <span
          className="text-xs mt-1"
          style={{ color: "var(--accent-primary)" }}
        >
          Kenzo OneERP
        </span>
      </div>
    );
  }

  const sidebarProps = {
    user,
    pathname,
    handleLogout,
    hasUnread,
    hasHighPriority,
    onNoticeRead: markNoticesRead,
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="ambient-blob w-96 h-96 -top-20 -left-20"
          style={{ background: "var(--accent-primary)", opacity: 0.04 }}
        />
        <div
          className="ambient-blob w-96 h-96 -bottom-20 -right-20"
          style={{ background: "var(--accent-secondary)", opacity: 0.04 }}
        />
        <div
          className="ambient-blob w-64 h-64 top-1/2 left-1/3"
          style={{ background: "var(--accent-violet)", opacity: 0.02 }}
        />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 sidebar-glass shrink-0 z-20 relative">
        {user && <SidebarContent {...sidebarProps} />}
      </aside>

      {/* Mobile Fixed Top Bar (iOS & Android) */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 flex items-center justify-between px-4"
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-base)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="relative p-2 rounded-xl cursor-pointer transition-all flex items-center justify-center"
          style={{
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-card)",
          }}
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          {hasUnread && !sidebarOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasHighPriority ? "bg-red-400" : "bg-amber-400"}`} />
              <span className={`relative inline-flex rounded-full h-3 w-3 ${hasHighPriority ? "bg-red-500" : "bg-amber-400"}`} />
            </span>
          )}
        </button>

        <img src="/logo.png" alt="Kenzo OneERP" className="h-7 w-auto object-contain" />

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 backdrop-blur-md transition-opacity"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative flex flex-col w-72 h-full z-50 overflow-hidden shadow-2xl animate-fade-in-up"
            style={{
              background: "var(--bg-sidebar)",
              borderRight: "1px solid var(--border-base)",
            }}
          >
            {user && (
              <SidebarContent
                {...sidebarProps}
                onLinkClick={() => setSidebarOpen(false)}
              />
            )}
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto relative z-10 pt-16 md:pt-0">
        <div className="flex-1 px-4 py-5 md:px-8 md:py-8">{children}</div>
      </main>

      {/* Assigned Task Pop-Up (Hovering & 30s Zoom Pulse — ONLY ON MY DASHBOARD /dashboard) */}
      {pathname === "/dashboard" && showTaskPopup && latestTask && (
        <div
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm p-4 rounded-2xl shadow-2xl task-popup-floating flex flex-col gap-3"
          style={{
            background: "#0b1329",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            color: "#ffffff",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Zap className="h-4 w-4 animate-pulse text-amber-400" />
              Assigned Work &amp; Task Pop-Up
            </div>
            <button
              onClick={() => setShowTaskPopup(false)}
              className="h-6 w-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <h4 className="font-extrabold text-sm text-white">{latestTask.title}</h4>
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">
              {latestTask.description || "Active task instructions attached to your project."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Project: {latestTask.project?.name || "Corporate Project"}
            </span>
            <span className={`px-2 py-0.5 rounded-full border ${
              latestTask.priority === "URGENT" || latestTask.priority === "CRITICAL"
                ? "bg-red-500/20 text-red-300 border-red-500/30"
                : latestTask.priority === "NEW"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : latestTask.priority === "UPDATING"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>
              {latestTask.priority || "HIGH"}
            </span>
            {latestTask.assignee && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Assigned: {latestTask.assignee.firstName} {latestTask.assignee.lastName?.slice(0, 1)}.
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setShowTaskPopup(false);
              router.push("/dashboard/projects");
            }}
            className="mt-1 w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/20 hover:scale-[1.02]"
          >
            <ArrowUpRight className="h-4 w-4" /> View Work &amp; Redirect to Task
          </button>
        </div>
      )}
    </div>
  );
}
