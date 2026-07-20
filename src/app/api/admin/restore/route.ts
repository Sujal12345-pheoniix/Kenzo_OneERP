import { NextRequest, NextResponse } from "next/server";
import { getSession, requirePermission } from "@/lib/auth";
import { rawDb } from "@/lib/db";
import { PERMISSIONS } from "@/lib/rbac";
import { AuditAction, AuditResource } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.SYSTEM_RESTORE);
    if (guard) return guard;

    const tenantId = session!.tenantId;

    // Use rawDb to bypass automatic isDeleted: false query filtering
    const [deletedEmployees, deletedInvoices, deletedProjects, deletedTasks, deletedLeads, deletedExpenses] = await Promise.all([
      rawDb.employee.findMany({ where: { tenantId, isDeleted: true } }),
      rawDb.invoice.findMany({ where: { tenantId, isDeleted: true } }),
      rawDb.project.findMany({ where: { tenantId, isDeleted: true } }),
      rawDb.task.findMany({ where: { tenantId, isDeleted: true } }),
      rawDb.lead.findMany({ where: { tenantId, isDeleted: true } }),
      rawDb.expense.findMany({ where: { tenantId, isDeleted: true } }),
    ]);

    return NextResponse.json({
      deletedEmployees,
      deletedInvoices,
      deletedProjects,
      deletedTasks,
      deletedLeads,
      deletedExpenses,
    });
  } catch (error) {
    console.error("Restore GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    const guard = requirePermission(session, PERMISSIONS.SYSTEM_RESTORE);
    if (guard) return guard;

    const tenantId = session!.tenantId;
    const body = await req.json();
    const { modelName, recordId } = body;

    if (!modelName || !recordId) {
      return NextResponse.json({ error: "Missing modelName or recordId" }, { status: 400 });
    }

    const validModels = ["employee", "invoice", "project", "task", "lead", "expense", "asset", "user"];
    const lowerModel = modelName.toLowerCase();
    
    if (!validModels.includes(lowerModel)) {
      return NextResponse.json({ error: "Invalid entity model" }, { status: 400 });
    }

    // Restore record by clearing soft delete fields
    const restored = await (rawDb as any)[lowerModel].update({
      where: { id: recordId, tenantId },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
    });

    // Audit restoring action
    await rawDb.auditLog.create({
      data: {
        tenantId,
        userId: session!.userId,
        action: AuditAction.UPDATE,
        resource: AuditResource.TENANT,
        details: `Restored soft-deleted ${lowerModel} record [${recordId}]`,
      },
    });

    return NextResponse.json({ success: true, restored });
  } catch (error: any) {
    console.error("Restore POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore record" }, { status: 500 });
  }
}
