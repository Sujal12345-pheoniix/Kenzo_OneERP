"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2, Users, Search, Filter, UserCheck, UserX,
  Briefcase, DollarSign, ChevronDown, Download, Plus, MoreHorizontal
} from "lucide-react";

const DEPT_COLORS: Record<string, string> = {
  ENGINEERING: "bg-sky-50 text-sky-700 border-sky-200",
  HR: "bg-violet-50 text-violet-700 border-violet-200",
  FINANCE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SALES: "bg-amber-50 text-amber-700 border-amber-200",
  MANAGEMENT: "bg-rose-50 text-rose-700 border-rose-200",
  ADMINISTRATION: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SUPPORT: "bg-teal-50 text-teal-700 border-teal-200",
};

const STATUS_CONFIG: Record<string, { cls: string; dot: string }> = {
  ACTIVE:     { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  INACTIVE:   { cls: "bg-slate-50 text-slate-600 border-slate-200",       dot: "bg-slate-400" },
  TERMINATED: { cls: "bg-red-50 text-red-600 border-red-200",             dot: "bg-red-500" },
};

export default function EmployeesPage() {
  const [employees, setEmployees]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userRole, setUserRole]     = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/hrms").then((r) => r.json()),
    ]).then(([sess, hrms]) => {
      if (sess.authenticated) setUserRole(sess.user.role);
      setEmployees(hrms.employees || []);
      setLoading(false);
    });
  }, []);

  const departments = ["ALL", ...Array.from(new Set(employees.map((e) => e.department)))];
  const statuses    = ["ALL", "ACTIVE", "INACTIVE", "TERMINATED"];

  const filtered = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchSearch = !search || fullName.includes(search.toLowerCase()) ||
      (emp.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === "ALL" || emp.department === deptFilter;
    const matchStatus = statusFilter === "ALL" || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const activeCount     = employees.filter((e) => e.status === "ACTIVE").length;
  const avgSalary       = employees.length > 0
    ? Math.round(employees.reduce((s, e) => s + e.salary, 0) / employees.length)
    : 0;
  const totalPayroll    = employees.reduce((s, e) => s + e.salary, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-1">
            <UserCheck className="h-4 w-4" /> Human Capital
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Tracker</h1>
          <p className="text-slate-500 text-sm mt-0.5">Complete roster of all corporate staff, departments, and compensation records.</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-panel p-5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Headcount</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{employees.length}</div>
          <span className="text-xs text-slate-500">All employees</span>
        </div>
        <div className="glass-panel p-5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Active Staff</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{activeCount}</div>
          <span className="text-xs text-slate-500">Currently active</span>
        </div>
        <div className="glass-panel p-5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Avg. Salary</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">Rs. {avgSalary.toLocaleString()}</div>
          <span className="text-xs text-slate-500">Annual average</span>
        </div>
        <div className="glass-panel p-5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Payroll</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">Rs. {(totalPayroll / 1000).toFixed(0)}K</div>
          <span className="text-xs text-slate-500">Annual cost</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
            ))}
          </select>
        </div>
        <p className="text-[10px] text-slate-400 font-semibold mt-2">{filtered.length} of {employees.length} records shown</p>
      </div>

      {/* Employee Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Employee</th>
                <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Contact</th>
                <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Department</th>
                <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Position</th>
                <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Salary</th>
                <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No employees match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const sc = STATUS_CONFIG[emp.status] || STATUS_CONFIG.INACTIVE;
                  const dc = DEPT_COLORS[emp.department] || "bg-slate-50 text-slate-700 border-slate-200";
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[11px] shrink-0">
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{emp.firstName} {emp.lastName}</span>
                            <span className="text-slate-400 text-[10px]">ID: {emp.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{emp.user?.email || "—"}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${dc}`}>
                          {emp.department}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700 font-semibold">{emp.position}</td>
                      <td className="px-4 py-4 font-bold text-slate-900">Rs. {emp.salary.toLocaleString()}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border ${sc.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(emp.hireDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
