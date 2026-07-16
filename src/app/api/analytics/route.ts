import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

const ALLOWED = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!ALLOWED.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantId } = session;

    // --- Employees by dept ---
    const employees = await db.employee.findMany({
      where: { tenantId },
      select: { department: true, status: true, salary: true, hireDate: true },
    });

    const deptMap: Record<string, { count: number; salaryTotal: number }> = {};
    employees.forEach((e) => {
      if (!deptMap[e.department]) deptMap[e.department] = { count: 0, salaryTotal: 0 };
      deptMap[e.department].count++;
      deptMap[e.department].salaryTotal += e.salary;
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
      where: { tenantId, status: "PAID" },
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
      if (monthlyRevMap[key] !== undefined) monthlyRevMap[key] += inv.amount;
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
      { stage: "New", count: leads.filter((l) => l.status === "NEW").length, color: "#6366f1" },
      { stage: "Contacted", count: leads.filter((l) => l.status === "CONTACTED").length, color: "#0284c7" },
      { stage: "Qualified", count: leads.filter((l) => l.status === "QUALIFIED").length, color: "#f59e0b" },
      { stage: "Won", count: leads.filter((l) => l.status === "WON").length, color: "#10b981" },
      { stage: "Lost", count: leads.filter((l) => l.status === "LOST").length, color: "#ef4444" },
    ];

    // --- Expenses by category ---
    const expenses = await db.expense.findMany({
      where: { tenantId },
      select: { category: true, amount: true, status: true },
    });
    const expenseCatMap: Record<string, number> = {};
    expenses.filter((e) => e.status === "APPROVED").forEach((e) => {
      expenseCatMap[e.category] = (expenseCatMap[e.category] || 0) + e.amount;
    });
    const expenseChartData = Object.entries(expenseCatMap).map(([name, value]) => ({ name, value }));

    // --- Invoice status distribution ---
    const invoices = await db.invoice.findMany({
      where: { tenantId },
      select: { status: true, amount: true },
    });
    const invStatusMap: Record<string, number> = {};
    invoices.forEach((inv) => {
      invStatusMap[inv.status] = (invStatusMap[inv.status] || 0) + inv.amount;
    });
    const invoiceStatusData = Object.entries(invStatusMap).map(([name, value]) => ({ name, value }));

    // --- Summary ---
    const paidTotal = allPaidInvoices.reduce((s, i) => s + i.amount, 0);
    const expTotal = expenses.filter((e) => e.status === "APPROVED").reduce((s, e) => s + e.amount, 0);

    return NextResponse.json({
      departmentData,
      projectStatusData,
      revenueChartData,
      leadFunnel,
      expenseChartData,
      invoiceStatusData,
      summary: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === "ACTIVE").length,
        totalProjects: projects.length,
        totalRevenue: paidTotal,
        totalExpenses: expTotal,
        netProfit: paidTotal - expTotal,
        totalLeads: leads.length,
        wonLeads: leads.filter((l) => l.status === "WON").length,
        conversionRate: leads.length > 0
          ? Math.round((leads.filter((l) => l.status === "WON").length / leads.length) * 100)
          : 0,
      },
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
