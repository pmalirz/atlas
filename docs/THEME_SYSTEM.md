# Atlas Theme System Architecture

The Atlas Theme System is designed to be **type-safe**, **runtime-switchable**, and **semantically layered**. It decouples the *definition* of colors (in TypeScript) from their *usage* (in CSS), allowing for instant theme switching without page reloads or style duplication.

## 1. Internal Architecture

The system works in three distinct layers:

### Layer A: The Definition Layer (TypeScript)

Themes are defined as strict TypeScript objects adhering to the `AtlasTheme` interface. This ensures that every theme has exactly the same set of tokens (colors, shadows, gradients), preventing broken layouts when switching themes.

- **Location**: `src/themes/presets/*.ts`
- **Output**: A JavaScript object containing raw HSL color values (e.g., `'270 60% 55%'`).

### Layer B: The Injection Layer (Runtime)

When the app loads or a theme is switched, the `ThemeApplicator` component takes the active theme object and injects its values into the document's `:root` (or `html`) element as CSS Custom Properties (Variables).

- **Component**: `ApplyThemeToDocument` function
- **Action**: `document.documentElement.style.setProperty('--primary', '270 60% 55%')`

### Layer C: The Semantic Layer (CSS)

Components describe their styling using purely semantic names, referencing the CSS variables injected by Layer B. They never know *which* theme is active, only that they should use `var(--primary)` or `var(--card)`.

- **Location**: `src/index.css`
- **Usage**: `.atlas-card { background: var(--gradient-card, hsl(var(--card))); }`

---

## 2. Core Files & Structure

| File | Purpose |
|------|---------|
| `src/themes/types.ts` | **The Contract**. Defines the `AtlasTheme`, `ColorTokens`, and `GradientTokens` interfaces. Changing this changes the requirements for every theme. |
| `src/themes/presets/*.ts` | **The Content**. Individual theme files (e.g., `violet-dream.ts`, `corporate-blue.ts`). These MUST implement `AtlasTheme`. |
| `src/themes/registry.ts` | **The Library**. A central registry that exports `availableThemes`. Add new presets here to make them selectable in the UI. |
| `src/themes/apply-theme.ts` | **The Engine**. Contains the logic to map the TS object keys (`primary`, `sidebarRing`) to CSS variable strings (`--primary`, `--sidebar-ring`). |
| `src/themes/AtlasThemeProvider.tsx` | **The State**. A React Context provider that holds the `currentThemeId` and exposes the `setTheme` function to the app. |
| `src/index.css` | **The Schema**. Defines the semantic classes (`.atlas-card`, `.atlas-btn`) that consume the variables. |

---

## 3. How Switching Works

Theme switching is instant and client-side.

1. **User Action**: User calls `setTheme('corporate-blue')` via the `useAtlasTheme()` hook.
2. **State Update**: `AtlasThemeContext` updates its `currentTheme` state to the `corporate-blue` object found in the registry.
3. **Effect Trigger**: The `<ThemeApplicator>` component detects the change in `currentTheme`.
4. **Injection**: It calls `applyThemeToDocument()`, which overwrites the CSS variables on `<html>`.
    - Old: `--primary: 270 60% 55%;` (Violet)
    - New: `--primary: 220 80% 50%;` (Blue)
5. **Repaint**: The browser sees the global variables change and instantly repaints all components using `var(--primary)`. No HTML is re-rendered; only styles are recalculated.

## 4. How to Add a New Theme

1. **Create Preset**: Duplicate `src/themes/presets/default.ts` to `src/themes/presets/my-new-theme.ts`.
2. **Update Values**: Change the HSL values and gradient strings in the new file.
3. **Register**: Import your new theme in `src/themes/registry.ts` and add it to the `availableThemes` array.
4. **Done**: It will automatically appear in any theme switcher component using `useAtlasTheme()`.
