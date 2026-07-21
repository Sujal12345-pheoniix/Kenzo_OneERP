"use client";

import React, { useEffect, useState } from "react";
import {
  Bell, Plus, Trash2, X, Loader2, AlertTriangle, Info,
  Megaphone, ShieldAlert, CheckCircle2, Users, User, Briefcase, SendHorizonal
} from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; color: string; icon: React.ElementType }> = {
  HIGH:   { label: "High Priority", bg: "rgba(239,68,68,0.12)", color: "#f87171", icon: AlertTriangle },
  NORMAL: { label: "Normal",        bg: "rgba(99,102,241,0.12)", color: "#818cf8", icon: Info },
  LOW:    { label: "Low Priority",  bg: "rgba(100,116,139,0.12)", color: "#94a3b8", icon: Info },
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
    }
    setNotices(notJson.notices || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setSendErr("");
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

  const filtered = filter === "ALL" ? notices : notices.filter((n) => n.priority === filter);
  const highCount = notices.filter((n) => n.priority === "HIGH").length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-400">Loading Notice Board...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div>
          <div className="section-eyebrow"><Bell className="h-4 w-4" /> Broadcast Communication</div>
          <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Notice Board</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Company announcements, alerts, and broadcast messages.</p>
        </div>
        <div className="flex items-center gap-3">
          {highCount > 0 && (
            <div className="alert-danger py-1.5 px-3 rounded-full text-xs font-bold">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {highCount} High Priority
            </div>
          )}
          {CAN_COMPOSE.includes(userRole) && (
            <button onClick={() => setShowCompose(true)} className="btn-primary">
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
            className={`chart-pill ${filter === f ? "chart-pill-active" : ""}`}
          >
            {f === "ALL" ? `All (${notices.length})` : f}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {filtered.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-20 text-center">
          <Megaphone className="h-12 w-12 mb-3" style={{ color: "var(--text-muted)" }} />
          <p className="font-bold text-sm mb-1" style={{ color: "var(--text-muted)" }}>No notices found.</p>
          {CAN_COMPOSE.includes(userRole) && (
            <button onClick={() => setShowCompose(true)} className="btn-primary mt-3">
              Create First Notice
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((n, i) => {
            const pc = PRIORITY_CONFIG[n.priority] || PRIORITY_CONFIG.NORMAL;
            const PIcon = pc.icon;
            return (
              <div
                key={n.id}
                className="glass-panel p-5 flex gap-4 group animate-fade-in-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Priority icon container */}
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: pc.bg }}
                >
                  <PIcon className="h-5 w-5" style={{ color: pc.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>{n.title}</h3>
                    <span className="badge" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                    <span className="badge" style={{ background: "var(--bg-input)", color: "var(--text-muted)", border: "1px solid var(--border-card)" }}>
                      <Users className="h-3 w-3" /> {TARGET_LABELS[n.target] || n.target}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{n.content}</p>
                  
                  <div className="flex items-center gap-3 mt-3 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {n.senderName}
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
                    className="h-8 w-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                    style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Compose Modal */}
      {showCompose && (
        <div className="modal-overlay flex items-center justify-center p-4">
          <div className="modal-content p-6 w-full max-w-lg">
            <div className="flex justify-between items-start mb-5 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <h2 className="text-lg font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <SendHorizonal className="h-5 w-5" style={{ color: "var(--accent-primary)" }} /> Compose Notice
                </h2>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Broadcast announcement to staff</p>
              </div>
              <button onClick={() => setShowCompose(false)} className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                <X className="h-4 w-4" />
              </button>
            </div>

            {sendErr && <div className="alert-danger mb-4"><ShieldAlert className="h-4 w-4 shrink-0" />{sendErr}</div>}
            {sendOk  && <div className="alert-success mb-4"><CheckCircle2 className="h-4 w-4 shrink-0" />Notice published successfully!</div>}

            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="form-label">Title</label>
                <input type="text" required placeholder="e.g. System Maintenance Notice" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" />
              </div>

              <div>
                <label className="form-label">Message Content</label>
                <textarea required rows={4} placeholder="Write notice content..." value={content} onChange={(e) => setContent(e.target.value)} className="form-input" style={{ resize: "none" }} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Target Audience</label>
                  <select value={target} onChange={(e) => setTarget(e.target.value)} className="form-select font-semibold">
                    <option value="ALL">Everyone</option>
                    <option value="CEO">CEO Only</option>
                    <option value="HR">HR Team</option>
                    <option value="DEVELOPER">Developers</option>
                    <option value="PROJECT_MANAGER">Project Managers</option>
                    <option value="COMPANY_ADMIN">Admins Only</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-select font-semibold">
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority 🔴</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowCompose(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1">
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
