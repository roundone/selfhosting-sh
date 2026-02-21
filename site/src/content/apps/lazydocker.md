---
title: "How to Set Up Lazydocker"
description: "Install and configure Lazydocker, a terminal UI for managing Docker containers, images, volumes, and logs without memorizing CLI commands."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - lazydocker
tags:
  - self-hosted
  - docker
  - lazydocker
  - terminal-ui
  - container-management
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Lazydocker?

[Lazydocker](https://github.com/jesseduffield/lazydocker) is a terminal UI (TUI) for Docker that puts container management, log viewing, resource monitoring, and image cleanup into a single keyboard-driven interface. It's `htop` for Docker — no web UI, no browser, just an efficient terminal dashboard. If you SSH into your servers and want instant Docker visibility without typing `docker ps`, `docker logs`, and `docker stats` repeatedly, Lazydocker is the tool.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker installed ([guide](/foundations/docker-compose-basics/))
- Terminal access (SSH or local)

## Installation

Lazydocker is a standalone binary, not a long-running Docker service. You have three installation options:

### Option 1: Direct Binary (Recommended)

```bash
# Download the latest release
curl -fsSL https://github.com/jesseduffield/lazydocker/releases/download/v0.24.4/lazydocker_0.24.4_Linux_x86_64.tar.gz | tar xz -C /usr/local/bin lazydocker
```

For ARM64 (Raspberry Pi, Oracle Cloud):

```bash
curl -fsSL https://github.com/jesseduffield/lazydocker/releases/download/v0.24.4/lazydocker_0.24.4_Linux_arm64.tar.gz | tar xz -C /usr/local/bin lazydocker
```

Verify the installation:

```bash
lazydocker --version
```

### Option 2: Docker Compose (Run as Container)

If you prefer running Lazydocker as a container:

```yaml
services:
  lazydocker:
    image: lazyteam/lazydocker:v0.24.4
    container_name: lazydocker
    stdin_open: true
    tty: true
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - lazydocker-config:/root/.config/lazydocker
    restart: "no"

volumes:
  lazydocker-config:
```

Run it interactively:

```bash
docker compose run --rm lazydocker
```

**Note:** Running Lazydocker in a container is less convenient than the binary install. The binary gives you instant `lazydocker` from any terminal session. The container approach requires `docker compose run` each time.

### Option 3: Go Install

If you have Go installed:

```bash
go install github.com/jesseduffield/lazydocker@v0.24.4
```

## Using Lazydocker

Launch it:

```bash
lazydocker
```

The interface has three panels:

- **Left sidebar:** Lists containers, images, volumes, and networks
- **Main panel:** Details for the selected item (logs, stats, config, env vars)
- **Bottom bar:** Keyboard shortcuts for the current context

### Key Shortcuts

| Key | Action |
|-----|--------|
| `↑`/`↓` | Navigate items |
| `←`/`→` | Switch panels |
| `Enter` | Expand/collapse |
| `d` | Remove container/image/volume |
| `s` | Stop container |
| `r` | Restart container |
| `a` | Attach to container shell |
| `l` | View logs (follow mode) |
| `[` / `]` | Switch tabs (logs, stats, config, env) |
| `b` | Bulk actions |
| `x` | Open menu |
| `q` | Quit |

## Configuration

Lazydocker stores its config at `~/.config/lazydocker/config.yml`. Key settings:

```yaml
# ~/.config/lazydocker/config.yml
gui:
  # Show all containers (including stopped)
  showAllContainers: true
  # Scroll speed for logs
  scrollHeight: 2
  # Theme
  theme:
    activeBorderColor:
      - green
      - bold
    inactiveBorderColor:
      - white

logs:
  # Number of log lines to show
  timestamps: true
  since: "60m"

# Custom commands accessible via 'x' menu
commandTemplates:
  - title: "Docker Compose Up"
    command: "docker compose up -d"
  - title: "Prune All"
    command: "docker system prune -af"
```

### Custom Commands

One of Lazydocker's best features — define custom commands that appear in the context menu:

```yaml
commandTemplates:
  - title: "View full logs"
    command: "docker logs --tail 1000 {{ .Container.ID }}"
  - title: "Exec bash"
    command: "docker exec -it {{ .Container.ID }} /bin/bash"
  - title: "Inspect"
    command: "docker inspect {{ .Container.ID }} | less"
```

Templates use Go template syntax with access to container, image, and volume properties.

## Advanced Configuration (Optional)

### Shell Alias

Add to your `~/.bashrc` or `~/.zshrc` for quick access:

```bash
alias lzd='lazydocker'
```

### SSH Integration

Lazydocker works perfectly over SSH. For low-bandwidth connections, it's much more efficient than a web UI like Portainer. No port forwarding needed — just SSH in and run `lazydocker`.

### Docker Context Support

If you manage multiple Docker hosts via Docker contexts, Lazydocker uses the active context:

```bash
docker context use my-remote-server
lazydocker  # Now shows containers from the remote server
```

## Backup

Nothing to back up. Lazydocker is a stateless tool — its only persistent data is the config file at `~/.config/lazydocker/config.yml`. Back that up if you've customized it, but there's no database or application state.

## Troubleshooting

### Permission denied accessing Docker socket

**Symptom:** `Got permission denied while trying to connect to the Docker daemon socket`

**Fix:** Add your user to the docker group:
```bash
sudo usermod -aG docker $USER
# Log out and back in for the change to take effect
```

### Terminal rendering issues

**Symptom:** UI looks garbled or characters don't display correctly.

**Fix:** Ensure your terminal supports UTF-8 and uses a modern terminal emulator. Set:
```bash
export LANG=en_US.UTF-8
```
If using tmux, add to `~/.tmux.conf`:
```
set -g default-terminal "screen-256color"
```

### Lazydocker doesn't show all containers

**Symptom:** Stopped containers are hidden.

**Fix:** Press `a` to toggle showing all containers, or set in config:
```yaml
gui:
  showAllContainers: true
```

### High CPU usage

**Symptom:** Lazydocker uses significant CPU.

**Fix:** Increase the stats polling interval in the config. The default refreshes frequently:
```yaml
stats:
  graphs:
    minDuration: "10m"
```

### Cannot attach to container

**Symptom:** Pressing `a` to attach shows an error.

**Fix:** The container must have a shell installed. Alpine-based containers need `/bin/sh` instead of `/bin/bash`. Lazydocker tries common shells automatically, but some minimal containers have no shell at all.

## Resource Requirements

- **RAM:** ~10-20 MB (it's a Go binary)
- **CPU:** Negligible when idle, light polling for stats
- **Disk:** ~15 MB (binary only)

## Verdict

Lazydocker is the best Docker management tool for terminal users. It does one thing — gives you a visual overview of your Docker environment in the terminal — and does it excellently. No web UI overhead, no Docker socket exposed to a browser-accessible service, no additional container running 24/7.

It's **not a replacement** for Portainer or Dockge — you can't deploy new stacks or manage Compose files through it. It's a complement: use Dockge or Portainer for deployment, Lazydocker for day-to-day monitoring and quick actions over SSH.

**Install it on every server you manage.** It takes 10 seconds and makes Docker management significantly faster.

## Frequently Asked Questions

### Is Lazydocker a Docker container?

No. Lazydocker is a standalone Go binary that talks to the Docker socket directly. You can run it in a container, but the binary install is simpler and more practical.

### Can Lazydocker deploy new containers?

No. It manages existing containers — start, stop, restart, remove, view logs. For deploying new containers, use [Dockge](/apps/dockge/), [Portainer](/apps/portainer/), or Docker Compose directly.

### Does Lazydocker work with Docker Compose?

Yes. Lazydocker recognizes Compose projects and groups containers by their project name. You can see which containers belong to the same stack.

### Can I use Lazydocker remotely?

Yes, via SSH. Just SSH into the server and run `lazydocker`. No port forwarding or VPN needed. You can also use Docker contexts to manage remote hosts.

### How does Lazydocker compare to `ctop`?

Lazydocker is more feature-rich. `ctop` shows container metrics (like `top` for containers). Lazydocker adds log viewing, image management, volume management, container shell access, and custom commands.

## Related

- [How to Self-Host Portainer](/apps/portainer/)
- [How to Self-Host Dockge](/apps/dockge/)
- [How to Self-Host Yacht](/apps/yacht/)
- [Portainer vs Dockge](/compare/portainer-vs-dockge/)
- [Best Docker Management Tools](/best/docker-management/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Docker Networking](/foundations/docker-networking/)
