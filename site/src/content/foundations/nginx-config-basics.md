---
title: "Nginx Configuration Basics for Self-Hosting"
description: "Master nginx configuration for self-hosting — server blocks, reverse proxy setup, SSL/TLS, load balancing, caching, and rate limiting for your home server."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "foundations"
apps: []
tags: ["foundations", "nginx", "reverse-proxy", "web-server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Nginx?

Nginx (pronounced "engine-x") is a high-performance web server and reverse proxy. Understanding nginx configuration is essential for self-hosting because it powers several of the most popular reverse proxy tools — including [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/), which wraps nginx in a GUI. Even if you use a GUI tool day-to-day, you will eventually need to read or edit raw nginx config files when troubleshooting, tuning performance, or doing something the GUI does not support.

Be pragmatic here: for most self-hosters, [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/) or Caddy covers 90% of reverse proxy needs without touching config files. But when you need fine-grained control — custom headers, specific caching rules, rate limiting, load balancing across multiple containers — raw nginx config is the tool. This guide teaches you how to read it, write it, and debug it.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) — see [Getting Started](/foundations/getting-started/)
- [Docker and Docker Compose installed](/foundations/docker-compose-basics/) (for the Docker-based examples)
- Basic familiarity with the Linux command line
- A domain name pointed at your server (optional, but needed for SSL examples)
- Ports 80 and 443 open on your firewall and forwarded through your router — see [Ports Explained](/foundations/ports-explained/)

## Nginx Config File Structure

Nginx configuration is a hierarchy of nested blocks called **contexts**. Every directive belongs to a context, and contexts can contain other contexts. Here is the full structure from outermost to innermost:

```
main context
├── events { }
├── http {
│   ├── server {
│   │   ├── location / { }
│   │   ├── location /api { }
│   │   └── location /static { }
│   └── server {
│       └── location / { }
│   }
└── stream { }        # TCP/UDP proxying (less common)
```

### Main Context

Everything outside any block is the **main context**. It controls process-level settings:

```nginx
# Main context — process-level settings
worker_processes auto;          # Number of worker processes (auto = one per CPU core)
error_log /var/log/nginx/error.log warn;
pid /run/nginx.pid;
```

`worker_processes auto` is the right setting for almost every self-hosting server. It spawns one worker per CPU core. Do not hardcode a number unless you have a specific reason.

### Events Context

Controls connection handling:

```nginx
events {
    worker_connections 1024;    # Max simultaneous connections per worker
    multi_accept on;            # Accept multiple connections at once
}
```

For a home server with a handful of apps, the defaults are fine. Only tune `worker_connections` if you are serving hundreds of concurrent users.

### HTTP Context

The main block for web server configuration. Almost everything you care about goes here:

```nginx
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Include all site configs
    include /etc/nginx/conf.d/*.conf;
}
```

The `include /etc/nginx/conf.d/*.conf` line is important — it tells nginx to load every `.conf` file from that directory. This is where you put your per-site configurations instead of cramming everything into a single file.

### Server Blocks

A **server block** defines a virtual host — one website or application. You match incoming requests to a server block using `server_name` (the domain) and `listen` (the port):

```nginx
server {
    listen 80;
    server_name jellyfin.example.com;

    # All configuration for this domain goes here
}
```

Each domain or subdomain you host gets its own server block. Put each one in a separate file under `/etc/nginx/conf.d/` — for example, `/etc/nginx/conf.d/jellyfin.conf`.

### Location Blocks

**Location blocks** match specific URL paths within a server block:

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        # Matches all requests (fallback)
    }

    location /api {
        # Matches requests starting with /api
    }

    location = /health {
        # Exact match for /health only
    }

    location ~* \.(jpg|png|gif|ico)$ {
        # Regex match for image files (case-insensitive)
    }
}
```

Location matching priority (highest to lowest):

1. `= /path` — exact match
2. `^~ /path` — prefix match, stops searching
3. `~ /path` — case-sensitive regex
4. `~* /path` — case-insensitive regex
5. `/path` — regular prefix match

When multiple locations could match, nginx picks the most specific one following this priority. In practice, you rarely need regex locations for self-hosting — prefix matches and exact matches cover most cases.

## Essential Directives

These are the directives you will use in nearly every nginx config for self-hosted apps.

### `listen`

Specifies the port and optional protocol:

```nginx
listen 80;                  # HTTP on port 80, IPv4
listen [::]:80;             # HTTP on port 80, IPv6
listen 443 ssl;             # HTTPS on port 443
listen 443 ssl http2;       # HTTPS with HTTP/2
```

Always include both IPv4 and IPv6 listeners unless you have explicitly disabled IPv6.

### `server_name`

Matches the `Host` header of incoming requests:

```nginx
server_name jellyfin.example.com;              # Single domain
server_name example.com www.example.com;       # Multiple domains
server_name *.example.com;                     # Wildcard subdomain
```

### `proxy_pass`

Forwards requests to a backend server. This is the core of reverse proxying:

```nginx
location / {
    proxy_pass http://127.0.0.1:8096;
}
```

### `root` and `index`

For serving static files:

```nginx
root /var/www/html;
index index.html index.htm;
```

### `try_files`

Attempts to serve files in order, falling back to the last argument:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

This is the standard config for single-page applications — try the exact file, then a directory, then fall back to `index.html`.

## Setting Up a Basic Web Server

Here is a complete, working nginx configuration that serves a static site. This is useful for hosting documentation, a landing page, or any static site generator output (Hugo, Astro, etc.).

Create `/etc/nginx/conf.d/static-site.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name docs.example.com;

    root /var/www/docs;
    index index.html;

    # Serve static files directly
    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets for 30 days
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Custom error pages (optional)
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

To run this with Docker, use the official nginx image:

```yaml
services:
  nginx:
    image: nginx:1.27.4-alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./conf.d:/etc/nginx/conf.d:ro    # Your site configs
      - ./html:/var/www/docs:ro           # Your static files
      - ./logs:/var/log/nginx             # Log files
```

Start it:

```bash
docker compose up -d
```

Test the config before reloading (always do this — a syntax error takes down all sites):

```bash
docker compose exec nginx nginx -t
```

Reload after changes:

```bash
docker compose exec nginx nginx -s reload
```

## Reverse Proxy Configuration

This is the primary use case for nginx in self-hosting — sitting in front of your apps and forwarding traffic to them. For a broader overview of reverse proxy concepts, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained/).

Here is a complete reverse proxy configuration for a self-hosted app like Jellyfin:

Create `/etc/nginx/conf.d/jellyfin.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jellyfin.example.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name jellyfin.example.com;

    # SSL certificates (see the SSL section below)
    ssl_certificate /etc/letsencrypt/live/jellyfin.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jellyfin.example.com/privkey.pem;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:8096;

        # Pass the real client IP to the backend
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (required by many self-hosted apps)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Timeouts — increase for slow backends or large uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Buffering — disable for streaming apps like Jellyfin
        proxy_buffering off;
    }

    # Increase max upload size (default is 1MB — too small for most apps)
    client_max_body_size 100M;
}
```

Key details that matter:

- **`proxy_set_header` directives** — without these, your app sees every request as coming from nginx (127.0.0.1) instead of the real client. Most apps need the real IP for logging, rate limiting, and security.
- **WebSocket headers** — apps like Jellyfin, Nextcloud, Home Assistant, and most chat apps use WebSockets. Without the `Upgrade` and `Connection` headers, WebSocket connections fail silently.
- **`client_max_body_size`** — nginx defaults to a 1MB upload limit. Photo management apps (Immich, PhotoPrism), file sync (Nextcloud, Seafile), and document managers (Paperless-ngx) all need this increased. Set it to match your largest expected upload.
- **`proxy_buffering off`** — important for streaming apps. With buffering on, nginx tries to store the entire response before forwarding it, which breaks video streaming and real-time feeds.

### Proxying to Docker Containers

If nginx runs on the host and your apps run in Docker, proxy to `127.0.0.1` and the mapped port. If nginx itself runs in Docker on the same network as your apps, proxy to the container name:

```nginx
# Nginx on host, app in Docker with ports: "8096:8096"
proxy_pass http://127.0.0.1:8096;

# Both in Docker, same network
proxy_pass http://jellyfin:8096;
```

When both are in Docker, put them on the same Docker network. See [Docker Compose Basics](/foundations/docker-compose-basics/) for how Docker networking works across Compose files.

## SSL/TLS Configuration

For a full explanation of SSL certificates, see [SSL Certificates](/foundations/ssl-certificates/). For automated certificate management with Let's Encrypt, see [Let's Encrypt Explained](/foundations/lets-encrypt-explained/).

Here is a solid SSL configuration block. Create a shared snippet at `/etc/nginx/conf.d/ssl-params.conf` and include it in every server block that uses HTTPS:

```nginx
# /etc/nginx/conf.d/ssl-params.conf
# Shared SSL settings — include this in your HTTPS server blocks

# TLS versions — only 1.2 and 1.3 (1.0 and 1.1 are insecure)
ssl_protocols TLSv1.2 TLSv1.3;

# Cipher suites — prefer server's order
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

# SSL session caching — reduces handshake overhead
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP stapling — faster certificate verification for clients
ssl_stapling on;
ssl_stapling_verify on;
resolver 1.1.1.1 8.8.8.8 valid=300s;
resolver_timeout 5s;

# HSTS — tell browsers to always use HTTPS (enable only after confirming SSL works)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
```

Use it in a server block:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    include /etc/nginx/conf.d/ssl-params.conf;

    location / {
        proxy_pass http://app-backend:8080;
        # ... proxy headers ...
    }
}
```

This configuration scores an A+ on SSL Labs. The critical choices: TLS 1.2+ only (no legacy protocols), strong cipher suites, HSTS enabled, and OCSP stapling for performance.

**One warning about HSTS:** once you enable `Strict-Transport-Security`, browsers will refuse to connect over HTTP for the duration of `max-age` (2 years in this config). Only enable it after you have confirmed SSL is working correctly.

## Load Balancing

Nginx can distribute traffic across multiple instances of the same app. This is useful when you run multiple containers for a heavy service, or when you have multiple backend servers.

```nginx
upstream nextcloud_backends {
    # Round-robin by default
    server 10.0.0.10:8080 weight=3;    # Gets 3x the traffic
    server 10.0.0.11:8080;
    server 10.0.0.12:8080 backup;       # Only used when others are down

    # Session persistence — same client always hits the same backend
    ip_hash;

    # Health checks — mark a server as down after 3 failures
    # (each server directive inherits these defaults)
}

server {
    listen 443 ssl http2;
    server_name nextcloud.example.com;

    ssl_certificate /etc/letsencrypt/live/nextcloud.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/nextcloud.example.com/privkey.pem;
    include /etc/nginx/conf.d/ssl-params.conf;

    location / {
        proxy_pass http://nextcloud_backends;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Load balancing strategies:

| Strategy | Directive | Behavior |
|----------|-----------|----------|
| Round-robin | (default) | Distributes evenly in order |
| Weighted | `weight=N` | Sends more traffic to higher-weighted servers |
| IP hash | `ip_hash` | Same client IP always hits the same backend |
| Least connections | `least_conn` | Sends to the backend with fewest active connections |

For most self-hosters, load balancing is overkill. It becomes relevant if you scale a service across multiple machines or run multiple replicas of a stateless app.

## Caching

Nginx can cache responses from your backends, reducing load on your apps and speeding up repeat requests. This is particularly useful for apps that serve static assets or have pages that do not change frequently.

```nginx
# Define the cache zone in the http context (not inside a server block)
# In /etc/nginx/nginx.conf or a separate included file:
proxy_cache_path /var/cache/nginx/app_cache
    levels=1:2
    keys_zone=app_cache:10m       # 10MB of memory for cache keys
    max_size=1g                    # 1GB of disk space for cached responses
    inactive=60m                   # Remove items not accessed in 60 minutes
    use_temp_path=off;

# In your server block:
server {
    listen 443 ssl http2;
    server_name wiki.example.com;

    ssl_certificate /etc/letsencrypt/live/wiki.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/wiki.example.com/privkey.pem;
    include /etc/nginx/conf.d/ssl-params.conf;

    location / {
        proxy_pass http://wikijs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Enable caching
        proxy_cache app_cache;
        proxy_cache_valid 200 30m;        # Cache 200 responses for 30 minutes
        proxy_cache_valid 404 1m;         # Cache 404 responses for 1 minute
        proxy_cache_use_stale error timeout updating;  # Serve stale content if backend is down
        add_header X-Cache-Status $upstream_cache_status;  # Debug header
    }

    # Never cache authenticated or dynamic API endpoints
    location /api {
        proxy_pass http://wikijs:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache off;
    }
}
```

The `X-Cache-Status` header is a debugging tool. It returns `HIT`, `MISS`, `BYPASS`, or `EXPIRED` so you can verify caching is working. Check it with:

```bash
curl -I https://wiki.example.com/
```

**When to cache:** static content, public pages, read-heavy apps like wikis and documentation sites. **When not to cache:** authenticated sessions, APIs, real-time apps, anything where stale data causes problems.

## Rate Limiting

Rate limiting protects your apps from abuse, brute-force attacks, and accidental traffic spikes. Nginx handles this efficiently at the connection level before requests even reach your backend.

```nginx
# Define rate limit zones in the http context
# 10 requests per second per IP, with a 10MB zone for tracking
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

# Stricter limit for login endpoints — 2 requests per second
limit_req_zone $binary_remote_addr zone=login:10m rate=2r/s;

server {
    listen 443 ssl http2;
    server_name app.example.com;

    ssl_certificate /etc/letsencrypt/live/app.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;
    include /etc/nginx/conf.d/ssl-params.conf;

    # General rate limit — allows short bursts of 20 requests
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://app-backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Strict rate limit on login — prevents brute force
    location /login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://app-backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The `burst` parameter allows short spikes above the rate limit. Without `nodelay`, burst requests are queued and delayed; with `nodelay`, they are served immediately but count against the limit. For most self-hosted apps, `burst=20 nodelay` is a good starting point.

Rate-limited requests receive a `503 Service Temporarily Unavailable` response by default. You can customize this:

```nginx
limit_req_status 429;   # Return 429 Too Many Requests instead
```

## Common Mistakes

### Forgetting to Test Before Reloading

Always run `nginx -t` before reloading. A syntax error in any config file takes down every site nginx serves, not just the one you edited:

```bash
nginx -t && nginx -s reload
```

Or in Docker:

```bash
docker compose exec nginx nginx -t && docker compose exec nginx nginx -s reload
```

### Missing WebSocket Headers

Apps like Home Assistant, Grafana, Nextcloud, and most chat apps use WebSockets. Without these headers in your proxy config, WebSocket connections fail and you get partial functionality — pages load but real-time updates, notifications, or chat do not work:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

Include these in every reverse proxy location block. There is no downside to including them even when the app does not use WebSockets.

### Leaving `client_max_body_size` at Default

Nginx defaults to a 1MB request body limit. Photo uploads, file sync, document imports — they all fail silently or with a cryptic `413 Request Entity Too Large` error. Set it in every server block that proxies to an app handling file uploads:

```nginx
client_max_body_size 100M;   # Adjust to your needs — up to 0 for unlimited
```

### Wrong `proxy_pass` Trailing Slash

These two are not the same:

```nginx
# Request to /app/page -> proxied to http://backend:8080/app/page
location /app/ {
    proxy_pass http://backend:8080;
}

# Request to /app/page -> proxied to http://backend:8080/page (path stripped)
location /app/ {
    proxy_pass http://backend:8080/;
}
```

The trailing slash on `proxy_pass` strips the matching location prefix. This is a common source of broken sub-path deployments. When in doubt, omit the trailing slash.

### Not Sending Real Client IP

Without `proxy_set_header X-Real-IP` and `X-Forwarded-For`, your backend apps see every request as coming from nginx's IP address. This breaks rate limiting inside the app, screws up analytics, and makes security logs useless.

### Editing `nginx.conf` Directly

Put site-specific configs in `/etc/nginx/conf.d/` as separate `.conf` files. Editing `nginx.conf` directly makes upgrades messy and increases the risk of breaking the entire server with one typo.

## Next Steps

- Set up [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup/) if you want a GUI on top of nginx
- Learn about [SSL certificates](/foundations/ssl-certificates/) and [Let's Encrypt](/foundations/lets-encrypt-explained/) for automated HTTPS
- Understand [reverse proxy concepts](/foundations/reverse-proxy-explained/) to choose between nginx, Caddy, and Traefik
- Review [Docker Compose basics](/foundations/docker-compose-basics/) for running nginx and your apps in containers
- Read about [port forwarding](/foundations/ports-explained/) if you are exposing services from a home network

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Ports Explained](/foundations/ports-explained/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Let's Encrypt Explained](/foundations/lets-encrypt-explained/)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup/)
- [Docker Networking](/foundations/docker-networking/)

## FAQ

### Do I need raw nginx config if I use Nginx Proxy Manager?

Not for routine setups. Nginx Proxy Manager handles SSL, proxy hosts, and redirects through its web UI. But NPM does support "Advanced" and "Custom Location" fields where you can inject raw nginx directives. You need raw config knowledge when those fields are the only way to add custom headers, caching rules, or rate limiting that the GUI does not expose.

### Should I use nginx or Caddy for self-hosting?

Caddy is simpler — automatic HTTPS with zero configuration, a two-line reverse proxy setup, and a clean config format. Choose Caddy if you want minimal configuration overhead. Choose raw nginx when you need advanced features like detailed caching, complex load balancing, rate limiting, or when your apps specifically document nginx configs (many do). For GUI users, Nginx Proxy Manager combines nginx's power with Caddy-level ease of use.

### How do I debug "502 Bad Gateway" errors?

A 502 means nginx reached the backend but got an invalid response (or no response). Check in this order: (1) Is the backend container running? (`docker compose ps`). (2) Is the `proxy_pass` address correct? (3) Is the backend on the same Docker network as nginx? (4) Is the backend listening on the port you specified? Check nginx error logs at `/var/log/nginx/error.log` for the exact upstream error.

### Can I use nginx for both static files and reverse proxying?

Yes, and this is common. Use different `location` blocks — serve static files directly from disk with `root` and `try_files`, and proxy dynamic requests to your app backend with `proxy_pass`. Nginx handles static files more efficiently than most application servers, so this pattern reduces load on your apps.

### How often should I reload nginx after config changes?

Every time you change a config file. But always test first with `nginx -t`. Reloads are graceful — nginx starts new workers with the new config and lets existing connections finish on old workers. There is zero downtime. The mistake is not reloading too often; it is forgetting to test before reloading.
