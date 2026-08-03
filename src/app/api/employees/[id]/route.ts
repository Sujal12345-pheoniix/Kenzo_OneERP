import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, role } = session;
    const { id } = await params;

    const employee = await db.employee.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        tasks: {
          include: { project: true },
          orderBy: { createdAt: "desc" },
        },
        attendances: {
          orderBy: { date: "desc" },
          take: 60,
        },
        leaves: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const isAdmin = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(role);

    // If caller is NOT an admin, sanitize and remove confidential employee admin details
    if (!isAdmin) {
      const {
        phone, emergencyPhone, emergencyContactName, address, personalEmail,
        fatherName, medicalIssues, medications, bloodGroup, govtIdType, govtId,
        ...safeEmployee
      } = employee as any;
      return NextResponse.json({ employee: safeEmployee });
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Employee Profile GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tenantId, role } = session;
    const isAdmin = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO", "HR", "HR_MANAGER"].includes(role);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden. Admin access required to edit employee details." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      phone,
      emergencyPhone,
      emergencyContactName,
      address,
      personalEmail,
      fatherName,
      medicalIssues,
      medications,
      bloodGroup,
      govtIdType,
      govtId,
    } = body;

    const existing = await db.employee.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const updated = await db.employee.update({
      where: { id },
      data: {
        phone: phone !== undefined ? phone : existing.phone,
        emergencyPhone: emergencyPhone !== undefined ? emergencyPhone : existing.emergencyPhone,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : existing.emergencyContactName,
        address: address !== undefined ? address : existing.address,
        personalEmail: personalEmail !== undefined ? personalEmail : existing.personalEmail,
        fatherName: fatherName !== undefined ? fatherName : existing.fatherName,
        medicalIssues: medicalIssues !== undefined ? medicalIssues : existing.medicalIssues,
        medications: medications !== undefined ? medications : existing.medications,
        bloodGroup: bloodGroup !== undefined ? bloodGroup : existing.bloodGroup,
        govtIdType: govtIdType !== undefined ? govtIdType : existing.govtIdType,
        govtId: govtId !== undefined ? govtId : existing.govtId,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error("Employee Profile PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
