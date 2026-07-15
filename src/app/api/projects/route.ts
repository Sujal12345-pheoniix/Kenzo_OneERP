import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;

    const projects = await db.project.findMany({
      where: { tenantId },
      include: {
        tasks: {
          include: { assignee: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

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

    const { tenantId } = session;
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
        message: `Project created: ${name} (Budget: $${budget})`,
        type: "PROJECT",
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Project POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
