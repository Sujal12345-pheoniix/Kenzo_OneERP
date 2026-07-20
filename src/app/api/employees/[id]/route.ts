import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS, checkPermission } from "@/lib/rbac";
import { toNumber } from "@/lib/money";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.EMPLOYEE_READ);
    if (guard) return guard;

    const { tenantId } = session!;
    const { id } = await params;

    const employee = await db.employee.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        tasks: {
          include: { project: true },
          orderBy: { createdAt: "desc" },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 60,
        },
        leaves: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const canViewSalary = checkPermission(session!.permissions || [], PERMISSIONS.EMPLOYEE_SALARY_VIEW);

    const formattedEmployee = {
      ...employee,
      salary: canViewSalary ? toNumber(employee.salary) : 0,
    };

    return NextResponse.json({ employee: formattedEmployee });
  } catch (error) {
    console.error("Employee Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
