"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2, TrendingUp, DollarSign, Users, FolderKanban,
  Target, ArrowUpRight, BarChart3, Activity, Zap,
} from "lucide-react";
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  LineChart, Line,
  ScatterChart as ReScatterChart, Scatter, ZAxis,
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from "recharts";

/* ─── Colors ─── */
const PALETTE = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10b981", PLANNING: "#6366f1", COMPLETED: "#0ea5e9",
  ON_HOLD: "#f59e0b", PAID: "#10b981", DRAFT: "#94a3b8",
  SENT: "#6366f1", OVERDUE: "#ef4444",
};

/* ─── Chart type definitions ─── */
type ChartType = "area" | "line" | "bar" | "pie" | "histogram" | "scatter";
const CHART_TYPES: { type: ChartType; label: string; icon: string }[] = [
  { type: "area",      label: "Area",      icon: "〰" },
  { type: "line",      label: "Line",      icon: "📈" },
  { type: "bar",       label: "Bar",       icon: "📊" },
  { type: "histogram", label: "Histogram", icon: "📶" },
  { type: "pie",       label: "Pie",       icon: "🥧" },
  { type: "scatter",   label: "Scatter",   icon: "✦" },
];

/* ─── Tab definitions ─── */
type AnalyticsTab = "headcount" | "projects" | "funnel" | "expenses" | "compensation";
const TABS: { id: AnalyticsTab; label: string; icon: string }[] = [
  { id: "headcount",    label: "Headcount",    icon: "👥" },
  { id: "projects",     label: "Projects",     icon: "📁" },
  { id: "funnel",       label: "Lead Funnel",  icon: "🎯" },
  { id: "expenses",     label: "Expenses",     icon: "💰" },
  { id: "compensation", label: "Compensation", icon: "📈" },
];

/* ─── Custom Tooltip ─── */
const PremiumTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="p-3 rounded-xl text-xs"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-base)",
        boxShadow: "var(--shadow-elevated)",
        color: "var(--text-primary)",
        minWidth: 120,
      }}
    >
      {label && (
        <p className="font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
      )}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name?.toLowerCase().includes("salary") || p.name?.toLowerCase().includes("revenue") || p.name?.toLowerCase().includes("target") ? `₹${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Revenue Chart renderer ─── */
function RevenueChart({ data, type }: { data: any[]; type: ChartType }) {
  const commonAxisProps = {
    stroke: "var(--text-muted)",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
  };

  if (type === "pie") {
    // For pie, aggregate revenue & target into segments
    const pieData = data.map((d) => ({ name: d.month, value: d.revenue || 0 }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<PremiumTooltip />} />
          <Legend
            formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "scatter") {
    const scatterData = data.map((d, i) => ({ x: i + 1, y: d.revenue || 0, z: d.target || 0, month: d.month }));
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ReScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis type="number" dataKey="x" name="Month" {...commonAxisProps} tickFormatter={(v) => data[v-1]?.month || ""} domain={[0.5, data.length + 0.5]} />
          <YAxis type="number" dataKey="y" name="Revenue" {...commonAxisProps} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
          <ZAxis dataKey="z" range={[40, 200]} name="Target" />
          <Tooltip content={<PremiumTooltip />} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={scatterData} fill="#6366f1" />
        </ReScatterChart>
      </ResponsiveContainer>
    );
  }

  if (type === "histogram" || type === "bar") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <defs>
            <linearGradient id="barRevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
              <stop offset="100%" stopColor="#818cf8" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="barTgtGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
          <XAxis dataKey="month" {...commonAxisProps} />
          <YAxis {...commonAxisProps} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<PremiumTooltip />} />
          <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{v}</span>} />
          <Bar dataKey="revenue" name="Revenue" fill="url(#barRevGrad)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="target" name="Target" fill="url(#barTgtGrad)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
          <XAxis dataKey="month" {...commonAxisProps} />
          <YAxis {...commonAxisProps} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip content={<PremiumTooltip />} />
          <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{v}</span>} />
          <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={3} dot={{ fill: "#6366f1", r: 5, strokeWidth: 0 }} activeDot={{ r: 7 }} />
          <Line type="monotone" dataKey="target" name="Target" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="6 3" dot={{ fill: "#0ea5e9", r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default: Area
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="areaRevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="areaTgtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" />
        <XAxis dataKey="month" {...commonAxisProps} />
        <YAxis {...commonAxisProps} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<PremiumTooltip />} />
        <Legend formatter={(v) => <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>{v}</span>} />
        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#areaRevGrad)" />
        <Area type="monotone" dataKey="target" name="Target" stroke="#0ea5e9" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#areaTgtGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ─── Analytics Tab Content ─── */
function TabContent({ tab, data }: { tab: AnalyticsTab; data: any }) {
  const { departmentData = [], projectStatusData = [], leadFunnel = [], expenseChartData = [] } = data;
  const commonAxisProps = { stroke: "var(--text-muted)", fontSize: 11, tickLine: false, axisLine: false };

  switch (tab) {
    case "headcount":
      return (
        <div className="animate-fade-in">
          <div className="h-72 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} layout="vertical" barCategoryGap="25%">
                <defs>
                  <linearGradient id="hcGrad" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" horizontal={false} />
                <XAxis type="number" {...commonAxisProps} />
                <YAxis type="category" dataKey="name" {...commonAxisProps} width={90} />
                <Tooltip content={<PremiumTooltip />} />
                <Bar dataKey="employees" name="Employees" fill="url(#hcGrad)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Table */}
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-card)" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Avg Salary</th>
                </tr>
              </thead>
              <tbody>
                {departmentData.map((d: any, i: number) => (
                  <tr key={i}>
                    <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{d.name}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--bg-hover)", color: "var(--accent-primary)" }}>
                        {d.employees}
                      </span>
                    </td>
                    <td style={{ color: "var(--accent-success)" }}>₹{(d.avgSalary || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "projects":
      return (
        <div className="animate-fade-in">
          <div className="flex gap-6 mb-6">
            <div className="h-72 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {projectStatusData.map((entry: any, i: number) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PremiumTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3">
              {projectStatusData.map((item: any, i: number) => {
                const color = STATUS_COLORS[item.name] || PALETTE[i % PALETTE.length];
                return (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                    </div>
                    <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-card)" }}>
            <table className="premium-table">
              <thead><tr><th>Status</th><th>Count</th><th>Share</th></tr></thead>
              <tbody>
                {projectStatusData.map((item: any, i: number) => {
                  const total = projectStatusData.reduce((a: number, b: any) => a + b.value, 0) || 1;
                  const pct = ((item.value / total) * 100).toFixed(1);
                  const color = STATUS_COLORS[item.name] || PALETTE[i % PALETTE.length];
                  return (
                    <tr key={i}>
                      <td>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                        </span>
                      </td>
                      <td className="font-bold" style={{ color: "var(--text-primary)" }}>{item.value}</td>
                      <td style={{ color: "var(--text-muted)" }}>{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "funnel":
      return (
        <div className="animate-fade-in">
          <div className="space-y-4 mb-6">
            {leadFunnel.map((stage: any, i: number) => {
              const max = Math.max(...leadFunnel.map((s: any) => s.count), 1);
              const pct = (stage.count / max) * 100;
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span style={{ color: "var(--text-secondary)" }}>{stage.stage}</span>
                    <span className="font-black" style={{ color: "var(--text-primary)" }}>{stage.count} leads</span>
                  </div>
                  <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: stage.color || "var(--accent-primary)" }}
                    />
                  </div>
                  <div className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>
                    {pct.toFixed(1)}% of top of funnel
                  </div>
                </div>
              );
            })}
          </div>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-card)" }}>
            <table className="premium-table">
              <thead><tr><th>Stage</th><th>Count</th><th>Conversion</th></tr></thead>
              <tbody>
                {leadFunnel.map((stage: any, i: number) => {
                  const top = leadFunnel[0]?.count || 1;
                  return (
                    <tr key={i}>
                      <td>
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: stage.color || "var(--accent-primary)" }} />
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{stage.stage}</span>
                        </span>
                      </td>
                      <td className="font-bold" style={{ color: "var(--text-primary)" }}>{stage.count}</td>
                      <td style={{ color: "var(--accent-success)" }}>{((stage.count / top) * 100).toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "expenses":
      return (
        <div className="animate-fade-in">
          {expenseChartData.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-64 rounded-xl gap-3"
              style={{ background: "var(--bg-card-alt)", border: "1px dashed var(--border-card)" }}
            >
              <DollarSign className="h-10 w-10" style={{ color: "var(--text-muted)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>No approved expenses yet</p>
            </div>
          ) : (
            <>
              <div className="flex gap-6 mb-6">
                <div className="h-72 flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                        {expenseChartData.map((_: any, i: number) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PremiumTooltip />} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-3">
                  {expenseChartData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                        <span className="text-sm font-semibold truncate max-w-[120px]" style={{ color: "var(--text-secondary)" }}>{item.name}</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>₹{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-card)" }}>
                <table className="premium-table">
                  <thead><tr><th>Category</th><th>Amount</th><th>Share</th></tr></thead>
                  <tbody>
                    {expenseChartData.map((item: any, i: number) => {
                      const total = expenseChartData.reduce((a: number, b: any) => a + b.value, 0) || 1;
                      return (
                        <tr key={i}>
                          <td>
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{item.name}</span>
                            </span>
                          </td>
                          <td className="font-bold" style={{ color: "var(--accent-success)" }}>₹{item.value.toLocaleString()}</td>
                          <td style={{ color: "var(--text-muted)" }}>{((item.value / total) * 100).toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      );

    case "compensation":
      return (
        <div className="animate-fade-in">
          <div className="h-72 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData} barCategoryGap="30%">
                <defs>
                  <linearGradient id="salGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-card)" vertical={false} />
                <XAxis dataKey="name" {...commonAxisProps} />
                <YAxis {...commonAxisProps} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<PremiumTooltip />} formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, ""]} />
                <Bar dataKey="avgSalary" name="Avg Salary" fill="url(#salGrad)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-card)" }}>
            <table className="premium-table">
              <thead><tr><th>Department</th><th>Avg Salary</th><th>Headcount</th></tr></thead>
              <tbody>
                {departmentData.map((d: any, i: number) => (
                  <tr key={i}>
                    <td className="font-semibold" style={{ color: "var(--text-primary)" }}>{d.name}</td>
                    <td className="font-black" style={{ color: "var(--accent-success)" }}>₹{(d.avgSalary || 0).toLocaleString()}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "var(--bg-hover)", color: "var(--accent-primary)" }}>
                        {d.employees}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    default:
      return null;
  }
}

/* ═══════════════════════ PAGE COMPONENT ═══════════════════════ */
export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("headcount");
  const [chartType, setChartType] = useState<ChartType>("area");

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
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--gradient-brand)" }}
            >
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div
              className="absolute -inset-1 rounded-2xl border-2 animate-spin"
              style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent", animationDuration: "1s" }}
            />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Loading Analytics...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
          <Activity className="h-6 w-6" style={{ color: "var(--accent-danger)" }} />
        </div>
        <p className="text-sm font-semibold" style={{ color: "var(--accent-danger)" }}>{error}</p>
      </div>
    );
  }

  const { summary, departmentData, projectStatusData, revenueChartData, leadFunnel, expenseChartData } = data;

  const summaryCards = [
    {
      label: "Total Revenue",
      value: `₹${summary.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      gradient: "linear-gradient(135deg, #10b981, #34d399)",
      glow: "rgba(16,185,129,0.2)",
      trend: "+12.5%",
    },
    {
      label: "Net Profit",
      value: `₹${summary.netProfit.toLocaleString()}`,
      icon: TrendingUp,
      gradient: "linear-gradient(135deg, #6366f1, #818cf8)",
      glow: "rgba(99,102,241,0.2)",
      trend: "+8.2%",
    },
    {
      label: "Total Employees",
      value: summary.totalEmployees,
      icon: Users,
      gradient: "linear-gradient(135deg, #8b5cf6, #a78bfa)",
      glow: "rgba(139,92,246,0.2)",
      trend: "+3 this month",
    },
    {
      label: "Lead Conversion",
      value: `${summary.conversionRate}%`,
      icon: Target,
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      glow: "rgba(245,158,11,0.2)",
      trend: `${summary.wonLeads} deals won`,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto animate-fade-in-up">
      {/* ── Page Header ── */}
      <div className="pb-5" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div className="section-eyebrow">
          <BarChart3 className="h-4 w-4" />
          Intelligence Layer
        </div>
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
          Analytics &amp; Business Intelligence
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Comprehensive KPI monitoring, revenue trends, and operational insights.
        </p>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="stat-card animate-fade-in-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                  {c.label}
                </span>
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: c.gradient, boxShadow: `0 4px 14px ${c.glow}` }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                {c.value}
              </div>
              <div className="flex items-center gap-1 mt-2 text-[10px] font-bold" style={{ color: "var(--accent-success)" }}>
                <ArrowUpRight className="h-3 w-3" />
                {c.trend}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Revenue vs Target (with Chart Type Switcher) ── */}
      <div className="glass-panel p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
              Revenue vs Target — Last 6 Months
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Actual paid invoice revenue against 15% growth target
            </p>
          </div>
          {/* Chart Type Switcher Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.type}
                onClick={() => setChartType(ct.type)}
                className={`chart-pill ${chartType === ct.type ? "chart-pill-active" : ""}`}
              >
                <span>{ct.icon}</span>
                {ct.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <RevenueChart data={revenueChartData} type={chartType} />
        </div>
      </div>

      {/* ── Tabbed Analytics Sections ── */}
      <div className="glass-panel overflow-hidden">
        {/* Tab Bar */}
        <div
          className="px-6 pt-5 pb-0"
          style={{ borderBottom: "1px solid var(--border-base)" }}
        >
          <div className="flex items-center gap-1 overflow-x-auto pb-0 scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl whitespace-nowrap transition-all duration-200 border-b-2 cursor-pointer"
                style={
                  activeTab === tab.id
                    ? {
                        color: "var(--accent-primary)",
                        borderBottomColor: "var(--accent-primary)",
                        background: "var(--bg-hover)",
                      }
                    : {
                        color: "var(--text-muted)",
                        borderBottomColor: "transparent",
                        background: "transparent",
                      }
                }
              >
                <span className="text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <TabContent
            tab={activeTab}
            data={{ departmentData, projectStatusData, leadFunnel, expenseChartData }}
          />
        </div>
      </div>
    </div>
  );
}
