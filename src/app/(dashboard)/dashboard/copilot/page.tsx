"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, Loader2, Play, Zap } from "lucide-react";

export default function CopilotHub() {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "AI",
      text: "Hello! I am your Kenzo Enterprise Copilot. I have secure real-time read context across your operational tenant: Projects, CRM Leads, HRMS Roster, and Finance records. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "USER", text: userMessage }]);
    setLoading(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "AI", text: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "AI", text: "Error connecting to AI Orchestration core." }]);
    } finally {
      setLoading(false);
    }
  };

  const presetQueries = [
    "Draft a project roadmap task list for the team",
    "Show current financial margins and billing values",
    "Find leads with values over ₹50,000 in CRM",
    "Summarise active project delivery status",
  ];

  return (
    <div
      className="flex flex-col gap-4 sm:gap-6 w-full max-w-5xl mx-auto pb-4 animate-fade-in-up"
      style={{ color: "var(--text-primary)" }}
    >
      {/* Header */}
      <div className="pb-3" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div className="section-eyebrow"><Zap className="h-4 w-4" /> AI Intelligence</div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
          Kenzo Copilot
          <span className="badge" style={{ background: "rgba(99,102,241,0.12)", color: "var(--accent-primary)", fontSize: "0.6rem" }}>
            ENTERPRISE BETA
          </span>
        </h1>
        <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Cross-module context analysis, automated drafting, and real-time database queries.
        </p>
      </div>

      {/* Mobile Horizontal Quick Prompts Scroll */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Quick Prompts:</span>
        {presetQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInput(q)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-sky-500 transition-all cursor-pointer"
          >
            ⚡ {q}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-5 min-h-[480px]">

        {/* Desktop Sidebar Prompts */}
        <div className="hidden lg:flex flex-col gap-3 lg:col-span-1">
          <div className="glass-panel p-5 flex flex-col gap-3">
            <span className="form-label">Quick Prompts</span>
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setInput(q)}
                className="w-full text-left p-3 rounded-xl cursor-pointer transition-all flex gap-2 items-start animate-fade-in-up"
                style={{
                  background: "var(--bg-input)",
                  border: "1.5px solid var(--border-card)",
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  lineHeight: 1.5,
                  animationDelay: `${idx * 80}ms`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-primary)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-card)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
                }}
              >
                <Play className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-primary)" }} />
                <span>{q}</span>
              </button>
            ))}
          </div>

          {/* Tips */}
          <div className="glass-panel p-4">
            <p className="text-xs font-bold mb-2" style={{ color: "var(--accent-primary)" }}>💡 Try asking about</p>
            {["Finance reports", "Project status", "Employee payroll", "Lead pipeline", "Email drafts"].map((t) => (
              <p key={t} className="text-xs py-0.5" style={{ color: "var(--text-muted)" }}>• {t}</p>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="lg:col-span-3 glass-panel p-4 sm:p-5 flex flex-col min-h-[480px] sm:min-h-[520px] justify-between relative overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-1 max-h-[55vh] lg:max-h-[480px]">
            {messages.map((m, idx) => {
              const isAi = m.sender === "AI";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[92%] sm:max-w-[85%] animate-fade-in-up ${isAi ? "self-start" : "self-end flex-row-reverse"}`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Avatar */}
                  <div
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={
                      isAi
                        ? { background: "var(--gradient-brand)", boxShadow: "0 4px 12px var(--glow-primary)" }
                        : { background: "var(--bg-hover)", border: "1.5px solid var(--border-base)" }
                    }
                  >
                    {isAi
                      ? <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
                      : <Sparkles className="h-4 w-4 sm:h-4.5 sm:w-4.5" style={{ color: "var(--accent-primary)" }} />}
                  </div>

                  {/* Bubble */}
                  <div
                    className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed"
                    style={
                      isAi
                        ? {
                            background: "var(--bg-card-alt)",
                            border: "1.5px solid var(--border-card)",
                            color: "var(--text-primary)",
                            borderRadius: "4px 18px 18px 18px",
                          }
                        : {
                            background: "var(--gradient-brand)",
                            color: "#ffffff",
                            borderRadius: "18px 4px 18px 18px",
                          }
                    }
                  >
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{m.text}</pre>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 self-start items-center animate-fade-in">
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                  <Bot className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-white" />
                </div>
                <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl flex items-center gap-2" style={{ background: "var(--bg-card-alt)", border: "1.5px solid var(--border-card)" }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-xs sm:text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Compiling response...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Sticky Input Bar at Bottom */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 sm:gap-3 pt-3 mt-auto sticky bottom-0 z-20 border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1.5 rounded-2xl shadow-sm"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask Copilot — e.g. Draft a financial summary..."
              className="form-input flex-1 text-xs sm:text-sm"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-4 sm:px-5 py-2 text-xs sm:text-sm shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
