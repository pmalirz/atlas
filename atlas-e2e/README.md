# Atlas E2E Tests

End-to-End tests for the Atlas platform, using **Jest** (API tests) and **Playwright** (UI tests).

## Overview

This workspace contains all integration and end-to-end tests to ensure the platform works as expected.

- **API Tests**: Located in `tests/api/`. Uses `supertest` to verify backend endpoints.
- **UI Tests**: Located in `tests/ui/`. Uses `playwright` to verify frontend interactions.

## Running Tests

See the root [README.md](../README.md#%F0%9F%A7%AA-testing) for detailed instructions on running tests locally and in Docker.

```bash
# Run API tests
npm run test:api -w atlas-e2e

# Run UI tests
npm run test:ui -w atlas-e2e
```
