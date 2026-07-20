import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { parseMoneyInput, toNumber } from "@/lib/money";
import { LeadStatus, ActivityType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.LEAD_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    const [leads, invoices] = await Promise.all([
      db.lead.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
      db.invoice.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const formattedLeads = leads.map((l) => ({
      ...l,
      value: toNumber(l.value),
    }));

    const formattedInvoices = invoices.map((inv) => ({
      ...inv,
      amount: toNumber(inv.amount),
    }));

    return NextResponse.json({ leads: formattedLeads, invoices: formattedInvoices });
  } catch (error) {
    console.error("CRM GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.LEAD_CREATE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { name, company, email, status, value, notes } = body;

    if (!name || !company || !email || !status || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetStatus = (status in LeadStatus ? status : LeadStatus.NEW) as LeadStatus;
    const decimalValue = parseMoneyInput(value);

    const lead = await db.lead.create({
      data: {
        tenantId,
        name,
        company,
        email,
        status: targetStatus,
        value: decimalValue,
        notes,
      },
    });

    await db.activity.create({
      data: {
        tenantId,
        message: `New Lead added: ${name} from ${company} (Value: $${decimalValue.toString()})`,
        type: ActivityType.LEAD,
      },
    });

    return NextResponse.json({ ...lead, value: toNumber(lead.value) });
  } catch (error) {
    console.error("CRM POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
