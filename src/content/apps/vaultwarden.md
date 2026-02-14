---
title: "How to Self-Host Vaultwarden with Docker Compose"
type: "app-guide"
app: "vaultwarden"
category: "password-management"
replaces: "LastPass"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Vaultwarden, a lightweight self-hosted Bitwarden-compatible password manager, with Docker Compose."
officialUrl: "https://github.com/dani-garcia/vaultwarden"
githubUrl: "https://github.com/dani-garcia/vaultwarden"
defaultPort: 8082
minRam: "128MB"
---

## What is Vaultwarden?

Vaultwarden is a lightweight, self-hosted password manager that's fully compatible with all Bitwarden client apps. It's a community-built alternative server implementation written in Rust, using a fraction of the resources that the official Bitwarden server requires. You get the polished Bitwarden browser extensions, desktop apps, and mobile apps — backed by a server you control.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server — Vaultwarden runs on as little as 128MB RAM ([best mini PCs for self-hosting](/hardware/best-mini-pc/))
- A domain name with HTTPS (required for browser extensions)
- A reverse proxy with SSL ([reverse proxy guide](/foundations/reverse-proxy/))

## Docker Compose Configuration

```yaml
# docker-compose.yml for Vaultwarden
# Tested with Vaultwarden 1.32+

services:
  vaultwarden:
    container_name: vaultwarden
    image: vaultwarden/server:latest
    ports:
      - "8082:80"
    volumes:
      - ./data:/data
    environment:
      # Domain where Vaultwarden is accessible (MUST be HTTPS)
      - DOMAIN=https://vault.yourdomain.com
      # Disable new user signups after you create your account
      - SIGNUPS_ALLOWED=true
      # Admin panel (generate a token with: openssl rand -base64 48)
      - ADMIN_TOKEN=${ADMIN_TOKEN}
      # Enable WebSocket for live sync
      - WEBSOCKET_ENABLED=true
      # SMTP for email (optional but recommended)
      # - SMTP_HOST=smtp.gmail.com
      # - SMTP_FROM=vault@yourdomain.com
      # - SMTP_PORT=587
      # - SMTP_SECURITY=starttls
      # - SMTP_USERNAME=your-email
      # - SMTP_PASSWORD=your-app-password
    restart: unless-stopped
```

Create a `.env` file:

```bash
# .env file for Vaultwarden
# Generate with: openssl rand -base64 48
ADMIN_TOKEN=your-generated-admin-token-here
```

## Step-by-Step Setup

1. **Create a directory for Vaultwarden:**
   ```bash
   mkdir ~/vaultwarden && cd ~/vaultwarden
   ```

2. **Generate an admin token:**
   ```bash
   openssl rand -base64 48
   ```

3. **Create the `docker-compose.yml` and `.env` files** with the configs above.

4. **Start the container:**
   ```bash
   docker compose up -d
   ```

5. **Set up HTTPS** — Vaultwarden requires HTTPS for browser extensions. Use [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Caddy](/apps/caddy/) to get a Let's Encrypt certificate.

6. **Create your account** at `https://vault.yourdomain.com`

7. **Disable signups** — after creating your account(s), set `SIGNUPS_ALLOWED=false` in the compose file and restart.

8. **Install Bitwarden clients** — use the official Bitwarden browser extensions, desktop apps, and mobile apps. In settings, set the server URL to `https://vault.yourdomain.com`.

## Configuration Tips

- **Admin panel:** Access at `https://vault.yourdomain.com/admin` using your admin token. From here you can manage users, view diagnostics, and change settings.
- **Two-factor authentication:** Enable 2FA immediately after creating your account. Vaultwarden supports TOTP, WebAuthn/FIDO2, and email 2FA.
- **Emergency access:** Set up emergency access for a trusted person who can access your vault if you're incapacitated.
- **Disable signups:** Always set `SIGNUPS_ALLOWED=false` after creating your accounts. An open Vaultwarden instance is a security risk.
- **SMTP:** Configure email so you can receive login notifications and password reset emails.

## Backup & Migration

- **Backup:** The `data` folder contains everything — the SQLite database, attachments, and RSA keys. Back it up regularly and store copies off-site.
  ```bash
  # Simple backup
  tar -czf vaultwarden-backup-$(date +%F).tar.gz data/
  ```
- **Migration from LastPass/1Password:** Export from your current password manager as CSV, then import through the Bitwarden web vault (Settings → Import Data).
- **Migration from Bitwarden cloud:** Export as encrypted JSON from Bitwarden cloud, import into your Vaultwarden instance.

## Troubleshooting

- **Browser extension can't connect:** Verify HTTPS is working and that you've set the custom server URL in the extension settings (click the gear icon on the login screen).
- **Live sync not working:** Ensure `WEBSOCKET_ENABLED=true` and that your reverse proxy is forwarding WebSocket connections.
- **Locked out of admin panel:** Delete the `data/config.json` file and restart the container.

## Alternatives

The official [Bitwarden](https://bitwarden.com) server is the alternative, but it requires significantly more resources (multiple containers, Microsoft SQL Server) and some features require a paid license. For self-hosting, Vaultwarden is the obvious choice. See [Best Self-Hosted Password Managers](/best/password-managers/).

## Verdict

Vaultwarden is one of the easiest and most impactful self-hosting wins. It uses almost no resources, works with polished Bitwarden clients on every platform, and puts your most sensitive data — your passwords — entirely under your control. If you self-host one thing, make it this.
