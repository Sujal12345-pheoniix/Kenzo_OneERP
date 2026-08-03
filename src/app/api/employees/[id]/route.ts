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

    const { tenantId } = session;
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

    const isPrivileged = ["COMPANY_ADMIN", "SUPER_ADMIN", "CEO"].includes(session.role);
    if (!isPrivileged) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { tenantId } = session;
    const { id } = await params;
    const body = await req.json();

    const existingEmp = await db.employee.findFirst({
      where: { id, tenantId },
    });

    if (!existingEmp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const {
      employerName,
      address,
      phoneNumber,
      emergencyNumber,
      personalEmail,
      permanentAddress,
      empIdCode,
      govtIdType,
      govtIdNumber,
      medicalIssues,
      medication,
    } = body;

    const updatedEmployee = await db.employee.update({
      where: { id },
      data: {
        employerName: employerName !== undefined ? employerName : existingEmp.employerName,
        address: address !== undefined ? address : existingEmp.address,
        phoneNumber: phoneNumber !== undefined ? String(phoneNumber) : existingEmp.phoneNumber,
        emergencyNumber: emergencyNumber !== undefined ? String(emergencyNumber) : existingEmp.emergencyNumber,
        personalEmail: personalEmail !== undefined ? personalEmail : existingEmp.personalEmail,
        permanentAddress: permanentAddress !== undefined ? permanentAddress : existingEmp.permanentAddress,
        empIdCode: empIdCode !== undefined ? empIdCode : existingEmp.empIdCode,
        govtIdType: govtIdType !== undefined ? govtIdType : existingEmp.govtIdType,
        govtIdNumber: govtIdNumber !== undefined ? String(govtIdNumber) : existingEmp.govtIdNumber,
        medicalIssues: medicalIssues !== undefined ? medicalIssues : existingEmp.medicalIssues,
        medication: medication !== undefined ? medication : existingEmp.medication,
      },
    });

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error) {
    console.error("Employee Profile PUT Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

