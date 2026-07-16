"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2, TrendingUp, DollarSign, Users, FolderKanban,
  Target, ArrowUpRight, BarChart3, PieChart as PieIcon,
  Activity, Zap
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, FunnelChart, Funnel, LabelList
} from "recharts";

const PIE_COLORS = ["#6366f1", "#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981", PLANNING: "#6366f1", COMPLETED: "#0284c7",
  ON_HOLD: "#f59e0b", PAID: "#10b981", DRAFT: "#94a3b8",
  SENT: "#6366f1", OVERDUE: "#ef4444",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setError(j.error);
        else setData(j);
        setLoading(false);
      })
      .catch(() => { setError("Failed to load analytics"); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-red-500 font-semibold">{error}</p>
      </div>
    );
  }

  const { summary, departmentData, projectStatusData, revenueChartData, leadFunnel, expenseChartData } = data;

  const summaryCards = [
    { label: "Total Revenue", value: `$${summary.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600 bg-emerald-50", trend: "+12.5%", up: true },
    { label: "Net Profit", value: `$${summary.netProfit.toLocaleString()}`, icon: TrendingUp, color: "text-sky-600 bg-sky-50", trend: "+8.2%", up: true },
    { label: "Total Employees", value: summary.totalEmployees, icon: Users, color: "text-violet-600 bg-violet-50", trend: "+3 this month", up: true },
    { label: "Lead Conversion", value: `${summary.conversionRate}%`, icon: Target, color: "text-amber-600 bg-amber-50", trend: summary.wonLeads + " deals won", up: true },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
          <BarChart3 className="h-4 w-4" /> Intelligence Layer
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Analytics & Business Intelligence</h1>
        <p className="text-slate-500 text-sm mt-0.5">Comprehensive KPI monitoring, revenue trends, and operational insights.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-panel p-5 glass-card-glow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{c.label}</span>
                <div className={`p-2 rounded-lg ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
              <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-bold ${c.up ? "text-emerald-600" : "text-red-500"}`}>
                <ArrowUpRight className="h-3 w-3" /> {c.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Revenue vs Target — Last 6 Months</h2>
            <p className="text-xs text-slate-500 mt-0.5">Actual paid invoice revenue against 15% growth target</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-500 inline-block" />Revenue</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-300 inline-block" />Target</span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChartData}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTgt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, ""]} />
              <Area type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={2.5} fill="url(#gradRev)" name="Revenue" />
              <Area type="monotone" dataKey="target" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#gradTgt)" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department & Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department headcount bar */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-violet-600" /> Headcount by Department
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="employees" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project status donut */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FolderKanban className="h-4.5 w-4.5 text-sky-600" /> Project Status Breakdown
          </h3>
          <div className="h-60 flex items-center">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {projectStatusData.map((entry: any, i: number) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {projectStatusData.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[item.name] || PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Funnel & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead funnel */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-amber-600" /> Lead Conversion Funnel
          </h3>
          <div className="space-y-3">
            {leadFunnel.map((stage: any, i: number) => {
              const max = Math.max(...leadFunnel.map((s: any) => s.count), 1);
              const pct = (stage.count / max) * 100;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{stage.stage}</span>
                    <span className="text-slate-900 font-bold">{stage.count} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense category donut */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <DollarSign className="h-4.5 w-4.5 text-rose-600" /> Expenses by Category
          </h3>
          {expenseChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">No approved expenses yet</div>
          ) : (
            <div className="h-56 flex items-center">
              <ResponsiveContainer width="55%" height="100%">
                <PieChart>
                  <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={4} dataKey="value">
                    {expenseChartData.map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {expenseChartData.map((item: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600 font-medium truncate max-w-[90px]">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avg Salary by Department */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Zap className="h-4.5 w-4.5 text-emerald-600" /> Average Compensation by Department
        </h3>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, ""]} />
              <Bar dataKey="avgSalary" fill="#10b981" radius={[6, 6, 0, 0]} name="Avg Salary" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
