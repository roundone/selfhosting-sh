---
title: "tmux and screen for Server Management"
description: "Use tmux and GNU screen to run persistent terminal sessions on your server. Keep processes alive after disconnecting from SSH."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["tmux", "screen", "terminal", "ssh", "linux"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Terminal Multiplexers?

tmux and GNU screen are terminal multiplexers — they let you run multiple terminal sessions inside a single SSH connection, and those sessions persist even if you disconnect. Close your laptop, lose your WiFi, or intentionally log out — your processes keep running.

This is essential for self-hosting. Long-running tasks like database migrations, large file transfers, or Docker image builds shouldn't die when your SSH connection drops.

## Prerequisites

- SSH access to your server ([SSH Setup](/foundations/ssh-setup/))
- Basic Linux command line skills ([Linux Basics](/foundations/linux-basics-self-hosting/))

## tmux (Recommended)

tmux is the modern choice. It's more feature-rich, better maintained, and has a larger community than screen.

### Installation

```bash
# Debian/Ubuntu
sudo apt install tmux

# Fedora
sudo dnf install tmux

# Arch
sudo pacman -S tmux
```

### Core Concepts

| Concept | What It Is |
|---------|-----------|
| Session | A collection of windows. Persists after you disconnect. |
| Window | A single terminal within a session. Like browser tabs. |
| Pane | A split within a window. Side-by-side or stacked terminals. |

### Essential Commands

**Starting and attaching:**

```bash
# Start a new named session
tmux new -s server

# Detach from session (session keeps running)
# Press: Ctrl+b, then d

# List sessions
tmux ls

# Reattach to a session
tmux attach -t server

# Kill a session
tmux kill-session -t server
```

**Windows (tabs):**

All tmux commands start with the prefix key: `Ctrl+b`

| Keys | Action |
|------|--------|
| `Ctrl+b c` | Create new window |
| `Ctrl+b n` | Next window |
| `Ctrl+b p` | Previous window |
| `Ctrl+b 0-9` | Switch to window by number |
| `Ctrl+b ,` | Rename current window |
| `Ctrl+b &` | Close current window |

**Panes (splits):**

| Keys | Action |
|------|--------|
| `Ctrl+b %` | Split vertically (left/right) |
| `Ctrl+b "` | Split horizontally (top/bottom) |
| `Ctrl+b ←↑↓→` | Move between panes |
| `Ctrl+b x` | Close current pane |
| `Ctrl+b z` | Toggle pane zoom (fullscreen) |
| `Ctrl+b Space` | Cycle through pane layouts |

### Practical Self-Hosting Workflow

A typical tmux session for managing a self-hosted server:

```bash
# Create a session with named windows
tmux new -s homelab

# Window 0: Docker management
# (you're already here)
docker ps

# Create window 1: logs
# Ctrl+b c
docker compose -f /srv/nextcloud/docker-compose.yml logs -f

# Create window 2: monitoring
# Ctrl+b c
htop

# Create window 3: file management
# Ctrl+b c
cd /srv
```

Now you can switch between windows with `Ctrl+b 0` through `Ctrl+b 3`, disconnect with `Ctrl+b d`, come back later with `tmux attach -t homelab`, and everything is exactly where you left it.

### tmux Configuration

Create `~/.tmux.conf` for a better experience:

```bash
# Enable mouse support (click to switch panes/windows, scroll)
set -g mouse on

# Start window numbering at 1 (easier to reach on keyboard)
set -g base-index 1
setw -g pane-base-index 1

# Increase scrollback buffer
set -g history-limit 50000

# Better status bar
set -g status-style 'bg=colour235 fg=colour136'
set -g status-left '#[fg=colour46][#S] '
set -g status-right '%H:%M %d-%b'

# Reload config without restarting tmux
# Ctrl+b then :source-file ~/.tmux.conf
```

Reload the config in a running session: `Ctrl+b` then type `:source-file ~/.tmux.conf`

## GNU screen (Legacy Alternative)

screen is older and simpler. It's pre-installed on many systems, making it useful when you can't install packages.

### Installation

```bash
# Often pre-installed. If not:
sudo apt install screen  # Debian/Ubuntu
sudo dnf install screen  # Fedora
```

### Essential Commands

```bash
# Start a named session
screen -S server

# Detach
# Press: Ctrl+a, then d

# List sessions
screen -ls

# Reattach
screen -r server

# Reattach (force detach other clients first)
screen -dr server
```

**Inside screen:**

| Keys | Action |
|------|--------|
| `Ctrl+a c` | Create new window |
| `Ctrl+a n` | Next window |
| `Ctrl+a p` | Previous window |
| `Ctrl+a "` | List windows |
| `Ctrl+a k` | Kill current window |
| `Ctrl+a d` | Detach from session |
| `Ctrl+a S` | Split horizontally |
| `Ctrl+a |` | Split vertically |
| `Ctrl+a Tab` | Move between splits |

## tmux vs screen

| Feature | tmux | screen |
|---------|------|--------|
| Active development | Yes | Minimal |
| Pane splits | Native, easy | Basic, awkward |
| Mouse support | Built-in | Limited |
| Scripting | Powerful | Basic |
| Config file | `~/.tmux.conf` | `~/.screenrc` |
| Pre-installed | Rarely | Often |
| Session sharing | Easy | Possible |
| Scrollback | Better | Basic |

**Recommendation:** Use tmux for new setups. Use screen only if tmux isn't available and you can't install it.

## When to Use tmux/screen vs Other Tools

| Scenario | Best Tool |
|----------|-----------|
| Long-running Docker build | tmux session |
| Monitoring multiple services | tmux with panes |
| Quick one-off background task | `nohup command &` or `command &; disown` |
| Persistent service | systemd unit file |
| Database migration | tmux session |
| rsync large transfer | tmux session |

For permanent background services, use [systemd](/foundations/linux-systemd/) instead of tmux. tmux is for interactive or temporary long-running tasks.

## Common Mistakes

### Forgetting to Detach Before Closing Terminal

If you close your terminal window without detaching (`Ctrl+b d`), your tmux session still runs. But if you had an interactive process that depended on the terminal (rare with tmux, but possible), it might behave unexpectedly. Always detach properly.

### Nested tmux Sessions

SSH into a server that auto-starts tmux, then run `tmux` inside it. Now `Ctrl+b` goes to the inner session. To send commands to the outer session, press `Ctrl+b` twice. Better: don't nest sessions. Attach to the existing one instead.

### Not Using Named Sessions

`tmux new` without a name creates sessions numbered 0, 1, 2. After a few sessions, you won't remember which is which. Always name them: `tmux new -s purpose`.

### Running Services in tmux Instead of systemd

tmux sessions survive SSH disconnects, but they don't survive server reboots. For services that should always be running, write a [systemd unit file](/foundations/linux-systemd/) instead.

## Next Steps

- Set up proper service management with [systemd](/foundations/linux-systemd/)
- Improve your SSH workflow with [SSH Setup](/foundations/ssh-setup/)
- Learn more Linux basics at [Linux Basics](/foundations/linux-basics-self-hosting/)

## FAQ

### Does tmux survive a server reboot?

No. tmux sessions are lost on reboot. For processes that must start automatically after a reboot, use [systemd](/foundations/linux-systemd/). Use tmux for interactive sessions and temporary long-running tasks.

### Can multiple users share a tmux session?

Yes. Another user can attach to the same session with `tmux attach -t session_name`. Both users see the same terminal in real time. Useful for pair debugging on a server.

### How do I scroll up in tmux?

Press `Ctrl+b [` to enter copy mode, then use arrow keys or Page Up/Down to scroll. Press `q` to exit copy mode. With mouse mode enabled (`set -g mouse on`), you can scroll with your mouse wheel.

### Should I use tmux or just run Docker in the background?

`docker compose up -d` runs containers in the background already — you don't need tmux for that. Use tmux for interactive tasks like watching logs (`docker compose logs -f`), running database migrations, or managing multiple terminal tasks simultaneously.

## Related

- [Linux systemd](/foundations/linux-systemd/)
- [SSH Setup](/foundations/ssh-setup/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Linux Text Editors](/foundations/linux-text-editors/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
