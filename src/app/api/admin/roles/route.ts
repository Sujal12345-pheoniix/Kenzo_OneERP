import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db, { rawDb } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { UserRoleType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.ROLE_MANAGE);
    if (guard) return guard;

    const tenantId = session!.tenantId;

    const [roles, permissions] = await Promise.all([
      db.role.findMany({
        where: {
          OR: [
            { tenantId: null },
            { tenantId: tenantId },
          ],
        },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.permission.findMany({
        orderBy: { module: "asc" },
      }),
    ]);

    return NextResponse.json({ roles, permissions });
  } catch (error) {
    console.error("Roles GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.ROLE_MANAGE);
    if (guard) return guard;

    const tenantId = session!.tenantId;
    const body = await req.json();
    const { name, description, permissionIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const newRole = await db.role.create({
      data: {
        tenantId,
        name,
        code: UserRoleType.EMPLOYEE,
        description: description || "",
        isSystem: false,
        rolePermissions: {
          create: (permissionIds || []).map((pId: string) => ({
            permissionId: pId,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return NextResponse.json(newRole);
  } catch (error: any) {
    console.error("Roles POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create role" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.ROLE_MANAGE);
    if (guard) return guard;

    const tenantId = session!.tenantId;
    const body = await req.json();
    const { roleId, name, description, permissionIds } = body;

    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const role = await db.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      return NextResponse.json({ error: "Role not found or system role" }, { status: 404 });
    }

    // Clear existing permissions and replace
    await db.rolePermission.deleteMany({
      where: { roleId },
    });

    const updatedRole = await db.role.update({
      where: { id: roleId },
      data: {
        name: name || role.name,
        description: description ?? role.description,
        rolePermissions: {
          create: (permissionIds || []).map((pId: string) => ({
            permissionId: pId,
          })),
        },
      },
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
    });

    return NextResponse.json(updatedRole);
  } catch (error: any) {
    console.error("Roles PUT Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update role" }, { status: 500 });
  }
}
