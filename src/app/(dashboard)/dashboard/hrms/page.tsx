"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  PlusCircle, Loader2, CalendarDays, CheckCircle2, Clock, X,
  ChevronLeft, ChevronRight, UserCheck, AlertCircle, Sparkles, ClipboardList
} from "lucide-react";

import { usePermission } from "@/hooks/usePermission";

/* ─── Attendance color map ───────────────────────────────────── */
const ATTEND_STATUS_CONFIG: Record<string, {
  bg: string; dot: string; text: string; label: string;
}> = {
  PRESENT: { bg: "bg-emerald-500",  dot: "bg-emerald-500",  text: "text-emerald-600", label: "Present"  },
  LATE:    { bg: "bg-amber-400",    dot: "bg-amber-400",    text: "text-amber-600",   label: "Late"     },
  ABSENT:  { bg: "bg-red-400",      dot: "bg-red-400",      text: "text-red-600",     label: "Absent"   },
  LEAVE:   { bg: "bg-violet-400",   dot: "bg-violet-400",   text: "text-violet-600",  label: "On Leave" },
};

/* ─── Attendance Calendar Component ─────────────────────────── */
function AttendanceCalendar({ userRole }: { userRole: string }) {
  const canMark = !["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"].includes(userRole);

  const [attendances, setAttendances]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [marking, setMarking]           = useState(false);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [calMonth, setCalMonth]         = useState(() => {
    const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() };
  });

  const fetchAttendance = useCallback(async () => {
    try {
      const res  = await fetch("/api/attendance");
      const json = await res.json();
      setAttendances(json.attendances || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  // Build a map  dateString → status
  const attMap: Record<string, string> = {};
  attendances.forEach((a) => {
    const key = new Date(a.date).toDateString();
    attMap[key] = a.status;
  });

  const today      = new Date();
  const todayKey   = today.toDateString();
  const markedToday = !!attMap[todayKey];

  // Calendar helpers
  const firstOfMonth = new Date(calMonth.year, calMonth.month, 1);
  const lastOfMonth  = new Date(calMonth.year, calMonth.month + 1, 0);
  const startPad     = firstOfMonth.getDay(); // 0 = Sun
  const totalDays    = lastOfMonth.getDate();

  const prevMonth = () => setCalMonth(({ year, month }) =>
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
  );
  const nextMonth = () => setCalMonth(({ year, month }) =>
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
  );

  const markAttendance = async () => {
    if (!canMark || markedToday || marking) return;
    setMarking(true);
    try {
      const res  = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PRESENT" }),
      });
      const json = await res.json();
      if (res.ok) {
        setToast({ msg: "✅ Attendance marked as Present for today!", ok: true });
        await fetchAttendance();
      } else {
        setToast({ msg: json.error || "Failed to mark attendance.", ok: false });
      }
    } catch {
      setToast({ msg: "Network error. Please try again.", ok: false });
    } finally {
      setMarking(false);
      setTimeout(() => setToast(null), 4000);
    }
  };

  // Summary stats (current month)
  const monthAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month;
  });
  const presentCount = monthAttendances.filter((a) => a.status === "PRESENT").length;
  const lateCount    = monthAttendances.filter((a) => a.status === "LATE").length;
  const leaveCount   = monthAttendances.filter((a) => a.status === "LEAVE").length;

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="glass-panel p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-sky-100 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-sky-600" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">My Attendance Calendar</h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {canMark
              ? "Mark your attendance for today only. Past and future dates are locked."
              : "Attendance overview — Admin & CEO do not mark daily attendance."}
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${
          toast.ok
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Mark Today button */}
      {canMark && (
        <button
          onClick={markAttendance}
          disabled={markedToday || marking || loading}
          id="mark-attendance-btn"
          className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer
            ${markedToday
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-not-allowed"
              : "bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 hover:-translate-y-0.5 active:translate-y-0"
            }`}
        >
          {marking ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Marking…</>
          ) : markedToday ? (
            <><CheckCircle2 className="h-4 w-4" /> Attendance Marked for Today</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Mark Present — {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</>
          )}
        </button>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 text-slate-500" />
        </button>
        <span className="font-extrabold text-slate-800 text-sm">
          {MONTH_NAMES[calMonth.month]} {calMonth.year}
        </span>
        <button
          onClick={nextMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 text-sky-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {/* Padding cells */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: totalDays }, (_, i) => {
            const dayNum  = i + 1;
            const cellDate = new Date(calMonth.year, calMonth.month, dayNum);
            const cellKey  = cellDate.toDateString();
            const status   = attMap[cellKey];
            const isToday  = cellKey === todayKey;
            const isFuture = cellDate > today;
            const isPast   = cellDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

            // Only today is clickable for marking
            const isClickable = canMark && isToday && !markedToday && !marking;

            const cfg = status ? ATTEND_STATUS_CONFIG[status] : null;

            return (
              <button
                key={dayNum}
                disabled={!isClickable}
                onClick={isClickable ? markAttendance : undefined}
                title={
                  isToday && !markedToday && canMark
                    ? "Click to mark attendance"
                    : status
                    ? `${cellDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${cfg?.label}`
                    : cellDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                }
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all duration-150
                  ${isToday && !markedToday && canMark
                    ? "bg-sky-600 text-white shadow-lg shadow-sky-600/30 hover:scale-105 cursor-pointer ring-2 ring-sky-300 ring-offset-1 animate-pulse"
                    : isToday && markedToday
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-300 ring-offset-1"
                    : status
                    ? `${cfg?.bg} text-white`
                    : isFuture
                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                    : isWeekend
                    ? "bg-slate-50/60 text-slate-400"
                    : "bg-slate-50 text-slate-500 cursor-not-allowed"
                  }`}
              >
                {dayNum}
                {isToday && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-white/80" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend + Stats */}
      <div className="border-t border-slate-100 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Present", count: presentCount, dot: "bg-emerald-500", text: "text-emerald-600" },
            { label: "Late",    count: lateCount,    dot: "bg-amber-400",   text: "text-amber-600"  },
            { label: "Leave",   count: leaveCount,   dot: "bg-violet-400",  text: "text-violet-600" },
            { label: "Working Days", count: presentCount + lateCount, dot: "bg-sky-500", text: "text-sky-600" },
          ].map(({ label, count, dot, text }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              </div>
              <span className={`text-base font-extrabold ${text}`}>{count}</span>
            </div>
          ))}
        </div>

        {/* Color legend */}
        <div className="flex flex-wrap gap-3">
          {[
            { color: "bg-sky-600",     label: "Today (Mark Now)" },
            { color: "bg-emerald-500", label: "Present"          },
            { color: "bg-amber-400",   label: "Late"             },
            { color: "bg-red-400",     label: "Absent"           },
            { color: "bg-violet-400",  label: "On Leave"         },
            { color: "bg-slate-100",   label: "No Record"        },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <span className={`h-3 w-3 rounded-sm ${color}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Employee To-Do List Component ─────────────────────────── */
interface TodoListProps {
  employeeId: string;
}

function EmployeeTodoList({ employeeId }: TodoListProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newTitle, setNewTitle] = useState("");
  const [newProjId, setNewProjId] = useState("");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchTasksAndProjects = useCallback(async () => {
    try {
      const [tasksRes, projRes] = await Promise.all([
        fetch("/api/projects/tasks").then((r) => r.json()),
        fetch("/api/projects").then((r) => r.json()),
      ]);
      // Filter tasks assigned to this employee
      const myTasks = (tasksRes || []).filter((t: any) => t.assigneeId === employeeId);
      setTasks(myTasks);
      setProjects(projRes || []);
      if (projRes && projRes.length > 0) {
        setNewProjId(projRes[0].id);
      }
    } catch (err) {
      console.error("Error loading tasks/projects:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchTasksAndProjects();
  }, [fetchTasksAndProjects]);

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "DONE" ? "IN_PROGRESS" : "DONE";
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: nextStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newProjId) {
      setError("Please fill all required fields.");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: "Created from daily workspace checklist",
          status: "TODO",
          priority: newPriority,
          projectId: newProjId,
          assigneeId: employeeId,
          dueDate: newDueDate || null,
        }),
      });
      if (res.ok) {
        setNewTitle("");
        setNewDueDate("");
        await fetchTasksAndProjects();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create task");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setAdding(false);
    }
  };

  const pending = tasks.filter((t) => t.status !== "DONE");
  const completed = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left panel: Lists */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Pending checklist */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ClipboardList className="h-4.5 w-4.5 text-sky-600" />
            Active Tasks Checklist ({pending.length})
          </h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 text-sky-600 animate-spin" />
            </div>
          ) : pending.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No active tasks assigned to you. All clear!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map((t) => (
                <div key={t.id} className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-sm transition-all group">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggleStatus(t.id, t.status)}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">{t.title}</span>
                    <span className="block text-[10px] text-slate-450 truncate mt-0.5">{t.project?.name || "No Project"}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      t.priority === "CRITICAL" ? "bg-red-105 text-red-700" :
                      t.priority === "HIGH" ? "bg-amber-100 text-amber-700" :
                      t.priority === "MEDIUM" ? "bg-sky-100 text-sky-700" :
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {t.priority}
                    </span>
                    {t.dueDate && (
                      <span className="text-[9px] text-slate-450 font-semibold">
                        Due: {new Date(t.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed checklist */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
            Completed Tasks ({completed.length})
          </h3>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 text-sky-655 animate-spin" />
            </div>
          ) : completed.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No completed tasks yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {completed.map((t) => (
                <div key={t.id} className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 border border-slate-100/50 rounded-xl opacity-75 group">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => handleToggleStatus(t.id, t.status)}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-500 line-through truncate">{t.title}</span>
                    <span className="block text-[10px] text-slate-400 line-through truncate mt-0.5">{t.project?.name || "No Project"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>

      {/* Right panel: Add Custom Todo */}
      <div className="glass-panel p-6 flex flex-col gap-4 h-fit">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Add Personal Todo</h3>
          <p className="text-slate-500 text-xs mt-0.5">Quickly track tasks on projects assigned to you.</p>
        </div>
        
        {error && <p className="text-xs text-red-650 font-semibold bg-red-50 p-2 rounded-lg border border-red-150">{error}</p>}

        <form onSubmit={handleCreateTodo} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Todo Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Refactor API endpoints..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Project Context</label>
            <select
              value={newProjId}
              onChange={(e) => setNewProjId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Due Date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={adding || !newProjId}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Todo"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─── Main HRMS Dashboard ────────────────────────────────────── */
export default function HRMSDashboard() {
  const { user: sessionUser, can, hasRole, loading: permLoading } = usePermission();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [role, setRole]           = useState("DEVELOPER");
  const [salary, setSalary]       = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchHRData = async () => {
    try {
      const res  = await fetch("/api/hrms");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/hrms").then((r) => r.json()),
    ]).then(([sess, hrms]) => {
      if (sess.authenticated) {
        setUserRole(sess.user.role);
      }
      setData(hrms);
      setLoading(false);
    });
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/hrms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, role, salary: Number(salary) }),
      });
      if (res.ok) {
        setFirstName(""); setLastName(""); setEmail(""); setSalary("");
        await fetchHRData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading || permLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const { employees, leaves } = data;
  const payrollTotal = employees.reduce((sum: number, e: any) => sum + (e.salary || 0), 0);

  const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR"].includes(userRole) || can("employee:create") || can("employee:salary:view");
  const showCalendar = !["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"].includes(userRole) && userRole !== "";

  const currentEmployee = employees.find((emp: any) => emp.userId === sessionUser?.userId);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isPrivileged ? "HRMS Operations" : "My Personal Workspace"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isPrivileged 
            ? "Staff directory, leave tracker, payroll & attendance management."
            : "Keep track of your daily attendance and manage your task checklist."}
        </p>
      </div>

      {/* Stats row — only for privileged roles */}
      {isPrivileged && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Total Employees</span>
            <div className="text-2xl font-extrabold text-slate-900 mb-1">{employees.length}</div>
            <span className="text-slate-500 text-xs font-medium">Active directory personnel</span>
          </div>
          <div className="glass-panel p-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Annual Payroll Commits</span>
            <div className="text-2xl font-extrabold text-slate-900 mb-1">${payrollTotal.toLocaleString()}</div>
            <span className="text-slate-500 text-xs font-medium">Base package expenditure</span>
          </div>
          <div className="glass-panel p-6">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Pending Leaves</span>
            <div className="text-2xl font-extrabold text-amber-600 mb-1">{leaves.filter((l: any) => l.status === "PENDING").length}</div>
            <span className="text-slate-500 text-xs font-medium">Awaiting administrator action</span>
          </div>
        </div>
      )}

      {/* Attendance Calendar — only for non-admin/non-CEO roles */}
      {showCalendar && <AttendanceCalendar userRole={userRole} />}

      {/* Roster views for HR/Admin/CEO, TodoList for regular employees */}
      {isPrivileged ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left lists */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Employee roster */}
            <div className="glass-panel p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Organizational Roster</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3 text-right">Base Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-slate-900">{emp.firstName} {emp.lastName}</td>
                        <td className="py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {emp.user?.role || emp.role}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500">{emp.user?.email || emp.email}</td>
                        <td className="py-3.5 text-right font-semibold text-slate-900">${emp.salary.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave list */}
            <div className="glass-panel p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Leave Administration</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                      <th className="pb-3">Team Member</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Period</th>
                      <th className="pb-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((leave: any) => (
                      <tr key={leave.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-slate-900">{leave.employee.firstName} {leave.employee.lastName}</td>
                        <td className="py-3.5 text-slate-500">{leave.type}</td>
                        <td className="py-3.5 text-slate-500">
                          {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            leave.status === "APPROVED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : leave.status === "REJECTED"
                              ? "bg-red-500/10 text-red-650 border-red-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right side form */}
          <div>
            <div className="glass-panel p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Add Roster Member</h3>
              <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">First Name</label>
                  <input
                    type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Sujal"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Last Name</label>
                  <input
                    type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                  <input
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. dev@kenzo.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role Group</label>
                  <select
                    value={role} onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-sm transition-all"
                  >
                    <option value="DEVELOPER">Developer</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                    <option value="CEO">Chief Executive Officer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Annual Salary ($)</label>
                  <input
                    type="number" required value={salary} onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 120000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                  />
                </div>
                <button
                  type="submit" disabled={formLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
                >
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Save Roster Record</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        currentEmployee && <EmployeeTodoList employeeId={currentEmployee.id} />
      )}
    </div>
  );
}
