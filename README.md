<p align="center">
  <img src="https://img.shields.io/badge/Atlas-Low_Code_Platform-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlnb24gcG9pbnRzPSIxMiAyIDIgNyAxMiAxMiAyMiA3IDEyIDIiPjwvcG9seWdvbj48cG9seWxpbmUgcG9pbnRzPSIyIDE3IDEyIDIyIDIyIDE3Ij48L3BvbHlsaW5lPjxwb2x5bGluZSBwb2ludHM9IjIgMTIgMTIgMTcgMjIgMTIiPjwvcG9seWxpbmU+PC9zdmc+" alt="Atlas" />
</p>

<h1 align="center">Atlas</h1>

<p align="center">
  <strong>Build dynamic, data-driven business applications—without the complexity.</strong>
</p>

<p align="center">
  <a href="https://github.com/pmalirz/atlas/actions/workflows/ci.yml">
    <img src="https://github.com/pmalirz/atlas/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://github.com/pmalirz/atlas/actions/workflows/coverage.yml">
    <img src="https://github.com/pmalirz/atlas/actions/workflows/coverage.yml/badge.svg" alt="Test Coverage" />
  </a>
  <a href="https://codecov.io/gh/pmalirz/atlas">
    <img src="https://codecov.io/gh/pmalirz/atlas/graph/badge.svg" alt="Codecov" />
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## ✨ What is Atlas?

**Atlas** is a modern **low-code platform** for building rich, data-driven business applications. Define your entity model dynamically, extend it with custom logic through a pluggable architecture, and deploy production-ready solutions in record time.

> 🚀 *Customize it to your needs. Deploy ready-to-use seeds. Extend and evolve.*

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| **Dynamic Data Model** | [Generic Entity-Relation model](./docs/DATA_MODEL.md) allows runtime schema extension without migrations |
| **Schema-Driven UI** | UI layouts, forms, and views adapt automatically based on backend JSON configuration |
| **Relation Visualization** | Interactive, force-directed graph views for exploring complex entity relationships |
| **Audit & Compliance** | Built-in audit logging for all data changes, supporting DORA and compliance requirements |
| **RBAC-Aware Editing UX** | Field-level permissions are enforced in UI and API with tenant-scoped RBAC endpoints; non-writable fields stay visible in read-only mode |
| **Ready-to-Use Seeds** | Bootstrap your project with pre-built templates (e.g., EAP - Enterprise Application Portfolio) |
| **Full-Stack TypeScript** | End-to-end type safety with shared contracts between frontend and backend |
| **Pluggable Auth** | [Native and extensible authentication](./docs/AUTHENTICATION.md) supporting multiple providers |
| **Email Integration** | [Pluggable email system](./docs/EMAIL_SETUP.md) for verification and password resets (Nodemailer, SMTP) |

---

## 🏗️ Architecture

```
app-atlas/
├── atlas-server/    # NestJS backend with Prisma ORM
├── atlas-ui/        # React frontend with schema-driven engine
├── atlas-shared/    # Shared types and contracts (Single Source of Truth)
├── atlas-e2e/       # End-to-end tests (API + UI)
└── docs/            # Detailed documentation
```

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/pmalirz/app-atlas.git
cd app-atlas

# Install dependencies
npm install

# Start the database
docker compose up -d

# Build shared library (required by both server and ui)
npm run build -w atlas-shared

# Run database migrations & seed data
# Note: db:seed requires the shared library to be built
npm run db:generate -w atlas-server
npm run db:migrate:deploy -w atlas-server
npm run db:seed -w atlas-server -- --seed eap

# Start the development servers
npm run dev:server &
npm run dev:ui
```

---

## 🗎 Documentation

Detailed documentation is available in the [`docs/`](./docs) directory:

- [**Data Model Guide**](./docs/DATA_MODEL.md) — Understanding the generic Entity-Relation architecture
- [**UI Engine Guide**](./docs/UI_ENGINE_GUIDE.md) — Configuring the schema-driven UI system, widgets, and menus
- [**Theme System Guide**](./docs/THEME_SYSTEM.md) — How to switch, customize, and extend themes
- [**Authentication Guide**](./docs/AUTHENTICATION.md) — User registration, login, password reset, and email verification
- [**Audit System Guide**](./docs/AUDIT.md) — Compliance, non-repudiation, and database-level audit logging
- [**Email Setup Guide**](./docs/EMAIL_SETUP.md) — Configure Mailpit, Resend, or other SMTP providers
- [**Frontend Guide**](./atlas-ui/README.md) — Setup and development of the React application
- [**Backend Guide**](./atlas-server/README.md) — Setup and development of the NestJS API

---

## 🌱 Seeds

Atlas ships with **ready-to-deploy seeds** — pre-configured data models that you can use as starting points:

| Seed | Description |
|------|-------------|
| **eap** | Enterprise Application Portfolio — manage applications, technologies, and integrations |

> 💡 Seeds are fully customizable. Use them as-is or modify to fit your domain.

---

## 🧪 Testing

```bash
# Run API e2e tests locally (requires database)
npm run test:api -w atlas-e2e

# Run UI e2e tests locally
npm run test:ui -w atlas-e2e

# Run E2E tests in Docker (API + UI validation)
npm run test:e2e
```

The `atlas-e2e` module contains all end-to-end tests:

- **API Tests** — Jest + Supertest tests for entities, relations, and definitions (schemas)
- **UI Tests** — Playwright smoke tests for navigation, forms, and data persistence

RBAC API coverage includes attribute-level enforcement tests in `atlas-e2e/tests/api/rbac.e2e-spec.ts`, validating:

- read-only users are denied entity updates (`403`)
- regular users can update only explicitly allowed attributes
- denied or non-allowlisted attributes are rejected with `403` (no partial updates)

---

## 🤝 Contributing

Contributions are welcome! Please see our contributing guidelines for more details.

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

<p align="center">
  <sub>Built with ❤️ for developers who want to move fast without sacrificing quality.</sub>
</p>
