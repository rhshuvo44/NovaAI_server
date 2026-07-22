# Database Schema

MongoDB via Mongoose. All collections share these conventions (applied by `applyBasePlugin` / `baseSchemaOptions`):
- `createdAt`, `updatedAt` timestamps (automatic)
- `deletedAt: Date | null` soft-delete marker (except where noted)
- `toJSON` strips the Mongoose `__v` version key

## Collections

| Collection | Key fields | Indexes | Notes |
|---|---|---|---|
| **users** | `email` (unique), `passwordHash`, `role`, `isActive` | `email+deletedAt`, `role+isActive`, `createdAt` | Registered via `POST /auth/register` |
| **roles** | `name` (unique enum), `permissions[]`, `isSystemRole` | -- | Seeded; system roles cannot be deleted |
| **permissions** | `key` (unique enum), `category` | `category` | Read-mostly catalog, seeded |
| **refreshtokens** | `userId`, `tokenHash` (unique), `expiresAt` | TTL index on `expiresAt`, `userId+revokedAt` | Hard-deleted via MongoDB TTL, not soft-deleted |
| **documents** | `title`, `content`, `ownerId`, `categoryId`, `tags[]`, `isPublic` | text index on `title`+`content`, `ownerId+isArchived+createdAt`, `categoryId+isPublic` | `version` increments on every update |
| **categories** | `name`, `slug` (unique), `parentId`, `ownerId` | `slug` | Supports nesting via `parentId` |
| **tags** | `name`, `slug`, `ownerId`, `usageCount` | `ownerId+slug` (unique compound) | `aiGenerated` flag distinguishes user vs AI-created tags |
| **favorites** | `userId`, `entityType` (enum), `entityId` | `userId+entityType+entityId` (unique compound) | Polymorphic reference -- works across documents/prompts/chats |
| **notifications** | `userId`, `type`, `title`, `message`, `isRead` | `userId+isRead+createdAt` | Created by the notification worker, not written directly by controllers |
| **chats** | `userId`, `title`, `isArchived`, `messageCount`, `aiModel` | `userId+isArchived+lastMessageAt` | |
| **messages** | `chatId`, `userId`, `role` (user/assistant/system), `content`, `tokensUsed` | `chatId+createdAt` | Not soft-deleted (append-only conversation log) |
| **prompts** | `ownerId`, `title`, `content`, `feature`, `optimizedVersion` | -- | `optimizedVersion` populated on-demand via the prompt optimizer |
| **aiusages** | `userId`, `feature`, `provider`, `aiModel`, token counts, `latencyMs`, `cached`, `success` | `userId+createdAt`, `feature+createdAt` | Not soft-deleted; one row per AI call, used for billing/analytics |
| **uploads** | `ownerId`, `type`, `publicId` (unique), `url`, `secureUrl` | -- | Mirrors Cloudinary asset metadata |
| **analyticsevents** | `userId?`, `eventName`, `category`, `properties` | `category+createdAt`, `userId+createdAt` | Not soft-deleted; auto-tracked for every API request via `trackRequest` middleware |
| **auditlogs** | `actorId`, `action` (enum), `resourceType`, `resourceId`, `changes` | `resourceType+resourceId+createdAt` | Not soft-deleted; written by `AuditLogService.record()` |
| **apikeys** | `ownerId`, `keyHash` (unique), `keyPrefix`, `scopes[]`, `isActive`, `expiresAt` | `keyPrefix` | Raw key shown only once at creation; only the SHA-256 hash is stored |
| **locks** | `resource`, `instanceId`, `expiresAt` | unique on `resource` | Distributed locking via MongoDB upsert + TTL |
| **idempotencyrecords** | `key` (unique), `response`, `expiresAt` | TTL index on `expiresAt`, unique on `key` | Idempotency keys for safe retry of mutating operations |
| **settings** | `scope` (system/user), `ownerId?`, `key`, `value` (Mixed) | `scope+ownerId+key` (unique compound) | System settings cached in-memory; user settings read live |
| **tokenstores** | `key` (unique), `value`, `expiresAt` | TTL index on `expiresAt`, unique on `key` | Generic TTL-based token/OTP store — replaces Redis for short-lived data |
| **systemlogs** | `level`, `source`, `message`, `context` | `level+createdAt`, TTL on `createdAt` (30 days) | Auto-purged; written by scheduled jobs and infra-level events |

## Relationships

```
User --1:N--> Document, Category, Tag, Chat, Prompt, Notification, Favorite, Upload, ApiKey
User --1:1--> Role (by role name, not a hard FK -- role.name === user.role)
Document --N:1--> Category
Document --N:N--> Tag
Chat --1:N--> Message
Favorite --N:1 (polymorphic)--> Document | Prompt | Chat (via entityType + entityId)
```

## Why some collections skip soft delete

`RefreshToken` relies on a MongoDB TTL index for automatic expiry-based cleanup -- soft delete would leave expired tokens visible to `BaseRepository`'s default `deletedAt: null` filter logic unnecessarily, when a hard TTL is simpler and correct. `Message`, `AnalyticsEvent`, `AuditLog`, and `AIUsage` are intentionally append-only logs where "deleting" a historical record would undermine their purpose (conversation history, analytics accuracy, compliance trail, and usage billing respectively).
