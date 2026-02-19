# Atlas Shared

This package contains shared TypeScript types, enums, interfaces, and validation schemas (Zod) used by both the backend (`atlas-server`) and frontend (`atlas-ui`).

It acts as the **single source of truth** for the data contracts, ensuring end-to-end type safety across the monorepo.

## 📦 Contents

- **DTOs**: Data Transfer Objects for API requests and responses.
- **Enums**: Shared constants like `EntityStatus`, `UserRole`, etc.
- **Interfaces**: TypeScript interfaces for entities, relations, and configuration objects.
- **Validation Schemas**: Zod schemas used for runtime validation on the server and form validation on the client.
- **Type Guards**: Helper functions to narrow down types.

## 🛠 Usage

This package is a local workspace dependency.

### In `atlas-server`

Import types and schemas directly:

```typescript
import { CreateEntityDto } from '@app-atlas/shared';

// Use in controller
@Post()
create(@Body() createEntityDto: CreateEntityDto) { ... }
```

### In `atlas-ui`

Import types for props and state:

```typescript
import { Entity } from '@app-atlas/shared';

interface Props {
  entity: Entity;
}
```

## 🔄 Development

When you modify files in this package, the changes are immediately available to the consuming applications (if they are running in watch mode, they might need a restart depending on the bundler configuration).

To build the package explicitly:

```bash
npm run build
```
