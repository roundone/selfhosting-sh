---
title: "How to Self-Host Zoraxy with Docker"
description: "Deploy Zoraxy reverse proxy with Docker Compose for web UI management, automatic HTTPS, stream proxying, uptime monitoring, and Docker integration."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - zoraxy
tags:
  - docker
  - reverse-proxy
  - zoraxy
  - ssl
  - web-ui
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Zoraxy?

[Zoraxy](https://zoraxy.aroz.org/) is a general-purpose reverse proxy with a web-based management UI. It bundles HTTP/HTTPS reverse proxying, TCP/UDP stream proxying, automatic Let's Encrypt certificates, uptime monitoring, GeoIP filtering, and a web SSH terminal into a single tool. Think of it as a middle ground between Nginx Proxy Manager's simplicity and Traefik's Docker integration — Zoraxy gives you a GUI for managing proxy rules while also supporting Docker container auto-discovery.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM (512 MB if enabling FastGeoIP)
- 500 MB of disk space
- Ports 80 and 443 available

## Docker Compose Configuration

Create a directory for your Zoraxy setup:

```bash
mkdir -p ~/zoraxy && cd ~/zoraxy
```

Create a `docker-compose.yml` file:

```yaml
services:
  zoraxy:
    image: zoraxydocker/zoraxy:v3.3.1
    container_name: zoraxy
    restart: unless-stopped
    ports:
      - "80:80"       # HTTP traffic
      - "443:443"     # HTTPS traffic
      - "8000:8000"   # Management UI
    volumes:
      - ./config:/opt/zoraxy/config/
      - ./plugin:/opt/zoraxy/plugin/
      - /var/run/docker.sock:/var/run/docker.sock  # Optional: Docker integration
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      FASTGEOIP: "false"   # Set "true" for high-speed GeoIP (needs ~1 GB extra RAM)
      TZ: "America/New_York"  # Change to your timezone
    networks:
      - proxy

networks:
  proxy:
    name: proxy
    driver: bridge
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open the management UI at `http://your-server:8000`
2. On first access, you will be prompted to create an admin account
3. Set a strong password — this controls your entire proxy configuration

After logging in, the dashboard shows an overview of all proxy rules, certificates, and uptime status.

### Adding Your First Proxy Rule

1. Click **HTTP Proxy** in the sidebar
2. Click **Add Rule**
3. Enter the incoming domain (e.g., `app.example.com`)
4. Set the upstream target (e.g., `http://host.docker.internal:3000` for a service running on the host, or `http://container-name:port` for Docker containers)
5. Enable **Require TLS** to automatically provision a Let's Encrypt certificate
6. Save the rule

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Management UI port. Do NOT include a colon in Docker mode |
| `DOCKER` | `true` | Docker compatibility mode |
| `FASTGEOIP` | `false` | High-speed GeoIP lookup. Requires ~1 GB extra RAM |
| `ZEROTIER` | `false` | ZeroTier VPN integration |
| `WEBFM` | `true` | Web file manager |
| `ENABLELOG` | `true` | Enable logging |
| `TZ` | `Etc/UTC` | Timezone (standard tzdata format) |

### Docker Container Discovery

When you mount the Docker socket (`/var/run/docker.sock`), Zoraxy can discover running containers and offer them as upstream targets when creating proxy rules. This is similar to Traefik's auto-discovery but configured through the web UI rather than container labels.

**Security warning:** Mounting the Docker socket grants Zoraxy root-equivalent access to the Docker daemon. Only use this on trusted networks.

### Proxying to Host Services

The `extra_hosts` directive maps `host.docker.internal` to your Docker host's gateway IP. Use `http://host.docker.internal:PORT` as the upstream target for services running directly on the host (not in Docker).

## Advanced Configuration

### GeoIP Filtering

Enable `FASTGEOIP: "true"` in your Docker Compose to load the GeoIP database into memory. This allows you to:
- Block traffic from specific countries
- Allow traffic only from specific countries
- View geographic traffic distribution in the dashboard

**Warning:** FastGeoIP uses approximately 1 GB of additional RAM. Do not enable on memory-constrained servers.

### Stream Proxying (TCP/UDP)

Zoraxy supports TCP and UDP stream proxying for non-HTTP services like databases, game servers, or MQTT brokers. Configure stream proxies through the web UI under **Stream Proxy**.

### ZeroTier Integration

Set `ZEROTIER: "true"` to enable built-in ZeroTier VPN support. This allows Zoraxy to proxy traffic to services on your ZeroTier network without exposing them directly to the internet.

### Custom Plugins

Mount the plugin directory (`./plugin:/opt/zoraxy/plugin/`) to add custom functionality. Zoraxy's plugin system supports extending the proxy with custom middleware and handlers.

## Reverse Proxy

Zoraxy *is* a reverse proxy, so it serves as your primary entry point. If you want to place Zoraxy behind another proxy (e.g., for Cloudflare Tunnel), configure the outer proxy to forward traffic to Zoraxy's HTTP (80) and HTTPS (443) ports.

For most setups, Zoraxy should be your outermost proxy, handling SSL termination and routing directly.

## Backup

Back up these directories:

- **`./config/`** — All proxy rules, certificates, user accounts, and settings
- **`./plugin/`** — Custom plugins

```bash
tar -czf zoraxy-backup-$(date +%Y%m%d).tar.gz config/ plugin/
```

The `config/` directory contains everything needed to restore your Zoraxy setup. See our [Backup Strategy](/foundations/backup-3-2-1-rule/) guide for a comprehensive approach.

## Troubleshooting

### Cannot Access Management UI
**Symptom:** Browser cannot connect to port 8000.
**Fix:** Verify the port is mapped in `docker-compose.yml` and not blocked by your firewall:
```bash
docker compose logs zoraxy
sudo ufw status
```
If you changed the `PORT` environment variable, access the UI on that port instead. Do NOT include a colon in the port value when running in Docker mode.

### SSL Certificate Not Provisioning
**Symptom:** Let's Encrypt certificate fails to issue.
**Fix:** Ensure ports 80 and 443 are publicly accessible (not behind a firewall or NAT without port forwarding). Let's Encrypt's HTTP-01 challenge requires an incoming connection on port 80. Check the Zoraxy logs for specific ACME errors:
```bash
docker compose logs zoraxy | grep -i acme
```

### Upstream Connection Refused
**Symptom:** Proxy rule returns 502 Bad Gateway.
**Fix:** Verify the upstream target is reachable from inside the Zoraxy container:
```bash
docker exec zoraxy wget -qO- http://upstream-host:port/
```
For host services, ensure you are using `host.docker.internal` and the `extra_hosts` directive is set in your Docker Compose.

### High Memory Usage with FastGeoIP
**Symptom:** Container uses 1 GB+ of RAM.
**Fix:** This is expected when `FASTGEOIP: "true"`. The GeoIP database is loaded entirely into memory for fast lookups. Set `FASTGEOIP: "false"` if you do not need geographic filtering — standard GeoIP still works, just slower.

### Docker Container Discovery Not Working
**Symptom:** No containers appear in the upstream dropdown.
**Fix:** Ensure `/var/run/docker.sock` is mounted in the Docker Compose file. Check that the socket file has the correct permissions:
```bash
ls -la /var/run/docker.sock
```

## Resource Requirements

- **RAM:** 100-150 MB idle (without FastGeoIP), 1-1.2 GB with FastGeoIP enabled
- **CPU:** Low
- **Disk:** ~200 MB for the image, plus config and certificate storage

## Verdict

Zoraxy is an excellent choice if you want a web UI for reverse proxy management with more features than Nginx Proxy Manager. The built-in uptime monitoring, GeoIP filtering, stream proxying, and Docker integration make it a compelling all-in-one tool. Its web SSH terminal is a nice touch for managing servers through the browser.

The main downsides: it is newer and less battle-tested than NPM or Traefik, and the community is smaller (~5K GitHub stars vs NPM's 23K+ or Traefik's 53K+). If you want maximum stability and the largest community, stick with [Nginx Proxy Manager](/apps/nginx-proxy-manager/). If you want Docker auto-discovery without a web UI, use [Traefik](/apps/traefik/). But if you want a feature-rich GUI proxy that does more than NPM, Zoraxy is worth trying.

## FAQ

### How does Zoraxy compare to Nginx Proxy Manager?
Zoraxy offers more built-in features: stream proxying, GeoIP filtering, uptime monitoring, web SSH, and Docker container discovery. NPM has a larger community, more documentation, and longer track record. For most self-hosters, either works well — choose Zoraxy if you want the extra features, NPM if you want maximum community support.

### Does Zoraxy support wildcard certificates?
Yes. Zoraxy supports DNS-01 challenge for wildcard certificates. Configure your DNS provider credentials in the SSL/TLS settings section of the web UI.

### Can Zoraxy replace both Nginx Proxy Manager and Uptime Kuma?
Partially. Zoraxy's built-in uptime monitoring covers basic health checks, but [Uptime Kuma](/apps/uptime-kuma/) offers significantly more notification channels, monitoring types, and status page features. For simple uptime checks, Zoraxy's built-in monitoring is sufficient.

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager/)
- [How to Self-Host Traefik with Docker](/apps/traefik/)
- [How to Self-Host Caddy with Docker](/apps/caddy/)
- [How to Self-Host Uptime Kuma with Docker](/apps/uptime-kuma/)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy/)
- [Nginx Proxy Manager vs Traefik](/compare/nginx-proxy-manager-vs-traefik/)
- [Zoraxy vs Caddy](/compare/zoraxy-vs-caddy/)
- [Zoraxy vs Nginx Proxy Manager](/compare/zoraxy-vs-nginx-proxy-manager/)
- [Zoraxy vs Traefik](/compare/zoraxy-vs-traefik/)
- [Zoraxy vs Cosmos Cloud](/compare/zoraxy-vs-cosmos-cloud/)
- [HAProxy vs Zoraxy](/compare/haproxy-vs-zoraxy/)
- [Nginx vs Zoraxy](/compare/nginx-vs-zoraxy/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [SSL Certificates Explained](/foundations/ssl-certificates/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
