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
  Loader2
} from "lucide-react";

export default function ExecutiveHub() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveLeave = async (leaveId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(leaveId);
    try {
      await fetch("/api/hrms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaveId, status }),
      });
      await fetchDashboardData();
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
      await fetchDashboardData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const { metrics, recentActivities, recentAuditLogs, approvalQueue } = data;

  const cardStats = [
    {
      title: "Active Projects",
      value: metrics.activeProjects,
      description: "In execution phase",
      icon: Briefcase,
      color: "text-sky-600 bg-sky-50",
    },
    {
      title: "Sales Pipeline",
      value: `$${metrics.pipeline.toLocaleString()}`,
      description: "Qualified opportunities",
      icon: TrendingUp,
      color: "text-sky-600 bg-sky-50",
    },
    {
      title: "Corporate Staff",
      value: metrics.employees,
      description: "Active head count",
      icon: Users,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Current MRR / ARR",
      value: `$${metrics.mrr.toLocaleString()} / $${metrics.arr.toLocaleString()}`,
      description: "Based on invoicing",
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Executive Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time ledger analytics & operating oversight dashboard.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 text-xs font-bold shadow-sm">
          <Sparkles className="h-4 w-4 text-sky-600" />
          AI Insights Active
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="glass-panel p-6 relative overflow-hidden glass-card-glow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.title}</span>
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">{stat.value}</div>
              <span className="text-slate-500 text-xs font-medium">{stat.description}</span>
            </div>
          );
        })}
      </div>

      {/* Cash Flow Balance Panel */}
      <div className="glass-panel p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6">Financial Cash Ledger</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Inflow (Paid Invoices)</span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">${metrics.revenue.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>Healthy operating inflow</span>
            </div>
          </div>
          <div className="flex flex-col md:pl-8 pt-6 md:pt-0">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Outflow (Expenses)</span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">${metrics.expenses.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-amber-600">
              <ArrowDownRight className="h-4 w-4" />
              <span>Approved business outflows</span>
            </div>
          </div>
          <div className="flex flex-col md:pl-8 pt-6 md:pt-0">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Net Corporate Profit</span>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">${metrics.profit.toLocaleString()}</div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-sky-600">
              <Percent className="h-4 w-4" />
              <span>Realized margins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Recent Operations */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Operational Activity</h3>
            {recentActivities.length === 0 ? (
              <p className="text-slate-450 text-sm">Zero operating logs. Create records in the CRM, HR, or project tabs.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {recentActivities.map((act: any) => (
                  <div key={act.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all">
                    <div className="h-2 w-2 rounded-full bg-sky-500 mt-2 shrink-0" />
                    <div className="flex-1">
                      <p className="text-slate-700 text-sm font-medium">{act.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1">{new Date(act.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Security Audit Trail</h3>
            {recentAuditLogs.length === 0 ? (
              <p className="text-slate-450 text-sm">Security ledger cleared.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentAuditLogs.map((log: any) => (
                  <div key={log.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">{log.action} - {log.resource}</span>
                      <span className="text-[10px] text-slate-500">{log.details}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-sky-600 font-bold">{log.user?.name || "System"}</span>
                      <span className="text-[9px] text-slate-400 block">{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Pending Approvals</h3>

            {/* Leave Approvals */}
            <div className="mb-6">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Leave Requests</span>
              {approvalQueue.leaves.length === 0 ? (
                <p className="text-slate-400 text-xs font-medium">No pending timeoff requests.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {approvalQueue.leaves.map((leave: any) => (
                    <div key={leave.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="block text-xs font-bold text-slate-900">{leave.employee.firstName} {leave.employee.lastName}</span>
                          <span className="text-[10px] text-slate-500">{leave.type} LEAVE</span>
                        </div>
                        <span className="text-[10px] text-sky-600 font-semibold">{new Date(leave.startDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic mb-3">"{leave.reason}"</p>
                      <div className="flex gap-2">
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveLeave(leave.id, "APPROVED")}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveLeave(leave.id, "REJECTED")}
                          className="flex-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-650 text-red-650 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-red-200 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense Approvals */}
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Operating Expenses</span>
              {approvalQueue.expenses.length === 0 ? (
                <p className="text-slate-400 text-xs font-medium">No pending business outlays.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {approvalQueue.expenses.map((exp: any) => (
                    <div key={exp.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="block text-xs font-bold text-slate-900">{exp.category}</span>
                          <span className="text-[10px] text-slate-500">{exp.description}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">${exp.amount}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveExpense(exp.id, "APPROVED")}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200 transition-all"
                        >
                          Approve
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() => handleApproveExpense(exp.id, "REJECTED")}
                          className="flex-1 py-1.5 rounded-lg bg-red-50 hover:bg-red-650 text-red-650 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-red-200 transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
