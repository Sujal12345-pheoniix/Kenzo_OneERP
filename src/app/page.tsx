"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, Sparkles, Zap, BarChart3, Users, DollarSign } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) router.push("/dashboard");
      })
      .catch(() => {});
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const features = [
    { icon: BarChart3, label: "Analytics & KPIs", color: "#6366f1" },
    { icon: Users, label: "HR & People Ops", color: "#10b981" },
    { icon: DollarSign, label: "Finance & CRM", color: "#f59e0b" },
    { icon: Zap, label: "AI Copilot", color: "#0ea5e9" },
  ];

  return (
    <div
      className="flex flex-col flex-1 min-h-screen items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      {/* Ambient blobs */}
      <div
        className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "var(--accent-primary)", opacity: 0.07 }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "var(--accent-secondary)", opacity: 0.07 }}
      />
      <div
        className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full blur-[100px] pointer-events-none"
        style={{ background: "var(--accent-violet)", opacity: 0.04 }}
      />

      {/* Main panel */}
      <div
        className="w-full max-w-md z-10 relative rounded-3xl p-8 animate-scale-in"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-base)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        {/* Brand header */}
        <div
          className="flex flex-col items-center mb-8 pb-6"
          style={{ borderBottom: "1px solid var(--border-base)" }}
        >
          <div className="flex items-center gap-3 mb-3 cursor-pointer">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/30 border border-sky-300/30">
              <span className="text-2xl select-none">💎</span>
            </div>
            <span className="text-4xl font-black tracking-widest uppercase bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
              KORE
            </span>
          </div>
          <p className="text-base font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            The ERP System - Manage Everything
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
            Enterprise Resource Planning &amp; AI Intelligence Portal
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div
            className="mb-5 p-4 rounded-xl flex gap-3 text-xs animate-fade-in"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--accent-danger)",
            }}
          >
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-[10px] font-black uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Workspace Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter workspace email"
              className="form-input"
            />
          </div>
          <div>
            <label
              className="block text-[10px] font-black uppercase tracking-widest mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Password / PIN
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 mt-1 justify-center text-sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Enter Portal Workspace
              </>
            )}
          </button>
        </form>

        {/* Feature pills */}
        <div className="mt-6 flex items-center gap-2 flex-wrap justify-center">
          {features.map((f, i) => {
            const FIcon = f.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{
                  background: `${f.color}15`,
                  color: f.color,
                  border: `1px solid ${f.color}25`,
                }}
              >
                <FIcon className="h-3 w-3" />
                {f.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer
        className="w-full max-w-md text-center text-[10px] mt-6 z-10"
        style={{ color: "var(--text-muted)" }}
      >
        © 2026 Kenzo Infosystems Pvt. Ltd. All rights reserved.
      </footer>
    </div>
  );
}
