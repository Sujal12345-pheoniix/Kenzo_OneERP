import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { UserRoleType } from "@prisma/client";
import db, { rawDb } from "./db";
import { getUserPermissions, checkPermission } from "./rbac";

const JWT_SECRET = process.env.JWT_SECRET || "kenzo_oneerp_jwt_secret_key_123456789";

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRoleType;
  permissions?: string[];
  tenantId: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function getSession(req: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  // 1. Try Cookie first
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) {
    token = cookieToken;
  }

  // 2. Try Authorization Header
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Enrich with dynamic DB permissions to ensure instantaneous RBAC updates
  try {
    const permissions = await getUserPermissions(payload.userId);
    return {
      ...payload,
      permissions,
    };
  } catch (error) {
    return payload;
  }
}

// Enterprise RBAC Guard for Next.js API Routes
export function requirePermission(session: SessionPayload | null, permissionCode: string): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: "Unauthorized: Session missing or expired" }, { status: 401 });
  }

  const allowed = checkPermission(session.permissions || [], permissionCode);
  if (!allowed) {
    return NextResponse.json(
      { error: `Forbidden: Missing required permission [${permissionCode}]` },
      { status: 403 }
    );
  }

  return null; // Null means authorization passed cleanly
}

// Access roles definition for backwards compatibility
export const ROLES = UserRoleType;

export function hasRole(userRole: UserRoleType, allowedRoles: UserRoleType[]): boolean {
  if (userRole === UserRoleType.SUPER_ADMIN || userRole === UserRoleType.COMPANY_ADMIN) {
    return true;
  }
  return allowedRoles.includes(userRole);
}
