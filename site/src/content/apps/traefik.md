---
title: "How to Self-Host Traefik with Docker"
description: "Step-by-step guide to deploying Traefik v3 with Docker Compose for automatic HTTPS via Let's Encrypt, Docker label-based routing, and middleware setup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "reverse-proxy"
apps:
  - traefik
tags:
  - docker
  - reverse-proxy
  - traefik
  - ssl
  - lets-encrypt
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Traefik?

[Traefik](https://traefik.io/traefik/) is a cloud-native reverse proxy and load balancer that integrates directly with Docker. It discovers services automatically via Docker labels, provisions Let's Encrypt SSL certificates without manual intervention, and routes traffic based on rules you define alongside your containers. If you want config-as-code reverse proxying that reacts to container changes in real time, Traefik is the tool.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM minimum
- Ports 80 and 443 available (not used by another web server)
- A domain name with DNS A records pointing to your server's public IP
- An email address for Let's Encrypt registration

## Docker Compose Configuration

Create a directory for Traefik:

```bash
mkdir -p ~/traefik && cd ~/traefik
```

Create a `docker-compose.yml` file:

```yaml
services:
  traefik:
    image: traefik:v3.6.8
    container_name: traefik
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    ports:
      - "80:80"
      - "443:443"
    volumes:
      # Docker socket — allows Traefik to discover containers
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # Certificate storage
      - traefik-certs:/letsencrypt
      # Dynamic configuration (optional, for file-based config)
      - ./dynamic:/etc/traefik/dynamic:ro
    environment:
      TZ: "America/New_York"
    command:
      # API and Dashboard
      - --api.dashboard=true
      # Entrypoints
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      # HTTP -> HTTPS redirect on the web entrypoint
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      # Let's Encrypt ACME configuration
      - --certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.tlschallenge=true
      # Docker provider
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --providers.docker.network=traefik-public
      # File provider for dynamic config
      - --providers.file.directory=/etc/traefik/dynamic
      - --providers.file.watch=true
      # Logging
      - --log.level=WARN
      - --accesslog=true
      - --accesslog.filters.statuscodes=400-599
    networks:
      - traefik-public
    labels:
      # Dashboard routing — accessible at traefik.yourdomain.com
      - traefik.enable=true
      - traefik.http.routers.dashboard.rule=Host(`${TRAEFIK_DASHBOARD_HOST}`)
      - traefik.http.routers.dashboard.entrypoints=websecure
      - traefik.http.routers.dashboard.tls.certresolver=letsencrypt
      - traefik.http.routers.dashboard.service=api@internal
      # Basic auth middleware for the dashboard
      - traefik.http.routers.dashboard.middlewares=dashboard-auth
      - traefik.http.middlewares.dashboard-auth.basicauth.users=${DASHBOARD_AUTH}
    healthcheck:
      test: ["CMD", "traefik", "healthcheck"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

networks:
  traefik-public:
    name: traefik-public

volumes:
  traefik-certs:
```

Create a `.env` file alongside the Compose file:

```bash
# Email for Let's Encrypt certificate registration
ACME_EMAIL=you@example.com

# Domain for the Traefik dashboard (must have a DNS A record)
TRAEFIK_DASHBOARD_HOST=traefik.yourdomain.com

# Basic auth credentials for the dashboard
# Generate with: echo $(htpasswd -nB admin) | sed -e 's/\$/\$\$/g'
# The double dollar signs ($$) are required to escape in Docker Compose
DASHBOARD_AUTH=admin:$$2y$$05$$your-bcrypt-hash-here
```

Generate the dashboard password:

```bash
# Install htpasswd if needed
sudo apt install apache2-utils -y

# Generate the bcrypt hash — replace YOUR_PASSWORD
echo $(htpasswd -nB admin) | sed -e 's/\$/\$\$/g'
```

Copy the output into `DASHBOARD_AUTH` in your `.env` file.

Create the dynamic configuration directory:

```bash
mkdir -p ~/traefik/dynamic
```

Start Traefik:

```bash
docker compose up -d
```

### Connecting Other Services to Traefik

Any service you want Traefik to proxy must join the `traefik-public` network and have the right labels. Here is an example proxying a Whoami test container:

```yaml
services:
  whoami:
    image: traefik/whoami:v1.10
    container_name: whoami
    restart: unless-stopped
    networks:
      - traefik-public
    labels:
      - traefik.enable=true
      - traefik.http.routers.whoami.rule=Host(`whoami.yourdomain.com`)
      - traefik.http.routers.whoami.entrypoints=websecure
      - traefik.http.routers.whoami.tls.certresolver=letsencrypt

networks:
  traefik-public:
    external: true
```

The pattern is the same for every service: add labels, join `traefik-public`, and Traefik handles the rest.

## Initial Setup

1. Verify Traefik started cleanly:
   ```bash
   docker compose logs traefik
   ```
   Look for `Configuration loaded from flags` and no ACME errors.

2. Open `https://traefik.yourdomain.com` in your browser. Enter the basic auth credentials you generated. You should see the Traefik dashboard showing entrypoints, routers, services, and middlewares.

3. If you deployed the Whoami test container, visit `https://whoami.yourdomain.com` to confirm routing and HTTPS work end-to-end.

4. Check certificate provisioning in the logs:
   ```bash
   docker compose logs traefik | grep -i acme
   ```
   You should see successful certificate requests for each configured domain.

## Configuration

Traefik has two configuration layers:

### Static Configuration

Static configuration defines Traefik's startup behavior — entrypoints, providers, certificate resolvers, and logging. It is set once and requires a container restart to change. In the Docker Compose setup above, static configuration is passed as CLI flags in the `command` section. Alternatively, you can use a `traefik.yml` file:

```yaml
# traefik.yml — equivalent to the CLI flags above
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

certificatesResolvers:
  letsencrypt:
    acme:
      email: you@example.com
      storage: /letsencrypt/acme.json
      tlsChallenge: {}

providers:
  docker:
    exposedByDefault: false
    network: traefik-public
  file:
    directory: /etc/traefik/dynamic
    watch: true

log:
  level: WARN

accessLog:
  filters:
    statusCodes:
      - "400-599"
```

Mount it as a volume and remove the `command` block:

```yaml
volumes:
  - ./traefik.yml:/etc/traefik/traefik.yml:ro
```

### Dynamic Configuration

Dynamic configuration defines routers, services, and middlewares. It changes without restarting Traefik. Two sources:

1. **Docker labels** — the primary method. Define routing rules as labels on each container (shown in the examples above).
2. **File provider** — for services not running in Docker, or for shared middleware definitions. Place YAML files in the `dynamic/` directory.

Example dynamic file for an external service (`dynamic/external.yml`):

```yaml
http:
  routers:
    nas-router:
      rule: "Host(`nas.yourdomain.com`)"
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt
      service: nas-service

  services:
    nas-service:
      loadBalancer:
        servers:
          - url: "http://192.168.1.100:5000"
```

### Key Configuration Options

| Option | What It Controls |
|--------|-----------------|
| `exposedByDefault: false` | Containers are only proxied when they have `traefik.enable=true`. Always keep this off. |
| `entrypoints.websecure.address` | The HTTPS listening port. Default `:443`. |
| `certificatesResolvers.*.acme.tlsChallenge` | Uses TLS-ALPN-01 challenge on port 443. No port 80 needed if you only use this. |
| `certificatesResolvers.*.acme.httpChallenge.entryPoint` | Uses HTTP-01 challenge. Set to `web` to use port 80. |
| `log.level` | `DEBUG`, `INFO`, `WARN`, `ERROR`. Use `DEBUG` only when troubleshooting — it is very verbose. |
| `accessLog` | Logs every request. Filter by status code to reduce noise. |

### ACME Challenge Types

| Challenge | Ports Needed | Wildcard Support | Best For |
|-----------|-------------|-----------------|----------|
| TLS-ALPN-01 | 443 | No | Standard setups where 443 is reachable |
| HTTP-01 | 80 | No | Setups where only 80 is open |
| DNS-01 | None | Yes | Wildcard certs, servers behind NAT/firewall |

For DNS-01 challenges (required for wildcard certificates), add your DNS provider credentials. Example with Cloudflare:

```yaml
environment:
  CF_API_EMAIL: you@example.com
  CF_DNS_API_TOKEN: your-cloudflare-api-token
command:
  - --certificatesresolvers.letsencrypt.acme.dnschallenge=true
  - --certificatesresolvers.letsencrypt.acme.dnschallenge.provider=cloudflare
```

Traefik supports dozens of DNS providers. Check the [Traefik ACME documentation](https://doc.traefik.io/traefik/https/acme/#providers) for the full list.

Certificates auto-renew 30 days before expiry. No cron jobs or manual intervention needed.

## Advanced Configuration

### Middleware

Middlewares modify requests before they reach your service. Define them as labels or in dynamic config files.

**Rate limiting:**

```yaml
labels:
  - traefik.http.middlewares.ratelimit.ratelimit.average=100
  - traefik.http.middlewares.ratelimit.ratelimit.burst=50
  - traefik.http.middlewares.ratelimit.ratelimit.period=1m
  - traefik.http.routers.myapp.middlewares=ratelimit
```

**Security headers:**

Create `dynamic/security-headers.yml`:

```yaml
http:
  middlewares:
    security-headers:
      headers:
        browserXssFilter: true
        contentTypeNosniff: true
        frameDeny: true
        stsIncludeSubdomains: true
        stsPreload: true
        stsSeconds: 31536000
        customFrameOptionsValue: "SAMEORIGIN"
        referrerPolicy: "strict-origin-when-cross-origin"
```

Apply to any service via labels:

```yaml
labels:
  - traefik.http.routers.myapp.middlewares=security-headers@file
```

**IP allowlist:**

```yaml
labels:
  - traefik.http.middlewares.local-only.ipallowlist.sourcerange=192.168.1.0/24,10.0.0.0/8
  - traefik.http.routers.myapp.middlewares=local-only
```

**Compress responses:**

```yaml
labels:
  - traefik.http.middlewares.compress.compress=true
  - traefik.http.routers.myapp.middlewares=compress
```

### Chaining Middleware

Apply multiple middlewares in order:

```yaml
labels:
  - traefik.http.routers.myapp.middlewares=security-headers@file,ratelimit,compress
```

### Metrics with Prometheus

Add to your static configuration:

```yaml
command:
  - --metrics.prometheus=true
  - --metrics.prometheus.entrypoint=websecure
```

Scrape metrics at `http://traefik:8080/metrics` from your Prometheus instance. Useful for monitoring request rates, error rates, and certificate expiry.

### Custom Error Pages

```yaml
http:
  middlewares:
    error-handler:
      errors:
        status:
          - "500-599"
        service: error-pages
        query: "/{status}.html"

  services:
    error-pages:
      loadBalancer:
        servers:
          - url: "http://error-pages:8080"
```

## Backup

Back up these items:

1. **`acme.json`** — your Let's Encrypt certificates and account key. Stored in the `traefik-certs` volume. Losing this means re-requesting all certificates (subject to Let's Encrypt rate limits of 50 per week per domain).

2. **`docker-compose.yml` and `.env`** — your static configuration.

3. **`dynamic/` directory** — your dynamic configuration files.

4. **Docker labels** — these live in each service's Compose file, not in Traefik's directory. Back up your entire Compose project directories.

Backup script:

```bash
#!/bin/bash
BACKUP_DIR="$HOME/backups/traefik-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Back up Traefik config files
cp ~/traefik/docker-compose.yml "$BACKUP_DIR/"
cp ~/traefik/.env "$BACKUP_DIR/"
cp -r ~/traefik/dynamic "$BACKUP_DIR/"

# Back up the certificate volume
docker run --rm \
  -v traefik-certs:/source:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar czf /backup/traefik-certs.tar.gz -C /source .

echo "Backup saved to $BACKUP_DIR"
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Certificate request fails with "ACME challenge failed"

**Symptom:** Logs show `unable to obtain ACME certificate` or `acme: error: 403`

**Fix:** For TLS-ALPN-01 challenges, port 443 must be reachable from the internet. For HTTP-01, port 80 must be reachable. Verify with:

```bash
# Check from outside your network
curl -I http://yourdomain.com
```

If behind a firewall or NAT, forward ports 80 and 443 to your server. If ports are blocked by your ISP, switch to DNS-01 challenge.

### 404 Not Found for a service that is running

**Symptom:** Visiting the domain returns a Traefik 404 page.

**Fix:** The router rule is not matching. Check these in order:

1. The container has `traefik.enable=true` label
2. The `Host()` rule matches exactly what you typed in the browser (case-sensitive)
3. The container is on the `traefik-public` network
4. The container is running: `docker ps | grep myapp`

Verify with the dashboard — the router should appear under HTTP > Routers.

### 502 Bad Gateway

**Symptom:** Traefik routes the request but the backend returns 502.

**Fix:** Traefik cannot reach the service. Common causes:

1. **Wrong port:** Traefik auto-detects the exposed port. If the container exposes multiple ports, specify with:
   ```yaml
   labels:
     - traefik.http.services.myapp.loadbalancer.server.port=8080
   ```
2. **Wrong network:** The service and Traefik must share the `traefik-public` network.
3. **Service not ready:** The container started but the application inside is still initializing. Add a healthcheck to the service container.

### Dashboard shows routers but no services

**Symptom:** The Traefik dashboard shows routers in error state with "no service found."

**Fix:** If the container exposes no ports in its Dockerfile, Traefik cannot auto-detect the port. Explicitly set it:

```yaml
labels:
  - traefik.http.services.myapp.loadbalancer.server.port=3000
```

### Let's Encrypt rate limit exceeded

**Symptom:** Certificate requests fail with `too many certificates already issued for exact set of domains` or `rateLimited`.

**Fix:** Let's Encrypt limits you to 50 certificates per registered domain per week. If you hit this during testing, use the staging ACME server:

```yaml
command:
  - --certificatesresolvers.letsencrypt.acme.caserver=https://acme-staging-v02.api.letsencrypt.org/directory
```

Switch back to production (remove the `caserver` flag) once your configuration is correct. Staging certificates are not trusted by browsers but are not rate-limited.

For more detailed troubleshooting, see:
- [Traefik: Docker Containers Not Detected — Fix](/troubleshooting/traefik/container-not-detected)
- [Traefik: Dashboard Not Loading — Fix](/troubleshooting/traefik/dashboard-not-loading)
- [Traefik: SSL Certificate Not Generating — Fix](/troubleshooting/traefik/ssl-certificate-not-generating)

## Resource Requirements

- **RAM:** ~30 MB idle, ~80 MB under moderate load (50+ routes)
- **CPU:** Minimal — Traefik is written in Go and handles thousands of requests per second on a single core
- **Disk:** <50 MB for the binary; `acme.json` grows ~2 KB per certificate

## Verdict

Traefik is the best reverse proxy for Docker-native self-hosting setups. Its automatic service discovery via Docker labels means you never touch a proxy config file when adding a new service — just add labels to the container and Traefik picks it up. This is a fundamentally different workflow from [Nginx Proxy Manager](/apps/nginx-proxy-manager), which requires clicking through a web UI for each new service, and from [Caddy](/apps/caddy), which requires editing a Caddyfile.

The trade-off is initial setup complexity. Traefik's learning curve is steeper than NPM's. The label syntax is verbose, and the v2-to-v3 migration broke many existing guides. But once configured, Traefik is hands-off in a way no other reverse proxy matches. Add a container with the right labels, and it is live with HTTPS in seconds.

**Choose Traefik if:** You manage 5+ services, prefer infrastructure-as-code, want zero-touch HTTPS provisioning, or plan to scale. **Choose [Nginx Proxy Manager](/apps/nginx-proxy-manager) if:** You want a web UI and simpler initial setup. **Choose [Caddy](/apps/caddy) if:** You want a single-file config with automatic HTTPS but without Docker label complexity.

For most self-hosters running a serious Docker stack, Traefik is the right answer.

## Frequently Asked Questions

### Is Traefik free?

Yes. Traefik Proxy (the open-source version) is free under the MIT license. Traefik Enterprise and Traefik Hub are paid products from the same company, but you do not need them for self-hosting. The open-source version has full reverse proxy, load balancing, HTTPS, and middleware support.

### Can Traefik run on a Raspberry Pi?

Yes. Traefik publishes official ARM64 Docker images. It runs well on a Raspberry Pi 4 with 2+ GB RAM. Resource usage is lower than NPM since Traefik is a single Go binary with no database dependency.

### How do I update Traefik?

Change the image tag in `docker-compose.yml` to the new version, then:

```bash
docker compose pull
docker compose up -d
```

Your certificates, configuration, and routes are preserved. Traefik v3.x releases are backward-compatible within the major version. Check the [changelog](https://github.com/traefik/traefik/releases) for any breaking changes before updating.

### Does Traefik support TCP and UDP routing?

Yes. Traefik can proxy TCP and UDP traffic in addition to HTTP. Define TCP/UDP entrypoints and routers:

```yaml
command:
  - --entrypoints.ssh.address=:2222/tcp
labels:
  - traefik.tcp.routers.ssh.rule=HostSNI(`*`)
  - traefik.tcp.routers.ssh.entrypoints=ssh
  - traefik.tcp.services.ssh.loadbalancer.server.port=22
```

### Is the Docker socket mount a security risk?

Yes. Mounting `/var/run/docker.sock` gives Traefik (and anyone who compromises it) full control over your Docker daemon. Mitigate this by:

1. Mounting it read-only (`:ro`) as shown in the config above
2. Using `security_opt: no-new-privileges:true`
3. Running a Docker socket proxy like [Tecnativa/docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) that exposes only the API endpoints Traefik needs

## Related

- [How to Self-Host Nginx Proxy Manager](/apps/nginx-proxy-manager)
- [How to Self-Host Caddy](/apps/caddy)
- [Best Self-Hosted Reverse Proxy](/best/reverse-proxy)
- [NPM vs Traefik](/compare/nginx-proxy-manager-vs-traefik)
- [Traefik vs Caddy](/compare/traefik-vs-caddy)
- [Traefik vs Cosmos Cloud](/compare/traefik-vs-cosmos-cloud)
- [Traefik vs Nginx](/compare/traefik-vs-nginx)
- [Traefik vs Zoraxy](/compare/traefik-vs-zoraxy)
- [Envoy vs Traefik](/compare/envoy-vs-traefik)
- [Traefik: Docker Containers Not Detected — Fix](/troubleshooting/traefik/container-not-detected)
- [Traefik: Dashboard Not Loading — Fix](/troubleshooting/traefik/dashboard-not-loading)
- [Traefik: SSL Certificate Not Generating — Fix](/troubleshooting/traefik/ssl-certificate-not-generating)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Networking](/foundations/docker-networking)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
- [Replace Managed Hosting](/replace/managed-hosting)
