---
title: "How to Self-Host MeshCentral with Docker"
description: "Deploy MeshCentral with Docker Compose for full remote device management including remote desktop, terminal, and file access."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "vpn-remote-access"
apps:
  - meshcentral
tags:
  - self-hosted
  - remote-desktop
  - meshcentral
  - docker
  - device-management
  - vpn-remote-access
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is MeshCentral?

[MeshCentral](https://meshcentral.com/) is a full-featured, open-source remote computer management platform. It goes beyond simple remote desktop — you get remote terminal, file management, device grouping, user management, Intel AMT support, event logging, and scripting capabilities. All accessible through a web browser with no client-side plugins required (though an installable agent provides more features).

Think of it as a self-hosted combination of TeamViewer, remote monitoring, and device management — all in one package. MeshCentral supports Windows, Linux, macOS, and even some IoT devices. It's been in active development since 2016 and is one of the most mature self-hosted remote management tools available.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (1 GB recommended for 50+ devices)
- Ports 80 and 443 accessible (or use a reverse proxy)
- A domain name (strongly recommended — MeshCentral works best with TLS)

MeshCentral generates its own TLS certificates by default. If you're using a reverse proxy, you'll configure it to handle TLS instead.

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  meshcentral:
    image: ghcr.io/ylianst/meshcentral:1.1.56
    container_name: meshcentral
    restart: unless-stopped
    ports:
      - "8086:443"   # HTTPS web interface and agent connections
    environment:
      # Required: your server's hostname
      - HOSTNAME=mesh.yourdomain.com
      # Set to true if behind a reverse proxy
      - REVERSE_PROXY=false
      # TLS port the reverse proxy connects on (default 443)
      - REVERSE_PROXY_TLS_PORT=443
      # Allow new users to create accounts (disable after setup)
      - ALLOW_NEW_ACCOUNTS=true
      # Enable WebRTC for peer-to-peer remote desktop (experimental)
      - WEBRTC=false
      # Node.js environment
      - NODE_ENV=production
      # Disable built-in MongoDB (uses NeDB file-based storage)
      - USE_MONGODB=false
    volumes:
      - meshcentral-data:/opt/meshcentral/meshcentral-data      # Config, certs, database
      - meshcentral-files:/opt/meshcentral/meshcentral-files     # User file uploads
      - meshcentral-backups:/opt/meshcentral/meshcentral-backups # Automatic backups
    networks:
      - meshcentral

networks:
  meshcentral:
    driver: bridge

volumes:
  meshcentral-data:
  meshcentral-files:
  meshcentral-backups:
```

For larger deployments (50+ devices), add MongoDB:

```yaml
services:
  meshcentral:
    image: ghcr.io/ylianst/meshcentral:1.1.56-mongodb
    container_name: meshcentral
    restart: unless-stopped
    ports:
      - "8086:443"
    environment:
      - HOSTNAME=mesh.yourdomain.com
      - REVERSE_PROXY=false
      - ALLOW_NEW_ACCOUNTS=true
      - WEBRTC=false
      - NODE_ENV=production
      - USE_MONGODB=true
      - MONGO_URL=mongodb://meshcentral:meshcentral-secret@mongodb:27017/meshcentral
    volumes:
      - meshcentral-data:/opt/meshcentral/meshcentral-data
      - meshcentral-files:/opt/meshcentral/meshcentral-files
      - meshcentral-backups:/opt/meshcentral/meshcentral-backups
    depends_on:
      - mongodb
    networks:
      - meshcentral

  mongodb:
    image: mongo:7.0
    container_name: meshcentral-db
    restart: unless-stopped
    environment:
      - MONGO_INITDB_ROOT_USERNAME=meshcentral
      - MONGO_INITDB_ROOT_PASSWORD=meshcentral-secret
    volumes:
      - mongodb-data:/data/db
    networks:
      - meshcentral

networks:
  meshcentral:
    driver: bridge

volumes:
  meshcentral-data:
  meshcentral-files:
  meshcentral-backups:
  mongodb-data:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `https://your-server:8086` in a browser (accept the self-signed certificate warning, or set up a reverse proxy first).

2. **Create your admin account.** The first account created becomes the site administrator.

3. **Disable new account creation** after creating your admin account — either set `ALLOW_NEW_ACCOUNTS=false` in your compose file and restart, or change it in **Settings → General** in the web UI.

4. **Create a Device Group:**
   - Click **My Devices** in the sidebar
   - Click **Add Device Group**
   - Choose a group type (default works for most cases)

5. **Install agents on remote machines:**
   - Click on your device group
   - Click **Add Agent** (or **Install Agent**)
   - Download the agent for the target OS
   - Run the installer on the remote machine — it will auto-connect to your server

6. Once agents connect, you'll see devices in your group. Click any device to access remote desktop, terminal, files, and more.

## Configuration

### Behind a Reverse Proxy

If using [Nginx Proxy Manager](/apps/nginx-proxy-manager), [Traefik](/apps/traefik), or [Caddy](/apps/caddy):

```yaml
environment:
  - REVERSE_PROXY=true
  - REVERSE_PROXY_TLS_PORT=443
```

Change the port mapping to expose HTTP internally:

```yaml
ports:
  - "4430:443"
```

Then configure your reverse proxy to forward HTTPS traffic to `meshcentral:4430`. Enable WebSocket support — MeshCentral uses WebSockets heavily for real-time agent communication.

### Advanced Configuration via config.json

MeshCentral's full configuration lives in `config.json` inside the data volume. Environment variables cover basic settings, but for advanced options (two-factor auth, email alerts, branding), edit the config directly:

```bash
docker compose exec meshcentral cat /opt/meshcentral/meshcentral-data/config.json
```

Edit it and restart the container. Key options:

```json
{
  "settings": {
    "cert": "mesh.yourdomain.com",
    "port": 443,
    "redirPort": 80,
    "allowLoginToken": true,
    "allowFraming": false,
    "newAccounts": false
  },
  "domains": {
    "": {
      "title": "My MeshCentral",
      "title2": "Remote Management",
      "minify": true,
      "newAccounts": false,
      "userNameIsEmail": true
    }
  }
}
```

### Two-Factor Authentication

MeshCentral supports TOTP (Google Authenticator, Authy) out of the box. Users can enable 2FA from their account settings. To require 2FA for all users, add to config.json:

```json
{
  "domains": {
    "": {
      "authStrategies": {
        "totp": true
      }
    }
  }
}
```

### Intel AMT Support

MeshCentral supports Intel Active Management Technology for hardware-level remote access (power on/off, KVM before OS boot). Enable it in config.json and ensure port 4433 is accessible:

```yaml
ports:
  - "8086:443"
  - "4433:4433"  # Intel AMT
```

## Reverse Proxy

MeshCentral requires WebSocket support in your reverse proxy. For Nginx Proxy Manager, enable the WebSocket toggle for the proxy host. For Caddy, WebSocket proxying works automatically.

Critical: Do not use MeshCentral's built-in update mechanism when running in Docker. Update by pulling a newer image version instead.

For general reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

MeshCentral creates automatic backups in the backups volume. For additional safety:

```bash
docker compose stop meshcentral
docker run --rm \
  -v meshcentral-data:/data \
  -v meshcentral-files:/files \
  -v $(pwd):/backup \
  alpine sh -c "tar czf /backup/meshcentral-backup-$(date +%Y%m%d).tar.gz -C /data . && tar czf /backup/meshcentral-files-$(date +%Y%m%d).tar.gz -C /files ."
docker compose start meshcentral
```

The critical data is in `meshcentral-data` — this contains the config, database, and certificates. The `meshcentral-files` volume contains user-uploaded files.

For your broader backup strategy, see [Backup Strategy](/foundations/backup-strategy).

## Troubleshooting

### Agent Won't Connect

**Symptom:** The agent installs but doesn't appear in the web interface.

**Fix:** The agent needs to reach your server on port 443 (or whatever port you configured). Verify the agent was installed with the correct server URL. Check the agent log on the remote machine. If behind a reverse proxy, ensure WebSocket connections aren't being dropped.

### Self-Signed Certificate Warnings

**Symptom:** Browsers show certificate warnings when accessing MeshCentral.

**Fix:** Either add the self-signed cert to your browser's trust store, or use a reverse proxy with Let's Encrypt certificates. MeshCentral's self-signed certs are fine for agent connections but inconvenient for browser access.

### Slow Remote Desktop Performance

**Symptom:** Remote desktop sessions are laggy or have low frame rates.

**Fix:** MeshCentral supports multiple remote desktop protocols. Try switching between "Desktop" (software-based) and "MESA" (Intel AMT) if available. Reduce the quality/resolution in the remote desktop toolbar. For best performance, ensure the agent has direct network access to the server.

### Cannot Upload Large Files

**Symptom:** File transfers fail for large files.

**Fix:** If behind a reverse proxy, increase the maximum body size. For Nginx: `client_max_body_size 500M;`. MeshCentral itself doesn't have a hard file size limit, but proxies often do.

### Container Won't Start After Update

**Symptom:** After pulling a new image version, the container crashes on startup.

**Fix:** Check logs with `docker compose logs meshcentral`. Database schema migrations sometimes fail. Back up your data volume, then try deleting the container and recreating it (keeping the volumes). If the issue persists, check the MeshCentral GitHub issues for the specific version.

## Resource Requirements

- **RAM:** 256-512 MB for small deployments (under 20 devices), 1+ GB for larger ones
- **CPU:** Low to moderate — depends on concurrent remote desktop sessions
- **Disk:** ~200 MB for MeshCentral itself, plus storage for file uploads and recordings
- **Network:** Each active remote desktop session uses 1-5 Mbps

## Verdict

MeshCentral is the most feature-complete self-hosted remote management platform available. If you need more than just remote desktop — device inventory, scripting, user roles, audit logs, Intel AMT — nothing else in the self-hosted space comes close.

**Choose MeshCentral if:** You manage multiple devices and need a centralized management console with remote desktop, terminal, file access, and device grouping. It's the right tool for IT teams, small businesses, and anyone managing more than a handful of machines.

**Look elsewhere if:** You just need simple remote desktop between two machines. [RustDesk](/apps/rustdesk) is lighter and has better cross-platform clients for personal use. If you need browser-based access to specific servers without installing agents, [Apache Guacamole](/apps/guacamole) is more appropriate.

## Frequently Asked Questions

### Is MeshCentral free?

Yes, fully open source under Apache 2.0. No paid tier, no feature gating. The entire feature set is available in the free version.

### How does it compare to RustDesk?

MeshCentral is a full device management platform; RustDesk is focused on remote desktop. MeshCentral has more features (scripting, device groups, user roles, Intel AMT) but more complexity. RustDesk has lighter clients and simpler setup for pure remote desktop use. See our [RustDesk vs MeshCentral comparison](/compare/rustdesk-vs-meshcentral).

### Can I use it without installing an agent?

Partially. MeshCentral can connect to devices via RDP, SSH, or VNC without an agent, but the full feature set (remote desktop, terminal, file manager, power control) requires the MeshCentral agent installed on target machines.

### Does it work on mobile devices?

MeshCentral has a mobile-responsive web interface for managing devices from a phone or tablet. There's also an Android app for MeshCentral management. Remote desktop sessions work best on larger screens.

## Related

- [How to Self-Host RustDesk](/apps/rustdesk)
- [How to Self-Host Apache Guacamole](/apps/guacamole)
- [RustDesk vs MeshCentral](/compare/rustdesk-vs-meshcentral)
- [Self-Hosted TeamViewer Alternatives](/replace/teamviewer)
- [Best Self-Hosted VPN Solutions](/best/vpn)
- [How to Self-Host Tailscale](/apps/tailscale)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)
