---
title: "How to Self-Host DIUN with Docker Compose"
description: "Set up DIUN (Docker Image Update Notifier) to monitor Docker images for updates and get notified via Discord, Slack, Telegram, and more."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "docker-management"
apps:
  - diun
tags:
  - docker
  - diun
  - notifications
  - container-updates
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is DIUN?

[DIUN](https://github.com/crazy-max/diun) (Docker Image Update Notifier) monitors your Docker images and notifies you when a new version is available on the registry. Unlike [Watchtower](/apps/watchtower), which automatically pulls and restarts containers, DIUN only sends notifications — it never touches your running containers. This makes it the safer choice for production environments where you want to control exactly when and how updates are applied.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 128 MB of free RAM
- A notification endpoint (Discord webhook, Telegram bot, Slack webhook, email server, or similar)

## Docker Compose Configuration

Create a directory for DIUN and its configuration:

```bash
mkdir -p /opt/diun
cd /opt/diun
```

Create a `docker-compose.yml`:

```yaml
services:
  diun:
    image: crazymax/diun:4.31.0
    container_name: diun
    restart: unless-stopped
    volumes:
      - diun-data:/data
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./diun.yml:/diun.yml:ro
    environment:
      TZ: "America/New_York"           # Your timezone for cron scheduling
      DIUN_WATCH_SCHEDULE: "0 */6 * * *" # Check every 6 hours (cron syntax)
      DIUN_PROVIDERS_DOCKER: "true"    # Enable Docker provider (watch running containers)
      DIUN_WATCH_FIRSTCHECKNOTIF: "true" # Notify on first check (useful for initial setup verification)
    hostname: diun

volumes:
  diun-data:
    name: diun-data
```

Create the DIUN configuration file `diun.yml`:

```yaml
watch:
  schedule: "0 */6 * * *"
  firstCheckNotif: true
  runOnStartup: true

providers:
  docker:
    watchByDefault: true
    watchStopped: false

notif:
  discord:
    webhookURL: "https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"
    mentions:
      - "@everyone"
    renderFields: true
    timeout: 10s
```

Replace the Discord webhook URL with your own. See the Configuration section below for other notification providers.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. DIUN has no web UI. It runs as a background service and sends notifications through your configured channels.
2. On first start, DIUN scans all running containers (if the Docker provider is enabled) and records the current image digests in its database.
3. If `firstCheckNotif` is `true`, you'll receive a notification for every image found on the first run. This confirms your notification setup is working. Set it to `false` after verifying.
4. Check the logs to confirm everything is running:

```bash
docker compose logs -f diun
```

You should see lines like:

```
Cron triggered
Analyzing image ghcr.io/example/app:1.0.0 (from docker provider)
```

## Configuration

DIUN can be configured through the YAML config file (`diun.yml`), environment variables, or a combination of both. Environment variables override the config file. For complex setups, the YAML file is more readable.

### Watch Settings

```yaml
watch:
  schedule: "0 */6 * * *"  # Cron expression: check every 6 hours
  firstCheckNotif: false    # Notify on first discovery of an image
  runOnStartup: true        # Run a check immediately when DIUN starts
  compareDigest: true       # Compare image digests (not just tags)
```

The `schedule` field uses standard cron syntax. Common intervals:

| Schedule | Meaning |
|----------|---------|
| `0 */6 * * *` | Every 6 hours |
| `0 8 * * *` | Daily at 8 AM |
| `0 */12 * * *` | Every 12 hours |
| `0 8 * * 1` | Every Monday at 8 AM |

### Docker Provider

The Docker provider watches images used by running containers:

```yaml
providers:
  docker:
    watchByDefault: true     # Watch all containers unless explicitly excluded
    watchStopped: false      # Ignore stopped containers
```

To exclude specific containers from monitoring, add a label to those containers:

```yaml
# In the container's docker-compose.yml
services:
  some-app:
    image: some/app:1.0
    labels:
      diun.enable: "false"
```

To opt-in instead of opt-out, set `watchByDefault: false` and add `diun.enable: "true"` labels to containers you want monitored.

### Per-Container Watch Options

Fine-tune monitoring with Docker labels on individual containers:

```yaml
services:
  my-app:
    image: myapp/server:2.0.0
    labels:
      diun.enable: "true"
      diun.watch_repo: "true"       # Watch ALL tags in the repository
      diun.max_tags: 25             # Limit tags to watch when watch_repo is true
      diun.include_tags: "^\\d+\\.\\d+\\.\\d+$"  # Regex: only semver tags
      diun.exclude_tags: "^(latest|dev|nightly)"  # Regex: skip these tags
      diun.platform: "linux/amd64"  # Only watch this platform
```

### Notification Providers

DIUN supports many notification channels. Configure one or more in the `notif` section of `diun.yml`.

**Discord:**

```yaml
notif:
  discord:
    webhookURL: "https://discord.com/api/webhooks/ID/TOKEN"
    mentions:
      - "@everyone"
    renderFields: true
    timeout: 10s
```

**Telegram:**

```yaml
notif:
  telegram:
    token: "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
    chatIDs:
      - 123456789
    templateBody: |
      Docker tag {{ .Entry.Image }} {{ if (eq .Entry.Status "new") }}is available{{ else }}has been updated{{ end }} on {{ .Entry.Image.Domain }}.
```

**Slack:**

```yaml
notif:
  slack:
    webhookURL: "https://hooks.slack.com/services/T00/B00/XXXXX"
```

**ntfy:**

```yaml
notif:
  ntfy:
    endpoint: "https://ntfy.sh"
    topic: "diun-updates"
    priority: 3
    timeout: 10s
```

**Gotify:**

```yaml
notif:
  gotify:
    endpoint: "https://gotify.yourdomain.com"
    token: "YOUR_APP_TOKEN"
    priority: 5
    timeout: 10s
```

**Email (SMTP):**

```yaml
notif:
  mail:
    host: "smtp.gmail.com"
    port: 587
    ssl: false
    startTLS: true
    username: "your-email@gmail.com"
    password: "your-app-password"
    from: "diun@yourdomain.com"
    to:
      - "admin@yourdomain.com"
```

**Webhook (generic HTTP):**

```yaml
notif:
  webhook:
    endpoint: "https://your-server.com/webhook"
    method: "POST"
    headers:
      Authorization: "Bearer YOUR_TOKEN"
    timeout: 10s
```

You can configure multiple providers simultaneously. DIUN sends to all configured channels.

## Advanced Configuration

### Registry Provider (Watch Images Without Running Containers)

The Docker provider only watches images you are already running. The registry provider lets you monitor any image on any registry, even if you do not have a container for it:

```yaml
providers:
  docker:
    watchByDefault: true
  file:
    filename: /diun-images.yml
```

Create a `diun-images.yml` file and mount it into the container:

```yaml
- name: ghcr.io/immich-app/server
  watch_repo: true
  max_tags: 10
  include_tags:
    - "^v\\d+\\.\\d+\\.\\d+$"
- name: vaultwarden/server
  watch_repo: true
  max_tags: 5
  include_tags:
    - "^\\d+\\.\\d+\\.\\d+(-.*)?$"
- name: louislam/dockge
  watch_repo: true
  max_tags: 5
```

Update your `docker-compose.yml` to mount the images file:

```yaml
volumes:
  - diun-data:/data
  - /var/run/docker.sock:/var/run/docker.sock:ro
  - ./diun.yml:/diun.yml:ro
  - ./diun-images.yml:/diun-images.yml:ro
```

This is useful for tracking apps you plan to deploy or for monitoring upstream projects you depend on.

### Private Registry Authentication

To watch images on private registries, add registry credentials to your config:

```yaml
regopts:
  - name: "ghcr"
    selector: "ghcr.io"
    username: "your-github-username"
    password: "ghp_YOUR_PERSONAL_ACCESS_TOKEN"
  - name: "dockerhub"
    selector: "docker.io"
    username: "your-dockerhub-username"
    password: "your-dockerhub-token"
```

### Custom Notification Templates

DIUN uses Go templates for notification messages. Customize the output format:

```yaml
notif:
  discord:
    webhookURL: "https://discord.com/api/webhooks/ID/TOKEN"
    templateBody: |
      **{{ .Entry.Image }}** {{ if (eq .Entry.Status "new") }}🆕 NEW{{ else }}⬆️ UPDATED{{ end }}
      Platform: {{ .Entry.Platform }}
      Digest: {{ .Entry.Digest.Short }}
      Link: https://hub.docker.com/r/{{ .Entry.Image.Path }}
```

### Scheduling for Multiple Timezones

Set the `TZ` environment variable to match your local timezone so cron schedules align with your work hours:

```yaml
environment:
  TZ: "Europe/London"
  DIUN_WATCH_SCHEDULE: "0 9 * * 1-5"  # Weekdays at 9 AM London time
```

## Backup

DIUN stores its image digest database in the `/data` volume. This database tracks which image versions it has already notified you about, preventing duplicate notifications after a restart.

```bash
# Stop DIUN to ensure database consistency
docker compose stop diun

# Backup the data volume and config
tar czf diun-backup.tar.gz \
  /opt/diun/diun.yml \
  /opt/diun/docker-compose.yml

# Backup the named volume
docker run --rm -v diun-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/diun-data-volume.tar.gz -C /data .

# Restart
docker compose start diun
```

If you lose the database, DIUN treats every image as new on the next scan and sends notifications for all of them. This is annoying but not destructive — no data is lost, just noise in your notifications. The config file (`diun.yml`) is the critical piece to back up. See [Backup Strategy](/foundations/backup-3-2-1-rule).

## Troubleshooting

### No notifications received

**Symptom:** DIUN is running and scanning but no notifications arrive.

**Fix:** Check these in order:
1. Verify your notification config in `diun.yml`. A single typo in a webhook URL silently fails.
2. Check logs for notification errors: `docker compose logs diun | grep -i notif`
3. Set `firstCheckNotif: true` and `runOnStartup: true`, then restart. You should get notifications for all current images immediately.
4. Test your webhook URL independently (e.g., send a test message with curl to your Discord webhook).

### "Permission denied" accessing Docker socket

**Symptom:** Logs show `permission denied while trying to connect to the Docker daemon socket`.

**Fix:** Ensure the Docker socket is mounted with read access and the socket permissions on the host allow the container user:

```bash
ls -la /var/run/docker.sock
# Should show: srw-rw---- 1 root docker
```

If the DIUN container runs as a non-root user, add it to the docker group or mount the socket without `:ro` temporarily to debug.

### Duplicate notifications after restart

**Symptom:** Every restart triggers notifications for all monitored images.

**Fix:** The digest database is not persisting between restarts. Ensure the `/data` volume is correctly mounted:

```yaml
volumes:
  - diun-data:/data
```

Verify the named volume exists: `docker volume inspect diun-data`. If you used a bind mount, check that the host directory has correct permissions.

### DIUN only finds some containers

**Symptom:** Some running containers are not being monitored.

**Fix:** DIUN only discovers containers on the Docker daemon whose socket is mounted. If you use Docker networks with other Compose projects, the containers are still on the same daemon and should be visible. Check:
1. Verify `watchByDefault: true` in the Docker provider config.
2. Check if excluded containers have a `diun.enable: "false"` label.
3. Run `docker compose logs diun | grep -i "analyzing"` to see which images DIUN finds.

### High memory usage during large scans

**Symptom:** DIUN uses excessive memory when watching many images with `watch_repo: true`.

**Fix:** Limit the number of tags DIUN checks per repository:

```yaml
labels:
  diun.watch_repo: "true"
  diun.max_tags: 10
  diun.include_tags: "^v?\\d+\\.\\d+\\.\\d+$"
```

Setting `max_tags` and filtering with `include_tags` prevents DIUN from downloading manifests for hundreds of nightly/dev/RC tags.

## Resource Requirements

- **RAM:** ~20 MB idle, ~50 MB during a scan with 50+ images
- **CPU:** Negligible — spikes briefly during scheduled scans, idle otherwise
- **Disk:** <10 MB for the application, plus a few MB for the digest database

DIUN is one of the lightest self-hosted tools you can run. It has virtually no impact on your server.

## Frequently Asked Questions

### Does DIUN update my containers?

No. DIUN only notifies you that an update is available. It never pulls images, stops containers, or modifies your stack. You decide when and how to update. If you want automatic updates, use [Watchtower](/apps/watchtower) — but for production, notification-only is the safer approach.

### Can I use DIUN and Watchtower together?

Yes, but it is redundant. If Watchtower is already auto-updating your containers, DIUN notifications will tell you about updates that Watchtower will handle anyway. The more useful pattern is DIUN for production (notify, then manually update) and Watchtower for dev/testing environments (auto-update everything).

### Does DIUN need a web UI?

DIUN does not have a web UI. It is a background daemon that checks registries on a schedule and sends notifications. If you need a dashboard to see update status, consider pairing DIUN with [Portainer](/apps/portainer) or [Dockge](/apps/dockge) for container management, using DIUN purely for update alerts.

### How do I watch images from private registries?

Add your registry credentials under the `regopts` section in `diun.yml`. See the Advanced Configuration section above for examples with GitHub Container Registry and Docker Hub.

### Can DIUN monitor non-Docker images (Podman, Kubernetes)?

DIUN supports Docker, Podman (via the Docker-compatible socket), Swarm, Kubernetes, and Nomad as providers. For Kubernetes, use the `kubernetes` provider instead of `docker` and configure the appropriate kubeconfig.

## Verdict

DIUN is the right tool for anyone running self-hosted services in production. Auto-updating containers with [Watchtower](/apps/watchtower) is convenient for a homelab, but in any environment where stability matters, you want to know about updates before they happen — not after your containers have already been replaced. DIUN gives you exactly that: awareness without risk. It is tiny, reliable, and supports every notification channel you could want. Pair it with [Dockge](/apps/dockge) or [Portainer](/apps/portainer) for container management, and you have a complete Docker workflow where nothing updates without your knowledge. For production self-hosting, DIUN over Watchtower is the obvious choice.

## Related

- [How to Self-Host Watchtower](/apps/watchtower)
- [Watchtower vs DIUN](/compare/watchtower-vs-diun)
- [How to Self-Host Portainer](/apps/portainer)
- [How to Self-Host Dockge](/apps/dockge)
- [Best Self-Hosted Docker Management](/best/docker-management)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes and Storage](/foundations/docker-volumes)
- [Docker Networking](/foundations/docker-networking)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
