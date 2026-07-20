import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;

    const invoices = await db.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const expenses = await db.expense.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ invoices, expenses });
  } catch (error) {
    console.error("Finance GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
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

    const updatedExpense = await db.expense.update({
      where: { id: expenseId },
      data: {
        status,
        approvedBy: session.name,
      },
    });

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error("Finance PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
