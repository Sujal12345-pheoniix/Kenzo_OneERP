import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;

    const employees = await db.employee.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { lastName: "asc" },
    });

    const leaves = await db.leave.findMany({
      where: { tenantId },
      include: { employee: true },
      orderBy: { createdAt: "desc" },
    });

    const attendances = await db.attendance.findMany({
      where: { tenantId },
      include: { employee: true },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json({ employees, leaves, attendances });
  } catch (error) {
    console.error("HRMS GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
    const body = await req.json();
    const { leaveId, status } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ error: "Missing leaveId or status" }, { status: 400 });
    }

    // Tenant isolation verification
    const existingLeave = await db.leave.findFirst({
      where: { id: leaveId, tenantId },
    });

    if (!existingLeave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const updatedLeave = await db.leave.update({
      where: { id: leaveId },
      data: { status },
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error("HRMS PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
