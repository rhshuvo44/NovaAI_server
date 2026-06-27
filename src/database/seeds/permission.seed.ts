import { Permission } from '@constants/index';

export interface PermissionSeed {
  key: Permission;
  displayName: string;
  description: string;
  category: string;
}

export const PERMISSION_SEEDS: PermissionSeed[] = [
  {
    key: Permission.USER_READ,
    displayName: 'View Users',
    description: 'View user accounts and profiles',
    category: 'users',
  },
  {
    key: Permission.USER_WRITE,
    displayName: 'Manage Users',
    description: 'Edit user accounts, roles, and status',
    category: 'users',
  },
  {
    key: Permission.USER_DELETE,
    displayName: 'Delete Users',
    description: 'Permanently remove user accounts',
    category: 'users',
  },

  {
    key: Permission.DOCUMENT_READ,
    displayName: 'View Documents',
    description: 'View documents',
    category: 'documents',
  },
  {
    key: Permission.DOCUMENT_WRITE,
    displayName: 'Manage Documents',
    description: 'Create and edit documents',
    category: 'documents',
  },
  {
    key: Permission.DOCUMENT_DELETE,
    displayName: 'Delete Documents',
    description: 'Delete documents',
    category: 'documents',
  },

  {
    key: Permission.ROLE_MANAGE,
    displayName: 'Manage Roles',
    description: 'Create, edit, and delete roles',
    category: 'rbac',
  },
  {
    key: Permission.PERMISSION_MANAGE,
    displayName: 'Manage Permissions',
    description: 'Assign permissions to roles',
    category: 'rbac',
  },

  {
    key: Permission.SETTINGS_MANAGE,
    displayName: 'Manage Settings',
    description: 'Modify system-wide settings',
    category: 'settings',
  },

  {
    key: Permission.ANALYTICS_READ,
    displayName: 'View Analytics',
    description: 'View usage analytics and reports',
    category: 'analytics',
  },

  {
    key: Permission.AUDIT_READ,
    displayName: 'View Audit Logs',
    description: 'View the audit trail',
    category: 'audit',
  },

  {
    key: Permission.AI_USE,
    displayName: 'Use AI Features',
    description: 'Use AI chat, generation, and other features',
    category: 'ai',
  },
  {
    key: Permission.AI_MANAGE,
    displayName: 'Manage AI Settings',
    description: 'Configure AI provider settings and view usage',
    category: 'ai',
  },
];
