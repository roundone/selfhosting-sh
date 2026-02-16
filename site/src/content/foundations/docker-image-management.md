---
title: "Docker Image Management for Self-Hosting"
description: "Master Docker image management — pulling, tagging, cleaning up, and optimizing disk space for your self-hosted server."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "images", "containers", "disk-space"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Docker Image Management?

Docker images are the blueprints for your containers. Every self-hosted app you run — [Nextcloud](/apps/nextcloud), [Immich](/apps/immich), [Vaultwarden](/apps/vaultwarden) — starts as an image downloaded from a registry. Over time, these images pile up. Old versions linger after updates. Dangling layers accumulate. Without active management, Docker images will consume tens of gigabytes of disk space on a typical self-hosting server.

Image management is about understanding where images come from, how to control which versions you run, and how to clean up what you no longer need.

## Prerequisites

- Docker installed on your server — see [Docker Compose Basics](/foundations/docker-compose-basics)
- Basic Linux command line knowledge — see [Linux Basics](/foundations/linux-basics-self-hosting)
- SSH access to your server — see [SSH Setup](/foundations/ssh-setup)

## How Docker Images Work

A Docker image is a read-only template built from a series of layers. Each layer represents an instruction in the image's Dockerfile — installing a package, copying files, setting environment variables. Layers are shared between images, so if two apps both use `debian:bookworm` as a base, that layer is stored once on disk.

When you run `docker compose up -d`, Docker:

1. Checks if the required image exists locally
2. If not, pulls it from a registry (Docker Hub, GitHub Container Registry, etc.)
3. Creates a writable container layer on top of the image
4. Starts the container

The image itself is never modified. Multiple containers can share the same image.

## Pulling Images

### From Docker Compose

When your `docker-compose.yml` specifies an image, Docker pulls it automatically on first run:

```yaml
services:
  vaultwarden:
    image: vaultwarden/server:1.33.2
```

To manually pull or update images before starting containers:

```bash
docker compose pull
```

### Direct Pull

Pull a specific image manually:

```bash
docker pull vaultwarden/server:1.33.2
```

### Registry Sources

Images come from different registries. The image name tells you where:

| Image Name | Registry |
|-----------|----------|
| `nginx:1.28.2` | Docker Hub (default) |
| `ghcr.io/immich-app/server:v1.99.0` | GitHub Container Registry |
| `lscr.io/linuxserver/nextcloud:32.0.6` | LinuxServer.io Registry |
| `registry.gitlab.com/org/app:v1.0` | GitLab Container Registry |
| `quay.io/org/app:v1.0` | Red Hat Quay |

If no registry prefix is specified, Docker Hub is assumed.

## Image Tags and Versions

Tags are labels attached to images. They're how you specify which version to run.

### Pin Specific Versions

Always pin to a specific version tag in production:

```yaml
# Good — reproducible
image: ghcr.io/immich-app/server:v1.99.0

# Bad — unpredictable
image: ghcr.io/immich-app/server:latest
```

The `:latest` tag doesn't mean "most recent." It means "whatever the maintainer last tagged as latest." It can change at any time, breaking your setup without warning.

### Common Tag Patterns

| Pattern | Example | Meaning |
|---------|---------|---------|
| Semver | `1.33.2` | Specific release |
| v-prefixed | `v1.99.0` | Same, with `v` prefix |
| Major only | `3` | Latest patch within major version 3 |
| Major.minor | `3.4` | Latest patch within 3.4.x |
| Release name | `bookworm` | Debian release name |
| Build ID | `251130-b3068414c` | Commit-based tag |
| `latest` | — | Default tag, avoid in production |
| `stable` | — | Maintainer's stable channel |

### Finding Available Tags

Check which tags an image offers:

**Docker Hub:**
```bash
# List tags for an image on Docker Hub
curl -s "https://hub.docker.com/v2/repositories/vaultwarden/server/tags/?page_size=10" | python3 -m json.tool
```

**GitHub Container Registry:**
```bash
# List tags from GHCR (requires auth for private images)
curl -s "https://ghcr.io/v2/immich-app/server/tags/list" | python3 -m json.tool
```

Or check the app's GitHub releases page — most projects tag Docker images to match their releases.

## Listing Images on Your Server

### See All Images

```bash
docker image ls
```

Output:

```
REPOSITORY                      TAG        IMAGE ID       SIZE
vaultwarden/server              1.33.2     a1b2c3d4e5f6   250MB
ghcr.io/immich-app/server       v1.99.0    f6e5d4c3b2a1   1.2GB
postgres                        16         1a2b3c4d5e6f   420MB
redis                           7.4        6f5e4d3c2b1a   45MB
```

### See Image Disk Usage

```bash
docker system df
```

Output:

```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          15        8         8.5GB     3.2GB (37%)
Containers      8         8         125MB     0B (0%)
Local Volumes   12        8         15GB      2.1GB (14%)
Build Cache     0         0         0B        0B
```

### See Detailed Size Breakdown

```bash
docker system df -v
```

This shows per-image sizes and which images are actively used by containers.

## Cleaning Up Images

### Remove Unused Images

The most important command for disk management. Removes all images not used by any container:

```bash
docker image prune -a
```

The `-a` flag removes all unused images, not just dangling ones. Without `-a`, only images with no tag (dangling) are removed.

### Remove Dangling Images Only

Dangling images are layers with no tag — typically leftover from builds or updates:

```bash
docker image prune
```

### Full System Cleanup

Remove unused images, containers, networks, and build cache in one command:

```bash
docker system prune -a
```

Add `--volumes` to also clean unused volumes (careful — this removes data):

```bash
docker system prune -a --volumes
```

### Remove Specific Images

```bash
docker image rm vaultwarden/server:1.32.0
```

Or by image ID:

```bash
docker image rm a1b2c3d4e5f6
```

### Automate Cleanup

Add a cron job to clean up weekly — see [Cron Jobs](/foundations/linux-cron-jobs):

```bash
# Clean unused Docker images every Sunday at 3 AM
0 3 * * 0 docker image prune -a -f >> /var/log/docker-cleanup.log 2>&1
```

The `-f` flag skips the confirmation prompt.

## Updating Images

When a new version of an app is released, you need to pull the updated image and recreate the container. See [Updating Docker Containers](/foundations/docker-updating) for the full workflow.

The short version:

```bash
# Update the tag in docker-compose.yml, then:
docker compose pull
docker compose up -d
```

After updating, the old image still exists on disk. Run `docker image prune` to clean it up.

## Multi-Architecture Images

Modern images often support multiple CPU architectures (amd64, arm64, armv7). Docker automatically pulls the correct architecture for your platform.

Check which architectures an image supports:

```bash
docker manifest inspect vaultwarden/server:1.33.2
```

This matters if you run a [Raspberry Pi](/hardware/raspberry-pi-home-server) (arm64) — not all images support ARM. Check before planning your stack.

## Practical Examples

### Check Disk Usage Before and After Cleanup

```bash
# See current usage
docker system df

# Clean unused images
docker image prune -a -f

# See savings
docker system df
```

### Find the Largest Images

```bash
docker image ls --format "{{.Repository}}:{{.Tag}}\t{{.Size}}" | sort -k2 -h
```

### Export and Import Images (Offline Transfer)

Move images between servers without a registry:

```bash
# Export
docker save -o immich-server.tar ghcr.io/immich-app/server:v1.99.0

# Transfer to another server
scp immich-server.tar user@other-server:~/

# Import on the other server
docker load -i immich-server.tar
```

## Common Mistakes

### Using `:latest` in Production

`:latest` makes your setup non-reproducible. When you run `docker compose pull`, you might get a breaking change. Always pin versions.

### Never Cleaning Up Old Images

After a few months of updates, old images accumulate. A server running 10 apps with quarterly updates can waste 20+ GB on outdated images. Schedule regular cleanup.

### Forgetting About Multi-Stage Build Cache

If you build custom images on your server, the build cache grows quickly. Include `--type=build-cache` in your cleanup:

```bash
docker builder prune
```

### Pulling Images Over Metered Connections

Large images (Nextcloud, Immich, GitLab) can be 1-2 GB each. If your server has a bandwidth cap, plan updates during off-peak hours or pre-pull on a faster connection and transfer with `docker save/load`.

## Next Steps

- [Updating Docker Containers](/foundations/docker-updating) — the full update workflow
- [Docker Volumes](/foundations/docker-volumes) — manage persistent data
- [Docker Security](/foundations/docker-security) — secure your container setup

## FAQ

### How much disk space do Docker images use?

A typical self-hosting setup with 10-15 apps uses 5-15 GB for images. Individual images range from 30 MB (Redis) to 2+ GB (GitLab, Nextcloud). Run `docker system df` to check your current usage.

### Should I use `:latest` or pin versions?

Pin versions. Always. The `:latest` tag can change without warning, breaking your setup. Pin to the specific version you tested (e.g., `1.33.2`) and update deliberately.

### How often should I clean up images?

Weekly or after every batch of container updates. A cron job running `docker image prune -a -f` weekly keeps disk usage in check.

### What's the difference between `docker image prune` and `docker image prune -a`?

Without `-a`, only dangling images (untagged layers) are removed. With `-a`, all images not used by a running container are removed. Use `-a` for maximum space recovery.

### Can I use a private registry for my images?

Yes. You can run your own registry with `docker run -d -p 5000:5000 registry:2` or use a cloud registry (GHCR, GitLab, etc.). Configure authentication in `~/.docker/config.json`.

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
- [Docker Networking](/foundations/docker-networking)
- [Updating Docker Containers](/foundations/docker-updating)
- [Docker Troubleshooting](/foundations/docker-troubleshooting)
- [Docker Security](/foundations/docker-security)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
