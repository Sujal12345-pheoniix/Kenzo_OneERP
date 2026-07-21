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

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
    const body = await req.json();
    const { type, description, amount, category, clientName, customerName, status, dueDate, issueDate, invoiceNo } = body;

    if (type === "INVOICE") {
      const invCustomer = customerName || clientName;
      if (!invCustomer || amount === undefined || isNaN(Number(amount))) {
        return NextResponse.json({ error: "Missing invoice client name or amount" }, { status: 400 });
      }
      const newInvoice = await db.invoice.create({
        data: {
          tenantId,
          invoiceNo: invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
          customerName: invCustomer,
          amount: parseFloat(amount),
          status: status || "SENT",
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      await db.activity.create({
        data: {
          tenantId,
          message: `Invoice created for ${invCustomer} (Rs. ${amount})`,
          type: "FINANCE",
        },
      });

      return NextResponse.json(newInvoice);
    } else {
      if (!description || amount === undefined || isNaN(Number(amount))) {
        return NextResponse.json({ error: "Missing expense description or amount" }, { status: 400 });
      }
      const newExpense = await db.expense.create({
        data: {
          tenantId,
          description,
          amount: parseFloat(amount),
          category: category || "OPERATIONAL",
          status: status || "APPROVED",
          date: new Date(),
        },
      });

      await db.activity.create({
        data: {
          tenantId,
          message: `Expense recorded: ${description} (Rs. ${amount})`,
          type: "FINANCE",
        },
      });

      return NextResponse.json(newExpense);
    }
  } catch (error) {
    console.error("Finance POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

