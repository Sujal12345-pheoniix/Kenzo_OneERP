import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import db from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { toNumber } from "@/lib/money";
import { TaskStatus, TaskPriority } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.TASK_READ);
    if (guard) return guard;

    const { tenantId } = session!;

    const tasks = await db.task.findMany({
      where: { tenantId },
      include: { assignee: true, project: true },
      orderBy: { createdAt: "desc" },
    });

    const formattedTasks = tasks.map((t) => ({
      ...t,
      project: t.project ? { ...t.project, budget: toNumber(t.project.budget) } : null,
      assignee: t.assignee ? { ...t.assignee, salary: toNumber(t.assignee.salary) } : null,
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error("Tasks GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.TASK_CREATE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { title, description, status, priority, projectId, assigneeId, dueDate } = body;

    if (!title || !projectId || !status || !priority) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const targetStatus = (status in TaskStatus ? status : TaskStatus.TODO) as TaskStatus;
    const targetPriority = (priority in TaskPriority ? priority : TaskPriority.MEDIUM) as TaskPriority;

    const task = await db.task.create({
      data: {
        tenantId,
        projectId,
        title,
        description: description || "",
        status: targetStatus,
        priority: targetPriority,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Task POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.TASK_UPDATE);
    if (guard) return guard;

    const { tenantId } = session!;
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing task ID or status" }, { status: 400 });
    }

    const existingTask = await db.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const targetStatus = (status in TaskStatus ? status : TaskStatus.TODO) as TaskStatus;

    const updatedTask = await db.task.update({
      where: { id },
      data: { status: targetStatus },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
