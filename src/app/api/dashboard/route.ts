import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import { toNumber } from "@/lib/money";
import { ProjectStatus, LeadStatus, EmployeeStatus, InvoiceStatus, ExpenseStatus, LeaveStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session;

    // Active Projects Count
    const activeProjectsCount = await db.project.count({
      where: { tenantId, status: ProjectStatus.ACTIVE },
    });

    // Pipeline Value
    const leads = await db.lead.findMany({
      where: { tenantId, status: { in: [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.QUALIFIED] } },
    });
    const pipelineValue = leads.reduce((sum, lead) => sum + toNumber(lead.value), 0);

    // Total Employees
    const totalEmployees = await db.employee.count({
      where: { tenantId, status: EmployeeStatus.ACTIVE },
    });

    // Invoices Cash Flow
    const paidInvoices = await db.invoice.findMany({
      where: { tenantId, status: InvoiceStatus.PAID },
    });
    const revenue = paidInvoices.reduce((sum, inv) => sum + toNumber(inv.amount), 0);

    const approvedExpenses = await db.expense.findMany({
      where: { tenantId, status: ExpenseStatus.APPROVED },
    });
    const expensesValue = approvedExpenses.reduce((sum, exp) => sum + toNumber(exp.amount), 0);

    const profit = revenue - expensesValue;

    // Recent Activities
    const recentActivities = await db.activity.findMany({
      where: { tenantId },
      orderBy: { timestamp: "desc" },
      take: 6,
    });

    // Recent Audit Logs
    const recentAuditLogs = await db.auditLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: "desc" },
      take: 6,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Approval Queue
    const pendingLeaves = await db.leave.findMany({
      where: { tenantId, status: LeaveStatus.PENDING },
      include: { employee: true },
    });

    const pendingExpenses = await db.expense.findMany({
      where: { tenantId, status: ExpenseStatus.PENDING },
    });

    const formattedLeaves = pendingLeaves.map((l) => ({
      ...l,
      employee: {
        ...l.employee,
        salary: toNumber(l.employee.salary),
      },
    }));

    const formattedExpenses = pendingExpenses.map((exp) => ({
      ...exp,
      amount: toNumber(exp.amount),
    }));

    const salesPerformance = [
      { month: "Jan", revenue: revenue * 0.7, profit: profit * 0.65 },
      { month: "Feb", revenue: revenue * 0.8, profit: profit * 0.75 },
      { month: "Mar", revenue: revenue * 0.9, profit: profit * 0.8 },
      { month: "Apr", revenue, profit },
    ];

    return NextResponse.json({
      metrics: {
        activeProjects: activeProjectsCount,
        pipeline: pipelineValue,
        employees: totalEmployees,
        revenue,
        expenses: expensesValue,
        profit,
        mrr: revenue / 4,
        arr: (revenue / 4) * 12,
      },
      recentActivities,
      recentAuditLogs,
      approvalQueue: {
        leaves: formattedLeaves,
        expenses: formattedExpenses,
      },
      charts: {
        salesPerformance,
      },
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
