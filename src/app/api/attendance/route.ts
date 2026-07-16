import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, userId } = session;

    // Find the employee for the current user
    const employee = await db.employee.findFirst({
      where: { userId, tenantId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    const attendances = await db.attendance.findMany({
      where: { employeeId: employee.id, tenantId },
      orderBy: { date: "desc" },
      take: 90,
    });

    return NextResponse.json({ attendances, employeeId: employee.id });
  } catch (error) {
    console.error("Attendance GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Admin and CEO cannot mark own attendance via this route
    if (session.role === "COMPANY_ADMIN" || session.role === "SUPER_ADMIN" || session.role === "CEO") {
      return NextResponse.json({ error: "Admins and CEOs do not mark attendance via this route" }, { status: 403 });
    }

    const { tenantId, userId } = session;
    const body = await req.json();
    const { status } = body; // "PRESENT" | "LATE"

    // Find the employee
    const employee = await db.employee.findFirst({
      where: { userId, tenantId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    // Only allow marking today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked
    const existing = await db.attendance.findFirst({
      where: {
        employeeId: employee.id,
        tenantId,
        date: today,
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Attendance already marked for today" }, { status: 400 });
    }

    const now = new Date();
    const attendance = await db.attendance.create({
      data: {
        tenantId,
        employeeId: employee.id,
        date: today,
        checkIn: now,
        status: status || "PRESENT",
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
