"use client";

import React, { useState } from "react";
import { Send, Bot, Sparkles, Loader2, Play } from "lucide-react";

export default function CopilotHub() {
  const [messages, setMessages] = useState<any[]>([
    {
      sender: "AI",
      text: "Hello! I am your Kenzo Enterprise Copilot. I have secure real-time read context across your operational tenant: Projects, CRM Leads, HRMS Roster, and Finance records. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: "AI", text: "Error connecting to AI Orchestration core." }]);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetPrompt = (promptText: string) => {
    setInput(promptText);
  };

  const presetQueries = [
    "Draft a project roadmap task list for Jitendar Saini",
    "List all employee emails and roles in the company",
    "Show current financial margins and outstanding billing values",
    "Find leads with values over $50,000 in CRM pipelines",
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto h-[calc(100vh-80px)] text-slate-800">
      
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          AI Copilot Hub <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200 uppercase font-extrabold tracking-widest">Enterprise Beta</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">Cross-module operational context analysis, automated drafting, and relational database queries.</p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Presets and Guidelines */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="glass-panel p-5 flex flex-col gap-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Interactive Prompts</span>
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetPrompt(q)}
                className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-300 text-slate-600 hover:text-slate-800 text-xs font-semibold leading-relaxed transition-all cursor-pointer flex gap-2 items-start"
              >
                <Play className="h-3 w-3 text-sky-600 mt-0.5 shrink-0" />
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="lg:col-span-3 flex flex-col glass-panel p-5 h-full min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-4">
            {messages.map((m, idx) => {
              const isAi = m.sender === "AI";
              return (
                <div key={idx} className={`flex gap-3 max-w-[85%] ${isAi ? "self-start" : "self-end flex-row-reverse"}`}>
                  <div className={`h-8.5 w-8.5 rounded-xl border flex items-center justify-center shrink-0 ${
                    isAi ? "bg-sky-50 border-sky-200 text-sky-600" : "bg-slate-100 border-slate-200 text-slate-700"
                  }`}>
                    {isAi ? <Bot className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
                  </div>
                  <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                    isAi ? "bg-slate-50 border border-slate-100 text-slate-800" : "bg-sky-600 text-white"
                  }`}>
                    {m.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3 self-start items-center text-slate-400 text-xs font-bold pl-1 animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-sky-600" />
                <span>AI is compiling context responses...</span>
              </div>
            )}
          </div>

          {/* Form input */}
          <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-slate-100 mt-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              placeholder="Ask Copilot e.g. Draft a roadmap for Sujal Kumar..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white font-bold text-xs transition-all flex items-center justify-center cursor-pointer shadow-md shadow-sky-600/10"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
