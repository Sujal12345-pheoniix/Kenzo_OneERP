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

    const dbUser = await db.user.findUnique({
      where: { id: session.userId },
      include: { employee: true },
    });

    const tenantSettings: any = tenant?.settings || {};
    const userProfile = tenantSettings.userProfiles?.[session.userId] || {};

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.userId,
        email: session.email,
        name: userProfile.name || dbUser?.name || session.name,
        role: session.role,
        position: userProfile.position || dbUser?.employee?.position || session.role,
        phone: userProfile.phone || "",
        avatar: userProfile.avatar || "",
        tenant,
        employee: dbUser?.employee,
      },
    });
  } catch (error) {
    console.error("Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
