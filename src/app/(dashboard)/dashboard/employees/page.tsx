"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2, Users, Search, UserCheck, Briefcase, DollarSign
} from "lucide-react";

const DEPT_COLORS: Record<string, { bg: string; color: string }> = {
  ENGINEERING:    { bg: "rgba(14,165,233,0.12)",  color: "#38bdf8" },
  HR:             { bg: "rgba(139,92,246,0.12)",  color: "#a78bfa" },
  FINANCE:        { bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
  SALES:          { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24" },
  MANAGEMENT:     { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
  ADMINISTRATION: { bg: "rgba(99,102,241,0.12)",  color: "#818cf8" },
  SUPPORT:        { bg: "rgba(20,184,166,0.12)",  color: "#2dd4bf" },
};

const STATUS_CONFIG: Record<string, { bg: string; color: string }> = {
  ACTIVE:     { bg: "rgba(16,185,129,0.12)",  color: "#34d399" },
  INACTIVE:   { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  TERMINATED: { bg: "rgba(239,68,68,0.12)",   color: "#f87171" },
};

export default function EmployeesPage() {
  const [employees, setEmployees]   = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/hrms")
      .then((r) => r.json())
      .then((data) => {
        setEmployees(data.employees || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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

  const activeCount  = employees.filter((e) => e.status === "ACTIVE").length;
  const avgSalary    = employees.length > 0
    ? Math.round(employees.reduce((s, e) => s + e.salary, 0) / employees.length)
    : 0;
  const totalPayroll = employees.reduce((s, e) => s + e.salary, 0);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-400">Loading Employee Directory...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div className="pb-4" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div className="section-eyebrow"><UserCheck className="h-4 w-4" /> Human Capital Roster</div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Employee Tracker</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Complete roster of all corporate staff, departments, and compensation records.</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="stat-card">
          <span className="form-label mb-1">Total Headcount</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>{employees.length}</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>All registered employees</span>
        </div>
        <div className="stat-card">
          <span className="form-label mb-1">Active Staff</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-success)" }}>{activeCount}</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Currently active</span>
        </div>
        <div className="stat-card">
          <span className="form-label mb-1">Avg. Salary</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-secondary)" }}>Rs. {avgSalary.toLocaleString()}</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Annual average</span>
        </div>
        <div className="stat-card">
          <span className="form-label mb-1">Total Payroll</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-primary)" }}>Rs. {(totalPayroll / 1000).toFixed(0)}K</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Annual package commitment</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-panel p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top.1/2 -translate-y-1/2 top-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="form-select font-semibold md:w-52"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d === "ALL" ? "All Departments" : d}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select font-semibold md:w-44"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === "ALL" ? "All Statuses" : s}</option>
            ))}
          </select>
        </div>
        <p className="text-xs font-semibold mt-2" style={{ color: "var(--text-muted)" }}>{filtered.length} of {employees.length} records shown</p>
      </div>

      {/* Employee Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Contact</th>
                <th>Department</th>
                <th>Position</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Hired</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    No employees match your search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => {
                  const sc = STATUS_CONFIG[emp.status] || STATUS_CONFIG.INACTIVE;
                  const dc = DEPT_COLORS[emp.department] || { bg: "var(--bg-hover)", color: "var(--text-primary)" };
                  return (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0" style={{ background: "var(--bg-input)", color: "var(--accent-primary)", border: "1px solid var(--border-card)" }}>
                            {emp.firstName?.[0]}{emp.lastName?.[0]}
                          </div>
                          <div>
                            <span className="font-bold block" style={{ color: "var(--text-primary)" }}>{emp.firstName} {emp.lastName}</span>
                            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>ID: {emp.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{emp.user?.email || "—"}</td>
                      <td>
                        <span className="badge" style={{ background: dc.bg, color: dc.color }}>
                          {emp.department}
                        </span>
                      </td>
                      <td className="font-semibold" style={{ color: "var(--text-secondary)" }}>{emp.position}</td>
                      <td className="font-black" style={{ color: "var(--accent-success)" }}>Rs. {emp.salary.toLocaleString()}</td>
                      <td>
                        <span className="badge" style={{ background: sc.bg, color: sc.color }}>
                          {emp.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
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
