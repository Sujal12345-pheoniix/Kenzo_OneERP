"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  Key,
  Trash2,
  Plus,
  ShieldAlert,
  Check,
  Calendar,
  Activity as ActivityIcon,
  ShieldCheck,
  UserPlus,
  Clock,
  UserCheck,
  Zap,
  TrendingDown,
  Building,
  Target,
  X,
  FolderKanban,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export default function ExecutiveHub() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Admin user management state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState("DEVELOPER");
  const [newUserDept, setNewUserDept] = useState("ENGINEERING");
  const [newUserPos, setNewUserPos] = useState("Software Engineer");
  const [newUserSal, setNewUserSal] = useState("75000");
  const [addUserError, setAddUserError] = useState("");
  const [addUserSuccess, setAddUserSuccess] = useState("");

  // Password reset state
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const router = useRouter();
  const [latestTask, setLatestTask] = useState<any>(null);
  const [showTaskPopup, setShowTaskPopup] = useState(false);

  const fetchSessionAndData = async () => {
    try {
      // 1. Fetch Session
      const sessionRes = await fetch("/api/auth/session");
      const sessionJson = await sessionRes.json();
      if (sessionJson.authenticated) {
        setSessionUser(sessionJson.user);
        
        // 2. Fetch General Dashboard Stats
        const dashRes = await fetch("/api/dashboard");
        const dashJson = await dashRes.json();
        setData(dashJson);

        // 3. Fetch Assigned Tasks for Notification Popup — STRICTLY FILTERED TO LOGGED IN USER
        try {
          const tasksRes = await fetch("/api/projects/tasks");
          if (tasksRes.ok) {
            const tasksList = await tasksRes.json();
            if (Array.isArray(tasksList) && tasksList.length > 0) {
              const currentUserId = sessionJson.user.id;
              const currentUserEmail = sessionJson.user.email;
              const currentUserName = (sessionJson.user.name || "").trim().toLowerCase();

              const myAssignedTask = tasksList.find((t: any) => {
                if (!t || t.status === "DONE" || !t.assignee) return false;
                const matchUserId = t.assignee.userId === currentUserId;
                const matchEmail = t.assignee.email === currentUserEmail || t.assignee.user?.email === currentUserEmail;
                const empFullName = `${t.assignee.firstName || ''} ${t.assignee.lastName || ''}`.trim().toLowerCase();
                const matchName = empFullName === currentUserName;
                return matchUserId || matchEmail || matchName;
              });

              if (myAssignedTask) {
                setLatestTask(myAssignedTask);
                setShowTaskPopup(true);
              } else {
                setLatestTask(null);
                setShowTaskPopup(false);
              }
            }
          }
        } catch (e) {
          console.error("Task popup fetch error:", e);
        }

        // 4. If Admin, fetch users
        if (sessionJson.user.role === "COMPANY_ADMIN" || sessionJson.user.role === "SUPER_ADMIN") {
          fetchAdminUsers();
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    setAdminUsersLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const json = await res.json();
        setAdminUsers(json.users || []);
      }
    } catch (err) {
      console.error("Error fetching admin users:", err);
    } finally {
      setAdminUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndData();
  }, []);

  const handleApproveLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(leaveId);
    try {
      await fetch("/api/hrms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status }),
      });
      await fetchSessionAndData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveExpense = async (expenseId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(expenseId);
    try {
      await fetch("/api/finance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId, status }),
      });
      await fetchSessionAndData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError("");
    setAddUserSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole,
          department: newUserDept,
          position: newUserPos,
          salary: newUserSal,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to add user");
      }
      setAddUserSuccess("User account and employee profile successfully created!");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      fetchAdminUsers();
      setTimeout(() => {
        setShowAddUserModal(false);
        setAddUserSuccess("");
      }, 1500);
    } catch (err: any) {
      setAddUserError(err.message || "Something went wrong");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: resettingUserId,
          password: newResetPassword,
        }),
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to reset password");
      }
      setResetSuccess("Password successfully updated!");
      setNewResetPassword("");
      setTimeout(() => {
        setResettingUserId(null);
        setResetSuccess("");
      }, 1200);
    } catch (err: any) {
      setResetError(err.message || "Failed to update password");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will also remove their Employee record.")) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: "DELETE",
      });
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "Failed to delete user");
      }
      fetchAdminUsers();
      fetchSessionAndData();
    } catch (err: any) {
      alert(err.message || "Error deleting user");
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]" style={{ background: 'var(--bg-base)' }}>
        <div className="relative flex items-center justify-center mb-5">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--gradient-brand)' }}>
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div className="absolute h-18 w-18 rounded-2xl border-2 animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent', animationDuration: '1.2s', inset: '-4px' }} />
        </div>
        <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>Syncing Workspace Ledger...</span>
        <span className="text-xs mt-1" style={{ color: 'var(--accent-primary)' }}>Kenzo OneERP</span>
      </div>
    );
  }

  const { metrics, recentActivities, recentAuditLogs, approvalQueue } = data;
  const role = sessionUser?.role || "EMPLOYEE";

  // Render Admin Dashboard
  if (role === "COMPANY_ADMIN" || role === "SUPER_ADMIN") {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto animate-fade-in-up" style={{ color: 'var(--text-primary)' }}>
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5" style={{ borderBottom: '1px solid var(--border-base)' }}>
          <div>
            <div className="section-eyebrow">
              <ShieldCheck className="h-4 w-4" /> Admin Control Node
            </div>
            <h1 className="text-3xl font-black tracking-tight mt-1" style={{ color: 'var(--text-primary)' }}>Admin Control Hub</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Control corporate security, user permissions, monitor audit logs, and oversee global operations.</p>
          </div>
          <button
            onClick={() => setShowAddUserModal(true)}
            className="btn-primary"
          >
            <UserPlus className="h-4 w-4" /> Add Corporate User
          </button>
        </div>

        {/* KPI Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: 'Total Members', value: adminUsers.length || metrics.employees, sub: 'Active directory user nodes', grad: 'linear-gradient(135deg,#0ea5e9,#38bdf8)', glow: 'rgba(14,165,233,0.2)', icon: Users },
            { label: 'Operational Inflow', value: `Rs. ${metrics.revenue.toLocaleString()}`, sub: 'Paid invoices cash-inflow', grad: 'linear-gradient(135deg,#10b981,#34d399)', glow: 'rgba(16,185,129,0.2)', icon: DollarSign },
            { label: 'Active Initiatives', value: metrics.activeProjects, sub: 'Current running projects', grad: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', glow: 'rgba(139,92,246,0.2)', icon: FolderKanban },
            { label: 'Audit Trail', value: `${recentAuditLogs.length} logs`, sub: 'Recent security transactions', grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,0.2)', icon: ShieldCheck },
          ].map((kpi, i) => {
            const KpiIcon = kpi.icon;
            return (
              <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{kpi.label}</span>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: kpi.grad, boxShadow: `0 4px 14px ${kpi.glow}` }}>
                    <KpiIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{kpi.value}</div>
                <span className="text-xs mt-1.5 block" style={{ color: 'var(--text-muted)' }}>{kpi.sub}</span>
              </div>
            );
          })}
        </div>

        {/* User Management & RBAC Controls */}
        <div className="glass-panel p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Active User Directory &amp; RBAC Matrix</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Assign roles, adjust employee salary status, update access codes, or purge inactive records.</p>
            </div>
            {adminUsersLoading && <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--accent-primary)' }} />}
          </div>
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Dept / Position</th>
                  <th>Salary</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white" style={{ background: 'var(--gradient-brand)' }}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span className="badge" style={{
                        background: u.role === 'COMPANY_ADMIN' ? 'rgba(239,68,68,0.1)' : u.role === 'CEO' ? 'rgba(245,158,11,0.1)' : u.role === 'HR' ? 'rgba(139,92,246,0.1)' : 'rgba(99,102,241,0.1)',
                        color: u.role === 'COMPANY_ADMIN' ? '#ef4444' : u.role === 'CEO' ? '#f59e0b' : u.role === 'HR' ? '#8b5cf6' : 'var(--accent-primary)'
                      }}>
                        {u.employee?.position || u.role}
                      </span>
                    </td>
                    <td>
                      <div className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{u.employee?.position || 'N/A'}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{u.employee?.department || 'N/A'}</div>
                    </td>
                    <td className="font-bold" style={{ color: 'var(--accent-success)' }}>Rs. {(u.employee?.salary || 0).toLocaleString()}/yr</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setResettingUserId(u.id); setNewResetPassword(''); setResetError(''); setResetSuccess(''); }}
                          title="Reset Passkey"
                          className="p-1.5 rounded-lg cursor-pointer transition-all"
                          style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        {u.id !== sessionUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            title="Revoke Access"
                            className="p-1.5 rounded-lg cursor-pointer transition-all"
                            style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)' }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Resetting Password */}
        {resettingUserId && (
          <div className="modal-overlay flex items-center justify-center">
            <div className="modal-content p-6 w-full max-w-sm">
              <h3 className="text-base font-black mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Key className="h-4 w-4" style={{ color: 'var(--accent-primary)' }} /> Force Password Update
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Enter a new secure pin/password code for the credential database.</p>
              {resetError && (
                <div className="p-3 text-xs rounded-xl mb-3 flex gap-2" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)' }}>
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {resetError}
                </div>
              )}
              {resetSuccess && (
                <div className="p-3 text-xs rounded-xl mb-3 flex gap-2" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-success)' }}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {resetSuccess}
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newResetPassword}
                    onChange={(e) => setNewResetPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setResettingUserId(null)}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Update Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal to Add User */}
        {showAddUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 w-full max-w-md shadow-2xl animate-scaleUp overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-sky-600" /> Spawn User Instance
                  </h3>
                  <p className="text-xs text-slate-500">Provide unique corporate credentials and role hierarchy parameters.</p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {addUserError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4 flex gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" /> {addUserError}
                </div>
              )}
              {addUserSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-xs rounded-xl mb-4 flex gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {addUserSuccess}
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jitendar Saini"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@kenzo.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Pin / Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Enterprise Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="DEVELOPER">DEVELOPER</option>
                      <option value="PROJECT_MANAGER">PROJECT MANAGER</option>
                      <option value="HR">HR MANAGER</option>
                      <option value="CEO">CHIEF EXECUTIVE (CEO)</option>
                      <option value="COMPANY_ADMIN">COMPANY ADMIN</option>
                      <option value="FINANCE">FINANCE MANAGER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Department</label>
                    <select
                      value={newUserDept}
                      onChange={(e) => setNewUserDept(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="ENGINEERING">ENGINEERING</option>
                      <option value="HR">HR</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="SALES">SALES & CRM</option>
                      <option value="MANAGEMENT">MANAGEMENT</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Position Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lead Engineer"
                      value={newUserPos}
                      onChange={(e) => setNewUserPos(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Salary (Rs.)</label>
                    <input
                      type="number"
                      required
                      placeholder="Salary"
                      value={newUserSal}
                      onChange={(e) => setNewUserSal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 mt-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-600/10"
                >
                  Create Identity Profile
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Security & Audit Lists Split */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-sky-600" /> Security Auditing Ledger
            </h3>
            <div className="space-y-3">
              {recentAuditLogs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                  <div>
                    <span className="block text-xs font-bold text-slate-800">{log.action} - {log.resource}</span>
                    <span className="text-[10px] text-slate-500">{log.details}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-sky-600 font-bold">{log.user?.name || "System"}</span>
                    <span className="text-[9px] text-slate-450 block">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ActivityIcon className="h-4.5 w-4.5 text-violet-600" /> Operational Action Log
            </h3>
            <div className="space-y-3">
              {recentActivities.map((act: any) => (
                <div key={act.id} className="flex gap-4 p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all border border-slate-100/50">
                  <div className="h-2 w-2 rounded-full bg-violet-500 mt-2 shrink-0 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-slate-700 text-xs font-semibold">{act.message}</p>
                    <span className="text-[9px] text-slate-400 block mt-1">{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render CEO Dashboard
  if (role === "CEO") {
    // Generate dummy financial metrics charts
    const revenueTrendData = [
      { name: "Jan", revenue: 4.5, deals: 32 },
      { name: "Feb", revenue: 5.2, deals: 36 },
      { name: "Mar", revenue: 6.8, deals: 41 },
      { name: "Apr", revenue: 8.7, deals: 47 },
    ];

    const runwayData = [
      { name: "Q1", burn: 340, runway: 18 },
      { name: "Q2", burn: 320, runway: 21 },
      { name: "Q3", burn: 310, runway: 24 },
      { name: "Q4", burn: 285, runway: 29 },
    ];

    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-slate-800 animate-fadeIn">
        {/* CEO Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <Zap className="h-4 w-4" /> Strategic Operations
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">CEO Intelligence Dashboard</h1>
            <p className="text-slate-500 text-sm mt-0.5">High-level financial performance metrics, deals, and capital runway indices.</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-150 text-indigo-600 text-xs font-bold shadow-sm flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" /> Strategic Mode
          </div>
        </div>

        {/* CEO Strategic KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider block">Total Capital Inflow</span>
              <span className="text-3xl font-extrabold text-emerald-950 tracking-tight mt-2 block">Rs. 8.7M</span>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" /> 12.5% vs last month
            </div>
          </div>
          <div className="glass-panel p-5">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Monthly Burn</span>
              <span className="text-3xl font-extrabold text-rose-950 tracking-tight mt-2 block">Rs. 285K/mo</span>
          </div>
          <div className="p-6 rounded-3xl bg-violet-50/70 border border-violet-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <span className="text-violet-700 text-xs font-bold uppercase tracking-wider block">Customer Retention</span>
              <span className="text-3xl font-extrabold text-violet-950 tracking-tight mt-2 block">97.4%</span>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-violet-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> 2.5% this quarter
            </div>
          </div>
          <div className="p-6 rounded-3xl bg-rose-50/70 border border-rose-100 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <span className="text-rose-700 text-xs font-bold uppercase tracking-wider block">Quarterly Burn Rate</span>
              <span className="text-3xl font-extrabold text-rose-950 tracking-tight mt-2 block">Rs. 285K/mo</span>
            </div>
            <div className="flex items-center gap-1 mt-4 text-[10px] font-bold text-rose-600">
              <ArrowDownRight className="h-3.5 w-3.5" /> 5.5% decreased
            </div>
          </div>
        </div>

        {/* Charts & Targets Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Trends Chart (Area) */}
          <div className="lg:col-span-2 glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" /> Revenue & Strategic Pipeline Trends
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (Rs. M)" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 text-center text-xs font-bold text-slate-500">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span>Q1 Target (Rs. 1.25M)</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span>Q2 Target (Rs. 1.5M)</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span>Q3 Target (Rs. 1.8M)</span>
              </div>
            </div>
          </div>

          {/* Revenue Targets & Progress */}
          <div className="glass-panel p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-indigo-650" /> Annual Target Indexes
              </h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span>Q1 Target ($1.25M)</span>
                    <span className="font-bold text-emerald-600">+2.5% Achieved</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span>Q2 Target ($1.5M)</span>
                    <span className="font-bold text-amber-500">95% complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: "95%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700">
                    <span>Q3 Target ($1.8M)</span>
                    <span className="font-bold text-sky-650">85% complete</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-sky-600 h-full rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex gap-3 text-xs text-indigo-950 mt-6">
              <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5 animate-bounce" />
              <div>
                <span className="font-bold block">AI Growth Suggestion</span>
                Leveraging the +2.5% increase in pipeline size, scale Developer resource nodes to unlock faster delivery cycles.
              </div>
            </div>
          </div>
        </div>

        {/* Burn Rate & Runway Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="h-5 w-5 text-indigo-600" /> Capital Runway Index (Months)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={runwayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="runway" fill="#6366f1" radius={[4, 4, 0, 0]} name="Runway (Months)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-2 glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Strategic Expenses in Queue</h3>
            {approvalQueue.expenses.length === 0 ? (
              <p className="text-slate-400 text-xs font-semibold">All strategic expenditures cleared.</p>
            ) : (
              <div className="space-y-4">
                {approvalQueue.expenses.map((exp: any) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="font-bold text-slate-800 block text-sm">{exp.category}</span>
                      <span className="text-slate-500 text-xs">{exp.description}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-base font-extrabold text-slate-900">Rs. {exp.amount}</span>
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveExpense(exp.id, "APPROVED")}
                          className="px-3.5 py-2 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-600 hover:text-white cursor-pointer transition-all"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveExpense(exp.id, "REJECTED")}
                          className="px-3.5 py-2 bg-red-50 text-red-650 text-xs font-bold rounded-xl hover:bg-red-600 hover:text-white cursor-pointer transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render HR Dashboard
  if (role === "HR") {
    const attendanceSummary = [
      { name: "Present", value: 92, color: "#10b981" },
      { name: "Absent", value: 3, color: "#ef4444" },
      { name: "On Leave", value: 5, color: "#f59e0b" },
    ];

    const productivityStats = [
      { month: "Jan", present: 85, critical: 5 },
      { month: "Feb", present: 88, critical: 3 },
      { month: "Mar", present: 90, critical: 4 },
      { month: "Apr", present: 92, critical: 3 },
    ];

    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-slate-800 animate-fadeIn">
        {/* HR Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-widest">
              <Users className="h-4 w-4" /> Employee Operations
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">HR Insights & Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Administer leaves, track attendance schedules, and view staff statistics.</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-violet-50 border border-violet-150 text-violet-600 text-xs font-bold shadow-sm flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" /> HR Mode
          </div>
        </div>

        {/* Headcount Stat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 border-t-4 border-t-violet-500">
            <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Total Headcount</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">120 Employees</div>
            <span className="text-[10px] text-emerald-605 font-bold block mt-1">+5% from last month</span>
          </div>
          <div className="glass-panel p-6 border-t-4 border-t-emerald-500">
            <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Full Time Active</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">80 Employees</div>
            <span className="text-[10px] text-emerald-605 font-bold block mt-1">+3% from last month</span>
          </div>
          <div className="glass-panel p-6 border-t-4 border-t-amber-500">
            <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Part Time Active</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">40 Employees</div>
            <span className="text-[10px] text-amber-605 font-bold block mt-1">+2% from last month</span>
          </div>
        </div>

        {/* Attendance Summary & Who's Away split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Donut Chart */}
          <div className="glass-panel p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-violet-600" /> Today's Attendance Index
              </h3>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={attendanceSummary} cx="55%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={5} dataKey="value">
                      {attendanceSummary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              {attendanceSummary.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="text-slate-900 font-extrabold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Productivity Trends Bar Chart */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">HR KPI Operations History</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productivityStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="present" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Present Metric" />
                  <Bar dataKey="critical" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Leave Metric" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Who's Away Panel */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-700" /> Out-of-Office Board
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-105 text-slate-700 font-bold flex items-center justify-center text-xs">SK</div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Sujal Kumar</span>
                  <span className="text-[10px] text-slate-450 block">Developer | July 15 - July 18</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-105 text-slate-700 font-bold flex items-center justify-center text-xs">CS</div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Chanchal Saini</span>
                  <span className="text-[10px] text-slate-450 block">Managing Director | July 16 - July 16</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Requests Approvals */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Pending Leave Approval Board</h3>
          {approvalQueue.leaves.length === 0 ? (
            <p className="text-slate-400 text-xs font-medium">All leave requests processed.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvalQueue.leaves.map((leave: any) => (
                <div key={leave.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{leave.employee.firstName} {leave.employee.lastName}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{leave.type} LEAVE</span>
                    </div>
                    <span className="text-[10px] text-violet-650 font-bold">{new Date(leave.startDate).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic mb-4">"{leave.reason}"</p>
                  <div className="flex gap-2">
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => handleApproveLeave(leave.id, "APPROVED")}
                      className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white text-xs font-bold rounded-xl border border-emerald-150 transition-all cursor-pointer"
                    >
                      Approve Request
                    </button>
                    <button
                      disabled={actionLoading !== null}
                      onClick={() => handleApproveLeave(leave.id, "REJECTED")}
                      className="flex-1 py-2 bg-red-50 hover:bg-red-600 text-red-650 hover:text-white text-xs font-bold rounded-xl border border-red-150 transition-all cursor-pointer"
                    >
                      Deny Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Employee / PM / Developer Dashboard
  const taskStatusSummary = [
    { name: "Stuck", value: 2, color: "#ef4444" },
    { name: "In Progress", value: 3, color: "#f59e0b" },
    { name: "In Review", value: 3, color: "#3b82f6" },
    { name: "Completed", value: 5, color: "#10b981" },
  ];

  const ongoingTasksData = [
    { name: "Mon", tasks: 12 },
    { name: "Tue", tasks: 18 },
    { name: "Wed", tasks: 28 },
    { name: "Thu", tasks: 15 },
    { name: "Fri", tasks: 22 },
    { name: "Sat", tasks: 8 },
    { name: "Sun", tasks: 10 },
  ];

  const salesRevenueData = [
    { name: "Mon", value: 120 },
    { name: "Tue", value: 180 },
    { name: "Wed", value: 145 },
    { name: "Thu", value: 210 },
    { name: "Fri", value: 160 },
    { name: "Sat", value: 200 },
    { name: "Sun", value: 150 },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto text-slate-800 animate-fadeIn">
      {/* Employee Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-widest">
            <Briefcase className="h-4 w-4" /> Personal Workspace
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">Workspace Portal & Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage tasks, timelines, growth statistics, and project progress logs.</p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-sky-50 border border-sky-150 text-sky-600 text-xs font-bold shadow-sm flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" /> Workspace Mode
        </div>
      </div>

      {/* Employee Workspace stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-5 flex flex-col justify-between">
          <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Completed Tasks</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-extrabold text-slate-950">43 Tasks</span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center"><ArrowUpRight className="h-3 w-3" /> 37.8%</span>
          </div>
        </div>
        <div className="glass-panel p-5 flex flex-col justify-between">
          <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Avg Task Time</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-extrabold text-slate-950">73 mins</span>
            <span className="text-[10px] font-bold text-red-500 flex items-center"><ArrowDownRight className="h-3 w-3" /> 37.8%</span>
          </div>
        </div>
        <div className="glass-panel p-5 flex flex-col justify-between">
          <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Tasks By Client</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-extrabold text-slate-950">83 Tasks</span>
            <span className="text-[10px] font-bold text-red-500 flex items-center"><ArrowDownRight className="h-3 w-3" /> 37.8%</span>
          </div>
        </div>
        <div className="glass-panel p-5 flex flex-col justify-between">
          <span className="text-slate-450 text-[10px] font-bold uppercase tracking-wider block">Recurring Projects</span>
          <div className="flex justify-between items-end mt-2">
            <span className="text-2xl font-extrabold text-slate-950">36 Projects</span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center"><ArrowUpRight className="h-3 w-3" /> 37.8%</span>
          </div>
        </div>
      </div>

      {/* Main charts split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ongoing Tasks Bar Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex justify-between items-center">
            <span>Ongoing Tasks Volume</span>
            <span className="text-xs font-semibold text-slate-400">Weekly View</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ongoingTasksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#0284c7" radius={[4, 4, 0, 0]} name="Completed Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales & Revenue Line Chart */}
        <div className="glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex justify-between items-center">
            <span>Corporate Revenue Activity</span>
            <span className="text-xs font-semibold text-slate-400">Weekly View</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2.5} name="Revenue (Rs.)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Productivity Donut Chart & Task Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4">Productivity KPIs</h3>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskStatusSummary} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={4} dataKey="value">
                    {taskStatusSummary.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
            {taskStatusSummary.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-semibold">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-500">{item.name}</span>
                <span className="text-slate-800 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 glass-panel p-6">
          <h3 className="text-base font-bold text-slate-900 mb-4">Successful Tasks Overview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 pb-3">Task Initiative</th>
                  <th className="py-2.5 pb-3">Task Description</th>
                  <th className="py-2.5 pb-3">Due Target</th>
                  <th className="py-2.5 pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-bold text-slate-850">Populate Ledger Table</td>
                  <td className="py-3 text-slate-500">Formulate and write financial transaction journal lists...</td>
                  <td className="py-3 text-slate-650">May 5, 2026</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[9px]">Completed</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-bold text-slate-850">Optimizing API Responses</td>
                  <td className="py-3 text-slate-500">Refactoring Next.js server actions and caching layers...</td>
                  <td className="py-3 text-slate-650">June 18, 2026</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold text-[9px]">In Progress</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-bold text-slate-850">Theme System Integration</td>
                  <td className="py-3 text-slate-500">Tailoring Tailwind styles and border gloss overrides...</td>
                  <td className="py-3 text-slate-650">June 24, 2026</td>
                  <td className="py-3 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[9px]">In Review</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pop-Up Notification Modal for Assigned Work & Task */}
      {showTaskPopup && latestTask && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 text-white rounded-3xl p-5 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2 text-sky-400 font-extrabold text-xs uppercase tracking-wider">
              <Zap className="h-4 w-4 animate-pulse text-amber-400" />
              Assigned Work &amp; Task Pop-Up
            </div>
            <button
              onClick={() => setShowTaskPopup(false)}
              className="h-6 w-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div>
            <h4 className="font-extrabold text-sm text-white">{latestTask.title}</h4>
            <p className="text-slate-400 text-xs mt-1 line-clamp-2">{latestTask.description || "Active task instructions attached to your project."}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Project: {latestTask.project?.name || "Corporate Project"}
            </span>
            <span className={`px-2 py-0.5 rounded-full border ${
              latestTask.priority === "URGENT" || latestTask.priority === "CRITICAL"
                ? "bg-red-500/20 text-red-300 border-red-500/30"
                : latestTask.priority === "NEW"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : latestTask.priority === "UPDATING"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                : "bg-amber-500/20 text-amber-300 border-amber-500/30"
            }`}>
              {latestTask.priority || "HIGH"}
            </span>
            {latestTask.assignee && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Assigned: {latestTask.assignee.firstName} {latestTask.assignee.lastName.slice(0, 1)}.
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setShowTaskPopup(false);
              router.push("/dashboard/projects");
            }}
            className="mt-1 w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-sky-500/20 hover:scale-[1.02]"
          >
            <ArrowUpRight className="h-4 w-4" /> View Work &amp; Redirect to Task
          </button>
        </div>
      )}
    </div>
  );
}
