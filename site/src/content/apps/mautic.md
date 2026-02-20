---
title: "How to Self-Host Mautic with Docker Compose"
description: "Deploy Mautic with Docker Compose — a full marketing automation platform with campaigns, lead scoring, and landing pages."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "newsletters"
apps:
  - mautic
tags:
  - self-hosted
  - mautic
  - docker
  - marketing-automation
  - newsletter
  - mailchimp-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Mautic?

[Mautic](https://www.mautic.org/) is a self-hosted marketing automation platform. It handles email campaigns, contact management, lead scoring, landing pages, dynamic content, forms, and CRM integrations. It's the self-hosted answer to HubSpot, ActiveCampaign, and Marketo — running on your server with unlimited contacts and zero per-subscriber fees.

Mautic is GPL-3.0 licensed, backed by a large open-source community, and replaces [Mailchimp](/replace/mailchimp) and more expensive marketing SaaS platforms. If you need more than newsletters — drip campaigns, lead scoring, automation workflows — Mautic is the tool.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 2 GB of free RAM (minimum, 4 GB recommended)
- 5 GB of free disk space
- A domain name (required for production use)
- An SMTP server or relay (Amazon SES, Mailgun, Postfix, etc.)

## Docker Compose Configuration

Create a directory for Mautic:

```bash
mkdir -p ~/mautic && cd ~/mautic
```

Create a `docker-compose.yml` file:

```yaml
services:
  mautic-web:
    image: mautic/mautic:6.0.7-apache
    container_name: mautic-web
    ports:
      - "127.0.0.1:8080:80"
    environment:
      # Database configuration
      MAUTIC_DB_HOST: mautic-db
      MAUTIC_DB_PORT: "3306"
      MAUTIC_DB_DATABASE: mautic
      MAUTIC_DB_USER: mautic
      MAUTIC_DB_PASSWORD: ${DB_PASSWORD}
      # Container role — this one serves the web UI
      DOCKER_MAUTIC_ROLE: mautic_web
      # PHP tuning
      PHP_INI_VALUE_MEMORY_LIMIT: 512M
      PHP_INI_VALUE_UPLOAD_MAX_FILESIZE: 64M
      PHP_INI_VALUE_POST_MAX_FILESIZE: 64M
      PHP_INI_VALUE_MAX_EXECUTION_TIME: "300"
      PHP_INI_VALUE_DATE_TIMEZONE: UTC
    volumes:
      - mautic-config:/var/www/html/config
      - mautic-logs:/var/www/html/var/logs
      - mautic-media-files:/var/www/html/docroot/media/files
      - mautic-media-images:/var/www/html/docroot/media/images
    depends_on:
      mautic-db:
        condition: service_healthy
    restart: unless-stopped

  mautic-worker:
    image: mautic/mautic:6.0.7-apache
    container_name: mautic-worker
    environment:
      MAUTIC_DB_HOST: mautic-db
      MAUTIC_DB_PORT: "3306"
      MAUTIC_DB_DATABASE: mautic
      MAUTIC_DB_USER: mautic
      MAUTIC_DB_PASSWORD: ${DB_PASSWORD}
      # Worker role — processes email and hit queues
      DOCKER_MAUTIC_ROLE: mautic_worker
      DOCKER_MAUTIC_WORKERS_CONSUME_EMAIL: "2"
      DOCKER_MAUTIC_WORKERS_CONSUME_HIT: "2"
      DOCKER_MAUTIC_WORKERS_CONSUME_FAILED: "2"
      PHP_INI_VALUE_MEMORY_LIMIT: 512M
      PHP_INI_VALUE_DATE_TIMEZONE: UTC
    volumes:
      - mautic-config:/var/www/html/config
      - mautic-logs:/var/www/html/var/logs
      - mautic-media-files:/var/www/html/docroot/media/files
      - mautic-media-images:/var/www/html/docroot/media/images
    depends_on:
      mautic-db:
        condition: service_healthy
    restart: unless-stopped

  mautic-cron:
    image: mautic/mautic:6.0.7-apache
    container_name: mautic-cron
    environment:
      MAUTIC_DB_HOST: mautic-db
      MAUTIC_DB_PORT: "3306"
      MAUTIC_DB_DATABASE: mautic
      MAUTIC_DB_USER: mautic
      MAUTIC_DB_PASSWORD: ${DB_PASSWORD}
      # Cron role — runs scheduled tasks (segment rebuild, campaign triggers)
      DOCKER_MAUTIC_ROLE: mautic_cron
      PHP_INI_VALUE_MEMORY_LIMIT: 512M
      PHP_INI_VALUE_DATE_TIMEZONE: UTC
    volumes:
      - mautic-config:/var/www/html/config
      - mautic-logs:/var/www/html/var/logs
      - mautic-media-files:/var/www/html/docroot/media/files
      - mautic-media-images:/var/www/html/docroot/media/images
    depends_on:
      mautic-db:
        condition: service_healthy
    restart: unless-stopped

  mautic-db:
    image: mysql:lts
    container_name: mautic-db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: mautic
      MYSQL_USER: mautic
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mautic-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

volumes:
  mautic-config:
  mautic-logs:
  mautic-media-files:
  mautic-media-images:
  mautic-db-data:
```

Create a `.env` file:

```bash
# CHANGE THESE VALUES — generate with: openssl rand -hex 16

# MySQL passwords
DB_PASSWORD=change_me_to_a_strong_password
DB_ROOT_PASSWORD=change_me_to_a_different_strong_password
```

Start the stack:

```bash
docker compose up -d
```

The first startup runs database migrations and may need 1-2 minutes.

## Initial Setup

1. Open `http://your-server-ip:8080` in your browser.
2. Complete the installation wizard:
   - Set your admin username, email, and password
   - Database settings are pre-configured from environment variables — leave defaults
   - Configure your email (SMTP) settings: host, port, username, password, encryption
3. After setup, log in with your admin credentials.
4. Go to **Configuration** → **Email Settings** to verify or update SMTP configuration.
5. Send a test email from **Configuration** → **Email Settings** → **Test Connection**.

## Configuration

### Email Sending

Configure SMTP under **Configuration** → **Email Settings**:

- **Mailer Transport:** SMTP
- **Host:** Your SMTP server (e.g., `email-smtp.us-east-1.amazonaws.com` for SES)
- **Port:** 587 (TLS) or 465 (SSL)
- **Encryption:** TLS
- **Authentication mode:** Login
- **Username/Password:** Your SMTP credentials

### Tracking

Mautic tracks email opens, link clicks, and website visits. To enable website tracking:

1. Go to **Configuration** → **Tracking Settings**
2. Copy the tracking pixel code
3. Add it to your website's HTML

### Campaigns

Mautic's campaign builder is its killer feature:

1. Go to **Campaigns** → **New**
2. Add a contact source (segment, form, or specific contacts)
3. Build your automation workflow with conditions, actions, and decisions
4. Actions include: send email, add to segment, update contact, webhook, push to CRM

### Landing Pages

Create landing pages at **Components** → **Landing Pages** → **New**. Mautic includes a drag-and-drop builder and supports custom HTML. Landing pages are served directly from your Mautic instance.

## Advanced Configuration (Optional)

### Using RabbitMQ for Message Queues

For high-volume installations, replace the default Doctrine message queue with RabbitMQ:

```yaml
# Add to docker-compose.yml
  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    container_name: mautic-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: mautic
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    restart: unless-stopped
```

Then set the messenger DSN in your Mautic containers:

```yaml
environment:
  MAUTIC_MESSENGER_DSN_EMAIL: "amqp://mautic:${RABBITMQ_PASSWORD}@rabbitmq:5672/%2f/messages"
  MAUTIC_MESSENGER_DSN_HIT: "amqp://mautic:${RABBITMQ_PASSWORD}@rabbitmq:5672/%2f/messages"
```

### CRM Integration

Mautic supports Salesforce, SugarCRM, vTiger, and other CRMs via plugins:

1. Go to **Settings** → **Plugins**
2. Click **Install/Upgrade Plugins**
3. Configure the plugin with your CRM's API credentials

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy)):

```
mautic.example.com {
    reverse_proxy localhost:8080
}
```

Ensure the `MAUTIC_URL` in Mautic's configuration matches your public domain. Update **Configuration** → **System Settings** → **Site URL** after setting up the reverse proxy.

## Backup

Back up these volumes:

- **mautic-db-data** — MySQL database with all contacts, campaigns, and settings
- **mautic-config** — Configuration files
- **mautic-media-files** and **mautic-media-images** — Uploaded media

```bash
# Database backup
docker exec mautic-db mysqldump -u root -p"${DB_ROOT_PASSWORD}" mautic > mautic_backup_$(date +%Y%m%d).sql

# Volume backup
for vol in mautic-config mautic-media-files mautic-media-images; do
  docker run --rm -v ${vol}:/data -v $(pwd):/backup alpine \
    tar czf /backup/${vol}-$(date +%Y%m%d).tar.gz /data
done
```

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Emails stuck in queue

**Symptom:** Campaigns show as sent but emails remain in the queue.
**Fix:** Check the worker container is running: `docker compose ps mautic-worker`. Check worker logs: `docker compose logs mautic-worker`. The worker processes email queues — if it's not running, emails pile up.

### Cron jobs not executing

**Symptom:** Segments don't rebuild, campaigns don't trigger on schedule.
**Fix:** Verify the cron container is running: `docker compose ps mautic-cron`. Check logs: `docker compose logs mautic-cron`. The cron container handles scheduled tasks like segment rebuilding and campaign triggers.

### Installation wizard loops

**Symptom:** The installer keeps showing even after completing setup.
**Fix:** Check that the `mautic-config` volume persists between restarts. If the volume was deleted, Mautic loses its `local.php` config and restarts the installer. Ensure you're not using anonymous volumes.

### High memory usage

**Symptom:** PHP processes consume excessive RAM.
**Fix:** Tune `PHP_INI_VALUE_MEMORY_LIMIT`. Default 512M is appropriate for most installations. For large contact databases (50K+), increase to 1024M. Also check for stuck worker processes: `docker compose restart mautic-worker`.

### Slow database queries

**Symptom:** Pages load slowly, especially contact lists and segments.
**Fix:** MySQL performance tuning. Add `innodb_buffer_pool_size=256M` to MySQL config. For large databases, increase to 512M or 1G. Ensure database indexes are up to date via Mautic's maintenance commands.

## Resource Requirements

- **RAM:** ~300-500 MB idle (all 3 containers + MySQL), ~1-2 GB under campaign sending load
- **CPU:** Medium (campaign processing and email queue are CPU-intensive)
- **Disk:** ~500 MB for the application, plus MySQL data and media uploads. Budget 2-5 GB for a typical installation.

## Verdict

Mautic is the only serious self-hosted marketing automation platform. If you need drip campaigns, lead scoring, landing pages, or CRM integration, nothing else in the self-hosted space comes close. The trade-off is complexity — four containers, PHP stack, careful configuration.

If you only need newsletters, use [Listmonk](/apps/listmonk) instead. It's dramatically simpler and lighter. But if you're replacing HubSpot, ActiveCampaign, or Marketo — Mautic is the tool.

## Frequently Asked Questions

### How many contacts can Mautic handle?
On a 2 GB RAM server, Mautic handles up to ~50,000 contacts comfortably. For 100K+, increase RAM to 4-8 GB and tune MySQL's `innodb_buffer_pool_size`.

### Does Mautic support A/B testing?
Yes. Create email A/B tests with different subject lines, content, or send times. Mautic automatically sends to a percentage of your list and picks the winner.

### Can I use Mautic with Amazon SES?
Yes. SES is the recommended SMTP relay for cost-effective high-volume sending. Configure it under Email Settings with your SES SMTP credentials.

## Related

- [Listmonk vs Mautic](/compare/listmonk-vs-mautic)
- [Mautic vs Mailchimp](/compare/mautic-vs-mailchimp)
- [How to Self-Host Listmonk](/apps/listmonk)
- [How to Self-Host Keila](/apps/keila)
- [Best Self-Hosted Newsletter Software](/best/newsletters)
- [Self-Hosted Alternatives to Mailchimp](/replace/mailchimp)
- [Self-Hosted Alternatives to ConvertKit](/replace/convertkit)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
- [Backup Strategy](/foundations/backup-strategy)
