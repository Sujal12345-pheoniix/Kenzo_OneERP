import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, role, userId } = session;
    const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(role);

    if (isPrivileged) {
      const leaves = await db.leave.findMany({
        where: { tenantId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(leaves);
    } else {
      // Find employee record for the current user
      let emp = await db.employee.findFirst({
        where: { userId, tenantId },
      });

      if (!emp) {
        // Fallback search by email
        const userRec = await db.user.findUnique({ where: { id: userId } });
        if (userRec) {
          emp = await db.employee.findFirst({
            where: { tenantId, user: { email: userRec.email } },
          });
        }
      }

      if (!emp) {
        return NextResponse.json([]);
      }

      const leaves = await db.leave.findMany({
        where: { tenantId, employeeId: emp.id },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(leaves);
    }
  } catch (error) {
    console.error("Leaves GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, userId, name } = session;
    const body = await req.json();
    const { startDate, endDate, type, reason } = body;

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Missing required fields: startDate, endDate, and reason are required." }, { status: 400 });
    }

    // Find or link employee record
    let emp = await db.employee.findFirst({
      where: { userId, tenantId },
    });

    if (!emp) {
      const userRec = await db.user.findUnique({ where: { id: userId } });
      if (userRec) {
        emp = await db.employee.findFirst({
          where: { tenantId, user: { email: userRec.email } },
        });
      }
    }

    // If still no employee record, auto-create employee profile for this user
    if (!emp) {
      const nameParts = (name || "Employee User").trim().split(" ");
      const firstName = nameParts[0] || "Employee";
      const lastName = nameParts.slice(1).join(" ") || "User";

      emp = await db.employee.create({
        data: {
          tenantId,
          userId,
          firstName,
          lastName,
          department: "GENERAL",
          position: "Staff Member",
          status: "ACTIVE",
          salary: 50000,
        },
      });
    }

    const leave = await db.leave.create({
      data: {
        tenantId,
        employeeId: emp.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: type || "CASUAL",
        reason,
        status: "PENDING",
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error("Leave POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role } = session;
    const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(role);

    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden. Only Admin, CEO, and HR can update leave statuses." }, { status: 403 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters. Provide valid leave ID and status (PENDING, APPROVED, REJECTED)." }, { status: 400 });
    }

    const updatedLeave = await db.leave.update({
      where: { id },
      data: { status },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error("Leave PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, userId, tenantId } = session;
    const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(role);

    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: "Leave ID is required" }, { status: 400 });
    }

    const leave = await db.leave.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave application not found" }, { status: 404 });
    }

    if (leave.tenantId !== tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check ownership if not privileged
    if (!isPrivileged) {
      let emp = await db.employee.findFirst({
        where: { userId, tenantId },
      });

      if (!emp) {
        const userRec = await db.user.findUnique({ where: { id: userId } });
        if (userRec) {
          emp = await db.employee.findFirst({
            where: { tenantId, user: { email: userRec.email } },
          });
        }
      }

      if (!emp || leave.employeeId !== emp.id) {
        return NextResponse.json({ error: "Forbidden. You can only delete your own leave applications." }, { status: 403 });
      }
    }

    await db.leave.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Leave DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
