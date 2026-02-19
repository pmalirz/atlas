# Atlas Data Model

Atlas uses a **Generic Entity-Relation (E-R) Model** instead of traditional static tables for each domain object. This allows the system to be extended at runtime (e.g., adding a new "Service" entity type or a "Depends On" relation) without changing the database schema or deploying new code.

## 1. Core Data Structures

These tables store the actual business data.

### Entity (`entities`)

The `Entity` table is the central repository for all objects in the system. Whether it's an Application, a Server, a User, or a Business Process—it's stored here.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `entity_type` | String | Discriminator (e.g., `'application'`, `'server'`). Defined in `EntityDefinition`. |
| `name` | String | The display name of the entity. |
| `description` | String | A standard description field. |
| `attributes` | JSONB | **Dynamic fields**. Stores all type-specific data (e.g., `{ "lifecycle": "Active", "cost": 500 }`). Validated at runtime against the `EntityDefinition`. |
| `tenant_id` | UUID | For future multi-tenancy support. |

### Relation (`relations`)

The `Relation` table stores directional links between entities.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Unique identifier. |
| `relation_type` | String | Discriminator (e.g., `'app_uses_tech'`). Defined in `RelationDefinition`. |
| `from_entity_id` | UUID | The source entity. |
| `to_entity_id` | UUID | The target entity. |
| `attributes` | JSONB | **Dynamic fields**. Stores properties of the *relationship* itself (e.g., `{ "ownershipRole": "Product Owner" }`). Validated at runtime against the `RelationDefinition`. |

### AuditEvent (`audit_events`)

An append-only log of all changes in the system. Used for compliance and history tracking.

| Column | Type | Description |
| :--- | :--- | :--- |
| `action` | String | `create`, `update`, `delete`, `restore`. |
| `object_kind` | String | `entity` or `relation`. |
| `object_id` | UUID | ID of the changed object. |
| `before` / `after` | JSONB | Snapshots of the data before and after the change. |
| `actor` | String | User ID (UUID) or `db:username` (for direct SQL changes). |
| `source` | String | `application` (via API) or `direct_sql` (via migration/admin). |
| `request_id` | String | Correlation ID for tracing requests across the system. |

---

## 2. Metadata Layer (The "Schema")

These tables define the *structure* and *rules* for the dynamic data. They are what makes the generic model "safe" and usable.

### EntityDefinition (`entity_definitions`)

Defines a type of entity (e.g., "Application").

- **attributeSchema**: A JSON array defining the allowed attributes, their types, and validation rules.
- **Example**:
  ```json
  {
    "entityType": "application",
    "displayName": "Application",
    "attributeSchema": [
      { "key": "lifecycle", "typeRef": "lifecycle_stage", "required": true },
      { "key": "owner", "type": "string" }
    ]
  }
  ```

### RelationDefinition (`relation_definitions`)

Defines a type of relationship (e.g., "Application Uses Technology").

- **fromEntityType**: Allowed source entity type (or null for any).
- **toEntityType**: Allowed target entity type (or null for any).
- **attributeSchema**: Definitions for fields stored on the relation itself.
- **Example**:
  ```json
  {
    "relationType": "app_owned_by",
    "fromEntityType": "application",
    "toEntityType": "user",
    "attributeSchema": [
      { "key": "role", "typeRef": "ownership_role", "required": true }
    ]
  }
  ```

### TypeDefinition (`type_definitions`)

Reusable definitions for data types, especially Enums.

- **typeKey**: Unique key (e.g., `lifecycle_stage`).
- **options**: Array of allowed values (e.g., `["Plan", "Build", "Run", "Retire"]`).

---

## 3. UI Configuration

These tables control how the generic data is presented to the user. See the [UI Engine Guide](./UI_ENGINE_GUIDE.md) for details.

### UIEntityConfig (`ui_entity_config`)

Stores the layout and behavior for specific entity pages.

- **browseConfig**: Configuration for the list view (columns, filters, tile/table toggle).
- **detailConfig**: Configuration for the detail view (sections, field placement, widgets).

### UIGlobalConfig (`ui_global_config`)

Singleton table storing application-wide settings.

- **menuConfig**: JSON structure defining the main navigation menu (items, icons, ordering).
