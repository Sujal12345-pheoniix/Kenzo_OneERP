"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Layers, Users, DollarSign, FolderKanban, ArrowUpRight, TrendingUp } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const DEPT_THEME: Record<string, { icon: string; gradient: string; border: string; badge: string }> = {
  ENGINEERING:   { icon: "⚙️", gradient: "from-sky-50 to-blue-50",     border: "border-sky-100",    badge: "bg-sky-500" },
  HR:            { icon: "👥", gradient: "from-violet-50 to-purple-50", border: "border-violet-100", badge: "bg-violet-500" },
  FINANCE:       { icon: "💰", gradient: "from-emerald-50 to-green-50", border: "border-emerald-100",badge: "bg-emerald-500" },
  SALES:         { icon: "📈", gradient: "from-amber-50 to-yellow-50",  border: "border-amber-100",  badge: "bg-amber-500" },
  MANAGEMENT:    { icon: "🏢", gradient: "from-rose-50 to-red-50",      border: "border-rose-100",   badge: "bg-rose-500" },
  ADMINISTRATION:{ icon: "📋", gradient: "from-indigo-50 to-indigo-50", border: "border-indigo-100", badge: "bg-indigo-500" },
  SUPPORT:       { icon: "🎧", gradient: "from-teal-50 to-cyan-50",     border: "border-teal-100",   badge: "bg-teal-500" },
};

export default function DepartmentsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/hrms").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([hrms, proj]) => {
      setEmployees(hrms.employees || []);
      setProjects(proj.projects || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  // Aggregate by department
  const deptMap: Record<string, {
    count: number;
    active: number;
    totalSalary: number;
    roles: string[];
    members: any[];
  }> = {};

  employees.forEach((emp) => {
    if (!deptMap[emp.department]) {
      deptMap[emp.department] = { count: 0, active: 0, totalSalary: 0, roles: [], members: [] };
    }
    deptMap[emp.department].count++;
    if (emp.status === "ACTIVE") deptMap[emp.department].active++;
    deptMap[emp.department].totalSalary += emp.salary;
    if (!deptMap[emp.department].roles.includes(emp.position)) {
      deptMap[emp.department].roles.push(emp.position);
    }
    deptMap[emp.department].members.push(emp);
  });

  const departments = Object.entries(deptMap).map(([name, data]) => ({
    name,
    ...data,
    avgSalary: Math.round(data.totalSalary / data.count),
    theme: DEPT_THEME[name] || { icon: "🏢", gradient: "from-slate-50 to-slate-50", border: "border-slate-100", badge: "bg-slate-400" },
  }));

  const chartData = departments.map((d) => ({
    name: d.name.length > 8 ? d.name.slice(0, 8) + "…" : d.name,
    headcount: d.count,
    avgSalary: Math.round(d.avgSalary / 1000),
  }));

  const totalEmployees = employees.length;
  const totalPayroll   = employees.reduce((s, e) => s + e.salary, 0);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Layers className="h-4 w-4" /> Organization Structure
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Organizational hierarchy, headcount distribution, and compensation overview.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-3 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Departments</span>
            <span className="block text-xl font-extrabold text-slate-900">{departments.length}</span>
          </div>
          <div className="glass-panel px-4 py-3 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</span>
            <span className="block text-xl font-extrabold text-slate-900">{totalEmployees}</span>
          </div>
          <div className="glass-panel px-4 py-3 text-center">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Annual Payroll</span>
            <span className="block text-xl font-extrabold text-slate-900">${(totalPayroll / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>

      {/* Headcount chart */}
      <div className="glass-panel p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Headcount & Avg. Salary by Department</h2>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${v}k`} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="headcount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Headcount" />
              <Bar yAxisId="right" dataKey="avgSalary" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Salary ($k)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {departments.map((dept) => (
          <div
            key={dept.name}
            className={`rounded-2xl border p-5 bg-gradient-to-br ${dept.theme.gradient} ${dept.theme.border} hover:shadow-md transition-all`}
          >
            {/* Dept header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">
                {dept.theme.icon}
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{dept.name}</h3>
                <span className="text-[10px] text-slate-500 font-medium">{dept.count} members</span>
              </div>
              <div className={`ml-auto h-2 w-2 rounded-full ${dept.theme.badge}`} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/60 rounded-xl p-3">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Active</span>
                <span className="block text-lg font-extrabold text-slate-900">{dept.active}</span>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Avg Salary</span>
                <span className="block text-lg font-extrabold text-slate-900">${(dept.avgSalary / 1000).toFixed(0)}k</span>
              </div>
            </div>

            {/* Member avatars */}
            <div className="mb-3">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team Members</span>
              <div className="flex flex-wrap gap-1.5">
                {dept.members.slice(0, 6).map((m: any, i: number) => (
                  <div
                    key={i}
                    title={`${m.firstName} ${m.lastName}`}
                    className="h-7 w-7 rounded-lg bg-white border border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-700"
                  >
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </div>
                ))}
                {dept.members.length > 6 && (
                  <div className="h-7 w-7 rounded-lg bg-white/80 border border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-slate-500">
                    +{dept.members.length - 6}
                  </div>
                )}
              </div>
            </div>

            {/* Roles preview */}
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Roles</span>
              <div className="flex flex-wrap gap-1">
                {dept.roles.slice(0, 3).map((role: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 bg-white/70 rounded-full text-[9px] font-semibold text-slate-600 border border-white">
                    {role}
                  </span>
                ))}
                {dept.roles.length > 3 && (
                  <span className="px-2 py-0.5 bg-white/50 rounded-full text-[9px] font-semibold text-slate-500">
                    +{dept.roles.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Payroll */}
            <div className="mt-4 pt-3 border-t border-white/50 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-semibold">Dept. Payroll</span>
              <span className="text-sm font-extrabold text-slate-900">${dept.totalSalary.toLocaleString()}/yr</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
