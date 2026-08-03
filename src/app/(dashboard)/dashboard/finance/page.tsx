"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2, FileText, DollarSign, CheckCircle2, AlertCircle, Plus, X, Landmark, Receipt } from "lucide-react";

export default function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Debit Expense form state
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("OPERATIONAL");
  const [formLoading, setFormLoading] = useState(false);
  const [expenseSuccess, setExpenseSuccess] = useState("");
  const [expenseError, setExpenseError] = useState("");

  // Invoice form
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invClientName, setInvClientName] = useState("");
  const [invAmount, setInvAmount] = useState("");
  const [invStatus, setInvStatus] = useState("SENT");
  const [invDueDate, setInvDueDate] = useState("");
  const [invLoading, setInvLoading] = useState(false);
  const [invSuccess, setInvSuccess] = useState("");
  const [invError, setInvError] = useState("");

  // Spending Ledger form
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

  useEffect(() => { fetchFinanceData(); }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true); setExpenseSuccess(""); setExpenseError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "EXPENSE", description, amount: Number(amount), category }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to record expense");
      setDescription(""); setAmount("");
      setExpenseSuccess("Expense record saved successfully!");
      await fetchFinanceData();
      setTimeout(() => setExpenseSuccess(""), 3500);
    } catch (err: any) {
      setExpenseError(err.message || "An error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvLoading(true); setInvSuccess(""); setInvError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "INVOICE", customerName: invClientName, amount: Number(invAmount), status: invStatus, dueDate: invDueDate || null }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to create invoice");
      setInvClientName(""); setInvAmount(""); setInvDueDate("");
      setInvSuccess("Billing invoice registered successfully!");
      await fetchFinanceData();
      setTimeout(() => { setInvSuccess(""); setShowInvoiceForm(false); }, 1500);
    } catch (err: any) {
      setInvError(err.message || "An error occurred");
    } finally {
      setInvLoading(false);
    }
  };

  const handleCreateSpending = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpendLoading(true); setSpendSuccess(""); setSpendError("");
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "EXPENSE", description: spendDesc, amount: Number(spendAmount), category: spendCat }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to log spending");
      setSpendDesc(""); setSpendAmount("");
      setSpendSuccess("Spending logged in ledger!");
      await fetchFinanceData();
      setTimeout(() => { setSpendSuccess(""); setShowSpendingForm(false); }, 1500);
    } catch (err: any) {
      setSpendError(err.message || "An error occurred");
    } finally {
      setSpendLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
        <span className="text-sm font-semibold text-slate-400">Loading Finance Control...</span>
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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-12 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>
      
      {/* Header */}
      <div className="pb-4" style={{ borderBottom: "1px solid var(--border-base)" }}>
        <div className="section-eyebrow"><Landmark className="h-4 w-4" /> Treasury &amp; Cashflow</div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Finance Control</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Real-time ledger audit tools, customer billing invoices, and operational expense tracking.</p>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="stat-card">
          <span className="form-label mb-1">Total Invoiced Revenue</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-success)" }}>₹{totalRevenue.toLocaleString()}</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Cleared receipts</span>
        </div>
        <div className="stat-card">
          <span className="form-label mb-1">Outstanding Invoices</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-warning)" }}>₹{pendingRevenue.toLocaleString()}</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Awaiting client payment</span>
        </div>
        <div className="stat-card">
          <span className="form-label mb-1">Operational Expenses</span>
          <div className="text-2xl font-black mb-1" style={{ color: "var(--accent-danger)" }}>₹{totalExpenses.toLocaleString()}</div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Recorded company spending</span>
        </div>
        <div className="stat-card">
          <span className="form-label mb-1">Net Cash Position</span>
          <div className="text-2xl font-black mb-1" style={{ color: netIncome >= 0 ? "var(--accent-success)" : "var(--accent-danger)" }}>
            ₹{netIncome.toLocaleString()}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Cleared profit margin</span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Invoices & Ledger */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Billing Invoice Registry */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Billing Invoice Registry</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Track and issue customer billing invoices</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="btn-primary py-2 px-3.5 text-xs"
              >
                {showInvoiceForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showInvoiceForm ? "Close Form" : "+ Add Invoice"}
              </button>
            </div>

            {/* Invoice Form */}
            {showInvoiceForm && (
              <div className="mb-6 p-5 rounded-2xl animate-fade-in-up" style={{ background: "var(--bg-card-alt)", border: "1.5px solid var(--border-base)" }}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: "var(--accent-primary)" }}>Register New Invoice</h4>
                {invSuccess && <div className="alert-success mb-3">{invSuccess}</div>}
                {invError   && <div className="alert-danger mb-3">{invError}</div>}
                <form onSubmit={handleCreateInvoice} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Client / Customer</label>
                    <input type="text" required value={invClientName} onChange={(e) => setInvClientName(e.target.value)}
                      placeholder="e.g. Acme Corp" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Value (₹)</label>
                    <input type="number" required value={invAmount} onChange={(e) => setInvAmount(e.target.value)}
                      placeholder="e.g. 50000" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select value={invStatus} onChange={(e) => setInvStatus(e.target.value)} className="form-select font-semibold">
                      <option value="SENT">SENT (Outstanding)</option>
                      <option value="PAID">PAID (Cleared)</option>
                      <option value="DRAFT">DRAFT</option>
                      <option value="OVERDUE">OVERDUE</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Due Date</label>
                    <input type="date" value={invDueDate} onChange={(e) => setInvDueDate(e.target.value)} className="form-input" />
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-1">
                    <button type="submit" disabled={invLoading} className="btn-primary">
                      {invLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Invoice Record"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Invoices Table */}
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Client Reference</th>
                    <th>Issue Date</th>
                    <th className="text-right">Value</th>
                    <th className="text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No invoices registered yet.</td>
                    </tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id}>
                        <td className="font-bold" style={{ color: "var(--accent-primary)" }}>{inv.invoiceNo || inv.id.slice(0,8)}</td>
                        <td className="font-semibold">{inv.customerName || "N/A"}</td>
                        <td style={{ color: "var(--text-muted)" }}>{new Date(inv.issueDate || inv.createdAt).toLocaleDateString()}</td>
                        <td className="text-right font-black" style={{ color: "var(--accent-success)" }}>₹{(inv.amount || 0).toLocaleString()}</td>
                        <td className="text-center">
                          <span className={`badge ${
                            inv.status === "PAID" ? "status-active" : inv.status === "OVERDUE" ? "status-danger" : "status-pending"
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
          </div>

          {/* 2. Company Spending Ledger */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: "1px solid var(--border-card)" }}>
              <div>
                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Company Spending Ledger</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Audit ledger for all outgoing operational expenditure</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSpendingForm(!showSpendingForm)}
                className="btn-secondary py-2 px-3.5 text-xs"
              >
                {showSpendingForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {showSpendingForm ? "Close Form" : "+ Log Spending"}
              </button>
            </div>

            {/* Spending Form */}
            {showSpendingForm && (
              <div className="mb-6 p-5 rounded-2xl animate-fade-in-up" style={{ background: "var(--bg-card-alt)", border: "1.5px solid var(--border-base)" }}>
                <h4 className="text-xs font-black uppercase tracking-wider mb-4" style={{ color: "var(--accent-primary)" }}>Log Spending</h4>
                {spendSuccess && <div className="alert-success mb-3">{spendSuccess}</div>}
                {spendError   && <div className="alert-danger mb-3">{spendError}</div>}
                <form onSubmit={handleCreateSpending} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Expense Description</label>
                    <input type="text" required value={spendDesc} onChange={(e) => setSpendDesc(e.target.value)}
                      placeholder="e.g. Cloud Server Subscriptions" className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Debit Value (₹)</label>
                    <input type="number" required value={spendAmount} onChange={(e) => setSpendAmount(e.target.value)}
                      placeholder="e.g. 12500" className="form-input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Category</label>
                    <select value={spendCat} onChange={(e) => setSpendCat(e.target.value)} className="form-select font-semibold">
                      <option value="OPERATIONAL">Operational</option>
                      <option value="PAYROLL">Payroll</option>
                      <option value="MARKETING">Marketing</option>
                      <option value="SOFTWARE_SaaS">Software &amp; Cloud</option>
                      <option value="FACILITIES">Facilities &amp; Office</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end mt-1">
                    <button type="submit" disabled={spendLoading} className="btn-primary">
                      {spendLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Ledger Record"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Expenses Table */}
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th className="text-right">Debit Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No spending entries logged yet.</td>
                    </tr>
                  ) : (
                    expenses.map((exp: any) => (
                      <tr key={exp.id}>
                        <td className="font-semibold">{exp.description || "Expense Record"}</td>
                        <td>
                          <span className="badge status-info">{exp.category}</span>
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>{new Date(exp.date || exp.createdAt).toLocaleDateString()}</td>
                        <td className="text-right font-black" style={{ color: "var(--accent-danger)" }}>₹{(exp.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Debit Expense Form Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                <Receipt className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>Record Debit Expense</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Quick operational ledger log</p>
              </div>
            </div>

            {expenseSuccess && <div className="alert-success mb-4">{expenseSuccess}</div>}
            {expenseError   && <div className="alert-danger mb-4">{expenseError}</div>}

            <form onSubmit={handleCreateExpense} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Expense Description</label>
                <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Office Hardware Purchase" className="form-input" />
              </div>

              <div>
                <label className="form-label">Amount (₹)</label>
                <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 15000" className="form-input" />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select font-semibold">
                  <option value="OPERATIONAL">Operational</option>
                  <option value="TRAVEL">Travel &amp; Logistics</option>
                  <option value="SOFTWARE">Software Licences</option>
                  <option value="MARKETING">Marketing &amp; Sales</option>
                  <option value="OFFICE">Office Supplies</option>
                </select>
              </div>

              <button type="submit" disabled={formLoading} className="btn-primary w-full mt-2" style={{ padding: "0.85rem" }}>
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Save Expense Record</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
