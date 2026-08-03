import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true, employee: true },
    });

    if (!dbUser) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const tenantSettings: any = dbUser.tenant?.settings || {};
    const userProfile = tenantSettings.userProfiles?.[session.userId] || {};

    return NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        position: dbUser.employee?.position || userProfile.position || dbUser.role,
        phone: userProfile.phone || "",
        avatar: userProfile.avatar || "",
        tenant: dbUser.tenant,
        employee: dbUser.employee,
      },
    });
  } catch (error) {
    console.error("Session Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
