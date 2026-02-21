---
title: "Docker Multi-Architecture Images Explained"
description: "Understand Docker multi architecture images — how they work, checking ARM support, QEMU emulation, and building multi-arch images for self-hosting."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "arm", "multi-arch"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Multi-Architecture Images?

Docker containers are compiled for specific CPU architectures. An image built for x86_64 (Intel/AMD) will not run natively on ARM64 (Raspberry Pi, Apple Silicon). Docker multi architecture images solve this by bundling platform-specific variants under a single image tag. When you pull `nginx:1.27`, Docker automatically selects the variant matching your CPU — no extra flags, no separate image names.

This matters for self-hosting because ARM hardware is everywhere. Raspberry Pi 4 and 5 boards are popular entry points. Apple Silicon Macs run ARM64 natively. Oracle Cloud's free tier offers ARM instances. If you grab an image that only supports x86_64 and try to run it on a Pi, it either fails immediately or crawls through QEMU emulation at a fraction of native speed.

Most popular self-hosted apps now publish multi-arch images that include both `linux/amd64` and `linux/arm64` variants. Always verify this before deploying — it takes one command and saves hours of debugging.

## Prerequisites

- Docker installed on your server — see [Docker Compose Basics](/foundations/docker-compose-basics/)
- Basic understanding of Docker images — see [Docker Image Management](/foundations/docker-image-management/)
- Familiarity with Dockerfiles — see [Dockerfile Basics](/foundations/dockerfile-basics/)
- SSH access to your server — see [SSH Setup](/foundations/ssh-setup/)

## How Docker Handles Architectures

Docker uses a system called **manifest lists** (also known as OCI image indexes) to support multiple architectures under one tag. A manifest list is a pointer that maps platform identifiers to platform-specific image digests.

When you run:

```bash
docker pull immich-app/server:v1.99.0
```

Docker sends your platform information (`linux/amd64`, `linux/arm64`, etc.) to the registry. The registry looks up the manifest list for that tag, finds the matching variant, and returns the correct image layers.

The common platform identifiers you will encounter:

| Platform | Hardware | Examples |
|----------|----------|----------|
| `linux/amd64` | 64-bit Intel/AMD | Most servers, desktops, cloud VMs |
| `linux/arm64` | 64-bit ARM | Raspberry Pi 4/5 (64-bit OS), Apple Silicon, Oracle ARM |
| `linux/arm/v7` | 32-bit ARM | Raspberry Pi 3 (32-bit OS), older Pi 4 installs |
| `linux/arm/v6` | Older 32-bit ARM | Raspberry Pi Zero, Pi 1 |
| `linux/386` | 32-bit x86 | Legacy hardware (rare) |

**Key point:** `linux/arm64` and `linux/arm/v7` are different. A Raspberry Pi 4 running 64-bit Raspberry Pi OS uses `linux/arm64`. The same Pi running 32-bit Raspberry Pi OS uses `linux/arm/v7`. Use 64-bit OS on Pi 4 and Pi 5 — always. The 32-bit ecosystem is shrinking, and many images no longer publish `arm/v7` variants.

## Checking Image Architecture Support

Before deploying any image on ARM hardware, verify it supports your architecture. The `docker manifest inspect` command shows exactly which platforms an image supports.

### Using docker manifest inspect

```bash
docker manifest inspect --verbose vaultwarden/server:1.33.2
```

This outputs a JSON array with one entry per supported platform. The key fields are `platform.architecture` and `platform.os`:

```json
[
  {
    "Ref": "docker.io/vaultwarden/server:1.33.2@sha256:abc123...",
    "Descriptor": {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:abc123...",
      "size": 1234,
      "platform": {
        "architecture": "amd64",
        "os": "linux"
      }
    }
  },
  {
    "Ref": "docker.io/vaultwarden/server:1.33.2@sha256:def456...",
    "Descriptor": {
      "mediaType": "application/vnd.oci.image.manifest.v1+json",
      "digest": "sha256:def456...",
      "size": 1234,
      "platform": {
        "architecture": "arm64",
        "os": "linux"
      }
    }
  }
]
```

If you see both `amd64` and `arm64` in the output, the image supports both architectures natively. No emulation needed.

### Quick one-liner check

To get just the architectures without the full JSON:

```bash
docker manifest inspect vaultwarden/server:1.33.2 | grep -o '"architecture": "[^"]*"' | sort -u
```

Output:

```
"architecture": "amd64"
"architecture": "arm64"
```

### Using docker buildx imagetools

An alternative that shows cleaner output:

```bash
docker buildx imagetools inspect vaultwarden/server:1.33.2
```

Output:

```
Name:      docker.io/vaultwarden/server:1.33.2
MediaType: application/vnd.oci.image.index.v1+json
Manifests:
  Name:        docker.io/vaultwarden/server:1.33.2@sha256:abc123...
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/amd64

  Name:        docker.io/vaultwarden/server:1.33.2@sha256:def456...
  MediaType:   application/vnd.oci.image.manifest.v1+json
  Platform:    linux/arm64
```

### Checking on Docker Hub

On the Docker Hub web interface, each tag page lists supported architectures as badges (e.g., `linux/amd64`, `linux/arm64`, `linux/arm/v7`). This is a fast visual check, but `docker manifest inspect` is the authoritative source.

## Running x86 Images on ARM (QEMU)

Sometimes the app you need does not publish ARM images. QEMU user-mode emulation lets Docker run x86_64 images on ARM hardware (and vice versa) by translating CPU instructions on the fly.

**Be upfront about performance:** QEMU emulation is slow. Expect 5-20x performance overhead compared to native execution. It is a workaround, not a solution. Use it for lightweight tools or testing. Do not run a database or media transcoder under emulation.

### Installing QEMU Support

On Debian/Ubuntu (including Raspberry Pi OS):

```bash
sudo apt update
sudo apt install -y qemu-user-static binfmt-support
```

Or use Docker's convenience image, which registers QEMU binary handlers with the kernel:

```bash
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```

Verify it worked:

```bash
docker run --rm --platform linux/amd64 alpine:3.21 uname -m
```

If this outputs `x86_64` on your ARM machine, QEMU emulation is working.

### Using the --platform Flag

Force Docker to pull and run a specific platform variant:

```bash
docker run --rm --platform linux/amd64 some-x86-only-app:1.0.0
```

In Docker Compose, set the platform per service:

```yaml
services:
  some-app:
    image: some-x86-only-app:1.0.0
    platform: linux/amd64
    restart: unless-stopped
```

### When QEMU Is Acceptable

| Use Case | QEMU OK? | Why |
|----------|----------|-----|
| Low-traffic web dashboard | Yes | Minimal CPU, mostly idle |
| CLI tool that runs occasionally | Yes | Short-lived, not performance-critical |
| Database (PostgreSQL, MariaDB) | No | Constant I/O, significant overhead |
| Media transcoding (Jellyfin, Plex) | No | CPU-intensive, unusably slow |
| Build tools, compilers | No | Heavy CPU workloads |

**The rule:** If the app sits idle 90% of the time and handles light requests, QEMU is tolerable. If it does sustained work, find a native ARM image or run it on x86 hardware.

## Common Architecture Issues

### exec format error

```
exec /usr/local/bin/app: exec format error
```

This means the image binary was compiled for a different CPU architecture than the host. Docker pulled the wrong platform variant, or the image only supports one architecture.

**Fix:** Check the image architectures with `docker manifest inspect`. If your platform is not listed, either find an alternative image, build from source for your architecture, or use QEMU (see above).

### Image Pulls the Wrong Architecture

Docker usually detects the host platform correctly, but in some edge cases (misconfigured buildx, proxied registries), it pulls the wrong variant.

Force the correct platform:

```bash
docker pull --platform linux/arm64 nginx:1.27
```

Or in Compose:

```yaml
services:
  nginx:
    image: nginx:1.27
    platform: linux/arm64
```

### Slow Performance on ARM

If a container runs but performs poorly on ARM, check whether it is running under QEMU emulation:

```bash
docker inspect <container_id> | grep -i platform
```

If the image platform does not match your host, you are running under emulation. Find a native ARM image.

### segfault or Illegal Instruction

Some images include binaries with CPU-specific optimizations (AVX, SSE4) that do not translate through QEMU. These crash with segfaults or `Illegal instruction` errors. There is no fix — you need a native ARM build.

## Finding ARM-Compatible Self-Hosted Apps

Most mainstream self-hosted apps publish multi-arch images. Here is how to check:

### Apps With Excellent ARM64 Support

These popular self-hosted apps all publish native `linux/arm64` images:

- **Vaultwarden** — `vaultwarden/server` (amd64, arm64, armv7, armv6)
- **Uptime Kuma** — `louislam/uptime-kuma` (amd64, arm64, armv7)
- **Pi-hole** — `pihole/pihole` (amd64, arm64, armv7)
- **AdGuard Home** — `adguard/adguardhome` (amd64, arm64, armv7)
- **Nextcloud** — `nextcloud` (amd64, arm64)
- **Jellyfin** — `jellyfin/jellyfin` (amd64, arm64)
- **Home Assistant** — `ghcr.io/home-assistant/home-assistant` (amd64, arm64, armv7)
- **Gitea** — `gitea/gitea` (amd64, arm64)
- **Traefik** — `traefik` (amd64, arm64, armv7)
- **Caddy** — `caddy` (amd64, arm64, armv7)
- **FreshRSS** — `freshrss/freshrss` (amd64, arm64)
- **Paperless-ngx** — `ghcr.io/paperless-ngx/paperless-ngx` (amd64, arm64)
- **Actual Budget** — `actualbudget/actual-server` (amd64, arm64)

### Apps With Limited or No ARM Support

Some apps do not publish ARM images. Common reasons: complex native dependencies, small development teams, or build infrastructure that only targets x86.

Before giving up, check:

1. **LinuxServer.io images** — The LSIO team repackages many apps with multi-arch support. Their images follow the naming pattern `lscr.io/linuxserver/<app>` and almost always include `linux/arm64`.

2. **Community forks** — Search Docker Hub or GitHub for `<app-name> arm64`. Community members often maintain ARM builds.

3. **Build from source** — If the app is written in Go, Rust, or Python, building a native ARM image from the Dockerfile is often straightforward (see the Building Multi-Arch Images section below).

### Checking Before You Deploy

Make this part of your deployment workflow on ARM hardware:

```bash
#!/bin/bash
# check-arch.sh — Verify an image supports your platform
IMAGE=$1
PLATFORM=$(docker info --format '{{.Architecture}}')

echo "Host platform: $PLATFORM"
echo "Checking $IMAGE..."

if docker manifest inspect "$IMAGE" 2>/dev/null | grep -q "\"architecture\": \"$PLATFORM\""; then
    echo "Native support confirmed."
else
    echo "WARNING: No native $PLATFORM image found. Will use QEMU emulation or fail."
fi
```

Usage:

```bash
chmod +x check-arch.sh
./check-arch.sh vaultwarden/server:1.33.2
```

## Building Multi-Arch Images (docker buildx)

When you need to build your own images — custom Dockerfiles, app forks, or apps without published ARM images — `docker buildx` handles multi-architecture builds.

### Setting Up buildx

`buildx` ships with Docker Desktop and as a plugin with Docker CE. Verify it is installed:

```bash
docker buildx version
```

Create a builder instance that supports multi-platform builds:

```bash
docker buildx create --name multiarch --driver docker-container --bootstrap --use
```

Verify the builder supports the platforms you need:

```bash
docker buildx inspect --bootstrap
```

Look for `Platforms:` in the output. It should list `linux/amd64`, `linux/arm64`, and others.

### Building for Multiple Architectures

Build and push a multi-arch image from a Dockerfile:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag your-registry/your-app:1.0.0 \
  --push \
  .
```

Key flags:

- `--platform` — Comma-separated list of target platforms
- `--tag` — The image name and tag
- `--push` — Push directly to a registry (required for multi-arch; local Docker cannot store multi-platform images without a registry)

To load a single-platform image locally (for testing):

```bash
docker buildx build \
  --platform linux/arm64 \
  --tag your-app:1.0.0-arm64 \
  --load \
  .
```

### Cross-Compilation vs Emulation

`buildx` can build ARM images on an x86 host two ways:

1. **QEMU emulation** — Runs the entire build under emulation. Slow but works for anything.
2. **Cross-compilation** — The build runs natively on x86 but produces ARM binaries. Fast but requires the Dockerfile to support it.

For Go and Rust apps, cross-compilation is straightforward. Use the `TARGETPLATFORM` and `TARGETARCH` build arguments that `buildx` injects automatically:

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.23-alpine AS builder

ARG TARGETARCH

WORKDIR /app
COPY . .

RUN GOARCH=$TARGETARCH go build -o /app/server .

FROM alpine:3.21
COPY --from=builder /app/server /usr/local/bin/server
ENTRYPOINT ["/usr/local/bin/server"]
```

This Dockerfile builds natively on the host CPU but produces a binary for the target architecture. A full multi-arch build completes in seconds instead of minutes.

### Building From App Source

If an app does not publish ARM images but has a Dockerfile in its repository:

```bash
git clone https://github.com/some-org/some-app.git
cd some-app

# Build for arm64 only
docker buildx build \
  --platform linux/arm64 \
  --tag some-app:custom-arm64 \
  --load \
  .
```

This works for most Go, Rust, Python, and Node.js apps. C/C++ apps may need additional cross-compilation toolchains.

## Practical Examples

### Running Vaultwarden on Raspberry Pi 5

Vaultwarden publishes native ARM64 images. On a Pi 5 running 64-bit Raspberry Pi OS:

```bash
# Verify ARM support
docker manifest inspect vaultwarden/server:1.33.2 | grep architecture
```

```yaml
# docker-compose.yml
services:
  vaultwarden:
    image: vaultwarden/server:1.33.2
    container_name: vaultwarden
    restart: unless-stopped
    environment:
      DOMAIN: "https://vault.yourdomain.com"
      SIGNUPS_ALLOWED: "false"
    volumes:
      - vw-data:/data
    ports:
      - "8080:80"

volumes:
  vw-data:
```

```bash
docker compose up -d
```

This pulls the `linux/arm64` variant automatically. No QEMU, no `platform` directive, native performance.

### Running Pi-hole on Raspberry Pi 4

```bash
# Verify
docker manifest inspect pihole/pihole:2024.07.0 | grep architecture
```

```yaml
# docker-compose.yml
services:
  pihole:
    image: pihole/pihole:2024.07.0
    container_name: pihole
    restart: unless-stopped
    environment:
      TZ: "America/New_York"
      WEBPASSWORD: "change-this-strong-password"
    volumes:
      - pihole-data:/etc/pihole
      - dnsmasq-data:/etc/dnsmasq.d
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "8080:80/tcp"

volumes:
  pihole-data:
  dnsmasq-data:
```

### Forcing an x86 Image on ARM (QEMU Fallback)

If you must run an x86-only app on ARM hardware:

```yaml
# docker-compose.yml
services:
  x86-only-app:
    image: some-x86-only-app:1.0.0
    platform: linux/amd64
    container_name: x86-app
    restart: unless-stopped
    ports:
      - "9090:8080"
```

This requires QEMU to be installed (see the QEMU section above). Performance will be significantly degraded.

## Common Mistakes

### Not checking architecture before deploying on ARM

The most common mistake. People buy a Raspberry Pi, follow a Docker Compose guide written for x86, and get `exec format error` on startup. Always run `docker manifest inspect` first on ARM hardware. It takes five seconds and prevents hours of confusion.

### Using 32-bit OS on Raspberry Pi 4 or 5

Pi 4 and Pi 5 have 64-bit ARM CPUs but Raspberry Pi OS historically defaulted to 32-bit. Running 32-bit OS means you need `linux/arm/v7` images, which many apps no longer publish. Flash 64-bit Raspberry Pi OS and use `linux/arm64` images exclusively.

### Running databases under QEMU emulation

PostgreSQL, MariaDB, and Redis under QEMU emulation are painfully slow — 10-20x overhead on write-heavy workloads. These services always need native images. Every major database publishes ARM64 images.

### Assuming all tags support the same architectures

An image might publish multi-arch for the `latest` tag but only `linux/amd64` for specific version tags, or vice versa. Always verify the specific version tag you plan to use.

### Forgetting to set up QEMU after a reboot

The `docker run --privileged multiarch/qemu-user-static` method registers QEMU handlers with the kernel, but these registrations do not survive a reboot. Either install `qemu-user-static` via your package manager (which persists across reboots) or add the Docker QEMU command to a startup script.

### Building multi-arch images without --push

`docker buildx build --platform linux/amd64,linux/arm64 --load` does not work. Multi-platform images must be pushed to a registry. Use `--push` for multi-platform builds or `--load` for single-platform local testing.

## Next Steps

- Learn Dockerfile fundamentals in [Dockerfile Basics](/foundations/dockerfile-basics/)
- Understand image lifecycle in [Docker Image Management](/foundations/docker-image-management/)
- Set up a Raspberry Pi or ARM server using [Getting Started with Self-Hosting](/foundations/getting-started/)
- Troubleshoot container issues with [Docker Troubleshooting](/foundations/docker-troubleshooting/)
- Run virtual machines alongside Docker with [Proxmox Basics](/foundations/proxmox-basics/)

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Image Management](/foundations/docker-image-management/)
- [Dockerfile Basics](/foundations/dockerfile-basics/)
- [Docker Troubleshooting](/foundations/docker-troubleshooting/)
- [Proxmox Basics](/foundations/proxmox-basics/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [Docker Networking](/foundations/docker-networking/)

## FAQ

### Do I need to do anything special to run Docker on ARM?

No. Docker Engine installs the same way on ARM64 as on x86_64. Use Docker's official repository for your distro. The only difference is that you need to verify image architecture support before pulling — some images only publish x86_64 variants. Docker itself handles architecture detection and image selection automatically.

### Can I run all self-hosted apps on a Raspberry Pi?

Most popular self-hosted apps publish ARM64 images and run natively on Pi 4 and Pi 5. The limiting factor is usually RAM and CPU power, not architecture compatibility. A Pi 5 with 8 GB RAM can comfortably run 5-10 lightweight services like Vaultwarden, Pi-hole, Uptime Kuma, and FreshRSS. Resource-heavy apps like Nextcloud with many users or Jellyfin with hardware transcoding may struggle.

### How much slower is QEMU emulation compared to native?

Expect 5-20x slower execution depending on the workload. Simple web servers and CLI tools see roughly 5x overhead. CPU-intensive tasks like compilation or database queries see 15-20x overhead. QEMU translates every CPU instruction at runtime, so any sustained computation is dramatically slower. Always prefer native ARM images.

### Should I use linux/arm64 or linux/arm/v7 on my Raspberry Pi?

Use `linux/arm64` on Pi 4 and Pi 5 with 64-bit Raspberry Pi OS. Use `linux/arm/v7` only if you are running 32-bit OS on Pi 3 or older. If you are setting up a new Pi, always choose the 64-bit OS image — the `arm64` ecosystem has better support, more images, and receives more attention from app maintainers.

### Can I build images for ARM on my x86 development machine?

Yes. Install QEMU support and use `docker buildx` to build multi-platform images. For Go and Rust apps, use cross-compilation in your Dockerfile (see the `TARGETARCH` example above) for near-native build speeds. For other languages, `buildx` uses QEMU emulation during the build, which is slower but produces working ARM images.
