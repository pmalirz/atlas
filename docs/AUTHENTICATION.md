# Authentication Guide

Atlas provides a complete authentication system with user registration, email verification, password reset, and session management.

## Overview

The authentication system supports:

- **Native Authentication** — Email/password login with JWT tokens
- **Email Verification** — Verify user email addresses after registration
- **Password Reset** — Secure password recovery via email
- **Remember Me** — Extended session duration option
- **Rate Limiting** — Protection against brute-force attacks

---

## Authentication Providers

Atlas features a **Pluggable Authentication Architecture** that allows you to switch between different identity providers.

### 1. Native (Default)
The built-in email/password authentication system. Fully implemented and ready to use.
- **Provider ID**: `native`
- **Features**: Registration, Login, Email Verification, Password Reset.

### 2. External Providers (Experimental / Scaffolded)
The system includes architecture support for external providers, but the implementation logic is currently **scaffolded**. To use these, you must install the required SDKs and implement the validation logic in the respective provider files (`atlas-server/src/modules/auth/providers/`).

| Provider | ID | Status | Required SDK (to be installed) |
|----------|----|--------|--------------------------------|
| **Clerk** | `clerk` | Scaffolded | `@clerk/clerk-sdk-node` |
| **Logto** | `logto` | Scaffolded | `@logto/node` or `jose` |
| **SSO (OIDC)** | `sso` | Scaffolded | `jose` |

> **Note:** To enable an external provider, set `AUTH_PROVIDER=<id>` in your `.env` file and implement the missing logic in the provider class.

---

## Configuration Reference

### Common Settings
| Variable | Description | Default |
|----------|-------------|---------|
| `AUTH_PROVIDER` | Authentication strategy to use (`native`, `clerk`, `logto`, `sso`) | `native` |
| `JWT_SECRET` | Secret key for signing session tokens | `default-dev-secret` |
| `JWT_EXPIRES_IN` | Session token duration | `7d` |

### Provider-Specific Settings

**Clerk**
- `CLERK_SECRET_KEY`: Backend API secret key
- `CLERK_PUBLISHABLE_KEY`: Frontend publishable key

**Logto**
- `LOGTO_ENDPOINT`: Logto tenant endpoint
- `LOGTO_APP_ID`: Application ID
- `LOGTO_APP_SECRET`: Application secret

**SSO (OIDC)**
- `SSO_TYPE`: Protocol (`oidc` or `saml`)
- `SSO_ISSUER`: Identity provider issuer URL
- `SSO_CLIENT_ID`: OAuth client ID
- `SSO_CLIENT_SECRET`: OAuth client secret
- `SSO_DISCOVERY_URL`: (Optional) OIDC discovery endpoint

---

## Quick Start

### Prerequisites

1. Database running (PostgreSQL)
2. Email service configured (see [Email Setup](./EMAIL_SETUP.md))

### Default Credentials

After seeding the database with the `eap` seed, you can log in with:

- **Email:** `admin@example.com`
- **Password:** `admin123`

---

## User Registration

### Registration Flow

1. User fills registration form (`/register`)
2. Server creates user account
3. Verification email is sent automatically
4. User clicks verification link
5. Email is marked as verified

### API

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

### Response

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": false
  }
}
```

---

## Email Verification

### Verification Flow

1. User receives email with verification link
2. Link format: `{APP_URL}/verify-email?token={token}`
3. User clicks link, which calls verification API
4. On success, user is redirected to the app

### API

```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "token": "verification-token-from-email"
}
```

### Resend Verification

If the user didn't receive the email:

```http
POST /api/auth/resend-verification
```

> Requires authenticated user (must be logged in)

### Token Details

- **Validity:** 24 hours
- **One-time use:** Token is invalidated after verification
- **Auto-invalidation:** Previous tokens are invalidated when a new one is generated

---

## Login

### Login Flow

1. User enters email and password
2. Optional: Select "Remember me" for extended session
3. Server validates credentials and sets HTTP-only cookie
4. User is redirected to dashboard

### API

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "rememberMe": true
}
```

### Session Duration

| Option | Cookie Duration |
|--------|-----------------|
| Remember Me: `false` | 1 day |
| Remember Me: `true` | 30 days |

### Security Features

- **HTTP-only cookies** — Tokens not accessible via JavaScript
- **Secure cookies** — Enabled automatically in production
- **Rate limiting** — Configurable limits on login attempts

---

## Password Reset

### Reset Flow

1. User clicks "Forgot password" on login page
2. User enters their email address
3. Server sends password reset email (if account exists)
4. User clicks reset link in email
5. User enters new password
6. Password is updated, tokens invalidated

### Request Password Reset

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

> Always returns success to prevent email enumeration attacks

### Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

### Token Details

- **Validity:** 1 hour
- **One-time use:** Token is invalidated after password reset
- **Auto-invalidation:** Previous tokens are invalidated when a new one is generated

---

## Logout

```http
POST /api/auth/logout
```

Clears the authentication cookie and invalidates the session.

---

## Rate Limiting

Authentication endpoints are protected with rate limiting to prevent abuse:

| Endpoint | Default Limit |
|----------|---------------|
| `/auth/login` | 10 requests/minute |
| `/auth/register` | 10 requests/minute |
| `/auth/forgot-password` | 10 requests/minute |
| `/auth/reset-password` | 10 requests/minute |
| `/auth/resend-verification` | 10 requests/minute |

### Configuration

```properties
# Global rate limit
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Auth-specific rate limit (stricter)
THROTTLE_AUTH_TTL=60000
THROTTLE_AUTH_LIMIT=10
```

### Disable for Development

Set high limits in `.env`:

```properties
THROTTLE_LIMIT=1000
THROTTLE_AUTH_LIMIT=1000
```

---

## UI Pages

| Route | Description |
|-------|-------------|
| `/login` | Login form with email/password |
| `/register` | New user registration |
| `/forgot-password` | Request password reset email |
| `/reset-password?token=...` | Set new password |
| `/verify-email?token=...` | Email verification |

---

## Security Considerations

### Password Requirements

- Minimum 8 characters
- Passwords are hashed with bcrypt (10 rounds)

### Token Security

- Tokens are cryptographically random (32 bytes, base64url encoded)
- Stored hashed in the database
- Single-use: invalidated immediately after use
- Time-limited: automatic expiration

### Cookie Security

- `HttpOnly`: Prevents XSS attacks
- `Secure`: Enabled in production (HTTPS only)
- `SameSite`: Protects against CSRF
- `Path`: Scoped to `/api`

---

## Database Models

### User

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  password        String
  name            String?
  emailVerified   Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### Password Reset Token

```prisma
model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

### Email Verification Token

```prisma
model EmailVerificationToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
}
```

---

## E2E Testing

Authentication flows are covered by E2E tests in `atlas-e2e/tests/ui/auth-flows.spec.ts`:

- Registration with email verification
- Password reset flow
- Login with new credentials

See [Email Setup](./EMAIL_SETUP.md) for test environment configuration.

---

## Troubleshooting

### "Invalid credentials" error

1. Check email and password are correct
2. Verify user exists in database
3. Check rate limiting hasn't been triggered

### Verification email not received

1. Check spam folder
2. Verify email service is configured (see [Email Setup](./EMAIL_SETUP.md))
3. Use "Resend verification" option
4. Check server logs for errors

### Password reset link expired

1. Request a new password reset
2. Links expire after 1 hour
3. Check system time is synchronized

### Rate limit exceeded

1. Wait for the rate limit window to reset (1 minute)
2. For development, increase limits in `.env`

---

## Related Documentation

- [Email Setup](./EMAIL_SETUP.md) — Configure email providers
- [Backend Setup](../atlas-server/README.md) — Server configuration
- [Data Model](./DATA_MODEL.md) — Database schema
