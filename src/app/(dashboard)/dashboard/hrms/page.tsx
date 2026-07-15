"use client";

import React, { useEffect, useState } from "react";
import { PlusCircle, Loader2 } from "lucide-react";

export default function HRMSDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("DEVELOPER");
  const [salary, setSalary] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchHRData = async () => {
    try {
      const res = await fetch("/api/hrms");
      const json = await res.json();
      setData(json);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, []);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const res = await fetch("/api/hrms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, role, salary: Number(salary) }),
      });
      if (res.ok) {
        setFirstName("");
        setLastName("");
        setEmail("");
        setSalary("");
        await fetchHRData();
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

  const { employees, leaves } = data;
  const payrollTotal = employees.reduce((sum: number, e: any) => sum + e.salary, 0);

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto text-slate-800">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">HRMS Operations</h1>
        <p className="text-slate-500 text-sm mt-1">Staff directory administration, automated leaves tracker, and company operational payroll.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Total Employees</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">{employees.length}</div>
          <span className="text-slate-500 text-xs font-medium">Active directory personnel</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Annual Payroll Commits</span>
          <div className="text-2xl font-extrabold text-slate-900 mb-1">${payrollTotal.toLocaleString()}</div>
          <span className="text-slate-500 text-xs font-medium">Base package expenditure</span>
        </div>
        <div className="glass-panel p-6">
          <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Pending Leaves</span>
          <div className="text-2xl font-extrabold text-amber-600 mb-1">{leaves.filter((l: any) => l.status === "PENDING").length}</div>
          <span className="text-slate-500 text-xs font-medium">Awaiting administrator action</span>
        </div>
      </div>

      {/* Lists & Creator grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left lists (Employees & Leaves) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {/* Employee roster */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Organizational Roster</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3 text-right">Base Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-slate-50">
                      <td className="py-3.5 font-semibold text-slate-900">{emp.firstName} {emp.lastName}</td>
                      <td className="py-3.5">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">{emp.email}</td>
                      <td className="py-3.5 text-right font-semibold text-slate-900">${emp.salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave list */}
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Leave Administration</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <th className="pb-3">Team Member</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Period</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.map((leave: any) => (
                    <tr key={leave.id} className="hover:bg-slate-50">
                      <td className="py-3.5 font-semibold text-slate-900">{leave.employee.firstName} {leave.employee.lastName}</td>
                      <td className="py-3.5 text-slate-500">{leave.type}</td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          leave.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : leave.status === "REJECTED"
                            ? "bg-red-500/10 text-red-650 border-red-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}>
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right side form */}
        <div>
          <div className="glass-panel p-6">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Roster Member</h3>
            <form onSubmit={handleCreateEmployee} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Sujal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kumar"
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
                  placeholder="e.g. dev@kenzo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Role Group</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-sky-500 text-sm transition-all"
                >
                  <option value="DEVELOPER">Developer</option>
                  <option value="PROJECT_MANAGER">Project Manager</option>
                  <option value="HR_MANAGER">HR Manager</option>
                  <option value="COMPANY_ADMIN">Company Admin</option>
                  <option value="CEO">Chief Executive Officer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Annual Salary ($)</label>
                <input
                  type="number"
                  required
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="e.g. 120000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-sm transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-600/10 hover:-translate-y-0.5"
              >
                {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><PlusCircle className="h-4 w-4" /> Save Roster Record</>}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
