import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { parseMoneyInput, toNumber } from "@/lib/money";
import { ProjectStatus, ActivityType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.PROJECT_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    const projects = await db.project.findMany({
      where: { tenantId },
      include: {
        tasks: {
          include: { assignee: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedProjects = projects.map((proj) => ({
      ...proj,
      budget: toNumber(proj.budget),
      tasks: proj.tasks.map((task) => ({
        ...task,
        assignee: task.assignee
          ? {
              ...task.assignee,
              salary: toNumber(task.assignee.salary),
            }
          : null,
      })),
    }));

    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error("Projects GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.PROJECT_CREATE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { name, description, budget, startDate } = body;

    if (!name || !description || budget === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const decimalBudget = parseMoneyInput(budget);

    const project = await db.project.create({
      data: {
        tenantId,
        name,
        description,
        status: ProjectStatus.ACTIVE,
        budget: decimalBudget,
        startDate: startDate ? new Date(startDate) : new Date(),
      },
    });

    await db.activity.create({
      data: {
        tenantId,
        message: `Project created: ${name} (Budget: $${decimalBudget.toString()})`,
        type: ActivityType.PROJECT,
      },
    });

    return NextResponse.json({ ...project, budget: toNumber(project.budget) });
  } catch (error) {
    console.error("Project POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
