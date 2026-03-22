# Workflow Engine Guide

## Overview

The **Workflow Engine** is a rule-based state machine system that governs field-level state transitions on entities. It enables you to define complex business rules, enforce compliance requirements, and control data lifecycle workflows without hardcoding logic into your application.

### Key Capabilities

- **Dynamic State Machines**: Define transitions, conditions, and rules in JSON configuration
- **JavaScript Expression Evaluation**: Use flexible JS expressions for transition conditions
- **RBAC Integration**: Conditions can reference user roles and permissions
- **Entity Context**: Access entity attributes and metadata in rule evaluation
- **Automatic Enforcement**: Interceptor-based validation on entity updates
- **Multi-Tenancy**: Workflow definitions are tenant-scoped
- **UI Integration**: Frontend automatically filters available transitions based on rules

---

## Architecture

### Database Model

Workflow definitions are stored in the `WorkflowDefinition` table:

```prisma
model WorkflowDefinition {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String
  entityType String   // The entity type this workflow applies to (e.g., "book")
  field      String   // The JSON attribute this workflow governs (e.g., "status")
  config     Json     // The State Machine transitions JSON
  
  tenantId   String   @db.Uuid
  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @default(now()) @updatedAt

  @@unique([name, tenantId])
  @@index([tenantId])
  @@index([entityType])
}
```

### Backend Components

| Component | Purpose |
|-----------|---------|
| **WorkflowsService** | Core business logic for evaluating transitions and conditions |
| **WorkflowsController** | REST API endpoints for workflow operations |
| **WorkflowValidationInterceptor** | Automatic enforcement on entity PATCH operations |
| **WorkflowsModule** | NestJS module bundling all workflow components |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| **workflowsApi** | API client for fetching allowed transitions |
| **useAllowedTransitions** | React Query hook for workflow data |
| **EnumField** | UI component that filters options based on workflow rules |

---

## Workflow Configuration

### Structure

A workflow definition's `config` field contains a JSON object with the following structure:

```typescript
{
  "transitions": [
    {
      "name": "Transition Name",        // Optional: Human-readable name
      "from": ["state1", "state2"],     // Source states (empty = any state)
      "to": "targetState",              // Target state (required)
      "condition": "JS expression"      // Optional: JS condition (default = true)
    }
  ]
}
```

### Example: Book Status Workflow

```json
{
  "name": "Book Status Workflow",
  "entityType": "book",
  "field": "status",
  "config": {
    "transitions": [
      {
        "name": "Borrow",
        "from": ["available"],
        "to": "borrowed",
        "condition": "true"
      },
      {
        "name": "Return",
        "from": ["borrowed"],
        "to": "available",
        "condition": "true"
      },
      {
        "name": "Archive",
        "from": ["available", "borrowed"],
        "to": "archived",
        "condition": "$auth.roles && $auth.roles.includes('Admin')"
      }
    ]
  }
}
```

---

## Condition Expressions

### Available Context

Conditions are evaluated as JavaScript expressions with access to:

| Variable | Type | Description |
|----------|------|-------------|
| `$entity` | `EntityResponse` | The entity being updated (cloned for safety) |
| `$auth` | `AuthContext` | Current user authentication context |

### Auth Context Properties

```typescript
{
  id: string;           // User ID
  userId: string;       // User ID (alternative)
  sub: string;          // JWT subject
  tenantId: string;     // Tenant ID
  roles: string[];      // User role names (hydrated from RBAC)
}
```

### Entity Properties

```typescript
{
  id: string;
  entityType: string;
  attributes: Record<string, unknown>;  // Dynamic JSONB attributes
  createdAt: Date;
  updatedAt: Date;
  // ... other entity fields
}
```

### Example Conditions

```javascript
// Simple role check
"$auth.roles.includes('Admin')"

// Multiple roles (OR)
"$auth.roles.includes('Admin') || $auth.roles.includes('Manager')"

// Entity attribute check
"$entity.attributes.priority === 'high'"

// Complex condition
"$entity.attributes.status === 'draft' && $auth.userId === $entity.attributes.ownerId && $auth.roles.includes('Publisher')"

// Always allow (no condition or "true")
"true"
```

### Security Considerations

- Conditions execute in a **sandboxed VM context** with a **100ms timeout**
- Entity and auth objects are **deep-cloned** to prevent mutation
- Invalid expressions **fail closed** (deny transition)
- Only developers/admins should define workflow conditions
- Expressions cannot access Node.js APIs or external modules

---

## API Endpoints

### Get Allowed Transitions

Fetch valid target states for an entity based on workflow rules.

**Endpoint**: `GET /api/:slug/workflows/entities/:entityType/:id/allowed-transitions`

**Response**:
```json
{
  "status": ["borrowed", "archived"],
  "priority": ["high"]
}
```

**Use Case**: UI components use this to filter dropdown options.

### Execute Transition

Programmatically execute a state transition with workflow validation.

**Endpoint**: `POST /api/:slug/workflows/transitions/execute`

**Request Body**:
```json
{
  "entityId": "uuid",
  "workflowDefinitionName": "Book Status Workflow",
  "toState": "archived"
}
```

**Response**: Updated entity or `403 Forbidden` if transition is denied.

---

## Enforcement

### Automatic Validation

The `WorkflowValidationInterceptor` is applied to the `EntitiesController#patch` endpoint and automatically:

1. Detects when a workflow-governed field is being updated
2. Fetches the current entity state
3. Evaluates transition rules using `WorkflowsService.evaluateTransition`
4. Throws `403 Forbidden` if the transition is not allowed
5. Allows the update to proceed if valid

### Error Messages

When a transition is denied, users receive a descriptive error:

```
Update denied: You do not have permission or conditions are not met to transition 'status' to 'archived'.
```

---

## Frontend Integration

### Using the Hook

```typescript
import { useAllowedTransitions } from '@/hooks/useWorkflows';

function MyComponent({ entityType, entityId }) {
  const { data: allowedTransitions, isLoading } = useAllowedTransitions(
    entityType,
    entityId
  );

  // allowedTransitions = { status: ['borrowed', 'archived'], ... }
}
```

### EnumField Integration

The `EnumField` component automatically filters enum options based on workflow rules:

```typescript
// If workflow allows only ['borrowed', 'archived'] for status field
// EnumField will show only those options in the dropdown
<EnumField
  name="status"
  options={['available', 'borrowed', 'archived']}
  // Automatically filtered to ['borrowed', 'archived']
/>
```

### Cache Invalidation

When an entity is updated, the workflow query cache is invalidated to ensure fresh data:

```typescript
// In useEntities.ts
onSuccess: () => {
  queryClient.invalidateQueries(['workflows', 'allowed-transitions', entityType, id]);
}
```

---

## Seeding Workflows

### JSON Seed Files

Workflow definitions are stored in `atlas-server/prisma/seeds/e2e/data/workflow-definitions.json`:

```json
[
  {
    "name": "Book Status Workflow",
    "entityType": "book",
    "field": "status",
    "config": {
      "transitions": [...]
    }
  }
]
```

### Seed Loader

The seed loader automatically populates workflow definitions during `npm run db:seed:e2e`:

```typescript
// In seed-loader.ts
const workflowDefinitions = await loadJsonSeed('workflow-definitions.json');
await prisma.workflowDefinition.createMany({ data: workflowDefinitions });
```

---

## Testing

### Unit Tests

Full coverage in `workflows.service.spec.ts`:

- ✅ Transition allowed when condition evaluates to `true`
- ✅ Transition denied when condition evaluates to `false`
- ✅ Role hydration from RBAC when JWT roles are empty
- ✅ Transition allowed when no condition is provided
- ✅ Transition denied when `from` state doesn't match
- ✅ Complex expressions with entity and auth context
- ✅ Graceful handling of invalid JS expressions
- ✅ Timeout protection for infinite loops

### E2E Tests

**API Tests** (`atlas-e2e/tests/api/workflows.e2e-spec.ts`):
- Workflow definition CRUD operations
- Transition execution with rule enforcement
- RBAC integration and role-based conditions

**UI Tests** (`atlas-e2e/tests/ui/workflows.spec.ts`):
- EnumField filtering based on allowed transitions
- UI state updates after transitions
- Regular user vs. admin permission differences

---

## Use Cases

### Compliance & Audit

Enforce regulatory requirements (DORA, CRA) by controlling state transitions:

```json
{
  "name": "Compliance Review",
  "from": ["draft"],
  "to": "production",
  "condition": "$entity.attributes.securityReview === 'passed' && $entity.attributes.complianceCheck === 'approved'"
}
```

### Approval Workflows

Multi-stage approval processes:

```json
{
  "transitions": [
    {
      "name": "Submit for Review",
      "from": ["draft"],
      "to": "pending_review",
      "condition": "$entity.attributes.completeness >= 90"
    },
    {
      "name": "Approve",
      "from": ["pending_review"],
      "to": "approved",
      "condition": "$auth.roles.includes('Approver')"
    },
    {
      "name": "Reject",
      "from": ["pending_review"],
      "to": "rejected",
      "condition": "$auth.roles.includes('Approver')"
    }
  ]
}
```

### Lifecycle Management

Control asset/application lifecycle:

```json
{
  "transitions": [
    {
      "from": ["active"],
      "to": "deprecated",
      "condition": "$auth.roles.includes('Asset Manager')"
    },
    {
      "from": ["deprecated"],
      "to": "retired",
      "condition": "$entity.attributes.deprecatedSince && (Date.now() - new Date($entity.attributes.deprecatedSince).getTime()) > 90 * 24 * 60 * 60 * 1000"
    }
  ]
}
```

---

## Best Practices

### 1. Keep Conditions Simple

Prefer simple, readable conditions over complex logic:

```javascript
// Good
"$auth.roles.includes('Admin')"

// Avoid
"($auth.roles.includes('Admin') || $auth.roles.includes('SuperAdmin')) && $entity.attributes.status !== 'locked' && $entity.attributes.priority > 5"
```

### 2. Use Descriptive Transition Names

```json
{
  "name": "Submit for Approval",  // Clear intent
  "from": ["draft"],
  "to": "pending"
}
```

### 3. Document Complex Rules

Add comments in your seed files:

```json
{
  "name": "Archive (Admin Only)",
  "comment": "Only admins can archive items to prevent accidental data loss",
  "condition": "$auth.roles.includes('Admin')"
}
```

### 4. Test Thoroughly

Always test workflows with different user roles and entity states:

```typescript
// Test as regular user
await executeTransition({ toState: 'archived' }); // Should fail

// Test as admin
await executeTransition({ toState: 'archived' }); // Should succeed
```

### 5. Consider Performance

- Workflow evaluation is **async** (role hydration from RBAC)
- Conditions have a **100ms timeout**
- Avoid complex calculations in conditions

---

## Troubleshooting

### Issue: Transition Denied Unexpectedly

**Check**:
1. Current entity state matches `from` array
2. Condition expression is valid JavaScript
3. User has required roles (check `$auth.roles`)
4. Entity attributes are correctly set

**Debug**:
```typescript
// Add logging in WorkflowsService
this.logger.debug(`Evaluating: ${transition.condition}`);
this.logger.debug(`Context: ${JSON.stringify(sandbox)}`);
```

### Issue: Roles Not Available in Condition

**Solution**: Ensure `RbacService` is properly injected and user has `tenantId`:

```typescript
// WorkflowsService automatically hydrates roles if missing
const resolvedRoles = await this.resolveAuthRoles(effectiveAuthContext);
```

### Issue: UI Not Showing Allowed Options

**Check**:
1. `useAllowedTransitions` hook is enabled
2. Query cache is invalidated on entity updates
3. EnumField is using the workflow-filtered options

---

## Future Enhancements

### Planned Features

- **Visual Workflow Designer**: Drag-and-drop UI for creating workflows
- **Transition Hooks**: Execute custom logic on state changes
- **Audit Trail**: Log all transition attempts and outcomes
- **Bulk Transitions**: Apply transitions to multiple entities
- **Workflow Templates**: Pre-built workflows for common use cases
- **Advanced Expression Engine**: Replace VM with a more secure DSL

### Migration Path

The current implementation uses Node.js `vm` module for convenience and developer flexibility. For production environments requiring stricter security:

1. Consider replacing with a domain-specific language (DSL)
2. Implement a whitelist of allowed functions
3. Add rate limiting on condition evaluation
4. Implement workflow versioning for safe updates

---

## Related Documentation

- [**Data Model Guide**](./DATA_MODEL.md) — Understanding entity attributes and JSONB fields
- [**RBAC Guide**](./RBAC.md) — Role-based access control integration
- [**Audit System Guide**](./AUDIT.md) — Tracking workflow transitions in audit logs
- [**UI Engine Guide**](./UI_ENGINE_GUIDE.md) — Configuring entity forms and fields

---

## Summary

The Workflow Engine provides a powerful, flexible way to enforce business rules and state transitions in Atlas. By combining JSON configuration, JavaScript expressions, and RBAC integration, you can build sophisticated workflows that adapt to your domain requirements while maintaining security and compliance.

**Key Takeaways**:
- Workflows are defined in JSON and stored per-tenant
- Conditions use JavaScript expressions with `$entity` and `$auth` context
- Automatic enforcement via interceptor on entity updates
- UI automatically filters options based on allowed transitions
- Fully tested with unit and E2E coverage
