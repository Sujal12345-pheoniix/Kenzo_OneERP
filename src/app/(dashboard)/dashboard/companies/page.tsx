"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2, Building2, Globe, Users, FolderKanban, DollarSign,
  MapPin, Calendar, Mail, Phone, CheckCircle2, ArrowUpRight, TrendingUp
} from "lucide-react";

export default function CompaniesPage() {
  const [session, setSession]   = useState<any>(null);
  const [metrics, setMetrics]   = useState<any>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/session").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ]).then(([sess, dash]) => {
      if (sess.authenticated) setSession(sess.user);
      setMetrics(dash.metrics);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const tenant = session?.tenant || {};

  const companyStats = [
    { label: "Total Employees", value: metrics?.employees || 0, icon: Users, color: "bg-violet-50 text-violet-600" },
    { label: "Active Projects", value: metrics?.activeProjects || 0, icon: FolderKanban, color: "bg-sky-50 text-sky-600" },
    { label: "Annual Revenue", value: `$${(metrics?.revenue || 0).toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Deal Pipeline", value: `$${(metrics?.pipeline || 0).toLocaleString()}`, icon: TrendingUp, color: "bg-amber-50 text-amber-600" },
  ];

  const highlights = [
    { label: "MRR", value: `$${((metrics?.mrr) || 0).toLocaleString()}`, up: true },
    { label: "ARR", value: `$${((metrics?.arr) || 0).toLocaleString()}`, up: true },
    { label: "Net Profit", value: `$${((metrics?.profit) || 0).toLocaleString()}`, up: (metrics?.profit || 0) > 0 },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-widest mb-1">
          <Building2 className="h-4 w-4" /> Organization
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Company Overview</h1>
        <p className="text-slate-500 text-sm mt-0.5">Corporate profile, operational metrics, and business intelligence summary.</p>
      </div>

      {/* Company Profile Card */}
      <div className="glass-panel p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-sky-500/4 blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          {/* Logo & name */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-100 border border-sky-100 flex items-center justify-center shadow-sm">
              <img src="/logo.png" alt="Kenzo" className="h-12 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> VERIFIED ENTITY
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{tenant.name || "Kenzo Infosystems Pvt Ltd"}</h2>
            <p className="text-slate-500 text-sm mt-1">
              An integrated software solutions company specializing in enterprise ERP systems, cloud infrastructure, and digital transformation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Globe className="h-4 w-4 text-sky-500 shrink-0" />
                <a href="https://kenzoinfosystems.com/" target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 hover:underline truncate">
                  kenzoinfosystems.com
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Mail className="h-4 w-4 text-sky-500 shrink-0" />
                <span>contact@kenzo.com</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
                <span>New Delhi, India</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Calendar className="h-4 w-4 text-sky-500 shrink-0" />
                <span>Est. 2026</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Phone className="h-4 w-4 text-sky-500 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
                <Building2 className="h-4 w-4 text-sky-500 shrink-0" />
                <span>Private Limited</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {companyStats.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="glass-panel p-5 glass-card-glow">
              <div className="flex justify-between items-start mb-3">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{c.label}</span>
                <div className={`p-2 rounded-lg ${c.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* Financial highlights */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">Financial Performance Highlights</h3>
        <div className="grid grid-cols-3 gap-6 divide-x divide-slate-100">
          {highlights.map((h, i) => (
            <div key={i} className="flex flex-col items-center text-center px-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{h.label}</span>
              <span className="text-2xl font-extrabold text-slate-900">{h.value}</span>
              <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${h.up ? "text-emerald-600" : "text-red-500"}`}>
                <ArrowUpRight className="h-3 w-3" /> This period
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About section */}
      <div className="glass-panel p-6">
        <h3 className="text-base font-bold text-slate-900 mb-4">About the Company</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100">
            <div className="text-2xl mb-2">🚀</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Mission</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Empowering businesses with cutting-edge ERP solutions that simplify operations and drive sustainable growth.</p>
          </div>
          <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100">
            <div className="text-2xl mb-2">🔭</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Vision</h4>
            <p className="text-xs text-slate-500 leading-relaxed">To become the most trusted enterprise technology partner for growing businesses across Asia Pacific by 2028.</p>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <div className="text-2xl mb-2">💎</div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Core Values</h4>
            <p className="text-xs text-slate-500 leading-relaxed">Innovation, transparency, client-centricity, and continuous improvement in everything we deliver.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
