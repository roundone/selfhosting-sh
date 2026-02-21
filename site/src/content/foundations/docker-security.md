---
title: "Docker Security Best Practices"
description: "Secure your Docker containers and self-hosted services — run as non-root, limit capabilities, manage secrets, and harden your Docker daemon."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "foundations"
apps: []
tags: ["docker", "security", "hardening", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Docker Security Matters

Docker isn't automatically secure. Containers share the host kernel, and a misconfigured container can compromise your entire server. Default Docker setups run containers as root, expose the Docker socket (which grants full host access), and bypass firewall rules.

For self-hosting, security matters because your server faces the internet. A compromised Nextcloud container could give an attacker access to your photos, files, and every other service on the machine.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- Basic Linux security knowledge ([Firewall Setup](/foundations/firewall-ufw/), [SSH Setup](/foundations/ssh-setup/))

## Run Containers as Non-Root

By default, container processes run as root (UID 0). If an attacker escapes the container, they're root on the host.

### Use the user Directive

```yaml
services:
  myapp:
    image: myapp:v1.0
    user: "1000:1000"
    volumes:
      - app-data:/data
    restart: unless-stopped
```

### Use PUID/PGID (LinuxServer.io Images)

```yaml
services:
  myapp:
    image: lscr.io/linuxserver/someapp:latest
    environment:
      - PUID=1000
      - PGID=1000
    restart: unless-stopped
```

### Check What User a Container Runs As

```bash
docker exec mycontainer id
# uid=0(root) ← bad
# uid=1000(appuser) ← good
```

**Note:** Not all containers support running as non-root. Some need root for initial setup or binding to privileged ports. Check the app's documentation.

## Never Expose the Docker Socket

The Docker socket (`/var/run/docker.sock`) gives unrestricted access to the Docker daemon. Mounting it into a container is equivalent to giving that container root access to the host.

```yaml
# DANGEROUS — avoid unless absolutely necessary
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Services that need the socket:** Portainer, Watchtower (deprecated), Traefik (for auto-discovery). These are management tools that inherently need Docker access.

**Mitigations when you must use it:**
1. Use a Docker socket proxy that restricts API access:

```yaml
services:
  socket-proxy:
    image: tecnativa/docker-socket-proxy:0.2.0
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - CONTAINERS=1
      - SERVICES=0
      - TASKS=0
      - NETWORKS=0
      - VOLUMES=0
      - IMAGES=0
      - EXEC=0
    restart: unless-stopped

  traefik:
    image: traefik:v3.2
    depends_on:
      - socket-proxy
    environment:
      - DOCKER_HOST=tcp://socket-proxy:2375
    # No docker.sock mount needed
    restart: unless-stopped
```

2. Mount read-only when possible: `/var/run/docker.sock:/var/run/docker.sock:ro`

## Drop Unnecessary Capabilities

Linux capabilities give processes specific root powers. Docker grants several by default. Drop them:

```yaml
services:
  myapp:
    image: myapp:v1.0
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE  # Only if binding to ports <1024
    restart: unless-stopped
```

Common capabilities and when they're needed:

| Capability | What It Allows | Needed By |
|-----------|---------------|-----------|
| `NET_BIND_SERVICE` | Bind to ports below 1024 | Web servers on port 80/443 |
| `NET_ADMIN` | Network configuration | VPN containers, Pi-hole |
| `SYS_ADMIN` | Broad admin powers | Almost never — avoid |
| `CHOWN` | Change file ownership | Some apps during startup |
| `SETUID/SETGID` | Change process UID/GID | Apps that need to drop privileges |

**Rule:** Start with `cap_drop: ALL`, then add back only what the container needs. If the container crashes, check its docs for required capabilities.

## Use Read-Only Filesystems

Prevent containers from writing outside their designated volumes:

```yaml
services:
  myapp:
    image: myapp:v1.0
    read_only: true
    tmpfs:
      - /tmp
      - /run
    volumes:
      - app-data:/data  # Only this directory is writable
    restart: unless-stopped
```

Not all containers work with read-only filesystems (many write to `/tmp` or create pid files), but `tmpfs` mounts handle most cases.

## Network Security

### Bind Ports to Localhost

Services behind a reverse proxy shouldn't be accessible directly:

```yaml
ports:
  - "127.0.0.1:8080:8080"  # Only accessible from the host
```

### Don't Expose Database Ports

Databases should only be reachable by other containers on the same Docker network:

```yaml
services:
  app:
    image: myapp:v1.0
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16.2
    # No ports section — only accessible via Docker network
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped
```

### Create Isolated Networks

Don't put all containers on the default network. Create separate networks per stack:

```yaml
services:
  app:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend  # Not on frontend — can't be reached from the internet-facing proxy

  proxy:
    networks:
      - frontend

networks:
  frontend:
  backend:
```

### Docker Bypasses UFW

Docker manipulates iptables directly, bypassing UFW rules. A container with `ports: "8080:8080"` is accessible from the internet even if UFW blocks port 8080.

**Solutions:**
1. Bind to localhost: `127.0.0.1:8080:8080` (recommended)
2. Don't expose ports at all — use Docker networks and a reverse proxy
3. Configure Docker to respect iptables rules by adding to `/etc/docker/daemon.json`:

```json
{
  "iptables": false
}
```

**Warning:** Setting `iptables: false` breaks container-to-internet connectivity. You'll need to add manual iptables rules. Only use this if you understand iptables.

## Manage Secrets Properly

### Don't Hardcode Secrets

```yaml
# Bad — secrets visible in docker-compose.yml
environment:
  - DB_PASSWORD=mysecretpassword

# Good — use .env file
environment:
  - DB_PASSWORD=${DB_PASSWORD}
```

```bash
# .env
DB_PASSWORD=randomly-generated-strong-password
```

### Secure .env Files

```bash
chmod 600 .env
# Only the owner can read/write
```

### Use Docker Secrets for Sensitive Data

```yaml
services:
  db:
    image: postgres:16.2
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    secrets:
      - db_password
    restart: unless-stopped

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

See [Docker Environment Variables](/foundations/docker-environment-variables/) for more on secrets management.

## Keep Images Updated

Outdated images contain known vulnerabilities. Update regularly:

```bash
# Check for vulnerabilities
docker scout cves myimage:tag

# Pull latest version of pinned tag
docker compose pull
docker compose up -d
```

See [Updating Docker Containers](/foundations/docker-updating/) for a full update strategy.

### Use Minimal Base Images

Smaller images have fewer packages and therefore fewer potential vulnerabilities:

| Image | Size | Packages |
|-------|------|----------|
| `ubuntu:24.04` | ~78 MB | Many |
| `debian:12-slim` | ~52 MB | Moderate |
| `alpine:3.20` | ~7 MB | Minimal |
| `distroless` | ~2 MB | Almost none |

When building custom images, use `-slim` or `-alpine` variants.

## Limit Container Resources

Prevent a compromised or misbehaving container from consuming all host resources:

```yaml
services:
  myapp:
    image: myapp:v1.0
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
        reservations:
          cpus: "0.25"
          memory: 128M
    restart: unless-stopped
```

**Note:** `deploy.resources` works in Docker Compose V2. For V1, use `mem_limit` and `cpus`.

## Security Scanning

### Scan Images for Vulnerabilities

```bash
# Docker Scout (built into Docker Desktop and CLI)
docker scout cves nextcloud:29.0

# Trivy (open source scanner)
docker run --rm aquasec/trivy:0.58.1 image nextcloud:29.0

# Grype (alternative scanner)
docker run --rm anchore/grype:v0.84.0 nextcloud:29.0
```

### Audit Your Docker Configuration

```bash
# Docker Bench for Security — checks host and daemon configuration
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -v /etc:/etc:ro -v /var/lib:/var/lib:ro -v /var/run/docker.sock:/var/run/docker.sock:ro \
    docker/docker-bench-security
```

## Security Checklist

For every Docker Compose deployment:

- [ ] Containers run as non-root where possible
- [ ] Docker socket is NOT mounted (or uses a socket proxy)
- [ ] Capabilities are dropped (`cap_drop: ALL` + minimal `cap_add`)
- [ ] Ports bind to `127.0.0.1` (not `0.0.0.0`) when behind a reverse proxy
- [ ] Database ports are NOT exposed to the host
- [ ] Secrets are in `.env` files with `chmod 600`, not in Compose files
- [ ] Images use pinned version tags (no `:latest`)
- [ ] Resource limits are set for internet-facing services
- [ ] Networks are isolated (frontend/backend separation)
- [ ] Docker daemon has log rotation configured

## Common Mistakes

### 1. Mounting the Docker Socket Into Every Container

Only management tools (Portainer, Watchtower (deprecated), Traefik) need it. A compromised container with socket access owns your entire server.

### 2. Running Everything as Root

Most self-hosted apps work fine as non-root. Check with `docker exec mycontainer id` and fix the ones running as UID 0.

### 3. Using --privileged

`--privileged` gives the container full access to the host. Almost never needed. Use specific capabilities instead.

```yaml
# Bad
privileged: true

# Good
cap_add:
  - NET_ADMIN
```

### 4. Trusting Random Docker Images

Only use images from official sources, verified publishers, or well-known community projects. Check the image source, Dockerfile, and star count before running it on your server.

### 5. Not Configuring Docker Log Rotation

Container logs grow unbounded by default. Add to `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

## FAQ

### Is Docker inherently insecure?

No. Docker provides good isolation through namespaces and cgroups. But the defaults prioritize convenience over security. With the practices in this guide, Docker containers are well-isolated.

### Should I use rootless Docker?

Rootless Docker runs the Docker daemon as a non-root user, adding a significant security layer. It's worth considering for high-security setups but has compatibility issues with some networking features and volume permissions. Start with the basics in this guide first.

### Do I need a container firewall?

For most homelab setups, binding to localhost and using Docker networks is sufficient. For production-grade security, consider tools like Calico or Docker's built-in network policies.

### How do I handle Docker socket access for Portainer?

Mount it read-only if possible. Use Portainer's Edge Agent for remote management without socket access. Or use a Docker socket proxy that restricts which API endpoints are accessible.

### Is it safe to self-host internet-facing services?

Yes, with proper security: HTTPS via reverse proxy, firewall, fail2ban, non-root containers, regular updates, and no exposed database ports. The same principles that secure any internet-facing server apply.

## Next Steps

- [Firewall Setup with UFW](/foundations/firewall-ufw/) — host-level network security
- [Fail2ban Setup](/foundations/fail2ban/) — block brute-force attacks
- [Updating Docker Containers](/foundations/docker-updating/) — keep images patched

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Docker Environment Variables](/foundations/docker-environment-variables/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [Fail2ban Setup](/foundations/fail2ban/)
- [Linux File Permissions](/foundations/linux-permissions/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
