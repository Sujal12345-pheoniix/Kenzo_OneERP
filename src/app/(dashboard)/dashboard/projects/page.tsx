"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskActionLoading, setTaskActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const resProjects = await fetch("/api/projects");
      const resTasks = await fetch("/api/projects/tasks");
      const resHrms = await fetch("/api/hrms");

      const projectsData = await resProjects.json();
      const tasksData = await resTasks.json();
      const hrmsData = await resHrms.json();

      setProjects(projectsData);
      setTasks(tasksData);
      setEmployees(hrmsData.employees || []);

      if (projectsData.length > 0) {
        setProjectId(projectsData[0].id);
      }
      if (hrmsData.employees && hrmsData.employees.length > 0) {
        setAssigneeId(hrmsData.employees[0].id);
      }

      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
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
          assigneeId,
          dueDate,
          status: "TODO",
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setDueDate("");
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskFormLoading(false);
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
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTaskActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Projects & Delivery</h1>
        <p className="text-slate-500 text-sm mt-1">Manage project schedules, track task execution lanes, and monitor resource assignments.</p>
      </div>

      {/* Projects Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj: any) => {
          const totalProjTasks = tasks.filter(t => t.projectId === proj.id).length;
          const completedProjTasks = tasks.filter(t => t.projectId === proj.id && t.status === "DONE").length;
          const pct = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

          return (
            <div key={proj.id} className="glass-panel p-6">
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-900 font-bold text-lg">{proj.name}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200">{proj.status}</span>
              </div>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed line-clamp-2">{proj.description}</p>
              
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Task Progress</span>
                  <span>{pct}% Completed</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Budget: <b>${proj.budget.toLocaleString()}</b></span>
                <span>Created: {new Date(proj.startDate).toLocaleDateString()}</span>
              </div>
            </div>
          );
        })}
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
                  <div key={col.value} className="flex flex-col gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-[300px]">
                    <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 px-1">{col.label} ({colTasks.length})</span>
                    
                    <div className="flex flex-col gap-3">
                      {colTasks.map((task: any) => (
                        <div key={task.id} className="p-3.5 rounded-xl bg-white border border-slate-100 flex flex-col gap-2 hover:border-sky-300 transition-all relative shadow-sm">
                          {taskActionLoading === task.id && (
                            <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                              <Loader2 className="h-4 w-4 text-sky-600 animate-spin" />
                            </div>
                          )}
                          <span className="block text-xs font-bold text-slate-900 leading-snug">{task.title}</span>
                          <span className="text-[10px] text-slate-500 line-clamp-1">{task.project.name}</span>
                          <div className="flex justify-between items-center mt-2.5">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              task.priority === "CRITICAL"
                                ? "bg-red-50 text-red-650"
                                : task.priority === "HIGH"
                                ? "bg-amber-50 text-amber-650"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">{task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName.slice(0, 1)}.` : "Unassigned"}</span>
                          </div>
                          
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                            <select
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                              className="w-full text-[9px] bg-slate-50 border border-slate-200 text-slate-600 rounded py-1 px-1 focus:outline-none"
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="REVIEW">In Review</option>
                              <option value="DONE">Done</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Task Creator Form */}
        <div>
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Project Task</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Project Scope</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Task details..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs transition-all min-h-[60px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Assignee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
                >
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
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-xs transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={taskFormLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
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
