"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Loader2, Layers, X, Briefcase, CalendarDays, ClipboardList,
  CheckCircle2, Clock, AlertCircle, UserCheck, TrendingUp, DollarSign,
  Mail, Building2, Calendar, ChevronLeft, ChevronRight, Award
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/* ─── Department theming ───────────────────────────────────────── */
const DEPT_THEME: Record<string, { icon: string; gradient: string; border: string; badge: string; accent: string }> = {
  ENGINEERING:   { icon: "⚙️", gradient: "from-sky-50 to-blue-50",     border: "border-sky-100",    badge: "bg-sky-500",     accent: "text-sky-600" },
  HR:            { icon: "👥", gradient: "from-violet-50 to-purple-50", border: "border-violet-100", badge: "bg-violet-500",  accent: "text-violet-600" },
  FINANCE:       { icon: "💰", gradient: "from-emerald-50 to-green-50", border: "border-emerald-100",badge: "bg-emerald-500", accent: "text-emerald-600" },
  SALES:         { icon: "📈", gradient: "from-amber-50 to-yellow-50",  border: "border-amber-100",  badge: "bg-amber-500",   accent: "text-amber-600" },
  MANAGEMENT:    { icon: "🏢", gradient: "from-rose-50 to-red-50",      border: "border-rose-100",   badge: "bg-rose-500",    accent: "text-rose-600" },
  ADMINISTRATION:{ icon: "📋", gradient: "from-indigo-50 to-indigo-50", border: "border-indigo-100", badge: "bg-indigo-500",  accent: "text-indigo-600" },
  SUPPORT:       { icon: "🎧", gradient: "from-teal-50 to-cyan-50",     border: "border-teal-100",   badge: "bg-teal-500",    accent: "text-teal-600" },
};

const TASK_STATUS: Record<string, { cls: string; label: string; icon: React.ElementType }> = {
  TODO:        { cls: "bg-slate-100 text-slate-700 border-slate-200",   label: "To Do",      icon: ClipboardList  },
  IN_PROGRESS: { cls: "bg-sky-100 text-sky-700 border-sky-200",         label: "In Progress",icon: Clock          },
  REVIEW:      { cls: "bg-amber-100 text-amber-700 border-amber-200",   label: "In Review",  icon: AlertCircle    },
  DONE:        { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Done",   icon: CheckCircle2   },
};

const PRIORITY_BADGE: Record<string, string> = {
  LOW:      "bg-slate-100 text-slate-600",
  MEDIUM:   "bg-sky-100 text-sky-700",
  HIGH:     "bg-amber-100 text-amber-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const ATTEND_COLOR: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  LATE:    "bg-amber-400",
  ABSENT:  "bg-red-400",
  LEAVE:   "bg-violet-400",
};

const LEAVE_STATUS_CLS: Record<string, string> = {
  PENDING:  "bg-amber-100 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

/* ─── Mini attendance grid (last 30 days) ──────────────────────── */
function AttendanceGrid({ attendances }: { attendances: any[] }) {
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d;
  });

  const attMap: Record<string, string> = {};
  attendances.forEach((a) => {
    const key = new Date(a.date).toDateString();
    attMap[key] = a.status;
  });

  return (
    <div className="flex flex-wrap gap-1">
      {days.map((d, i) => {
        const key = d.toDateString();
        const status = attMap[key];
        const isToday = d.toDateString() === today.toDateString();
        return (
          <div
            key={i}
            title={`${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${status || "No record"}`}
            className={`h-4 w-4 rounded-sm transition-all ${
              status ? ATTEND_COLOR[status] : "bg-slate-100"
            } ${isToday ? "ring-2 ring-offset-1 ring-sky-500" : ""}`}
          />
        );
      })}
    </div>
  );
}

/* ─── Full-screen Employee Profile Modal ───────────────────────── */
function EmployeeProfileModal({ empId, onClose }: { empId: string; onClose: () => void }) {
  const [emp, setEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/employees/${empId}`)
      .then((r) => r.json())
      .then((d) => { setEmp(d.employee); setLoading(false); })
      .catch(() => setLoading(false));
  }, [empId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const tasks          = emp?.tasks || [];
  const pendingTasks   = tasks.filter((t: any) => t.status !== "DONE");
  const completedTasks = tasks.filter((t: any) => t.status === "DONE");
  const leaves         = emp?.leaves || [];
  const attendances    = emp?.attendances || [];

  // Attendance stats
  const presentDays  = attendances.filter((a: any) => a.status === "PRESENT").length;
  const lateDays     = attendances.filter((a: any) => a.status === "LATE").length;
  const leaveDays    = attendances.filter((a: any) => a.status === "LEAVE").length;

  const theme = DEPT_THEME[emp?.department] || {
    icon: "🏢", gradient: "from-slate-50 to-slate-50", border: "border-slate-100",
    badge: "bg-slate-400", accent: "text-slate-600",
  };

  // Current projects (unique from tasks)
  const activeProjects = Array.from(
    new Map(
      tasks.filter((t: any) => t.status === "IN_PROGRESS" && t.project)
           .map((t: any) => [t.project.id, t.project])
    ).values()
  ) as any[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-100 flex flex-col">

        {/* Header gradient banner */}
        <div className={`bg-gradient-to-br ${theme.gradient} px-8 pt-8 pb-6 rounded-t-3xl border-b ${theme.border} shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-9 w-9 flex items-center justify-center rounded-xl bg-white/80 hover:bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer shadow-sm"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {loading ? (
            <div className="flex items-center gap-4 h-20">
              <Loader2 className="h-7 w-7 text-slate-400 animate-spin" />
              <span className="text-slate-500 font-medium">Loading profile…</span>
            </div>
          ) : emp ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-2xl bg-white shadow-md border border-white flex items-center justify-center text-2xl font-extrabold text-slate-700 shrink-0">
                {emp.firstName?.[0]}{emp.lastName?.[0]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {emp.firstName} {emp.lastName}
                </h2>
                <p className="text-slate-600 font-semibold mt-0.5">{emp.position}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-white/80 ${theme.accent} border-current/20`}>
                    <span className={`h-2 w-2 rounded-full ${theme.badge}`} />
                    {emp.department}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Mail className="h-3.5 w-3.5" />
                    {emp.user?.email || "—"}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Joined {new Date(emp.hireDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Status pill */}
              <div className={`px-4 py-2 rounded-xl text-xs font-bold border shrink-0 ${
                emp.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {emp.status}
              </div>
            </div>
          ) : (
            <p className="text-red-600">Failed to load employee profile.</p>
          )}
        </div>

        {/* Body */}
        {emp && !loading && (
          <div className="p-6 flex flex-col gap-6">

            {/* ── Stat row ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Assigned Tasks", value: tasks.length,      color: "text-slate-900", icon: ClipboardList },
                { label: "Pending Tasks",  value: pendingTasks.length, color: "text-amber-600", icon: Clock        },
                { label: "Completed",      value: completedTasks.length, color: "text-emerald-600", icon: CheckCircle2 },
                { label: "Leave Requests", value: leaves.length,     color: "text-violet-600", icon: CalendarDays  },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                  </div>
                  <span className={`text-2xl font-extrabold ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            {/* ── Currently Working On ── */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-4 w-4 text-sky-600" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Currently Working On</h3>
              </div>
              {activeProjects.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No active project assignments at this time.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {activeProjects.map((proj: any) => (
                    <div key={proj.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3">
                      <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-sky-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{proj.name}</p>
                        <p className="text-[10px] text-slate-500">{proj.status}</p>
                      </div>
                      <span className="ml-auto px-2.5 py-1 bg-sky-50 border border-sky-200 text-sky-700 rounded-full text-[9px] font-bold">
                        ACTIVE
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Assigned Tasks ── */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Assigned Tasks</h3>
                <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{tasks.length}</span>
              </div>
              {tasks.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 italic">No tasks assigned yet.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {tasks.slice(0, 8).map((task: any) => {
                    const ts = TASK_STATUS[task.status] || TASK_STATUS.TODO;
                    const Icon = ts.icon;
                    return (
                      <div key={task.id} className="px-5 py-3.5 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${ts.cls.split(" ").find(c => c.startsWith("text-")) || "text-slate-500"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm truncate">{task.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{task.project?.name || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${ts.cls}`}>{ts.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${PRIORITY_BADGE[task.priority] || ""}`}>{task.priority}</span>
                          {task.dueDate && (
                            <span className="text-[9px] text-slate-400 font-medium">
                              {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {tasks.length > 8 && (
                    <div className="px-5 py-3 text-center text-xs text-slate-400 font-semibold">
                      +{tasks.length - 8} more tasks
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Attendance ── */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Attendance (Last 30 Days)</h3>
              </div>
              <div className="flex flex-wrap gap-4 mb-4 text-xs font-semibold">
                {[
                  { label: "Present", count: presentDays, color: "text-emerald-600", dot: "bg-emerald-500" },
                  { label: "Late",    count: lateDays,    color: "text-amber-600",   dot: "bg-amber-400"  },
                  { label: "On Leave",count: leaveDays,   color: "text-violet-600",  dot: "bg-violet-400" },
                ].map(({ label, count, color, dot }) => (
                  <span key={label} className={`flex items-center gap-1.5 ${color}`}>
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    {label}: <strong>{count}</strong>
                  </span>
                ))}
              </div>
              <AttendanceGrid attendances={attendances} />
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { color: "bg-emerald-500", label: "Present" },
                  { color: "bg-amber-400",   label: "Late"    },
                  { color: "bg-red-400",     label: "Absent"  },
                  { color: "bg-violet-400",  label: "Leave"   },
                  { color: "bg-slate-100",   label: "No record"},
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                    <span className={`h-3 w-3 rounded-sm ${color}`} />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Leaves ── */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-violet-600" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Leave History</h3>
                <span className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{leaves.length}</span>
              </div>
              {leaves.length === 0 ? (
                <p className="px-5 py-6 text-sm text-slate-400 italic">No leave requests found.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {leaves.slice(0, 5).map((leave: any) => (
                    <div key={leave.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-sm">{leave.type} Leave</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(leave.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} →{" "}
                          {new Date(leave.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {leave.reason && (
                          <p className="text-[10px] text-slate-500 mt-0.5 italic truncate">"{leave.reason}"</p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border ${LEAVE_STATUS_CLS[leave.status] || ""}`}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                  {leaves.length > 5 && (
                    <div className="px-5 py-3 text-center text-xs text-slate-400 font-semibold">
                      +{leaves.length - 5} more
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Salary (admin sees it) ── */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Annual Compensation</p>
                <p className="text-white text-xl font-extrabold">${emp.salary.toLocaleString()}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider">Monthly</p>
                <p className="text-white font-extrabold">${Math.round(emp.salary / 12).toLocaleString()}</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function DepartmentsPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [projects, setProjects]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [userRole, setUserRole]   = useState("");
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/hrms").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
    ]).then(([sess, hrms, proj]) => {
      if (sess.authenticated) setUserRole(sess.user.role);
      setEmployees(hrms.employees || []);
      setProjects(proj.projects || []);
      setLoading(false);
    });
  }, []);

  const isAdmin = userRole === "COMPANY_ADMIN" || userRole === "SUPER_ADMIN";

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  // Aggregate by department
  const deptMap: Record<string, {
    count: number; active: number; totalSalary: number; roles: string[]; members: any[];
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
    name, ...data,
    avgSalary: Math.round(data.totalSalary / data.count),
    theme: DEPT_THEME[name] || { icon: "🏢", gradient: "from-slate-50 to-slate-50", border: "border-slate-100", badge: "bg-slate-400", accent: "text-slate-600" },
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
      {/* Profile Modal */}
      {selectedEmpId && (
        <EmployeeProfileModal
          empId={selectedEmpId}
          onClose={() => setSelectedEmpId(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Layers className="h-4 w-4" /> Organization Structure
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Departments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin
              ? "Click any team member avatar to view their full profile, tasks, attendance & leaves."
              : "Organizational hierarchy, headcount distribution, and compensation overview."}
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
        <h2 className="text-base font-bold text-slate-900 mb-4">Headcount &amp; Avg. Salary by Department</h2>
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

            {/* Member avatars — clickable for admin */}
            <div className="mb-3">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Team Members</span>
              <div className="flex flex-wrap gap-1.5">
                {dept.members.slice(0, 6).map((m: any, i: number) => {
                  const canClick = isAdmin;
                  return (
                    <div
                      key={i}
                      title={canClick ? `View ${m.firstName} ${m.lastName}'s profile` : `${m.firstName} ${m.lastName}`}
                      onClick={canClick ? () => setSelectedEmpId(m.id) : undefined}
                      className={`h-7 w-7 rounded-lg bg-white border border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-slate-700 select-none
                        ${canClick
                          ? "cursor-pointer hover:scale-110 hover:shadow-md hover:border-sky-300 hover:text-sky-700 transition-all duration-150 active:scale-95"
                          : ""
                        }`}
                    >
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </div>
                  );
                })}
                {dept.members.length > 6 && (
                  <div className="h-7 w-7 rounded-lg bg-white/80 border border-white shadow-sm flex items-center justify-center text-[9px] font-bold text-slate-500">
                    +{dept.members.length - 6}
                  </div>
                )}
              </div>
              {isAdmin && (
                <p className="text-[9px] text-slate-400 mt-1.5 font-medium">
                  ↑ Click avatar to view profile
                </p>
              )}
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
