import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;

    const tasks = await db.task.findMany({
      where: { tenantId },
      include: { assignee: true, project: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Tasks GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
    const body = await req.json();
    const { title, description, status, priority, projectId, assigneeId, dueDate } = body;

    if (!title || !projectId || !status || !priority) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const task = await db.task.create({
      data: {
        tenantId,
        projectId,
        title,
        description: description || "",
        status,
        priority,
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
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing task ID or status" }, { status: 400 });
    }

    // Ensure the task belongs to the user's tenant (strict isolation)
    const existingTask = await db.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = await db.task.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
