import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS, checkPermission } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { LeaveStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.EMPLOYEE_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    const [employees, leaves, attendances] = await Promise.all([
      db.employee.findMany({
        where: { tenantId },
        include: { user: true },
        orderBy: { lastName: "asc" },
      }),
      db.leave.findMany({
        where: { tenantId },
        include: { employee: true },
        orderBy: { createdAt: "desc" },
      }),
      db.attendance.findMany({
        where: { tenantId },
        include: { employee: true },
        orderBy: { date: "desc" },
        take: 50,
      }),
    ]);

    const canViewSalary = checkPermission(session!.permissions || [], PERMISSIONS.EMPLOYEE_SALARY_VIEW);

    const formattedEmployees = employees.map((emp) => ({
      ...emp,
      salary: canViewSalary ? toNumber(emp.salary) : 0,
    }));

    return NextResponse.json({ employees: formattedEmployees, leaves, attendances });
  } catch (error) {
    console.error("HRMS GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.LEAVE_APPROVE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { leaveId, status } = body;

    if (!leaveId || !status) {
      return NextResponse.json({ error: "Missing leaveId or status" }, { status: 400 });
    }

    const existingLeave = await db.leave.findFirst({
      where: { id: leaveId, tenantId },
    });

    if (!existingLeave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    const targetStatus = (status in LeaveStatus ? status : LeaveStatus.PENDING) as LeaveStatus;

    const updatedLeave = await db.leave.update({
      where: { id: leaveId },
      data: { status: targetStatus },
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error("HRMS PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
