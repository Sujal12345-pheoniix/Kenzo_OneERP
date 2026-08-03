import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, role, userId } = session;
    const isSuperPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"].includes(role);

    let projectWhere: any = { tenantId };

    if (!isSuperPrivileged) {
      // Find employee record for current logged-in user
      const emp = await db.employee.findFirst({
        where: { userId, tenantId },
      });

      if (emp) {
        // Regular employees ONLY see projects that contain their assigned tasks
        projectWhere = {
          tenantId,
          tasks: {
            some: {
              assigneeId: emp.id,
            },
          },
        };
      }
    }

    const projects = await db.project.findMany({
      where: projectWhere,
      include: {
        tasks: {
          include: { assignee: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If non-admin user has zero assigned tasks/projects yet, return general project container so page renders cleanly
    if (projects.length === 0 && !isSuperPrivileged) {
      const fallbackProjects = await db.project.findMany({
        where: { tenantId },
        include: { tasks: { include: { assignee: true } } },
        take: 1,
      });
      return NextResponse.json(fallbackProjects);
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Projects GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, role } = session;
    const isSuperPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "PROJECT_MANAGER"].includes(role);
    if (!isSuperPrivileged) {
      return NextResponse.json({ error: "Forbidden. Admin or CEO privileges required to create projects." }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, budget, startDate } = body;

    if (!name || !description || budget === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await db.project.create({
      data: {
        tenantId,
        name,
        description,
        status: "ACTIVE",
        budget: parseFloat(budget),
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    // Write activity log
    await db.activity.create({
      data: {
        tenantId,
        message: `Project created: ${name} (Budget: Rs. ${budget})`,
        type: "PROJECT",
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
