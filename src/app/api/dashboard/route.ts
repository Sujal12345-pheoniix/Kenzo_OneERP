import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tenantId } = session;

    // Active Projects Count
    const activeProjectsCount = await db.project.count({
      where: { tenantId, status: "ACTIVE" },
    });

    // Pipeline Value
    const leads = await db.lead.findMany({
      where: { tenantId, status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } },
    });
    const pipelineValue = leads.reduce((sum, lead) => sum + lead.value, 0);

    // Total Employees
    const totalEmployees = await db.employee.count({
      where: { tenantId, status: "ACTIVE" },
    });

    // Invoices Cash Flow (Paid = Inflow, Expenses Approved = Outflow)
    const paidInvoices = await db.invoice.findMany({
      where: { tenantId, status: "PAID" },
    });
    const revenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const approvedExpenses = await db.expense.findMany({
      where: { tenantId, status: "APPROVED" },
    });
    const expensesValue = approvedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

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

    // Approval Queue (Pending leaves and pending expenses)
    const pendingLeaves = await db.leave.findMany({
      where: { tenantId, status: "PENDING" },
      include: { employee: true },
    });

    const pendingExpenses = await db.expense.findMany({
      where: { tenantId, status: "PENDING" },
    });

    // Dummy/Sample chart data for dashboard visualization
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
        mrr: revenue / 4, // Simulated monthly recurring revenue
        arr: (revenue / 4) * 12,
      },
      recentActivities,
      recentAuditLogs,
      approvalQueue: {
        leaves: pendingLeaves,
        expenses: pendingExpenses,
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
