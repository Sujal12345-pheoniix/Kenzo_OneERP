import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { AttendanceStatus, UserRoleType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.ATTENDANCE_READ);
    if (guard) return guard;

    const { tenantId, userId } = session!;

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
    const guard = requirePermission(session, PERMISSIONS.ATTENDANCE_MARK);
    if (guard) return guard;

    if (session!.role === UserRoleType.COMPANY_ADMIN || session!.role === UserRoleType.SUPER_ADMIN || session!.role === UserRoleType.CEO) {
      return NextResponse.json({ error: "Executive roles do not mark daily attendance" }, { status: 403 });
    }

    const { tenantId, userId } = session!;
    const body = await req.json();
    const { status } = body;

    const employee = await db.employee.findFirst({
      where: { userId, tenantId },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee record not found" }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    const targetStatus = (status in AttendanceStatus ? status : AttendanceStatus.PRESENT) as AttendanceStatus;
    const now = new Date();

    const attendance = await db.attendance.create({
      data: {
        tenantId,
        employeeId: employee.id,
        date: today,
        checkIn: now,
        status: targetStatus,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Attendance POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
