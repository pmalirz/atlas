# App Atlas Server

NestJS backend API for the App Atlas generic entity/relationship service (dynamic schema, no hardcoded models).

Latest workspace update: auth-facing UI pages share a theme-aware branding panel, dashboard cards/actions/recent items derive from runtime menu/entity data with RBAC-aware quick-create actions, Atlas UI now includes responsive mobile sidebar navigation with route-close + skip-link accessibility support, theme presets can now bind mode-aware shader backgrounds for authenticated main content (with Chromatic Silver dark mode using `aurora-veil`), UI renderers remain standardized on shadcn primitives with layout-only atlas classes, and server API contracts remain unchanged.

## Quick Start

```bash
# Install dependencies
npm install

# Start PostgreSQL (from project root)
cd .. && docker-compose up -d

# Build shared library (from project root)
# Required before running the server or seeds
npm run build -w atlas-shared && cd atlas-server

# Run database migrations
npm run db:migrate:deploy

# Start development server
npm run start:dev
```

Server runs at `http://localhost:3001` with API prefix `/api`.

---

## Architecture Overview

### Design Principles

- **Generic Entity Model**: Any entity type is stored in a single `entities` table with JSONB `attributes` (no hardcoded model lists)
- **Schema-Driven Validation**: Entity definitions (`entity_definitions` + `type_definitions`) drive validation, options, and personal-data flags
- **Type-safe Relations**: Relations stored in `relations` with typed `relation_type`, constrained by `relation_definitions`
- **Audit Compliance**: Append-only `audit_events` table for DORA/CRA regulatory requirements
- **RBAC Enforcement**: Entity-level and attribute-level permissions are enforced server-side (403 on unauthorized writes)
- **Soft Delete**: All entities support soft delete via `deleted_at`
- **Pluggable Auth**: Supports Native (JWT), Clerk, Logto, and SSO providers

### Directory Structure

```text
server/
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   ├── migrations/        # Database migrations
│   ├── seeds/             # Database seeds
│   └── init.sql           # PostgreSQL extensions setup
├── src/
│   ├── database/          # Database layer (Prisma + repositories)
│   │   ├── prisma.module.ts
│   │   ├── prisma.service.ts
│   │   ├── entity.repository.ts   # Generic entity CRUD
│   │   └── relation.repository.ts # Generic relation CRUD
│   ├── modules/           # Feature modules
│   │   ├── auth/          # /api/auth (Authentication)
│   │   ├── definitions/   # /api/definitions (Schema Metadata)
│   │   ├── email/         # Email provider & services
│   │   ├── entities/      # /api/entities/:entityType
│   │   ├── relations/     # /api/relations
│   │   └── ui-config/     # /api/ui-config (UI Schema)
│   ├── app.module.ts      # Root module
│   └── main.ts            # Application entry point
```

---

## Database

### Schema Design

The database uses a **generic entity-relation model**:

| Table | Purpose |
|-------|---------|
| `entities` | All domain objects with JSONB `attributes` |
| `relations` | Typed links between entities with JSONB `attributes` |
| `audit_events` | Immutable audit log for compliance (DORA/CRA) |
| `type_definitions` | Reusable enum/validation definitions (referenced via `typeRef`) |
| `entity_definitions` | Field metadata for validation and UI generation |
| `relation_definitions` | Allowed relation types with `attributeSchema` for relation attributes |

### Metadata Definitions

To support the dynamic model, the system relies on three key metadata tables:

- **EntityDefinition**: Defines the structure of an entity (e.g., "Application"), including its display name and allowed fields (`attributeSchema`).
- **RelationDefinition**: Defines an allowed link between entities (e.g., "Application owned by User"), including source/target entity type constraints and any attributes stored on the link itself (e.g., "Role").
- **TypeDefinition**: Defines reusable data types, primarily Enums (e.g., "Lifecycle Status"), that can be referenced by multiple entities or relations to ensure consistency.

### Entity Storage Pattern

Domain fields are split between columns and JSONB:

```text
<any entity type> → entities table
──────────────────────────────────
id, name, description  → Core columns
other fields           → attributes JSONB (validated by schema)
```

### Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create new migration
npm run db:migrate

# Apply migrations (production)
npm run db:migrate:deploy

# Push schema without migration (dev only)
npm run db:push

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed database with sample data
# Note: Ensure atlas-shared is built first
npm run db:seed

# Reset database (clean up all data and migrations)
npm run db:reset
```

---

## Testing

### E2E Tests

End-to-End tests are located in the `atlas-e2e` workspace. They cover API and UI flows using an **isolated test database** (`app_atlas_test`) and Dockerized environment.

RBAC API e2e coverage includes `atlas-e2e/tests/api/rbac.e2e-spec.ts` with tenant-scoped checks for:

- viewer/read-only user update denial on entities (`403`)
- regular user attribute-level read vs update enforcement on `book`
- no partial writes when a request includes non-updatable attributes

E2E seed users (from `prisma/seeds/e2e/e2e-auth.ts`):

- `e2e-admin@atlas.local` / `admin` (Admin role)
- `e2e-readonly-user@atlas.local` / `readonly` (Viewer role)
- `e2e-regular-user@atlas.local` / `regular` (book-scoped attribute-editor role)

See root `README.md` for instructions on running E2E tests.

### Unit Tests

Unit tests are co-located with the source code (e.g., `*.spec.ts` files).
Jest uses `tsconfig.spec.json` for unit tests, including workspace alias resolution for `@app-atlas/shared` and `@app-atlas/shared/zod`.

```bash
# Run unit tests
npm run test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## API Endpoints

All tenant-aware endpoints are scoped by slug: `/api/:slug/...` (for example, `/api/myatlas/entities/book`).

### Auth API

Handles authentication and user session management.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/config` | Get auth configuration (provider type, etc) |
| POST | `/api/auth/login` | Login (Native provider) |
| POST | `/api/auth/register` | Register new user (Native provider) |
| GET | `/api/auth/me` | Get current authenticated user |
| POST | `/api/auth/logout` | Logout |

### Generic Entities API

Unified interface for all entity types (entity types come from `entity_definitions`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/entities/:entityType` | List entities with pagination, search, filtering |
| POST | `/api/entities/:entityType` | Create entity (validated against schema) |
| GET | `/api/entities/:entityType/:id` | Get entity by ID |
| PATCH | `/api/entities/:entityType/:id` | Update entity |
| DELETE | `/api/entities/:entityType/:id` | Soft delete entity |
| POST | `/api/entities/:entityType/:id/restore` | Restore soft-deleted entity |

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Case-insensitive partial match on name |
| `filter` | JSON | Attribute filter, e.g., `{"status":"active"}` |
| `skip` | number | Pagination offset (default: 0) |
| `take` | number | Page size (default: 50, max: 100) |
| `orderBy` | string | Sort field: `name`, `createdAt`, `updatedAt` |
| `orderDirection` | string | Sort direction: `asc`, `desc` |
| `includeDeleted` | boolean | Include soft-deleted entities |

### Relations API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/relations` | List relations |
| POST | `/api/relations` | Create relation (validated against `relation_definitions`) |
| GET | `/api/relations/:id` | Get relation by ID |
| PATCH | `/api/relations/:id` | Update relation attributes |
| DELETE | `/api/relations/:id` | Soft delete relation |
| GET | `/api/relations/graph/:entityId` | Get relations for graph visualization. Query params: `depth` (1-5, default: 1), `exclude` (comma-separated types) |

### Definitions API (Schema Metadata)

Provides access to the dynamic data model definitions.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/definitions/entities` | List all entity definitions |
| GET | `/api/definitions/entities/:entityType` | Get definition for entity type |
| GET | `/api/definitions/entities/:entityType/resolved` | Get definition with resolved type references |
| GET | `/api/definitions/types` | List all type definitions |
| GET | `/api/definitions/types/:typeKey` | Get type definition by key |
| GET | `/api/definitions/relations` | List all relation definitions |
| GET | `/api/definitions/relations/:relationType` | Get relation definition |
| GET | `/api/definitions/relations/for-entity/:entityType` | Get relation definitions for entity type |

### UI Config API

Provides JSON configuration for the Server-Driven UI.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ui-config/entities` | Get all UI configurations |
| GET | `/api/ui-config/entities/:entityType` | Get UI config for specific entity |
| GET | `/api/ui-config/global` | Get global UI settings |
| GET | `/api/ui-config/menu` | Get main menu structure |

### RBAC API

Returns effective roles and permissions for the authenticated user in the active tenant.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/:slug/rbac/me` | Get current user roles and permissions |
| GET | `/api/:slug/rbac/roles` | List tenant roles with permissions |
| GET | `/api/:slug/rbac/users/:id/roles` | Get roles for a specific user |

### Swagger Documentation

When running in development, Swagger UI is available at:

```bash
http://localhost:3001/api/docs
```

---

## Key Components

### AuthModule

A pluggable authentication module supporting multiple providers:

- **Native**: Local email/password with JWT cookies.
- **Clerk/Logto/SSO**: External providers via OIDC/OAuth.

Configured via `AUTH_PROVIDER` env var.

### EntityRepository

Generic repository for all entity CRUD operations:

```typescript
// Create entity
await entityRepository.create({
  entityType: 'Application',
  name: 'My App',
  attributes: { status: 'active', criticality: 'high' }
});

// Find with filters
await entityRepository.findMany({
  entityType: 'Application',
  attributeFilters: { status: 'active' }
});

// Soft delete with audit
await entityRepository.softDelete(id, 'user@example.com');
```

### PrismaService

NestJS-integrated Prisma client with:

- Automatic connection on module init
- Graceful disconnect on shutdown
- Query logging in development

### Audit Events

All mutations automatically create audit events:

```typescript
// Audit event structure
{
  action: 'create' | 'update' | 'delete',
  objectKind: 'entity',
  objectType: 'Application',
  objectId: 'uuid',
  before: { /* previous state */ },
  after: { /* new state */ },
  actor: 'user@example.com'
}
```

### Email Module

Handles email transmission using a pluggable provider architecture:

- **EmailProvider**: Interface for implementing different email providers (Nodemailer, SendGrid, etc.).
- **NodemailerProvider**: Default SMTP implementation (supports Mailpit, Resend, etc.).
- **Services**: `EmailService` handles template generation and dispatch.

See the [Email Setup Guide](../docs/EMAIL_SETUP.md) for configuration.

---

## Dynamic Schema Validation

The server uses a **data-driven validation system** where validation rules come from the database, not code. This enables runtime schema changes without deployment.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SchemaValidatorService                       │
│  ┌────────────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │EntityDefinition│   │TypeDefinition│   │RelationDefinition│   │
│  │    (fields)    │   │   (enums)    │   │(attributeSchema) │   │
│  └──────┬─────────┘   └──────┬───────┘   └──────────┬───────┘   │
│         │                 │                     │              │
│         ▼                 ▼                     ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              ZodSchemaFactory                           │   │
│  │  Builds dynamic Zod schemas from field definitions      │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│  ┌────────────────────────┴────────────────────────────────┐   │
│  │                   Type Validators                        │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ │   │
│  │  │ String │ │ Number │ │Boolean │ │  Date  │ │  Enum  │ │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘ │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │              RelationTypeValidator                 │ │   │
│  │  │  Validates relation arrays with attribute schemas  │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Type Validators

Each validator implements the Strategy Pattern and handles specific field types:

| Validator | Types | Features |
|-----------|-------|----------|
| `StringTypeValidator` | `string`, `text` | min/max length, regex pattern |
| `NumberTypeValidator` | `number`, `decimal` | min/max bounds |
| `BooleanTypeValidator` | `boolean` | strict boolean validation |
| `DateTypeValidator` | `date`, `datetime` | ISO 8601 format validation |
| `EnumTypeValidator` | `typeRef` → enum | options from TypeDefinition |
| `RelationTypeValidator` | `relation` | validates relation arrays with attributes |

### Field Definition Structure

Fields in `EntityDefinition` support these properties:

```typescript
interface FieldDefinition {
  key: string;                    // Field name in attributes
  displayName: string;            // UI label
  type?: string;                  // 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'text' | 'relation'
  typeRef?: string;               // Reference to TypeDefinition (for enums)
  relType?: string;               // Reference to RelationDefinition (for relations)
  side?: 'from' | 'to';           // Optional explicit direction override
  required?: boolean;             // Is field required?
  isArray?: boolean;              // Array of primitive values?
  deprecated?: boolean;           // Skip in validation?
  group?: string;                 // UI grouping
  validation?: {
    min?: number;                 // Min length/value
    max?: number;                 // Max length/value
    pattern?: string;             // Regex pattern
  };
}
```

### Relation Fields

Relation fields (`type: 'relation'`) link to `RelationDefinition` via `relType`:

- Direction is inferred from `RelationDefinition.fromEntityType` and `RelationDefinition.toEntityType`.
- Optional field `side` (`from` or `to`) can override direction for symmetric or ambiguous cases.
- Relation fields no longer rely on a dedicated `incoming` metadata flag.

**EntityDefinition field:**

```json
{
  "key": "ownerships",
  "displayName": "Owners",
  "type": "relation",
  "relType": "app_owned_by",
  "group": "ownership"
}
```

**Direction override for a relation field:**

```json
{
  "key": "connectedInterfaces",
  "displayName": "Connected Interfaces",
  "type": "relation",
  "relType": "interface_connects",
  "side": "to"
}
```

**RelationDefinition with attributeSchema:**

```json
{
  "relationType": "app_owned_by",
  "displayName": "Owned By",
  "fromEntityType": "application",
  "toEntityType": "user",
  "attributeSchema": [
    {
      "key": "ownershipRole",
      "displayName": "Ownership Role",
      "typeRef": "ownership_role",
      "required": true
    }
  ]
}
```

**Validated input format:**

```json
{
  "ownerships": [
    { "targetId": "user-uuid-1", "ownershipRole": "owner" },
    { "targetId": "user-uuid-2", "ownershipRole": "delegate" }
  ]
}
```

### TypeDefinition (Enums)

Reusable enum types are stored in `type_definitions`:

```json
{
  "typeKey": "ownership_role",
  "displayName": "Ownership Role",
  "baseType": "enum",
  "options": ["owner", "business-owner", "technical-owner", "delegate"]
}
```

### Validation Flow

1. **Request received** → `PATCH /api/entities/application/:id`
2. **Load EntityDefinition** → Get field definitions for 'application'
3. **Load TypeDefinitions** → Resolve all `typeRef` fields (enums)
4. **Load RelationDefinitions** → Resolve all `relType` fields
5. **Build Zod schema** → Create dynamic schema from definitions
6. **Validate** → Run Zod validation on request body
7. **Return errors** → Structured error response if invalid

### Adding Custom Type Validators

Create a new validator implementing `TypeValidatorStrategy`:

```typescript
import { z, ZodTypeAny } from 'zod';
import { TypeValidatorStrategy, ValidatorContext } from './base-type-validator';

export class MyCustomValidator implements TypeValidatorStrategy {
  readonly priority = 15; // Higher = matched first (enum=20, relation=25)

  supports(context: ValidatorContext): boolean {
    return context.field.type === 'my-custom-type';
  }

  buildSchema(context: ValidatorContext): ZodTypeAny {
    return z.string().email(); // Example: custom email validation
  }
}
```

Register in `SchemaValidatorService.onModuleInit()`:

```typescript
this.schemaFactory.registerValidator(new MyCustomValidator());
```

### Testing Validators

Unit tests are in `src/modules/entities/validation/type-validators/`:

```bash
# Run all validation tests (96 tests)
npm run test -- --testPathPattern="validation"

# Run specific validator tests
npm run test -- --testPathPattern="relation-type-validator"
```

## Environment Variables

### Development (`.env`)

```env
DATABASE_URL="postgresql://atlas:atlas_dev_password@localhost:5432/app_atlas?schema=public"
PORT=3001
NODE_ENV=development

# Authentication
AUTH_PROVIDER="native"  # native | clerk | logto | sso
JWT_SECRET="replace_with_secure_secret"
JWT_EXPIRES_IN="7d"
```

### Testing (`.env.test`)

```env
DATABASE_URL="postgresql://atlas:atlas_dev_password@localhost:5432/app_atlas_test?schema=public"
PORT=3002
NODE_ENV=test
KEEP_TEST_DB=false
AUTH_PROVIDER="native"
```

---

## Development Workflow

### Adding a New Entity Type (schema-driven)

1. Insert `entity_definitions` entry defining fields (and groups, required flags, personal-data flags)
2. Insert any needed `type_definitions` for enums/validation (used by `typeRef`)
3. (Optional) Add `relation_definitions` entries to relate this entity to others
4. Seed updates in `prisma/seed.ts` so environments stay consistent

No NestJS module or controller is required—generic `/api/entities/:entityType` handles all types.

### Adding New Fields to an Entity

1. Update the entity’s definition (`entity_definitions.attributeSchema`) with the new field definition
2. Add/adjust `type_definitions` if the field uses a shared enum/typeRef
3. Seed changes in `prisma/seed.ts`
4. Add/adjust tests if validation rules change

### Best Practices

- **Explicit Return Types**: Controllers should utilize explicit return types (e.g., `Promise<EntityResponse>`) to enforce contract adherence and automatically generate accurate Swagger documentation.
- **DTOs**: Use shared DTOs from `atlas-shared` where possible to ensure type consistency between frontend and backend.
- **Performance Optimization**: When performing operations like `remove` that do not require entity relations, avoid using `findOne` (which fetches relations). Instead, use `schemaValidator.validateEntityType` combined with `getEntityOrThrow` for existence checks.

---

## Database Seeding

The application supports multiple seed files to populate the database with different initial datasets or models.

### Running Seeds

To list available seeds:

```bash
npm run db:seed
```

To run a specific seed (e.g., the default enterprise portfolio model):

```bash
npm run db:seed -- --seed eap
```

Available seeds are located in `prisma/seeds/`.

**Common Seeds:**

- `eap`: Enterprise Application Portfolio (default demo model with UI configuration)
- `e2e`: Minimal dataset used for end-to-end testing

### Creating Custom Seeds

Developers are encouraged to contribute custom models that serve as good scaffolding for different purposes. To add a new seed:

1. Create a new TypeScript file in `server/prisma/seeds/` (e.g., `my-custom-model.ts`).
2. Export a `seed` function that accepts a `PrismaClient` instance:

   ```typescript
   import { PrismaClient } from '@prisma/client';

   export async function seed(prisma: PrismaClient) {
     // Your seeding logic here
     await prisma.entity.create({ ... });
   }
   ```

3. Run it using `npm run db:seed -- --seed my-custom-model`.

We welcome contributions of new seeded models (e.g., for specific industries, regulatory frameworks, or organizational structures) to help others get started quickly!

---

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run start` | Start server |
| `npm run start:dev` | Start with hot reload |
| `npm run start:debug` | Start with debugger |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create migration |
| `npm run db:migrate:deploy` | Apply migrations |
| `npm run db:reset` | Reset database (clean up all data) |
| `npm run db:redeploy` | Full reset and re-apply EAP seed |
| `npm run db:studio` | Open Prisma Studio |

---

## Troubleshooting

### Database Connection Failed

```bash
# Ensure PostgreSQL is running
docker-compose up -d

# Check container status
docker ps | grep app-atlas-db

# View logs
docker logs app-atlas-db
```

### Migration Issues

```bash
# Reset database (DESTRUCTIVE)
npx prisma migrate reset

# Force push schema (dev only)
npm run db:push
```

### Test Database Not Cleaned

```bash
# Manually drop test database
docker exec app-atlas-db psql -U atlas -d postgres -c "DROP DATABASE IF EXISTS app_atlas_test"
```


