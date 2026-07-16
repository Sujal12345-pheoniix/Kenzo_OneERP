"use client";

import React, { useEffect, useState } from "react";
import {
  Bell, Plus, Trash2, X, Loader2, AlertTriangle, Info,
  Megaphone, ShieldAlert, ChevronDown, CheckCircle2, Users, User, Briefcase, SendHorizonal
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; cls: string; icon: React.ElementType; dot: string }> = {
  HIGH:   { label: "High Priority",  cls: "bg-red-50 text-red-700 border-red-200",    icon: AlertTriangle, dot: "bg-red-500" },
  NORMAL: { label: "Normal",         cls: "bg-sky-50 text-sky-700 border-sky-200",     icon: Info,          dot: "bg-sky-500" },
  LOW:    { label: "Low Priority",   cls: "bg-slate-50 text-slate-600 border-slate-200", icon: Info,       dot: "bg-slate-400" },
};

const TARGET_LABELS: Record<string, string> = {
  ALL: "Everyone",
  COMPANY_ADMIN: "Admins Only",
  CEO: "CEO",
  HR: "HR Team",
  DEVELOPER: "Developers",
  PROJECT_MANAGER: "Project Managers",
  EMPLOYEE: "Employees",
};

const CAN_COMPOSE = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR"];
const CAN_DELETE  = ["COMPANY_ADMIN", "SUPER_ADMIN"];

export default function NoticesPage() {
  const [notices, setNotices]       = useState<any[]>([]);
  const [userRole, setUserRole]     = useState("");
  const [userId, setUserId]         = useState("");
  const [loading, setLoading]       = useState(true);
  const [showCompose, setShowCompose] = useState(false);

  // Compose form
  const [title, setTitle]       = useState("");
  const [content, setContent]   = useState("");
  const [target, setTarget]     = useState("ALL");
  const [priority, setPriority] = useState("NORMAL");
  const [sending, setSending]   = useState(false);
  const [sendErr, setSendErr]   = useState("");
  const [sendOk, setSendOk]     = useState(false);

  const [filter, setFilter] = useState<"ALL" | "HIGH" | "NORMAL" | "LOW">("ALL");

  const fetchAll = async () => {
    const [sessRes, notRes] = await Promise.all([
      fetch("/api/auth/session"),
      fetch("/api/notices"),
    ]);
    const sessJson = await sessRes.json();
    const notJson  = await notRes.json();

    if (sessJson.authenticated) {
      setUserRole(sessJson.user.role);
      setUserId(sessJson.user.id);
    }
    setNotices(notJson.notices || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendErr("");
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, target, priority }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      setSendOk(true);
      setTitle(""); setContent(""); setTarget("ALL"); setPriority("NORMAL");
      fetchAll();
      setTimeout(() => { setSendOk(false); setShowCompose(false); }, 1500);
    } catch (err: any) {
      setSendErr(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this notice permanently?")) return;
    await fetch(`/api/notices?id=${id}`, { method: "DELETE" });
    fetchAll();
  };

  const filtered = filter === "ALL" ? notices : notices.filter(n => n.priority === filter);
  const highCount = notices.filter(n => n.priority === "HIGH").length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-widest mb-1">
            <Bell className="h-4 w-4" /> Communication
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notice Board</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Company announcements, alerts, and broadcast messages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {highCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-100 rounded-full text-red-600 text-xs font-bold">
              <AlertTriangle className="h-3.5 w-3.5" />
              {highCount} High Priority
            </div>
          )}
          {CAN_COMPOSE.includes(userRole) && (
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/10 cursor-pointer hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" /> Compose Notice
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["ALL", "HIGH", "NORMAL", "LOW"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === f
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f === "ALL" ? `All (${notices.length})` : f}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 glass-panel">
          <Megaphone className="h-14 w-14 text-slate-200 mb-4" />
          <p className="text-slate-400 font-semibold text-sm">No notices yet.</p>
          {CAN_COMPOSE.includes(userRole) && (
            <button
              onClick={() => setShowCompose(true)}
              className="mt-4 px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Create First Notice
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((n) => {
            const pc = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.NORMAL;
            const PIcon = pc.icon;
            return (
              <div
                key={n.id}
                className="glass-panel p-5 flex gap-4 group hover:shadow-md transition-all"
              >
                {/* Priority indicator */}
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.priority === "HIGH" ? "bg-red-50" : n.priority === "LOW" ? "bg-slate-50" : "bg-sky-50"
                }`}>
                  <PIcon className={`h-5 w-5 ${
                    n.priority === "HIGH" ? "text-red-500" : n.priority === "LOW" ? "text-slate-400" : "text-sky-500"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">{n.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${pc.cls}`}>
                      {pc.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
                      {n.target === "ALL" ? <Users className="h-2.5 w-2.5" /> : <User className="h-2.5 w-2.5" />}
                      {TARGET_LABELS[n.target] || n.target}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" /> {n.senderName}
                    </span>
                    <span>·</span>
                    <span>{n.senderRole}</span>
                    <span>·</span>
                    <span>{new Date(n.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>

                {CAN_DELETE.includes(userRole) && (
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="h-8 w-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg p-6 animate-fadeIn">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <SendHorizonal className="h-4.5 w-4.5 text-sky-600" /> Compose Notice
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Broadcast to all staff or a specific group</p>
              </div>
              <button onClick={() => setShowCompose(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {sendErr && (
              <div className="p-3 mb-4 bg-red-50 text-red-600 text-xs rounded-xl flex gap-2 items-start">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" /> {sendErr}
              </div>
            )}
            {sendOk && (
              <div className="p-3 mb-4 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex gap-2 items-center">
                <CheckCircle2 className="h-4 w-4" /> Notice published successfully!
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. System Maintenance on Friday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write your notice content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-sky-500 resize-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Target Audience</label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="ALL">Everyone</option>
                    <option value="CEO">CEO Only</option>
                    <option value="HR">HR Team</option>
                    <option value="DEVELOPER">Developers</option>
                    <option value="PROJECT_MANAGER">Project Managers</option>
                    <option value="COMPANY_ADMIN">Admins Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:border-sky-500"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority 🔴</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-sky-600/10 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                  {sending ? "Publishing..." : "Publish Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
