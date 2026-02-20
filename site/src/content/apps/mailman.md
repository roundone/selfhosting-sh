---
title: "How to Self-Host Mailman 3 with Docker Compose"
description: "Deploy GNU Mailman 3 with Docker Compose — the classic self-hosted mailing list manager with modern web archives and REST API."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "newsletters"
apps:
  - mailman
tags:
  - self-hosted
  - mailman
  - docker
  - mailing-list
  - newsletter
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Mailman?

[GNU Mailman](https://list.org/) is the granddaddy of mailing list software. Version 3 (Mailman 3) modernizes the classic with a REST API, a Django-based web UI (Postorius), and a web-based archive viewer (HyperKitty). It manages discussion-style mailing lists — think project mailing lists, community forums via email, and announcement lists.

Mailman is different from newsletter tools like [Listmonk](/apps/listmonk) or [Keila](/apps/keila). Those are one-to-many broadcast tools. Mailman is many-to-many — subscribers can reply, discuss, and interact through email. It's the tool for open-source projects, academic departments, community organizations, and any group that communicates via email threads.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free RAM (minimum)
- 5 GB of free disk space
- A domain name (required — Mailman needs proper DNS for email delivery)
- MX records pointing to your server (or an SMTP relay)

## Docker Compose Configuration

Create a directory for Mailman:

```bash
mkdir -p ~/mailman && cd ~/mailman
```

Create a `docker-compose.yml` file:

```yaml
services:
  mailman-core:
    image: maxking/mailman-core:0.4
    container_name: mailman-core
    hostname: mailman-core
    environment:
      DATABASE_URL: postgres://mailman:${DB_PASSWORD}@mailman-db:5432/mailman
      DATABASE_TYPE: postgres
      DATABASE_CLASS: mailman.database.postgresql.PostgreSQLDatabase
      HYPERKITTY_API_KEY: ${HYPERKITTY_API_KEY}
      SMTP_HOST: localhost
      SMTP_PORT: "25"
      MTA: postfix
    volumes:
      - mailman-core-data:/opt/mailman
    depends_on:
      mailman-db:
        condition: service_healthy
    restart: unless-stopped

  mailman-web:
    image: maxking/mailman-web:0.4
    container_name: mailman-web
    hostname: mailman-web
    ports:
      - "127.0.0.1:8000:8000"
      - "127.0.0.1:8080:8080"
    environment:
      DATABASE_URL: postgres://mailman:${DB_PASSWORD}@mailman-db:5432/mailmanweb
      HYPERKITTY_API_KEY: ${HYPERKITTY_API_KEY}
      SECRET_KEY: ${SECRET_KEY}
      SERVE_FROM_DOMAIN: ${DOMAIN}
      MAILMAN_ADMIN_USER: admin
      MAILMAN_ADMIN_EMAIL: ${ADMIN_EMAIL}
      # Django settings
      DJANGO_ALLOWED_HOSTS: ${DOMAIN}
    volumes:
      - mailman-web-data:/opt/mailman-web-data
    depends_on:
      mailman-core:
        condition: service_started
      mailman-db:
        condition: service_healthy
    restart: unless-stopped

  mailman-db:
    image: postgres:16-alpine
    container_name: mailman-db
    environment:
      POSTGRES_USER: mailman
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mailman-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "mailman"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  mailman-core-data:
  mailman-web-data:
  mailman-db-data:
```

Create a `.env` file:

```bash
# CHANGE ALL OF THESE VALUES

# Domain name for your Mailman instance
DOMAIN=lists.example.com

# Admin email address
ADMIN_EMAIL=admin@example.com

# Database password — generate with: openssl rand -hex 16
DB_PASSWORD=change_me_to_a_strong_password

# HyperKitty API key — generate with: openssl rand -hex 32
HYPERKITTY_API_KEY=change_me_to_a_random_hex_string

# Django secret key — generate with: openssl rand -hex 32
SECRET_KEY=change_me_to_a_different_random_hex_string
```

**Note:** Mailman 3 requires two PostgreSQL databases (one for core, one for web). The maxking Docker images handle this automatically.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Create the Mailman web databases:

```bash
docker exec mailman-web python3 manage.py migrate
docker exec mailman-web python3 manage.py createsuperuser
```

2. Open `http://your-server-ip:8000` in your browser.
3. Log in with the superuser credentials you just created.
4. Go to **Postorius** → **Domains** → **Add Domain** → enter your domain.
5. Create your first mailing list under that domain.
6. Configure your MTA (Postfix, Exim, etc.) to route list emails to Mailman.

## Configuration

### MTA Integration

Mailman needs a Mail Transfer Agent to receive and send emails. The most common setup uses Postfix:

1. Configure Postfix to forward list emails to Mailman's LMTP port
2. Mailman processes the email and distributes it to list subscribers
3. Replies from subscribers flow back through Postfix → Mailman → subscribers

This is the most complex part of the setup. Refer to Mailman's [MTA integration docs](https://docs.list.org/en/latest/src/mailman/docs/mta.html) for detailed Postfix/Exim configuration.

### List Settings

Each mailing list has extensive settings:

- **Subscription policy:** Open, confirm, moderate, or confirm+moderate
- **Posting policy:** Who can post — subscribers only, anyone, moderated
- **Archive:** Public or private HyperKitty archives
- **Moderation:** Default moderation, per-user moderation rules
- **Digest:** Regular digest emails for low-traffic subscribers
- **Bounce processing:** Automatic bounce handling and removal

### HyperKitty Archives

HyperKitty provides a web-based archive of all mailing list discussions:

- Accessible at `http://your-domain:8080/hyperkitty/`
- Searchable, threaded view of all list emails
- Public or private based on list settings
- RSS feeds for each list

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy)):

```
lists.example.com {
    reverse_proxy /postorius/* localhost:8000
    reverse_proxy /hyperkitty/* localhost:8000
    reverse_proxy /accounts/* localhost:8000
    reverse_proxy /admin/* localhost:8000
    reverse_proxy /* localhost:8000
}
```

## Backup

Back up these volumes:

- **mailman-db-data** — PostgreSQL databases (core + web)
- **mailman-core-data** — Mailman core data, list configurations
- **mailman-web-data** — Web interface data, templates

```bash
# Database backup
docker exec mailman-db pg_dumpall -U mailman > mailman_backup_$(date +%Y%m%d).sql
```

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Web interface shows 500 error

**Symptom:** Postorius returns server errors.
**Fix:** Check that database migrations are complete: `docker exec mailman-web python3 manage.py migrate`. Check logs: `docker compose logs mailman-web`.

### Emails not delivered to list

**Symptom:** Sending to the list address doesn't reach subscribers.
**Fix:** Verify your MTA (Postfix) is configured to route list addresses to Mailman's LMTP port. Check `docker compose logs mailman-core` for incoming email processing.

### HyperKitty not showing archives

**Symptom:** Archive pages are empty.
**Fix:** Verify `HYPERKITTY_API_KEY` matches between `mailman-core` and `mailman-web` containers. Archives are pushed from core to HyperKitty via this API key.

## Resource Requirements

- **RAM:** ~300-500 MB idle (core + web + PostgreSQL)
- **CPU:** Low-Medium
- **Disk:** ~200 MB for the application, plus archive growth

## Verdict

Mailman 3 is the right tool for discussion-based mailing lists — open-source project communication, community groups, academic departments. Its threading, moderation, and archive features are purpose-built for many-to-many email discussion.

It's not the right tool for newsletters. If you need one-to-many email campaigns (marketing, announcements), use [Listmonk](/apps/listmonk), [Keila](/apps/keila), or [Mautic](/apps/mautic). The setup complexity of Mailman (MTA integration, DNS, multiple containers) is only justified when you need actual mailing list functionality.

## Frequently Asked Questions

### Is Mailman 3 the same as Mailman 2?
No. Mailman 3 is a complete rewrite with a REST API, Django web UI (Postorius), and modern archives (HyperKitty). Mailman 2 is legacy — migrate to 3 for active development and security updates.

### Do I need my own mail server?
Yes. Mailman requires an MTA (Postfix, Exim, etc.) to send and receive emails. This is the most complex part of the setup. It's not a service like Mailchimp that handles delivery for you.

### Can I use Mailman with an SMTP relay like Amazon SES?
For outbound email, yes — configure your MTA to relay through SES. For inbound email (receiving replies from subscribers), you need an MTA that accepts incoming mail.

## Related

- [How to Self-Host Listmonk](/apps/listmonk)
- [How to Self-Host Keila](/apps/keila)
- [How to Self-Host Mautic](/apps/mautic)
- [Listmonk vs Keila](/compare/listmonk-vs-keila)
- [Best Self-Hosted Newsletter Software](/best/newsletters)
- [Self-Hosted Alternatives to Mailchimp](/replace/mailchimp)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
