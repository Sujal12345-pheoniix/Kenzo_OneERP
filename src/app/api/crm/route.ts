import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;

    const leads = await db.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    const invoices = await db.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ leads, invoices });
  } catch (error) {
    console.error("CRM GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
    const body = await req.json();
    const { name, company, email, status, value, notes } = body;

    if (!name || !company || !email || !status || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        tenantId,
        name,
        company,
        email,
        status,
        value: parseFloat(value),
        notes,
      },
    });

    // Write activity log
    await db.activity.create({
      data: {
        tenantId,
        message: `New Lead added: ${name} from ${company} (Value: $${value})`,
        type: "LEAD",
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("CRM POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
