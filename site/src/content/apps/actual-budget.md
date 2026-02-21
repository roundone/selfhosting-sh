---
title: "How to Self-Host Actual Budget with Docker"
description: "Deploy Actual Budget with Docker Compose — a self-hosted personal finance app with envelope budgeting and bank sync."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "personal-finance"
apps:
  - actual-budget
tags:
  - self-hosted
  - actual-budget
  - docker
  - budgeting
  - personal-finance
  - ynab-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Actual Budget?

[Actual Budget](https://actualbudget.org/) is a self-hosted personal finance and budgeting app. It uses envelope budgeting (like YNAB) — assign every dollar a job, track spending by category, and see where your money goes. Actual is fast, works offline, supports bank syncing (via GoCardless/SimpleFIN), and runs as a local-first web app that syncs between devices through your own server. It's the best self-hosted alternative to YNAB and Mint.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM
- 500 MB of free disk space
- A domain name (recommended for multi-device sync)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  actual:
    image: actualbudget/actual-server:25.2.1
    container_name: actual
    restart: unless-stopped
    ports:
      - "5006:5006"
    volumes:
      - actual_data:/data
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:5006/"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  actual_data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:5006` in your browser
2. Set a server password — this protects access to your financial data
3. Create your first budget file
4. Start adding accounts and budget categories

Actual is a local-first app — the server syncs data between your devices, but the app works entirely offline. All budget operations happen in the browser.

## Configuration

### Bank Syncing

Actual supports automatic bank transaction imports:

- **GoCardless** (Europe): Free via open banking APIs for European banks
- **SimpleFIN** ($1.50/month): US bank connection service

Configure under **Settings → Linked Accounts** in the Actual web app.

### Multi-Device Sync

The server handles sync between devices:

1. Open Actual on a second device
2. Enter the same server URL and password
3. Download your budget file
4. Changes sync automatically

### Budget Categories

Set up envelope-style budgeting:
1. Create categories (Rent, Groceries, Entertainment, etc.)
2. Assign available income to categories each month
3. Track spending against budget — overspending in one category takes from another

### Transaction Import

Import from banks via:
- **OFX/QFX files:** Download from your bank's website
- **CSV import:** Map columns to Actual's fields
- **Bank sync:** Automatic via GoCardless or SimpleFIN

## Reverse Proxy

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** actual
- **Forward Port:** 5006
- **Enable WebSocket Support:** Yes (for sync)

HTTPS is strongly recommended since financial data is being transmitted.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

Actual stores everything in the `/data` volume:

```bash
docker run --rm -v actual_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/actual-backup-$(date +%Y%m%d).tar.gz /data
```

You can also export budget files from within the Actual web app.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### Sync Not Working Between Devices

**Symptom:** Changes on one device don't appear on another.
**Fix:** Ensure both devices connect to the same server URL and use the same budget file. Check WebSocket connectivity — sync relies on WebSockets. If behind a reverse proxy, ensure WebSocket support is enabled.

### Bank Sync Errors

**Symptom:** GoCardless or SimpleFIN connection fails or returns errors.
**Fix:** Re-authenticate the bank connection. Bank APIs occasionally require re-authorization. Check Actual's sync logs in the web app under the linked account settings.

### Budget File Won't Open

**Symptom:** Server starts but budget file fails to load.
**Fix:** Check the `/data` volume for corruption. Actual keeps backups — look for `.backup` files in the data directory. Restore from the most recent backup.

## Resource Requirements

- **RAM:** ~50-100 MB
- **CPU:** Negligible — all heavy work happens client-side in the browser
- **Disk:** ~50 MB for the application, budget files are small (kilobytes to low megabytes)

## Verdict

Actual Budget is the best self-hosted budgeting app. The envelope budgeting approach works, the UI is fast and clean, and the local-first architecture means it works even when your server is down. Bank syncing via GoCardless (Europe) or SimpleFIN (US, $1.50/month) automates transaction imports. If you need more traditional accounting (double-entry, invoicing, tax tracking), look at [Firefly III](/apps/firefly-iii/). But for personal budgeting, Actual is the clear winner.

## Related

- [Best Self-Hosted Personal Finance Apps](/best/personal-finance/)
- [Actual Budget vs Firefly III](/compare/actual-vs-firefly-iii/)
- [Replace YNAB with Self-Hosted Budget](/replace/ynab/)
- [Replace Mint with Self-Hosted Finance](/replace/mint/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
