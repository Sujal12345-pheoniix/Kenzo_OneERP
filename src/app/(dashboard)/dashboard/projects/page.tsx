"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2, FolderPlus, CheckCircle2, AlertCircle, Calendar, Plus, X } from "lucide-react";

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Task form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);
  const [taskSuccess, setTaskSuccess] = useState("");
  const [taskError, setTaskError] = useState("");

  // New Project Modal form state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projBudget, setProjBudget] = useState("");
  const [projStartDate, setProjStartDate] = useState("");
  const [projLoading, setProjLoading] = useState(false);
  const [projSuccess, setProjSuccess] = useState("");
  const [projError, setProjError] = useState("");

  const loadData = async () => {
    try {
      const [resProjects, resTasks, resHrms] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/projects/tasks"),
        fetch("/api/hrms"),
      ]);

      const projectsData = await resProjects.json();
      const tasksData = await resTasks.json();
      const hrmsData = await resHrms.json();

      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      const empList = hrmsData.employees || [];
      setEmployees(empList);

      if (Array.isArray(projectsData) && projectsData.length > 0) {
        setProjectId((prev) => (prev && projectsData.some(p => p.id === prev) ? prev : projectsData[0].id));
      }
      if (empList.length > 0) {
        setAssigneeId((prev) => (prev && empList.some((e: any) => e.id === prev) ? prev : empList[0].id));
      }

      setLoading(false);
    } catch (err) {
      console.error("Error loading project data:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit New Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskSuccess("");
    setTaskError("");

    if (!projectId) {
      setTaskError("Please select a valid project scope (or create a new project first).");
      return;
    }

    setTaskFormLoading(true);
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          projectId,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
          status: "TODO",
        }),
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || "Failed to create project task");

      setTitle("");
      setDescription("");
      setDueDate("");
      setTaskSuccess("Project task created and added to execution board!");
      await loadData();
      setTimeout(() => setTaskSuccess(""), 3500);
    } catch (err: any) {
      setTaskError(err.message || "An error occurred while creating task");
    } finally {
      setTaskFormLoading(false);
    }
  };

  // Submit New Project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjSuccess("");
    setProjError("");
    setProjLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projName,
          description: projDesc,
          budget: Number(projBudget),
          startDate: projStartDate || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create project");

      setProjName("");
      setProjDesc("");
      setProjBudget("");
      setProjStartDate("");
      setProjSuccess("Project created successfully!");
      await loadData();
      if (resData.id) setProjectId(resData.id);
      setTimeout(() => {
        setProjSuccess("");
        setShowProjectModal(false);
      }, 1500);
    } catch (err: any) {
      setProjError(err.message || "An error occurred");
    } finally {
      setProjLoading(false);
    }
  };

  // Move / Update Task Status
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setTaskActionLoading(taskId);
    try {
      const res = await fetch("/api/projects/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Update task status error:", err);
    } finally {
      setTaskActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const columns = [
    { label: "To Do", value: "TODO" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "In Review", value: "REVIEW" },
    { label: "Done", value: "DONE" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projects & Delivery</h1>
          <p className="text-slate-500 text-sm mt-1">Manage project schedules, track task execution lanes, and monitor resource assignments.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowProjectModal(true)}
          className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 shrink-0"
        >
          <FolderPlus className="h-4 w-4" /> Create New Project
        </button>
      </div>

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-sky-600" /> Create Project
              </h3>
              <button
                type="button"
                onClick={() => setShowProjectModal(false)}
                className="h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {projSuccess && <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">{projSuccess}</div>}
            {projError && <div className="text-xs font-semibold text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">{projError}</div>}

            <form onSubmit={handleCreateProject} className="flex flex-col gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Project Name</label>
                <input
                  type="text" required value={projName} onChange={(e) => setProjName(e.target.value)}
                  placeholder="e.g. ERP Cloud Migration"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  required value={projDesc} onChange={(e) => setProjDesc(e.target.value)}
                  placeholder="Project goals and deliverables..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Budget (Rs.)</label>
                <input
                  type="number" required value={projBudget} onChange={(e) => setProjBudget(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Start Date</label>
                <input
                  type="date" value={projStartDate} onChange={(e) => setProjStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button" onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={projLoading}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  {projLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Projects Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="md:col-span-2 glass-panel p-6 text-center text-slate-400 text-sm">
            No active projects found. Click <strong>"Create New Project"</strong> above to set up your first project.
          </div>
        ) : (
          projects.map((proj: any) => {
            const totalProjTasks = tasks.filter(t => t.projectId === proj.id).length;
            const completedProjTasks = tasks.filter(t => t.projectId === proj.id && t.status === "DONE").length;
            const pct = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

            return (
              <div key={proj.id} className="glass-panel p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-slate-900 font-bold text-lg">{proj.name}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200">{proj.status}</span>
                </div>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">{proj.description}</p>
                
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Task Progress</span>
                    <span>{pct}% Completed ({completedProjTasks}/{totalProjTasks})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Budget: <b>Rs. {(proj.budget || 0).toLocaleString()}</b></span>
                  <span>Started: {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : "N/A"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Kanban Board & New Task Form */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Kanban Board */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-6">Task Execution Board</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {columns.map((col) => {
                const colTasks = tasks.filter((t) => t.status === col.value);
                return (
                  <div key={col.value} className="flex flex-col gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-[320px]">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">
                      {col.label} ({colTasks.length})
                    </span>
                    
                    <div className="flex flex-col gap-3">
                      {colTasks.length === 0 ? (
                        <div className="text-[11px] text-slate-400 italic text-center py-8">
                          No tasks in {col.label.toLowerCase()}
                        </div>
                      ) : (
                        colTasks.map((task: any) => (
                          <div key={task.id} className="p-3.5 rounded-xl bg-white border border-slate-100 flex flex-col gap-2 hover:border-sky-300 transition-all relative shadow-sm">
                            {taskActionLoading === task.id && (
                              <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                                <Loader2 className="h-4 w-4 text-sky-600 animate-spin" />
                              </div>
                            )}
                            <span className="block text-xs font-bold text-slate-900 leading-snug">{task.title}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{task.project?.name || "Unassigned Project"}</span>
                            
                            {task.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{task.description}</p>
                            )}

                            <div className="flex justify-between items-center mt-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                task.priority === "URGENT" || task.priority === "CRITICAL"
                                  ? "bg-red-50 text-red-600 border border-red-200"
                                  : task.priority === "HIGH"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : task.priority === "NEW"
                                  ? "bg-sky-50 text-sky-600 border border-sky-200"
                                  : task.priority === "UPDATING"
                                  ? "bg-purple-50 text-purple-600 border border-purple-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold">
                                {task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName.slice(0, 1)}.` : "Unassigned"}
                              </span>
                            </div>
                            
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-between items-center">
                              <select
                                value={task.status}
                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                className="w-full text-[9px] bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded py-1 px-1.5 focus:outline-none focus:border-sky-500"
                              >
                                <option value="TODO">To Do</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="REVIEW">In Review</option>
                                <option value="DONE">Done</option>
                              </select>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Creator Form Sidebar */}
        <div>
          <div className="glass-panel p-6 sticky top-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Project Task</h3>
            
            {taskSuccess && (
              <div className="mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                {taskSuccess}
              </div>
            )}

            {taskError && (
              <div className="mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                {taskError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Project Scope</label>
                  {projects.length === 0 && (
                    <button
                      type="button" onClick={() => setShowProjectModal(true)}
                      className="text-[10px] font-bold text-sky-600 underline"
                    >
                      + Create Project
                    </button>
                  )}
                </div>
                {projects.length === 0 ? (
                  <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-150 font-semibold">
                    No projects created yet. Please create a project first.
                  </div>
                ) : (
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all font-semibold"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs transition-all min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Priority / Status</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all font-semibold"
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all font-semibold"
                >
                  <option value="">Unassigned</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={taskFormLoading || projects.length === 0}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5 disabled:opacity-50"
              >
                {taskFormLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Add Task</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
