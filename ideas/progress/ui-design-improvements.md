# Atlas UI Design Improvements

**Created:** 2026-03-17  
**Status:** 🟡 In Progress

---

## P0 — Critical

### 1. Auth Pages — Extract Branding Panel & Fix Hardcoded Colors
- [x] Create `AuthBrandingPanel.tsx` in `src/components/layout/`
  - Props: `subtitle: string`
  - Replace `bg-slate-50` → `bg-muted/30`
  - Replace `text-slate-900` → `text-foreground`
  - Replace `text-purple-700` → `text-primary`
  - Replace `text-slate-600` → `text-muted-foreground`
  - Replace hardcoded `rgba(147, 51, 234, ...)` particle colors → derive from `--primary`
  - Change "Atlas Platform" heading from `<h1>` to `<h2>` (single `<h1>` per page)
- [x] Update `LoginPage.tsx` — replace branding block with `<AuthBrandingPanel />`
- [x] Update `ForgotPasswordPage.tsx` — replace branding block with `<AuthBrandingPanel />`
- [x] Update `ResetPasswordPage.tsx` — replace branding block with `<AuthBrandingPanel />`
- [x] Update `VerifyEmailPage.tsx` — replace branding block with `<AuthBrandingPanel />`

### 2. Accessibility — Particles Background
- [x] Add `prefers-reduced-motion` check in `particles-background.tsx`
  - If reduced motion preferred: render static particles (single draw, no animation loop)
  - Add listener for live preference changes
- [x] Add fade-in animation on canvas mount (opacity 0 → 1 over 500ms)

---

## P1 — Typography & Fonts

### 3. Typography Upgrade
- [x] Update `index.css` font imports:
  - Remove `@import` for `Inter`
  - Remove `@import` for `Cormorant Garamond` (unused)
  - Add `@import` for `DM Sans` (body font)
  - Add `@import` for `Instrument Sans` (display/heading font)
  - Keep `IBM Plex Mono` (data/code — excellent choice)
  - Keep `Montserrat` as fallback
- [x] Update `tailwind.config.ts`:
  - `fontFamily.sans`: `['DM Sans', 'Montserrat', ...]`
  - Add `fontFamily.display`: `['Instrument Sans', 'DM Sans', ...]`

---

## P2 — Polish & Transitions

### 4. CSS Component Polish — `index.css`
- [x] `.atlas-card` — add `transition-shadow duration-200`
- [x] `.atlas-card:hover` — add `cursor-pointer`
- [x] `.atlas-table-row` — add `transition-colors duration-200`
- [x] `.atlas-sidebar-item` — add `transition-colors duration-150`

### 5. Button Component — `button.tsx`
- [x] Add `cursor-pointer` to the base `cva` class string (for `asChild` usage with links)

### 6. Heading Fixes — Auth Pages
- [x] `LoginPage.tsx` — `WELCOME BACK` → `Welcome Back`; tagline → "Enter your credentials to continue."
- [x] `ForgotPasswordPage.tsx` — `FORGOT PASSWORD` → `Forgot Password`
- [x] `ResetPasswordPage.tsx` — `RESET PASSWORD` → `Reset Password`
- [x] Add `autoFocus` to email field on `LoginPage`

### 7. Page Transitions — `AppLayout.tsx`
- [x] Add `animate-in fade-in duration-200` to `<main>` content area (uses existing `tailwindcss-animate`)

---

## P3 — Future Enhancements

### 8. Dashboard Page
- [x] Add entity count cards (dynamic, from API)
- [x] Add "Quick Actions" section (create new entity, recent items)
- [x] Add onboarding/empty-state illustration when data is sparse

### 9. Component Standardization
- [x] Document guidance: use shadcn components as first-class building blocks
- [x] Keep `atlas-*` classes only for layout composition (page, sidebar, content)
- [x] Deprecate component-level `atlas-*` classes that overlap shadcn (btn, card, field)

---

## Verification Checklist

- [x] `npm run build` passes with no errors
- [ ] Login page branding uses theme colors (not hardcoded slate/purple)
- [ ] Theme switching ("Chromatic Silver" ↔ "Violet Dream") affects branding panel
- [ ] Dark mode toggle affects branding panel
- [ ] `prefers-reduced-motion: reduce` stops particle animation
- [ ] Font rendering uses DM Sans (check via DevTools → Computed)
- [ ] Cards and sidebar items show smooth hover transitions
- [ ] Page navigation shows subtle fade-in
