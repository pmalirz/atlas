# Role-Based Access Control (RBAC) Documentation

## Overview

Atlas implements a fine-grained, tenant-aware Role-Based Access Control (RBAC) system that provides both **entity-level** and **attribute-level** permissions. The system is designed to be **model-agnostic**, working seamlessly with the dynamic entity engine without requiring code changes when the data model evolves.

### Key Features

- **Tenant Isolation**: All roles and permissions are scoped to tenants
- **Entity-Level CRUD Control**: Granular create, read, update, delete permissions per entity type
- **Attribute-Level Permissions**: Separate control over readable vs updatable attributes
- **Wildcard Support**: Use `*` to grant permissions across all entity types
- **Additive Permissions**: Multiple roles combine to expand user capabilities
- **Server-Side Enforcement**: Backend validates all operations; UI adapts to permissions for better UX

---

## Database Schema

The RBAC system consists of three core tables:

### 1. `roles` Table

Defines named roles within a tenant.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Role name (unique per tenant) |
| `description` | TEXT | Human-readable description |
| `tenant_id` | UUID | Foreign key to tenant |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraint**: `(name, tenant_id)`

### 2. `role_permissions` Table

Maps roles to specific resource permissions with CRUD flags and attribute-level controls.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `role_id` | UUID | Foreign key to role |
| `resource_type` | VARCHAR(50) | Type of resource (`entity`, `relation`) |
| `resource_name` | VARCHAR(100) | Specific resource name or `*` for all |
| `can_create` | BOOLEAN | Permission to create new instances |
| `can_read` | BOOLEAN | Permission to read/view instances |
| `can_update` | BOOLEAN | Permission to update instances |
| `can_delete` | BOOLEAN | Permission to delete instances |
| `readable_attributes` | JSONB | Array of attribute keys user can read, or `null` for all |
| `updatable_attributes` | JSONB | Array of attribute keys user can update, or `null` for all |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Unique Constraint**: `(role_id, resource_type, resource_name)`

**Attribute Permission Logic**:
- `null` = unrestricted (all attributes allowed)
- `[]` (empty array) = no attributes allowed
- `["attr1", "attr2"]` = only listed attributes allowed

### 3. `user_roles` Table

Associates users with roles in a many-to-many relationship.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to user |
| `role_id` | UUID | Foreign key to role |
| `tenant_id` | UUID | Foreign key to tenant |
| `assigned_at` | TIMESTAMP | When role was assigned |

**Unique Constraint**: `(user_id, role_id, tenant_id)`

---

## Permission Model

### Entity-Level Permissions

Four boolean flags control CRUD operations:

- **`canCreate`**: User can create new entities of this type
- **`canRead`**: User can view/list entities of this type
- **`canUpdate`**: User can modify existing entities of this type
- **`canDelete`**: User can delete entities of this type

### Attribute-Level Permissions

Two JSONB arrays control field-level access:

- **`readableAttributes`**: Controls which attributes are visible in API responses
  - `null`: All attributes are readable
  - `[]`: No attributes are readable (entity metadata only)
  - `["attr1", "attr2"]`: Only listed attributes are readable

- **`updatableAttributes`**: Controls which attributes can be modified
  - `null`: All attributes are updatable (if `canUpdate` is true)
  - `[]`: No attributes are updatable (read-only entity)
  - `["attr1", "attr2"]`: Only listed attributes can be modified

**Important**: `updatableAttributes` is only enforced when `canUpdate: true`. If `canUpdate: false`, the user cannot update any attributes regardless of this field.

### Resource Matching

Permissions can target:
- **Specific entities**: `resourceName: "application"` applies only to the `application` entity type
- **All entities**: `resourceName: "*"` applies to all entity types
- **Relations**: `resourceType: "relation"` for relation-specific permissions

When evaluating permissions, the system checks both exact matches and wildcard matches, combining them additively.

---

## Permission Aggregation

When a user has multiple roles, permissions are **additive**:

1. All roles assigned to the user are evaluated
2. For each resource, all matching permissions (exact + wildcard) are collected
3. CRUD booleans are OR'd together (any `true` grants permission)
4. Attribute arrays are unioned (combined into a single set)
5. `null` in any permission makes that operation unrestricted

**Example**: If Role A allows `readableAttributes: ["title", "author"]` and Role B allows `readableAttributes: ["author", "isbn"]`, the effective permission is `["title", "author", "isbn"]`.

---

## Configuration Examples

### Example 1: Admin Role (Full Access)

```typescript
// Role
{
  name: "Admin",
  description: "Full administrative access",
  tenantId: "..."
}

// Permission
{
  roleId: adminRole.id,
  resourceType: "entity",
  resourceName: "*",              // Applies to all entities
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
  readableAttributes: null,       // All attributes readable
  updatableAttributes: null       // All attributes updatable
}
```

**Effect**: User can perform all operations on all entity types with full attribute access.

---

### Example 2: Viewer Role (Read-Only)

```typescript
// Role
{
  name: "Viewer",
  description: "Read-only access",
  tenantId: "..."
}

// Permission
{
  roleId: viewerRole.id,
  resourceType: "entity",
  resourceName: "*",
  canCreate: false,
  canRead: true,
  canUpdate: false,
  canDelete: false,
  readableAttributes: null,       // All attributes readable
  updatableAttributes: []         // No attributes updatable
}
```

**Effect**: User can view all entities and all their attributes but cannot create, update, or delete anything.

---

### Example 3: Selective Attribute Editor

```typescript
// Role
{
  name: "Book Status Editor",
  description: "Can update only status, tags, and rating on books",
  tenantId: "..."
}

// Permission
{
  roleId: bookEditorRole.id,
  resourceType: "entity",
  resourceName: "book",           // Only applies to 'book' entities
  canCreate: false,
  canRead: true,
  canUpdate: true,
  canDelete: false,
  readableAttributes: null,       // Can read all book attributes
  updatableAttributes: ["status", "tags", "rating"]  // Can only update these 3
}
```

**Effect**: 
- User can view all books with all their attributes
- User can update only `status`, `tags`, and `rating` fields
- Attempts to update `title`, `author`, `isbn`, etc. will be rejected by the server
- In the UI, non-updatable fields will render as read-only

---

### Example 4: Limited Read Access

```typescript
// Role
{
  name: "Application Viewer",
  description: "Can view only basic application info",
  tenantId: "..."
}

// Permission
{
  roleId: appViewerRole.id,
  resourceType: "entity",
  resourceName: "application",
  canCreate: false,
  canRead: true,
  canUpdate: false,
  canDelete: false,
  readableAttributes: ["name", "status", "owner"],  // Limited read access
  updatableAttributes: []
}
```

**Effect**:
- User can only see `name`, `status`, and `owner` fields of applications
- Other attributes (e.g., `description`, `criticality`, `biaRating`) are filtered out from API responses
- In the UI, non-readable fields are completely hidden

---

### Example 5: Multi-Role Combination

```typescript
// User has two roles:

// Role 1: "Book Reader"
{
  resourceName: "book",
  canRead: true,
  canUpdate: false,
  readableAttributes: ["title", "author", "isbn"]
}

// Role 2: "Book Status Manager"
{
  resourceName: "book",
  canRead: true,
  canUpdate: true,
  readableAttributes: ["status", "tags"],
  updatableAttributes: ["status", "tags"]
}

// Effective combined permissions:
{
  canRead: true,                                    // OR of both
  canUpdate: true,                                  // OR of both
  readableAttributes: ["title", "author", "isbn", "status", "tags"],  // Union
  updatableAttributes: ["status", "tags"]           // Union
}
```

**Effect**: User can read 5 attributes but only update 2 of them.

---

## Enforcement Points

### Backend (NestJS)

#### 1. Entity Access Guard

**File**: `atlas-server/src/modules/entities/guards/entity-access.guard.ts`

- Runs before request handlers
- Checks entity-level CRUD permissions
- Maps HTTP methods to operations:
  - `POST` → `canCreate`
  - `GET` → `canRead`
  - `PATCH/PUT` → `canUpdate`
  - `DELETE` → `canDelete`
- Returns `403 Forbidden` if permission denied

#### 2. Attribute Access Interceptor

**File**: `atlas-server/src/modules/entities/interceptors/attribute-access.interceptor.ts`

- Runs around request/response pipeline
- **Outbound (Read)**: Filters response `attributes` based on `readableAttributes`
- **Inbound (Write)**: Validates request payload against `updatableAttributes`
- Prevents partial unauthorized updates by rejecting entire request if any forbidden attribute is present

### Frontend (React)

#### 1. RBAC Context

**File**: `atlas-ui/src/auth/RbacContext.tsx`

Provides hooks and helpers:
- `useRbac()`: Access RBAC context
- `canPerformAction(entityType, action)`: Check CRUD permissions
- `getReadableAttributes(entityType)`: Get readable attribute list
- `getUpdatableAttributes(entityType)`: Get updatable attribute list

#### 2. Field Renderer

**File**: `atlas-ui/src/engine/renderers/FieldRenderer.tsx`

- Hides fields not in `readableAttributes`
- Renders fields as read-only if not in `updatableAttributes`
- Provides seamless UX that matches backend enforcement

#### 3. Action Guards

Pages and components conditionally render:
- Create buttons (check `canCreate`)
- Delete buttons (check `canDelete`)
- Edit mode (check `canUpdate`)

---

## API Endpoints

### Get Current User's Roles and Permissions

```
GET /api/:tenantSlug/rbac/me
```

**Response**:
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "Book Status Editor",
      "description": "...",
      "permissions": [
        {
          "id": "uuid",
          "resourceType": "entity",
          "resourceName": "book",
          "canCreate": false,
          "canRead": true,
          "canUpdate": true,
          "canDelete": false,
          "readableAttributes": null,
          "updatableAttributes": ["status", "tags", "rating"]
        }
      ]
    }
  ]
}
```

---

## Best Practices

### 1. Principle of Least Privilege

- Start with minimal permissions and expand as needed
- Use specific entity names instead of wildcards when possible
- Prefer explicit attribute lists over `null` for sensitive data

### 2. Role Design

- Create roles based on job functions, not individuals
- Keep role names descriptive and business-aligned
- Document role purposes in the `description` field

### 3. Attribute Permissions

- Use `readableAttributes` to hide sensitive fields (e.g., SSN, salary)
- Use `updatableAttributes` to prevent accidental modification of critical fields
- Remember: `updatableAttributes` is a subset of `readableAttributes` in practice

### 4. Testing

- Always test permission boundaries with E2E tests
- Verify both positive (allowed) and negative (denied) cases
- Test multi-role scenarios to ensure additive behavior works correctly

### 5. Audit and Compliance

- All RBAC table changes are automatically logged via audit triggers
- Review role assignments periodically
- Monitor `audit_events` for unauthorized access attempts
- Document role definitions for compliance evidence (DORA, CRA, etc.)

---

## Common Patterns

### Pattern 1: Department-Specific Access

```typescript
// Finance team can only see financial attributes
{
  resourceName: "application",
  readableAttributes: ["name", "budget", "costCenter", "owner"],
  updatableAttributes: ["budget", "costCenter"]
}
```

### Pattern 2: Approval Workflow

```typescript
// Approver can only change approval status
{
  resourceName: "application",
  canUpdate: true,
  updatableAttributes: ["approvalStatus", "approvalNotes"]
}
```

### Pattern 3: Data Steward

```typescript
// Can update metadata but not core business data
{
  resourceName: "*",
  canUpdate: true,
  updatableAttributes: ["tags", "description", "notes"]
}
```

### Pattern 4: Read-Only Auditor

```typescript
// Can read everything but update nothing
{
  resourceName: "*",
  canRead: true,
  canUpdate: false,
  readableAttributes: null,
  updatableAttributes: []
}
```

---

## Troubleshooting

### User Cannot See Expected Attributes

1. Check `readableAttributes` in all assigned roles
2. Verify `canRead: true` for the entity type
3. Check if attribute exists in entity's `attributes` JSONB
4. Review permission aggregation (union of all roles)

### User Cannot Update Specific Attributes

1. Verify `canUpdate: true` for the entity type
2. Check `updatableAttributes` includes the field
3. Ensure field is not system-managed (e.g., `id`, `createdAt`)
4. Check backend logs for validation errors

### Permission Changes Not Reflected

1. User may need to log out and back in to refresh token
2. Check if permission was updated in correct tenant
3. Verify role assignment in `user_roles` table
4. Clear browser cache if UI shows stale data

### Unexpected Permission Denials

1. Check for conflicting permissions across multiple roles
2. Verify wildcard (`*`) permissions are not being overridden
3. Review audit logs for the specific request
4. Test with a simplified single-role scenario

---

## Migration and Seeding

### Creating Roles Programmatically

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Create role
const role = await prisma.role.create({
  data: {
    name: 'Custom Role',
    description: 'Role description',
    tenantId: 'tenant-uuid'
  }
});

// Add permission
await prisma.rolePermission.create({
  data: {
    roleId: role.id,
    resourceType: 'entity',
    resourceName: 'application',
    canCreate: false,
    canRead: true,
    canUpdate: true,
    canDelete: false,
    readableAttributes: Prisma.DbNull,  // Use Prisma.DbNull for null
    updatableAttributes: ['status', 'tags']
  }
});

// Assign to user
await prisma.userRole.create({
  data: {
    userId: 'user-uuid',
    roleId: role.id,
    tenantId: 'tenant-uuid'
  }
});
```

### Seed File Example

See `atlas-server/prisma/seeds/default-tenant.ts` and `atlas-server/prisma/seeds/e2e/e2e-auth.ts` for complete examples.

---

## Security Considerations

1. **Server-Side Enforcement is Mandatory**: Never rely solely on UI hiding
2. **Validate All Inputs**: Interceptor validates attribute keys in write operations
3. **Audit All Changes**: RBAC tables have automatic audit triggers
4. **Tenant Isolation**: All queries are tenant-scoped to prevent cross-tenant access
5. **Token-Based Auth**: Permissions are embedded in JWT for stateless validation
6. **No Privilege Escalation**: Users cannot modify their own roles or permissions

---

## Related Documentation

- **Implementation Status**: See `docs/RBAC_PROGRESS.md` for current development status
- **Authentication**: See `docs/AUTHENTICATION.md` for login and session management
- **Data Model**: See `docs/DATA_MODEL.md` for entity and relation schemas
- **Audit System**: See `docs/AUDIT.md` for audit trail documentation
