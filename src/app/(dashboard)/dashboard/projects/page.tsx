"use client";

import React, { useEffect, useState } from "react";
import {
  PlusCircle, Loader2, FolderPlus, CheckCircle2, AlertCircle,
  Calendar, X, Zap, Target, Clock, User, ChevronRight
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
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks]       = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  // Task form
  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId]   = useState("");
  const [taskType, setTaskType]     = useState("CURRENT");   // NEW field
  const [priority, setPriority]     = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate]       = useState("");
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState("");
  const [taskError, setTaskError]   = useState("");

  // Project modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName]       = useState("");
  const [projDesc, setProjDesc]       = useState("");
  const [projBudget, setProjBudget]   = useState("");
  const [projStartDate, setProjStartDate] = useState("");
  const [projLoading, setProjLoading]   = useState(false);
  const [projSuccess, setProjSuccess]   = useState("");
  const [projError, setProjError]       = useState("");

  const loadData = async () => {
    try {
      const [resProjects, resTasks, resHrms] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/projects/tasks"),
        fetch("/api/hrms"),
      ]);
      const projectsData = await resProjects.json();
      const tasksData    = await resTasks.json();
      const hrmsData     = await resHrms.json();

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
      setTaskSuccess("Task created and added to the board!");
      await loadData();
      setTimeout(() => setTaskSuccess(""), 3500);
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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div>
          <div className="section-eyebrow"><Target className="h-4 w-4" /> Project Execution</div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Projects &amp; Delivery</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Manage schedules, track task lanes, and monitor resource assignments.</p>
        </div>
        <button type="button" onClick={() => setShowProjectModal(true)} className="btn-primary shrink-0">
          <FolderPlus className="h-4 w-4" /> Create New Project
        </button>
      </div>

      {/* ── New Project Modal ── */}
      {showProjectModal && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content p-7 w-full max-w-md" style={{ color: "var(--text-primary)" }}>
            <div className="flex items-center justify-between mb-5 pb-4" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <h3 className="font-black text-lg flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <FolderPlus className="h-5 w-5" style={{ color: "var(--accent-primary)" }} /> Create Project
              </h3>
              <button type="button" onClick={() => setShowProjectModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {projSuccess && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />{projSuccess}</div>}
            {projError   && <div className="alert-danger mb-4"><AlertCircle  className="h-4 w-4 shrink-0" />{projError}</div>}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Project Name</label>
                <input type="text" required value={projName} onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. ERP Cloud Migration" className="form-input" />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea required value={projDesc} onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Project goals and deliverables..." rows={3} className="form-input" style={{ resize: "none" }} />
              </div>
              <div>
                <label className="form-label">Budget (Rs.)</label>
                <input type="number" required value={projBudget} onChange={(e) => setProjBudget(e.target.value)}
                  placeholder="e.g. 250000" className="form-input" />
              </div>
              <div>
                <label className="form-label">Start Date</label>
                <input type="date" value={projStartDate} onChange={(e) => setProjStartDate(e.target.value)} className="form-input" />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowProjectModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={projLoading} className="btn-primary">
                  {projLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Project Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.length === 0 ? (
          <div className="md:col-span-3 glass-panel p-8 text-center">
            <FolderPlus className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="font-semibold mb-1" style={{ color: "var(--text-muted)" }}>No active projects found</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Click <strong>"Create New Project"</strong> to get started.</p>
          </div>
        ) : (
          projects.map((proj: any, i: number) => {
            const totalProjTasks = tasks.filter((t) => t.projectId === proj.id).length;
            const completedProjTasks = tasks.filter((t) => t.projectId === proj.id && t.status === "DONE").length;
            const pct = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;
            const sColor = STATUS_TEXT[proj.status] || "var(--accent-primary)";
            const sBg = STATUS_COLORS[proj.status] || "var(--bg-hover)";

            return (
              <div key={proj.id} className="glass-panel p-5 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-black text-base" style={{ color: "var(--text-primary)" }}>{proj.name}</h3>
                  <span className="badge" style={{ background: sBg, color: sColor }}>{proj.status}</span>
                </div>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: "var(--text-muted)" }}>{proj.description}</p>

                <div className="mb-3">
                  <div className="flex justify-between text-xs font-semibold mb-1.5" style={{ color: "var(--text-muted)" }}>
                    <span>Progress</span>
                    <span style={{ color: "var(--accent-success)" }}>{pct}% ({completedProjTasks}/{totalProjTasks})</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  <span>Budget: <span style={{ color: "var(--accent-success)" }}>Rs. {(proj.budget || 0).toLocaleString()}</span></span>
                  <span style={{ color: "var(--text-secondary)" }}>{proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Kanban + Task Creator ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Kanban Board */}
        <div className="lg:col-span-3">
          <div className="glass-panel p-6">
            <h3 className="text-lg font-black mb-5" style={{ color: "var(--text-primary)" }}>Task Execution Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.value);
                return (
                  <div key={col.value} className="kanban-lane flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-black uppercase tracking-widest" style={{ color: col.color }}>
                        {col.label}
                      </span>
                      <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                        {colTasks.length}
                      </span>
                    </div>

                    {colTasks.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center py-8 rounded-xl border-2 border-dashed" style={{ borderColor: "var(--border-card)" }}>
                        <p className="text-xs italic" style={{ color: "var(--text-muted)" }}>Empty lane</p>
                      </div>
                    ) : (
                      colTasks.map((task: any) => {
                        const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;
                        return (
                          <div key={task.id} className="kanban-card relative">
                            {taskActionLoading === task.id && (
                              <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}>
                                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent-primary)" }} />
                              </div>
                            )}
                            <p className="text-sm font-bold leading-snug mb-1" style={{ color: "var(--text-primary)" }}>{task.title}</p>
                            <p className="text-xs mb-2 font-medium" style={{ color: "var(--accent-primary)" }}>{task.project?.name || "—"}</p>

                            {task.description && (
                              <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--text-muted)" }}>{task.description}</p>
                            )}

                            <div className="flex items-center justify-between mb-3">
                              <span className="badge" style={{ background: pc.bg, color: pc.text }}>
                                {task.priority}
                              </span>
                              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                <User className="h-3 w-3" />
                                <span>{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName.slice(0, 1)}.` : "Unassigned"}</span>
                              </div>
                            </div>

                            {task.dueDate && (
                              <div className="flex items-center gap-1 text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                                <Clock className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}

                            <div className="pt-2.5" style={{ borderTop: "1px solid var(--border-card)" }}>
                              <label className="block text-[10px] font-bold uppercase mb-1" style={{ color: "var(--text-muted)" }}>Move to</label>
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                className="w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                                style={{
                                  background: "var(--bg-input)",
                                  color: "var(--text-primary)",
                                  border: "1.5px solid var(--border-card)",
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
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Creator Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Add Task</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Assign to project &amp; team</p>
              </div>
            </div>

            {taskSuccess && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />{taskSuccess}</div>}
            {taskError   && <div className="alert-danger  mb-4"><AlertCircle  className="h-4 w-4 shrink-0" />{taskError}</div>}

            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">

              {/* Task Title */}
              <div>
                <label className="form-label">Task Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..." className="form-input" />
              </div>

              {/* Task Type */}
              <div>
                <label className="form-label">Task Type</label>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value)}
                  className="form-select font-semibold">
                  <option value="CURRENT">Current</option>
                  <option value="NEW">New</option>
                  <option value="UPDATION">Updation</option>
                </select>
              </div>

              {/* Select Project */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="form-label" style={{ marginBottom: 0 }}>Select Project</label>
                  {projects.length === 0 && (
                    <button type="button" onClick={() => setShowProjectModal(true)}
                      className="text-xs font-bold underline" style={{ color: "var(--accent-primary)" }}>
                      + New
                    </button>
                  )}
                </div>
                {projects.length === 0 ? (
                  <div className="alert-warning"><AlertCircle className="h-4 w-4 shrink-0" />No projects yet. Create one first.</div>
                ) : (
                  <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="form-select font-semibold">
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="form-label">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details..." rows={3} className="form-input" style={{ resize: "none" }} />
              </div>

              {/* Priority */}
              <div>
                <label className="form-label">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select font-semibold">
                  <option value="NEW">New</option>
                  <option value="UPDATING">Updating</option>
                  <option value="URGENT">Urgent</option>
                  <option value="PENDING">Pending</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="form-label">Assignee</label>
                <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="form-select font-semibold">
                  <option value="">Unassigned</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="form-label">Due Date</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="form-input" />
              </div>

              {/* Submit Button — always visible */}
              <button
                type="submit"
                disabled={taskFormLoading || projects.length === 0}
                className="btn-primary w-full mt-1"
                style={{ padding: "0.85rem" }}
              >
                {taskFormLoading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <><PlusCircle className="h-4 w-4" /> Confirm Assignment</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
