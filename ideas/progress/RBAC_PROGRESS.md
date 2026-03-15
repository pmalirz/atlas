# RBAC System Implementation - Status Report

This document outlines the implementation status and technical guidelines for the fine-grained Role-Based Access Control (RBAC) system in Atlas.

## 🎯 Goal

Implement entity-level and attribute-level access control for the dynamic, model-agnostic engine with strict server-side enforcement and tenant isolation.

---

## 🚦 Current Status

**Progress: ~95% Complete**

- [x] **Phase 1: Database & Shared Library**
  - [x] Defined `Role`, `RolePermission`, and `UserRole` models in `schema.prisma`.
  - [x] Added and applied RBAC migrations (including audit triggers on RBAC tables).
  - [x] Refactored attribute-level model to operation-specific fields:
    - `readableAttributes`
    - `updatableAttributes`
  - [x] Updated shared Zod schemas/DTOs in `atlas-shared`.

- [x] **Phase 2: Backend Services (NestJS)**
  - [x] Implemented `RbacModule`, `RbacService`, and tenant-scoped `RbacController` (`:slug/rbac`).
  - [x] Implemented `EntityAccessGuard` for CRUD action checks.
  - [x] Implemented `AttributeAccessInterceptor` for read/write attribute filtering:
    - outbound response filtering uses `readableAttributes`
    - inbound write validation uses `updatableAttributes`
  - [x] Wired RBAC into `AppModule` and `EntitiesModule`.

- [x] **Phase 3: Seeding**
  - [x] Seeded default roles (Admin, Viewer) in `default-tenant.ts`.
  - [x] Updated E2E auth seed to use `readableAttributes`/`updatableAttributes`.
  - [x] Added explicit read-only-vs-updatable example role for `book` entity in E2E seed.

- [x] **Phase 4: UI Engine Support**
  - [x] Implemented `RbacContext` and `RbacProvider` integration.
  - [x] Updated UI RBAC helpers to use:
    - `getReadableAttributes`
    - `getUpdatableAttributes`
  - [x] Updated `FieldRenderer`:
    - hides non-readable attributes
    - renders readable-but-non-updatable fields as readonly
  - [x] Kept action-level permission gating (create/delete/update) in page actions.

- [~] **Phase 5: Verification & Testing**
  - [x] E2E test suite validated through root flow: `npm run test:e2e:clean`.
  - [x] Updated API RBAC E2E tests for read-vs-update semantics.
  - [ ] Add focused unit tests for `EntityAccessGuard`, `AttributeAccessInterceptor`, and `RbacService`.
  - [ ] Final security walkthrough and documentation pass.

---

## 🛠️ RBAC Engine Implementation Guidelines

The RBAC system is **model-agnostic**, **tenant-aware**, and enforced server-side as the source of truth.

### 1. Database & Schema Design

- **Roles & Permissions**: Roles are tenant-scoped. A permission maps role -> `resourceType` (`entity` / `relation`) + `resourceName` (type or `*`).
- **Entity-level CRUD booleans**: `canCreate`, `canRead`, `canUpdate`, `canDelete`.
- **Attribute-level operation masks**:
  - `readableAttributes` controls visibility
  - `updatableAttributes` controls mutation
  - `null` means unrestricted for that operation

### 2. Backend Enforcement Strategy

Access control uses defense-in-depth:

#### A. Entity Access Guard (`EntityAccessGuard`)

- Authorizes operation at resource level.
- Maps HTTP method to operation (`POST=create`, `GET=read`, `PATCH/PUT=update`, `DELETE=delete`).
- Rejects unauthorized requests with `403`.

#### B. Attribute Access Interceptor (`AttributeAccessInterceptor`)

- Enforces field-level read/write control on dynamic `attributes` JSON.
- **Outbound/Read**:
  - filters response attributes against effective `readableAttributes`.
- **Inbound/Write**:
  - validates requested attribute keys against effective `updatableAttributes`.
  - rejects mixed payloads to prevent partial unauthorized updates.

### 3. Permission Aggregation Rules

- Permissions are additive across roles.
- Matching permissions are evaluated across exact `resourceName` and wildcard (`*`).
- Attribute sets are unioned from all matched permissions per operation.
- No deny-list model is used in current schema; controls are explicit via readable/updatable sets.

### 4. UI Enforcement Strategy

- `RbacProvider` loads effective permissions from `/api/:slug/rbac/me`.
- `FieldRenderer` hides non-readable fields.
- Readable but non-updatable fields render in readonly mode.
- Action controls remain permission-gated in browse/detail/create UX.
- UI behavior is advisory UX; backend remains final enforcement point.

### 5. Compliance Notes (DORA / CRA)

- RBAC changes are auditable through RBAC table triggers and `audit_events`.
- Separation of read and update attribute permissions supports least-privilege and stronger evidence for access governance controls.
- Recommendation: include periodic review of role definitions and permission drift in compliance runbooks.

---

## ⏩ Next Steps

1. Add unit tests for `EntityAccessGuard`, `AttributeAccessInterceptor`, and `RbacService` aggregation edge cases.
2. Add API tests for relation-scoped (`resourceType = relation`) attribute permission scenarios.
3. Run a final RBAC security walkthrough focused on wildcard + specific permission combinations.
4. Keep this document aligned with future schema/migration updates.
