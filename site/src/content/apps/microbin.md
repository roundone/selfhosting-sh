---
title: "How to Self-Host MicroBin with Docker Compose"
description: "Step-by-step guide to self-hosting MicroBin with Docker for a lightweight pastebin with file sharing and URL shortening."
date: 2026-02-17
dateUpdated: 2026-02-17
category: "pastebin-snippets"
apps:
  - microbin
tags:
  - docker
  - pastebin
  - file-sharing
  - self-hosted
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is MicroBin?

MicroBin is a tiny, self-hosted pastebin that also handles file uploads, URL shortening, and raw text serving. It's written in Rust, compiles to a single binary, and uses under 10 MB of RAM. Think of it as a private Pastebin.com + Hastebin + file drop in one minimal package. [Official site](https://microbin.eu/)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 100 MB of free disk space (plus storage for uploads)
- 64 MB of RAM minimum

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  microbin:
    image: danielszabo99/microbin:2.0.4
    container_name: microbin
    environment:
      - MICROBIN_PORT=8080
      - MICROBIN_BIND=0.0.0.0
      - MICROBIN_PRIVATE=true               # Require login to view pastes
      - MICROBIN_EDITABLE=true               # Allow editing pastes
      - MICROBIN_HIGHLIGHTSYNTAX=true        # Syntax highlighting
      - MICROBIN_ENABLE_BURN_AFTER=true      # Self-destructing pastes
      - MICROBIN_ENABLE_READONLY=true        # Read-only paste option
      - MICROBIN_DEFAULT_EXPIRY=24hour       # Default paste expiry
      - MICROBIN_ADMIN_USERNAME=admin        # Admin username
      - MICROBIN_ADMIN_PASSWORD=change-this  # Admin password - CHANGE THIS
      - MICROBIN_HASH_IDS=true              # Use hashed IDs instead of sequential
      - MICROBIN_TITLE=MicroBin             # Page title
    volumes:
      - ./data:/app/microbin_data
    ports:
      - "8080:8080"
    restart: unless-stopped
```

**Key environment variables:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MICROBIN_PRIVATE` | Require auth to view pastes | false |
| `MICROBIN_EDITABLE` | Allow editing existing pastes | false |
| `MICROBIN_ENABLE_BURN_AFTER` | Enable self-destructing pastes | false |
| `MICROBIN_DEFAULT_EXPIRY` | Default expiration (never, 10min, 1hour, 24hour, 1week) | never |
| `MICROBIN_ADMIN_USERNAME` | Admin login | none |
| `MICROBIN_ADMIN_PASSWORD` | Admin password | none — **must set** |
| `MICROBIN_HASH_IDS` | Use random hashes instead of sequential IDs | false |
| `MICROBIN_HIGHLIGHTSYNTAX` | Enable syntax highlighting | false |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:8080`
2. The paste form is immediately available
3. Log in with admin credentials to access the admin panel
4. Create your first paste — enter text, set expiration, and submit

## Configuration

### Paste Features

Each paste can have:

- **Expiration:** Never, 10 minutes, 1 hour, 24 hours, 1 week, or custom
- **Burn after reading:** Self-destructs after first view
- **Read-only:** Cannot be edited after creation
- **Password protection:** Encrypts paste content
- **Syntax highlighting:** Auto-detects language
- **Raw mode:** Serve plain text at `/raw/[id]`

### File Uploads

MicroBin supports file uploads alongside text pastes. Files are stored in the `microbin_data` volume. Set `MICROBIN_MAX_FILE_SIZE_UNENCRYPTED_MB` and `MICROBIN_MAX_FILE_SIZE_ENCRYPTED_MB` to control limits.

### URL Shortening

Create a paste with just a URL — MicroBin stores it and provides a short link that redirects. Enable with `MICROBIN_ENABLE_URL_SHORTENING=true`.

## Advanced Configuration (Optional)

### Encryption

MicroBin supports client-side encryption for pastes:

```yaml
environment:
  - MICROBIN_ENCRYPTION_CLIENT_SIDE=true
  - MICROBIN_ENCRYPTION_SERVER_SIDE=true
```

Client-side encryption means the server never sees the plaintext — the encryption key is in the URL fragment.

### Custom Footer and Branding

```yaml
environment:
  - MICROBIN_TITLE=My Paste Service
  - MICROBIN_FOOTER_TEXT=Powered by MicroBin
  - MICROBIN_HIDE_LOGO=false
  - MICROBIN_HIDE_HEADER=false
  - MICROBIN_HIDE_FOOTER=false
```

### Public vs Private Instance

For a team pastebin: set `MICROBIN_PRIVATE=true` and distribute the admin credentials. For a public pastebin: keep `MICROBIN_PRIVATE=false` but enable `MICROBIN_HASH_IDS=true` to prevent enumeration.

## Reverse Proxy

Example Nginx Proxy Manager configuration:

- **Scheme:** http
- **Forward Hostname:** microbin
- **Forward Port:** 8080

[Reverse Proxy Setup](/foundations/reverse-proxy-explained/)

## Backup

```bash
tar -czf microbin-backup-$(date +%Y%m%d).tar.gz ./data
```

[Backup Strategy](/foundations/backup-3-2-1-rule/)

## Troubleshooting

### Pastes Disappearing

**Symptom:** Pastes vanish unexpectedly.
**Fix:** Check the default expiry setting. If `MICROBIN_DEFAULT_EXPIRY` is set to `24hour`, pastes expire after 24 hours unless manually set to "never." Also check if "burn after reading" was accidentally enabled.

### Large File Uploads Failing

**Symptom:** File uploads fail silently or return errors.
**Fix:** Set `MICROBIN_MAX_FILE_SIZE_UNENCRYPTED_MB` and `MICROBIN_MAX_FILE_SIZE_ENCRYPTED_MB` to appropriate values. If behind a reverse proxy, also increase the proxy's `client_max_body_size`.

### Syntax Highlighting Not Working

**Symptom:** Code pastes show as plain text.
**Fix:** Ensure `MICROBIN_HIGHLIGHTSYNTAX=true` is set. The language is auto-detected — for better results, set the language manually in the paste form.

## Resource Requirements

- **RAM:** ~10-20 MB (extremely lightweight)
- **CPU:** Negligible
- **Disk:** ~5 MB for the application, grows with stored pastes and files

## Verdict

MicroBin is the lightest self-hosted pastebin available. Under 10 MB of RAM, no database dependency, and a single container. For personal or small-team use where you need a quick place to share text, code, and files, MicroBin is hard to beat. For a more feature-rich alternative with zero-knowledge encryption as the primary focus, use [PrivateBin](/apps/privatebin/).

## FAQ

### MicroBin vs PrivateBin?

MicroBin: lighter, more features (file uploads, URL shortening, editing), simpler. PrivateBin: zero-knowledge encryption by design (server never sees plaintext), more security-focused, more mature. Choose MicroBin for convenience; PrivateBin for privacy.

### Is MicroBin suitable for sensitive data?

With client-side encryption enabled, yes. Without encryption, pastes are stored in plaintext on disk. For sensitive data, always enable `MICROBIN_ENCRYPTION_CLIENT_SIDE=true`.

### Can I use MicroBin as an API?

MicroBin has a basic API for creating pastes programmatically. Use `curl` to POST to the paste endpoint. The API is simple but functional.

## Related

- [How to Self-Host PrivateBin](/apps/privatebin/)
- [How to Self-Host YOURLS](/apps/yourls/)
- [How to Self-Host Shlink](/apps/shlink/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Security Basics for Self-Hosting](/foundations/security-hardening/)
