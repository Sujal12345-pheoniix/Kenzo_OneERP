import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: session.tenantId },
    });

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        tenant,
      },
    });
  } catch (error) {
    console.error("Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
