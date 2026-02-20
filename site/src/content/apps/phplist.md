---
title: "How to Self-Host phpList with Docker Compose"
description: "Deploy phpList with Docker Compose — a battle-tested, self-hosted newsletter and mailing list manager for high-volume email."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "newsletters"
apps:
  - phplist
tags:
  - self-hosted
  - phplist
  - docker
  - newsletter
  - mailing-list
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is phpList?

[phpList](https://www.phplist.org/) is one of the oldest and most proven self-hosted newsletter platforms, in active development since 2000. It handles subscriber management, campaign creation, bounce processing, and analytics — all via a PHP web interface backed by MySQL. phpList powers over 25 billion messages sent worldwide.

phpList is GPL-licensed and designed for high-volume email sending. It supports throttling, bounce management, advanced subscriber attributes, and RSS-to-email campaigns. It's not the prettiest tool — the UI shows its age — but it's rock-solid for large mailing lists.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free RAM (minimum)
- 2 GB of free disk space
- A domain name (recommended)
- An SMTP server or relay for sending emails

## Docker Compose Configuration

Create a directory for phpList:

```bash
mkdir -p ~/phplist && cd ~/phplist
```

Create a `docker-compose.yml` file:

```yaml
services:
  phplist:
    image: phplist/phplist:3.6.15
    container_name: phplist
    ports:
      - "127.0.0.1:8080:80"
    environment:
      PHPLIST_DATABASE_HOST: phplist-db
      PHPLIST_DATABASE_NAME: phplist
      PHPLIST_DATABASE_USER: phplist
      PHPLIST_DATABASE_PASSWORD: ${DB_PASSWORD}
      # Admin settings
      PHPLIST_ADMIN_PASSWORD: ${ADMIN_PASSWORD}
    volumes:
      - phplist-data:/var/www/html/lists/uploadimages
      - phplist-config:/var/www/html/lists/config
    depends_on:
      phplist-db:
        condition: service_healthy
    restart: unless-stopped

  phplist-db:
    image: mariadb:11
    container_name: phplist-db
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: phplist
      MYSQL_USER: phplist
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - phplist-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  phplist-data:
  phplist-config:
  phplist-db-data:
```

Create a `.env` file:

```bash
# CHANGE THESE VALUES

# Database passwords — generate with: openssl rand -hex 16
DB_PASSWORD=change_me_to_a_strong_password
DB_ROOT_PASSWORD=change_me_to_a_different_password

# phpList admin password
ADMIN_PASSWORD=change_me_admin_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080/lists/admin/` in your browser.
2. Log in with username **admin** and the password from `ADMIN_PASSWORD`.
3. Go to **Config** → **General Settings**:
   - Set your admin email address
   - Configure the bounce email address
   - Set the website URL
4. Go to **Config** → **Define Sending Method**:
   - Select SMTP
   - Enter your SMTP server, port, username, and password
5. Send a test campaign to verify delivery.

## Configuration

### SMTP Setup

phpList's sending is configured through the web admin under **Config** → **Define Sending Method**:

- **SMTP hostname:** Your SMTP relay (e.g., `email-smtp.us-east-1.amazonaws.com`)
- **SMTP port:** 587 (TLS) or 465 (SSL)
- **SMTP user/password:** Your SMTP credentials
- **Envelope sender:** The bounce-handling email address

### Throttling

phpList includes built-in throttling to protect your SMTP reputation:

- **Messages per hour:** Set in Config → **Throttle sending**
- **Batch size:** Number of emails sent before pausing
- **Batch period:** Seconds to wait between batches

For Amazon SES, start with 50 emails/second and increase as your SES account reputation builds.

### Bounce Processing

phpList handles bounces automatically when configured:

1. Set up a dedicated bounce email address (e.g., `bounce@yourdomain.com`)
2. Configure POP3/IMAP access to that mailbox in **Config** → **Bounce Settings**
3. phpList checks the mailbox, processes bounces, and auto-unsubscribes hard bounces

### Subscriber Attributes

phpList supports custom subscriber attributes beyond email:

1. Go to **Config** → **Configure Attributes**
2. Add fields like name, company, location, preferences
3. Use attributes for segmentation and personalized content

## Reverse Proxy

Behind Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy-explained)):

```
newsletter.example.com {
    reverse_proxy localhost:8080
}
```

## Backup

Back up these volumes:

- **phplist-db-data** — MySQL database with all subscribers, campaigns, and settings
- **phplist-data** — Uploaded images and attachments
- **phplist-config** — Configuration files

```bash
# Database backup
docker exec phplist-db mysqldump -u root -p"${DB_ROOT_PASSWORD}" phplist > phplist_backup_$(date +%Y%m%d).sql
```

See [Backup Strategy](/foundations/backup-strategy) for a complete approach.

## Troubleshooting

### Queue not processing

**Symptom:** Campaigns are queued but emails aren't sent.
**Fix:** phpList requires you to manually trigger queue processing from the admin UI (**Campaigns** → **Process Queue**) or set up a cron job. For Docker, add a cron container or use `docker exec phplist php /var/www/html/lists/admin/index.php -pprocessqueue` via system cron.

### Bounce processing not working

**Symptom:** Bounced addresses aren't being unsubscribed.
**Fix:** Verify POP3/IMAP credentials in Bounce Settings. Process bounces manually from admin to test. Ensure the bounce mailbox is accessible from the container.

### "Table doesn't exist" errors

**Symptom:** Database errors after fresh installation.
**Fix:** phpList may need to initialize its database tables. Visit the admin URL — phpList should detect missing tables and offer to create them. If not, check that the database user has CREATE TABLE permissions.

## Resource Requirements

- **RAM:** ~100-200 MB idle (PHP + MariaDB)
- **CPU:** Low
- **Disk:** ~200 MB for the application, plus database growth proportional to subscriber count

## Verdict

phpList is the proven workhorse of self-hosted email. If you need reliable, high-volume newsletter sending with battle-tested bounce processing and throttling, phpList has 20+ years of production use behind it. The UI is dated, but the email sending infrastructure is solid.

For a modern UI and simpler setup, use [Listmonk](/apps/listmonk) or [Keila](/apps/keila). For marketing automation beyond newsletters, use [Mautic](/apps/mautic). phpList is the choice when reliability and volume matter more than UI polish.

## Frequently Asked Questions

### How many subscribers can phpList handle?
phpList handles millions of subscribers. The bottleneck is your SMTP relay's throughput, not phpList itself. Proper throttling configuration is key.

### Does phpList support double opt-in?
Yes. Double opt-in is built-in and configurable per subscription form.

### Can I import subscribers from Mailchimp?
Yes. Export your Mailchimp list as CSV and import via phpList's admin interface under **Subscribers** → **Import**.

## Related

- [How to Self-Host Listmonk](/apps/listmonk)
- [How to Self-Host Keila](/apps/keila)
- [How to Self-Host Mautic](/apps/mautic)
- [Listmonk vs Keila](/compare/listmonk-vs-keila)
- [Best Self-Hosted Newsletter Software](/best/newsletters)
- [Self-Hosted Alternatives to Mailchimp](/replace/mailchimp)
- [Docker Compose Basics](/foundations/docker-compose-basics)
