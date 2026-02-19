# Email Configuration Guide

Atlas uses a pluggable email architecture that supports multiple providers. This guide covers how to configure email for local development and production environments.

## Overview

The email system is used for:

- **Email Verification** — Sent after user registration
- **Password Reset** — Sent when a user requests to reset their password

---

## Email Provider Architecture

Atlas uses a provider-based architecture for email services. While the interface is designed to support multiple providers (like direct API integrations), the current implementation uses **Nodemailer** as the sole provider. This allows it to connect to any SMTP service.

- **Provider Interface**: `EMAIL_PROVIDER`
- **Current Implementation**: `NodemailerProvider` (SMTP)

This means you can use any SMTP-compatible service (Mailpit, Resend SMTP, AWS SES SMTP, SendGrid SMTP, etc.) by simply configuring the environment variables.

---

## Local Development with Mailpit

[Mailpit](https://github.com/axllent/mailpit) is a local SMTP server that captures all outgoing emails without actually sending them. This is the **recommended setup for development**.

### Setup

1. Start Mailpit with Docker Compose:

   ```bash
   docker compose up -d
   ```

2. Configure your `.env` file:

   ```properties
   SMTP_HOST=localhost
   SMTP_PORT=1025
   SMTP_SECURE=false
   SMTP_FROM=noreply@atlas.local
   APP_URL=http://localhost:8081
   APP_NAME=Atlas
   ```

3. View captured emails at: **<http://localhost:8025>**

### Features

- Web UI for viewing all captured emails
- Search and filter emails
- View HTML and plain text versions
- Inspect email headers
- REST API for automation

---

## Production with Resend

[Resend](https://resend.com) is a modern email API that provides reliable email delivery. It's recommended for production environments.

### Setup

1. Create a [Resend account](https://resend.com)
2. Add and verify your domain
3. Get your API key from the dashboard

4. Configure your `.env` file:

   ```properties
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=resend
   SMTP_PASS=re_YOUR_API_KEY_HERE
   SMTP_FROM=atlas@your-verified-domain.com
   APP_URL=https://your-production-url.com
   APP_NAME=Atlas
   ```

### Important Notes

- The `SMTP_FROM` address must use a domain verified in Resend
- For testing, you can use `@resend.dev` domain
- See [Resend SMTP documentation](https://resend.com/docs/send-with-smtp) for details

---

## Generic SMTP Provider

Any SMTP-compatible email provider can be used:

```properties
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@example.com
APP_URL=https://your-app-url.com
APP_NAME=Atlas
```

Common providers:

- **AWS SES** — `email-smtp.{region}.amazonaws.com:587`
- **SendGrid** — `smtp.sendgrid.net:587`
- **Mailgun** — `smtp.mailgun.org:587`

---

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | — |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS connection (`true`/`false`) | `false` |
| `SMTP_USER` | SMTP username (if required) | — |
| `SMTP_PASS` | SMTP password (if required) | — |
| `SMTP_FROM` | Sender email address | — |
| `APP_URL` | Base URL for email links | `http://localhost:5173` |
| `APP_NAME` | Application name in emails | `Atlas` |

---

## Email Templates

Atlas sends the following emails:

### Verification Email

- **Subject:** "Verify your Atlas email"
- **Link:** `{APP_URL}/verify-email?token={token}`
- **Expiry:** 24 hours

### Password Reset Email

- **Subject:** "Reset your Atlas password"
- **Link:** `{APP_URL}/reset-password?token={token}`
- **Expiry:** 1 hour

---

## E2E Testing

For E2E tests, Mailpit is automatically configured in `docker-compose.e2e.yml`. Tests use a helper module to interact with Mailpit's API:

```typescript
import { getLatestEmailTo, extractVerificationUrl } from './utils/email-helper';

// Get verification email
const email = await getLatestEmailTo('user@example.com');
const verifyUrl = extractVerificationUrl(email.HTML);
```

---

## Troubleshooting

### Emails not being sent

1. Check that `SMTP_HOST` is configured
2. Verify Mailpit/SMTP server is running: `docker compose ps`
3. Check server logs for email errors

### Connection refused

- For Mailpit: Ensure port `1025` is not blocked
- For production: Check `SMTP_SECURE` matches port (465=true, 587=false)

### Invalid sender

- Verify the `SMTP_FROM` domain is authorized by your provider
- For Resend, ensure the domain is verified in your dashboard

---

## Related Documentation

- [Authentication Guide](./AUTHENTICATION.md) — User registration and login flows
- [Backend Setup](../atlas-server/README.md) — Server configuration
