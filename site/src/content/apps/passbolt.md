---
title: "How to Self-Host Passbolt with Docker"
description: "Deploy Passbolt CE — a team-focused password manager with end-to-end encryption. Complete Docker Compose setup with MariaDB and SMTP."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - passbolt
tags:
  - self-hosted
  - password-manager
  - passbolt
  - docker
  - security
  - team
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Passbolt?

[Passbolt](https://www.passbolt.com/) is a team-oriented, open-source password manager built on OpenPGP end-to-end encryption. Unlike Vaultwarden or KeePass-based tools that focus on individual use, Passbolt is designed for organizations that need to share credentials with granular permissions, audit trails, and group-based access control. The Community Edition (CE) is free, self-hostable, and covers core password management and sharing. It replaces cloud team password managers like LastPass Teams, 1Password Business, and Dashlane Business.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 2 GB of free RAM (MariaDB + Passbolt)
- 1 GB of free disk space
- A domain name with HTTPS — required for the browser extension to work
- A reverse proxy with SSL configured ([guide](/foundations/reverse-proxy-explained/))
- A working SMTP server for email notifications (required — Passbolt uses email for account recovery and verification)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/passbolt && cd /opt/passbolt
```

Create a `docker-compose.yml` file:

```yaml
services:
  passbolt:
    image: passbolt/passbolt:5.9.0-1-ce
    container_name: passbolt
    restart: unless-stopped
    depends_on:
      mariadb:
        condition: service_healthy
    ports:
      - "127.0.0.1:8080:80"
      - "127.0.0.1:4433:443"
    volumes:
      - gpg_volume:/etc/passbolt/gpg
      - jwt_volume:/etc/passbolt/jwt
    environment:
      # Database connection
      DATASOURCES_DEFAULT_HOST: "mariadb"
      DATASOURCES_DEFAULT_PORT: "3306"
      DATASOURCES_DEFAULT_USERNAME: "passbolt"
      DATASOURCES_DEFAULT_PASSWORD: "${DB_PASSWORD}"
      DATASOURCES_DEFAULT_DATABASE: "passbolt"

      # App configuration — CHANGE THIS to your actual domain
      APP_FULL_BASE_URL: "https://passbolt.example.com"

      # SMTP configuration — CHANGE ALL of these
      EMAIL_DEFAULT_FROM_NAME: "Passbolt"
      EMAIL_DEFAULT_FROM: "noreply@example.com"
      EMAIL_TRANSPORT_DEFAULT_HOST: "smtp.example.com"
      EMAIL_TRANSPORT_DEFAULT_PORT: "587"
      EMAIL_TRANSPORT_DEFAULT_USERNAME: "your-smtp-username"
      EMAIL_TRANSPORT_DEFAULT_PASSWORD: "${SMTP_PASSWORD}"
      EMAIL_TRANSPORT_DEFAULT_TLS: "true"
    networks:
      - passbolt-net

  mariadb:
    image: mariadb:11.7
    container_name: passbolt-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: "${DB_ROOT_PASSWORD}"
      MYSQL_DATABASE: "passbolt"
      MYSQL_USER: "passbolt"
      MYSQL_PASSWORD: "${DB_PASSWORD}"
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - passbolt-net
    healthcheck:
      test: ["CMD", "healthcheck.sh", "--connect", "--innodb_initialized"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  gpg_volume:
  jwt_volume:
  db_data:

networks:
  passbolt-net:
```

Create a `.env` file alongside the Compose file:

```bash
# Database passwords — CHANGE THESE to strong random values
DB_ROOT_PASSWORD=change_me_root_password_64chars
DB_PASSWORD=change_me_db_password_64chars

# SMTP password
SMTP_PASSWORD=your_smtp_password
```

Generate strong passwords:

```bash
openssl rand -base64 48 | tr -d '=/+' | head -c 64
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Wait for the database to initialize** — first start takes 30-60 seconds. Check logs:

```bash
docker compose logs -f passbolt
```

2. **Create the first admin user:**

```bash
docker compose exec passbolt su -m -c \
  "/usr/share/php/passbolt/bin/cake passbolt register_user \
  -u admin@example.com \
  -f Admin \
  -l User \
  -r admin" -s /bin/sh www-data
```

This outputs a registration URL. Open it in your browser.

3. **Install the Passbolt browser extension** — the registration page will prompt you to install it. Passbolt requires the browser extension for all operations (it handles client-side OpenPGP encryption).

4. **Complete registration** — set your passphrase (this is your master password), generate your OpenPGP key pair, and download the recovery kit. **Store the recovery kit securely** — it's the only way to recover your account if you lose your passphrase.

## Configuration

### SMTP (Required)

Passbolt requires SMTP for account verification, password recovery, and sharing notifications. Without it, you cannot register users or recover accounts. Common SMTP configurations:

**Gmail (App Password):**
```yaml
EMAIL_TRANSPORT_DEFAULT_HOST: "smtp.gmail.com"
EMAIL_TRANSPORT_DEFAULT_PORT: "587"
EMAIL_TRANSPORT_DEFAULT_USERNAME: "your@gmail.com"
EMAIL_TRANSPORT_DEFAULT_PASSWORD: "your-app-password"
EMAIL_TRANSPORT_DEFAULT_TLS: "true"
```

**Mailgun / Resend / SendGrid:**
```yaml
EMAIL_TRANSPORT_DEFAULT_HOST: "smtp.mailgun.org"
EMAIL_TRANSPORT_DEFAULT_PORT: "587"
EMAIL_TRANSPORT_DEFAULT_USERNAME: "postmaster@mg.yourdomain.com"
EMAIL_TRANSPORT_DEFAULT_PASSWORD: "your-api-key"
EMAIL_TRANSPORT_DEFAULT_TLS: "true"
```

### Test Email Configuration

```bash
docker compose exec passbolt su -m -c \
  "/usr/share/php/passbolt/bin/cake passbolt send_test_email \
  --recipient=your@email.com" -s /bin/sh www-data
```

## Advanced Configuration (Optional)

### LDAP Integration (Pro Only)

LDAP/AD integration for user provisioning is only available in the Pro edition. The CE edition uses manual user creation or CSV import.

### MFA / TOTP

Passbolt CE supports TOTP-based two-factor authentication. Users can enable it from their profile settings after registration.

### API Access

Passbolt provides a REST API for programmatic access. Authenticate with your GPG key:

```bash
# Export your GPG private key
gpg --armor --export-secret-keys your@email.com > private.key

# Use the Passbolt CLI or API with GPG authentication
```

## Reverse Proxy

Passbolt serves HTTPS on port 443 internally, but for a standard setup, reverse proxy to port 80 (HTTP) and let your proxy handle SSL.

**Nginx Proxy Manager:** Create a proxy host pointing to `passbolt:80` (or `127.0.0.1:8080` from the host). Enable SSL with Let's Encrypt.

**Caddy:**
```
passbolt.example.com {
    reverse_proxy localhost:8080
}
```

For more options, see our [reverse proxy setup guide](/foundations/reverse-proxy-explained/).

## Backup

Back up these critical data:

1. **Database** — the MariaDB volume contains all passwords, users, and groups:
```bash
docker compose exec mariadb sh -c \
  'exec mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" passbolt' > passbolt-backup.sql
```

2. **GPG keys** — the `gpg_volume` contains the server's OpenPGP keypair. Without it, encrypted data cannot be decrypted:
```bash
docker cp passbolt:/etc/passbolt/gpg ./backup-gpg/
```

3. **JWT keys** — the `jwt_volume` contains authentication tokens:
```bash
docker cp passbolt:/etc/passbolt/jwt ./backup-jwt/
```

Store backups securely — they contain the keys needed to decrypt your password vault. See our [backup strategy guide](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Registration URL expired or not working

**Symptom:** The registration link returned by `register_user` doesn't work or shows an error.
**Fix:** Generate a new link. Registration links expire. Also verify that `APP_FULL_BASE_URL` exactly matches the URL you're accessing (including `https://`).

### Email not sending

**Symptom:** Users don't receive registration or recovery emails.
**Fix:** Run the email test command (see Configuration section). Check SMTP credentials. Verify your SMTP provider isn't blocking the connection. Check Passbolt logs: `docker compose logs passbolt | grep -i email`.

### Browser extension says "Server key changed"

**Symptom:** After redeploying, the browser extension warns about a changed server key.
**Fix:** You lost the GPG volume between deployments. If you have a backup, restore the `gpg_volume`. If not, users need to re-register. This is why backing up the GPG volume is critical.

### Database connection refused

**Symptom:** Passbolt logs show "Connection refused" or "Can't connect to MySQL server."
**Fix:** Ensure the MariaDB container is healthy: `docker compose ps`. Wait for the health check to pass before Passbolt starts. The `depends_on` with `condition: service_healthy` handles this, but first startup of MariaDB takes time.

### "Undefined index: APP_FULL_BASE_URL"

**Symptom:** Error on first access.
**Fix:** `APP_FULL_BASE_URL` must include the protocol: `https://passbolt.example.com`, not `passbolt.example.com`.

## Resource Requirements

- **RAM:** ~400 MB idle (Passbolt + MariaDB), ~600 MB under load
- **CPU:** Low — handles hundreds of concurrent users on a single core
- **Disk:** ~500 MB for application, plus database growth with usage

## Verdict

Passbolt is the best self-hosted option for **team credential sharing**. Its OpenPGP-based E2E encryption is genuinely strong, the permission model is flexible, and the audit logs give you visibility into who accessed what. For personal use or family sharing, [Vaultwarden](/apps/vaultwarden/) is the better choice — it has native mobile apps, better auto-fill, and a simpler setup. Passbolt's reliance on the browser extension and lack of mobile apps (in CE) limits its usefulness for personal password management.

**Choose Passbolt if:** You need team credential sharing with granular permissions and audit trails.
**Choose Vaultwarden if:** You want a personal/family password manager with full Bitwarden client support.

## FAQ

### Does Passbolt have mobile apps?

The CE (free) edition does not include mobile apps. The Pro and Cloud editions add iOS and Android apps. For CE users, you're limited to the browser extension on desktop.

### Can I import passwords from other managers?

Yes. Passbolt supports CSV import through the browser extension. Export from your current manager (LastPass, 1Password, Bitwarden, KeePass) as CSV, then import into Passbolt. The import maps standard fields (name, URL, username, password, notes).

### Is the encryption really end-to-end?

Yes. Passbolt uses OpenPGP (GPG) for encryption. Passwords are encrypted client-side in the browser extension before being sent to the server. The server never sees plaintext passwords. Each user has their own GPG key pair, and shared passwords are encrypted per-recipient.

### What's the difference between CE, Pro, and Cloud?

CE (Community Edition) is free and self-hosted — covers basic password management and sharing. Pro adds tags, folders, LDAP integration, mobile apps, and MFA policies ($49/month for 10 users). Cloud is Passbolt's hosted version.

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [Vaultwarden vs Passbolt](/compare/vaultwarden-vs-passbolt/)
- [Passbolt vs KeeWeb](/compare/passbolt-vs-keeweb/)
- [Passbolt vs Padloc](/compare/passbolt-vs-padloc/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass/)
- [Self-Hosted Alternatives to 1Password](/replace/1password/)
- [Self-Hosted Alternatives to Dashlane](/replace/dashlane/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [SSL Certificates](/foundations/ssl-certificates/)
