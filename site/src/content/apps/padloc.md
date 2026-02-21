---
title: "How to Self-Host Padloc with Docker"
description: "Deploy Padloc — a modern, open-source password manager with a polished UI and cross-platform apps. Complete Docker Compose setup guide."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "password-management"
apps:
  - padloc
tags:
  - self-hosted
  - password-manager
  - padloc
  - docker
  - security
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Padloc?

[Padloc](https://padloc.app/) is an open-source password manager with a focus on design and usability. It features a modern, minimalist interface across web, desktop (Electron), and mobile (iOS/Android) apps. Padloc uses end-to-end encryption with SRP (Secure Remote Password) for authentication and AES for data encryption. The self-hosted server handles sync and storage while all encryption happens client-side. It replaces cloud password managers like LastPass, 1Password, and Dashlane.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM
- 500 MB of free disk space
- A domain name with HTTPS configured
- A reverse proxy with SSL ([guide](/foundations/reverse-proxy-explained/))
- A working SMTP server for email notifications (required for account verification)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/padloc && cd /opt/padloc
```

Create a `docker-compose.yml` file:

```yaml
services:
  padloc:
    image: padloc/server:4.3.0
    container_name: padloc-server
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      # Server configuration — CHANGE THESE
      PL_PWA_URL: "https://padloc.example.com"
      PL_SERVER_URL: "https://padloc-api.example.com"

      # Data directory
      PL_DATA_DIR: "/data"

      # SMTP configuration — CHANGE ALL of these
      PL_EMAIL_SERVER: "smtp.example.com"
      PL_EMAIL_PORT: "587"
      PL_EMAIL_USER: "your-smtp-username"
      PL_EMAIL_PASSWORD: "${SMTP_PASSWORD}"
      PL_EMAIL_FROM: "noreply@example.com"
    volumes:
      - padloc_data:/data

  padloc-pwa:
    image: padloc/pwa:4.3.0
    container_name: padloc-pwa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      PL_SERVER_URL: "https://padloc-api.example.com"

volumes:
  padloc_data:
```

Create a `.env` file:

```bash
SMTP_PASSWORD=your_smtp_password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Set up your reverse proxy** — Padloc requires two endpoints:
   - **Web app (PWA):** `padloc.example.com` → `localhost:8080`
   - **API server:** `padloc-api.example.com` → `localhost:3000`

   Both need HTTPS. You can also use subpaths on a single domain.

2. **Access the web app** at `https://padloc.example.com`

3. **Create your account** — enter your email and set a master password. Padloc sends a verification email via SMTP.

4. **Verify your email** — click the link in the verification email to activate your account.

5. **Start adding passwords** — the interface is self-explanatory. Create vaults, add items, organize with tags.

## Configuration

### SMTP (Required)

Padloc requires email for account creation and recovery. Without SMTP, you can't register users. See the Docker Compose configuration above for SMTP environment variables.

### Single Domain Setup

If you prefer one domain instead of two subdomains, configure your reverse proxy to route based on path:

- `padloc.example.com/` → PWA container (port 8080)
- `padloc.example.com/server/` → Server container (port 3000)

Then set:
```yaml
PL_SERVER_URL: "https://padloc.example.com/server/"
PL_PWA_URL: "https://padloc.example.com"
```

## Advanced Configuration (Optional)

### Organizations

Create organizations to share passwords with team members:

1. Go to **Settings** → **Organizations**
2. Create an organization
3. Invite members by email
4. Create shared vaults within the organization
5. Assign vault access per member

### Custom Provisioning

For automated user management, Padloc supports provisioning via SCIM (in the paid tiers). The self-hosted CE uses manual user management.

## Reverse Proxy

Padloc needs two services proxied — the PWA (web frontend) and the API server.

**Caddy:**
```
padloc.example.com {
    reverse_proxy localhost:8080
}

padloc-api.example.com {
    reverse_proxy localhost:3000
}
```

**Nginx Proxy Manager:** Create two proxy hosts — one for each subdomain pointing to the respective ports.

See our [reverse proxy setup guide](/foundations/reverse-proxy-explained/).

## Backup

All Padloc data is stored in the `/data` directory:

```bash
docker compose stop padloc
docker run --rm -v padloc_padloc_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/padloc-backup.tar.gz -C /data .
docker compose start padloc
```

See our [backup strategy guide](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Verification email not received

**Symptom:** After registering, no verification email arrives.
**Fix:** Check SMTP configuration. Verify the email address and SMTP credentials. Check spam folders. Test SMTP connectivity from the container:
```bash
docker compose logs padloc | grep -i email
```

### "Server URL mismatch" error

**Symptom:** Client apps can't connect to the server.
**Fix:** Ensure `PL_SERVER_URL` exactly matches the URL your clients use, including the protocol (`https://`) and any trailing path. The URL must be accessible from the client device.

### PWA not loading

**Symptom:** The web app shows a blank page or loading spinner.
**Fix:** Check that `PL_PWA_URL` and `PL_SERVER_URL` are correct and accessible. Check browser console for CORS errors — the server must be accessible from the PWA's domain.

## Resource Requirements

- **RAM:** ~150 MB idle (server + PWA)
- **CPU:** Low
- **Disk:** ~200 MB for application, growing with vault data

## Verdict

Padloc has the best-looking interface of any self-hosted password manager. The apps are clean and modern, the UX is thoughtful, and the multi-device sync works well. However, it has a significantly smaller community than [Vaultwarden](/apps/vaultwarden/), limited browser auto-fill capabilities, and the two-container setup (API + PWA) adds complexity. For most users, Vaultwarden's Bitwarden client ecosystem offers better auto-fill, more mature mobile apps, and a larger community. Choose Padloc if design quality matters to you and you don't need deep browser integration.

## FAQ

### Does Padloc have browser auto-fill?

Limited. Padloc has a browser extension, but it's less mature than Bitwarden's extension used with Vaultwarden. For seamless auto-fill across browsers and mobile devices, Vaultwarden with Bitwarden clients is the stronger option.

### Is Padloc actively maintained?

Padloc is maintained but has a smaller development team than Vaultwarden or Passbolt. Check the [GitHub repo](https://github.com/padloc/padloc) for recent activity before committing.

### Can I migrate from other password managers?

Padloc supports CSV import. Export from your current manager (LastPass, 1Password, Bitwarden) as CSV, then import into Padloc through the web UI.

## Related

- [How to Self-Host Vaultwarden](/apps/vaultwarden/)
- [How to Self-Host Passbolt](/apps/passbolt/)
- [How to Self-Host KeeWeb](/apps/keeweb/)
- [Vaultwarden vs Padloc](/compare/vaultwarden-vs-padloc/)
- [KeeWeb vs Padloc](/compare/keeweb-vs-padloc/)
- [Best Self-Hosted Password Managers](/best/password-management/)
- [Self-Hosted Alternatives to LastPass](/replace/lastpass/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
