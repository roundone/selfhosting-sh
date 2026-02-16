---
title: "Docker vs Podman for Self-Hosting"
description: "Docker vs Podman compared for self-hosting — architecture, rootless support, Compose compatibility, and which container runtime to choose for your home server."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "docker", "podman", "containers", "rootless"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Quick Verdict

Docker is the better choice for most self-hosters. The ecosystem is larger, nearly every self-hosted app ships a Docker Compose file, and community support is unmatched. Podman is the better choice if rootless containers and systemd integration matter more to you than ecosystem convenience. This docker vs podman comparison covers the practical differences that actually affect running self-hosted services.

## What Is Docker?

Docker is the container runtime that made containerization mainstream. It uses a client-server architecture: the `docker` CLI talks to the Docker daemon (`dockerd`), which manages containers, images, volumes, and networks. Docker Compose — bundled as a plugin since v2 — lets you define multi-container stacks in a YAML file and manage them as a unit.

For self-hosting, Docker is the de facto standard. When an app's README says "deploy with Docker," they mean Docker specifically. The `docker-compose.yml` files you find in nearly every self-hosted project are written for Docker Compose.

See [Docker Compose Basics](/foundations/docker-compose-basics) for a full setup guide.

## What Is Podman?

Podman is a container runtime developed by Red Hat as a drop-in replacement for Docker. The name stands for **Pod Manager**. It runs OCI-compatible containers — the same images that work with Docker work with Podman. The critical architectural difference: Podman is daemonless and rootless by default.

Podman ships as the default container runtime on RHEL, CentOS Stream, Fedora, and their derivatives. It's available on Ubuntu, Debian, and Arch through package managers.

```bash
# Install on Ubuntu/Debian
sudo apt install -y podman

# Install on Fedora/RHEL
sudo dnf install -y podman

# Verify
podman --version
```

## Key Differences

### Daemon vs Daemonless

Docker requires a long-running daemon (`dockerd`) with root privileges. Every `docker` CLI command communicates with this daemon over a Unix socket. If the daemon crashes, all running containers stop.

Podman has no daemon. Each container runs as a direct child process of the Podman command that started it. No central process means no single point of failure — but it also means containers don't automatically restart after a reboot unless you integrate with an init system like systemd.

| Aspect | Docker | Podman |
|--------|--------|--------|
| Architecture | Client-daemon | Daemonless (fork-exec) |
| Background process | `dockerd` runs continuously | None |
| Daemon crash impact | All containers stop | N/A — no daemon |
| Auto-restart after reboot | Built-in (`restart: unless-stopped`) | Requires systemd units |

**What this means in practice:** Docker's daemon approach is simpler for self-hosting. You set `restart: unless-stopped` and containers come back after a reboot or crash automatically. With Podman, you generate systemd unit files or use Quadlet to get the same behavior. It works, but it's an extra step.

### Root vs Rootless

Docker traditionally runs as root. The daemon needs root to manage networking, cgroups, and bind to privileged ports. You can add your user to the `docker` group to avoid typing `sudo`, but this effectively grants root-equivalent access — anyone in the `docker` group can escalate to root trivially.

Docker does support rootless mode (`dockerd-rootless-setuptool.sh`), but it's opt-in, less tested, and some features don't work — notably, binding to ports below 1024 and certain networking configurations.

Podman runs rootless by default. Each user gets their own container storage in `~/.local/share/containers/`. Containers run under your user's UID with no privilege escalation path. This is a genuine security advantage.

```bash
# Podman — runs as your user, no sudo
podman run -d -p 8080:80 docker.io/library/nginx:1.27

# Docker — needs daemon running as root (or user in docker group)
docker run -d -p 8080:80 nginx:1.27
```

**What this means in practice:** For a home server behind a firewall, Docker's root daemon is an acceptable risk — the convenience is worth it. For an internet-facing server, or if you run untrusted containers, Podman's rootless default is meaningfully more secure. See [Docker Security Best Practices](/foundations/docker-security) for hardening either runtime.

### Compose Support

Docker Compose is mature, well-documented, and the default way to deploy self-hosted apps. Every `docker-compose.yml` you find online is written for it.

Podman has two options for Compose-style workflows:

1. **`podman-compose`** — A third-party Python tool that translates `docker-compose.yml` files into Podman commands. It handles most simple stacks but can break on advanced features like custom networks, health check dependencies, and build contexts.

2. **`podman compose`** (Podman 4.7+) — A built-in subcommand that wraps `docker-compose` or `podman-compose` as a backend. If Docker Compose v2 binary is installed alongside Podman, `podman compose` uses it directly — giving you full compatibility.

```bash
# Option 1: Install podman-compose
pip install podman-compose

# Deploy a stack
podman-compose -f docker-compose.yml up -d

# Option 2: Use podman compose (needs docker-compose binary installed)
# Install docker-compose-plugin standalone binary, then:
podman compose up -d
```

**What this means in practice:** Simple stacks (app + database) work fine with `podman-compose`. Complex stacks with multiple networks, health check dependencies, or init containers may need troubleshooting. If you want zero friction with existing `docker-compose.yml` files, Docker is the safer bet.

### Ecosystem and Community

This is where Docker wins decisively for self-hosting:

- **Documentation:** Nearly every self-hosted app documents Docker setup. Podman instructions are rare.
- **Tutorials:** Searching "self-host [app]" returns Docker guides 95% of the time.
- **Troubleshooting:** When something breaks, Docker error messages return more Stack Overflow results.
- **Tools:** Management UIs like Portainer, Dockge, and Yacht are built for Docker. Podman support is partial or nonexistent in most of them.
- **Watchtower/container updates:** Watchtower, the most popular auto-updater, only works with Docker. Podman users need `podman auto-update` with specific image label requirements.

### Image Compatibility

Both Docker and Podman run OCI-compatible container images. Any image on Docker Hub, GitHub Container Registry (ghcr.io), or Quay.io works with both runtimes. You pull, run, and manage images the same way.

The one difference: Podman requires fully-qualified image names by default. Docker assumes Docker Hub when you type `nginx:1.27`. Podman asks you to specify the registry or configure `unqualified-search-registries` in `/etc/containers/registries.conf`.

```bash
# Docker — Docker Hub is implicit
docker pull nginx:1.27

# Podman — fully qualified by default
podman pull docker.io/library/nginx:1.27

# Or configure Podman to search Docker Hub automatically:
# Add to /etc/containers/registries.conf:
# unqualified-search-registries = ["docker.io"]
```

### Systemd Integration

Podman's strongest advantage over Docker is native systemd integration. Since Podman containers are regular processes (no daemon), they map naturally to systemd services. Podman can generate unit files from running containers:

```bash
# Start a container
podman run -d --name uptime-kuma -p 3001:3001 \
  -v uptime-kuma:/app/data \
  docker.io/louislam/uptime-kuma:1.23.15

# Generate a systemd user service
podman generate systemd --new --name uptime-kuma \
  > ~/.config/systemd/user/container-uptime-kuma.service

# Enable it to start at boot
systemctl --user daemon-reload
systemctl --user enable --now container-uptime-kuma.service

# Enable lingering so user services start without login
loginctl enable-linger $USER
```

**Quadlet (Podman 4.4+):** The newer, recommended approach replaces `podman generate systemd` with declarative `.container` files:

```ini
# ~/.config/containers/systemd/uptime-kuma.container
[Container]
Image=docker.io/louislam/uptime-kuma:1.23.15
PublishPort=3001:3001
Volume=uptime-kuma.volume:/app/data

[Service]
Restart=always

[Install]
WantedBy=default.target
```

```bash
systemctl --user daemon-reload
systemctl --user start uptime-kuma
```

Docker doesn't have anything this clean for systemd integration. You either rely on the daemon's built-in restart policies or write your own systemd units around `docker start`.

## Migration from Docker to Podman

If you want to switch an existing Docker setup to Podman:

**1. Install Podman alongside Docker:**

```bash
sudo apt install -y podman
```

**2. Alias docker to podman (optional):**

```bash
# Add to ~/.bashrc
alias docker=podman
```

**3. Migrate volumes:** Podman uses different storage paths. Export and reimport your data:

```bash
# Export data from Docker volume
docker run --rm -v myapp-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/myapp-data.tar.gz -C /data .

# Import into Podman volume
podman volume create myapp-data
podman run --rm -v myapp-data:/data -v $(pwd):/backup \
  docker.io/library/alpine tar xzf /backup/myapp-data.tar.gz -C /data
```

**4. Recreate containers:** Use `podman-compose` or Quadlet files (shown above) with your existing `docker-compose.yml`.

**5. Set up auto-start:** Generate systemd units or write Quadlet files for every container that needs to survive reboots.

**Honest assessment:** Migrating is doable but tedious. If Docker is working and you're not hitting a specific limitation it has, the migration cost isn't worth it for most self-hosters.

## Running Self-Hosted Apps with Podman

Here's a practical example: deploying a Nextcloud stack with Podman using `podman-compose`.

```yaml
# docker-compose.yml — works with podman-compose
services:
  nextcloud:
    image: docker.io/library/nextcloud:29.0
    container_name: nextcloud
    ports:
      - "8080:80"
    environment:
      - MYSQL_HOST=db
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=changeme-nextcloud-pw
    volumes:
      - nextcloud-data:/var/www/html
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: docker.io/library/mariadb:11.4
    container_name: nextcloud-db
    environment:
      - MYSQL_ROOT_PASSWORD=changeme-root-pw
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_PASSWORD=changeme-nextcloud-pw
    volumes:
      - nextcloud-db:/var/lib/mysql
    restart: unless-stopped

volumes:
  nextcloud-data:
  nextcloud-db:
```

```bash
podman-compose up -d
podman-compose ps
```

**Key differences you'll notice:**

- Use fully qualified image names (`docker.io/library/nextcloud:29.0` instead of `nextcloud:29.0`)
- `restart: unless-stopped` is ignored by Podman — you need systemd units for auto-restart
- Inter-container DNS works differently. If containers can't resolve each other by name, create a Podman network explicitly:

```bash
podman network create nextcloud-net
podman-compose --podman-run-args="--network nextcloud-net" up -d
```

### Podman Play Kube

Podman can also run Kubernetes YAML manifests directly with `podman play kube`. This is useful if you want Kubernetes-format definitions without running a full cluster:

```yaml
# nextcloud-pod.yml
apiVersion: v1
kind: Pod
metadata:
  name: nextcloud-pod
spec:
  containers:
    - name: nextcloud
      image: docker.io/library/nextcloud:29.0
      ports:
        - containerPort: 80
          hostPort: 8080
      volumeMounts:
        - name: nc-data
          mountPath: /var/www/html
    - name: db
      image: docker.io/library/mariadb:11.4
      env:
        - name: MYSQL_ROOT_PASSWORD
          value: changeme-root-pw
        - name: MYSQL_DATABASE
          value: nextcloud
      volumeMounts:
        - name: db-data
          mountPath: /var/lib/mysql
  volumes:
    - name: nc-data
      persistentVolumeClaim:
        claimName: nextcloud-data
    - name: db-data
      persistentVolumeClaim:
        claimName: nextcloud-db
```

```bash
podman play kube nextcloud-pod.yml
```

This is a niche feature. Most self-hosters won't use it, but it's a stepping stone if you plan to migrate to Kubernetes later.

## Performance Comparison

Both runtimes use the same underlying Linux kernel features (namespaces, cgroups, overlay filesystems). Container runtime performance is effectively identical once a container is running. The differences are in startup and management overhead:

| Metric | Docker | Podman |
|--------|--------|--------|
| Container startup time | ~200-400ms | ~200-400ms |
| Image pull speed | Same (same registries) | Same |
| Runtime CPU overhead | Negligible + daemon overhead | Negligible, no daemon |
| Memory overhead | ~50-100 MB for daemon | No daemon overhead |
| Rootless performance | Slight overhead (slirp4netns) | Slight overhead (slirp4netns) |
| I/O performance | Native | Native |

The daemon overhead is the only measurable difference. Docker's `dockerd` process uses 50-100 MB of RAM. On a server with 4+ GB, this is irrelevant. On a Raspberry Pi with 1 GB, it's noticeable. Podman saves that memory since there's no daemon.

Rootless networking adds overhead in both runtimes. Both use `slirp4netns` or `pasta` for rootless network namespaces, which is slower than root-mode bridged networking. For most self-hosted apps, the difference is imperceptible.

## Common Mistakes

### Assuming Podman Is a Drop-In Replacement

The CLI is compatible (`podman run` mirrors `docker run`), but the operational model differs. Containers don't auto-restart without systemd integration. Networking behaves differently in rootless mode. Docker Compose files may need adjustments. Test every stack before committing to a migration.

### Using podman-compose for Complex Stacks

`podman-compose` handles simple stacks well. Multi-network setups, health check dependencies, `depends_on` conditions, and build contexts can fail silently or behave differently. If your stack is complex, use `podman compose` with the Docker Compose v2 binary as the backend, or convert to Quadlet files.

### Forgetting Lingering for Rootless Podman

Rootless Podman containers run in a user session. When you log out, systemd stops your user services — and your containers die. Enable lingering to keep user services running:

```bash
loginctl enable-linger $USER
```

Without this, your self-hosted services will stop every time your SSH session ends.

### Running Docker and Podman Simultaneously

Both can coexist on the same machine, but they have separate storage, separate networks, and separate volume management. A volume created in Docker is invisible to Podman and vice versa. Pick one runtime for production use. Running both leads to confusion about which runtime manages which container.

### Ignoring Fully Qualified Image Names

Podman's default behavior of requiring `docker.io/library/nginx:1.27` instead of `nginx:1.27` trips up Docker users constantly. Either configure `unqualified-search-registries` in `/etc/containers/registries.conf` or always use full registry paths in your Compose files — which is a good practice regardless of runtime.

## Next Steps

- Set up your container runtime with [Docker Compose Basics](/foundations/docker-compose-basics)
- Secure your containers with [Docker Security Best Practices](/foundations/docker-security)
- Learn container networking with [Docker Networking](/foundations/docker-networking)
- Understand container logs with [Container Logging](/foundations/container-logging)
- Explore systemd service management with [Linux Systemd Basics](/foundations/linux-systemd)

## Related

- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Security Best Practices](/foundations/docker-security)
- [Docker Networking](/foundations/docker-networking)
- [Container Logging and Debugging](/foundations/container-logging)
- [Linux Systemd Basics](/foundations/linux-systemd)
- [LXC Containers](/foundations/lxc-containers)

## FAQ

### Can I use the same docker-compose.yml with Podman?

Yes, for most simple stacks. Use `podman-compose` or install the Docker Compose v2 binary and run `podman compose`. Simple configurations (app + database + volumes) work without changes. Complex setups with custom networks, build stages, or health check dependencies may need adjustments. Always use fully qualified image names (`docker.io/library/` prefix) for reliability.

### Is Podman more secure than Docker?

In its default configuration, yes. Podman runs rootless by default, meaning a container escape doesn't grant root access to the host. Docker runs its daemon as root by default, and the `docker` group effectively grants root-equivalent access. However, Docker supports rootless mode as an opt-in feature, and proper Docker security practices (non-root containers, dropped capabilities, read-only filesystems) close much of the gap. See [Docker Security Best Practices](/foundations/docker-security).

### Should I switch from Docker to Podman?

Probably not, unless you have a specific reason. If Docker is working for your self-hosting setup, the migration cost (reconfiguring networking, setting up systemd units, troubleshooting Compose compatibility) outweighs the benefits for most home servers. Consider Podman if you're starting fresh on a RHEL/Fedora system where it's the default, if rootless security is a hard requirement, or if you want native systemd integration without a daemon.

### Does Portainer work with Podman?

Portainer requires the Docker socket API. You can expose a Podman socket that's API-compatible with Docker (`podman system service --time=0 unix:///run/podman/podman.sock`), and Portainer can connect to it. However, not all features work perfectly — some operations assume Docker-specific behavior. For a management UI with Podman, consider Cockpit with the Podman plugin, which is built specifically for it.

### Do Watchtower and other Docker tools work with Podman?

Watchtower does not work with Podman. For automated container updates with Podman, use `podman auto-update`, which checks for new images and recreates containers that have the `io.containers.autoupdate=registry` label. Most Docker-specific tooling (Watchtower, Dockge, Yacht) assumes the Docker daemon API. Some tools work through the Podman socket compatibility layer, but expect rough edges.
