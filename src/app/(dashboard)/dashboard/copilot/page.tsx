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
      className="flex flex-col gap-6 w-full max-w-4xl mx-auto animate-fade-in-up"
      style={{ color: "var(--text-primary)", height: "calc(100vh - 90px)" }}
    >
      {/* Header */}
      <div className="pb-4" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div className="section-eyebrow"><Zap className="h-4 w-4" /> AI Intelligence</div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3" style={{ color: "var(--text-primary)" }}>
          Kenzo Copilot
          <span className="badge" style={{ background: "rgba(99,102,241,0.12)", color: "var(--accent-primary)", fontSize: "0.6rem" }}>
            ENTERPRISE BETA
          </span>
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Cross-module context analysis, automated drafting, and real-time database queries.
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-5">

        {/* Preset prompts */}
        <div className="lg:col-span-1 flex flex-col gap-3">
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
        <div className="lg:col-span-3 glass-panel p-5 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-1">
            {messages.map((m, idx) => {
              const isAi = m.sender === "AI";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 max-w-[88%] animate-fade-in-up ${isAi ? "self-start" : "self-end flex-row-reverse"}`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Avatar */}
                  <div
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={
                      isAi
                        ? { background: "var(--gradient-brand)", boxShadow: "0 4px 12px var(--glow-primary)" }
                        : { background: "var(--bg-hover)", border: "1.5px solid var(--border-base)" }
                    }
                  >
                    {isAi
                      ? <Bot className="h-4.5 w-4.5 text-white" />
                      : <Sparkles className="h-4.5 w-4.5" style={{ color: "var(--accent-primary)" }} />}
                  </div>

                  {/* Bubble */}
                  <div
                    className="px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed"
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
                    <pre className="whitespace-pre-wrap font-sans" style={{ fontSize: "0.875rem" }}>{m.text}</pre>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 self-start items-center animate-fade-in">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                  <Bot className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl flex items-center gap-2" style={{ background: "var(--bg-card-alt)", border: "1.5px solid var(--border-card)" }}>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--accent-primary)" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>Compiling response...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="flex gap-3 pt-4 mt-auto"
            style={{ borderTop: "1.5px solid var(--border-card)" }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask Copilot — e.g. Draft a financial summary report..."
              className="form-input flex-1"
              style={{ fontSize: "0.875rem" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-5"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
