---
title: "Systemd Services for Self-Hosting"
description: "Learn how to create, manage, and troubleshoot systemd services on Linux — essential for running self-hosted apps that start on boot."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["linux", "systemd", "services", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is systemd?

systemd is the init system and service manager on modern Linux distributions (Ubuntu, Debian, Fedora, Arch). It starts your system, manages background services (daemons), handles logging, and controls the boot process. For self-hosting, systemd ensures your services start automatically after a reboot and restart if they crash.

Docker Compose handles container lifecycle, but systemd manages Docker itself and anything running outside containers — monitoring scripts, backup cron alternatives, VPN clients, and custom automation.

## Prerequisites

- A Linux server running a systemd-based distro (Ubuntu 20.04+, Debian 11+, Fedora 38+)
- SSH access with sudo privileges ([SSH Setup Guide](/foundations/ssh-setup/))
- Basic terminal skills ([Linux Basics](/foundations/linux-basics-self-hosting/))

## Essential systemctl Commands

`systemctl` is the command-line tool for interacting with systemd:

```bash
# Check if a service is running
systemctl status docker

# Start a service
sudo systemctl start docker

# Stop a service
sudo systemctl stop docker

# Restart a service (stop + start)
sudo systemctl restart docker

# Reload config without full restart (if supported)
sudo systemctl reload nginx

# Enable service to start on boot
sudo systemctl enable docker

# Disable service from starting on boot
sudo systemctl disable docker

# Enable AND start in one command
sudo systemctl enable --now docker

# Check if a service is enabled
systemctl is-enabled docker

# Check if a service is active
systemctl is-active docker

# List all running services
systemctl list-units --type=service --state=running

# List all failed services
systemctl list-units --type=service --state=failed
```

## Understanding Service States

| State | Meaning |
|-------|---------|
| `active (running)` | Service is running normally |
| `active (exited)` | Service ran and completed (one-shot) |
| `inactive (dead)` | Service is stopped |
| `failed` | Service crashed or failed to start |
| `activating (start)` | Service is in the process of starting |
| `deactivating (stop)` | Service is shutting down |

Check detailed status with:

```bash
systemctl status docker
# ● docker.service - Docker Application Container Engine
#      Loaded: loaded (/lib/systemd/system/docker.service; enabled)
#      Active: active (running) since Sun 2026-02-16 08:00:00 UTC; 2h ago
#    Main PID: 1234 (dockerd)
#       Tasks: 45
#      Memory: 128.5M
#         CPU: 1min 23s
#      CGroup: /system.slice/docker.service
#              └─1234 /usr/bin/dockerd
```

## Creating a Custom Service

### Service Unit File Structure

Service files live in `/etc/systemd/system/` and have three sections:

```ini
[Unit]
Description=My Self-Hosted App
Documentation=https://example.com/docs
After=network-online.target docker.service
Wants=network-online.target
Requires=docker.service

[Service]
Type=simple
User=appuser
Group=appuser
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/start.sh
ExecStop=/opt/myapp/stop.sh
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Section Breakdown

**[Unit]** — metadata and dependencies:

| Directive | Purpose |
|-----------|---------|
| `Description` | Human-readable name shown in `systemctl status` |
| `After` | Start this service after the listed units |
| `Wants` | Soft dependency — try to start these, but don't fail if they don't |
| `Requires` | Hard dependency — fail if these aren't available |

**[Service]** — how to run the service:

| Directive | Purpose |
|-----------|---------|
| `Type` | `simple` (default), `forking`, `oneshot`, `notify` |
| `User` / `Group` | Run as this user (never run services as root unless required) |
| `WorkingDirectory` | Set the working directory before starting |
| `ExecStart` | The command to start the service |
| `ExecStop` | Command to stop (optional — systemd sends SIGTERM by default) |
| `Restart` | `on-failure`, `always`, `on-abnormal`, `no` |
| `RestartSec` | Wait this many seconds before restarting |
| `Environment` | Set environment variables: `Environment=PORT=8080` |
| `EnvironmentFile` | Load env vars from file: `EnvironmentFile=/opt/myapp/.env` |

**[Install]** — when to start:

| Directive | Purpose |
|-----------|---------|
| `WantedBy=multi-user.target` | Start in normal multi-user mode (standard for servers) |
| `WantedBy=graphical.target` | Start when GUI is available (desktop systems) |

### Practical Example: Docker Compose as a systemd Service

If you want your Docker Compose stack to start on boot and restart on failure:

```ini
# /etc/systemd/system/myapp-docker.service
[Unit]
Description=MyApp Docker Compose Stack
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/myapp
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=120

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myapp-docker.service
```

**Note:** Docker Compose has its own restart policies (`restart: unless-stopped`), which handle container restarts. This systemd unit is for bringing the whole stack up on boot or after Docker itself restarts.

### Practical Example: Backup Script as a Service

Run a backup script with a timer instead of cron:

```ini
# /etc/systemd/system/backup.service
[Unit]
Description=Nightly Backup Job
After=docker.service

[Service]
Type=oneshot
User=backup
ExecStart=/opt/scripts/backup.sh
StandardOutput=journal
StandardError=journal
```

```ini
# /etc/systemd/system/backup.timer
[Unit]
Description=Run backup nightly at 2 AM

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer

# Check timer status
systemctl list-timers
```

`Persistent=true` means if the server was off at 2 AM, the backup runs as soon as the server starts.

## Viewing Logs with journalctl

systemd captures all service output in the journal:

```bash
# View logs for a specific service
journalctl -u docker.service

# Follow logs in real time (like tail -f)
journalctl -u docker.service -f

# Show logs since last boot
journalctl -u docker.service -b

# Show logs from the last hour
journalctl -u docker.service --since "1 hour ago"

# Show logs from a specific date
journalctl -u docker.service --since "2026-02-16 08:00" --until "2026-02-16 12:00"

# Show only errors
journalctl -u docker.service -p err

# Show last 50 lines
journalctl -u docker.service -n 50

# Show logs for all Docker containers
journalctl CONTAINER_NAME=mycontainer

# Check disk usage of journal
journalctl --disk-usage

# Trim journal to 500 MB
sudo journalctl --vacuum-size=500M
```

## systemd Timers vs Cron

systemd timers are the modern replacement for cron. Advantages:

| Feature | Cron | systemd Timer |
|---------|------|--------------|
| Logging | Must configure manually | Automatic via journalctl |
| Missed runs | Skipped | `Persistent=true` catches up |
| Dependencies | None | Can require network, Docker, etc. |
| Random delay | Not built-in | `RandomizedDelaySec` built-in |
| Resource control | None | Full cgroup support |
| Status checking | `crontab -l` | `systemctl list-timers` |

**Recommendation:** Use systemd timers for server tasks. Use cron only when you need something simpler or are on a system without systemd (rare for self-hosting).

## Common Mistakes

### 1. Forgetting daemon-reload After Editing Unit Files

After creating or modifying any unit file, you must reload:

```bash
sudo systemctl daemon-reload
```

Without this, systemd uses the cached version and your changes don't take effect.

### 2. Using Type=simple for Forking Processes

If your process forks into the background, use `Type=forking`. With `Type=simple`, systemd expects the main process to stay in the foreground. If it forks, systemd thinks it exited and marks the service as failed.

### 3. Not Setting Restart Policies

Without `Restart=on-failure`, your service won't restart if it crashes. Always set a restart policy for long-running services:

```ini
Restart=on-failure
RestartSec=5
```

### 4. Running Services as Root

Never run services as root unless absolutely necessary. Use the `User` and `Group` directives:

```ini
[Service]
User=appuser
Group=appuser
```

### 5. Ignoring Failed Services

Check for failed services regularly:

```bash
systemctl --failed
```

A failed service usually means something needs attention — a config error, missing dependency, or permission issue.

## Hardening Services

For services exposed to the network, add these security directives:

```ini
[Service]
# Prevent writing to /usr, /boot, /etc
ProtectSystem=strict

# Make /home, /root, /run/user inaccessible
ProtectHome=true

# Private /tmp for this service
PrivateTmp=true

# No access to hardware devices
PrivateDevices=true

# Only allow specific directories to be writable
ReadWritePaths=/opt/myapp/data

# Restrict system calls
SystemCallFilter=@system-service
```

## FAQ

### Should I use systemd or Docker restart policies?

Use both. Docker's `restart: unless-stopped` handles container crashes. A systemd unit for your Docker Compose stack handles system reboots and ensures the stack starts in the right order relative to Docker itself.

### How do I debug a service that won't start?

Run `systemctl status myservice` for the immediate error, then `journalctl -u myservice -n 50 --no-pager` for full logs. Check file permissions on the ExecStart binary and WorkingDirectory.

### Can I run Docker Compose stacks without systemd?

Yes — Docker's restart policies handle most cases. systemd units are useful when you want explicit boot ordering, resource limits, or integration with other systemd services.

### How do I limit a service's memory or CPU usage?

Add resource limits in the [Service] section: `MemoryMax=512M` and `CPUQuota=50%`. This uses Linux cgroups under the hood.

### Where should I put custom service files?

Always in `/etc/systemd/system/`. Never modify files in `/lib/systemd/system/` — package updates will overwrite them.

## Next Steps

- [Linux Cron Jobs](/foundations/linux-cron-jobs/) — alternative task scheduling
- [Docker Compose Basics](/foundations/docker-compose-basics/) — container orchestration
- [Monitoring Your Home Server](/foundations/monitoring-basics/) — track service health

## Related

- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Linux File Permissions](/foundations/linux-permissions/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [SSH Setup Guide](/foundations/ssh-setup/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
