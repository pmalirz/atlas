# RBAC System Implementation - Status Report

This document outlines the implementation plan, current progress, and technical guidelines for the fine-grained Role-Based Access Control (RBAC) system in the Atlas platform.

## 🎯 Goal

Implement entity-level and attribute-level access control to secure the generic model-agnostic engine.

---

## 🚦 Current Status

**Progress: ~90% Complete**

- [x] **Phase 1: Database & Shared Library**
  - [x] Define `Role`, `RolePermission`, and `UserRole` models in `schema.prisma`.
  - [x] Generate and apply database migrations.
  - [x] Implement PostgreSQL audit triggers for RBAC tables.
  - [x] Create Zod schemas and DTOs in `atlas-shared` for type safety across the stack.

- [x] **Phase 2: Backend Services (NestJS)**
  - [x] Create `RbacModule`, `RbacService`, and `RbacController`.
  - [x] Implement `EntityAccessGuard` to enforce CRUD permissions on entity types.
  - [x] Implement `AttributeAccessInterceptor` to filter JSON `attributes` based on allowed/denied lists.
  - [x] Wire RBAC into the `AppModule` and `EntitiesModule`.

- [x] **Phase 3: Seeding**
  - [x] Define default system roles (Admin, Viewer) in `default-tenant.ts`.
  - [x] Integrate role seeding into EAP and E2E seed loaders.
  - [x] Assign 'Admin' role to system admin and test users.

- [x] **Phase 4: UI Engine Support**
  - [x] Implementation of `RbacContext` and `useRbac` hook in `atlas-ui`.
  - [x] Global integration via `RbacProvider` in `App.tsx`.
  - [x] Dynamic field visibility (hiding fields) in `FieldRenderer` based on `deniedAttributes`.
  - [x] Action-level authorization (Create/Delete buttons) in Browse and Detail pages.
  - [x] Field-level read-only enforcement in `FieldRenderer` based on `update` permissions.

- [ ] **Phase 5: Verification & Testing**
  - [ ] Unit tests for Guard and Interceptor.
  - [ ] Playwright E2E tests for permission enforcement.
  - [ ] Final documentation walkthrough.

---

## 🛠️ RBAC Engine Implementation Guidelines

The RBAC system is designed to be **model-agnostic** while providing **strict security** at both the entity and attribute levels.

### 1. Database & Schema Design

We use a dedicated table structure for RBAC to maximize performance and ensure referential integrity for audit trails.

- **Roles & Permissions**: Roles are tenant-specific. Permissions map a role to a `resourceType` (e.g., `entity`) and `resourceName` (e.g., `application` or `*`).
- **Granular Booleans**: Access is controlled via `canCreate`, `canRead`, `canUpdate`, and `canDelete`.
- **JSON Attribute Masks**: `allowedAttributes` and `deniedAttributes` are JSON arrays of string keys used to filter the generic `attributes` JSONB blob.

### 2. Backend Enforcement Strategy

Access control is enforced via a two-layered defense-in-depth approach in NestJS:

#### A. Entity Access Guard (`EntityAccessGuard`)

- **Responsibility**: Authorize the requested operation on the entity type level.
- **Logic**:
  1. Extract `userId` and `tenantId` from the authenticated request user.
  2. Resolve the user's effective permissions for the specific `entityType`.
  3. Match the HTTP method to the corresponding permission flag (`POST` -> `create`, `GET` -> `read`, etc.).
  4. Throws `ForbiddenException` immediately if access is denied.

#### B. Attribute Access Interceptor (`AttributeAccessInterceptor`)

- **Responsibility**: Sanitize requests and responses based on field-level visibility.
- **Logic (Outbound/Read)**:
  - Intercepts the response stream and filters the `attributes` object in `EntityResponse` or `PaginatedResponse`.
  - Strips fields present in `deniedAttributes` or missing from `allowedAttributes` (if an allow-list is defined).
- **Logic (Inbound/Write)**:
  - Validates that the incoming `POST` or `PATCH` payload does not contain attributes the user lacks permission to modify.
  - Rejects the request with `ForbiddenException` if unauthorized fields are detected, preventing partial or "stealth" updates.

### 3. Engine-Level Considerations

- **Generic Handling**: The interceptor operates on the shared `attributes` field layout, ensuring it works for any entity type without code changes.
- **Permission Aggregation**: If a user has multiple roles, permissions are **additive** (Unions for allow lists, but note that `deniedAttributes` should typically be treated as a blacklist that overrides allow lists for safety).
- **UI Context**: The UI should consume the effective permissions (via `/rbac/me`) to proactively hide fields or disable actions, providing a smooth UX that matches the backend enforcement.

### 4. UI Enforcement strategy

The UI reacts dynamically to the permissions fetched during the authentication flow:

- **RbacProvider**: A context provider wraps the application, fetching and caching the user's effective permissions for the active tenant.
- **Granular Visibility**: The `FieldRenderer` checks `deniedAttributes` before rendering. If an attribute is restricted, the component returns `null`, effectively removing it from the DOM without leaving layout gaps.
- **Read-Only Protection**: If a user lacks `update` permission for an entity type, all fields are automatically rendered with the `readonly` prop set to `true`.
- **Action Guards**: Buttons for restricted actions (e.g., "Create", "Delete") are conditionally rendered only if the user has the corresponding permission flag.
- **Direct Access Protection**: Pages like `DynamicCreatePage` perform an immediate RBAC check on mount and render an access denied state if the user lacks the `create` permission.

--

## ⏩ Next Steps

1. Implement comprehensive Playwright E2E tests to verify backend rejection and UI hiding.
2. Add unit tests for `RbacService` and access guards.
3. Perform a final security audit of the `AttributeAccessInterceptor` logic.
4. Finalize the `walkthrough.md` documentation.
