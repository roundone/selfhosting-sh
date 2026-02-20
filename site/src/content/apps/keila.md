---
title: "How to Self-Host Keila with Docker Compose"
description: "Deploy Keila with Docker Compose — a self-hosted newsletter tool with visual segmentation, contact forms, and a modern editor."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "newsletters"
apps:
  - keila
tags:
  - self-hosted
  - keila
  - docker
  - newsletter
  - mailing-list
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Keila?

[Keila](https://www.keila.io/) is a self-hosted newsletter and email marketing tool built in Elixir. It provides subscriber management, campaign creation with WYSIWYG and Markdown editors, visual contact segmentation, and embeddable signup forms. Keila replaces [Mailchimp](/replace/mailchimp), ConvertKit, and similar SaaS email platforms — your subscriber data stays on your server, and you pay nothing per subscriber.

Keila is AGPL-3.0 licensed with an active development community. It's lighter on features than [Mautic](/apps/mautic) but more approachable than raw [Listmonk](/apps/listmonk) for users who prefer visual tools over SQL queries.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free RAM (minimum)
- 2 GB of free disk space
- A domain name (recommended for production)
- An SMTP server or relay for sending emails (Amazon SES, Mailgun, Postfix, etc.)

## Docker Compose Configuration

Create a directory for Keila:

```bash
mkdir -p ~/keila && cd ~/keila
```

Create a `docker-compose.yml` file:

```yaml
services:
  keila:
    image: pentacent/keila:0.14.9
    container_name: keila
    ports:
      - "127.0.0.1:4000:4000"
    environment:
      # Database connection
      DB_URL: postgres://keila:${POSTGRES_PASSWORD}@keila-db:5432/keila
      # Secret key — generate with: openssl rand -base64 48
      SECRET_KEY_BASE: ${SECRET_KEY_BASE}
      # Public URL of your Keila instance (no trailing slash)
      URL_HOST: ${URL_HOST}
      URL_SCHEMA: https
      URL_PORT: 443
      # SMTP configuration for sending emails
      MAILER_SMTP_HOST: ${MAILER_SMTP_HOST}
      MAILER_SMTP_PORT: ${MAILER_SMTP_PORT:-587}
      MAILER_SMTP_USER: ${MAILER_SMTP_USER}
      MAILER_SMTP_PASSWORD: ${MAILER_SMTP_PASSWORD}
      # Disable user registration after initial setup
      DISABLE_REGISTRATION: "true"
    volumes:
      - keila-uploads:/opt/app/uploads
    depends_on:
      keila-db:
        condition: service_healthy
    restart: unless-stopped

  keila-db:
    image: postgres:16-alpine
    container_name: keila-db
    environment:
      POSTGRES_USER: keila
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: keila
    volumes:
      - keila-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "keila"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  keila-db-data:
  keila-uploads:
```

Create a `.env` file alongside the Compose file:

```bash
# CHANGE THESE VALUES

# PostgreSQL password — generate with: openssl rand -hex 16
POSTGRES_PASSWORD=change_me_to_a_strong_password

# Secret key — generate with: openssl rand -base64 48
SECRET_KEY_BASE=change_me_to_a_random_base64_string

# Your domain (no https:// prefix, no trailing slash)
URL_HOST=keila.example.com

# SMTP settings for sending emails
MAILER_SMTP_HOST=smtp.example.com
MAILER_SMTP_PORT=587
MAILER_SMTP_USER=your-smtp-user
MAILER_SMTP_PASSWORD=your-smtp-password
```

Generate secure values:

```bash
# Generate PostgreSQL password
openssl rand -hex 16

# Generate secret key
openssl rand -base64 48
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:4000` in your browser (or your domain if reverse proxy is configured).
2. Create your admin account on the registration page.
3. After creating the account, set `DISABLE_REGISTRATION=true` in `.env` and restart: `docker compose up -d`.
4. Log in and create your first project.
5. Configure your sender identity under **Senders** — set the "From" name and email address.
6. Send a test email to verify SMTP is working.

## Configuration

### Sender Setup

Keila separates projects from senders. Each project can have its own sender configuration:

1. Go to your project → **Senders** → **New Sender**
2. Enter the sender name, email address, and reply-to address
3. Choose SMTP as the delivery method
4. Enter your SMTP credentials (or use the shared config from environment variables)
5. Send a test email to verify

### Contact Forms

One of Keila's standout features is embeddable contact forms:

1. Go to **Forms** → **New Form**
2. Customize the form fields and styling
3. Copy the embed code or use the hosted form URL
4. Forms support double opt-in automatically

### Segments

Create visual segments to target specific subscribers:

1. Go to **Segments** → **New Segment**
2. Use the visual builder to set conditions (tags, custom fields, activity)
3. Segments update dynamically — no need to rebuild manually

## Advanced Configuration (Optional)

### Captcha Protection

Keila supports hCaptcha and Friendly Captcha for form spam prevention:

```yaml
environment:
  CAPTCHA_PROVIDER: hcaptcha
  CAPTCHA_SITE_KEY: your-hcaptcha-site-key
  CAPTCHA_SECRET_KEY: your-hcaptcha-secret-key
```

### Custom Sender via Amazon SES

For high-volume sending, configure SES directly:

```yaml
environment:
  MAILER_SMTP_HOST: email-smtp.us-east-1.amazonaws.com
  MAILER_SMTP_PORT: 587
  MAILER_SMTP_USER: your-ses-access-key
  MAILER_SMTP_PASSWORD: your-ses-secret-key
```

Ensure your SES account is out of sandbox mode and your domain has verified SPF/DKIM records.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or another reverse proxy, point your domain to `localhost:4000`. Ensure WebSocket support is enabled for live preview functionality.

For Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy)):

```
keila.example.com {
    reverse_proxy localhost:4000
}
```

## Backup

Back up these volumes:

- **keila-db-data** — PostgreSQL database with all subscribers, campaigns, and settings
- **keila-uploads** — Uploaded media files

```bash
# Database backup
docker exec keila-db pg_dump -U keila keila > keila_backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v keila-uploads:/data -v $(pwd):/backup alpine \
  tar czf /backup/keila-uploads-$(date +%Y%m%d).tar.gz /data
```

See [Backup Strategy](/foundations/backup-strategy) for a complete backup approach.

## Troubleshooting

### Emails not sending

**Symptom:** Campaigns show as sent but recipients don't receive emails.
**Fix:** Verify SMTP credentials in your `.env` file. Check the Keila logs: `docker compose logs keila`. Common causes: wrong SMTP port (use 587 for TLS, 465 for SSL), incorrect credentials, or SES sandbox mode restricting recipients.

### Registration page unavailable after disable

**Symptom:** You set `DISABLE_REGISTRATION=true` before creating an account.
**Fix:** Temporarily set `DISABLE_REGISTRATION=false`, restart with `docker compose up -d`, create your account, then re-enable.

### Database connection errors

**Symptom:** Keila crashes on startup with PostgreSQL connection errors.
**Fix:** Ensure `POSTGRES_PASSWORD` in `.env` matches between the Keila and PostgreSQL services. Check that `keila-db` is healthy: `docker compose ps`. If the database was recently recreated, drop the volume and restart: `docker compose down -v && docker compose up -d`.

### Contact form submissions not working

**Symptom:** Form submissions return errors or don't create contacts.
**Fix:** Ensure `URL_HOST` matches your actual domain. Keila validates form origins against the configured host. If using a reverse proxy, verify `X-Forwarded-For` and `X-Forwarded-Proto` headers are passed correctly.

## Resource Requirements

- **RAM:** ~100-150 MB idle, ~300 MB under campaign sending load
- **CPU:** Low (Elixir/BEAM is efficient for concurrent operations)
- **Disk:** ~100 MB for the application, plus storage for uploads and PostgreSQL data

## Verdict

Keila is the best self-hosted newsletter tool for users who value a polished UI. The WYSIWYG editor, visual segmentation, and built-in contact forms make it more approachable than [Listmonk](/apps/listmonk), which requires HTML templates and SQL queries. For raw performance and minimal resource usage, Listmonk still wins — but Keila's user experience is meaningfully better for non-technical newsletter operators.

Choose Keila if you want visual tools. Choose [Listmonk](/apps/listmonk) if you want maximum throughput with minimum overhead.

## Frequently Asked Questions

### Does Keila support double opt-in?
Yes. Contact forms support double opt-in automatically. Subscribers receive a confirmation email before being added to your list.

### Can I import subscribers from Mailchimp?
Yes. Export your Mailchimp subscribers as CSV and import them into Keila via the Contacts section.

### Does Keila support transactional emails?
No. Keila is newsletters and marketing campaigns only. For transactional emails, pair it with [Listmonk](/apps/listmonk) or a dedicated transactional service.

## Related

- [Listmonk vs Keila](/compare/listmonk-vs-keila)
- [Listmonk vs Mautic](/compare/listmonk-vs-mautic)
- [How to Self-Host Listmonk](/apps/listmonk)
- [How to Self-Host Mautic](/apps/mautic)
- [Best Self-Hosted Newsletter Software](/best/newsletters)
- [Self-Hosted Alternatives to Mailchimp](/replace/mailchimp)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
