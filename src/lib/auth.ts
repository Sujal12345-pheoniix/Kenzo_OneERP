import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import db from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "kenzo_oneerp_jwt_secret_key_123456789";

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
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
  // Try Cookie first
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload) return payload;
  }

  // Try Authorization Header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) return payload;
  }

  return null;
}

// Access roles definition
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COMPANY_ADMIN: "COMPANY_ADMIN",
  CEO: "CEO",
  CTO: "CTO",
  HR: "HR",
  FINANCE: "FINANCE",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  DEVELOPER: "DEVELOPER",
  SUPPORT_AGENT: "SUPPORT_AGENT",
  EMPLOYEE: "EMPLOYEE",
};

// Simple helper to check role authorization
export function hasRole(userRole: string, allowedRoles: string[]): boolean {
  if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.COMPANY_ADMIN) {
    return true; // Admins override standard roles
  }
  return allowedRoles.includes(userRole);
}
