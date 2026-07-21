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
      include: { assignee: true, project: true },
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

    const { tenantId, role } = session;
    const body = await req.json();
    const { id, title, description, status, priority, assigneeId, dueDate, projectId } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }

    const existingTask = await db.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Prepare update payload
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (projectId !== undefined) updateData.projectId = projectId;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedTask = await db.task.update({
      where: { id },
      data: updateData,
      include: { assignee: true, project: true },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, role } = session;
    const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "PROJECT_MANAGER"].includes(role);
    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden. Admin or CEO privileges required to delete tasks." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }

    const existingTask = await db.task.findFirst({
      where: { id, tenantId },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await db.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Task DELETE Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
