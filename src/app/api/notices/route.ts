import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

const CAN_WRITE = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR"];
const CAN_DELETE = ["COMPANY_ADMIN", "SUPER_ADMIN"];

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId } = session;

    const activities = await db.activity.findMany({
      where: { tenantId, type: "NOTICE" },
      orderBy: { timestamp: "desc" },
      take: 100,
    });

    const notices = activities
      .map((a) => {
        try {
          const parsed = JSON.parse(a.message);
          return { id: a.id, ...parsed, timestamp: a.timestamp };
        } catch {
          return {
            id: a.id,
            title: "Notice",
            content: a.message,
            target: "ALL",
            priority: "NORMAL",
            senderName: "System",
            senderRole: "SYSTEM",
            timestamp: a.timestamp,
          };
        }
      })
      .filter((n) => {
        // Admins see everything
        if (session.role === "COMPANY_ADMIN" || session.role === "SUPER_ADMIN") return true;
        // Target-based filter
        if (n.target === "ALL") return true;
        if (n.target === session.role) return true;
        if (n.target === session.userId) return true;
        // HR + CEO can see their own role-targeted notices
        return false;
      });

    return NextResponse.json({ notices });
  } catch (err) {
    console.error("Notices GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_WRITE.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403 });
    }

    const { tenantId } = session;
    const body = await req.json();
    const { title, content, target, priority } = body;

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const noticePayload = JSON.stringify({
      title: title.trim(),
      content: content.trim(),
      target: target || "ALL",
      priority: priority || "NORMAL",
      senderName: session.name,
      senderRole: session.role,
    });

    const notice = await db.$transaction(async (tx) => {
      const n = await tx.activity.create({
        data: { tenantId, message: noticePayload, type: "NOTICE" },
      });
      await tx.auditLog.create({
        data: {
          tenantId,
          userId: session.userId,
          action: "CREATE",
          resource: "NOTICES" as any,
          details: `Published notice: "${title}" → Target: ${target || "ALL"}`,
        },
      });
      return n;
    });

    return NextResponse.json({ success: true, noticeId: notice.id });
  } catch (err) {
    console.error("Notices POST error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!CAN_DELETE.includes(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { tenantId } = session;
    const { searchParams } = new URL(req.url);
    const noticeId = searchParams.get("id");
    if (!noticeId) return NextResponse.json({ error: "Notice ID required" }, { status: 400 });

    await db.activity.deleteMany({
      where: { id: noticeId, tenantId, type: "NOTICE" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notices DELETE error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
