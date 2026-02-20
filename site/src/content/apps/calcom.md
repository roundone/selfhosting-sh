---
title: "How to Self-Host Cal.com with Docker Compose"
description: "Deploy Cal.com with Docker Compose — a self-hosted scheduling platform that replaces Calendly, SavvyCal, and TidyCal."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "booking-scheduling"
apps:
  - calcom
tags:
  - self-hosted
  - calcom
  - docker
  - scheduling
  - booking
  - calendly-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Cal.com?

[Cal.com](https://cal.com/) is a self-hosted scheduling and booking platform. It handles everything Calendly does — booking pages, availability management, calendar integrations, round-robin routing, team scheduling — but you own the data and the infrastructure. It replaces Calendly, SavvyCal, and TidyCal without the per-seat pricing or feature gates. Licensed under AGPL-3.0 with additional commercial features available.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- **8 GB of RAM recommended** (4 GB minimum — Cal.com is a Next.js app and needs headroom)
- 20+ GB of free disk space
- A domain name (required — Cal.com needs a proper URL for OAuth callbacks and email links)
- An SMTP server or transactional email service (required for booking confirmations and invitations)

Cal.com is heavier than most self-hosted apps. Do not attempt to run it on a 1 GB VPS alongside other services.

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p ~/calcom && cd ~/calcom
```

Create a `.env` file with your secrets and configuration:

```bash
# === REQUIRED SECRETS (generate these — do not reuse) ===
# Generate: openssl rand -base64 32
NEXTAUTH_SECRET=CHANGE_ME_GENERATE_WITH_OPENSSL

# Generate: openssl rand -hex 32
CALENDSO_ENCRYPTION_KEY=CHANGE_ME_GENERATE_WITH_OPENSSL

# Generate: openssl rand -hex 24
CALCOM_SERVICE_ACCOUNT_ENCRYPTION_KEY=CHANGE_ME_GENERATE_WITH_OPENSSL

# === DATABASE ===
POSTGRES_USER=calcom
POSTGRES_PASSWORD=CHANGE_ME_USE_A_STRONG_PASSWORD
POSTGRES_DB=calcom
DATABASE_URL=postgresql://calcom:CHANGE_ME_USE_A_STRONG_PASSWORD@calcom-db:5432/calcom

# === URLs ===
# Set to your actual domain — Cal.com uses this for OAuth callbacks and email links
NEXT_PUBLIC_WEBAPP_URL=https://cal.example.com
NEXTAUTH_URL=https://cal.example.com

# === SMTP (required for booking emails) ===
EMAIL_FROM=cal@example.com
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-smtp-user
EMAIL_SERVER_PASSWORD=your-smtp-password

# === PERFORMANCE ===
# Adjust based on available RAM — 4096 for 8 GB server, 2048 for 4 GB
NODE_OPTIONS=--max-old-space-size=4096
```

Create a `docker-compose.yml` file:

```yaml
services:
  calcom:
    image: calcom.docker.scarf.sh/calcom/cal.com:v6.1.16
    container_name: calcom
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - CALENDSO_ENCRYPTION_KEY=${CALENDSO_ENCRYPTION_KEY}
      - CALCOM_SERVICE_ACCOUNT_ENCRYPTION_KEY=${CALCOM_SERVICE_ACCOUNT_ENCRYPTION_KEY}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXT_PUBLIC_WEBAPP_URL=${NEXT_PUBLIC_WEBAPP_URL}
      - NODE_OPTIONS=${NODE_OPTIONS}
      - EMAIL_FROM=${EMAIL_FROM}
      - EMAIL_SERVER_HOST=${EMAIL_SERVER_HOST}
      - EMAIL_SERVER_PORT=${EMAIL_SERVER_PORT}
      - EMAIL_SERVER_USER=${EMAIL_SERVER_USER}
      - EMAIL_SERVER_PASSWORD=${EMAIL_SERVER_PASSWORD}
    depends_on:
      calcom-db:
        condition: service_healthy
      calcom-redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 120s
    networks:
      - calcom-net

  calcom-db:
    image: postgres:16-alpine
    container_name: calcom-db
    restart: unless-stopped
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - database-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - calcom-net

  calcom-redis:
    image: redis:7-alpine
    container_name: calcom-redis
    restart: unless-stopped
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - calcom-net

volumes:
  database-data:
  redis-data:

networks:
  calcom-net:
```

Generate the required secrets and update your `.env` file:

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "CALENDSO_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "CALCOM_SERVICE_ACCOUNT_ENCRYPTION_KEY=$(openssl rand -hex 24)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
```

Copy each generated value into the `.env` file. Make sure the password in `POSTGRES_PASSWORD` matches the one inside `DATABASE_URL`.

Start the stack:

```bash
docker compose up -d
```

Cal.com takes 1-3 minutes to start on first launch while it runs database migrations. Watch the logs:

```bash
docker compose logs -f calcom
```

Wait until you see the application listening on port 3000 before accessing it.

## Initial Setup

1. Open `https://cal.example.com` (or `http://your-server-ip:3000` if not behind a reverse proxy)
2. Click **Sign Up** to create your admin account — the first user registered becomes the instance admin
3. Complete the onboarding wizard:
   - Set your timezone and availability hours
   - Connect a calendar (Google Calendar, Outlook, or CalDAV)
   - Create your first event type (e.g., "30-Minute Meeting")
4. Test the booking flow by visiting your public booking page and making a test booking
5. Verify SMTP is working — you should receive a confirmation email for the test booking

If emails are not arriving, check the SMTP settings in your `.env` file. Cal.com will not send booking confirmations without a working SMTP configuration.

## Configuration

### Calendar Integrations

Cal.com supports connecting to external calendars to check availability and create events:

- **Google Calendar** — requires a Google Cloud OAuth app (set redirect URI to `https://cal.example.com/api/integrations/googlecalendar/callback`)
- **Microsoft Outlook/365** — requires an Azure AD app registration
- **CalDAV** — works with any CalDAV server (Radicale, Baikal, Nextcloud)
- **Apple Calendar** — via CalDAV with an app-specific password

Configure integrations under **Settings > Integrations** in the admin panel.

### Booking Pages

Each user gets a booking page at `https://cal.example.com/username`. Configure:

- **Event types** — duration, buffer time between meetings, minimum notice period
- **Availability** — set working hours per day, override specific dates
- **Questions** — add custom fields to the booking form (name, email, phone, custom text)
- **Confirmations** — require manual confirmation or auto-accept bookings
- **Redirects** — send users to a custom page after booking

### Team Scheduling

Cal.com supports team features out of the box:

- **Round-robin** — distribute bookings evenly across team members
- **Collective** — find times when all required attendees are available
- **Managed event types** — admins define event templates that team members inherit

### Webhooks and API

Cal.com has a REST API and supports webhooks for integration with external systems. Configure webhooks under **Settings > Developer > Webhooks** to trigger automations on booking events — useful for connecting to [n8n](/apps/n8n) or other workflow tools.

## Reverse Proxy

Cal.com must run behind a reverse proxy with HTTPS in production. The OAuth callbacks and email links break without a proper SSL-terminated URL.

Nginx Proxy Manager example — set the proxy target to `calcom:3000` (or `your-server-ip:3000`) and enable SSL with Let's Encrypt. Make sure WebSocket support is enabled.

For full reverse proxy setup instructions, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained).

## Backup

Cal.com stores all data in PostgreSQL. Back up the database regularly.

Dump the database:

```bash
docker exec calcom-db pg_dump -U calcom calcom > calcom-backup-$(date +%F).sql
```

Restore from a dump:

```bash
cat calcom-backup-2026-02-20.sql | docker exec -i calcom-db psql -U calcom calcom
```

Also back up your `.env` file — it contains your encryption keys. Losing `CALENDSO_ENCRYPTION_KEY` means losing access to encrypted data in the database.

Redis data is ephemeral (session cache) and does not need backup.

For a complete backup strategy, see [Backup: The 3-2-1 Rule](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Cal.com fails to start — "connection refused" to database

**Symptom:** Logs show `ECONNREFUSED 127.0.0.1:5432` or `connect ECONNREFUSED`.

**Fix:** The app is trying to reach PostgreSQL before it is ready. Verify your `DATABASE_URL` uses the Docker service name (`calcom-db`), not `localhost`. The `depends_on` with `condition: service_healthy` should handle startup order, but if the database is slow to initialize, increase `start_period` on the Cal.com healthcheck.

### Booking emails not sending

**Symptom:** Bookings are created but no confirmation emails arrive.

**Fix:** Verify all `EMAIL_SERVER_*` variables in `.env` are correct. Test SMTP connectivity from inside the container:

```bash
docker exec calcom wget -qO- --post-data="" https://cal.example.com/api/health
```

Check logs for SMTP errors:

```bash
docker compose logs calcom | grep -i "email\|smtp\|mail"
```

Common causes: wrong port (use 587 for STARTTLS, 465 for SSL), authentication failure, or the SMTP provider blocking the VPS IP.

### Google Calendar integration fails with redirect error

**Symptom:** After authorizing Google Calendar, you get "redirect_uri_mismatch" or a generic OAuth error.

**Fix:** The redirect URI in your Google Cloud Console must exactly match `https://cal.example.com/api/integrations/googlecalendar/callback`. Ensure `NEXT_PUBLIC_WEBAPP_URL` in `.env` matches the domain you configured in Google Cloud. Both must use HTTPS.

### Out of memory — container killed

**Symptom:** Cal.com container restarts repeatedly. `docker inspect calcom` shows OOMKilled.

**Fix:** Cal.com is a Next.js application and needs substantial memory. Increase `NODE_OPTIONS` in `.env`:

```bash
# For a 4 GB server (tight)
NODE_OPTIONS=--max-old-space-size=2048

# For an 8 GB server (comfortable)
NODE_OPTIONS=--max-old-space-size=4096
```

If you are on a 4 GB server running other services, Cal.com may not be viable. Consider a dedicated VPS or upgrading RAM.

### Slow initial page load after restart

**Symptom:** First page load takes 15-30 seconds after starting the container.

**Fix:** This is expected. Next.js compiles pages on first request after a cold start. Subsequent requests are fast. The `start_period: 120s` in the healthcheck accounts for this warmup. No action needed unless it persists beyond the first few requests.

## Resource Requirements

- **RAM:** 2-3 GB idle, 4+ GB under load. 8 GB server recommended.
- **CPU:** Medium. 2+ cores recommended — Next.js SSR is CPU-intensive during page compilation.
- **Disk:** 20+ GB for the application, database, and Docker images. Database grows with booking history.

Cal.com is one of the heavier self-hosted applications. It is not a good fit for a Raspberry Pi or a shared 1 GB VPS.

## Verdict

Cal.com is the best self-hosted scheduling tool available. Nothing else in the self-hosted space comes close to its feature set — booking pages, team scheduling, round-robin, calendar integrations, webhooks, and a polished UI that you would not be embarrassed to send to clients.

The trade-off is resource usage. This is a full Next.js application with PostgreSQL and Redis, not a lightweight Go binary. Budget 4-8 GB of RAM and expect a slower cold start. If you are running a business and scheduling matters, that cost is trivial compared to Calendly's $12-16/seat/month.

For personal use where you just need a simple booking link, Cal.com is overkill — look at lighter alternatives. For anything professional, self-host Cal.com and stop paying per-seat scheduling fees.

## Related

- [Best Self-Hosted Booking and Scheduling Tools](/best/booking-scheduling)
- [Self-Hosted Alternatives to Calendly](/replace/calendly)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Backup: The 3-2-1 Rule](/foundations/backup-3-2-1-rule)
- [How to Self-Host n8n](/apps/n8n)
- [How to Self-Host Radicale](/apps/radicale)
- [Security Basics for Self-Hosting](/foundations/security-basics)
