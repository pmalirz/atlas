---
trigger: always_on
---

# Project Rules & Instructions

## About the Project

This project is a **generic, low-code platform** for **dynamic fields** and entity management.
The entire stack (UI and Server) is **model-agnostic**. No assumptions about the data model (entities, types, or relations) are baked into the core code.
Entities, types, and relations are dynamic and can be changed at runtime via schema descriptors.

### Available Seeds

**Enterprise Application Portfolio (EAP)** is a primary **seed** configuration designed for asset inventory management. It includes:

- Compliance with regulatory acts like **DORA**, **CRA**, and general **CIA** requirements.
- Holistic views combining EAP, CMDB, Vendor, License, and Contract Management.
- *Note*: This is not a ticketing or ITSM tool; it is a quality-focused inventory and EA management tool.

### Modeling Guidelines

- Aim for modern, simplified UX that helps users maintain inventory quality easily.

## Server

Built with **NestJS**, **Prisma**, and **PostgreSQL**.

- The server must remain model-agnostic.
- Dynamic schema changes must be supported without code redeployment.
- Use a hybrid storage approach: core columns for identity/metadata and **JSONB** for dynamic attributes.

## UI

Implemented in the `atlas-ui` folder.

- Totally generic and dynamic, driven by **schema descriptors**.
- No hardcoded fields, types, or relations in the rendering logic.
- UI components must be capable of rendering any schema-defined structure.

## Important Design and Code considerations

- **Platform-First**: Every feature should be implemented as a generic platform capability unless it is explicitly part of a seed script.
- **Shared Library**: All types, DTOs, and constants shared between `atlas-server` and `atlas-ui` must be defined in `atlas-shared`.
- **Security First**: OWASP Top 10, input validation, JWT auth, RBAC, and data encryption.
- **TypeScript Excellence**: Strict mode, proper typing (no `any`), and comprehensive error handling.
- **React Best Practices**: Functional components, hooks, state management, memoization, and accessibility.
- **NestJS Standards**: Dependency injection, guards, interceptors, and validation pipes.

## Clean Code & Linting Rules

- **Strict Typing**: Avoid `any` and `unknown` in models and types whenever possible. Always aim to narrow down to a specific type.
- **Type Sharing**: Ensure strict type safety across the network boundary. Types and DTOs (traveling between or used in ui and server) should be defined in `atlas-shared` and correctly propagated between Server and Client to avoid "drift".
- **No Magic Strings**: Use Enums or constant objects for fixed values, especially those shared between UI and Server.

## Testing & Quality Assurance

- **E2E Testing**: Use **Playwright** for End-to-End testing.
- **Test ID Schema**: Always add `data-testid` attributes to interactive UI elements to ensure stable selectors.
  - Format: `[context]-[element]-[action/identifier]` (e.g., `relation-dialog-add-btn`).
- **Unit Testing**: Maintain high coverage for utility functions and complex logic in both server and UI.

## Database Design

- **PostgreSQL + JSONB**: Use JSONB for all dynamic fields.
- **Indexing**: Ensure proper GIN/BTREE indexing on JSONB fields used in filters.
- **Multi-tenant**: Always include `tenant_id` for data isolation.
- **Row Level Security (RLS)**: Use PostgreSQL RLS to protect tenant data.

## Maintenance

- Update `README.md` files (root and `atlas-server/`) and documentation in `/docs` when project capabilities change.
- Keep linting rules up to date and fix linting errors.
- Update `atlas-server/prisma/seed.ts` or specific seed files (in `atlas-server/prisma/seeds/`) when modifying default schemas.
- Keep `docs/DATA_MODEL.md` up to date with the database schema.
- Keep `docs/UI_ENGINE_GUIDE.md` up to date with the UI-server engine.
