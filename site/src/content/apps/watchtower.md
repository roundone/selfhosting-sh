---
title: "How to Self-Host Watchtower with Docker"
description: "Set up Watchtower to automatically update your Docker containers when new images are available. Includes notifications, scheduling, and label filtering."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - watchtower
tags:
  - self-hosted
  - docker
  - watchtower
  - auto-update
  - container-management
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Watchtower?

[Watchtower](https://github.com/containrrr/watchtower) is a Docker container that monitors your running containers and automatically updates them when a new image is pushed to the registry. It pulls the latest version of each image, gracefully shuts down the existing container, and restarts it with the same configuration. There is no web UI — Watchtower runs as a background daemon and does its job silently unless you configure notifications.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 64 MB of free RAM
- Running containers you want to keep updated

## Docker Compose Configuration

Create a directory for the Watchtower configuration:

```bash
mkdir -p /opt/watchtower
cd /opt/watchtower
```

Create `docker-compose.yml`:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      # Check for updates every 24 hours (86400 seconds)
      WATCHTOWER_POLL_INTERVAL: "86400"
      # Remove old images after updating
      WATCHTOWER_CLEANUP: "true"
      # Timezone for scheduling and logs
      TZ: "America/New_York"
```

Start it:

```bash
docker compose up -d
```

That's it. Watchtower is now monitoring every running container on the host and will check for image updates every 24 hours.

## Initial Setup

There is no web UI, no setup wizard, and no default credentials. Watchtower starts working immediately after `docker compose up -d`. It connects to the Docker daemon via the mounted socket, enumerates all running containers, and begins its polling cycle.

To verify it is running:

```bash
docker logs watchtower
```

You should see output like:

```
time="2026-02-16T12:00:00Z" level=info msg="Watchtower 1.7.1"
time="2026-02-16T12:00:00Z" level=info msg="Using no notifications"
time="2026-02-16T12:00:00Z" level=info msg="Checking all containers (except explicitly disabled ones)"
time="2026-02-16T12:00:00Z" level=info msg="Scheduling first run: 2026-02-17 12:00:00 +0000 UTC"
```

## Configuration

### Core Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `WATCHTOWER_POLL_INTERVAL` | `86400` | Seconds between update checks. 86400 = 24 hours. |
| `WATCHTOWER_CLEANUP` | `false` | Set to `true` to remove old images after updating. Saves disk space. |
| `WATCHTOWER_INCLUDE_STOPPED` | `false` | Set to `true` to also update stopped containers. |
| `WATCHTOWER_INCLUDE_RESTARTING` | `false` | Set to `true` to also update restarting containers. |
| `WATCHTOWER_REVIVE_STOPPED` | `false` | Set to `true` to start stopped containers after updating. Only works with `WATCHTOWER_INCLUDE_STOPPED`. |
| `WATCHTOWER_NO_RESTART` | `false` | Pull new images but do not restart containers. Useful for manual restarts. |
| `WATCHTOWER_LABEL_ENABLE` | `false` | When `true`, only updates containers with `com.centurylinklabs.watchtower.enable=true` label. |
| `WATCHTOWER_SCHEDULE` | (none) | Cron expression for when to check (overrides `POLL_INTERVAL`). Uses 6-field cron. |
| `WATCHTOWER_ROLLING_RESTART` | `false` | Restart containers one at a time instead of all at once. |
| `WATCHTOWER_TIMEOUT` | `10` | Seconds to wait before forcefully killing a container during stop. |
| `WATCHTOWER_HTTP_API_UPDATE` | `false` | Enable the HTTP API to trigger updates on demand. |
| `WATCHTOWER_HTTP_API_TOKEN` | (none) | Bearer token for the HTTP API. Required if HTTP API is enabled. |
| `TZ` | UTC | Timezone for log output and cron scheduling. |

### Controlling Update Frequency

The default 24-hour interval is sensible for most homelabs. For more control, use a cron schedule:

```yaml
environment:
  # Check every day at 4 AM
  WATCHTOWER_SCHEDULE: "0 0 4 * * *"
```

Watchtower uses a **6-field cron format** (seconds, minutes, hours, day-of-month, month, day-of-week), not the standard 5-field format. The first field is seconds.

### Cleaning Up Old Images

Always enable cleanup unless you have a specific reason to keep old images:

```yaml
environment:
  WATCHTOWER_CLEANUP: "true"
```

Without cleanup, old images accumulate and eat disk space. On a homelab running 20+ containers, this adds up fast.

## Advanced Configuration

### Label-Based Filtering

By default, Watchtower updates every running container. This is dangerous if you run anything in production. Use label filtering to control exactly which containers get updated:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_POLL_INTERVAL: "86400"
      WATCHTOWER_CLEANUP: "true"
      WATCHTOWER_LABEL_ENABLE: "true"
      TZ: "America/New_York"
```

Then add labels to the containers you want Watchtower to manage:

```yaml
# In another service's docker-compose.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2.1.1
    labels:
      - "com.centurylinklabs.watchtower.enable=true"
```

Containers without this label are ignored. This is the recommended approach — opt-in rather than opt-out.

To explicitly exclude a container when not using label-enable mode:

```yaml
labels:
  - "com.centurylinklabs.watchtower.enable=false"
```

### Monitoring Specific Containers by Name

You can pass container names as arguments to watch only those containers:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_CLEANUP: "true"
      TZ: "America/New_York"
    command: uptime-kuma jellyfin vaultwarden
```

Only the named containers will be monitored. This is an alternative to label filtering but less flexible — you must update the Watchtower compose file whenever you add or remove containers.

### Email Notifications

Get notified when Watchtower updates a container:

```yaml
environment:
  WATCHTOWER_NOTIFICATIONS: "email"
  WATCHTOWER_NOTIFICATION_EMAIL_FROM: "watchtower@yourdomain.com"
  WATCHTOWER_NOTIFICATION_EMAIL_TO: "you@yourdomain.com"
  WATCHTOWER_NOTIFICATION_EMAIL_SERVER: "smtp.yourdomain.com"
  WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PORT: "587"
  WATCHTOWER_NOTIFICATION_EMAIL_SERVER_USER: "watchtower@yourdomain.com"
  WATCHTOWER_NOTIFICATION_EMAIL_SERVER_PASSWORD: "your-smtp-password"
  WATCHTOWER_NOTIFICATION_EMAIL_DELAY: "2"
```

### Slack Notifications

```yaml
environment:
  WATCHTOWER_NOTIFICATIONS: "slack"
  WATCHTOWER_NOTIFICATION_SLACK_HOOK_URL: "https://hooks.slack.com/services/xxx/yyy/zzz"
  WATCHTOWER_NOTIFICATION_SLACK_IDENTIFIER: "watchtower"
  WATCHTOWER_NOTIFICATION_SLACK_CHANNEL: "#homelab"
```

### Gotify Notifications

If you self-host [Gotify](https://gotify.net/) for push notifications:

```yaml
environment:
  WATCHTOWER_NOTIFICATIONS: "gotify"
  WATCHTOWER_NOTIFICATION_GOTIFY_URL: "https://gotify.yourdomain.com"
  WATCHTOWER_NOTIFICATION_GOTIFY_TOKEN: "your-gotify-app-token"
```

### Discord Notifications via Shoutrrr

Watchtower uses [Shoutrrr](https://containrrr.dev/shoutrrr/) for notification routing. For Discord and other services not covered by built-in types:

```yaml
environment:
  WATCHTOWER_NOTIFICATIONS: "shoutrrr"
  WATCHTOWER_NOTIFICATION_URL: "discord://token@webhookid"
```

Shoutrrr supports Discord, Telegram, Pushover, Matrix, Microsoft Teams, and many more. See the [Shoutrrr docs](https://containrrr.dev/shoutrrr/v0.8/services/overview/) for URL formats.

### HTTP API for On-Demand Updates

Enable the HTTP API to trigger updates manually or from CI/CD pipelines:

```yaml
services:
  watchtower:
    image: containrrr/watchtower:1.7.1
    container_name: watchtower
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      WATCHTOWER_HTTP_API_UPDATE: "true"
      WATCHTOWER_HTTP_API_TOKEN: "a-secure-token-you-generate"
      WATCHTOWER_CLEANUP: "true"
      TZ: "America/New_York"
```

Trigger an update:

```bash
curl -H "Authorization: Bearer a-secure-token-you-generate" http://localhost:8080/v1/update
```

This is useful for CI/CD pipelines: push a new image, then poke Watchtower to deploy it immediately rather than waiting for the next poll.

### Private Registry Authentication

If your containers use images from private registries, mount your Docker credentials:

```yaml
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
  - /root/.docker/config.json:/config.json:ro
environment:
  DOCKER_CONFIG: "/config.json"
```

Or use environment variables for a single registry:

```yaml
environment:
  REPO_USER: "your-username"
  REPO_PASS: "your-password"
```

## Backup

Watchtower is stateless. It stores no data, no database, and no configuration files beyond the Docker Compose file itself. Back up your `docker-compose.yml` and you can recreate Watchtower in seconds. There is nothing else to preserve.

## Troubleshooting

### Watchtower not updating a specific container

**Symptom:** Other containers update but one specific container is always skipped.

**Fix:** Check the image tag. Watchtower compares the local image digest with the remote digest. If you pinned the container to a specific version tag (e.g., `immich:v1.99.0`), Watchtower will not update to `v1.100.0` — it only checks the same tag for changes. Watchtower updates images when the same tag points to a new digest, not when a new tag is released. If you want automatic major version updates, use a rolling tag like `:release` or `:stable` (where the upstream project provides one).

### Containers restarting in the wrong order

**Symptom:** After an update, dependent services fail because they started before their dependencies.

**Fix:** Watchtower does not understand `depends_on` or startup ordering. Use `WATCHTOWER_ROLLING_RESTART: "true"` to update one container at a time. For services with strict ordering dependencies, consider excluding them from Watchtower and updating them manually.

### "Could not do a head request" errors in logs

**Symptom:** Log shows `Could not do a head request for [image]: ... unauthorized`.

**Fix:** The image is in a private registry and Watchtower lacks credentials. Mount your Docker config (see Private Registry Authentication above) or set `REPO_USER` and `REPO_PASS`. For GitHub Container Registry, generate a personal access token with `read:packages` scope.

### High disk usage after running Watchtower

**Symptom:** Disk usage grows steadily over time.

**Fix:** Enable `WATCHTOWER_CLEANUP: "true"`. Without this, old images are kept after updates. To clean up existing dangling images:

```bash
docker image prune -f
```

### Watchtower updates itself and loses configuration

**Symptom:** Watchtower updates its own container and restarts, but environment variables are lost.

**Fix:** This should not happen if you deployed Watchtower with Docker Compose — the compose file defines the environment variables, and Docker re-applies them on restart. If you started Watchtower with `docker run`, the environment variables are part of the container definition and will be preserved when Watchtower recreates it. If you are seeing this, verify your compose file has all environment variables defined and restart Watchtower from the compose file: `docker compose up -d --force-recreate`.

## Resource Requirements

- **RAM:** ~15 MB idle. Spikes briefly during update checks depending on the number of monitored containers.
- **CPU:** Negligible. Watchtower sleeps between polls and only wakes to check digests.
- **Disk:** <20 MB for the container image. No persistent data.

## Verdict

Watchtower is the simplest way to keep your self-hosted containers updated. For a homelab where you run 10-30 containers and want them to stay current without manual intervention, it is the right tool.

**Use it for homelabs.** Automatic updates mean you get security patches and bug fixes without thinking about it. Enable notifications so you know what changed, and enable cleanup so old images do not fill your disk.

**Be cautious in production.** Automatic, unattended updates to production services are risky. An upstream breaking change will propagate to your server without warning. If you run anything mission-critical, use `WATCHTOWER_LABEL_ENABLE` to limit which containers are auto-updated, or use [Diun](/apps/diun) instead — it notifies you about available updates without applying them, so you stay in control of when updates happen.

For most self-hosters, Watchtower with label filtering and notifications is the ideal setup: auto-update the things that are safe to update, get notified about everything, and manually handle the rest.

## Frequently Asked Questions

### Does Watchtower update containers that use pinned version tags?

Watchtower checks if the digest behind a tag has changed. If you pin to `nginx:1.25.3`, it will update if the `1.25.3` tag is rebuilt (e.g., for a security patch), but it will not upgrade you to `1.26.0`. If you want automatic version upgrades, use a broader tag like `nginx:1` or `nginx:stable`.

### Can Watchtower cause downtime?

Yes. Watchtower stops the old container, pulls the new image, and starts a new container. There is a brief window of downtime during this process. For zero-downtime updates, you need a load balancer and blue-green deployment — which is outside Watchtower's scope.

### Should I let Watchtower update itself?

By default, Watchtower monitors all containers including itself. This is generally fine — Watchtower is a simple, stateless tool. If you prefer to control Watchtower's own version, exclude it with a label: `com.centurylinklabs.watchtower.enable=false` (when using label-enable mode, simply omit the enable label).

### What is the difference between Watchtower and Diun?

Watchtower automatically pulls new images and restarts containers. [Diun](/apps/diun) only notifies you that an update is available — it never touches your running containers. Use Watchtower for hands-off updates. Use Diun when you want to review and apply updates manually. See our [Watchtower vs Diun comparison](/compare/watchtower-vs-diun).

### Does Watchtower work with Docker Compose?

Watchtower works at the Docker daemon level, not the Compose level. It sees and updates individual containers regardless of whether they were created via `docker compose`, `docker run`, or any other tool. When it updates a container originally created by Compose, the container retains its Compose labels and configuration.

## Related

- [How to Self-Host Portainer](/apps/portainer)
- [How to Self-Host Dockge](/apps/dockge)
- [Watchtower vs Diun](/compare/watchtower-vs-diun)
- [Best Self-Hosted Docker Management](/best/docker-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes and Storage](/foundations/docker-volumes)
- [Docker Networking](/foundations/docker-networking)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
