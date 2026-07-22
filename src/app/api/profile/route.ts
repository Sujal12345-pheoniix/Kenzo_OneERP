import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";
import crypto from "crypto";

async function uploadToCloudinary(base64Data: string) {
  const cloudName = process.env.CLOUD_NAME || "dg7tgftmf";
  const apiKey = process.env.CLOUDINARY_API_KEY || "375739656182662";
  const apiSecret = process.env.CLOUDINARY_API_SECRET || "DIzbPW9-zWGsPERPJnHtgElutG4";

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "kore_profiles";
  const transformation = "c_fill,g_face,w_300,h_300,q_auto,f_auto";

  // Create SHA1 signature for Cloudinary upload
  const strToSign = `folder=${folder}&transformation=${transformation}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

  const formData = new FormData();
  formData.append("file", base64Data);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("folder", folder);
  formData.append("transformation", transformation);
  formData.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.secure_url) {
    return data.secure_url;
  }
  throw new Error(data.error?.message || "Cloudinary upload failed");
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.userId },
      include: { tenant: true, employee: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const tenantSettings: any = user.tenant.settings || {};
    const userProfile = tenantSettings.userProfiles?.[session.userId] || {};

    return NextResponse.json({
      id: user.id,
      name: userProfile.name || user.name,
      email: user.email,
      role: user.role,
      position: userProfile.position || user.employee?.position || user.role,
      phone: userProfile.phone || "",
      avatar: userProfile.avatar || "",
      bio: userProfile.bio || "",
    });
  } catch (error) {
    console.error("GET Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId, tenantId } = session;
    const body = await req.json();
    const { name, position, phone, bio, avatar } = body;

    let finalAvatarUrl = avatar;

    // If avatar is base64 image data URL, upload to Cloudinary
    if (avatar && avatar.startsWith("data:image")) {
      try {
        finalAvatarUrl = await uploadToCloudinary(avatar);
      } catch (uploadErr) {
        console.error("Cloudinary Upload Error:", uploadErr);
        // Fallback to existing avatar or base64
      }
    }

    // Update User name in database if provided
    if (name) {
      await db.user.update({
        where: { id: userId },
        data: { name },
      });
    }

    // Update Employee record in database if exists
    const emp = await db.employee.findFirst({
      where: { userId, tenantId },
    });

    if (emp) {
      const nameParts = (name || "").trim().split(" ");
      const firstName = nameParts[0] || emp.firstName;
      const lastName = nameParts.slice(1).join(" ") || emp.lastName;

      await db.employee.update({
        where: { id: emp.id },
        data: {
          firstName,
          lastName,
          position: position || emp.position,
        },
      });
    }

    // Store custom profile metadata (Cloudinary avatar, phone, bio, position) in Tenant.settings
    const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
    const currentSettings: any = tenant?.settings || {};
    const userProfiles = currentSettings.userProfiles || {};

    userProfiles[userId] = {
      name: name || session.name,
      position: position || "",
      phone: phone || "",
      bio: bio || "",
      avatar: finalAvatarUrl || userProfiles[userId]?.avatar || "",
      updatedAt: new Date().toISOString(),
    };

    await db.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...currentSettings,
          userProfiles,
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: name || session.name,
        email: session.email,
        role: session.role,
        position: position || emp?.position || session.role,
        phone,
        bio,
        avatar: finalAvatarUrl,
      },
    });
  } catch (error) {
    console.error("PUT Profile Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
