import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { InvoiceStatus, LeadStatus, ExpenseStatus, EmployeeStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.AUDIT_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    // --- Employees by dept ---
    const employees = await db.employee.findMany({
      where: { tenantId },
      select: { department: true, status: true, salary: true, hireDate: true },
    });

    const deptMap: Record<string, { count: number; salaryTotal: number }> = {};
    employees.forEach((e) => {
      const sal = toNumber(e.salary);
      if (!deptMap[e.department]) deptMap[e.department] = { count: 0, salaryTotal: 0 };
      deptMap[e.department].count++;
      deptMap[e.department].salaryTotal += sal;
    });

    const departmentData = Object.entries(deptMap).map(([name, v]) => ({
      name,
      employees: v.count,
      avgSalary: Math.round(v.salaryTotal / v.count),
      totalSalary: v.salaryTotal,
    }));

    // --- Projects by status ---
    const projects = await db.project.findMany({
      where: { tenantId },
      select: { status: true, budget: true },
    });

    const projectStatus: Record<string, number> = {};
    projects.forEach((p) => { projectStatus[p.status] = (projectStatus[p.status] || 0) + 1; });
    const projectStatusData = Object.entries(projectStatus).map(([name, value]) => ({ name, value }));

    // --- Revenue: last 6 calendar months ---
    const allPaidInvoices = await db.invoice.findMany({
      where: { tenantId, status: InvoiceStatus.PAID },
      select: { amount: true, issueDate: true },
      orderBy: { issueDate: "asc" },
    });

    const now = new Date();
    const monthLabels: string[] = [];
    const monthlyRevMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      monthLabels.push(key);
      monthlyRevMap[key] = 0;
    }
    allPaidInvoices.forEach((inv) => {
      const d = new Date(inv.issueDate);
      const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
      if (monthlyRevMap[key] !== undefined) monthlyRevMap[key] += toNumber(inv.amount);
    });
    const revenueChartData = monthLabels.map((month) => ({
      month,
      revenue: monthlyRevMap[month],
      target: monthlyRevMap[month] * 1.15,
    }));

    // --- Leads funnel ---
    const leads = await db.lead.findMany({
      where: { tenantId },
      select: { status: true, value: true },
    });
    const leadFunnel = [
      { stage: "New", count: leads.filter((l) => l.status === LeadStatus.NEW).length, color: "#6366f1" },
      { stage: "Contacted", count: leads.filter((l) => l.status === LeadStatus.CONTACTED).length, color: "#0284c7" },
      { stage: "Qualified", count: leads.filter((l) => l.status === LeadStatus.QUALIFIED).length, color: "#f59e0b" },
      { stage: "Won", count: leads.filter((l) => l.status === LeadStatus.WON).length, color: "#10b981" },
      { stage: "Lost", count: leads.filter((l) => l.status === LeadStatus.LOST).length, color: "#ef4444" },
    ];

    // --- Expenses by category ---
    const expenses = await db.expense.findMany({
      where: { tenantId },
      select: { category: true, amount: true, status: true },
    });
    const expenseCatMap: Record<string, number> = {};
    expenses.filter((e) => e.status === ExpenseStatus.APPROVED).forEach((e) => {
      expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + toNumber(e.amount);
    });
    const expenseChartData = Object.entries(expenseCatMap).map(([name, value]) => ({ name, value }));

    // --- Invoice status distribution ---
    const invoices = await db.invoice.findMany({
      where: { tenantId },
      select: { status: true, amount: true },
    });
    const invStatusMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      invStatusMap[inv.status] = (invStatusMap[inv.status] || 0) + toNumber(inv.amount);
    });
    const invoiceStatusData = Object.entries(invStatusMap).map(([name, value]) => ({ name, value }));

    // --- Summary ---
    const paidTotal = allPaidInvoices.reduce((s, i) => s + toNumber(i.amount), 0);
    const expTotal = expenses.filter((e) => e.status === ExpenseStatus.APPROVED).reduce((s, e) => s + toNumber(e.amount), 0);

    return NextResponse.json({
      departmentData,
      projectStatusData,
      revenueChartData,
      leadFunnel,
      expenseChartData,
      invoiceStatusData,
      summary: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === EmployeeStatus.ACTIVE).length,
        totalProjects: projects.length,
        totalRevenue: paidTotal,
        totalExpenses: expTotal,
        netProfit: paidTotal - expTotal,
        totalLeads: leads.length,
        wonLeads: leads.filter((l) => l.status === LeadStatus.WON).length,
        conversionRate: leads.length > 0
          ? Math.round((leads.filter((l) => l.status === LeadStatus.WON).length / leads.length) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
