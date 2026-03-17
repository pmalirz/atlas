# E2E Test Runner (API + UI tests)
FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY atlas-shared/package.json ./atlas-shared/
COPY atlas-ui/package.json ./atlas-ui/
COPY atlas-e2e/package.json ./atlas-e2e/

# Install dependencies (npm ci is deterministic and resolves correct linux native binaries from lockfile)
RUN npm ci --include=dev

# Copy source code
COPY atlas-shared ./atlas-shared
COPY atlas-ui ./atlas-ui
COPY atlas-e2e ./atlas-e2e

# Build shared library
RUN npm run build -w atlas-shared

# Build UI for production (for Playwright tests)
RUN npm run build -w atlas-ui

# Run all e2e tests (API via Jest, UI via Playwright)
ENV CI=true
CMD npm run test -w atlas-e2e
