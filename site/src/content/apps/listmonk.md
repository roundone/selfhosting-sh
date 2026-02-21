---
title: "How to Self-Host Listmonk with Docker Compose"
description: "Deploy Listmonk with Docker Compose — a high-performance, self-hosted newsletter and mailing list manager with a modern UI."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "newsletters"
apps:
  - listmonk
tags:
  - self-hosted
  - listmonk
  - docker
  - newsletter
  - mailing-list
  - mailchimp-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Listmonk?

[Listmonk](https://listmonk.app/) is a high-performance, self-hosted newsletter and mailing list manager built in Go. It handles subscriber management, campaign creation, analytics, and transactional emails through a clean web UI -- all backed by PostgreSQL. It replaces [Mailchimp](/replace/mailchimp/), Substack, ConvertKit, and every other SaaS email platform that charges you per subscriber.

Listmonk is a single binary that ships millions of emails without breaking a sweat. It supports templating, media uploads, subscriber segmentation, and both rich HTML and plain text campaigns. AGPL-3.0 licensed, free forever, and your subscriber list stays on your server.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free disk space (plus database growth over time)
- 512 MB of free RAM
- A domain name pointed at your server (required for email deliverability)
- SMTP credentials from a transactional email provider (Amazon SES, Mailgun, Resend, or your own mail server)

## Docker Compose Configuration

Create a directory for Listmonk:

```bash
mkdir -p ~/listmonk && cd ~/listmonk
```

Create a `docker-compose.yml` file:

```yaml
services:
  listmonk:
    container_name: listmonk
    image: listmonk/listmonk:v6.0.0
    ports:
      - "9000:9000"       # Web UI and API
    environment:
      # Database connection
      - LISTMONK_db__host=listmonk-db
      - LISTMONK_db__port=5432
      - LISTMONK_db__user=listmonk
      - LISTMONK_db__password=change-this-strong-password
      - LISTMONK_db__database=listmonk
      - LISTMONK_db__ssl_mode=disable

      # Admin credentials (set on first run)
      - LISTMONK_ADMIN_USER=admin
      - LISTMONK_ADMIN_PASSWORD=change-this-admin-password
    volumes:
      - listmonk-uploads:/listmonk/uploads   # Media uploads (images, attachments)
    networks:
      - listmonk-net
    depends_on:
      listmonk-db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:9000"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  listmonk-db:
    container_name: listmonk-db
    image: postgres:17-alpine
    environment:
      - POSTGRES_USER=listmonk
      - POSTGRES_PASSWORD=change-this-strong-password
      - POSTGRES_DB=listmonk
    volumes:
      - listmonk-db-data:/var/lib/postgresql/data   # PostgreSQL data
    networks:
      - listmonk-net
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U listmonk -d listmonk"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

volumes:
  listmonk-uploads:
  listmonk-db-data:

networks:
  listmonk-net:
```

**Important:** Change both instances of `change-this-strong-password` to the same strong password. Change `change-this-admin-password` to a secure admin password. The `POSTGRES_PASSWORD` and `LISTMONK_db__password` values must match.

### Install the Database Schema

Before starting Listmonk for the first time, you need to initialize the database. Run the install command:

```bash
docker compose run --rm listmonk ./listmonk --install
```

This creates the required tables, indexes, and default settings in PostgreSQL. You only need to run this once.

Now start the full stack:

```bash
docker compose up -d
```

Listmonk is now available at `http://your-server-ip:9000`.

## Initial Setup

### Log In to the Admin Panel

Open `http://your-server-ip:9000` in your browser. Log in with the admin credentials you set in the environment variables (`LISTMONK_ADMIN_USER` and `LISTMONK_ADMIN_PASSWORD`).

### Configure SMTP

Listmonk cannot send emails until you configure an SMTP provider. Go to **Settings > SMTP** in the admin panel and add your SMTP server details:

- **Host:** Your SMTP server (e.g., `email-smtp.us-east-1.amazonaws.com` for Amazon SES, `smtp.mailgun.org` for Mailgun)
- **Port:** 465 (SSL) or 587 (STARTTLS)
- **Auth protocol:** Login
- **Username / Password:** Your SMTP credentials
- **Max connections:** Start with 5. Increase based on your provider's rate limits.
- **TLS:** Enable TLS (STARTTLS or SSL depending on port)

Click **Save** and then **Test** to send a test email. Fix any errors before proceeding.

### Create Your First Mailing List

Go to **Lists** and click **New**. Give it a name (e.g., "Newsletter"), set the type to **Public** (allows subscription via forms), and choose **Double opt-in** for GDPR compliance and better deliverability.

### Set the From Address

Under **Settings > General**, set your **From email** address (e.g., `newsletter@yourdomain.com`). This must be a verified sender in your SMTP provider. An unverified sender will cause delivery failures.

## Configuration

### Campaign Types

Listmonk supports two campaign modes:

- **Regular campaigns:** One-time sends to a list or segment. Use for newsletters, announcements, product updates.
- **Optin campaigns:** Automatic double opt-in confirmation emails. Sent when a subscriber joins a list marked as double opt-in.

### Templates

Navigate to **Campaigns > Templates** to edit the default email template or create new ones. Templates use Go's `html/template` syntax. The default template is functional but plain -- customize it to match your brand. Key template variables:

- `{{ .Subject }}` -- campaign subject line
- `{{ .Body }}` -- campaign content
- `{{ .UnsubscribeURL }}` -- required unsubscribe link (legally mandatory)
- `{{ .TrackLink }}` -- wraps links for click tracking

### Subscriber Import

Import existing subscribers via **Subscribers > Import**. Listmonk accepts CSV files with at minimum an `email` column. Additional columns map to subscriber attributes. You can also import via the [API](https://listmonk.app/docs/apis/subscribers/) for programmatic onboarding.

### Subscriber Segmentation

Use subscriber attributes and list membership to segment your audience. When creating a campaign, you can target specific lists or use SQL-based advanced queries to build segments. This is more powerful than most SaaS tools -- you have direct access to your data.

### Bounce Processing

Under **Settings > Bounces**, configure bounce handling. Listmonk supports POP3/IMAP bounce mailbox scanning and webhook-based bounce processing (for providers like Amazon SES and SendGrid). Enable automatic blocklisting of hard bounces to protect your sender reputation.

### API Access

Listmonk exposes a full REST API for managing subscribers, lists, campaigns, and templates programmatically. API documentation is at `http://your-server:9000/api` when the server is running. Authentication uses the same admin credentials with HTTP Basic Auth.

## Reverse Proxy

Running Listmonk behind a reverse proxy gives you SSL termination and a clean URL. You need this for production use -- email links pointing to `http://your-ip:9000` look unprofessional and trigger spam filters.

Configure your reverse proxy to forward traffic to `localhost:9000`. After setting up the proxy, update the **Root URL** in **Settings > General** to your public domain (e.g., `https://newsletter.yourdomain.com`). This ensures all generated links (unsubscribe, tracking, public pages) use the correct URL.

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for complete Nginx Proxy Manager, Traefik, and Caddy configurations.

## Backup

Your Listmonk data lives in two places:

1. **PostgreSQL database** -- subscriber lists, campaigns, templates, settings, analytics. This is the critical data.
2. **Uploads volume** -- media files attached to campaigns.

Back up the PostgreSQL database with `pg_dump`:

```bash
docker compose exec listmonk-db pg_dump -U listmonk listmonk > listmonk-backup-$(date +%Y%m%d).sql
```

Back up the uploads volume:

```bash
docker compose cp listmonk:/listmonk/uploads ./uploads-backup
```

Automate this on a schedule and store backups off-server. See our [Backup Strategy](/foundations/backup-3-2-1-rule/) guide for the full 3-2-1 approach.

To restore from a database backup:

```bash
docker compose exec -T listmonk-db psql -U listmonk listmonk < listmonk-backup-YYYYMMDD.sql
```

## Troubleshooting

### Database Connection Refused

**Symptom:** Listmonk fails to start with `connection refused` or `dial tcp: connect: connection refused`.

**Fix:** The PostgreSQL container is not ready when Listmonk tries to connect. Verify the `depends_on` condition in your Compose file points to the database healthcheck. Check that the database credentials match between the `listmonk` and `listmonk-db` services -- `LISTMONK_db__password` must equal `POSTGRES_PASSWORD`. Run `docker compose logs listmonk-db` to confirm PostgreSQL started cleanly.

### Install Command Fails

**Symptom:** `docker compose run --rm listmonk ./listmonk --install` exits with an error about existing tables or connection issues.

**Fix:** If it complains about existing tables, the install already ran successfully -- skip it. If it shows a connection error, make sure the database container is running first: `docker compose up -d listmonk-db`, wait 10 seconds, then retry the install command.

### Emails Not Sending

**Symptom:** Campaigns show as "running" but no emails arrive. The campaign log shows SMTP errors.

**Fix:** Go to **Settings > SMTP** and verify your credentials. Click **Test** to send a test email and read the error message. Common causes: wrong port (use 587 for STARTTLS, 465 for SSL), authentication failure (regenerate SMTP credentials), sender address not verified with your email provider, or rate limits exceeded (reduce max connections).

### Slow Campaign Sending

**Symptom:** Large campaigns take hours to complete even though your SMTP provider allows higher throughput.

**Fix:** Increase the **Max connections** setting under **Settings > SMTP**. Each connection sends emails in parallel. Start at 5 and increase to 10-20 depending on your provider's rate limits. Also check **Settings > Performance** for the **Concurrency** and **Message rate** settings -- these throttle send speed globally.

### Public Subscription Page Returns 404

**Symptom:** The public subscription page at `/subscription/form` returns a 404 or blank page.

**Fix:** Ensure the **Root URL** in **Settings > General** matches the URL you are accessing Listmonk from (including the protocol -- `https://` not `http://` if behind a reverse proxy with SSL). If you are using a reverse proxy, confirm it is forwarding to port 9000 and not stripping the path.

## Resource Requirements

- **RAM:** ~100 MB idle, ~500 MB under heavy campaign sends
- **CPU:** Low. Listmonk is a single Go binary -- very efficient. A single core handles thousands of emails per minute.
- **Disk:** 1 GB minimum for the application and database. Grows with subscriber count, campaign history, and media uploads. A list of 100,000 subscribers with a year of campaign history uses roughly 2-5 GB.

## Verdict

Listmonk is the best self-hosted newsletter tool available. It is fast, simple to deploy, and handles everything from a personal blog newsletter to a six-figure mailing list without flinching. The Go binary is lightweight, the PostgreSQL backend is rock-solid, and the web UI is clean and functional.

Compared to [Mailtrain](/apps/mailtrain/) and [Mautic](/apps/mautic/), Listmonk is significantly easier to set up and lighter on resources. Mautic is a full marketing automation platform -- powerful but heavy and complex. Mailtrain works but feels dated. Listmonk hits the sweet spot: enough features for serious newsletter operations without the bloat.

If you are paying Mailchimp, ConvertKit, or Substack for email, stop. Self-host Listmonk, pair it with a transactional email provider like Amazon SES ($0.10 per 1,000 emails), and your mailing list costs drop to nearly zero. You own your subscriber data, you control deliverability, and there is no per-subscriber pricing that punishes you for growing your audience.

## Related

- [Best Self-Hosted Newsletter Tools](/best/newsletters/)
- [Self-Hosted Alternatives to Mailchimp](/replace/mailchimp/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy (3-2-1 Rule)](/foundations/backup-3-2-1-rule/)
- [Docker Networking Explained](/foundations/docker-networking/)
- [Docker Volumes and Persistent Data](/foundations/docker-volumes/)
- [How to Self-Host n8n](/apps/n8n/)
- [How to Self-Host Plausible Analytics](/apps/plausible/)
