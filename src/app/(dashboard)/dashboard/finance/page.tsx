"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2, FileText, DollarSign, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";

export default function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Record Debit Expense form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OPERATIONAL");
  const [formLoading, setFormLoading] = useState(false);
  const [expenseSuccess, setExpenseSuccess] = useState("");
  const [expenseError, setExpenseError] = useState("");

  // Billing Invoice form state (Tab / Modal toggle)
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invClientName, setInvClientName] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invStatus, setInvStatus] = useState("SENT");
  const [invDueDate, setInvDueDate] = useState("");
  const [invLoading, setInvLoading] = useState(false);
  const [invSuccess, setInvSuccess] = useState("");
  const [invError, setInvError] = useState("");

  // Spending Ledger form state (Tab / Modal toggle)
  const [showSpendingForm, setShowSpendingForm] = useState(false);
  const [spendDesc, setSpendDesc] = useState("");
  const [spendAmount, setSpendAmount] = useState("");
  const [spendCat, setSpendCat] = useState("OPERATIONAL");
  const [spendLoading, setSpendLoading] = useState(false);
  const [spendSuccess, setSpendSuccess] = useState("");
  const [spendError, setSpendError] = useState("");

  const fetchFinanceData = async () => {
    try {
      const res = await fetch("/api/finance");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error("Finance fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Submit Debit Expense
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setExpenseSuccess("");
    setExpenseError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          description,
          amount: Number(amount),
          category,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to record expense");
      
      setDescription("");
      setAmount("");
      setExpenseSuccess("Expense record saved successfully!");
      await fetchFinanceData();
      setTimeout(() => setExpenseSuccess(""), 3500);
    } catch (err: any) {
      setExpenseError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  // Submit New Billing Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvLoading(true);
    setInvSuccess("");
    setInvError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INVOICE",
          customerName: invClientName,
          amount: Number(invAmount),
          status: invStatus,
          dueDate: invDueDate || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create invoice");

      setInvClientName("");
      setInvAmount("");
      setInvDueDate("");
      setInvSuccess("Billing invoice registered successfully!");
      await fetchFinanceData();
      setTimeout(() => {
        setInvSuccess("");
        setShowInvoiceForm(false);
      }, 2000);
    } catch (err: any) {
      setInvError(err.message || "An error occurred");
    } finally {
      setInvLoading(false);
    }
  };

  // Submit Spending Ledger entry
  const handleCreateSpending = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpendLoading(true);
    setSpendSuccess("");
    setSpendError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "EXPENSE",
          description: spendDesc,
          amount: Number(spendAmount),
          category: spendCat,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to log spending");

      setSpendDesc("");
      setSpendAmount("");
      setSpendSuccess("Spending logged in ledger!");
      await fetchFinanceData();
      setTimeout(() => {
        setSpendSuccess("");
        setShowSpendingForm(false);
      }, 2000);
    } catch (err: any) {
      setSpendError(err.message || "An error occurred");
    } finally {
      setSpendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 text-sky-600 animate-spin" />
      </div>
    );
  }

  const invoices = data?.invoices || [];
  const expenses = data?.expenses || [];

  const totalRevenue = invoices
    .filter((inv: any) => inv.status === "PAID")
    .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

  const pendingRevenue = invoices
    .filter((inv: any) => inv.status === "SENT" || inv.status === "DRAFT" || inv.status === "OVERDUE")
    .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);

  const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Finance Control</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time ledger audit tools, customer billing invoices, and operational expense tracking.</p>
      </div>

      {/* Stats summaries */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Total Invoiced Revenue</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">Rs. {totalRevenue.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Cleared sales receipts</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Outstanding Invoices</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">Rs. {pendingRevenue.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Awaiting customer payment</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Operational Expenses</span>
          <div className="text-2xl font-extrabold text-rose-600 mb-1">Rs. {totalExpenses.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Recorded company spending</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Net Cash Position</span>
          <div className={`text-2xl font-extrabold mb-1 ${netIncome >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            Rs. {netIncome.toLocaleString()}
          </div>
          <span className="text-slate-500 text-xs font-medium">Cleared cash profit margins</span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Invoices & Ledger) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* 1. Billing Invoice Registry */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Billing Invoice Registry</h3>
                <p className="text-xs text-slate-400">Track and issue customer billing invoices</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {showInvoiceForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showInvoiceForm ? "Close Form" : "+ Add Invoice"}
              </button>
            </div>

            {/* Expandable Form for Billing Invoice Registry */}
            {showInvoiceForm && (
              <div className="mb-6 p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
                <h4 className="text-xs font-extrabold uppercase text-sky-800 tracking-wider mb-3">Register New Invoice</h4>
                {invSuccess && <div className="mb-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">{invSuccess}</div>}
                {invError && <div className="mb-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{invError}</div>}
                <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Client Reference / Customer</label>
                    <input
                      type="text" required value={invClientName} onChange={(e) => setInvClientName(e.target.value)}
                      placeholder="e.g. Acme Corp Solutions"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Invoice Value (Rs.)</label>
                    <input
                      type="number" required value={invAmount} onChange={(e) => setInvAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Status</label>
                    <select
                      value={invStatus} onChange={(e) => setInvStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="SENT">SENT (Outstanding)</option>
                      <option value="PAID">PAID (Cleared)</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="OVERDUE">OVERDUE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Due Date</label>
                    <input
                      type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-1">
                    <button
                      type="submit" disabled={invLoading}
                      className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      {invLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Invoice Record"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invoices Table */}
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
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 text-xs italic">
                        No billing invoices recorded yet. Click "+ Add Invoice" to register one.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-mono text-xs text-sky-600">
                          {inv.invoiceNo || `#${inv.id.slice(0, 8).toUpperCase()}`}
                        </td>
                        <td className="py-3.5 font-semibold text-slate-900">{inv.customerName || inv.clientName || "—"}</td>
                        <td className="py-3.5 text-slate-500">{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right font-semibold text-slate-900">Rs. {inv.amount?.toLocaleString()}</td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : inv.status === "OVERDUE"
                              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* End of Section Form Tab Trigger */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInvoiceForm(true)}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" /> Open Billing Invoice Form Tab
              </button>
            </div>
          </div>

          {/* 2. Company Spending Ledger */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Company Spending Ledger</h3>
                <p className="text-xs text-slate-400">Detailed record of corporate debits and operational expenses</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSpendingForm(!showSpendingForm)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                {showSpendingForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showSpendingForm ? "Close Form" : "+ Log Spending"}
              </button>
            </div>

            {/* Expandable Form for Spending Ledger */}
            {showSpendingForm && (
              <div className="mb-6 p-4 rounded-2xl bg-slate-100/80 border border-slate-300">
                <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-3">Add Entry to Company Spending Ledger</h4>
                {spendSuccess && <div className="mb-3 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl">{spendSuccess}</div>}
                {spendError && <div className="mb-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{spendError}</div>}
                <form onSubmit={handleCreateSpending} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Expense Description</label>
                    <input
                      type="text" required value={spendDesc} onChange={(e) => setSpendDesc(e.target.value)}
                      placeholder="e.g. Cloud Server Subscriptions"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Debit Value (Rs.)</label>
                    <input
                      type="number" required value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)}
                      placeholder="e.g. 12500"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                    <select
                      value={spendCat} onChange={(e) => setSpendCat(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-sky-500"
                    >
                      <option value="OPERATIONAL">Operational</option>
                      <option value="PAYROLL">Payroll</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="SOFTWARE_SaaS">Software & Cloud Services</option>
                      <option value="FACILITIES">Facilities & Offices</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-1">
                    <button
                      type="submit" disabled={spendLoading}
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      {spendLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Ledger Record"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Ledger Table */}
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
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-xs italic">
                        No spending records found. Use "+ Log Spending" or the Record Debit Expense form to add entries.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="py-3.5 font-semibold text-slate-900">{exp.description}</td>
                        <td className="py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-slate-500">{new Date(exp.createdAt || exp.date).toLocaleDateString()}</td>
                        <td className="py-3.5 text-right font-semibold text-rose-600">Rs. {exp.amount?.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* End of Section Form Tab Trigger */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSpendingForm(true)}
                className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" /> Open Spending Ledger Form Tab
              </button>
            </div>
          </div>

        </div>

        {/* 3. Record Debit Expense Form Sidebar */}
        <div>
          <div className="glass-panel p-6 sticky top-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Record Debit Expense</h3>
            
            {expenseSuccess && (
              <div className="mb-4 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                {expenseSuccess}
              </div>
            )}
            
            {expenseError && (
              <div className="mb-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                {expenseError}
              </div>
            )}

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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Debit Amount (Rs.)</label>
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
