import db from "./db";
import { UserRoleType, AuditAction, AuditResource } from "@prisma/client";

/**
 * Standard System Permission Codes
 */
export const PERMISSIONS = {
  // User & Role Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  ROLE_MANAGE: "role:manage",
  
  // HR & Employee Module
  EMPLOYEE_CREATE: "employee:create",
  EMPLOYEE_READ: "employee:read",
  EMPLOYEE_UPDATE: "employee:update",
  EMPLOYEE_DELETE: "employee:delete",
  EMPLOYEE_SALARY_VIEW: "employee:salary:view",
  EMPLOYEE_SALARY_EDIT: "employee:salary:edit",
  
  // Attendance & Leaves
  ATTENDANCE_MARK: "attendance:mark",
  ATTENDANCE_READ: "attendance:read",
  ATTENDANCE_ADMIN: "attendance:admin",
  LEAVE_REQUEST: "leave:request",
  LEAVE_APPROVE: "leave:approve",
  
  // Projects & Tasks
  PROJECT_CREATE: "project:create",
  PROJECT_READ: "project:read",
  PROJECT_UPDATE: "project:update",
  PROJECT_DELETE: "project:delete",
  TASK_CREATE: "task:create",
  TASK_READ: "task:read",
  TASK_UPDATE: "task:update",
  TASK_ASSIGN: "task:assign",
  TASK_DELETE: "task:delete",
  
  // CRM & Leads
  LEAD_CREATE: "lead:create",
  LEAD_READ: "lead:read",
  LEAD_UPDATE: "lead:update",
  LEAD_DELETE: "lead:delete",
  
  // Finance & Invoices & Expenses
  INVOICE_CREATE: "invoice:create",
  INVOICE_READ: "invoice:read",
  INVOICE_UPDATE: "invoice:update",
  INVOICE_DELETE: "invoice:delete",
  EXPENSE_CREATE: "expense:create",
  EXPENSE_READ: "expense:read",
  EXPENSE_APPROVE: "expense:approve",
  EXPENSE_DELETE: "expense:delete",
  
  // Assets & Audit
  ASSET_MANAGE: "asset:manage",
  AUDIT_READ: "audit:read",
  SYSTEM_RESTORE: "system:restore",
} as const;

export type PermissionCode = typeof PERMISSIONS[keyof typeof PERMISSIONS] | string;

/**
 * Default Permissions Assigned to Standard System Roles
 */
export const ROLE_PERMISSION_MATRIX: Record<UserRoleType, string[]> = {
  SUPER_ADMIN: ["*"], // Wildcard full access
  COMPANY_ADMIN: ["*"], // Wildcard full access
  CEO: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_SALARY_VIEW,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.LEAD_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.EXPENSE_READ,
    PERMISSIONS.EXPENSE_APPROVE,
    PERMISSIONS.AUDIT_READ,
  ],
  CTO: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.PROJECT_CREATE,
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.ASSET_MANAGE,
  ],
  HR: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.EMPLOYEE_CREATE,
    PERMISSIONS.EMPLOYEE_READ,
    PERMISSIONS.EMPLOYEE_UPDATE,
    PERMISSIONS.EMPLOYEE_SALARY_VIEW,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_ADMIN,
    PERMISSIONS.LEAVE_APPROVE,
  ],
  FINANCE: [
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.EXPENSE_CREATE,
    PERMISSIONS.EXPENSE_READ,
    PERMISSIONS.EXPENSE_APPROVE,
    PERMISSIONS.EMPLOYEE_SALARY_VIEW,
  ],
  PROJECT_MANAGER: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.PROJECT_UPDATE,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.TASK_ASSIGN,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.LEAVE_REQUEST,
  ],
  DEVELOPER: [
    PERMISSIONS.PROJECT_READ,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.LEAVE_REQUEST,
  ],
  SUPPORT_AGENT: [
    PERMISSIONS.LEAD_READ,
    PERMISSIONS.TASK_READ,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.LEAVE_REQUEST,
  ],
  EMPLOYEE: [
    PERMISSIONS.TASK_READ,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.ATTENDANCE_MARK,
    PERMISSIONS.LEAVE_REQUEST,
  ],
};

/**
 * Enterprise Authorization Engine
 */

export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await db.user.findUnique({
    where: { id: userId, isDeleted: false },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) return [];

  // Super Admin / Company Admin Override
  if (user.role === UserRoleType.SUPER_ADMIN || user.role === UserRoleType.COMPANY_ADMIN) {
    return ["*"];
  }

  const permissionsSet = new Set<string>();

  // Include permissions from legacy/primary role enum default matrix
  const defaultMatrix = ROLE_PERMISSION_MATRIX[user.role] || [];
  defaultMatrix.forEach((p) => permissionsSet.add(p));

  // Include permissions from dynamic UserRoles -> Role -> RolePermissions
  for (const ur of user.userRoles) {
    if (ur.role.code === UserRoleType.SUPER_ADMIN || ur.role.code === UserRoleType.COMPANY_ADMIN) {
      return ["*"];
    }
    for (const rp of ur.role.rolePermissions) {
      permissionsSet.add(rp.permission.code);
    }
  }

  return Array.from(permissionsSet);
}

export function checkPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (userPermissions.includes("*")) return true;
  if (userPermissions.includes(requiredPermission)) return true;

  // Module wildcard check e.g. "employee:*" matches "employee:salary:view"
  const parts = requiredPermission.split(":");
  if (parts.length > 1) {
    const moduleWildcard = `${parts[0]}:*`;
    if (userPermissions.includes(moduleWildcard)) return true;
  }

  return false;
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (userPermissions.includes("*")) return true;
  return requiredPermissions.some((req) => checkPermission(userPermissions, req));
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  if (userPermissions.includes("*")) return true;
  return requiredPermissions.every((req) => checkPermission(userPermissions, req));
}
