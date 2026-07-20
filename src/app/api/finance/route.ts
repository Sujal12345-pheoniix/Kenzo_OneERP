import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { ExpenseStatus, InvoiceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.INVOICE_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    const [invoices, expenses] = await Promise.all([
      db.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
      db.expense.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedInvoices = invoices.map((inv) => ({
      ...inv,
      amount: toNumber(inv.amount),
    }));

    const formattedExpenses = expenses.map((exp) => ({
      ...exp,
      amount: toNumber(exp.amount),
    }));

    return NextResponse.json({ invoices: formattedInvoices, expenses: formattedExpenses });
  } catch (error) {
    console.error("Finance GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.EXPENSE_APPROVE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { expenseId, status } = body;

    if (!expenseId || !status) {
      return NextResponse.json({ error: "Missing expenseId or status" }, { status: 400 });
    }

    const existingExpense = await db.expense.findFirst({
      where: { id: expenseId, tenantId },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const targetStatus = (status in ExpenseStatus ? status : ExpenseStatus.PENDING) as ExpenseStatus;

    const updatedExpense = await db.expense.update({
      where: { id: expenseId },
      data: {
        status: targetStatus,
        approvedBy: session!.name,
      },
    });

    return NextResponse.json({ ...updatedExpense, amount: toNumber(updatedExpense.amount) });
  } catch (error) {
    console.error("Finance PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
