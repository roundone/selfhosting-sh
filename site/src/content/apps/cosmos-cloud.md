---
title: "How to Self-Host Cosmos Cloud with Docker"
description: "Deploy Cosmos Cloud with Docker for an all-in-one self-hosting platform with a reverse proxy, container management, and app marketplace."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - cosmos-cloud
tags:
  - self-hosted
  - docker
  - cosmos-cloud
  - container-management
  - reverse-proxy
  - self-hosting-platform
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Cosmos Cloud?

[Cosmos Cloud](https://cosmos-cloud.io) is an all-in-one self-hosting platform that combines a reverse proxy, container management, app marketplace, authentication, and security hardening into a single tool. Instead of running separate tools for Docker management (Portainer), reverse proxy (Nginx Proxy Manager), and SSO (Authelia), Cosmos bundles it all together. It's designed to make self-hosting accessible while keeping security as a first-class concern.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- Docker installed ([guide](/foundations/docker-compose-basics/))
- 1 GB of free RAM minimum (2 GB recommended)
- 2 GB of free disk space
- A domain name pointing to your server (required for HTTPS)
- Ports 80 and 443 available

## Docker Compose Configuration

Create a directory and `docker-compose.yml`:

```bash
mkdir -p ~/cosmos && cd ~/cosmos
```

```yaml
services:
  cosmos:
    image: azukaar/cosmos-server:v0.20.2
    container_name: cosmos-server
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - cosmos-config:/config
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      TZ: "America/New_York"
    hostname: cosmos-server
    privileged: false

volumes:
  cosmos-config:
```

Start the stack:

```bash
docker compose up -d
```

**Note:** Cosmos needs the Docker socket to manage containers. Like all Docker management tools, this grants significant host access. Cosmos implements socket proxy protections internally, but run it on trusted networks.

## Initial Setup

1. Open `https://your-server-ip` (Cosmos generates a self-signed cert initially)
2. Accept the certificate warning for the first-time setup
3. The setup wizard walks you through:
   - **Admin account creation** — choose a strong username and password
   - **Domain configuration** — enter your domain (e.g., `cosmos.yourdomain.com`)
   - **Let's Encrypt** — Cosmos automatically provisions SSL certificates
   - **MongoDB setup** — Cosmos uses an embedded MongoDB instance (no external database needed)
4. After setup, access the dashboard at `https://your-domain`

## Configuration

### App Marketplace

Cosmos includes a built-in marketplace with one-click deployment for popular self-hosted apps:

1. Go to **Market** in the sidebar
2. Browse or search for apps (Nextcloud, Immich, Jellyfin, etc.)
3. Click **Install** — Cosmos configures the container, reverse proxy route, and SSL automatically
4. Access the app at its assigned subdomain

This is Cosmos's strongest feature: deploying an app also configures its reverse proxy entry and SSL certificate in one step.

### Reverse Proxy (URLs)

Cosmos includes a built-in reverse proxy with automatic HTTPS:

1. Go to **URLs** in the sidebar
2. Add a new route:
   - **URL:** `app.yourdomain.com`
   - **Target:** container name and port
   - SSL is automatic via Let's Encrypt
3. Cosmos supports path-based routing, custom headers, and WebSocket forwarding

### User Management

Cosmos has built-in multi-user authentication:

1. Go to **Users** to create additional accounts
2. Set per-user permissions for which apps and URLs they can access
3. Enable two-factor authentication (2FA) for accounts
4. Cosmos provides an authentication portal — users log in once and access all permitted apps

### Network Security

Cosmos includes built-in security features:

- **Anti-bot protection** — CAPTCHA challenges for login
- **IP-based geoblocking** — restrict access by country
- **Brute-force protection** — automatic lockout after failed attempts
- **Container isolation** — network policies between containers
- **Smart Shield** — rate limiting and DDoS protection at the proxy level

## Advanced Configuration (Optional)

### Docker Compose Integration

Cosmos can import existing Docker Compose files:

1. Go to **ServApps** > **Docker Compose**
2. Paste your `docker-compose.yml`
3. Cosmos creates the stack and optionally adds reverse proxy routes

### VPN (Constellation)

Cosmos includes a built-in VPN called Constellation based on Nebula:

1. Enable in **Settings** > **Constellation**
2. Add devices to create a mesh VPN between your servers and clients
3. Access self-hosted services without port forwarding

### Monitoring

The dashboard shows real-time metrics:

- CPU and memory usage per container
- Network traffic
- Disk usage
- Container health status and alerts

### Custom Domains

Each app deployed through Cosmos gets a subdomain route automatically. Customize in **URLs**:

```
nextcloud.yourdomain.com → nextcloud:80
jellyfin.yourdomain.com → jellyfin:8096
```

Wildcard certificates are supported — configure once for `*.yourdomain.com`.

## Backup

Back up the config volume:

```bash
docker compose stop cosmos
docker run --rm -v cosmos-config:/config -v $(pwd):/backup alpine \
  tar czf /backup/cosmos-backup.tar.gz /config
docker compose start cosmos
```

The `/config` volume contains:
- Cosmos configuration and database
- User accounts and permissions
- URL routes and proxy configuration
- SSL certificates

Apps deployed through Cosmos store their data in their own volumes — back those up separately.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### Setup wizard loops or doesn't complete

**Symptom:** The initial setup wizard restarts or shows errors.

**Fix:** Ensure ports 80 and 443 are not used by another service:
```bash
sudo lsof -i :80
sudo lsof -i :443
```
Stop any conflicting services. Cosmos requires exclusive access to these ports.

### Let's Encrypt certificate fails

**Symptom:** HTTPS shows a self-signed certificate after setup.

**Fix:** Verify:
- Your domain's DNS A record points to the server's public IP
- Ports 80 and 443 are reachable from the internet (check firewall)
- The domain you entered matches exactly what's in DNS

Check logs:
```bash
docker logs cosmos-server
```

### Docker socket permission errors

**Symptom:** Cosmos can't list or manage containers.

**Fix:** Verify the Docker socket mount is correct and the socket exists:
```bash
ls -la /var/run/docker.sock
```
If using a non-standard Docker socket path, adjust the volume mount.

### App deployment fails from marketplace

**Symptom:** Installing an app from the marketplace shows an error.

**Fix:** Check available disk space and memory. Some marketplace apps have specific resource requirements. View the error details in `docker logs cosmos-server` for specifics.

### High memory usage

**Symptom:** Cosmos uses 500+ MB of RAM.

**Fix:** The embedded MongoDB instance is the main consumer. This is normal for Cosmos's feature set. If memory is tight, consider lighter alternatives like [Dockge](/apps/dockge/) for container management and [Nginx Proxy Manager](/apps/nginx-proxy-manager/) for reverse proxying separately.

## Resource Requirements

- **RAM:** ~200-400 MB idle (includes embedded MongoDB), ~500 MB under load
- **CPU:** Low to moderate — heavier than single-purpose tools due to bundled features
- **Disk:** ~500 MB for application, plus data for deployed apps

## Verdict

Cosmos Cloud is the most ambitious self-hosting platform available. It replaces three or four separate tools (reverse proxy, container manager, auth system, VPN) with one integrated solution. The app marketplace with automatic reverse proxy configuration is genuinely excellent — it eliminates the biggest pain point for self-hosting beginners.

The trade-off is resource usage and complexity. Cosmos is heavier than running Dockge + NPM separately, and when something goes wrong, you're debugging an all-in-one system rather than isolated components. It's also a younger project with a smaller community than Portainer or NPM.

**Use Cosmos if** you're starting fresh and want one tool that handles everything. **Skip it if** you prefer the Unix philosophy of small, composable tools, or if you're running on limited hardware (Raspberry Pi, 1 GB RAM servers).

## Frequently Asked Questions

### Is Cosmos Cloud free?

Yes. Cosmos Cloud is open source and free to use. There are no paid tiers or feature gates.

### How does Cosmos compare to Portainer?

Cosmos bundles a reverse proxy, auth, and VPN that Portainer doesn't have. Portainer has better multi-host management, Docker Swarm/K8s support, and a larger community. See our [Portainer vs Cosmos comparison](/compare/portainer-vs-cosmos/).

### Does Cosmos replace Nginx Proxy Manager?

Yes. Cosmos includes a built-in reverse proxy with automatic HTTPS. You don't need a separate reverse proxy if you use Cosmos as your platform.

### Can I use Cosmos alongside other Docker management tools?

It's possible but not recommended. Cosmos wants to manage the Docker environment holistically. Running Portainer alongside Cosmos creates potential conflicts (both managing the same containers).

### Does Cosmos work on ARM/Raspberry Pi?

Yes, Cosmos supports ARM64. However, the resource requirements (especially MongoDB) make it tight on a Raspberry Pi with 1-2 GB RAM. Consider a 4 GB+ Pi or a mini PC.

## Related

- [How to Self-Host Portainer](/apps/portainer/)
- [How to Self-Host Dockge](/apps/dockge/)
- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager/)
- [Portainer vs Cosmos Cloud](/compare/portainer-vs-cosmos/)
- [Portainer vs Dockge](/compare/portainer-vs-dockge/)
- [Best Docker Management Tools](/best/docker-management/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Cosmos Cloud vs Lazydocker](/compare/cosmos-cloud-vs-lazydocker/)
- [Cosmos Cloud vs Yacht](/compare/cosmos-cloud-vs-yacht/)
- [Diun vs Cosmos Cloud](/compare/diun-vs-cosmos-cloud/)
- [Watchtower vs Cosmos Cloud](/compare/watchtower-vs-cosmos-cloud/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
