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
  Loader2
} from "lucide-react";


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
        <span className="text-slate-500 text-sm mt-4 font-semibold tracking-wide">Securing Tenant Channel...</span>
      </div>
    );
  }

  const menuItems = [
    { name: "Executive Hub", href: "/dashboard", icon: LayoutDashboard },
    { name: "CRM & Customers", href: "/dashboard/crm", icon: Contact2 },
    { name: "Projects & Tasks", href: "/dashboard/projects", icon: FolderKanban },
    { name: "HRMS Operations", href: "/dashboard/hrms", icon: Users2 },
    { name: "Finance Control", href: "/dashboard/finance", icon: DollarSign },
    { name: "AI Copilot Hub", href: "/dashboard/copilot", icon: Bot },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Background Lights */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-72 sidebar-glass shrink-0 z-20">
        {/* Brand */}
        <div className="p-6 flex items-center justify-center border-b border-slate-100">
          <img src="/logo.png" alt="Kenzo Logo" className="h-10 w-auto object-contain" />
        </div>

        {/* Tenant Information Banner */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Tenant Isolation</span>
          <span className="block text-sm font-semibold text-slate-800 truncate">{user?.tenant?.name}</span>
          <span className="block text-xs text-sky-600 font-medium truncate">{user?.tenant?.domain}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  active
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/10"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? "text-white" : "text-slate-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Sign-out */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-800 truncate">{user?.name}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="h-3 w-3 text-sky-600" />
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase truncate">{user?.role}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50/5 cursor-pointer transition-colors"
          >
            <LogOut className="h-4.5 w-4.5" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Menu Toggle */}
      <div className="md:hidden absolute top-6 left-6 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 cursor-pointer shadow-sm"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar for Mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-20 flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-72 h-full bg-white border-r border-slate-200 z-30 p-6">
            <div className="flex items-center gap-3 mb-8 justify-center">
              <img src="/logo.png" alt="Kenzo Logo" className="h-10 w-auto object-contain" />
            </div>

            <div className="py-2.5 px-4 mb-6 rounded-xl bg-slate-50 border border-slate-100">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Workspace</span>
              <span className="block text-xs font-semibold text-slate-800">{user?.tenant?.name}</span>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                  {user?.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800">{user?.name}</span>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider">{user?.role}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50/5 cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                Logout Session
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-8 md:px-12 md:py-10 relative">
        {children}
      </main>
    </div>
  );
}
