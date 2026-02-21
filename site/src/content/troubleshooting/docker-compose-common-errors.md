---
title: "Docker Compose Common Errors and Fixes"
description: "Fix the most common Docker Compose errors including port conflicts, volume permissions, network issues, and YAML syntax problems."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["troubleshooting", "docker", "docker-compose", "errors"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## The Problem

Docker Compose is the backbone of self-hosting, but its error messages range from helpful to cryptic. This guide covers the ten most common errors you will encounter, with exact error messages, root causes, and fixes.

If you are new to Docker Compose, read [Docker Compose Basics](/foundations/docker-compose-basics/) first. The errors below assume you have a working Docker installation and are running `docker compose up -d` on a Compose file.

---

## Error 1: "port is already allocated"

### Symptom

```
Error response from daemon: driver failed programming external connectivity on endpoint container_name:
Bind for 0.0.0.0:8080 failed: port is already allocated
```

### The Cause

Another process or container is already listening on the host port you are trying to bind. Docker cannot bind two things to the same host port simultaneously.

### The Fix

Find what is using the port:

```bash
ss -tlnp | grep 8080
```

This shows the process ID and name bound to port 8080. You will see output like:

```
LISTEN 0 4096 0.0.0.0:8080 0.0.0.0:* users:(("docker-proxy",pid=12345,fd=4))
```

If it is another Docker container:

```bash
docker ps --format '{{.Names}} {{.Ports}}' | grep 8080
```

**Option A: Stop the conflicting service.**

```bash
docker stop <conflicting_container>
```

**Option B: Change your port mapping.** Edit your `docker-compose.yml` to use a different host port:

```yaml
ports:
  - "8081:8080"  # Changed host port from 8080 to 8081
```

The left side is the host port (changeable). The right side is the container port (fixed by the application).

**Option C: Use a random host port.** If you are using a [reverse proxy](/foundations/reverse-proxy-explained/), you do not need to expose a fixed host port at all. Remove the `ports:` section and access the container through Docker's internal network.

---

## Error 2: "no matching manifest for linux/arm64"

### Symptom

```
no matching manifest for linux/arm64/v8 in the manifest list entries
```

Or:

```
image with reference <image>:<tag> was found but does not match the specified platform
```

### The Cause

The Docker image you are pulling does not have a build for your CPU architecture. This typically happens when running ARM-based hardware (Raspberry Pi, Apple Silicon Mac) and the image only provides x86_64 (amd64) builds.

### The Fix

**Option A: Specify the platform explicitly.** Add the `platform` directive to your service:

```yaml
services:
  myapp:
    image: someimage:v1.2.3
    platform: linux/amd64
```

This runs the amd64 image under QEMU emulation. It works but is significantly slower — expect 3-5x performance overhead. Acceptable for light workloads, not for anything CPU-intensive.

**Option B: Find an ARM-compatible image.** Check the image's Docker Hub or GitHub Container Registry page for multi-arch support. Many popular self-hosted apps provide multi-arch images. LinuxServer.io images almost always support both amd64 and arm64.

**Option C: Check for a community ARM build.** Search Docker Hub for `<app-name> arm64`. Community members often maintain ARM builds of popular applications.

**Option D: Build from source.** If the application provides a Dockerfile, clone the repository and build locally:

```bash
git clone https://github.com/org/repo.git
cd repo
docker build -t myapp:local .
```

Then reference `myapp:local` in your Compose file.

---

## Error 3: "permission denied" on Volumes

### Symptom

```
permission denied: '/data/config.json'
```

Or the container starts but logs show:

```
Error: EACCES: permission denied, open '/app/data/database.sqlite'
```

### The Cause

The container's internal process runs as a specific UID/GID (often not root), but the mounted host directory is owned by a different user. The container process cannot read or write to files it does not own.

This is the single most common issue in self-hosted Docker setups.

### The Fix

**Step 1: Find the container's UID/GID.**

Check the image documentation. Many images document this. LinuxServer.io images use the `PUID` and `PGID` environment variables. Other images run as a fixed user — check the Dockerfile for the `USER` directive.

```bash
# Check what user the container runs as
docker exec <container_name> id
```

Output example:

```
uid=1000(abc) gid=1000(abc) groups=1000(abc)
```

**Step 2: Fix ownership on the host.**

```bash
# Replace 1000:1000 with the UID:GID from Step 1
sudo chown -R 1000:1000 /path/to/your/data
```

**Step 3 (alternative): Set the user in Compose.**

If the image supports it, you can specify the user in your Compose file:

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    user: "1000:1000"
    volumes:
      - ./data:/app/data
```

**Step 4 (for LinuxServer.io images): Use PUID/PGID.**

```yaml
services:
  myapp:
    image: lscr.io/linuxserver/someapp:latest
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - ./data:/config
```

**Warning:** Do not `chmod 777` your data directories. It works, but it is a security disaster. Fix ownership properly instead.

For more details on volume management, see [Docker Volumes](/foundations/docker-volumes/).

---

## Error 4: "network declared as external but could not be found"

### Symptom

```
network my_proxy_network declared as external, but could not be found
```

### The Cause

Your Compose file references an external Docker network that does not exist yet. External networks are created outside of the Compose file and shared between multiple Compose stacks — commonly used when a [reverse proxy](/foundations/reverse-proxy-explained/) needs to reach backend containers.

### The Fix

Create the network before starting the Compose stack:

```bash
docker network create my_proxy_network
```

Then your Compose file can reference it:

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    networks:
      - my_proxy_network
      - default

networks:
  my_proxy_network:
    external: true
```

**Common pattern:** If you are using Nginx Proxy Manager, Traefik, or Caddy as a reverse proxy in a separate Compose stack, create a shared network that both stacks connect to. The proxy stack creates it, and application stacks reference it as external.

For a deeper explanation of how Docker networks interact, see [Docker Networking](/foundations/docker-networking/).

---

## Error 5: "yaml: line X: did not find expected key"

### Symptom

```
yaml: line 12: did not find expected key
```

Or:

```
yaml: line 8: mapping values are not allowed in this context
```

### The Cause

YAML syntax error. The two most common causes:

1. **Tabs instead of spaces.** YAML does not allow tabs for indentation. One tab character breaks the entire file.
2. **Inconsistent indentation.** Mixing 2-space and 4-space indentation within the same level, or indenting a key to the wrong level.

### The Fix

**Find tabs:**

```bash
grep -P '\t' docker-compose.yml
```

If this returns lines, replace tabs with spaces:

```bash
sed -i 's/\t/  /g' docker-compose.yml
```

**Validate your YAML before running:**

```bash
docker compose config
```

This parses the Compose file and prints the resolved configuration. If there are syntax errors, it reports them with line numbers.

**Use a linter.** Install `yamllint` for detailed YAML validation:

```bash
pip install yamllint
yamllint docker-compose.yml
```

**Common indentation mistakes:**

```yaml
# WRONG — environment is indented too far
services:
  myapp:
    image: someapp:v1.2.3
      environment:      # This should be at the same level as 'image:'
        - FOO=bar

# CORRECT
services:
  myapp:
    image: someapp:v1.2.3
    environment:
      - FOO=bar
```

```yaml
# WRONG — colon in value without quotes
services:
  myapp:
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb  # Colons break parsing

# CORRECT — quote values containing special characters
services:
  myapp:
    environment:
      - "DATABASE_URL=postgres://user:pass@db:5432/mydb"
```

---

## Error 6: "depends on service which is undefined"

### Symptom

```
service "app" depends on service "database" which is undefined
```

### The Cause

The `depends_on` directive references a service name that does not exist in your Compose file. This is almost always a typo or a mismatch between the service name definition and the reference.

### The Fix

Check that the service names match exactly:

```yaml
# WRONG — 'db' vs 'database' mismatch
services:
  app:
    image: myapp:v1.0.0
    depends_on:
      - database    # References 'database'...

  db:               # ...but the service is named 'db'
    image: postgres:16

# CORRECT
services:
  app:
    image: myapp:v1.0.0
    depends_on:
      - db

  db:
    image: postgres:16
```

Service names are case-sensitive. `Redis` is not `redis`. Check your spelling and case.

Also verify that the depended-on service is actually defined in the **same** Compose file. If it is in a different Compose stack, you cannot use `depends_on` — use an external network and health-check-based readiness instead.

---

## Error 7: "container name already in use"

### Symptom

```
Error response from daemon: Conflict. The container name "/myapp" is already in use by container "abc123..."
You have to remove (or rename) that container to be able to reuse that name.
```

### The Cause

A container with the same name already exists, even if it is stopped. This happens when you run `docker compose up -d` after a previous run that was not properly cleaned up, or when two different Compose files define a container with the same `container_name`.

### The Fix

**Option A: Remove the old stack properly.**

```bash
docker compose down
docker compose up -d
```

`docker compose down` stops and removes containers, networks, and the default network created by that Compose file. Running `up` again creates fresh containers.

**Option B: Remove the specific container.**

```bash
docker rm -f myapp
docker compose up -d
```

**Option C: Remove the `container_name` directive.** Unless you have a specific reason to set a custom container name, let Docker Compose generate one automatically. The generated name is `<project>-<service>-<instance>`:

```yaml
services:
  myapp:
    image: someapp:v1.2.3
    # container_name: myapp   # Remove this line
```

**Tip:** If you manage many containers, [Portainer](/apps/portainer/) or [Dockge](/apps/dockge/) provide a visual interface for managing container lifecycle, making it easier to spot orphaned containers.

---

## Error 8: "no space left on device"

### Symptom

```
no space left on device
```

Or:

```
Error response from daemon: failed to create shim task: OCI runtime create failed:
runc create failed: unable to start container process: error during container init:
unable to apply apparmor profile: write /proc/self/attr/apparmor/exec: no space left on device
```

### The Cause

Your disk is full. Docker stores images, containers, volumes, and build cache in `/var/lib/docker`, which can grow to tens or hundreds of gigabytes over time. Unused images from previous pulls, dangling volumes, and build cache accumulate silently.

### The Fix

**Step 1: Check disk usage.**

```bash
df -h /var/lib/docker
```

**Step 2: Check Docker's disk usage breakdown.**

```bash
docker system df
```

This shows how much space images, containers, volumes, and build cache consume.

**Step 3: Clean up unused resources.**

```bash
# Remove unused images, stopped containers, unused networks, and build cache
docker system prune -a
```

**Warning:** `docker system prune -a` removes ALL images not associated with a running container. Your next `docker compose up` will need to re-pull images.

**Step 4: Clean up unused volumes (separate command).**

```bash
# Volumes are NOT included in system prune by default
docker volume prune
```

**Warning:** Verify you do not have stopped containers whose data you still need. `docker volume prune` removes volumes not attached to any container, including stopped ones.

**Step 5: If /var/lib/docker is on a small partition,** move Docker's data directory:

```bash
sudo systemctl stop docker
sudo rsync -aP /var/lib/docker/ /mnt/larger-disk/docker/
```

Edit `/etc/docker/daemon.json`:

```json
{
  "data-root": "/mnt/larger-disk/docker"
}
```

```bash
sudo systemctl start docker
```

**Prevention:** Set up a cron job to prune weekly:

```bash
echo "0 3 * * 0 docker system prune -af --volumes 2>&1 | logger -t docker-prune" | sudo tee /etc/cron.d/docker-prune
```

---

## Error 9: Environment Variable Not Expanding

### Symptom

Your environment variable contains a literal `$` character or the variable is not substituted at all. For example, a password like `p@$$w0rd` is truncated to `p@` or an environment variable reference like `${DB_HOST}` appears literally in the container instead of being replaced.

### The Cause

Docker Compose uses `$` for variable substitution. A single `$` followed by a word is treated as a variable reference. If the variable does not exist, it resolves to an empty string — silently dropping part of your value.

### The Fix

**For literal dollar signs, escape with `$$`:**

```yaml
services:
  myapp:
    environment:
      # WRONG — Docker interprets $w0rd as a variable
      - "DB_PASSWORD=p@$$w0rd"    # Results in: p@$w0rd (one $ consumed for escaping)

      # Wait — this is still tricky. Let's be explicit:
      # To get a literal $ in the container, use $$ in the Compose file
      - "DB_PASSWORD=p@$$$$w0rd"  # Results in: p@$$w0rd inside container
```

The safest approach for passwords with special characters is to use an `.env` file:

```bash
# .env file — no escaping needed here
DB_PASSWORD=p@$$w0rd
```

```yaml
# docker-compose.yml
services:
  myapp:
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
```

**For variable substitution not working:**

Docker Compose reads `.env` from the same directory as the Compose file. Verify:

```bash
# Check that .env exists in the same directory
ls -la .env

# Check that the variable is defined
grep DB_HOST .env

# Verify Compose sees it
docker compose config | grep DB_HOST
```

**Common pitfall:** Spaces around `=` in `.env` files break parsing:

```bash
# WRONG
DB_HOST = localhost

# CORRECT
DB_HOST=localhost
```

---

## Error 10: Container Exits Immediately

### Symptom

You run `docker compose up -d` and the container shows as `Exited (1)` immediately, or it enters a restart loop.

```bash
$ docker ps -a
CONTAINER ID  IMAGE          STATUS                     NAMES
abc123        myapp:v1.0.0   Exited (1) 2 seconds ago   myapp
```

### The Cause

The application inside the container crashed on startup. Common reasons:

- Missing required environment variables
- Database not reachable (started before the DB was ready)
- Configuration file not found or invalid
- Insufficient permissions to bind to a port or write to a directory
- Out of memory

### The Fix

**Step 1: Check the container logs.**

```bash
docker compose logs myapp
```

Or for just the last 50 lines:

```bash
docker compose logs --tail 50 myapp
```

The logs almost always contain the specific error message.

**Step 2: Common fixes based on log output.**

| Log Message | Fix |
|-------------|-----|
| `required environment variable X is not set` | Add the missing variable to your Compose file or `.env` |
| `connection refused` to database | Add `depends_on` with a health check, or add `restart: unless-stopped` so the app retries |
| `EACCES: permission denied` | Fix volume ownership (see Error 3 above) |
| `OOMKilled` | The container ran out of memory. Increase Docker's memory limit or add swap |
| `exec format error` | Wrong architecture (see Error 2 above) |

**Step 3: Run interactively for debugging.**

```bash
docker compose run --rm myapp sh
```

This drops you into a shell inside the container so you can inspect the environment, check file permissions, and try running the application manually.

**Step 4: For database dependency issues,** use a health check in your Compose file:

```yaml
services:
  db:
    image: postgres:16
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    image: myapp:v1.0.0
    depends_on:
      db:
        condition: service_healthy
```

This ensures the application container does not start until the database is accepting connections.

---

## Prevention

These practices prevent most of the errors above:

1. **Always run `docker compose config` before `docker compose up`.** This validates your YAML syntax and variable substitution without starting any containers.

2. **Use `.env` files for all sensitive values.** Keep passwords and secrets out of the Compose file. Add `.env` to `.gitignore`.

3. **Pin image versions.** Never use `:latest`. Pin to a specific version tag so your setup is reproducible and upgrades are intentional.

4. **Set `restart: unless-stopped` on every service.** This handles transient failures like database startup races without manual intervention.

5. **Use health checks for database dependencies.** The `depends_on` with `condition: service_healthy` pattern eliminates most startup-order issues.

6. **Run `docker system prune` regularly.** Set up a weekly cron job. Docker accumulates garbage silently.

7. **Use named volumes, not anonymous volumes.** Named volumes are easier to back up, inspect, and manage. Anonymous volumes are nearly impossible to track down later.

8. **Check architecture compatibility before deploying.** If you run ARM hardware, verify multi-arch support before writing your Compose file.

9. **Validate YAML with a linter.** Install `yamllint` and run it as part of your workflow. It catches indentation and syntax issues that `docker compose config` sometimes misses.

10. **Keep a `.env.example` alongside your `.env`.** Document every required variable with a comment explaining what it does and what values are acceptable.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Networking](/foundations/docker-networking/)
- [How to Self-Host Portainer](/apps/portainer/)
- [How to Self-Host Dockge](/apps/dockge/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
