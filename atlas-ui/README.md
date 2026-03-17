# Atlas UI

The frontend application for Atlas, built with React, Vite, and Tailwind CSS. It features a **Server-Driven UI** engine that dynamically renders pages based on configuration stored in the backend.

## 🚀 Tech Stack

- **Core**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Radix UI (primitives), `class-variance-authority`
- **State/Data**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Forms**: React Hook Form, Zod
- **Visualization**: @xyflow/react (React Flow), Dagre (graph layout)
- **Icons**: Lucide React

## 🏗️ Project Structure

```
atlas-ui/
├── src/
│   ├── api/          # API client and hooks (using TanStack Query)
│   ├── auth/         # Authentication context and providers
│   ├── components/   # Shared UI components (Button, Input, etc.)
│   ├── engine/       # The Server-Driven UI Engine
│   │   ├── registry/ # Component registry (mapping JSON keys to React components)
│   │   ├── renderers/ # Main renderers (SectionRenderer, TileRenderer, etc.)
│   │   └── schema/   # Zod schemas for the UI configuration
│   ├── hooks/        # Custom React hooks (useTheme, etc.)
│   ├── lib/          # Utilities (cn, date formatting)
│   ├── pages/        # Static pages (Layout, NotFound) and Dynamic page wrappers
│   └── themes/       # Theme definitions and applicator
```

## 🧩 Server-Driven UI Engine

The core of `atlas-ui` is the **UI Engine** located in `src/engine/`. It fetches JSON configuration from the backend (`UIEntityConfig`) and recursively renders the appropriate components.

For a deep dive into how to configure the UI, see the [**UI Engine Guide**](../docs/UI_ENGINE_GUIDE.md).

### Key Components

- **`DynamicBrowsePage`**: The page wrapper that fetches schema and data for the list view, switching between Tile and Table renderers.
- **`DynamicDetailPage`**: The page wrapper for the entity detail view, rendering sections and fields based on the schema.
- **`DynamicCreatePage`**: The page wrapper for creating new entities.
- **`SectionRenderer`**: Renders individual sections (cards, tabs, widgets) in the detail view.
- **`FieldRenderer`**: Renders individual data fields (text, number, boolean).
- **`RelationFieldRenderer`**: Specialized renderer for relation fields, selecting the appropriate component (Tags, Dialog, or Panel) based on attributes and direction.
- **`RelationGraphWidget`**: Interactive node graph widget for visualizing complex entity relationships (configured via `widget:relation_graph`).
- **`TileRenderer`**: Renders individual entity cards in the browse view.
- **`TableRenderer`**: Renders the entity data table in the browse view.

## 🎛️ UI Composition Standards

- Use shadcn primitives from `src/components/ui` as the default building blocks for cards, fields, tables, dialogs, badges, and buttons.
- Keep `atlas-*` classes for layout composition only (`atlas-page`, `atlas-content`, `atlas-sidebar*`).
- Avoid introducing new component-level `atlas-*` classes; compose behavior with shadcn + Tailwind utility classes instead.
- Treat legacy component-level `atlas-*` styles as compatibility-only and migrate them when touching related code.

## 🛠️ Getting Started

### Prerequisites

- Node.js >= 20
- Backend API running (usually on `http://localhost:3001`)
- Shared library built (`npm run build -w atlas-shared` from root)

### Installation

```bash
# Install dependencies (from root)
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

The app will run at `http://localhost:5173`.

### Build

```bash
# Build for production
npm run build

# Preview the build
npm run preview
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local` (if not present, create it).

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | The URL of the Atlas Server API | `http://localhost:3001/api` |

Type definitions for environment variables are in `src/vite-env.d.ts`.

## 🎨 Theme System

Atlas features a runtime-switchable theme system. Themes are defined in `src/themes/presets/` as TypeScript objects.

- **Changing Themes**: Use the Theme Switcher in the settings menu.
- **Adding Themes**: Add a new preset in `src/themes/presets/` and register it in `src/themes/registry.ts`.

See the [**Theme System Guide**](../docs/THEME_SYSTEM.md) for more details.

## 🧪 Testing

### End-to-End Tests

End-to-end tests covering the UI are located in the `atlas-e2e` package.

```bash
# Run UI E2E tests
npm run test:ui -w atlas-e2e
```

### Unit Tests

Unit tests for utility functions are co-located with the source code (e.g., `src/lib/utils.test.ts`).

They are designed to be run with `vitest`:

```bash
# Run unit tests (from root)
npx vitest run atlas-ui
```

> **Note:** See "Known Issues" regarding current execution limitations.

## 👨‍💻 Development Notes

### Tailwind Safelisting

The UI Engine generates dynamic grid classes (e.g., `col-start-1`, `col-span-2`) based on the layout configuration in the database. Since Tailwind CSS scans source files for class names at build time, these dynamic classes would normally be purged.

To prevent this, `atlas-ui/tailwind.config.ts` includes a `safelist` pattern:

```typescript
safelist: [
    { pattern: /^col-(start|span)-\d+$/ },
    { pattern: /^row-(start|span)-\d+$/ },
],
```

If you modify the layout logic to use different dynamic classes (e.g., flex gap utilities), ensure you update the safelist accordingly.

## ⚠️ Troubleshooting & Known Issues

- **@swc/core binding errors**: If you encounter errors related to `@swc/core` native bindings during build or test, try deleting `node_modules` and `package-lock.json` and running `npm install` again.
- **Radix UI TypeScript Errors**: You may see persistent TypeScript errors related to Radix UI component props (e.g., `className`, `children`). These are known type definition mismatches and do not affect runtime behavior.
- **Linting Errors**: You may encounter `ERR_MODULE_NOT_FOUND` for `@eslint/js` when running `npm run lint`. This is due to a known issue with the workspace dependency resolution.
- **Unit Test Execution**: Running unit tests (`npx vitest`) currently fails due to module resolution issues (e.g., `Cannot find package 'clsx'`). This is under investigation.
