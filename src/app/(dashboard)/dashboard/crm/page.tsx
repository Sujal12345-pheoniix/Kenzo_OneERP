"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

export default function CRMDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("NEW");
  const [notes, setNotes] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchCRMData = async () => {
    try {
      const res = await fetch("/api/crm");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, company, email, value, status, notes }),
      });
      if (res.ok) {
        setName("");
        setCompany("");
        setEmail("");
        setValue("");
        setNotes("");
        await fetchCRMData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const { leads } = data;
  const pipelineTotal = leads
    .filter((l: any) => ["NEW", "CONTACTED", "QUALIFIED"].includes(l.status))
    .reduce((sum: number, l: any) => sum + l.value, 0);

  const wonTotal = leads
    .filter((l: any) => l.status === "WON")
    .reduce((sum: number, l: any) => sum + l.value, 0);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">CRM & Customers</h1>
        <p className="text-slate-500 text-sm mt-1">Lead acquisition pipelines, conversion funnels, and enterprise customer rosters.</p>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">CRM Pipeline Value</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">Rs. {pipelineTotal.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Unconverted target values</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Contracts Won Value</span>
          <div className="text-2xl font-extrabold text-emerald-600 mb-1">Rs. {wonTotal.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Fully closed sales accounts</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Total Contacts Recorded</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">{leads.length}</div>
          <span className="text-slate-500 text-xs font-medium">Leads, contacts, and opportunities</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads Lists */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Leads Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Name / Company</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leads.map((lead: any) => (
                    <tr key={lead.id} className="hover:bg-slate-50">
                      <td className="py-3.5">
                        <span className="block font-semibold text-slate-900">{lead.name}</span>
                        <span className="text-xs text-slate-500">{lead.company}</span>
                      </td>
                      <td className="py-3.5 text-slate-500">{lead.email}</td>
                      <td className="py-3.5 text-right font-semibold text-slate-900">Rs. {lead.value.toLocaleString()}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          lead.status === "WON"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : lead.status === "LOST"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-sky-500/10 text-sky-600 border-sky-500/20"
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Lead Creation Form */}
        <div>
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Register New Lead</h3>
            <form onSubmit={handleCreateLead} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Contact Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Company</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@acme.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Estimated Value (Rs.)</label>
                <input
                  type="number"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 75000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-sm transition-all"
                >
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="WON">Closed Won</option>
                  <option value="LOST">Closed Lost</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detailed requirements..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all min-h-[80px]"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Save Lead Record</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
