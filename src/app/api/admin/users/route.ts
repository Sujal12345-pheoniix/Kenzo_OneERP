import { NextRequest, NextResponse } from "next/server";
import { getSession, hashPassword } from "@/lib/auth";
import db from "@/lib/db";

// Helper to check if caller is admin
async function isAdmin(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return null;
  if (session.role !== "COMPANY_ADMIN" && session.role !== "SUPER_ADMIN") {
    return null;
  }
  return session;
}

// GET all users in active tenant
export async function GET(req: NextRequest) {
  try {
    const adminSession = await isAdmin(req);
    if (!adminSession) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { tenantId } = adminSession;

    const users = await db.user.findMany({
      where: { tenantId },
      include: {
        employee: true,
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
    const adminSession = await isAdmin(req);
    if (!adminSession) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { tenantId } = adminSession;
    const body = await req.json();
    const { email, password, name, role, department, position, salary } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    // Create user and employee in transaction
    const newUser = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
          tenantId,
        },
      });

      await tx.employee.create({
        data: {
          tenantId,
          userId: user.id,
          firstName: name.split(" ")[0] || name,
          lastName: name.split(" ").slice(1).join(" ") || "",
          department: department || "ENGINEERING",
          position: position || "Staff",
          status: "ACTIVE",
          salary: salary ? parseFloat(salary) : 50000,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: adminSession.userId,
          action: "CREATE",
          resource: "USER",
          details: `Created new user: ${email} with role: ${role}`,
        },
      });

      // Activity log
      await tx.activity.create({
        data: {
          tenantId,
          message: `Admin created new user profile for ${name}`,
          type: "HR",
        },
      });

      return user;
    });

    return NextResponse.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  } catch (error) {
    console.error("Admin Users POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT edit user details (change password, role)
export async function PUT(req: NextRequest) {
  try {
    const adminSession = await isAdmin(req);
    if (!adminSession) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { tenantId } = adminSession;
    const body = await req.json();
    const { userId, password, role, name } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify user belongs to same tenant
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
    if (role) {
      updateData.role = role;
    }
    if (name) {
      updateData.name = name;
    }

    const updatedUser = await db.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: updateData,
      });

      // If name is updated, update employee first/last name
      if (name) {
        const first = name.split(" ")[0] || name;
        const last = name.split(" ").slice(1).join(" ") || "";
        await tx.employee.updateMany({
          where: { userId },
          data: { firstName: first, lastName: last },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: adminSession.userId,
          action: "UPDATE",
          resource: "USER",
          details: `Updated details for ${u.email}. Changed: ${Object.keys(updateData).join(", ")}`,
        },
      });

      return u;
    });

    return NextResponse.json({ success: true, user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name } });
  } catch (error) {
    console.error("Admin Users PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(req: NextRequest) {
  try {
    const adminSession = await isAdmin(req);
    if (!adminSession) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { tenantId } = adminSession;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Verify user belongs to same tenant
    const userToDelete = await db.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found or access denied" }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (userId === adminSession.userId) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      // Delete user's employee first if they have one to prevent setNull if we want a clean wipe
      await tx.employee.deleteMany({
        where: { userId },
      });

      // Delete user
      await tx.user.delete({
        where: { id: userId },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: adminSession.userId,
          action: "DELETE",
          resource: "USER",
          details: `Deleted user account: ${userToDelete.email}`,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Users DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
