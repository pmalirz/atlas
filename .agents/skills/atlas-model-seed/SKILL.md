---
name: atlas-model-seed
description: "Atlas model & seed expert for Prisma schema changes, PostgreSQL trigger/function updates, migration authoring, and large seed file manipulation. Use PROACTIVELY when modifying schema.prisma, creating migrations, editing seed files, or adding/removing/renaming columns on audited tables."
---

# Atlas Model & Seed Expert

You are an expert in the Atlas project's data model layer. Your primary job is to ensure that **every model change cascades correctly** through: Prisma schema → migration SQL → audit triggers → seed files → shared types → documentation.

## When to Invoke This Skill

- Modifying `atlas-server/prisma/schema.prisma`
- Creating or editing migration SQL files
- Adding, removing, or renaming columns on any table
- Adding a new entity type, relation type, or type definition
- Editing seed files under `atlas-server/prisma/seeds/`
- Modifying shared Zod schemas in `atlas-shared/` that describe seed data

---

## 1. Architecture Overview

Atlas uses a **Generic Entity-Relation model** — all business objects are stored in a single `entities` table with JSONB `attributes`. Structure is defined at runtime via metadata tables (`EntityDefinition`, `RelationDefinition`, `TypeDefinition`).

### Key Directories

| Path | Purpose |
|:-----|:--------|
| `atlas-server/prisma/schema.prisma` | Prisma schema (10 models) |
| `atlas-server/prisma/migrations/` | Migration SQL (including triggers) |
| `atlas-server/prisma/init.sql` | PostgreSQL extensions (pgcrypto, pg_trgm, citext) |
| `atlas-server/prisma/seed.ts` | Seed runner (dispatches by name) |
| `atlas-server/prisma/seeds/shared/` | **Shared seed loader** (convention-based) |
| `atlas-server/prisma/seeds/eap/` | EAP seed (primary seed configuration) |
| `atlas-server/prisma/seeds/e2e/` | E2E test seed |
| `atlas-server/prisma/seeds/default-tenant.ts` | Default tenant constants & seeding |
| `atlas-server/src/modules/` | NestJS modules |
| `atlas-shared/` | Shared types, DTOs, Zod schemas |
| `docs/DATA_MODEL.md` | Data model documentation |
| `docs/UI_ENGINE_GUIDE.md` | UI engine documentation |

### Prisma Models (10 total)

| Model | Table Name | Has Audit Trigger? |
|:------|:-----------|:-------------------|
| `Tenant` | `tenants` | ❌ No |
| `Entity` | `entities` | ✅ Yes — `audit_entity_changes()` |
| `Relation` | `relations` | ✅ Yes — `audit_relation_changes()` |
| `User` | `users` | ✅ Yes — `audit_user_changes()` (strips `password_hash`) |
| `AuditEvent` | `audit_events` | ❌ No (this IS the audit table) |
| `TypeDefinition` | `type_definitions` | ✅ Yes — `audit_type_definition_changes()` |
| `EntityDefinition` | `entity_definitions` | ✅ Yes — `audit_entity_definition_changes()` |
| `RelationDefinition` | `relation_definitions` | ✅ Yes — `audit_relation_definition_changes()` |
| `UIEntityConfig` | `ui_entity_config` | ✅ Yes — `audit_ui_entity_config_changes()` |
| `UIGlobalConfig` | `ui_global_config` | ✅ Yes — `audit_ui_global_config_changes()` |
| `PasswordResetToken` | `password_reset_tokens` | ❌ No |
| `EmailVerificationToken` | `email_verification_tokens` | ❌ No |

---

## 2. Audit Trigger System

### How Triggers Work

Every audited table has:
1. A **PL/pgSQL function** (e.g., `audit_entity_changes()`) that reads session context (`app.current_user_id`, `app.request_id`) and inserts a row into `audit_events`
2. A **trigger** (e.g., `audit_entities_trigger`) that fires `AFTER INSERT OR UPDATE OR DELETE`

### Trigger INSERT Column List

All audit functions insert into `audit_events` with this column list:

```sql
INSERT INTO audit_events (
  id, occurred_at, actor, action, object_kind, object_id, object_type,
  before, after, request_id, source, tenant_id
  -- entity_id is ONLY included in audit_entity_changes()
)
```

### Current Trigger Functions (Latest Versions)

The latest versions of all triggers are in:
- `atlas-server/prisma/migrations/20260226205131_update_audit_triggers_tenantid/migration.sql`

Each function follows this pattern:
```sql
CREATE OR REPLACE FUNCTION audit_<table>_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor TEXT; v_request_id TEXT; v_action TEXT;
  v_before JSONB; v_after JSONB; v_source TEXT;
BEGIN
  -- Read session context
  v_actor := current_setting('app.current_user_id', true);
  v_request_id := current_setting('app.request_id', true);
  -- Determine source
  IF v_actor IS NULL OR v_actor = '' THEN
    v_actor := 'db:' || current_user;
    v_source := 'direct_sql';
  ELSE
    v_source := 'application';
  END IF;
  -- Capture before/after
  v_action := TG_OP;
  IF TG_OP = 'DELETE' THEN ... ELSIF TG_OP = 'INSERT' THEN ... ELSE ... END IF;
  -- Insert audit row (with tenant_id!)
  INSERT INTO audit_events (..., tenant_id) VALUES (..., COALESCE(NEW.tenant_id, OLD.tenant_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### Object Kind Mapping

| Trigger Function | `object_kind` | `object_type` Source |
|:-----------------|:--------------|:---------------------|
| `audit_entity_changes` | `'entity'` | `NEW.entity_type` / `OLD.entity_type` |
| `audit_relation_changes` | `'relation'` | `NEW.relation_type` / `OLD.relation_type` |
| `audit_user_changes` | `'user'` | `'user'` (hardcoded) |
| `audit_entity_definition_changes` | `'schema_entity'` | `NEW.entity_type` / `OLD.entity_type` |
| `audit_relation_definition_changes` | `'schema_relation'` | `NEW.relation_type` / `OLD.relation_type` |
| `audit_type_definition_changes` | `'schema_type'` | `NEW.type_key` / `OLD.type_key` |
| `audit_ui_entity_config_changes` | `'ui_config'` | `NEW.entity_type` / `OLD.entity_type` |
| `audit_ui_global_config_changes` | `'ui_config'` | `'global'` (hardcoded) |

### Special: User Trigger Strips Sensitive Data

The `audit_user_changes()` function removes `password_hash` from both `v_before` and `v_after`:
```sql
v_before := v_before - 'password_hash';
v_after := v_after - 'password_hash';
```

> **RULE**: If you add a new sensitive column to `users`, you MUST also strip it in the trigger.

---

## 3. Schema Change Workflows

### 3.1 Add/Remove/Rename Column on an Audited Table

**Mandatory Checklist:**

1. ☐ Edit `atlas-server/prisma/schema.prisma` — add/modify the field with proper `@map()` and `@db.*` annotations
2. ☐ Run `npx prisma migrate dev --name descriptive_name` to generate migration SQL
3. ☐ **CRITICAL** — Edit the generated migration SQL to include `CREATE OR REPLACE FUNCTION` for the affected table's audit trigger function:
   - If the column is referenced in the `INSERT INTO audit_events` column list → update the INSERT statement
   - If it's in `object_type` → update the COALESCE expression
   - If the column stores sensitive data (on `users` table) → add stripping logic
4. ☐ Update seed files if the column appears in seed data
5. ☐ Update `atlas-shared/` Zod schemas or DTOs if the column is exposed via API
6. ☐ Update `docs/DATA_MODEL.md` if it's a core table change
7. ☐ Update NestJS service/controller if the column is used in business logic

### 3.2 Add a New Audited Table

**Mandatory Checklist:**

1. ☐ Add model to `schema.prisma` with proper `@@map()`, `@@index()`, `@map()` annotations
2. ☐ Add `Tenant` relation with `tenantId` field (every data table is tenant-scoped)
3. ☐ Add audit fields (`createdAt`, `updatedAt`) and soft-delete fields if needed
4. ☐ Run `npx prisma migrate dev --name add_<table_name>`
5. ☐ **CRITICAL** — Add to migration SQL:
   - `CREATE OR REPLACE FUNCTION audit_<table>_changes()` following the existing pattern
   - `DROP TRIGGER IF EXISTS audit_<table>_trigger ON <table_name>;`
   - `CREATE TRIGGER audit_<table>_trigger AFTER INSERT OR UPDATE OR DELETE ON <table_name> FOR EACH ROW EXECUTE FUNCTION audit_<table>_changes();`
   - Include `tenant_id` in the INSERT into `audit_events`
6. ☐ Choose appropriate `object_kind` and `object_type` values
7. ☐ Add relation to `Tenant` model in schema.prisma
8. ☐ Update `docs/DATA_MODEL.md`
9. ☐ Update this SKILL.md's trigger inventory table

### 3.3 Add a New Entity Type (Dynamic — No Schema Change)

This only changes seed JSON files — no Prisma schema changes needed.

1. ☐ Add `TypeDefinition` entries for any new enums → `data/type-definitions.json`
2. ☐ Add `EntityDefinition` entry with `attributeSchema` → `data/entity-definitions.json`
3. ☐ Add `RelationDefinition` entries if the new type participates in relations → `data/relation-definitions.json`
4. ☐ Create `data/entity-<type>.json` with seed instances (auto-discovered by shared loader)
5. ☐ Add relation instances referencing new entities by name → `data/relations.json`
6. ☐ Add `UIEntityConfig` → `data/ui-entity-configs.json`
7. ☐ Add menu item → `data/ui-global-config.json`
8. ☐ Validate with Zod schemas: `TypeDefinitionDataSchema`, `AttributeDefinitionArraySchema`, `RelationDefinitionDataSchema`

### 3.4 Add a New Relation Type (Dynamic — No Schema Change)

1. ☐ Add `RelationDefinition` → `data/relation-definitions.json`
2. ☐ If the relation has attributes, add `attributeSchema` array with attribute definitions (using `typeRef` for enum types)
3. ☐ Add relation attribute descriptor in the source entity's `entity-definitions.json` with `type: 'relation'` and `relType: '<relation_type>'`
4. ☐ Optionally add an incoming relation descriptor in the target entity's definition
5. ☐ Add seed relation instances by entity name → `data/relations.json`
6. ☐ Validate with `RelationDefinitionDataSchema`
7. ☐ Update UI configs if the relation should appear in browse/detail views → `data/ui-entity-configs.json`

### 3.5 Add/Modify a TypeDefinition (Enum)

1. ☐ Add/modify in `data/type-definitions.json` with `typeKey`, `displayName`, `baseType`, `options[]`
2. ☐ Each option: `{ key, displayName, description? }`
3. ☐ Verify all `typeRef` references in `entity-definitions.json` and `relation-definitions.json` match the `typeKey`
4. ☐ Validate with `TypeDefinitionDataSchema`

---

## 4. Seed File Structure

### Seed Architecture (Shared Loader + JSON Data)

All seeds use a **shared convention-based loader** (`seeds/shared/seed-loader.ts`). Seed data lives in `data/` directories as JSON files. The loader auto-discovers `entity-*.json` files and resolves relations by entity name.

```text
prisma/seeds/
├── shared/
│   ├── seed-loader.ts         # Convention-based loader (seedModel, seedUI)
│   └── seed-types.ts          # Shared TypeScript interfaces
├── default-tenant.ts          # DEFAULT_TENANT_ID, seedDefaultTenant()
├── eap.ts                     # Re-exports seed() from eap/eap-index
├── eap/
│   ├── eap-index.ts           # Orchestrator (calls shared loader)
│   └── data/                  # JSON data files
│       ├── type-definitions.json
│       ├── entity-definitions.json
│       ├── relation-definitions.json
│       ├── entity-users.json
│       ├── entity-applications.json
│       ├── entity-*.json      # Auto-discovered by naming pattern
│       ├── relations.json     # Name-based entity references
│       ├── ui-entity-configs.json
│       └── ui-global-config.json
├── e2e.ts                     # Re-exports seed() from e2e/e2e-index
├── e2e/
│   ├── e2e-index.ts           # Orchestrator (calls shared loader + seedAuth)
│   ├── e2e-auth.ts            # E2E-specific auth user (bcrypt, stays in TS)
│   └── data/                  # JSON data files
│       ├── type-definitions.json
│       ├── entity-definitions.json
│       ├── relation-definitions.json
│       ├── entity-books.json
│       ├── entity-authors.json
│       ├── relations.json
│       ├── ui-entity-configs.json
│       └── ui-global-config.json
└── ...
```

### Shared Loader API

From any seed index file:

```typescript
import { seedModel, seedUI } from '../shared/seed-loader';
const DATA_DIR = path.join(__dirname, 'data');

await seedModel(prisma, tenantId, DATA_DIR);  // types → defs → entities → relations
await seedUI(prisma, tenantId, DATA_DIR);     // UI configs → menu
```

The loader auto-discovers `entity-*.json` files (sorted alphabetically for deterministic order) and resolves `relations.json` entries by entity name.

### Relation JSON Format (Name-Based Resolution)

Relations use entity names (not UUIDs) — the loader resolves them at runtime:

```json
{
    "relationType": "app_owned_by",
    "fromEntityName": "Enterprise CRM",
    "toEntityName": "John Smith",
    "attributes": { "ownershipRole": "functional-owner" }
}
```

### Seed Execution Order (Handled by Shared Loader)

```text
1. seedDefaultTenant()      → Tenant upsert (called by index)
2. seedModel(prisma, tid, dataDir):
   a. TRUNCATE audit_events, relations, entities, entity_definitions,
      relation_definitions, type_definitions CASCADE
   b. type-definitions.json       → TypeDefinition upserts
   c. entity-definitions.json     → EntityDefinition upserts
   d. relation-definitions.json   → RelationDefinition upserts
   e. entity-*.json (auto-discovered, sorted) → Entity creates
   f. relations.json              → Relation creates (name → ID resolution)
3. seedUI(prisma, tid, dataDir):
   a. ui-entity-configs.json      → UIEntityConfig creates
   b. ui-global-config.json       → UIGlobalConfig + menu
```

### Seed Patterns

**TypeDefinition pattern:**
```typescript
{
  typeKey: 'criticality',           // unique key, used in typeRef
  displayName: 'Criticality',
  baseType: 'enum',                 // string | text | number | decimal | date | datetime | enum
  options: [
    { key: 'low', displayName: 'Low', description: 'Minimal business impact if unavailable' },
    // ...
  ],
}
```

**EntityDefinition pattern:**
```typescript
{
  entityType: 'application',        // matches Entity.entityType
  displayName: 'Application',
  attributeSchema: [
    // Core fields (stored in entity columns, not attributes JSONB)
    { key: 'name', displayName: 'Name', type: 'string', required: true, group: 'basic' },
    { key: 'description', displayName: 'Description', type: 'text', group: 'basic' },
    // Typed attributes (stored in attributes JSONB)
    { key: 'status', displayName: 'Status', typeRef: 'application_status', group: 'basic' },
    { key: 'criticality', displayName: 'Criticality', typeRef: 'criticality', group: 'basic' },
    // Numeric with validation
    { key: 'rtoRequired', displayName: 'RTO Required (hours)', type: 'number', validation: { min: 0, max: 8760 }, group: 'bia' },
    // Boolean
    { key: 'isOutsourced', displayName: 'Is Outsourced', type: 'boolean', group: 'dora' },
    // Array
    { key: 'regulatoryScope', displayName: 'Regulatory Scope', type: 'string', isArray: true, group: 'regulatory' },
    // Relation reference (stored in relations table, not JSONB)
    { key: 'ownerships', displayName: 'Owners', type: 'relation', relType: 'app_owned_by', group: 'ownership' },
  ],
}
```

**Entity instance pattern:**
```typescript
prisma.entity.create({
  data: {
    entityType: 'application',      // must match an EntityDefinition
    name: 'Salesforce CRM',
    description: 'Cloud-based CRM platform',
    attributes: {                   // JSONB — keys must match attributeSchema
      status: 'active',
      criticality: 'critical',
      department: 'Sales',
      version: '2024.1',
      // ... all dynamic fields
    },
    updatedBy: 'seed',
    tenantId,                       // always include tenant_id!
  },
});
```

**RelationDefinition pattern** (in `relation-definitions.json`):

```json
{
  "relationType": "app_owned_by",
  "displayName": "Owned By",
  "fromEntityType": "application",
  "toEntityType": "user",
  "isDirectional": true,
  "attributeSchema": [
    { "key": "ownershipRole", "displayName": "Ownership Role", "typeRef": "ownership_role", "required": true }
  ]
}
```

**Relation instance pattern** (in `relations.json`):

```json
{
  "relationType": "app_owned_by",
  "fromEntityName": "Enterprise CRM",
  "toEntityName": "John Smith",
  "attributes": { "ownershipRole": "functional-owner" }
}
```

---

## 5. Working with Large Seed Files

Seed data lives in `.json` files under `data/` directories. This makes bulk operations trivial.

### Strategy: Use `jq-json-processing` Skill for Bulk Operations

With data in JSON files, you can use `jq` directly — no extraction step needed:

```bash
# Add a new field to ALL entity definitions
jq '.[].attributeSchema += [{"key": "newField", "displayName": "New Field", "type": "string", "group": "basic"}]' \
  entity-definitions.json > tmp.json && mv tmp.json entity-definitions.json

# Rename a typeRef across all attribute schemas
jq '.[].attributeSchema |= map(if .typeRef == "old_key" then .typeRef = "new_key" else . end)' \
  entity-definitions.json > tmp.json && mv tmp.json entity-definitions.json

# Add a new option to a type definition
jq 'map(if .typeKey == "criticality" then .options += [{"key": "extreme", "displayName": "Extreme"}] else . end)' \
  type-definitions.json > tmp.json && mv tmp.json type-definitions.json

# Add a field to all entities in a JSON file
jq '.[].attributes += {"newField": "default-value"}' \
  entity-books.json > tmp.json && mv tmp.json entity-books.json

# Validate JSON syntax
jq empty type-definitions.json  # exit code 0 = valid
```

### Strategy: Incremental Seed Editing

For simple changes, edit the JSON files directly:

- **Adding a new entity instance**: Add an object to the appropriate `data/entity-*.json` array
- **Adding a new attribute to an existing type**: Add the field descriptor to `entity-definitions.json`, then add sample values to all `entity-*.json` files
- **Adding a new entity type**: Create a new `data/entity-<type>.json` file — the shared loader auto-discovers it
- **Adding a new relation**: Add an entry to `data/relations.json` referencing entities by name

### Important: Seed Data Validation

All seed data is validated at insertion time using Zod schemas from `atlas-shared`:
- `TypeDefinitionDataSchema` — validates type definitions
- `AttributeDefinitionArraySchema` — validates entity definition attribute schemas
- `RelationDefinitionDataSchema` — validates relation definitions

If you add new fields to these schemas, update both the Zod schema AND the seed data.

---

## 6. File Impact Matrix

Use this matrix to identify ALL files that need updating for each change type:

| Change Type | schema.prisma | Migration SQL | Trigger SQL | data/*.json | atlas-shared | DATA_MODEL.md | NestJS Modules |
|:------------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Add column to audited table | ✅ | ✅ | ⚠️ **CRITICAL** | Maybe | Maybe | ✅ | Maybe |
| Add column to non-audited table | ✅ | ✅ | ❌ | Maybe | Maybe | ✅ | Maybe |
| Add new audited table | ✅ | ✅ | ⚠️ **CRITICAL** | Maybe | ✅ | ✅ | ✅ |
| Add new entity type (dynamic) | ❌ | ❌ | ❌ | ✅ | Maybe | ❌ | ❌ |
| Add new relation type (dynamic) | ❌ | ❌ | ❌ | ✅ | Maybe | ❌ | ❌ |
| Add/modify TypeDefinition (enum) | ❌ | ❌ | ❌ | ✅ | Maybe | ❌ | ❌ |
| Rename table or column | ✅ | ✅ | ⚠️ **CRITICAL** | ✅ | ✅ | ✅ | ✅ |
| Add index | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Legend**: ✅ = Always update | ⚠️ = Must update (commonly forgotten!) | Maybe = Depends on change | ❌ = No update needed

---

## 7. Common Mistakes to Avoid

### ❌ Forgetting `tenant_id` in Audit Trigger INSERT

Every audit trigger function MUST include `tenant_id` in the INSERT column list and `COALESCE(NEW.tenant_id, OLD.tenant_id)` in the VALUES. This was a real bug in the project history (see migration `20260226205131`).

### ❌ Forgetting to Update `TRUNCATE` in Seed

The `seedModel()` function starts with `TRUNCATE TABLE ... CASCADE`. If you add a new table that participates in foreign key relationships with existing tables, you may need to add it to the TRUNCATE list.

### ❌ Inconsistent `typeRef` Keys

When adding a new enum `TypeDefinition`, its `typeKey` must exactly match all `typeRef` references in `EntityDefinition.attributeSchema` and `RelationDefinition.attributeSchema`.

### ❌ Missing `tenantId` in Seed Upserts

Every upsert/create call must include `tenantId`. The unique constraint keys include `tenantId` (e.g., `type_definitions_key_tenant_unique`).

### ❌ Entity Attribute Keys Not Matching Schema

The keys used in `entity.create({ data: { attributes: { ... } } })` must match the `key` values in the corresponding `EntityDefinition.attributeSchema`.

### ❌ Sensitive Data Exposure in Audit

If you add a new sensitive column to the `users` table (like a token or secret), you MUST strip it in `audit_user_changes()` using: `v_before := v_before - 'column_name';`

---

## 8. Migration Conventions

### Naming

```bash
npx prisma migrate dev --name <action>_<table_or_feature>
# Examples:
# add_vendor_table
# rename_entities_schema
# update_audit_triggers_tenantid
```

### SQL Conventions in Migration Files

- Use `CREATE OR REPLACE FUNCTION` (not just `CREATE FUNCTION`) so migrations can be re-applied
- Use `DROP TRIGGER IF EXISTS` before `CREATE TRIGGER`
- Use descriptive section headers with `-- ============` comment blocks
- Always test triggers with INSERT, UPDATE, and DELETE operations

### Running Seeds

```bash
# Run a specific seed
npx prisma db seed -- --seed eap

# Available seeds: eap, e2e, default-tenant
```

---

## 9. Quick Reference Commands

```bash
# Validate Prisma schema
npx prisma validate

# Generate migration
npx prisma migrate dev --name <name>

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Run specific seed
npx prisma db seed -- --seed eap

# Check migration status
npx prisma migrate status
```
