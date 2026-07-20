"use client";

import { useEffect, useState, useCallback } from "react";
import { checkPermission, hasAnyPermission, hasAllPermissions } from "@/lib/rbac";

export interface SessionUser {
  userId: string;
  email: string;
  role: string;
  name: string;
  tenantId: string;
  permissions: string[];
}

export function usePermission() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error("Error fetching permission session:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const can = useCallback(
    (permissionCode: string): boolean => {
      if (!user) return false;
      return checkPermission(user.permissions || [], permissionCode);
    },
    [user]
  );

  const hasRole = useCallback(
    (roleCode: string): boolean => {
      if (!user) return false;
      if (user.role === "SUPER_ADMIN" || user.role === "COMPANY_ADMIN") return true;
      return user.role === roleCode;
    },
    [user]
  );

  const hasAny = useCallback(
    (permissionCodes: string[]): boolean => {
      if (!user) return false;
      return hasAnyPermission(user.permissions || [], permissionCodes);
    },
    [user]
  );

  const hasAll = useCallback(
    (permissionCodes: string[]): boolean => {
      if (!user) return false;
      return hasAllPermissions(user.permissions || [], permissionCodes);
    },
    [user]
  );

  return {
    user,
    loading,
    can,
    hasRole,
    hasAny,
    hasAll,
    permissions: user?.permissions || [],
    refetchSession: fetchSession,
  };
}
