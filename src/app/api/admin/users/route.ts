import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { parseMoneyInput } from "@/lib/money";
import { UserRoleType, EmployeeDepartment, EmployeeStatus, AuditAction, AuditResource, ActivityType } from "@prisma/client";

// GET all users in active tenant
export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.USER_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    const users = await db.user.findMany({
      where: { tenantId },
      include: {
        employee: true,
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin Users GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST create new user + employee
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.USER_CREATE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { email, password, name, role, department, position, salary } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const targetRoleEnum = (role in UserRoleType ? role : UserRoleType.EMPLOYEE) as UserRoleType;
    const targetDeptEnum = (department in EmployeeDepartment ? department : EmployeeDepartment.ENGINEERING) as EmployeeDepartment;
    const decimalSalary = parseMoneyInput(salary || 50000);

    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: targetRoleEnum,
          tenantId,
        },
      });

      // Find role record to map UserRole
      const roleRecord = await tx.role.findFirst({
        where: {
          code: targetRoleEnum,
          OR: [{ tenantId }, { tenantId: null }],
        },
      });

      if (roleRecord) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: roleRecord.id,
          },
        });
      }

      await tx.employee.create({
        data: {
          tenantId,
          userId: user.id,
          firstName: name.split(" ")[0] || name,
          lastName: name.split(" ").slice(1).join(" ") || "",
          department: targetDeptEnum,
          position: position || "Staff Member",
          status: EmployeeStatus.ACTIVE,
          salary: decimalSalary,
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session!.userId,
          action: AuditAction.CREATE,
          resource: AuditResource.USER,
          details: `Created user account: ${email} with role: ${targetRoleEnum}`,
        },
      });

      await tx.activity.create({
        data: {
          tenantId,
          message: `Created new user identity for ${name}`,
          type: ActivityType.HR,
        },
      });

      return user;
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (error: any) {
    console.error("Admin Users POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT edit user details
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.USER_UPDATE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { userId, password, role, name } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userToUpdate = await db.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
    }

    const updateData: any = {};
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }
    if (role && role in UserRoleType) {
      updateData.role = role as UserRoleType;
    }
    if (name) {
      updateData.name = name;
    }

    const updatedUser = await db.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      if (role && role in UserRoleType) {
        const roleRecord = await tx.role.findFirst({
          where: {
            code: role as UserRoleType,
            OR: [{ tenantId }, { tenantId: null }],
          },
        });
        if (roleRecord) {
          await tx.userRole.deleteMany({ where: { userId } });
          await tx.userRole.create({
            data: { userId, roleId: roleRecord.id },
          });
        }
      }

      if (name) {
        const first = name.split(" ")[0] || name;
        const last = name.split(" ").slice(1).join(" ") || "";
        await tx.employee.updateMany({
          where: { userId },
          data: { firstName: first, lastName: last },
        });
      }

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session!.userId,
          action: AuditAction.UPDATE,
          resource: AuditResource.USER,
          details: `Updated details for ${u.email}`,
        },
      });

      return u;
    });

    return NextResponse.json({ success: true, user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name } });
  } catch (error: any) {
    console.error("Admin Users PUT Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE user (Soft Delete)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.USER_DELETE);
    if (guard) return guard;

    const { tenantId } = session!;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userToDelete = await db.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
    }

    if (userId === session!.userId) {
      return NextResponse.json({ error: "You cannot delete your own active session account" }, { status: 400 });
    }

    // Priority 04: Soft Delete Implementation
    await db.$transaction(async (tx) => {
      const now = new Date();

      await tx.user.update({
        where: { id: userId },
        data: {
          isDeleted: true,
          deletedAt: now,
          deletedBy: session!.userId,
          deletionReason: "User purged by administrator",
        },
      });

      await tx.employee.updateMany({
        where: { userId },
        data: {
          isDeleted: true,
          deletedAt: now,
          deletedBy: session!.userId,
          deletionReason: "Associated user account soft-deleted",
        },
      });

      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session!.userId,
          action: AuditAction.DELETE,
          resource: AuditResource.USER,
          details: `Soft-deleted user account: ${userToDelete.email}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Admin Users DELETE Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
