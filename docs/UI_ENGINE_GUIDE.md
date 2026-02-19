# Atlas UI Engine Documentation

## Overview

Atlas uses a **Server-Driven UI** architecture. The structure, layout, and behavior of the frontend pages (`DynamicBrowsePage`, `DynamicDetailPage`, `DynamicCreatePage`) are defined by JSON schemas stored in the backend database. This allows for dynamic updates to the UI without redeploying the frontend application.

### Key Concepts

- **UISchema**: A backend model (Prisma: `UIEntityConfig`) containing `browseConfig` and `detailConfig` JSONs for a specific `entityType`.
- **EntityDefinition**: Defines the data fields, types, and validation rules (in `attributeSchema` column of `entity_definitions` table).
- **RelationDefinition**: Defines allowed relationships between entities, including potential attributes on the link itself (in `relation_definitions` table).
- **TypeDefinition**: Defines reusable types and enums (e.g., `lifecycle_stage`) that can be referenced by multiple entities (in `type_definitions` table).
- **ComponentRegistry**: A frontend system mapping string keys (e.g., `'field:star_rating'`) to React components.
- **Resolved Options**: Enum options are fetched dynamically from the `TypeDefinition` table on the backend.

---

## 1. UI Schema Structure

The UI Schema controls how pages look. It is defined in seed files (e.g., `server/prisma/seeds/eap/eap-ui.ts` for the EAP seed) and stored in the `UIEntityConfig` table.

### Browse Configuration (`browseConfig`)

Controls the list view (e.g., `/application`).

```typescript
interface BrowsePageSchema {
    title: string;          // Page H1 title
    description?: string;   // Page subtitle
    defaultView: 'tile' | 'table';
    allowCreate: boolean;   // Show "Create" button?
    createDialogFields?: string[]; // Fields to show in the creation view (subset of attributes)
    views: {
        tile: {
            enabled: boolean;
            layout: { columns: number }; // Grid columns count
            fields: Array<{
                field: string; // Key matching Entity field
                role: 'title' | 'subtitle' | 'description' | 'badge' | 'footer' | 'custom';
                format?: 'text' | 'number' | 'date' | 'datetime' | 'relative' | 'count' | 'badge'; // Optional formatter
            }>;
        };
        table: {
            enabled: boolean;
            columns: Array<{
                field: string;
                header: string;
                format?: 'text' | 'number' | 'date' | 'datetime' | 'relative' | 'count' | 'badge';
                sortable?: boolean;
            }>;
        };
    };
}
```

### Detail Configuration (`detailConfig`)

Controls the entity detail view (e.g., `/application/:id`).

```typescript
 interface DetailPageSchema {
    headerFields: string[]; // Fields to show in the page header (e.g. Name, Status)
    sections: Array<{
        id: string;
        title: string;
        type: 'card' | 'collapsible' | 'separator' | 'tabs' | 'custom' | 'widget';
        layout: { columns: number };
        fields: Array<{
            field: string;      // Key matching Entity field
            column: number;     // Grid column start (1-based)
            columnSpan?: number;// How many columns to span
            label?: string;     // Override display label
            component?: string; // Custom component key (e.g. 'field:star_rating')
            renderAs?: 'select' | 'chips' | 'radio' | 'input'; // Rendering mode for enum fields
            valueStyles?: Record<string, { label: string, color: string }>; // For badges
        }>;
    }>;
}
```

---

## 2. Component Registry

The frontend uses a registry pattern to decouple JSON configuration from React implementation.
File: `atlas-ui/src/engine/registry/component-registry.ts`
Registration: `atlas-ui/src/engine/registry/register-defaults.ts`

### keys

Make sure to follow the naming convention:

- Fields: `field:type_name` (e.g., `field:text`, `field:star_rating`)
- Sections: `section:type_name` (e.g., `section:card`)
- Layouts: `layout:type_name`

---

## 3. Default Mapping & Overrides

The UI Engine automatically selects a component based on the field type defined in the **EntityDefinition** (backend).

### Default Mapping

If no `component` is specified in the UI Schema, the engine uses these defaults:

| Entity Type | Component Key | Renders |
| :--- | :--- | :--- |
| `string` | `field:text` | Text Input |
| `text` | `field:textarea` | Multi-line Text Area |
| `number` | `field:number` | Number Input |
| `boolean` | `field:boolean` | Toggle / Checkbox |
| `enum` (or `typeRef`) | `field:enum` | Select Dropdown |
| `date` | `field:date` | Date Picker |
| `relation` | `field:relation` | Entity Link / Picker |

If a field has a `typeRef` that resolves to an Enum TypeDefinition, it will automatically map to `field:enum`.

### Overriding in UI Schema

You can override the default component for any field in the `detailConfig`.

**Example:**
A field `technicalFit` is of type `number`. By default, it renders as a numeric input (`field:number`).
To render it as stars, override the component in the schema:

```typescript
fields: [
    {
        field: 'technicalFit',
        column: 1,
        component: 'field:star_rating' // <--- OVERRIDE
    }
]
```

---

## 4. How to Create & Register a New Component

### Step 1: Create the Component

Create a new React component in `atlas-ui/src/engine/registry/field-components/`.
It must accept `FieldComponentProps<T>`.

**Example: `StarRatingField.tsx`**

```tsx
import type { FieldComponentProps } from '../component-registry';

export function StarRatingField({
    value,
    onChange,
    readonly,
    fieldSchema
}: FieldComponentProps<number>) {
    // Implement your UI logic here
    return (
        <div>
            {/* Render stars based on value */}
            <button onClick={() => onChange(5)}>★★★★★</button>
        </div>
    );
}
```

### Step 2: Register the Component

Import and register your component in `atlas-ui/src/engine/registry/register-defaults.ts`.

```typescript
import { StarRatingField } from './field-components/StarRatingField';

export function registerDefaultComponents() {
    // ...
    // Already registered in default registry
    registry.register('field:star_rating', {
        component: StarRatingField,
        category: 'field',
        description: 'Rating 1-5'
    });
}
```

### Step 3: Use in UI Schema

Update the seed file (e.g., `server/prisma/seeds/eap/eap-ui.ts`) to use your new component key.

```typescript
fields: [
    {
        field: 'technicalFit',
        column: 1,
        label: 'Tech Fit',
        component: 'field:star_rating' // <--- usage
    }
]
```

### Step 4: Apply Changes

Run the seed script to update the database configuration:

```bash
# In /server directory (or via npm from root)
npm run db:seed -w atlas-server -- --seed eap
```

---

## 5. Value Styles & Badges

For `enum` fields rendered as badges, you can define `valueStyles` directly in the schema. This maps raw values to labels and Tailwind CSS classes.

```typescript
valueStyles: {
    active: {
        label: 'Active',
        color: 'bg-emerald-100 text-emerald-800'
    },
    deprecated: {
        label: 'Deprecated',
        color: 'bg-amber-100 text-amber-800'
    }
}
```

This allows for visual semantic coloring without hardcoding styles in the frontend code.

---

## 6. Relation Components

Relations connect entities (e.g., Application → Technology). The UI Engine provides specialized components for rendering and editing relations.

### Relation Field Schema

In the EntityDefinition's `attributeSchema`, relation fields are defined with:

```typescript
{
    key: 'usesTechnologies',       // Field key
    displayName: 'Technologies',
    type: 'relation',              // Marks this as a relation field
    relType: 'app_uses_technology', // References RelationDefinition
    group: 'techstack'             // For grouping in UI sections
}
```

### Relation Definition (Backend)

Each `relType` references a `RelationDefinition` in the database:

```typescript
{
    relationType: 'app_uses_technology',
    displayName: 'Uses Technology',
    fromEntityType: 'application',  // Source entity type
    toEntityType: 'technology',     // Target entity type
    isDirectional: true,
    attributeSchema: null           // Optional relation attributes
}
```

### Component Auto-Detection

The UI Engine automatically selects the appropriate relation component based on:

| Condition | Component | Use Case |
| :--- | :--- | :--- |
| Incoming relation (entity is `toEntityType`) | `RelationPanelField` | External entities pointing to this one |
| Has `attributeSchema` | `RelationDialogField` | Relations with additional attributes |
| Default | `RelationTagsField` | Simple many-to-many relations |

**Detection Logic** (`relation-types.ts`):

```typescript
function inferRelationComponentType(fieldSchema, relationDef, entityType) {
    // 1. Explicit override from schema
    if (fieldSchema.relation?.componentType) return it;

    // 2. Auto-detect direction → panel for incoming
    if (isIncomingRelation(entityType, relationDef)) return 'panel';

    // 3. Has attributes → dialog
    if (relationDef?.attributeSchema?.length > 0) return 'dialog';

    // 4. Default → tags
    return 'tags';
}
```

### Direction Inference

The system automatically determines if a relation is **outgoing** or **incoming** based on the `RelationDefinition`:

```typescript
function inferRelationDirection(currentEntityType, relationDef, fieldSchema) {
    // Check if current entity matches fromEntityType → outgoing
    // Check if current entity matches toEntityType → incoming
}
```

**Example:**

- `app_uses_technology`: `from='application', to='technology'`
- When viewing an `application`: direction = **outgoing** (fetch `fromEntityId = appId`)
- When viewing a `technology`: direction = **incoming** (fetch `toEntityId = techId`)

### Symmetric Relations

For relations where the same entity type appears on both sides (e.g., `asset_depends_on_asset`), use the `side` attribute:

```typescript
// In EntityDefinition
{ key: 'dependsOn', relType: 'asset_depends_on_asset', side: 'from' }
{ key: 'dependedBy', relType: 'asset_depends_on_asset', side: 'to' }
```

If `side` is missing for symmetric relations, the system defaults to `'from'` and logs a dev warning.

### Relation Attributes

Some relations have additional attributes (e.g., `app_owned_by` has `ownershipRole`):

```typescript
// RelationDefinition.attributeSchema
[
    {
        key: 'ownershipRole',
        typeRef: 'ownership_role',  // References TypeDefinition for options
        required: true,
        displayName: 'Ownership Role'
    }
]
```

When `attributeSchema` exists, the `RelationDialogField` component renders a popover with:

1. Entity selector dropdown
2. Attribute fields (resolved from `TypeDefinition` for enum options)

### Relation Component Props

All relation components receive:

```typescript
interface RelationComponentProps {
    entityId: string;               // Current entity ID
    entityType: string;             // Current entity type
    fieldSchema: FieldSchema;       // Field definition
    relationDefinition?: RelationDefinition;
    value: RelationItem[];          // Current linked items
    onChange: (items: RelationItem[]) => void;
    readonly?: boolean;
    disabled?: boolean;
}
```

### API Hooks

| Hook | Purpose |
| :--- | :--- |
| `useOutgoingRelations(entityId, relType)` | Fetch relations where entity is source |
| `useIncomingRelations(entityId, relType)` | Fetch relations where entity is target |
| `useCreateRelation()` | Create a new relation |
| `useDeleteRelation()` | Delete a relation |
| `useRelationDefinitions()` | Fetch all relation definitions |
| `useTypeDefinitions()` | Fetch type definitions for attribute options |

### Overriding Relation Components

Force a specific component in the EntityDefinition:

```typescript
{
    key: 'ownerships',
    type: 'relation',
    relType: 'app_owned_by',
    relation: {
        componentType: 'dialog'  // Force dialog even without attributeSchema
    }
}
```

Available component types: `'tags'`, `'dialog'`, `'panel'`, `'chips'`, `'list'`, `'custom'`

---

## 7. Widgets

Widgets are specialized, non-field components used for complex visualizations (e.g., graphs, charts, dashboards). Unlike fields, widgets are configured as **Sections** in the Detail Page Schema.

### Widget Section Schema

To add a widget, define a section with `type: 'widget'` and specify the `component` key:

```typescript
{
    id: 'relationship-map',
    title: 'Relationship Map',
    type: 'widget',                // Marks this as a widget section
    component: 'widget:relation_graph', // Functionality implementation
    layout: { columns: 1 },
    fields: [],                    // Widgets usually don't have fields
    config: {                      // Widget-specific configuration
        maxDepth: 3,
        direction: 'LR'
    }
}
```

### Configurable Widgets

#### **Relation Graph Widget** (`widget:relation_graph`)

Interactive node graph visualizing entity relationships. Built using `@xyflow/react` and `dagre` for layout and rendering.

**Features:**
- **Drill-down:** Click nodes to expand their relations dynamically.
- **Filtering:** Client-side filter to toggle specific relation types.
- **Fullscreen:** Maximize the graph for better visibility.
- **Auto-layout:** Automatic DAG (Directed Acyclic Graph) layout.

**Configuration Options (`config`):**

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxDepth` | `number` | `3` | Maximum drill-down depth to prevent performance issues. |
| `direction` | `'LR'` \| `'TB'` | `'LR'` | Initial layout direction: Left-Right or Top-Bottom. |
| `excludeRelations` | `string[]` | `[]` | List of relation types to hide from the graph. |

**Example Config:**

```typescript
config: {
    maxDepth: 4,
    direction: 'TB',
    excludeRelations: ['app_owns_user', 'ticket_assigned_to']
}
```

### Creating Custom Widgets

1. **Register Component**: Register under `widget` category in `register-defaults.ts`.
2. **Implement Component**: Create component using `WidgetComponentProps`.

```typescript
export interface WidgetComponentProps {
    entityId: string;
    entityType: string;
    entity: Record<string, unknown>;
    schema: SectionSchema;
    config?: Record<string, unknown>; // Received from validation schema
}
```

---

## 8. Global UI Configuration

The `UIGlobalConfig` table stores settings that affect the entire application, primarily the main navigation menu.

### Menu Configuration

The `menuConfig` JSON field in `UIGlobalConfig` defines the structure of the sidebar menu.

**Structure:**

```typescript
interface MenuItem {
    entityType: string;
    displayName: string;
    icon?: string;          // Lucide icon name (e.g., 'LayoutDashboard')
    visible: boolean;
}

interface MenuConfig {
    items: MenuItem[];
}
```

**Example:**

```json
{
  "items": [
    {
      "entityType": "application",
      "displayName": "Applications",
      "icon": "AppWindow",
      "visible": true
    },
    {
      "entityType": "server",
      "displayName": "Servers",
      "icon": "Server",
      "visible": true
    }
  ]
}
```

---

## 9. API Integration

The frontend (UI Engine) hydrates its configuration by fetching data from the backend API.

### Endpoints

| Endpoint | Description |
| :--- | :--- |
| `GET /api/ui-config/entities/:entityType` | Fetches the `browseConfig` and `detailConfig` for a specific entity type. |
| `GET /api/ui-config/menu` | Fetches the main navigation menu configuration. |
| `GET /api/ui-config/global` | Fetches global UI settings (e.g., branding, theme defaults). |
| `GET /api/definitions/entities/:entityType/resolved` | Fetches the full entity definition including resolved types. |
| `GET /api/definitions/relations` | Fetches all relation definitions. |

### Hydration Flow

1. **App Load**: The application fetches `/api/ui-config/global` and `/api/ui-config/menu` to render the shell and navigation.
2. **Page Navigation**: When navigating to a Browse Page (e.g., `/application`) or Detail Page (e.g., `/application/123`), the engine fetches `/api/ui-config/entities/application`.
3. **Caching**: Responses are typically cached by `TanStack Query` to improve performance, but can be invalidated when configuration changes.
