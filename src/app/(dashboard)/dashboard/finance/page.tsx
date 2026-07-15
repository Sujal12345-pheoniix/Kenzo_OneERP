"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

export default function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OPERATIONAL");
  const [formLoading, setFormLoading] = useState(false);

  const fetchFinanceData = async () => {
    try {
      const res = await fetch("/api/finance");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount: Number(amount), category }),
      });
      if (res.ok) {
        setDescription("");
        setAmount("");
        await fetchFinanceData();
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

  const { invoices, expenses } = data;
  const totalRevenue = invoices
    .filter((inv: any) => inv.status === "PAID")
    .reduce((sum: number, inv: any) => sum + inv.amount, 0);

  const pendingRevenue = invoices
    .filter((inv: any) => inv.status === "SENT")
    .reduce((sum: number, inv: any) => sum + inv.amount, 0);

  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Finance Control</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time ledger audit tools, customer billing invoices, and operational expense tracking.</p>
      </div>

      {/* Stats summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Total Invoiced Revenue</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">${totalRevenue.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Cleared sales receipts</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Outstanding Invoices</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">${pendingRevenue.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Awaiting customer payment</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Operational Expenses</span>
          <div className="text-2xl font-extrabold text-rose-600 mb-1">${totalExpenses.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Recorded company spending</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Net Cash Position</span>
          <div className={`text-2xl font-extrabold mb-1 ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            ${netIncome.toLocaleString()}
          </div>
          <span className="text-slate-500 text-xs font-medium">Cleared cash profit margins</span>
        </div>
      </div>

      {/* Grid records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lists columns */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Billing invoices */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Billing Invoice Registry</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Invoice ID</th>
                    <th className="pb-3">Client Reference</th>
                    <th className="pb-3">Issue Date</th>
                    <th className="pb-3 text-right">Invoice Value</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="py-3.5 font-mono text-xs text-sky-600">#{inv.id.slice(0, 8).toUpperCase()}</td>
                      <td className="py-3.5 font-semibold text-slate-900">{inv.clientName}</td>
                      <td className="py-3.5 text-slate-500">{new Date(inv.issueDate).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right font-semibold text-slate-900">${inv.amount.toLocaleString()}</td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Expense ledger */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Company Spending Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Expense Description</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Log Date</th>
                    <th className="pb-3 text-right">Debit Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="py-3.5 font-semibold text-slate-900">{exp.description}</td>
                      <td className="py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{new Date(exp.createdAt).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right font-semibold text-rose-600">${exp.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Expenses logger form */}
        <div>
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Record Debit Expense</h3>
            <form onSubmit={handleCreateExpense} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. AWS Production Infrastructure"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Debit Amount ($)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expense Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-sm transition-all"
                >
                  <option value="OPERATIONAL">Operational</option>
                  <option value="PAYROLL">Payroll</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="SOFTWARE_SaaS">Software & Cloud Services</option>
                  <option value="FACILITIES">Facilities & Offices</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Save Expense Record</>}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
