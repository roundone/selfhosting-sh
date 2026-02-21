---
title: "How to Self-Host Uptime Kuma with Docker"
description: "Deploy Uptime Kuma — a beautiful, self-hosted monitoring tool for tracking uptime of your services and websites."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "monitoring"
apps:
  - uptime-kuma
tags: ["self-hosted", "monitoring", "uptime-kuma", "docker", "uptime"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Uptime Kuma?

[Uptime Kuma](https://github.com/louislam/uptime-kuma) is a self-hosted uptime monitoring tool with one of the best-looking dashboards in the entire self-hosting ecosystem. It monitors HTTP(S), TCP, DNS, Docker containers, ping, Steam Game Servers, MQTT, and more — with alerts through 90+ notification providers including Slack, Discord, Telegram, email, Gotify, and ntfy. Think of it as a self-hosted replacement for UptimeRobot, Pingdom, or StatusCake — except you own all the data and pay nothing.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM (minimum)
- 500 MB of free disk space
- A domain name (optional, for remote access and public status pages)

## Docker Compose Configuration

Uptime Kuma is one of the simplest self-hosted apps to deploy. Single container, no database dependency, no environment variables required. It stores everything in a SQLite database inside its data volume.

Create a directory for Uptime Kuma and a `docker-compose.yml` file:

```bash
mkdir -p ~/uptime-kuma && cd ~/uptime-kuma
```

```yaml
# docker-compose.yml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2.1.1
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
    # Optional: mount Docker socket to monitor container status
    # - /var/run/docker.sock:/var/run/docker.sock:ro

volumes:
  uptime-kuma-data:
```

That is the entire configuration. No `.env` file needed. No Postgres, no Redis, no companion services. This makes Uptime Kuma an excellent second self-hosted app after [Pi-hole](/apps/pi-hole/) — it teaches you nothing can go wrong with a single-container setup.

Start it:

```bash
docker compose up -d
```

Uptime Kuma is now running at `http://your-server-ip:3001`.

**Note:** Do not use NFS-mounted storage for the data volume. SQLite requires a POSIX-compliant filesystem, and NFS can cause database locking issues.

## Initial Setup

Open `http://your-server-ip:3001` in your browser. On first access, you will see the account creation screen.

1. **Create your admin account.** Choose a strong username and password. This is the only account with full access by default.
2. **You land on the dashboard.** It is empty — no monitors exist yet. The left sidebar lists monitors, and the main area shows uptime charts once you add them.

There is no setup wizard beyond creating the admin account. Everything else is configured through the clean, reactive web UI.

## Configuration

### Adding Monitors

Click **Add New Monitor** in the top-left corner. Uptime Kuma supports these monitor types:

| Type | What It Checks |
|------|---------------|
| HTTP(S) | URL responds with expected status code |
| TCP | Port is open and accepting connections |
| Ping | Host responds to ICMP ping |
| DNS | DNS record resolves correctly |
| Docker | Container is running (requires socket mount) |
| Push | Receives heartbeat pings from your services |
| Steam Game Server | Game server is online |
| MQTT | MQTT broker is reachable |
| Keyword | Page contains (or does not contain) a specific string |
| JSON Query | JSON API returns an expected value |
| gRPC | gRPC service health check |

**Example — adding an HTTP monitor:**

1. Click **Add New Monitor**.
2. Set **Monitor Type** to `HTTP(s)`.
3. Enter the **URL** — e.g., `https://selfhosting.sh`.
4. Set **Heartbeat Interval** — `60` seconds is a good default. Lower intervals mean faster alerts but more load.
5. Set **Retries** — `3` is sensible. This avoids false alerts from momentary blips.
6. Optionally set **Accepted Status Codes** — defaults to `200-299`. Add `301` or `302` if the URL redirects.
7. Click **Save**.

The monitor starts immediately. You will see the uptime chart populate in real time.

### Notification Channels

Monitors are useless without alerts. Go to **Settings → Notifications** (or set notifications per-monitor).

Uptime Kuma supports 90+ notification providers. The most common for self-hosters:

- **Discord** — paste a webhook URL. Done.
- **Telegram** — create a bot via @BotFather, paste the bot token and chat ID.
- **Email (SMTP)** — enter your SMTP server, port, credentials, and recipient.
- **Gotify / ntfy** — enter the server URL and token. Both are self-hosted notification services that pair well with Uptime Kuma.
- **Slack** — use an incoming webhook URL.

**Setting up a Discord notification:**

1. In your Discord server, go to **Channel Settings → Integrations → Webhooks**.
2. Create a new webhook. Copy the URL.
3. In Uptime Kuma, go to **Settings → Notifications → Setup Notification**.
4. Select **Discord** as the type.
5. Paste the webhook URL.
6. Click **Test** to send a test notification.
7. Click **Save**.

You can assign different notification channels to different monitors — send critical service alerts to Telegram while less important checks go to Discord.

### Status Pages

Uptime Kuma can serve public status pages — useful for showing users or teammates the health of your services without giving them dashboard access.

1. Go to **Status Pages** in the navigation menu.
2. Click **New Status Page**.
3. Give it a name and URL slug (e.g., `status`).
4. Add monitor groups and select which monitors appear on the page.
5. Customize the description, footer, and incident reporting.

The status page is accessible at `http://your-server-ip:3001/status/your-slug`. Point a custom domain at it through your [reverse proxy](/foundations/reverse-proxy-explained/) for a professional look.

### Monitor Groups

As your monitor count grows, organization matters. Create groups to categorize monitors:

- **Home Lab** — internal services like [Jellyfin](/apps/jellyfin/), Nextcloud, [Vaultwarden](/apps/vaultwarden/)
- **External** — public-facing sites and APIs
- **Infrastructure** — DNS, reverse proxy, Docker host health

Groups appear as collapsible sections in the dashboard and can be used on status pages.

### Maintenance Windows

When you are performing planned maintenance, you do not want false alerts flooding your notifications.

1. Go to **Maintenance** in the navigation menu.
2. Click **Schedule Maintenance**.
3. Select the affected monitors.
4. Set the time window — one-time or recurring.
5. Optionally set a title and description (these appear on status pages).

During the maintenance window, selected monitors pause. No alerts fire. The status page shows the planned maintenance with your description.

## Advanced Configuration

### Monitoring Docker Containers

Uptime Kuma can monitor whether Docker containers are running directly — no HTTP endpoint needed. Uncomment the Docker socket mount in your `docker-compose.yml`:

```yaml
services:
  uptime-kuma:
    image: louislam/uptime-kuma:2.1.1
    container_name: uptime-kuma
    restart: unless-stopped
    ports:
      - "3001:3001"
    volumes:
      - uptime-kuma-data:/app/data
      - /var/run/docker.sock:/var/run/docker.sock:ro

volumes:
  uptime-kuma-data:
```

Restart the container:

```bash
docker compose up -d
```

Now when creating a monitor, select **Docker Container** as the type. You will see a dropdown of all containers on the host. Select one, and Uptime Kuma checks its running status at the configured interval.

**Security note:** Mounting the Docker socket gives Uptime Kuma read access to your Docker daemon. The `:ro` flag makes it read-only, which is the minimum safe configuration. If this concerns you, use TCP or HTTP monitors for your containers instead.

### Push Monitors

Push monitors flip the monitoring model — instead of Uptime Kuma polling your service, your service sends heartbeats to Uptime Kuma. This is useful for cron jobs, batch processes, or services behind firewalls that Uptime Kuma cannot reach.

1. Create a new monitor with type **Push**.
2. Set the **Heartbeat Interval** — how often your service should check in.
3. Copy the generated push URL.
4. Have your service hit that URL on a schedule (e.g., at the end of a cron job):

```bash
# Add to the end of your backup script
curl -s "http://your-uptime-kuma:3001/api/push/your-push-token?status=up&msg=OK"
```

If the heartbeat stops arriving, Uptime Kuma marks the monitor as down and fires alerts.

### Multiple Users

Under **Settings → Security**, you can enable two-factor authentication (2FA) for the admin account. Uptime Kuma v2 supports multiple user accounts with different access levels — useful if you want teammates to view the dashboard without full admin permissions.

## Reverse Proxy

Uptime Kuma uses WebSocket connections for its real-time dashboard. Your reverse proxy must support WebSocket upgrades, or the UI will not load properly.

**Uptime Kuma must run on its own subdomain** (e.g., `status.yourdomain.com`). It does not support subdirectory routing like `yourdomain.com/uptime-kuma`.

**Nginx Proxy Manager:**

1. Add a new proxy host pointing to `uptime-kuma:3001` (or your container IP).
2. Enable **WebSockets Support** — this is a toggle in the UI.
3. Enable SSL with Let's Encrypt.

**Caddy:**

```
status.yourdomain.com {
    reverse_proxy localhost:3001
}
```

Caddy handles WebSocket upgrades automatically. No extra configuration needed.

**Nginx (manual):**

```nginx
server {
    listen 443 ssl;
    server_name status.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

The `Upgrade` and `Connection` headers are critical. Without them, the dashboard will fail to connect.

After configuring your reverse proxy, enable **Settings → Reverse Proxy → Trust Proxy** inside Uptime Kuma so it logs correct client IPs.

For a full reverse proxy walkthrough, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Uptime Kuma stores everything — monitors, notification configs, uptime history, status pages — in a single SQLite database inside the `/app/data` volume.

To back up:

```bash
# Stop the container to ensure database consistency
docker compose stop uptime-kuma

# Copy the data volume
cp -r /var/lib/docker/volumes/uptime-kuma_uptime-kuma-data/_data ./uptime-kuma-backup-$(date +%Y%m%d)

# Start the container again
docker compose start uptime-kuma
```

Alternatively, Uptime Kuma has a built-in **Settings → Backup** feature that exports your configuration (monitors, notifications, status pages) as a JSON file. This does not include historical uptime data, but it covers everything you need to recreate your setup quickly.

For a comprehensive backup approach, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Dashboard Shows "Connecting..." or Fails to Load

**Symptom:** The web UI shows a spinning loader or "Connecting to the socket server..." forever.

**Fix:** This is almost always a WebSocket issue with your reverse proxy. Verify that your proxy is forwarding `Upgrade` and `Connection` headers. In Nginx Proxy Manager, enable the **WebSockets Support** toggle. In Cloudflare, ensure WebSocket support is enabled in the Network settings for your domain.

### Notifications Not Sending

**Symptom:** Monitor goes down but no alert arrives.

**Fix:**
1. Click **Test** on the notification channel in Settings. If the test fails, the issue is your notification config (wrong webhook URL, expired token, bad SMTP credentials).
2. Check that the notification is assigned to the monitor — notifications are per-monitor, not global by default.
3. For email/SMTP: verify your SMTP port (587 for TLS, 465 for SSL). Check that your email provider is not blocking the connection.

### Monitor Shows False Downtime

**Symptom:** A service is clearly up, but Uptime Kuma reports it as down intermittently.

**Fix:**
1. Increase the **Retries** setting to 3-5. Single-retry monitors are prone to false positives from brief network hiccups.
2. Increase the **Heartbeat Interval**. Very short intervals (5-10 seconds) can trigger rate limiting on the target service.
3. If monitoring an HTTPS endpoint, check that the SSL certificate is valid. Expired certificates cause monitor failures.

### High CPU Usage with Many Monitors

**Symptom:** CPU usage spikes significantly with 100+ monitors.

**Fix:** Increase the heartbeat interval for non-critical monitors. Not everything needs 30-second checks. Use 60 seconds for most services and 300 seconds for low-priority checks. This reduces CPU load linearly.

## Resource Requirements

- **RAM:** ~100 MB idle, ~200 MB with 50+ active monitors
- **CPU:** Very low — negligible for under 100 monitors, modest for 200+
- **Disk:** ~200 MB for the application, plus database growth over time (uptime history). A year of data for 50 monitors is typically under 500 MB.

Uptime Kuma is light enough to run on a Raspberry Pi alongside other services.

## Verdict

Uptime Kuma is the best self-hosted uptime monitor. Period. The UI is gorgeous, setup is trivial (single container, no dependencies), and it supports every notification channel you could want. It does one thing and does it perfectly.

If you run self-hosted services, you need Uptime Kuma watching them. It has become a staple in the self-hosting community for good reason — the dashboard gives you instant visibility into the health of your entire infrastructure, and the notification support means you will know about problems before your users do.

The only reason to look elsewhere is if you need metrics collection and time-series graphing — for that, use Grafana + Prometheus. But for pure uptime monitoring with beautiful dashboards and reliable alerts, nothing in the self-hosted space comes close to Uptime Kuma.

## Related

- [Best Self-Hosted Monitoring Tools](/best/monitoring/)
- [Uptime Kuma vs UptimeRobot](/compare/uptime-kuma-vs-uptimerobot/)
- [Grafana vs Uptime Kuma](/compare/grafana-vs-uptime-kuma/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
