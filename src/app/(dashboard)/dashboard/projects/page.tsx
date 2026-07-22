"use client";

import React, { useEffect, useState } from "react";
import {
  PlusCircle, Loader2, FolderPlus, CheckCircle2, AlertCircle,
  Calendar, X, Zap, Target, Clock, User, ChevronRight, Pencil, Trash2
} from "lucide-react";

const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NEW:      { bg: "rgba(14,165,233,0.12)",  text: "#38bdf8",  label: "New" },
  UPDATING: { bg: "rgba(139,92,246,0.12)",  text: "#a78bfa",  label: "Updating" },
  URGENT:   { bg: "rgba(239,68,68,0.12)",   text: "#f87171",  label: "Urgent" },
  PENDING:  { bg: "rgba(245,158,11,0.12)",  text: "#fbbf24",  label: "Pending" },
  CRITICAL: { bg: "rgba(239,68,68,0.18)",   text: "#ef4444",  label: "Critical" },
  HIGH:     { bg: "rgba(245,158,11,0.12)",  text: "#f59e0b",  label: "High" },
  MEDIUM:   { bg: "rgba(99,102,241,0.12)",  text: "#818cf8",  label: "Medium" },
  LOW:      { bg: "rgba(100,116,139,0.12)", text: "#94a3b8",  label: "Low" },
};

const STATUS_COLORS: Record<string, string> = {
  PLANNING:  "rgba(245,158,11,0.12)",
  ACTIVE:    "rgba(16,185,129,0.12)",
  COMPLETED: "rgba(14,165,233,0.12)",
  ON_HOLD:   "rgba(100,116,139,0.12)",
};
const STATUS_TEXT: Record<string, string> = {
  PLANNING:  "#f59e0b",
  ACTIVE:    "#34d399",
  COMPLETED: "#38bdf8",
  ON_HOLD:   "#94a3b8",
};

export default function ProjectsDashboard() {
  const [projects, setProjects]   = useState<any[]>([]);
  const [tasks, setTasks]         = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [userRole, setUserRole]       = useState("");
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading]         = useState(true);

  // Task creation form
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId]     = useState("");
  const [taskType, setTaskType]       = useState("CURRENT");
  const [priority, setPriority]       = useState("MEDIUM");
  const [assigneeId, setAssigneeId]   = useState("");
  const [dueDate, setDueDate]         = useState("");
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState("");
  const [taskError, setTaskError]     = useState("");
  const [topNotify, setTopNotify]     = useState("");

  // Edit Task Modal State
  const [editingTask, setEditingTask]       = useState<any>(null);
  const [editTitle, setEditTitle]           = useState("");
  const [editDesc, setEditDesc]             = useState("");
  const [editPriority, setEditPriority]     = useState("MEDIUM");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editProjId, setEditProjId]         = useState("");
  const [editDueDate, setEditDueDate]       = useState("");
  const [editLoading, setEditLoading]       = useState(false);

  // Delete Task Modal State
  const [deleteConfirmTaskId, setDeleteConfirmTaskId] = useState<string | null>(null);

  // Project creation modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName]                 = useState("");
  const [projDesc, setProjDesc]                 = useState("");
  const [projBudget, setProjBudget]             = useState("");
  const [projStartDate, setProjStartDate]       = useState("");
  const [projLoading, setProjLoading]             = useState(false);
  const [projSuccess, setProjSuccess]             = useState("");
  const [projError, setProjError]                 = useState("");

  const loadData = async () => {
    try {
      const [resSess, resProjects, resTasks, resHrms] = await Promise.all([
        fetch("/api/auth/session"),
        fetch("/api/projects"),
        fetch("/api/projects/tasks"),
        fetch("/api/hrms"),
      ]);
      const sessData     = await resSess.json();
      const projectsData = await resProjects.json();
      const tasksData    = await resTasks.json();
      const hrmsData     = await resHrms.json();

      if (sessData.authenticated) {
        setUserRole(sessData.user.role);
        setSessionUser(sessData.user);
      }

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      const empList = hrmsData.employees || [];
      setEmployees(empList);

      if (Array.isArray(projectsData) && projectsData.length > 0)
        setProjectId((prev) => (prev && projectsData.some((p) => p.id === prev) ? prev : projectsData[0].id));
      if (empList.length > 0)
        setAssigneeId((prev) => (prev && empList.some((e: any) => e.id === prev) ? prev : empList[0].id));

      setLoading(false);
    } catch (err) {
      console.error("Error loading project data:", err);
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const canAssignTask = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(userRole);
  const canManageTasks = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "PROJECT_MANAGER"].includes(userRole);

  const canChangeTaskState = (task: any) => {
    if (["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"].includes(userRole)) return true;
    if (!sessionUser || !task.assignee) return false;
    return (
      task.assignee.userId === sessionUser.id ||
      task.assignee.email === sessionUser.email ||
      task.assignee.user?.email === sessionUser.email
    );
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskSuccess(""); setTaskError("");
    if (!projectId) { setTaskError("Please select a project first."); return; }
    setTaskFormLoading(true);
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${taskType}] ${title}`,
          description,
          projectId,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
          status: "TODO",
        }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to create task");
      setTitle(""); setDescription(""); setDueDate("");
      setTaskSuccess("task assigned successfully");
      setTopNotify("task assigned successfully");
      await loadData();
      setTimeout(() => {
        setTaskSuccess("");
        setTopNotify("");
      }, 4500);
    } catch (err: any) {
      setTaskError(err.message || "An error occurred");
    } finally {
      setTaskFormLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjSuccess(""); setProjError(""); setProjLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projName, description: projDesc, budget: Number(projBudget), startDate: projStartDate || null }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create project");
      setProjName(""); setProjDesc(""); setProjBudget(""); setProjStartDate("");
      setProjSuccess("Project created successfully!");
      await loadData();
      if (resData.id) setProjectId(resData.id);
      setTimeout(() => { setProjSuccess(""); setShowProjectModal(false); }, 1500);
    } catch (err: any) {
      setProjError(err.message || "An error occurred");
    } finally {
      setProjLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setTaskActionLoading(taskId);
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) await loadData();
    } catch (err) {
      console.error("Update task status error:", err);
    } finally {
      setTaskActionLoading(null);
    }
  };

  const openEditModal = (task: any) => {
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
        await loadData();
      }
    } catch (err) {
      console.error("Save task edit error:", err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTaskActionLoading(taskId);
    try {
      const res = await fetch(`/api/projects/tasks?id=${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirmTaskId(null);
        await loadData();
      }
    } catch (err) {
      console.error("Delete task error:", err);
    } finally {
      setTaskActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]" style={{ color: "var(--text-primary)" }}>
        <div className="relative mb-5">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
            <FolderPlus className="h-6 w-6 text-white" />
          </div>
          <div className="absolute rounded-2xl border-2 animate-spin" style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent", inset: "-4px", animationDuration: "1s" }} />
        </div>
        <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Loading Projects...</span>
      </div>
    );
  }

  const columns = [
    { label: "To Do",       value: "TODO",        color: "var(--accent-primary)" },
    { label: "In Progress", value: "IN_PROGRESS",  color: "var(--accent-warning)" },
    { label: "In Review",   value: "REVIEW",       color: "var(--accent-violet)" },
    { label: "Done",        value: "DONE",         color: "var(--accent-success)" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12 animate-fade-in-up relative" style={{ color: "var(--text-primary)" }}>
      {/* Top Banner Notification */}
      {topNotify && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl animate-bounce-short border border-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          <span className="font-bold text-sm tracking-wide">{topNotify}</span>
          <button onClick={() => setTopNotify("")} className="ml-2 opacity-80 hover:opacity-100 cursor-pointer">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div>
          <div className="section-eyebrow">
            <Zap className="h-4 w-4" /> Enterprise Project Hub
          </div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Projects &amp; Delivery Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Manage schedules, track task lanes, and monitor resource assignments.
          </p>
        </div>
        {["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(userRole) && (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowProjectModal(true)} className="btn-primary py-2.5 px-4 text-xs">
              <FolderPlus className="h-4 w-4" /> + New Project Scope
            </button>
          </div>
        )}
      </div>

      {/* Projects Overview Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Active Projects Roster</h2>
          <span className="badge status-info">{projects.length} Active Scope</span>
        </div>

        {projects.length === 0 ? (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No projects defined yet. Create your first project scope to begin assigning tasks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => {
              const statusBg   = STATUS_COLORS[proj.status] || STATUS_COLORS.ACTIVE;
              const statusText = STATUS_TEXT[proj.status] || STATUS_TEXT.ACTIVE;
              const totalProjTasks = tasks.filter((t) => t.projectId === proj.id).length;
              const completedProjTasks = tasks.filter((t) => t.projectId === proj.id && t.status === "DONE").length;
              const progressPct = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

              return (
                <div key={proj.id} className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.01] transition-all">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-extrabold text-base leading-snug" style={{ color: "var(--text-primary)" }}>{proj.name}</h3>
                      <span className="badge shrink-0" style={{ background: statusBg, color: statusText }}>
                        {proj.status}
                      </span>
                    </div>
                    <p className="text-xs mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>{proj.description || "No description provided."}</p>
                  </div>

                  <div className="space-y-3 pt-3" style={{ borderTop: "1px solid var(--border-card)" }}>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span style={{ color: "var(--text-muted)" }}>Completion Progress</span>
                      <span style={{ color: "var(--accent-primary)" }}>{progressPct}% ({completedProjTasks}/{totalProjTasks})</span>
                    </div>

                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-input)" }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, background: "var(--gradient-brand)" }} />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 font-medium" style={{ color: "var(--text-muted)" }}>
                      <span>Budget: Rs. {(proj.budget || 0).toLocaleString()}</span>
                      <span>Start: {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "Immediate"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Kanban & Creation Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Kanban Columns */}
        <div className={canAssignTask ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>Task Execution Board</h2>
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Drag or update status below</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.value);
              return (
                <div key={col.value} className="glass-panel p-4 flex flex-col gap-3 min-h-[220px]">
                  <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--border-card)" }}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="font-extrabold text-xs tracking-wide uppercase" style={{ color: "var(--text-primary)" }}>{col.label}</span>
                    </div>
                    <span className="badge text-[10px]" style={{ background: "var(--bg-input)", color: "var(--text-muted)" }}>{colTasks.length}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    {colTasks.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: "var(--border-card)" }}>
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>Empty lane</p>
                      </div>
                    ) : (
                      colTasks.map((task: any) => {
                        const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
                        return (
                          <div key={task.id} className="kanban-card relative p-3.5 rounded-xl border" style={{ background: "var(--bg-card-alt)", borderColor: "var(--border-card)" }}>
                            {taskActionLoading === task.id && (
                              <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
                                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent-primary)" }} />
                              </div>
                            )}

                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className="text-xs font-bold leading-snug" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                              
                              {canManageTasks && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => openEditModal(task)}
                                    title="Edit Task"
                                    className="p-1 rounded hover:bg-slate-500/20 text-slate-400 hover:text-sky-400 cursor-pointer transition-all"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    title="Delete Task"
                                    className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 cursor-pointer transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <p className="text-[11px] mb-1.5 font-semibold" style={{ color: "var(--accent-primary)" }}>{task.project?.name || "—"}</p>

                            {task.description && (
                              <p className="text-[11px] mb-2.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>{task.description}</p>
                            )}

                            <div className="flex items-center justify-between mb-2 text-[10px]">
                              <span className="badge px-2 py-0.5" style={{ background: pc.bg, color: pc.text }}>
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--text-muted)" }}>
                                <User className="h-3 w-3" />
                                <span>{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName.slice(0, 1)}.` : "Unassigned"}</span>
                              </div>
                            </div>

                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-[10px] mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
                                <Clock className="h-3 w-3" />
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}

                            <div className="pt-2" style={{ borderTop: "1px solid var(--border-card)" }}>
                              <label className="block text-[9px] font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Move to</label>
                              <select
                                value={task.status}
                                disabled={!canChangeTaskState(task)}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                className={`w-full rounded-lg px-2 py-1 text-xs font-semibold ${
                                  !canChangeTaskState(task) ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                                }`}
                                style={{
                                  background: "var(--bg-input)",
                                  color: "var(--text-primary)",
                                  border: "1px solid var(--border-card)",
                                  outline: "none",
                                }}
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">In Review</option>
                                <option value="DONE">Done</option>
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Form Panel — ONLY FOR ADMIN, CEO, HR */}
        {canAssignTask && (
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                <h2 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Assign Task to Employee</h2>
              </div>

              {taskSuccess && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />{taskSuccess}</div>}
              {taskError   && <div className="alert-danger  mb-4"><AlertCircle  className="h-4 w-4 shrink-0" />{taskError}</div>}

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Implement OAuth logic"
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Task Type / Scope</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="form-select font-semibold"
                  >
                    <option value="CURRENT">CURRENT TASK</option>
                    <option value="NEW">NEW TASK</option>
                    <option value="UPDATION">UPDATION TASK</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Task context, requirements, constraints..."
                    rows={2}
                    className="form-input"
                    style={{ resize: "none" }}
                  />
                </div>

                <div>
                  <label className="form-label">Target Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="form-select font-semibold"
                  >
                    {projects.length === 0 ? (
                      <option value="">No Projects Found</option>
                    ) : (
                      projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="form-label">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="form-select font-semibold"
                  >
                    <option value="">Unassigned</option>
                    {employees.map((e: any) => (
                      <option key={e.id} value={e.id}>
                        {e.firstName} {e.lastName} ({e.position})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="form-select font-semibold"
                    >
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
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={taskFormLoading || projects.length === 0}
                  className="btn-primary w-full py-3 mt-2 justify-center"
                >
                  {taskFormLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4" /> Confirm Assignment
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

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
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay flex items-center justify-center p-4 z-50">
          <div className="modal-content p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <h3 className="text-lg font-black" style={{ color: "var(--text-primary)" }}>New Project Scope</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Create a project container for tasks</p>
              </div>
              <button onClick={() => setShowProjectModal(false)} className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {projSuccess && <div className="alert-success mb-4">{projSuccess}</div>}
            {projError   && <div className="alert-danger  mb-4">{projError}</div>}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Project Name</label>
                <input type="text" required value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="e.g. ERP AI Integration" className="form-input" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea value={projDesc} onChange={(e) => setProjDesc(e.target.value)} placeholder="Scope objectives..." rows={2} className="form-input" style={{ resize: "none" }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Budget (Rs.)</label>
                  <input type="number" required value={projBudget} onChange={(e) => setProjBudget(e.target.value)} placeholder="150000" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Start Date</label>
                  <input type="date" value={projStartDate} onChange={(e) => setProjStartDate(e.target.value)} className="form-input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={projLoading} className="btn-primary flex-1">
                  {projLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
