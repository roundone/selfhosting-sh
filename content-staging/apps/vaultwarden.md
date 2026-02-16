---
title: "How to Self-Host Vaultwarden with Docker"
description: "Deploy Vaultwarden — a lightweight Bitwarden-compatible password manager you fully control. Complete Docker setup guide."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - vaultwarden
tags: ["self-hosted", "password-manager", "vaultwarden", "bitwarden", "docker", "security"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Vaultwarden?

[Vaultwarden](https://github.com/dani-garcia/vaultwarden) is a lightweight, Rust-based reimplementation of the Bitwarden server API. It is fully compatible with all official Bitwarden clients — browser extensions, desktop apps, mobile apps, and the CLI. Unlike the official Bitwarden server (which requires MSSQL and significant resources), Vaultwarden runs on SQLite by default and idles at around 50 MB of RAM. It replaces cloud password managers like LastPass, 1Password, and Bitwarden's own hosted service, giving you complete control over your most sensitive data.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM
- 500 MB of free disk space
- **A domain name with HTTPS** — Bitwarden clients refuse to connect over plain HTTP. This is non-negotiable.
- A reverse proxy with SSL configured ([guide](/foundations/reverse-proxy-explained))

## Docker Compose Configuration

Create a project directory and the Compose file:

```bash
mkdir -p /opt/vaultwarden && cd /opt/vaultwarden
```

Create a `docker-compose.yml` file:

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:1.35.3
    container_name: vaultwarden
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - vw-data:/data
    env_file:
      - .env

volumes:
  vw-data:
```

The port binding to `127.0.0.1` ensures Vaultwarden is only accessible through your reverse proxy, not directly from the internet. Inside the container, Vaultwarden listens on port 80 (configured via `ROCKET_PORT` in the Docker image). WebSocket traffic for live sync is served on the same port since v1.29.0 — no separate WebSocket port is needed.

Create a `.env` file alongside the Compose file:

```bash
# =============================================================================
# Vaultwarden Environment Configuration
# =============================================================================

# REQUIRED: Your full domain with https://
# Used for email links, attachments, and U2F/WebAuthn
DOMAIN=https://vault.example.com

# ---------------------------------------------------------------------------
# Registration Control
# ---------------------------------------------------------------------------
# Set to true for initial setup, then change to false after creating your account
SIGNUPS_ALLOWED=true

# Require email verification for new signups (enable after configuring SMTP)
SIGNUPS_VERIFY=false

# Allow existing users to invite new users (works even when signups are disabled)
INVITATIONS_ALLOWED=true

# ---------------------------------------------------------------------------
# Admin Panel
# ---------------------------------------------------------------------------
# Generate this token with: docker run --rm -it vaultwarden/server /vaultwarden hash
# Then paste the full argon2id PHC string below (keep the single quotes in compose)
ADMIN_TOKEN='$argon2id$v=19$m=65540,t=3,p=4$YOUR_HASH_HERE'

# ---------------------------------------------------------------------------
# WebSocket Notifications
# ---------------------------------------------------------------------------
# Enables real-time sync between clients (integrated into main port since v1.29.0)
ENABLE_WEBSOCKET=true

# ---------------------------------------------------------------------------
# Push Notifications (Optional — for mobile sync)
# ---------------------------------------------------------------------------
# Get your ID and KEY from https://bitwarden.com/host/
# PUSH_ENABLED=true
# PUSH_INSTALLATION_ID=your-installation-id
# PUSH_INSTALLATION_KEY=your-installation-key

# ---------------------------------------------------------------------------
# SMTP Email (Optional — required for password resets and email 2FA)
# ---------------------------------------------------------------------------
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURITY=starttls
# SMTP_FROM=vaultwarden@example.com
# SMTP_FROM_NAME=Vaultwarden
# SMTP_USERNAME=your-smtp-username
# SMTP_PASSWORD=your-smtp-password

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
LOG_LEVEL=info
EXTENDED_LOGGING=true
```

Start the stack:

```bash
docker compose up -d
```

Verify it is running:

```bash
docker compose logs -f vaultwarden
```

You should see Vaultwarden start up and report that it is listening on port 80. Press `Ctrl+C` to exit the log view.

## Initial Setup

Once your reverse proxy is configured and HTTPS is working, open `https://vault.example.com` in your browser. You will see the Bitwarden web vault interface.

1. **Create your account.** Click "Create Account" and register with your email and a strong master password. This is the only password you need to remember — make it long and unique.
2. **Disable open registration.** Immediately edit your `.env` file and set `SIGNUPS_ALLOWED=false`, then restart the container:

```bash
docker compose down && docker compose up -d
```

3. **Access the admin panel.** Navigate to `https://vault.example.com/admin` and enter the plaintext password you used when generating the argon2 hash. From here you can manage users, view diagnostics, and adjust server settings.

Leaving signups enabled on a public-facing instance is a security risk. Disable it as soon as your account exists.

## Configuration

### Generating the Admin Token

Never store a plaintext admin token. Generate an argon2id hash using the built-in command:

```bash
docker run --rm -it vaultwarden/server /vaultwarden hash
```

Enter your desired password when prompted. The command outputs a PHC string that looks like this:

```
$argon2id$v=19$m=65540,t=3,p=4$base64salt$base64hash
```

Paste the entire string as your `ADMIN_TOKEN` value in the `.env` file. When logging into the admin panel, you enter the original plaintext password — Vaultwarden hashes it and compares against the stored PHC string.

### Email / SMTP Setup

Email is necessary for password reset, email-based 2FA, and user invitations. Uncomment the SMTP block in your `.env` file and configure it for your provider.

**Gmail (App Password):**

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURITY=starttls
SMTP_FROM=you@gmail.com
SMTP_FROM_NAME=Vaultwarden
SMTP_USERNAME=you@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

You need to generate an App Password in your Google account settings — your regular Gmail password will not work.

**Fastmail:**

```bash
SMTP_HOST=smtp.fastmail.com
SMTP_PORT=465
SMTP_SECURITY=force_tls
SMTP_FROM=you@fastmail.com
SMTP_FROM_NAME=Vaultwarden
SMTP_USERNAME=you@fastmail.com
SMTP_PASSWORD=your-app-specific-password
```

After configuring SMTP, restart the container and send a test email from the admin panel to verify it works.

### Two-Factor Authentication

Vaultwarden supports multiple 2FA methods:

- **TOTP (Authenticator apps)** — works out of the box with any TOTP app (Aegis, Authy, Google Authenticator). Enable it in the web vault under Settings > Security > Two-step Login.
- **WebAuthn / FIDO2** — hardware security keys like YubiKey. Requires HTTPS (which you already have). Enable under the same settings menu.
- **Email 2FA** — sends a code to your email. Requires SMTP to be configured.
- **YubiKey OTP** — requires setting `YUBICO_CLIENT_ID` and `YUBICO_SECRET_KEY` in your `.env` file (get these from [Yubico](https://upgrade.yubico.com/getapikey/)).

Enable at least one 2FA method. You are protecting a password vault — act accordingly.

### Organizations and Sharing

Organizations let you share passwords between users — useful for families or small teams.

1. In the web vault, click "New Organization."
2. Name the organization and create it.
3. Invite members from the admin panel (since signups are disabled, use the invitation flow).
4. Create Collections within the organization to group shared credentials by purpose (e.g., "Streaming Services," "Home Network").

Members can have different access levels: Owner, Admin, User, or Custom with granular permissions.

## Connecting Clients

All official Bitwarden clients work with Vaultwarden. The key step is changing the server URL before logging in.

### Browser Extension

1. Install the [Bitwarden browser extension](https://bitwarden.com/download/) for your browser.
2. On the login screen, click the **region selector** (or gear icon in older versions) and select "Self-hosted."
3. Enter your server URL: `https://vault.example.com`
4. Log in with your email and master password.

### Mobile App

1. Install Bitwarden from the App Store or Google Play.
2. On the login screen, tap the region selector and choose "Self-hosted."
3. Enter your server URL: `https://vault.example.com`
4. Log in.

For mobile push notifications (instant sync instead of periodic polling), enable the push notification settings as described in the `.env` file above.

### Desktop App

1. Download Bitwarden Desktop from [bitwarden.com/download](https://bitwarden.com/download/).
2. Same process — set the server URL to your domain before logging in.

## Reverse Proxy

Vaultwarden must be behind a reverse proxy with HTTPS. Here is a configuration for Nginx Proxy Manager, which is the simplest option.

**Nginx Proxy Manager setup:**

1. Add a new Proxy Host for `vault.example.com`.
2. Set the Forward Hostname to `127.0.0.1` (or the Docker host IP) and Forward Port to `8080`.
3. Enable "Websockets Support" — this is critical for live sync between clients.
4. Under the SSL tab, request a Let's Encrypt certificate and enable "Force SSL."

Since Vaultwarden v1.29.0, WebSocket traffic is served on the same port as regular HTTP traffic. You do not need a separate location block for `/notifications/hub`. Enabling WebSocket support in Nginx Proxy Manager is sufficient.

If you are using Nginx directly (not NPM), ensure your config includes:

```nginx
location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

For full reverse proxy setup instructions, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

This is the most important section of this guide. Your password vault is arguably the single most critical piece of data you own. Losing it is catastrophic. Treat backups accordingly.

Vaultwarden stores everything in the `/data` volume:

- `db.sqlite3` — the SQLite database containing all vault entries
- `attachments/` — file attachments stored in vaults
- `sends/` — Bitwarden Send files
- `rsa_key.pem` and `rsa_key.pub.pem` — RSA keys for authentication tokens
- `config.json` — settings configured through the admin panel

### Backup Script

Create a backup script at `/opt/vaultwarden/backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/vaultwarden"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATA_DIR=$(docker volume inspect vw-data --format '{{ .Mountpoint }}')

mkdir -p "$BACKUP_DIR"

# Use sqlite3 .backup for a consistent database snapshot
# This is safe even while Vaultwarden is running
docker exec vaultwarden sqlite3 /data/db.sqlite3 ".backup '/data/db-backup.sqlite3'"

# Copy the backup and all other data files
tar czf "$BACKUP_DIR/vaultwarden-$TIMESTAMP.tar.gz" \
  -C "$DATA_DIR" \
  db-backup.sqlite3 \
  attachments/ \
  sends/ \
  rsa_key.pem \
  rsa_key.pub.pem \
  config.json

# Clean up the temporary backup file inside the container
docker exec vaultwarden rm /data/db-backup.sqlite3

# Keep the last 30 daily backups
find "$BACKUP_DIR" -name "vaultwarden-*.tar.gz" -mtime +30 -delete

echo "Backup complete: vaultwarden-$TIMESTAMP.tar.gz"
```

Make it executable and schedule it with cron:

```bash
chmod +x /opt/vaultwarden/backup.sh
# Run daily at 3 AM
echo "0 3 * * * /opt/vaultwarden/backup.sh" | crontab -
```

**Do not skip this.** Use the SQLite `.backup` command — copying the database file directly while Vaultwarden is running risks corruption. Follow the [3-2-1 backup strategy](/foundations/backup-3-2-1-rule): three copies, two media types, one offsite.

## Troubleshooting

### Bitwarden Client Shows "Cannot Reach Server"

**Symptom:** The Bitwarden client displays a connection error after entering your server URL.

**Fix:** Verify the following in order:
1. The `DOMAIN` environment variable matches your actual URL exactly, including `https://`.
2. Your SSL certificate is valid and not expired — test with `curl -v https://vault.example.com`.
3. Your reverse proxy is forwarding to the correct port (`8080` in our config).
4. Port 443 is open in your firewall (`ufw allow 443` on Ubuntu).

### Changes Do Not Sync in Real-Time

**Symptom:** Edits made on one device take minutes to appear on others.

**Fix:** Ensure `ENABLE_WEBSOCKET=true` is set in your `.env` file and your reverse proxy has WebSocket support enabled. In Nginx Proxy Manager, check the "Websockets Support" toggle on the proxy host. Restart the container after any changes.

### Admin Panel Returns 404

**Symptom:** Navigating to `/admin` shows a "page not found" error.

**Fix:** Confirm that `ADMIN_TOKEN` is set in your `.env` file (not blank, not commented out). Restart the container with `docker compose down && docker compose up -d`. If you are using an argon2 hash, make sure the entire PHC string is present and wrapped in single quotes.

### Email Notifications Not Sending

**Symptom:** Password reset emails, invitation emails, or 2FA codes are not delivered.

**Fix:** Check the container logs for SMTP errors:

```bash
docker compose logs vaultwarden | grep -i smtp
```

Common issues: wrong port (use 587 for STARTTLS, 465 for TLS), incorrect app password (not your regular account password), or the `SMTP_FROM` address being rejected by the mail server. Send a test email from the admin panel to diagnose.

### Vault Is Locked After Server Restart

**Symptom:** All clients show "Your vault is locked" after restarting the Vaultwarden container.

This is expected behavior, not a bug. The client encrypts your vault locally with your master password. After a server restart, the client needs your master password to decrypt the local cache. Enter your master password to unlock.

## Resource Requirements

- **RAM:** ~50 MB idle, ~100 MB under load with multiple concurrent users
- **CPU:** Minimal — Rust is extremely efficient. A single core handles hundreds of users easily.
- **Disk:** ~100 MB for the application, plus vault data (typically under 100 MB for personal use, potentially several GB with large attachments)

Vaultwarden comfortably runs on a Raspberry Pi. It is one of the lightest self-hosted applications you can deploy.

## Verdict

Vaultwarden is the best self-hosted password manager, period. It consumes almost no resources, works with all Bitwarden clients (which are genuinely excellent across every platform), and gives you full ownership of your most sensitive data. The setup is straightforward — a single container with a SQLite database.

The only hard requirement is HTTPS, and the only real risk is losing your data. You **must** maintain disciplined backups — losing access to your password vault is catastrophic. If you are not comfortable committing to a reliable backup routine, use cloud Bitwarden instead. At $10/year for a premium account, it is fair pricing for managed infrastructure and peace of mind. But if you can handle backups, there is no reason to trust your passwords to anyone else.

For alternatives, [Passbolt](/apps/passbolt) is worth considering if you need team-focused features with GPG-based encryption, but for personal and family use, Vaultwarden wins outright.

## Related

- [Best Self-Hosted Password Managers](/best/password-management)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt)
- [Replace LastPass](/replace/lastpass)
- [Replace 1Password](/replace/1password)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Security Basics for Self-Hosting](/foundations/security-basics)
