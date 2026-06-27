export enum Role {
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.USER]: 1,
  [Role.MANAGER]: 2,
  [Role.ADMIN]: 3,
  [Role.SUPER_ADMIN]: 4,
};

export enum Permission {
  // Users
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  // Documents
  DOCUMENT_READ = 'document:read',
  DOCUMENT_WRITE = 'document:write',
  DOCUMENT_DELETE = 'document:delete',
  // Roles & Permissions
  ROLE_MANAGE = 'role:manage',
  PERMISSION_MANAGE = 'permission:manage',
  // Settings
  SETTINGS_MANAGE = 'settings:manage',
  // Analytics
  ANALYTICS_READ = 'analytics:read',
  // Audit
  AUDIT_READ = 'audit:read',
  // AI
  AI_USE = 'ai:use',
  AI_MANAGE = 'ai:manage',
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  SYSTEM = 'system',
}

export enum UploadType {
  IMAGE = 'image',
  PDF = 'pdf',
  DOCUMENT = 'document',
  VIDEO = 'video',
}

export enum AIFeature {
  CHAT = 'chat',
  CONTENT_GENERATOR = 'content_generator',
  PROMPT_OPTIMIZER = 'prompt_optimizer',
  SUMMARIZER = 'summarizer',
  TAGS_GENERATOR = 'tags_generator',
  RECOMMENDATION = 'recommendation',
}

export enum QueueName {
  EMAIL = 'email-queue',
  NOTIFICATION = 'notification-queue',
  AI_PROCESSING = 'ai-processing-queue',
  SCHEDULED = 'scheduled-queue',
  DEAD_LETTER = 'dead-letter-queue',
}

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 60 * 15, // 15 minutes
  LONG: 60 * 60, // 1 hour
  DASHBOARD: 60 * 5, // 5 minutes
  ANALYTICS: 60 * 30, // 30 minutes
  SESSION: 60 * 60 * 24, // 24 hours
  AI_RESPONSE: 60 * 60 * 6, // 6 hours
  SEARCH: 60 * 10, // 10 minutes
  OTP: 60 * 5, // 5 minutes
  EMAIL_VERIFICATION: 60 * 60 * 24, // 24 hours
  PASSWORD_RESET: 60 * 30, // 30 minutes
} as const;

export const REDIS_KEY_PREFIX = {
  SESSION: 'session:',
  CACHE: 'cache:',
  RATE_LIMIT: 'rl:',
  OTP: 'otp:',
  EMAIL_VERIFY: 'email_verify:',
  PASSWORD_RESET: 'password_reset:',
  AI_RESPONSE: 'ai_response:',
  SEARCH: 'search:',
  LOCK: 'lock:',
  IDEMPOTENCY: 'idempotency:',
  DASHBOARD: 'dashboard:',
  ANALYTICS: 'analytics:',
} as const;

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const HTTP_HEADERS = {
  IDEMPOTENCY_KEY: 'idempotency-key',
  REQUEST_ID: 'x-request-id',
  API_KEY: 'x-api-key',
} as const;
