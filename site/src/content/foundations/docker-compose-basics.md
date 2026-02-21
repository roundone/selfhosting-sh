---
title: "Docker Compose Basics for Self-Hosting"
description: "Learn Docker Compose fundamentals — services, volumes, networks, and environment variables for running self-hosted apps."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "docker-compose", "containers"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Docker Compose?

Docker Compose is a tool for defining and running multi-container applications with a single YAML file. Instead of manually running `docker run` commands with dozens of flags, you describe your entire stack — the app, its database, its cache, the volumes, the networks — in one `docker-compose.yml` file and bring it all up with a single command.

For self-hosting, Docker Compose is the standard. Nearly every self-hosted app ships with a `docker-compose.yml` in its repository. Learning Compose is the single highest-leverage skill for running your own services. Once you understand it, you can deploy anything from [Immich](/apps/immich/) to [Vaultwarden](/apps/vaultwarden/) in minutes.

This guide covers everything you need to go from zero to running multi-service stacks confidently.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) — see [Getting Started with Self-Hosting](/foundations/getting-started/)
- SSH access to your server — see [SSH Setup](/foundations/ssh-setup/)
- Basic familiarity with the Linux command line — see [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- Root or sudo access

## Installation

Docker Compose v2 is bundled as a plugin with Docker Engine. Install both at once using Docker's official repository. Do not use the `docker-compose` package from your distro's default repos — it is almost always outdated.

On Ubuntu or Debian:

```bash
# Remove any old versions
sudo apt remove docker docker-engine docker.io containerd runc 2>/dev/null

# Install prerequisites
sudo apt update
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

For Debian, replace `ubuntu` with `debian` in the repository URL.

Add your user to the `docker` group so you don't need `sudo` for every command:

```bash
sudo usermod -aG docker $USER
```

Log out and back in for the group change to take effect. Verify the installation:

```bash
docker compose version
```

You should see `Docker Compose version v2.x.x`. If you see `command not found`, the plugin didn't install correctly — re-run the installation steps.

## The Docker Compose File

Every Compose setup starts with a file named `docker-compose.yml` in a project directory. Here is a practical example that runs [Uptime Kuma](/apps/uptime-kuma/), a self-hosted monitoring tool:

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1.23.16
    container_name: uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
    environment:
      - TZ=America/New_York
    restart: unless-stopped

volumes:
  uptime-kuma-data:
```

Every key concept in Compose is in this file. Here is what each section does.

### `services`

The top-level `services` key defines the containers you want to run. Each service gets a name (here, `uptime-kuma`) and a set of configuration options. A single Compose file can define as many services as you need — the app, its database, a reverse proxy, a cache server.

### `image`

Specifies which Docker image to pull and run. Always pin to a specific version tag like `1.23.16` rather than using `latest`. Using `latest` means your setup can break silently when the image updates. Pinned versions give you reproducible deployments — you control when you upgrade.

### `container_name`

Sets a predictable name for the container. Without this, Docker generates a name like `uptime-kuma-uptime-kuma-1`. Setting it explicitly makes logs, troubleshooting, and `docker exec` commands cleaner.

### `ports`

Maps a port on your host machine to a port inside the container. The format is `"HOST:CONTAINER"`. In this example, port 3001 on the host maps to port 3001 inside the container. You access the app by navigating to `http://your-server-ip:3001`.

To run the app on a different host port (for example, if 3001 is taken), change the left side only: `"8080:3001"` makes the app available on port 8080.

### `volumes`

Mounts persistent storage into the container. Without volumes, all data inside a container is lost when the container is removed. The `uptime-kuma-data:/app/data` line means a named volume called `uptime-kuma-data` is mounted at `/app/data` inside the container. The `volumes:` section at the bottom of the file declares the named volume.

For a deep dive on volume types, bind mounts, and permissions, see [Docker Volumes](/foundations/docker-volumes/).

### `environment`

Sets environment variables inside the container. These configure the application. Some apps need dozens of env vars (database URLs, secrets, feature flags); others need just a timezone. You can specify them as a list (shown above) or as a mapping:

```yaml
environment:
  TZ: America/New_York
  PUID: 1000
  PGID: 1000
```

### `restart`

Controls what happens when the container stops. Use `unless-stopped` for every self-hosted service. This means the container restarts automatically after crashes and after the host reboots — but stays stopped if you manually stop it with `docker compose stop`. Other options (`always`, `on-failure`, `no`) are rarely the right choice for self-hosting.

### `networks`

Not shown in the simple example above because Compose creates a default network for each project automatically. All services in the same `docker-compose.yml` can reach each other by service name on this default network. You only need to define custom networks when you want to isolate services or connect containers across different Compose projects. See [Docker Networking](/foundations/docker-networking/) for details.

## Essential Commands

All commands run from the directory containing your `docker-compose.yml`.

### Start services

```bash
docker compose up -d
```

The `-d` flag runs containers in detached mode (background). Without it, logs stream to your terminal and stopping the terminal stops the containers. Always use `-d` for self-hosted services.

### Stop and remove services

```bash
docker compose down
```

This stops and removes the containers and the default network. Your data in named volumes is preserved. To also delete volumes (destroying all data), add `-v` — use this with extreme caution.

### View logs

```bash
# All services
docker compose logs

# Specific service, follow mode
docker compose logs -f uptime-kuma

# Last 100 lines
docker compose logs --tail 100
```

### List running containers

```bash
docker compose ps
```

Shows the state, ports, and health of each service in the current project.

### Pull updated images

```bash
docker compose pull
```

Downloads the latest version of the images specified in your Compose file. After pulling, run `docker compose up -d` to recreate containers with the new images. This is how you update self-hosted apps: update the version tag in your Compose file, pull, and bring it up.

### Restart a service

```bash
docker compose restart uptime-kuma
```

Restarts the container without recreating it. Useful for applying config changes that don't require a new container.

### Execute a command inside a container

```bash
docker compose exec uptime-kuma sh
```

Opens a shell inside the running container. Essential for debugging, running database migrations, or checking file permissions. Use `bash` instead of `sh` if the image includes it.

## Environment Variables

Hardcoding passwords and configuration directly in `docker-compose.yml` works but gets messy fast. Use a `.env` file instead.

Create a `.env` file in the same directory as your `docker-compose.yml`:

```bash
# .env
POSTGRES_PASSWORD=change-me-to-something-strong
APP_SECRET_KEY=generate-a-random-string-here
TIMEZONE=America/New_York
```

Reference these variables in your Compose file:

```yaml
services:
  app:
    image: some-app:2.1.0
    environment:
      - DB_PASSWORD=${POSTGRES_PASSWORD}
      - SECRET_KEY=${APP_SECRET_KEY}
      - TZ=${TIMEZONE}
```

Docker Compose automatically reads `.env` from the project directory. No extra flags needed.

**Security note:** Add `.env` to your `.gitignore` if you keep your Compose files in a git repository. Never commit secrets to version control. For more advanced secrets management, Docker has a `secrets` feature, but `.env` files are sufficient for most self-hosting setups.

Generate strong passwords and secrets from the command line:

```bash
openssl rand -base64 32
```

## Volumes and Persistent Data

Volumes are how your self-hosted apps survive container restarts, updates, and migrations. There are two main approaches:

**Named volumes** (managed by Docker):

```yaml
volumes:
  - app-data:/var/lib/app

# Declared at the bottom
volumes:
  app-data:
```

**Bind mounts** (mapped to a specific host directory):

```yaml
volumes:
  - /opt/app-data:/var/lib/app
```

Named volumes are simpler. Bind mounts give you direct access to the files on the host filesystem, which makes backups easier. For most self-hosted apps, either approach works. Pick one convention and stick with it across your server.

Back up your volumes regularly. See [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/) for a complete guide. For a deeper look at volume types, permissions, and troubleshooting, see [Docker Volumes](/foundations/docker-volumes/).

## Networks

By default, all services in a single `docker-compose.yml` share a network and can reach each other by service name. If your Compose file defines a service called `db`, your app container can connect to it using `db` as the hostname — no IP addresses needed.

```yaml
services:
  app:
    image: myapp:1.0.0
    environment:
      - DATABASE_HOST=db  # service name as hostname
  db:
    image: postgres:16.2
```

Custom networks become important when you run a [reverse proxy](/foundations/reverse-proxy-explained/) that needs to reach containers defined in separate Compose files, or when you want to isolate services from each other. See [Docker Networking](/foundations/docker-networking/) for the full guide.

## Multi-Service Stacks

Most self-hosted apps need more than one container. A typical stack includes the application, a database, and sometimes a cache. Here is a realistic example — a wiki application with PostgreSQL and Redis:

```yaml
services:
  wikijs:
    image: ghcr.io/requarks/wiki:2.5.306
    container_name: wikijs
    ports:
      - "3000:3000"
    environment:
      - DB_TYPE=postgres
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=wikijs
      - DB_PASS=${DB_PASSWORD}
      - DB_NAME=wikijs
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16.2-alpine
    container_name: wikijs-db
    environment:
      - POSTGRES_USER=wikijs
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=wikijs
    volumes:
      - wikijs-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wikijs"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  wikijs-db-data:
```

Key patterns to notice:

- **`depends_on` with health checks.** The app waits for the database to be ready before starting. Without this, the app may crash on first boot because the database isn't accepting connections yet. The `condition: service_healthy` option requires a `healthcheck` defined on the dependency.
- **Service name as hostname.** The app connects to the database using `DB_HOST=db` — the service name. Docker's internal DNS handles the resolution.
- **Database volume.** Only the database has a volume because that is where persistent data lives. The app container itself is stateless — it reads everything from the database.
- **Shared `.env` variable.** Both the app and the database reference `${DB_PASSWORD}`, ensuring the password stays in sync. Define it once in your `.env` file.
- **Alpine images.** The `postgres:16.2-alpine` variant is smaller and faster to pull. Use Alpine variants when available.

## Common Mistakes

### Using `:latest` tags

```yaml
# Bad — will break unpredictably
image: nextcloud:latest

# Good — reproducible
image: nextcloud:29.0.1
```

Pin your versions. When you want to upgrade, change the tag deliberately, pull, and redeploy.

### Forgetting `restart: unless-stopped`

Without a restart policy, your services stay down after a server reboot. You will only discover this when you try to access the app and it is offline. Add `restart: unless-stopped` to every service.

### Exposing database ports to the host

```yaml
# Bad — PostgreSQL is now accessible from the internet
db:
  ports:
    - "5432:5432"
```

Databases should only be accessible to other containers on the Docker network. Remove the `ports` mapping from database services. The app container can still reach the database via the service name.

### Anonymous volumes

```yaml
# Bad — data location is unpredictable
volumes:
  - /app/data
```

Always use named volumes or explicit bind mounts. Anonymous volumes are hard to find, back up, or migrate.

### Not reading logs after deployment

If a container starts and immediately exits, the issue is almost always an environment variable or permissions problem. Run `docker compose logs` immediately after `docker compose up -d` to catch errors early.

### Editing the wrong `.env` file

Compose reads `.env` from the directory where you run the command. If you are in the wrong directory, your variables will not load. Keep each project in its own directory with its own `.env`.

### Running `docker compose down -v` accidentally

The `-v` flag deletes all named volumes — your database, your uploads, your configuration. Never use `-v` unless you intentionally want to destroy all data. If you need to stop services without losing data, use `docker compose down` (no `-v`).

## Next Steps

You now have the fundamentals to deploy any Docker Compose-based self-hosted application. Here is where to go next:

- **Set up a reverse proxy** so you can access your services via domain names with HTTPS instead of IP addresses and port numbers — [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- **Understand Docker networking** to connect services across Compose files and isolate sensitive containers — [Docker Networking](/foundations/docker-networking/)
- **Master volumes and storage** for reliable data persistence and clean backup workflows — [Docker Volumes](/foundations/docker-volumes/)
- **Implement a backup strategy** before you have data you care about — [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)

Ready to deploy your first app? Start with one of these beginner-friendly self-hosted applications:

- [Uptime Kuma](/apps/uptime-kuma/) — simple, single-container monitoring with a clean UI
- [Pi-hole](/apps/pi-hole/) — network-wide ad blocking that makes an immediate difference
- [Vaultwarden](/apps/vaultwarden/) — a self-hosted password manager compatible with Bitwarden clients
- [Immich](/apps/immich/) — a full-featured Google Photos replacement

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [SSH Setup](/foundations/ssh-setup/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Networking](/foundations/docker-networking/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
