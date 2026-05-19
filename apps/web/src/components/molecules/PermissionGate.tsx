'use client';

import { useAppStore } from '@/lib/store/useAppStore';
import type { UserPermissionFlags } from '@crm/shared-types';

interface PermissionGateProps {
  children: React.ReactNode;
  /** Render if this flag is true in user.permission_flags */
  permission?: keyof UserPermissionFlags;
  /** Render if clientSafeMode is OFF (i.e., show only when not in safe mode) */
  hideInSafeMode?: boolean;
  /** Fallback content when access is denied */
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, permission, hideInSafeMode, fallback = null }: PermissionGateProps) {
  const { user, clientSafeMode } = useAppStore();

  if (hideInSafeMode && clientSafeMode) return <>{fallback}</>;

  if (permission) {
    const allowed = user?.permission_flags?.[permission] ?? false;
    if (!allowed) return <>{fallback}</>;
  }

  return <>{children}</>;
}
