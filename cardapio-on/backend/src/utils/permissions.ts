import { UserRole } from '@prisma/client';

export type Permission =
  | 'auth:me'
  | 'dashboard:view'
  | 'orders:list'
  | 'orders:view'
  | 'orders:updateStatus'
  | 'categories:list'
  | 'categories:create'
  | 'categories:update'
  | 'categories:delete'
  | 'categories:reorder'
  | 'products:list'
  | 'products:create'
  | 'products:update'
  | 'products:delete'
  | 'products:duplicate'
  | 'products:updatePrice'
  | 'establishment:view'
  | 'establishment:update';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
    'auth:me',
    'dashboard:view',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'categories:list',
    'categories:create',
    'categories:update',
    'categories:delete',
    'categories:reorder',
    'products:list',
    'products:create',
    'products:update',
    'products:delete',
    'products:duplicate',
    'products:updatePrice',
    'establishment:view',
    'establishment:update',
  ],
  ADMIN: [
    'auth:me',
    'dashboard:view',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'categories:list',
    'categories:create',
    'categories:update',
    'categories:delete',
    'categories:reorder',
    'products:list',
    'products:create',
    'products:update',
    'products:delete',
    'products:duplicate',
    'products:updatePrice',
    'establishment:view',
    'establishment:update',
  ],
  MANAGER: [
    'auth:me',
    'dashboard:view',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'categories:list',
    'categories:create',
    'categories:update',
    'categories:delete',
    'categories:reorder',
    'products:list',
    'products:create',
    'products:update',
    'products:delete',
    'products:duplicate',
    'products:updatePrice',
    'establishment:view',
  ],
  ATTENDANT: [
    'auth:me',
    'dashboard:view',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'categories:list',
    'products:list',
    'establishment:view',
  ],
  KITCHEN: [
    'auth:me',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'categories:list',
    'products:list',
  ],
  DELIVERY: [
    'auth:me',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error('Permissão insuficiente para esta ação.');
  }
}
