import { Role, Permission } from '@constants/index';

export interface RoleSeed {
  name: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export const ROLE_SEEDS: RoleSeed[] = [
  {
    name: Role.USER,
    displayName: 'User',
    description: 'Standard user with access to their own content and AI features',
    permissions: [
      Permission.DOCUMENT_READ,
      Permission.DOCUMENT_WRITE,
      Permission.AI_USE,
      Permission.DOCUMENT_DELETE,
    ],
    isSystemRole: true,
  },
  {
    name: Role.MANAGER,
    displayName: 'Manager',
    description: 'Can view team analytics and manage documents across the workspace',
    permissions: [
      Permission.DOCUMENT_READ,
      Permission.DOCUMENT_WRITE,
      Permission.DOCUMENT_DELETE,
      Permission.AI_USE,
      Permission.ANALYTICS_READ,
      Permission.USER_READ,
    ],
    isSystemRole: true,
  },
  {
    name: Role.ADMIN,
    displayName: 'Admin',
    description: 'Full administrative access except role/permission system management',
    permissions: [
      Permission.USER_READ,
      Permission.USER_WRITE,
      Permission.USER_DELETE,
      Permission.DOCUMENT_READ,
      Permission.DOCUMENT_WRITE,
      Permission.DOCUMENT_DELETE,
      Permission.SETTINGS_MANAGE,
      Permission.ANALYTICS_READ,
      Permission.AUDIT_READ,
      Permission.AI_USE,
      Permission.AI_MANAGE,
    ],
    isSystemRole: true,
  },
  {
    name: Role.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Unrestricted access, including RBAC role and permission management',
    permissions: Object.values(Permission),
    isSystemRole: true,
  },
];
