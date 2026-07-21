"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PlusCircle, Loader2, CalendarDays, CheckCircle2, Clock, X,
  ChevronLeft, ChevronRight, UserCheck, AlertCircle, Sparkles, ClipboardList,
  Briefcase, FileText, UserPlus, Eye, Filter, Check, ShieldAlert, Award,
  Pencil, Trash2, ArrowUpRight, Zap
} from "lucide-react";

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

  const attMap: Record<string, string> = {};
  attendances.forEach((a) => {
    const key = new Date(a.date).toDateString();
    attMap[key] = a.status;
  });

  const today      = new Date();
  const todayKey   = today.toDateString();
  const markedToday = !!attMap[todayKey];

  const firstOfMonth = new Date(calMonth.year, calMonth.month, 1);
  const lastOfMonth  = new Date(calMonth.year, calMonth.month + 1, 0);
  const startPad     = firstOfMonth.getDay();
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

  const monthAttendances = attendances.filter((a) => {
    const d = new Date(a.date);
    return d.getFullYear() === calMonth.year && d.getMonth() === calMonth.month;
  });
  const presentCount = monthAttendances.filter((a) => a.status === "PRESENT").length;
  const lateCount    = monthAttendances.filter((a) => a.status === "LATE").length;
  const leaveCount   = monthAttendances.filter((a) => a.status === "LEAVE").length;

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="glass-panel p-6 flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
          <div>
            <h3 className="font-extrabold text-base" style={{ color: "var(--text-primary)" }}>My Attendance Log</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Monthly attendance tracker and daily check-in status.</p>
          </div>
        </div>
        {toast && (
          <div className={`text-xs font-bold px-3 py-1.5 rounded-full ${toast.ok ? "status-active" : "status-danger"}`}>
            {toast.msg}
          </div>
        )}
      </div>

      {canMark && (
        <button
          disabled={markedToday || marking}
          onClick={markAttendance}
          className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
            markedToday ? "status-active cursor-not-allowed" : "btn-primary"
          }`}
        >
          {marking ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Marking…</>
          ) : markedToday ? (
            <><CheckCircle2 className="h-4 w-4" /> Attendance Marked for Today</>
          ) : (
            <><Sparkles className="h-4 w-4 text-white" /> Mark Present — {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</>
          )}
        </button>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-extrabold text-sm" style={{ color: "var(--text-primary)" }}>
          {MONTH_NAMES[calMonth.month]} {calMonth.year}
        </span>
        <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-xs font-extrabold uppercase py-1" style={{ color: "var(--text-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum  = i + 1;
            const cellDate = new Date(calMonth.year, calMonth.month, dayNum);
            const cellKey  = cellDate.toDateString();
            const status   = attMap[cellKey];
            const isToday  = cellKey === todayKey;
            const isFuture = cellDate > today;
            const isClickable = canMark && isToday && !markedToday && !marking;
            const cfg = status ? ATTEND_STATUS_CONFIG[status] : null;

            return (
              <button
                key={dayNum}
                disabled={!isClickable}
                onClick={isClickable ? markAttendance : undefined}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all ${
                  isToday && !markedToday && canMark
                    ? "btn-primary animate-pulse"
                    : isToday && markedToday
                    ? "status-active"
                    : status
                    ? `${cfg?.bg} text-white`
                    : isFuture
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-default"
                }`}
                style={!status && !isToday ? { background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-card)" } : undefined}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend + Stats */}
      <div className="pt-3" style={{ borderTop: "1px solid var(--border-card)" }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Present", count: presentCount, color: "var(--accent-success)" },
            { label: "Late",    count: lateCount,    color: "var(--accent-warning)" },
            { label: "Leave",   count: leaveCount,   color: "var(--accent-violet)"  },
            { label: "Working Days", count: presentCount + lateCount, color: "var(--accent-primary)" },
          ].map(({ label, count, color }) => (
            <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: "var(--bg-input)", border: "1px solid var(--border-card)" }}>
              <span className="text-[10px] font-extrabold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>{label}</span>
              <span className="text-base font-black" style={{ color }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main HRMS & Recruitment Dashboard ───────────────────────── */
export default function HRMSDashboard() {
  const router = useRouter();
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [userRole, setUserRole]       = useState("");
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Task Popup state
  const [latestTask, setLatestTask]     = useState<any>(null);
  const [showTaskPopup, setShowTaskPopup] = useState(false);

  // Tab State
  const [activeTab, setActiveTab]     = useState<"roster" | "projects" | "applications">("roster");

  // Roster Employee Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [role, setRole]           = useState("DEVELOPER");
  const [salary, setSalary]       = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Projects & Task Assignment Form State
  const [hrProjects, setHrProjects]   = useState<any[]>([]);
  const [hrTasks, setHrTasks]         = useState<any[]>([]);
  const [taskTitle, setTaskTitle]     = useState("");
  const [taskDesc, setTaskDesc]       = useState("");
  const [taskProjId, setTaskProjId]   = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskMsg, setTaskMsg]         = useState("");

  // Task Edit Modal
  const [editingTask, setEditingTask]       = useState<any>(null);
  const [editTitle, setEditTitle]           = useState("");
  const [editDesc, setEditDesc]             = useState("");
  const [editPriority, setEditPriority]     = useState("MEDIUM");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editProjId, setEditProjId]         = useState("");
  const [editDueDate, setEditDueDate]       = useState("");
  const [editLoading, setEditLoading]       = useState(false);

  // Job Applications State
  const [applications, setApplications] = useState<any[]>([]);
  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [selectedApp, setSelectedApp]   = useState<any>(null);

  // Add App Form State
  const [candName, setCandName]   = useState("");
  const [candEmail, setCandEmail] = useState("");
  const [candPos, setCandPos]     = useState("Senior Full-Stack Engineer");
  const [candExp, setCandExp]     = useState("4+ Years");
  const [candSummary, setCandSummary] = useState("");
  const [candCover, setCandCover] = useState("");
  const [appSubmitting, setAppSubmitting] = useState(false);

  const fetchHRData = async () => {
    try {
      const [resSess, resHrms, resProj, resTasks, resApps] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/hrms"),
        fetch("/api/projects"),
        fetch("/api/projects/tasks"),
        fetch("/api/hrms/applications"),
      ]);
      const jsonSess  = await resSess.json();
      const jsonHrms  = await resHrms.json();
      const jsonProj  = await resProj.json();
      const jsonTasks = await resTasks.json();
      const jsonApps  = await resApps.json();

      if (jsonSess.authenticated) {
        setUserRole(jsonSess.user.role);
        setSessionUser(jsonSess.user);
      }

      setData(jsonHrms);
      const projList = Array.isArray(jsonProj) ? jsonProj : (jsonProj.projects || []);
      setHrProjects(projList);
      const allTasks = Array.isArray(jsonTasks) ? jsonTasks : [];
      setHrTasks(allTasks);
      setApplications(jsonApps.applications || []);

      if (projList.length > 0) setTaskProjId(projList[0].id);
      if (jsonHrms.employees?.length > 0) setTaskAssigneeId(jsonHrms.employees[0].id);

      // Check Task Notification Popup strictly for logged in user
      if (jsonSess.authenticated && allTasks.length > 0) {
        const curUser = jsonSess.user;
        const myTask = allTasks.find((t: any) => {
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

    } catch (err) {
      console.error("Fetch HR Data error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
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

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true); setTaskMsg("");
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          description: taskDesc,
          status: "TODO",
          priority: taskPriority,
          projectId: taskProjId,
          assigneeId: taskAssigneeId || null,
          dueDate: taskDueDate || null,
        }),
      });
      if (res.ok) {
        setTaskTitle(""); setTaskDesc(""); setTaskDueDate("");
        setTaskMsg("Task successfully assigned & published!");
        await fetchHRData();
        setTimeout(() => setTaskMsg(""), 3000);
      }
    } catch (err) {
      console.error("Assign task error:", err);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) {
        await fetchHRData();
      }
    } catch (err) {
      console.error("Update task status error:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/projects/tasks?id=${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchHRData();
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const openEditTaskModal = (task: any) => {
    setEditingTask(task);
    setEditTitle(task.title || "");
    setEditDesc(task.description || "");
    setEditPriority(task.priority || "MEDIUM");
    setEditAssigneeId(task.assigneeId || "");
    setEditProjId(task.projectId || "");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
  };

  const handleSaveTaskEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditLoading(true);
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTask.id,
          title: editTitle,
          description: editDesc,
          priority: editPriority,
          assigneeId: editAssigneeId || null,
          projectId: editProjId,
          dueDate: editDueDate || null,
        }),
      });
      if (res.ok) {
        setEditingTask(null);
        await fetchHRData();
      }
    } catch (err) {
      console.error("Save task edit error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setAppSubmitting(true);
    try {
      const res = await fetch("/api/hrms/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: candName,
          email: candEmail,
          position: candPos,
          experience: candExp,
          resumeSummary: candSummary,
          coverNote: candCover,
        }),
      });
      if (res.ok) {
        setCandName(""); setCandEmail(""); setCandSummary(""); setCandCover("");
        setShowAddAppModal(false);
        await fetchHRData();
      }
    } catch (err) {
      console.error("Add application error:", err);
    } finally {
      setAppSubmitting(false);
    }
  };

  const handleUpdateAppStatus = async (appId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/hrms/applications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appId, status: newStatus }),
      });
      if (res.ok) {
        await fetchHRData();
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp((prev: any) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-400">Loading HR &amp; Recruitment Operations...</span>
      </div>
    );
  }

  const employees = data?.employees || [];
  const leaves    = data?.leaves || [];
  const payrollTotal = employees.reduce((sum: number, e: any) => sum + e.salary, 0);

  const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(userRole);
  const canAssignTask = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(userRole);
  const showCalendar = !["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"].includes(userRole) && userRole !== "";

  // Recruitment Stats
  const totalApps    = applications.length;
  const shortlisted  = applications.filter((a) => a.status === "SHORTLISTED").length;
  const interviews   = applications.filter((a) => a.status === "INTERVIEW_SCHEDULED").length;
  const hired        = applications.filter((a) => a.status === "HIRED").length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div>
          <div className="section-eyebrow"><UserCheck className="h-4 w-4" /> Human Resource Capital</div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            {isPrivileged ? "HR & Talent Operations" : "My Personal Workspace"}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {isPrivileged
              ? "Staff directory, payroll, project assignments, and recruitment applicant portal."
              : "Keep track of your daily attendance and manage your task checklist."}
          </p>
        </div>

        {isPrivileged && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("roster")}
              className={`chart-pill ${activeTab === "roster" ? "chart-pill-active" : ""}`}
            >
              Overview &amp; Roster
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`chart-pill ${activeTab === "projects" ? "chart-pill-active" : ""}`}
            >
              HR Projects &amp; Tasks
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`chart-pill ${activeTab === "applications" ? "chart-pill-active" : ""}`}
            >
              Job Applications ({applications.length})
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      {isPrivileged && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="stat-card">
            <span className="form-label mb-1">Total Employees</span>
            <div className="text-2xl font-black mb-1" style={{ color: "var(--text-primary)" }}>{employees.length}</div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Active directory staff</span>
          </div>
          <div className="stat-card">
            <span className="form-label mb-1">Annual Payroll</span>
            <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-success)" }}>Rs. {payrollTotal.toLocaleString()}</div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Base package commitment</span>
          </div>
          <div className="stat-card">
            <span className="form-label mb-1">Pending Leaves</span>
            <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-warning)" }}>
              {leaves.filter((l: any) => l.status === "PENDING").length}
            </div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Awaiting action</span>
          </div>
          <div className="stat-card">
            <span className="form-label mb-1">Job Applications</span>
            <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-secondary)" }}>{totalApps}</div>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Active candidate pool</span>
          </div>
        </div>
      )}

      {showCalendar && <AttendanceCalendar userRole={userRole} />}

      {/* TAB 1: OVERVIEW & ROSTER */}
      {activeTab === "roster" && isPrivileged && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Employee roster */}
            <div className="glass-panel p-6">
              <h3 className="text-base font-black mb-4" style={{ color: "var(--text-primary)" }}>Organizational Roster</h3>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Name &amp; Position</th>
                      <th>Role</th>
                      <th>Email Address</th>
                      <th className="text-right">Base Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp: any) => (
                      <tr key={emp.id}>
                        <td>
                          <span className="font-bold block">{emp.firstName} {emp.lastName}</span>
                          <span className="text-xs font-semibold" style={{ color: "var(--accent-primary)" }}>{emp.position}</span>
                        </td>
                        <td>
                          <span className="badge status-info">
                            {emp.position || emp.user?.role || emp.role}
                          </span>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{emp.user?.email || emp.email}</td>
                        <td className="text-right font-black" style={{ color: "var(--accent-success)" }}>Rs. {emp.salary.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leave list */}
            <div className="glass-panel p-6">
              <h3 className="text-base font-black mb-4" style={{ color: "var(--text-primary)" }}>Leave Administration</h3>
              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Type</th>
                      <th>Period</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-6" style={{ color: "var(--text-muted)" }}>No leave requests pending.</td>
                      </tr>
                    ) : (
                      leaves.map((leave: any) => (
                        <tr key={leave.id}>
                          <td className="font-bold">{leave.employee?.firstName} {leave.employee?.lastName}</td>
                          <td><span className="badge status-info">{leave.type}</span></td>
                          <td style={{ color: "var(--text-muted)" }}>
                            {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                          </td>
                          <td className="text-center">
                            <span className={`badge ${
                              leave.status === "APPROVED" ? "status-active" : leave.status === "REJECTED" ? "status-danger" : "status-pending"
                            }`}>
                              {leave.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add Roster Member */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 sticky top-6">
              <h3 className="text-base font-black mb-4" style={{ color: "var(--text-primary)" }}>Add Roster Member</h3>
              <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Sujal" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Kumar" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Email Address</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. dev@kenzo.com" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Role Group</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select font-semibold">
                    <option value="DEVELOPER">Developer</option>
                    <option value="PROJECT_MANAGER">Project Manager</option>
                    <option value="HR_MANAGER">HR Manager</option>
                    <option value="COMPANY_ADMIN">Company Admin</option>
                    <option value="CEO">Chief Executive Officer</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Annual Salary (Rs.)</label>
                  <input type="number" required value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 120000" className="form-input" />
                </div>
                <button type="submit" disabled={formLoading} className="btn-primary w-full mt-2" style={{ padding: "0.85rem" }}>
                  {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Save Roster Record</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HR PROJECTS & TASK ASSIGNMENTS */}
      {activeTab === "projects" && isPrivileged && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          
          {/* Active Tasks Board */}
          <div className={canAssignTask ? "lg:col-span-2 flex flex-col gap-6" : "lg:col-span-3 flex flex-col gap-6"}>
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
                <div>
                  <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>HR &amp; Corporate Task Directory</h3>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Assigned work lanes across all operational projects</p>
                </div>
                <span className="badge status-info">{hrTasks.length} Total Tasks</span>
              </div>

              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Task Title &amp; Description</th>
                      <th>Project Context</th>
                      <th>Assigned To</th>
                      <th>Priority</th>
                      <th>Status &amp; Move</th>
                      {isPrivileged && <th className="text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {hrTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No tasks published yet.</td>
                      </tr>
                    ) : (
                      hrTasks.map((t: any) => (
                        <tr key={t.id}>
                          <td>
                            <span className="font-extrabold block text-sm">{t.title}</span>
                            {t.description && (
                              <span className="text-xs block mt-0.5 max-w-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>
                                {t.description}
                              </span>
                            )}
                          </td>
                          <td className="font-semibold text-xs" style={{ color: "var(--accent-primary)" }}>{t.project?.name || "Corporate"}</td>
                          <td>
                            {t.assignee ? (
                              <span className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>
                                {t.assignee.firstName} {t.assignee.lastName}
                              </span>
                            ) : (
                              <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Unassigned</span>
                            )}
                          </td>
                          <td><span className="badge status-warning">{t.priority}</span></td>
                          <td>
                            {/* Interactive Status Selector Dropdown */}
                            <select
                              value={t.status}
                              onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                              style={{
                                background: "var(--bg-input)",
                                color: t.status === "DONE" ? "var(--accent-success)" : t.status === "IN_PROGRESS" ? "var(--accent-warning)" : "var(--text-primary)",
                                border: "1px solid var(--border-card)",
                                outline: "none",
                              }}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">In Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          </td>
                          {isPrivileged && (
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => openEditTaskModal(t)}
                                  title="Edit Task"
                                  className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-400 hover:text-sky-400 cursor-pointer transition-all"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(t.id)}
                                  title="Delete Task"
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer transition-all"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Assign Task Sidebar — ONLY FOR ADMIN, CEO, HR */}
          {canAssignTask && (
            <div className="lg:col-span-1">
              <div className="glass-panel p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                  <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Assign Task to Staff</h3>
                </div>

                {taskMsg && <div className="alert-success mb-4">{taskMsg}</div>}

                <form onSubmit={handleAssignTask} className="flex flex-col gap-4">
                  <div>
                    <label className="form-label">Task Title</label>
                    <input type="text" required value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Conduct Q3 Staff Performance Review" className="form-input" />
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Task instructions & scope..." rows={2} className="form-input" style={{ resize: "none" }} />
                  </div>

                  <div>
                    <label className="form-label">Select Project</label>
                    <select value={taskProjId} onChange={(e) => setTaskProjId(e.target.value)} className="form-select font-semibold">
                      {hrProjects.length === 0 ? (
                        <option value="">General Corporate Operations</option>
                      ) : (
                        hrProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Assignee</label>
                    <select value={taskAssigneeId} onChange={(e) => setTaskAssigneeId(e.target.value)} className="form-select font-semibold">
                      {employees.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.position})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Priority</label>
                    <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="form-select font-semibold">
                      <option value="NEW">NEW</option>
                      <option value="UPDATING">UPDATING</option>
                      <option value="URGENT">URGENT</option>
                      <option value="PENDING">PENDING</option>
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Due Date</label>
                    <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} className="form-input" />
                  </div>

                  <button type="submit" disabled={taskLoading} className="btn-primary w-full mt-2" style={{ padding: "0.85rem" }}>
                    {taskLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publish &amp; Confirm Assignment"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: JOB APPLICATIONS & RECRUITMENT PORTAL */}
      {activeTab === "applications" && isPrivileged && (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          
          {/* Recruitment Header & Add App Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>Recruitment &amp; Candidate Portal</h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Review resumes, schedule interviews, and manage candidate shortlist pipeline.</p>
            </div>
            <button onClick={() => setShowAddAppModal(true)} className="btn-primary">
              <UserPlus className="h-4 w-4" /> Add Candidate Application
            </button>
          </div>

          {/* Applications Table */}
          <div className="glass-panel p-6">
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Candidate Name</th>
                    <th>Position Applied</th>
                    <th>Experience</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th className="text-center">Actions &amp; Resume</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No candidate applications recorded.</td>
                    </tr>
                  ) : (
                    applications.map((app: any) => (
                      <tr key={app.id}>
                        <td>
                          <span className="font-bold block" style={{ color: "var(--text-primary)" }}>{app.candidateName}</span>
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{app.email}</span>
                        </td>
                        <td className="font-semibold" style={{ color: "var(--accent-primary)" }}>{app.position}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{app.experience}</td>
                        <td style={{ color: "var(--text-muted)" }}>{app.appliedDate}</td>
                        <td>
                          <span className={`badge ${
                            app.status === "HIRED" ? "status-active" : app.status === "INTERVIEW_SCHEDULED" ? "status-info" : app.status === "SHORTLISTED" ? "status-warning" : app.status === "REJECTED" ? "status-danger" : "status-muted"
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="btn-secondary py-1.5 px-3 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5" /> Review Resume
                            </button>
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateAppStatus(app.id, e.target.value)}
                              className="rounded-lg px-2 py-1 text-xs font-semibold"
                              style={{ background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-card)" }}
                            >
                              <option value="NEW">NEW</option>
                              <option value="SHORTLISTED">SHORTLISTED</option>
                              <option value="INTERVIEW_SCHEDULED">INTERVIEW</option>
                              <option value="HIRED">HIRED</option>
                              <option value="REJECTED">REJECTED</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="modal-overlay flex items-center justify-center p-4 z-50">
          <div className="modal-content p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Edit Task</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Update task instructions, priority, or assignee</p>
              </div>
              <button onClick={() => setEditingTask(null)} className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTaskEdit} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Task Title</label>
                <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="form-input" />
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} className="form-input" style={{ resize: "none" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Target Project</label>
                  <select value={editProjId} onChange={(e) => setEditProjId(e.target.value)} className="form-select font-semibold">
                    {hrProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Assignee</label>
                  <select value={editAssigneeId} onChange={(e) => setEditAssigneeId(e.target.value)} className="form-select font-semibold">
                    <option value="">Unassigned</option>
                    {employees.map((e: any) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.position})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Priority</label>
                  <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} className="form-select font-semibold">
                    <option value="NEW">NEW</option>
                    <option value="UPDATING">UPDATING</option>
                    <option value="URGENT">URGENT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Due Date</label>
                  <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="form-input" />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setEditingTask(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={editLoading} className="btn-primary flex-1">
                  {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Resume Review Modal */}
      {selectedApp && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content p-7 w-full max-w-xl">
            <div className="flex justify-between items-start mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <span className="section-eyebrow"><Award className="h-4 w-4" /> Candidate Resume Review</span>
                <h2 className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{selectedApp.candidateName}</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{selectedApp.position} • {selectedApp.email}</p>
              </div>
              <button onClick={() => setSelectedApp(null)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <div className="p-4 rounded-xl" style={{ background: "var(--bg-card-alt)", border: "1px solid var(--border-card)" }}>
                <span className="form-label mb-1">Executive Summary</span>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{selectedApp.resumeSummary}</p>
              </div>

              <div>
                <span className="form-label mb-1.5">Key Skills &amp; Qualifications</span>
                <div className="flex flex-wrap gap-2">
                  {(selectedApp.skills || ["React", "B2B Sales", "Management"]).map((s: string) => (
                    <span key={s} className="badge status-info">{s}</span>
                  ))}
                </div>
              </div>

              {selectedApp.coverNote && (
                <div className="p-4 rounded-xl" style={{ background: "var(--bg-input)", border: "1px solid var(--border-card)" }}>
                  <span className="form-label mb-1">Cover Note / Candidate Pitch</span>
                  <p className="text-xs italic leading-relaxed" style={{ color: "var(--text-muted)" }}>"{selectedApp.coverNote}"</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-3" style={{ borderTop: "1px solid var(--border-card)" }}>
              <span className="form-label mb-0">Update Candidate Decision Status</span>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleUpdateAppStatus(selectedApp.id, "SHORTLISTED")} className="btn-secondary text-xs py-2">
                  Shortlist
                </button>
                <button onClick={() => handleUpdateAppStatus(selectedApp.id, "INTERVIEW_SCHEDULED")} className="btn-secondary text-xs py-2">
                  Interview
                </button>
                <button onClick={() => handleUpdateAppStatus(selectedApp.id, "HIRED")} className="btn-primary text-xs py-2">
                  Hire Candidate
                </button>
                <button onClick={() => handleUpdateAppStatus(selectedApp.id, "REJECTED")} className="btn-secondary text-xs py-2" style={{ color: "var(--accent-danger)" }}>
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Application Modal */}
      {showAddAppModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content p-6 w-full max-w-md">
            <div className="flex justify-between items-start mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Add Job Application</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Submit new candidate resume into HR pipeline</p>
              </div>
              <button onClick={() => setShowAddAppModal(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Candidate Full Name</label>
                <input type="text" required value={candName} onChange={(e) => setCandName(e.target.value)} placeholder="e.g. Rohan Verma" className="form-input" />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input type="email" required value={candEmail} onChange={(e) => setCandEmail(e.target.value)} placeholder="e.g. rohan@example.com" className="form-input" />
              </div>
              <div>
                <label className="form-label">Position Applied</label>
                <input type="text" required value={candPos} onChange={(e) => setCandPos(e.target.value)} placeholder="e.g. Senior Software Engineer" className="form-input" />
              </div>
              <div>
                <label className="form-label">Total Experience</label>
                <input type="text" required value={candExp} onChange={(e) => setCandExp(e.target.value)} placeholder="e.g. 5+ Years" className="form-input" />
              </div>
              <div>
                <label className="form-label">Resume Executive Summary</label>
                <textarea required rows={3} value={candSummary} onChange={(e) => setCandSummary(e.target.value)} placeholder="Brief summary of candidate's technical skills & background..." className="form-input" style={{ resize: "none" }} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddAppModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={appSubmitting} className="btn-primary flex-1">
                  {appSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
