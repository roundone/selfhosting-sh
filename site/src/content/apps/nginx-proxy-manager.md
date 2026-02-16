---
title: "How to Self-Host Nginx Proxy Manager"
description: "Set up Nginx Proxy Manager with Docker Compose for easy reverse proxy management, free SSL certificates, and a clean web UI."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy-ssl"
apps:
  - nginx-proxy-manager
tags:
  - self-hosted
  - reverse-proxy
  - ssl
  - nginx
  - docker
  - letsencrypt
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nginx Proxy Manager?

[Nginx Proxy Manager](https://nginxproxymanager.com) (NPM) is a reverse proxy management tool that wraps Nginx in a clean web UI. It handles SSL certificate provisioning via Let's Encrypt, proxy host configuration, redirections, access lists, and stream forwarding — all without touching a single Nginx config file. If you run multiple self-hosted services and want them accessible via subdomains with HTTPS, NPM is the fastest way to get there.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 512 MB of free RAM (NPM is lightweight)
- Ports 80 and 443 available (not used by another web server)
- A domain name with DNS pointing to your server (for SSL certificates)

## Docker Compose Configuration

Create a directory for NPM and a `docker-compose.yml` file:

```bash
mkdir -p ~/nginx-proxy-manager && cd ~/nginx-proxy-manager
```

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.13.7
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"       # HTTP
      - "443:443"     # HTTPS
      - "81:81"       # Admin web UI
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    environment:
      TZ: "America/New_York"
      # Optional: disable IPv6 if your network doesn't support it
      # DISABLE_IPV6: "true"

volumes:
  npm-data:
  npm-letsencrypt:
```

Start the stack:

```bash
docker compose up -d
```

NPM uses SQLite by default, which works well for most self-hosting setups. If you need MySQL or PostgreSQL for large-scale deployments, add a database service:

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.13.7
    container_name: nginx-proxy-manager
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    environment:
      TZ: "America/New_York"
      DB_MYSQL_HOST: npm-db
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: npm
      DB_MYSQL_PASSWORD: "change-this-strong-password"
      DB_MYSQL_NAME: npm
    depends_on:
      - npm-db

  npm-db:
    image: mariadb:10.11
    container_name: npm-db
    restart: unless-stopped
    volumes:
      - npm-db-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: "change-this-root-password"
      MYSQL_DATABASE: npm
      MYSQL_USER: npm
      MYSQL_PASSWORD: "change-this-strong-password"

volumes:
  npm-data:
  npm-letsencrypt:
  npm-db-data:
```

## Initial Setup

1. Open the admin UI at `http://your-server-ip:81`
2. Log in with the default credentials:
   - **Email:** `admin@example.com`
   - **Password:** `changeme`
3. You will be prompted to change the admin email and password immediately. Use a strong password.

## Configuration

### Adding a Proxy Host

This is the core workflow — routing a subdomain to one of your self-hosted services:

1. Go to **Hosts > Proxy Hosts** and click **Add Proxy Host**
2. Fill in:
   - **Domain Names:** `app.yourdomain.com`
   - **Scheme:** `http` (the internal connection to your service)
   - **Forward Hostname/IP:** The container name or IP of your service (e.g., `immich-server` or `192.168.1.50`)
   - **Forward Port:** The service's internal port (e.g., `3001`)
3. Under the **SSL** tab:
   - Select **Request a new SSL Certificate**
   - Check **Force SSL** and **HTTP/2 Support**
   - Enter your email for Let's Encrypt
   - Agree to the terms
4. Click **Save**

### Access Lists

Restrict access to services by IP range or username/password:

1. Go to **Access Lists** and click **Add Access List**
2. Set a name and add either IP-based rules (allow/deny) or username/password pairs
3. Apply the access list to any proxy host under its settings

### Redirections

Set up 301/302 redirects:

1. Go to **Hosts > Redirection Hosts**
2. Enter the source domain and the target URL
3. Choose redirect type (301 permanent or 302 temporary)

### Custom Nginx Configuration

For advanced use cases, each proxy host has a **Custom Nginx Configuration** field in the **Advanced** tab where you can add raw Nginx directives like custom headers, WebSocket support, or increased upload limits:

```nginx
client_max_body_size 100M;

proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Advanced Configuration (Optional)

### Wildcard SSL Certificates

For wildcard certificates (`*.yourdomain.com`), use DNS challenge instead of HTTP challenge:

1. When adding an SSL certificate, select **Use a DNS Challenge**
2. Choose your DNS provider (Cloudflare, DigitalOcean, Route53, etc.)
3. Enter the API credentials for your provider
4. The certificate will cover `*.yourdomain.com` and auto-renew

### Stream Forwarding

Forward non-HTTP traffic (e.g., SSH, game servers, databases) through NPM:

1. Go to **Hosts > Streams**
2. Enter the incoming port, forward host, and forward port

Add the extra ports to your Docker Compose:

```yaml
ports:
  - "80:80"
  - "443:443"
  - "81:81"
  - "2222:2222"  # Example: SSH forwarding
```

## Reverse Proxy

NPM *is* the reverse proxy. For configurations where NPM sits behind another proxy (e.g., Cloudflare), set the **Trusted Proxies** under the admin settings to include Cloudflare's IP ranges. See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for the broader architecture.

## Backup

Back up the named volumes:

```bash
docker compose stop
# Back up data and certificates
docker run --rm -v npm-data:/data -v $(pwd):/backup alpine tar czf /backup/npm-data-backup.tar.gz /data
docker run --rm -v npm-letsencrypt:/letsencrypt -v $(pwd):/backup alpine tar czf /backup/npm-letsencrypt-backup.tar.gz /letsencrypt
docker compose start
```

The `/data` volume contains the SQLite database (or connection config) and all proxy host configurations. The `/etc/letsencrypt` volume contains your SSL certificates. Both are critical. See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Port 80 or 443 already in use

**Symptom:** Container fails to start with "bind: address already in use"

**Fix:** Stop the conflicting service (often Apache or Nginx):
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
# or
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### Let's Encrypt certificate fails to provision

**Symptom:** "Internal Error" when requesting SSL certificate

**Fix:** Ensure ports 80 and 443 are open in your firewall and reachable from the internet. Let's Encrypt needs to reach your server on port 80 for HTTP-01 validation:
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Also verify your DNS A record points to your server's public IP.

### 502 Bad Gateway

**Symptom:** Proxy host returns 502 error

**Fix:** The target service is unreachable. Check:
- The target container is running: `docker ps`
- The hostname resolves (use the container name if on the same Docker network, or the host IP if not)
- The forward port matches the service's actual listening port
- If using container names, both containers must be on the same Docker network

### Admin UI not loading on port 81

**Symptom:** Cannot access `http://server:81`

**Fix:** Check that port 81 is not blocked by a firewall:
```bash
sudo ufw allow 81/tcp
```

For production, restrict port 81 to your local network after initial setup — the admin UI should not be publicly accessible.

### WebSocket connections failing

**Symptom:** Apps using WebSockets (e.g., Home Assistant, Vaultwarden) have connection issues

**Fix:** Enable WebSocket support in the proxy host settings. Check the **Websockets Support** toggle on the proxy host, or add custom configuration:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## Resource Requirements

- **RAM:** ~50 MB idle, ~100 MB under moderate load
- **CPU:** Minimal — NPM is mostly I/O bound
- **Disk:** <100 MB for the application, plus SSL certificates

## Frequently Asked Questions

### Is Nginx Proxy Manager free?

Yes. NPM is fully open source under the MIT license. There are no paid tiers or feature restrictions.

### Can I run Nginx Proxy Manager on a Raspberry Pi?

Yes. NPM runs well on a Raspberry Pi 4 with 2+ GB RAM. The arm64 image is available on Docker Hub.

### How many proxy hosts can NPM handle?

Hundreds. The underlying Nginx server is extremely efficient. The main limitation is the number of concurrent SSL certificates, which depends on your Let's Encrypt rate limits (50 certificates per registered domain per week).

### Can I use NPM with Cloudflare?

Yes. Set Cloudflare DNS to proxy mode (orange cloud). NPM will terminate SSL from Cloudflare and manage the internal certificates. Set the SSL/TLS mode to "Full (Strict)" in Cloudflare.

## Verdict

Nginx Proxy Manager is the best reverse proxy solution for most self-hosters. It eliminates the need to write Nginx configs manually, handles SSL automatically, and provides a clean UI for managing everything. If you run more than one self-hosted service, NPM should be the first thing you deploy. For users who prefer configuration-as-code, look at [Traefik](/apps/traefik) or [Caddy](/apps/caddy) instead.

## Related

- [Best Self-Hosted Reverse Proxy & SSL](/best/reverse-proxy-ssl)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [How to Self-Host Home Assistant](/apps/home-assistant)
- [How to Self-Host Vaultwarden](/apps/vaultwarden)
- [How to Self-Host Immich](/apps/immich)
- [SSH and Security Basics](/foundations/ssh-setup)
