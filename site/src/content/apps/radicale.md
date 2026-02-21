---
title: "How to Self-Host Radicale with Docker Compose"
description: "Deploy Radicale with Docker Compose — a lightweight CalDAV and CardDAV server for self-hosted calendar and contacts sync."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "calendar-contacts"
apps:
  - radicale
tags:
  - self-hosted
  - radicale
  - docker
  - caldav
  - carddav
  - calendar
  - contacts
  - google-calendar-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Radicale?

[Radicale](https://radicale.org/) is a lightweight CalDAV and CardDAV server. It syncs your calendars and contacts across all your devices — replacing Google Calendar, iCloud Calendar, Google Contacts, and iCloud Contacts. Radicale is written in Python, stores data as simple files on disk, requires no database, and runs with minimal resources. It works with any CalDAV/CardDAV client: Thunderbird, GNOME Calendar, iOS Calendar/Contacts, macOS Calendar/Contacts, DAVx5 (Android), and more.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 64 MB of free RAM
- 100 MB of free disk space
- A domain name (strongly recommended — most CalDAV clients require HTTPS)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  radicale:
    image: tomsquest/docker-radicale:3.6.0.0
    container_name: radicale
    restart: unless-stopped
    ports:
      - "5232:5232"
    volumes:
      - radicale_data:/data
      - ./config:/config:ro
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5232/.well-known/caldav"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  radicale_data:
```

Create the configuration file at `./config/config`:

```ini
[server]
hosts = 0.0.0.0:5232

[auth]
type = htpasswd
htpasswd_filename = /data/users
htpasswd_encryption = bcrypt

[storage]
filesystem_folder = /data/collections

[rights]
type = owner_only
```

Create a user with htpasswd:

```bash
mkdir -p config
docker run --rm -it tomsquest/docker-radicale:3.6.0.0 htpasswd -nBC 10 admin
```

Copy the output line into a `users` file and mount it, or create it directly:

```bash
# Install htpasswd tool on host
apt install apache2-utils  # or: apk add apache2-utils
htpasswd -nBC 10 admin > ./users
```

Then mount the users file:

```yaml
volumes:
  - radicale_data:/data
  - ./config:/config:ro
  - ./users:/data/users:ro
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:5232` in your browser
2. Log in with the username and password you created
3. Click **Create new address book** or **Create new calendar**
4. Configure your clients to connect (see below)

### Client Configuration

The CalDAV/CardDAV URL pattern is:

```
https://your-domain:5232/user/calendar-name/
```

#### iOS / macOS
1. **Settings → Calendar → Accounts → Add Account → Other → CalDAV**
2. Server: `your-domain:5232`
3. Username and password
4. Repeat for **Contacts → CardDAV**

#### Android (DAVx5)
1. Install [DAVx5](https://www.davx5.com/) from F-Droid or Play Store
2. Add account with URL: `https://your-domain:5232`
3. Username and password
4. DAVx5 auto-discovers calendars and contacts

#### Thunderbird
1. **Calendar → New Calendar → Network → CalDAV**
2. Location: `https://your-domain:5232/user/calendar-name/`

## Configuration

### Multiple Users

Create additional users:

```bash
htpasswd -BC 10 ./users newuser
docker compose restart radicale
```

Each user's calendars and contacts are isolated by default (with `rights = owner_only`).

### Shared Calendars

To allow calendar sharing between users, change the rights configuration:

```ini
[rights]
type = from_file
file = /config/rights
```

Create `./config/rights`:

```ini
# Allow read access to shared calendar
[shared-calendar-read]
user: .*
collection: shared/.*
permissions: rR

# Allow admin full access everywhere
[admin-full]
user: admin
collection: .*
permissions: RrWw
```

### Auto-Discovery

For automatic client discovery, configure your reverse proxy to handle `.well-known` URLs:

```
/.well-known/caldav  → redirect to /
/.well-known/carddav → redirect to /
```

This allows clients to find the CalDAV/CardDAV server using just the domain name.

## Reverse Proxy

HTTPS is required for most CalDAV/CardDAV clients. Set up a reverse proxy with SSL:

Nginx Proxy Manager config:
- **Scheme:** http
- **Forward Hostname:** radicale
- **Forward Port:** 5232
- Add **Custom Location** for `/.well-known/caldav` redirecting to `/`
- Add **Custom Location** for `/.well-known/carddav` redirecting to `/`

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for full configuration.

## Backup

Radicale stores everything as files — no database to dump:

```bash
docker run --rm -v radicale_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/radicale-backup-$(date +%Y%m%d).tar.gz /data
```

This backs up all calendars, contacts, and user configuration.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a complete backup approach.

## Troubleshooting

### Client Says "Server Not Found" or "SSL Error"

**Symptom:** CalDAV clients can't connect, report SSL or connection errors.
**Fix:** Most clients require HTTPS. Set up a reverse proxy with SSL. Radicale itself doesn't handle TLS — it relies on the proxy.

### Calendar Events Not Syncing

**Symptom:** Events created on one device don't appear on another.
**Fix:** Check that both devices use the same CalDAV URL pointing to the same calendar. In DAVx5, force a sync. Verify Radicale logs:

```bash
docker compose logs radicale
```

### 403 Forbidden When Creating Calendar

**Symptom:** Client gets 403 when trying to create a new calendar or address book.
**Fix:** Check the `rights` configuration. With `owner_only`, users can only create collections under their own username path (e.g., `/admin/my-calendar/`).

### iOS/macOS Shows "Account Error"

**Symptom:** Apple devices show persistent "cannot verify account" errors.
**Fix:** Ensure `.well-known` redirects are configured. Apple clients are strict about CalDAV discovery. Also verify your SSL certificate is valid (not self-signed) — Apple rejects self-signed certs.

## Resource Requirements

- **RAM:** ~30-50 MB
- **CPU:** Negligible
- **Disk:** ~10 MB for the application, contacts and calendars are tiny (kilobytes per entry)

## Verdict

Radicale is the best lightweight CalDAV/CardDAV server. It does exactly one thing: sync calendars and contacts across devices. No web UI for managing events (use your native calendar app), no database, no complexity. If you want a web-based calendar interface, look at [Baikal](/apps/baikal/) (still CalDAV, but with a nicer web admin) or pair Radicale with a web calendar client. For pure sync with minimal resource usage, Radicale is unbeatable.

## Related

- [Best Self-Hosted Calendar & Contacts](/best/calendar-contacts/)
- [Radicale vs Baikal](/compare/radicale-vs-baikal/)
- [Replace Google Calendar with Self-Hosted](/replace/google-calendar/)
- [Replace iCloud Calendar with Self-Hosted](/replace/icloud-calendar/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
