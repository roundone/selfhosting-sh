---
title: "Podman for Self-Hosting: Complete Setup Guide"
description: "How to use Podman as a Docker alternative for self-hosting. Rootless containers, Podman Compose, and migration from Docker explained."
date: 2026-02-16
dateUpdated: 2026-02-21
category: "docker-management"
apps:
  - podman
tags:
  - podman
  - docker-alternative
  - containers
  - rootless
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Podman?

Podman is a daemonless, rootless container engine developed by Red Hat that serves as a drop-in replacement for Docker. Unlike Docker, Podman doesn't require a background daemon running as root — each container runs as a direct child process of the user who started it. This makes Podman fundamentally more secure for self-hosting setups where you want to minimize the attack surface.

[Podman official site](https://podman.io/)

## Prerequisites

- A Linux server (Ubuntu 22.04+, Fedora 39+, Debian 12+, or RHEL 9+)
- At least 2 GB of RAM
- 10 GB of free disk space
- Root access for initial setup (Podman itself runs rootless after installation)

## Installation

### Ubuntu / Debian

```bash
sudo apt update
sudo apt install -y podman
```

On Ubuntu 22.04, the default repos ship Podman 3.4.x. For Podman 5.x, add the upstream repository:

```bash
# Ubuntu 24.04+ includes Podman 5.x in default repos
sudo apt update
sudo apt install -y podman
podman --version
```

### Fedora / RHEL

```bash
# Fedora (Podman is pre-installed on Fedora 39+)
sudo dnf install -y podman

# RHEL 9+
sudo dnf install -y podman
```

### Verify Installation

```bash
podman --version
# Expected: podman version 5.8.0

podman info --format '{{.Host.Security.Rootless}}'
# Expected: true
```

## Podman vs Docker: Key Differences

| Feature | Podman | Docker |
|---------|--------|--------|
| Daemon | No daemon (fork-exec model) | Requires dockerd daemon |
| Rootless | Native, first-class | Available but secondary |
| Socket | Per-user socket | System-wide socket |
| Compose | podman-compose or podman compose | docker compose |
| Systemd integration | Native (Quadlet) | Requires manual setup |
| OCI compliant | Yes | Yes |
| CLI compatible | Drop-in replacement for `docker` CLI | N/A |

## Running Containers with Podman

Podman's CLI is intentionally Docker-compatible. Most `docker` commands work by replacing `docker` with `podman`:

```bash
# Pull an image
podman pull docker.io/library/nginx:1.28.2

# Run a container
podman run -d --name nginx -p 8080:80 nginx:1.28.2

# List running containers
podman ps

# View logs
podman logs nginx

# Stop and remove
podman stop nginx
podman rm nginx
```

## Podman Compose

Podman supports Docker Compose files through two methods:

### Method 1: Built-in `podman compose` (Recommended)

Podman 5.x includes a built-in `compose` subcommand that wraps an external compose provider (docker-compose or podman-compose):

```bash
# Install docker-compose as the backend
sudo apt install -y docker-compose

# Or install podman-compose via pip
pip3 install podman-compose

# Run compose files
podman compose up -d
podman compose down
podman compose logs
```

### Method 2: podman-compose Standalone

```bash
pip3 install podman-compose

# Use directly
podman-compose up -d
podman-compose down
```

### Example: Running a Self-Hosted App

Create a `docker-compose.yml` (yes, same filename — Podman reads Docker Compose files):

```yaml
services:
  uptime-kuma:
    image: docker.io/louislam/uptime-kuma:1.23.16
    container_name: uptime-kuma
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
    restart: unless-stopped

volumes:
  uptime-kuma-data:
```

```bash
podman compose up -d
```

## Rootless Containers

Rootless mode is Podman's killer feature. Containers run entirely under your user account with no root privileges anywhere in the chain.

### Enable Rootless Prerequisites

```bash
# Verify your user has subuids/subgids allocated
grep $USER /etc/subuid
grep $USER /etc/subgid
# Expected: username:100000:65536

# If missing, add them
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
```

### Port Binding in Rootless Mode

Rootless containers cannot bind to ports below 1024 by default. Options:

```bash
# Option 1: Use ports above 1024 (recommended)
podman run -d -p 8080:80 nginx:1.28.2

# Option 2: Allow unprivileged port binding system-wide
sudo sysctl -w net.ipv4.ip_unprivileged_port_start=80
# Make permanent:
echo "net.ipv4.ip_unprivileged_port_start=80" | sudo tee /etc/sysctl.d/podman-ports.conf
```

### Storage Location

Rootless containers store images and volumes under `~/.local/share/containers/` instead of `/var/lib/docker/`.

## Systemd Integration with Quadlet

Podman integrates natively with systemd through Quadlet files. Instead of managing containers with compose, you can define them as systemd units:

Create `~/.config/containers/systemd/uptime-kuma.container`:

```ini
[Unit]
Description=Uptime Kuma monitoring
After=network-online.target

[Container]
Image=docker.io/louislam/uptime-kuma:1.23.16
ContainerName=uptime-kuma
PublishPort=3001:3001
Volume=uptime-kuma-data.volume:/app/data

[Service]
Restart=always

[Install]
WantedBy=default.target
```

Create `~/.config/containers/systemd/uptime-kuma-data.volume`:

```ini
[Volume]
```

Activate it:

```bash
systemctl --user daemon-reload
systemctl --user start uptime-kuma
systemctl --user enable uptime-kuma

# Enable lingering so services run without an active login session
loginctl enable-linger $USER
```

## Migrating from Docker to Podman

### Step 1: Install Podman

Follow the installation instructions above for your distribution.

### Step 2: Alias Docker to Podman (Optional)

```bash
echo 'alias docker=podman' >> ~/.bashrc
source ~/.bashrc
```

### Step 3: Transfer Images

```bash
# On Docker host, save images
docker save myimage:tag -o myimage.tar

# On Podman host, load images
podman load -i myimage.tar
```

### Step 4: Run Existing Compose Files

Most `docker-compose.yml` files work without changes:

```bash
podman compose up -d
```

### Common Migration Gotchas

- **Docker socket references:** Apps that mount `/var/run/docker.sock` (like Portainer, Watchtower (deprecated)) need the Podman socket instead: `/run/user/$(id -u)/podman/podman.sock`
- **Network mode:** `network_mode: host` works the same, but bridge networking uses different default subnets
- **Named volumes:** Stored in a different location (`~/.local/share/containers/storage/volumes/`)
- **Build context:** `podman build` works identically to `docker build`

## Enabling the Podman Socket (Docker API Compatibility)

Some tools expect a Docker-compatible API socket. Podman provides one:

```bash
# Rootless socket
systemctl --user enable --now podman.socket

# The socket is at:
# /run/user/$(id -u)/podman/podman.sock

# Root socket (if needed)
sudo systemctl enable --now podman.socket
# Socket at: /run/podman/podman.sock
```

For apps that expect `DOCKER_HOST`:

```bash
export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
```

## Networking

### Default Network

Podman uses `netavark` (Podman 5.x) or `cni` (older versions) for container networking:

```bash
# List networks
podman network ls

# Create a custom network
podman network create mynet

# Run a container on a custom network
podman run -d --network mynet --name app myimage:tag
```

### DNS Resolution

Containers on the same custom network can resolve each other by container name, similar to Docker.

## Backup

Container data in Podman is stored in volumes under `~/.local/share/containers/storage/volumes/` (rootless) or `/var/lib/containers/storage/volumes/` (rootful).

Back up volumes:

```bash
# Find volume location
podman volume inspect myvolume --format '{{.Mountpoint}}'

# Back up the data
tar -czf myvolume-backup.tar.gz -C $(podman volume inspect myvolume --format '{{.Mountpoint}}') .
```

For a comprehensive backup approach, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Rootless Container Cannot Access Network

**Symptom:** Container starts but cannot reach the internet.
**Fix:** Ensure `slirp4netns` or `pasta` is installed:

```bash
sudo apt install -y slirp4netns
# Or for Podman 5.x with pasta:
sudo apt install -y passt
```

### Permission Denied on Volume Mounts

**Symptom:** `Permission denied` errors when writing to bind-mounted directories.
**Fix:** Append `:Z` to the volume mount for SELinux systems, or use `podman unshare` to fix ownership:

```bash
podman unshare chown -R 1000:1000 /path/to/data
```

### Podman Compose Fails with "No Such Command"

**Symptom:** `podman compose` returns an error about missing compose provider.
**Fix:** Install a compose backend:

```bash
pip3 install podman-compose
# Or install docker-compose
sudo apt install docker-compose
```

### Container Won't Start After Reboot

**Symptom:** Containers with `restart: unless-stopped` don't start after a reboot.
**Fix:** Rootless Podman containers don't auto-restart without systemd integration. Use Quadlet or enable the Podman restart service:

```bash
systemctl --user enable podman-restart
loginctl enable-linger $USER
```

### "Error: short-name resolution enforced"

**Symptom:** Pulling images fails because Podman requires fully-qualified image names.
**Fix:** Use the full registry path:

```bash
# Instead of:
podman pull nginx:1.28.2
# Use:
podman pull docker.io/library/nginx:1.28.2
```

Or add Docker Hub as a default search registry in `/etc/containers/registries.conf`:

```toml
unqualified-search-registries = ["docker.io"]
```

## Resource Requirements

- **RAM:** 50 MB idle (Podman itself), plus whatever your containers use
- **CPU:** Minimal — no daemon overhead
- **Disk:** ~200 MB for Podman + dependencies, plus container images and volumes

## Verdict

Podman is the best Docker alternative for security-conscious self-hosters. Its rootless-by-default approach eliminates the biggest security concern with Docker (a root-running daemon with access to everything). The CLI compatibility means most Docker tutorials and Compose files work without changes. The main trade-off is that some Docker-specific tools (Portainer, Watchtower (deprecated)) require extra configuration to work with the Podman socket, and rootless networking has quirks with low ports. If you're starting fresh or want better security, use Podman. If you have a large existing Docker setup with tools that depend on the Docker socket, the migration effort may not be worth it.

## FAQ

### Can I run Docker and Podman on the same machine?

Yes. They use separate storage locations and don't conflict. However, they cannot share images or volumes directly — you'd need to export/import between them.

### Does Podman support Docker Compose files?

Yes. Podman reads standard `docker-compose.yml` files through `podman compose` or `podman-compose`. Most files work without modification.

### Is Podman slower than Docker?

No. Container runtime performance is identical since both use the same underlying OCI runtime (runc/crun). Podman can be marginally faster for starting containers because there's no daemon overhead.

### Does Podman work with Kubernetes?

Yes. Podman can generate Kubernetes YAML from running containers (`podman generate kube`) and play Kubernetes YAML files (`podman play kube`), which is useful for testing locally before deploying to a cluster.

### Can I use Portainer with Podman?

Yes, but you need to enable the Podman socket and point Portainer to it. Set `DOCKER_HOST` to the Podman socket path or mount it as a volume.

## Related

- [Best Docker Management Tools](/best/docker-management/)
- [How to Self-Host Portainer with Docker](/apps/portainer/)
- [How to Self-Host Dockge with Docker](/apps/dockge/)
- [Portainer vs Dockge](/compare/portainer-vs-dockge/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Security](/foundations/docker-security/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
