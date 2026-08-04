import { UserRole } from '@prisma/client';

export type Permission =
  | 'auth:me'
  | 'dashboard:view'
  | 'orders:list'
  | 'orders:view'
  | 'orders:updateStatus'
  | 'orders:assignDelivery'
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
  | 'additionals:list'
  | 'additionals:manage'
  | 'coupons:list'
  | 'coupons:manage'
  | 'customers:list'
  | 'customers:view'
  | 'customers:update'
  | 'deliveries:list'
  | 'deliveries:manage'
  | 'users:list'
  | 'users:manage'
  | 'establishment:view'
  | 'establishment:update'
  | 'qr:list'
  | 'qr:manage'
  | 'reports:view'
  | 'promotions:list'
  | 'promotions:manage'
  | 'banners:list'
  | 'banners:manage'
  | 'campaigns:list'
  | 'campaigns:manage'
  | 'cash:list'
  | 'cash:manage'
  | 'kds:view'
  | 'notifications:manage'
  | 'payments:manage'
  | 'favorites:manage';

const ALL_OWNER: Permission[] = [
  'auth:me',
  'dashboard:view',
  'orders:list',
  'orders:view',
  'orders:updateStatus',
  'orders:assignDelivery',
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
  'additionals:list',
  'additionals:manage',
  'coupons:list',
  'coupons:manage',
  'customers:list',
  'customers:view',
  'customers:update',
  'deliveries:list',
  'deliveries:manage',
  'users:list',
  'users:manage',
  'establishment:view',
  'establishment:update',
  'qr:list',
  'qr:manage',
  'reports:view',
  'promotions:list',
  'promotions:manage',
  'banners:list',
  'banners:manage',
  'campaigns:list',
  'campaigns:manage',
  'cash:list',
  'cash:manage',
  'kds:view',
  'notifications:manage',
  'payments:manage',
  'favorites:manage',
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: ALL_OWNER,
  ADMIN: ALL_OWNER.filter((p) => p !== 'users:manage').concat(['users:list']),
  MANAGER: [
    'auth:me',
    'dashboard:view',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'orders:assignDelivery',
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
    'additionals:list',
    'additionals:manage',
    'coupons:list',
    'coupons:manage',
    'customers:list',
    'customers:view',
    'customers:update',
    'deliveries:list',
    'deliveries:manage',
    'users:list',
    'establishment:view',
    'qr:list',
    'qr:manage',
    'reports:view',
    'promotions:list',
    'promotions:manage',
    'banners:list',
    'banners:manage',
    'campaigns:list',
    'campaigns:manage',
    'cash:list',
    'cash:manage',
    'kds:view',
    'notifications:manage',
    'payments:manage',
    'favorites:manage',
  ],
  ATTENDANT: [
    'auth:me',
    'dashboard:view',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'categories:list',
    'products:list',
    'additionals:list',
    'customers:list',
    'customers:view',
    'customers:update',
    'establishment:view',
    'promotions:list',
    'banners:list',
    'campaigns:list',
    'cash:list',
    'cash:manage',
    'kds:view',
    'favorites:manage',
  ],
  KITCHEN: [
    'auth:me',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'products:list',
    'categories:list',
    'kds:view',
  ],
  DELIVERY: [
    'auth:me',
    'orders:list',
    'orders:view',
    'orders:updateStatus',
    'deliveries:list',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsFor(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
