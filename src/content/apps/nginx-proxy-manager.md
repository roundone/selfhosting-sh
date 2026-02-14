---
title: "How to Self-Host Nginx Proxy Manager with Docker Compose"
type: "app-guide"
app: "nginx-proxy-manager"
category: "reverse-proxy"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Nginx Proxy Manager for easy reverse proxy management with free SSL certificates."
officialUrl: "https://nginxproxymanager.com"
githubUrl: "https://github.com/NginxProxyManager/nginx-proxy-manager"
defaultPort: 81
minRam: "256MB"
---

## What is Nginx Proxy Manager?

Nginx Proxy Manager (NPM) puts a web UI on top of Nginx, making reverse proxy management dead simple. Point your domain at your server, add a proxy host in NPM, click "Request SSL Certificate," and you've got HTTPS access to any self-hosted service. No config files, no command-line SSL. It's the most popular reverse proxy in the self-hosting community for a reason.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A domain name with DNS pointing to your server's public IP
- Ports 80 and 443 forwarded to your server ([port forwarding guide](/foundations/port-forwarding/))

## Docker Compose Configuration

```yaml
# docker-compose.yml for Nginx Proxy Manager
# Tested with NPM 2.11+

services:
  npm:
    container_name: nginx-proxy-manager
    image: jc21/nginx-proxy-manager:latest
    ports:
      - "80:80"     # HTTP
      - "443:443"   # HTTPS
      - "81:81"     # Admin panel
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
    restart: unless-stopped
```

No database needed — NPM uses an embedded SQLite database.

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/npm && cd ~/npm
   ```

2. **Create the `docker-compose.yml`** with the config above.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Access the admin panel** at `http://your-server-ip:81`

5. **Login with default credentials:**
   - Email: `admin@example.com`
   - Password: `changeme`
   - You'll be prompted to change these immediately.

6. **Add your first proxy host:**
   - Go to Hosts → Proxy Hosts → Add Proxy Host
   - Domain Name: `app.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname: the IP or container name of your service
   - Forward Port: the service's port
   - Enable "Block Common Exploits"
   - Go to the SSL tab → select "Request a new SSL Certificate"
   - Check "Force SSL" and "HTTP/2 Support"
   - Save

## Configuration Tips

- **Custom Nginx config:** For advanced needs, you can add custom Nginx directives in the "Advanced" tab of each proxy host.
- **Access lists:** Restrict access to services by IP or add basic HTTP authentication via Access Lists.
- **WebSocket support:** Enable "WebSockets Support" in the proxy host settings for services that need it (Vaultwarden, chat apps, etc.).
- **Wildcard SSL:** Use a DNS challenge provider to get a wildcard certificate (`*.yourdomain.com`) covering all subdomains at once.
- **Streams:** NPM can also proxy TCP/UDP streams (useful for game servers, email, etc.).

## Backup & Migration

- **Backup:** The `data` and `letsencrypt` folders contain everything — proxy configurations, SSL certificates, and access lists.
- **Restore:** Drop the backed-up folders into a fresh NPM install and restart.

## Troubleshooting

- **SSL certificate not working:** Ensure ports 80 and 443 are forwarded and your domain's DNS is pointing to your public IP. See our [NPM SSL troubleshooting guide](/troubleshooting/nginx-proxy-manager/ssl-not-working/).
- **502 Bad Gateway:** The target service isn't reachable. Check the forward hostname and port. If the service is in a different Docker network, use the container's IP or create a shared network. See our [NPM 502 fix guide](/troubleshooting/nginx-proxy-manager/502-error/).
- **Can't access admin panel:** Check that port 81 isn't blocked. After initial setup, you can optionally remove the port 81 mapping and access admin through a proxy host instead.

## Alternatives

[Traefik](/apps/traefik/) is more powerful with automatic Docker service discovery but has a steeper learning curve. [Caddy](/apps/caddy/) is simpler for single-service setups with automatic HTTPS. See our [NPM vs Traefik comparison](/compare/nginx-proxy-manager-vs-traefik/) or the full [Best Self-Hosted Reverse Proxies](/best/reverse-proxy/) roundup.

## Verdict

Nginx Proxy Manager is the best reverse proxy for most self-hosters. The web UI makes it accessible to anyone, Let's Encrypt integration is seamless, and it handles 90% of use cases without touching a config file. If you're exposing services to the internet, start with NPM.
