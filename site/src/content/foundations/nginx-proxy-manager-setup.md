---
title: "Nginx Proxy Manager Setup Guide"
description: "Install and configure Nginx Proxy Manager with Docker — the easiest reverse proxy for self-hosting with automatic SSL and a web-based GUI."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["reverse-proxy", "nginx", "ssl", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nginx Proxy Manager?

Nginx Proxy Manager (NPM) is a web-based GUI for managing Nginx reverse proxy configurations. It handles SSL certificate generation via Let's Encrypt, proxy host management, and access control — all through a browser interface. No Nginx config files to edit manually.

For self-hosting, NPM is the easiest way to give each service its own subdomain with HTTPS: `cloud.yourdomain.com`, `media.yourdomain.com`, `git.yourdomain.com`.

## Prerequisites

- A Linux server with Docker ([Docker Compose Basics](/foundations/docker-compose-basics/))
- A domain name with DNS access
- Ports 80 and 443 available (not used by another service)
- DNS records pointing to your server (A records or CNAME via [Dynamic DNS](/foundations/dynamic-dns/))
- Understanding of [reverse proxies](/foundations/reverse-proxy-explained/)

## Installation

```yaml
# docker-compose.yml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:2.12.1
    ports:
      - "80:80"
      - "443:443"
      - "127.0.0.1:81:81"    # Admin UI — localhost only
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    restart: unless-stopped

volumes:
  npm-data:
  npm-letsencrypt:
```

```bash
docker compose up -d
```

### Initial Login

1. Open `http://your-server-ip:81`
2. Default credentials:
   - Email: `admin@example.com`
   - Password: `changeme`
3. Change both immediately after first login

**Security note:** The admin UI (port 81) is bound to `127.0.0.1` — only accessible from the server itself or via SSH tunnel. To access it from your workstation:

```bash
# SSH tunnel to access admin UI from your browser
ssh -L 8181:127.0.0.1:81 user@your-server-ip
# Then open http://localhost:8181 in your browser
```

Or use [Tailscale](/foundations/tailscale-setup/) to access it via the server's Tailscale IP.

## Setting Up DNS

Before configuring proxy hosts, point DNS records to your server:

```
Type: A
Name: cloud
Value: YOUR_PUBLIC_IP (or Tailscale IP for local-only)

Type: A
Name: media
Value: YOUR_PUBLIC_IP

Type: A
Name: *       (wildcard — optional, catches all subdomains)
Value: YOUR_PUBLIC_IP
```

If your IP is dynamic, use [Dynamic DNS](/foundations/dynamic-dns/) to keep records updated.

## Adding a Proxy Host

For each service you want to expose:

1. In NPM, go to **Proxy Hosts → Add Proxy Host**
2. Fill in:

| Field | Value | Example |
|-------|-------|---------|
| Domain Names | Your subdomain | `cloud.yourdomain.com` |
| Scheme | http (usually) | http |
| Forward Hostname / IP | Container name or IP | `nextcloud` or `172.17.0.5` |
| Forward Port | The service's internal port | `80` |
| Block Common Exploits | Enable | ✓ |
| Websockets Support | Enable if needed | ✓ (for Nextcloud, Vaultwarden, etc.) |

3. Switch to the **SSL tab**:
   - SSL Certificate: "Request a new SSL Certificate"
   - Force SSL: Enable
   - HTTP/2 Support: Enable
   - HSTS Enabled: Enable
   - Email for Let's Encrypt: your email

4. Click **Save**

NPM automatically:
- Generates an Nginx config
- Requests a Let's Encrypt certificate
- Sets up HTTP → HTTPS redirect
- Configures the proxy

### Connecting to Docker Containers

NPM needs to reach your services. Two approaches:

**Option A: Docker Network (Recommended)**

Put NPM and your services on the same Docker network:

```yaml
# NPM docker-compose.yml
services:
  nginx-proxy-manager:
    image: jc21/nginx-proxy-manager:2.12.1
    ports:
      - "80:80"
      - "443:443"
      - "127.0.0.1:81:81"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
    name: proxy
    driver: bridge

volumes:
  npm-data:
  npm-letsencrypt:
```

```yaml
# Nextcloud docker-compose.yml (separate directory)
services:
  nextcloud:
    image: nextcloud:29.0
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
    external: true
```

In NPM, use the container service name as the hostname: `nextcloud` on port `80`.

**Option B: Host IP**

If services aren't on the same Docker network, use the host's Docker bridge IP:

```bash
# Find the Docker bridge IP
ip addr show docker0
# Usually 172.17.0.1
```

In NPM, forward to `172.17.0.1:PORT` (where PORT is the host port mapping).

## Common Service Configurations

### Nextcloud

| Setting | Value |
|---------|-------|
| Domain | cloud.yourdomain.com |
| Scheme | http |
| Forward Host | nextcloud (Docker network) |
| Forward Port | 80 |
| Websockets | Enabled |
| Block Exploits | Enabled |

Add custom Nginx config (Advanced tab):

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;

client_max_body_size 10G;
proxy_buffering off;
proxy_request_buffering off;
```

The `client_max_body_size 10G` allows large file uploads.

### Vaultwarden

| Setting | Value |
|---------|-------|
| Domain | vault.yourdomain.com |
| Scheme | http |
| Forward Host | vaultwarden |
| Forward Port | 80 |
| Websockets | Enabled (required for live sync) |

### Jellyfin

| Setting | Value |
|---------|-------|
| Domain | media.yourdomain.com |
| Scheme | http |
| Forward Host | jellyfin |
| Forward Port | 8096 |
| Websockets | Enabled |

### Home Assistant

| Setting | Value |
|---------|-------|
| Domain | ha.yourdomain.com |
| Scheme | http |
| Forward Host | homeassistant |
| Forward Port | 8123 |
| Websockets | Enabled (required) |

## SSL Certificate Management

### Automatic Renewal

Let's Encrypt certificates expire every 90 days. NPM renews them automatically — no cron job needed. Check certificate status in the SSL Certificates tab.

### Wildcard Certificates

Instead of individual certificates per subdomain, use a single wildcard certificate:

1. SSL Certificates → Add SSL Certificate → Let's Encrypt
2. Domain: `*.yourdomain.com`
3. Use DNS Challenge (required for wildcards)
4. Select your DNS provider (Cloudflare, etc.)
5. Enter API credentials

This covers all subdomains with one certificate.

### DNS Challenge Providers

For wildcard certificates, NPM supports DNS challenges with many providers:

| Provider | Setup |
|----------|-------|
| Cloudflare | API token with Zone:DNS:Edit permissions |
| DigitalOcean | API token |
| Route53 (AWS) | Access key + secret |
| Google Cloud | Service account JSON |

## Access Lists

Restrict access to specific proxy hosts by IP:

1. Access Lists → Add Access List
2. Name: "Local Only"
3. Authorization: Add allowed IPs (e.g., `192.168.1.0/24`)
4. Deny all others
5. Apply the access list to a proxy host

Useful for admin interfaces (Portainer, Grafana) that shouldn't be public.

## Custom Nginx Configuration

For advanced configuration, add custom directives per proxy host:

**Advanced tab → Custom Nginx Configuration:**

```nginx
# Rate limiting
limit_req zone=one burst=10 nodelay;

# Custom headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";

# Large file uploads (Nextcloud)
client_max_body_size 10G;
```

## Backup and Migration

### Backup NPM Data

```bash
# Stop NPM
docker compose down

# Backup volumes
docker run --rm -v npm-data:/data -v $(pwd):/backup alpine tar czf /backup/npm-data.tar.gz -C /data .
docker run --rm -v npm-letsencrypt:/data -v $(pwd):/backup alpine tar czf /backup/npm-letsencrypt.tar.gz -C /data .

# Restart
docker compose up -d
```

### Restore

```bash
docker compose down
docker run --rm -v npm-data:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/npm-data.tar.gz"
docker run --rm -v npm-letsencrypt:/data -v $(pwd):/backup alpine sh -c "cd /data && tar xzf /backup/npm-letsencrypt.tar.gz"
docker compose up -d
```

## Common Mistakes

### 1. Port 80/443 Already in Use

If Apache or another web server is running on the host:

```bash
sudo ss -tlnp | grep -E ':80|:443'
# Stop the conflicting service
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### 2. DNS Not Pointing to Your Server

SSL certificate generation fails if the domain doesn't resolve to your server. Verify:

```bash
dig +short cloud.yourdomain.com
# Should return your server's IP
```

### 3. Forgetting to Enable Websockets

Many apps (Nextcloud, Vaultwarden, Home Assistant) require WebSocket support. Enable it per proxy host or you'll get broken real-time features.

### 4. Not Using a Docker Network

Forwarding to `localhost:PORT` doesn't work from inside the NPM container (different network namespace). Use Docker networks with service names, or forward to the Docker bridge IP.

### 5. Exposing the Admin UI to the Internet

Port 81 (admin UI) should never be accessible from the internet. Bind it to `127.0.0.1:81:81` and access via SSH tunnel or Tailscale.

## FAQ

### NPM vs Traefik vs Caddy — which should I use?

NPM is the easiest (web GUI, point-and-click). Traefik has the best Docker integration (auto-discovers services via labels). Caddy has the simplest config files. For beginners, start with NPM. Switch to Traefik later if you want automatic service discovery.

### Can I use NPM with Cloudflare Tunnel?

Yes, but it's redundant. Cloudflare Tunnel already handles HTTPS and routing. Using both means traffic goes: Cloudflare → NPM → service. You can skip NPM and let Cloudflare route directly to services. Use NPM when port forwarding directly, not with Cloudflare Tunnel.

### How do I update NPM?

```bash
docker compose pull
docker compose up -d
```

Your configuration is stored in the volumes and survives updates.

### Can NPM handle high traffic?

For homelab use, absolutely. NPM is Nginx under the hood — it handles thousands of concurrent connections. Resource usage is minimal (~50 MB RAM).

### Why is my Let's Encrypt certificate failing?

Common causes: DNS not pointing to your server, port 80 blocked by ISP or firewall, rate limited (too many failed attempts). Check NPM logs: `docker compose logs nginx-proxy-manager`.

## Next Steps

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/) — understand the concepts
- [SSL Certificates](/foundations/ssl-certificates/) — how HTTPS works
- [Dynamic DNS](/foundations/dynamic-dns/) — keep DNS updated

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [SSL Certificates for Self-Hosting](/foundations/ssl-certificates/)
- [DNS Explained](/foundations/dns-explained/)
- [Dynamic DNS Setup](/foundations/dynamic-dns/)
- [Port Forwarding Guide](/foundations/port-forwarding/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
