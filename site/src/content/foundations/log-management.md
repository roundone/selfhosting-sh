---
title: "Log Management for Your Home Server"
description: "Set up log management on your home server — configure rotation, centralize with Loki and Grafana, filter by level, and prevent disk-filling surprises."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "logging", "monitoring", "troubleshooting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Log Management Matters

Log management is the difference between diagnosing a problem in 30 seconds and spending an hour guessing. Every service on your home server produces logs -- system daemons, Docker containers, web servers, databases. Without a plan, those logs either vanish when you need them or silently fill your disk until everything crashes.

Good log management gives you three things: **fast debugging** when something breaks, **early warnings** before something breaks, and **disk space predictability** so logs never cause an outage on their own.

Docker's default `json-file` logging driver works fine for small setups with fewer than 10 containers. Once you scale past that, set up Loki + Grafana for centralized search. But regardless of setup size, always configure log rotation. Unmanaged logs will fill your disk -- it is not a question of "if" but "when."

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended) with root or sudo access
- Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- Basic terminal skills ([Linux Basics](/foundations/linux-basics-self-hosting))
- Familiarity with systemd ([Linux Systemd Fundamentals](/foundations/linux-systemd))

## Linux System Logs

Before Docker enters the picture, your host OS generates its own logs. Understanding these is critical -- if Docker itself won't start, container logs can't help you.

### journalctl

On systemd-based distros (Ubuntu, Debian, Fedora, Arch), `journalctl` is the primary tool for reading system logs.

```bash
# View all logs (oldest first)
journalctl

# View logs in reverse (newest first) -- usually what you want
journalctl -r

# Last 50 entries
journalctl -n 50

# Follow in real time (like tail -f)
journalctl -f

# Logs from a specific service
journalctl -u docker.service
journalctl -u ssh.service
journalctl -u nginx.service

# Logs since a specific time
journalctl --since "2026-02-16 10:00:00"
journalctl --since "1 hour ago"
journalctl --since "yesterday"

# Logs within a time range
journalctl --since "2026-02-16 08:00" --until "2026-02-16 12:00"

# Filter by priority (0=emergency through 7=debug)
journalctl -p err       # errors and above
journalctl -p warning   # warnings and above

# Kernel messages only
journalctl -k

# Disk usage of the journal
journalctl --disk-usage
```

### /var/log Directory

Some services still write traditional log files to `/var/log/`:

| File | Contents |
|------|----------|
| `/var/log/syslog` | General system messages (Debian/Ubuntu) |
| `/var/log/auth.log` | Authentication events -- SSH logins, sudo, failed attempts |
| `/var/log/kern.log` | Kernel messages -- hardware errors, driver issues |
| `/var/log/dpkg.log` | Package manager activity |
| `/var/log/ufw.log` | Firewall events (if UFW is enabled) |
| `/var/log/fail2ban.log` | Fail2ban bans and unbans |

```bash
# Check recent failed SSH logins
grep "Failed password" /var/log/auth.log | tail -20

# Check recent kernel errors
grep -i "error\|critical" /var/log/kern.log | tail -20

# Watch authentication events in real time
tail -f /var/log/auth.log
```

### Controlling journald Disk Usage

The systemd journal can grow large on busy servers. Configure limits in `/etc/systemd/journald.conf`:

```ini
[Journal]
SystemMaxUse=500M
SystemKeepFree=1G
MaxRetentionSec=30day
```

```bash
# Apply changes
sudo systemctl restart systemd-journald

# Manually trim to a size
sudo journalctl --vacuum-size=500M

# Manually trim to a time
sudo journalctl --vacuum-time=30d
```

**Recommendation:** Set `SystemMaxUse=500M` on servers with smaller disks (under 50 GB). For larger disks, `1G` or `2G` is reasonable. Always set `MaxRetentionSec` so old logs eventually expire.

## Docker Container Logs

Docker captures everything containers write to stdout and stderr. By default, these are stored as JSON files on the host.

### Viewing Container Logs

```bash
# All logs from a service (careful -- can be huge)
docker compose logs nextcloud

# Last 100 lines
docker compose logs --tail=100 nextcloud

# Follow in real time
docker compose logs -f --tail=50 nextcloud

# With timestamps
docker compose logs -t nextcloud

# Logs from the last hour
docker compose logs --since=1h nextcloud

# Logs since a specific time
docker compose logs --since="2026-02-16T14:00:00" nextcloud

# Multiple services at once
docker compose logs --tail=50 nextcloud db redis

# All services, errors only
docker compose logs 2>&1 | grep -i "error\|fatal\|panic"
```

For standalone containers (not in a Compose stack):

```bash
docker logs --tail=100 -f my-container
docker logs --since=1h my-container
```

### Docker Logging Drivers

Docker supports multiple logging drivers. The default is `json-file`, which stores logs as JSON on disk at `/var/lib/docker/containers/<id>/<id>-json.log`.

| Driver | Stores Locally | Searchable via `docker logs` | Best For |
|--------|---------------|------------------------------|----------|
| `json-file` | Yes | Yes | Small setups (default) |
| `local` | Yes (compressed) | Yes | Medium setups, saves disk |
| `journald` | Via journald | Yes | Systemd-integrated servers |
| `syslog` | Via syslog daemon | No | Legacy syslog infrastructure |
| `fluentd` | Via Fluentd | No | Large-scale log aggregation |
| `none` | No | No | Containers whose logs you never need |

**Recommendation:** Stick with `json-file` for most setups. If disk space is tight, switch to `local` (it compresses rotated files). Avoid `none` unless you truly never need a container's logs -- you will regret it during debugging.

Set the default driver globally in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

```bash
sudo systemctl restart docker
```

Override per-container in `docker-compose.yml`:

```yaml
services:
  noisy-app:
    image: someapp:v2.1.0
    logging:
      driver: json-file
      options:
        max-size: "50m"
        max-file: "5"
    restart: unless-stopped

  background-worker:
    image: worker:v1.3.0
    logging:
      driver: json-file
      options:
        max-size: "5m"
        max-file: "2"
    restart: unless-stopped
```

## Log Rotation

Log rotation prevents any single log file from growing indefinitely. Without it, a database generating 100 MB/day of query logs fills a 20 GB disk in months.

### Docker Log Rotation

Docker handles its own rotation via the `max-size` and `max-file` options shown above. Configure these globally in `/etc/docker/daemon.json` -- this is non-optional for any server running containers long-term.

The math: `max-size` x `max-file` x number of containers = maximum log disk usage. With the recommended defaults (10 MB x 3 files), 30 containers use at most 900 MB. Adjust based on your disk and container count.

### System Log Rotation with logrotate

The `logrotate` utility handles rotation for traditional log files in `/var/log/`. Most Linux distros include it by default.

Check the main config:

```bash
cat /etc/logrotate.conf
```

Application-specific configs live in `/etc/logrotate.d/`. Here is an example custom config for an app that writes logs to a mounted volume:

```bash
# /etc/logrotate.d/myapp
/opt/myapp/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    maxsize 100M
}
```

Key directives:

| Directive | Meaning |
|-----------|---------|
| `daily` | Rotate once per day |
| `rotate 7` | Keep 7 rotated files |
| `compress` | Gzip old log files |
| `delaycompress` | Compress the previous rotation, not the current one |
| `missingok` | Don't error if the log file is missing |
| `notifempty` | Skip rotation if the log is empty |
| `copytruncate` | Copy the log then truncate the original (safe for apps that hold the file open) |
| `maxsize 100M` | Rotate when the file exceeds 100 MB, regardless of schedule |

```bash
# Test a logrotate config without applying
sudo logrotate -d /etc/logrotate.d/myapp

# Force rotation now
sudo logrotate -f /etc/logrotate.d/myapp

# Check logrotate status
cat /var/lib/logrotate/status
```

**Recommendation:** If you run any service outside Docker that writes its own log files (e.g., a bare-metal Nginx or PostgreSQL), create a logrotate config for it immediately. Do not wait until the disk fills.

## Centralized Logging with Loki

Once you run 10+ containers, grepping through individual container logs becomes painful. Loki, paired with Grafana for visualization and Promtail for collection, gives you a single interface to search all logs across all containers.

### Loki + Grafana + Promtail Stack

Create a directory for the logging stack:

```bash
mkdir -p /opt/logging-stack
cd /opt/logging-stack
```

Create `docker-compose.yml`:

```yaml
services:
  loki:
    image: grafana/loki:3.3.2
    command: -config.file=/etc/loki/local-config.yaml
    ports:
      - "127.0.0.1:3100:3100"
    volumes:
      - loki-data:/loki
      - ./loki-config.yml:/etc/loki/local-config.yaml:ro
    restart: unless-stopped

  promtail:
    image: grafana/promtail:3.3.2
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /run/log/journal:/run/log/journal:ro
      - ./promtail-config.yml:/etc/promtail/config.yml:ro
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
    restart: unless-stopped

  grafana:
    image: grafana/grafana:11.4.0
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=changeme   # CHANGE THIS
      - GF_AUTH_ANONYMOUS_ENABLED=false
    volumes:
      - grafana-data:/var/lib/grafana
    depends_on:
      - loki
    restart: unless-stopped

volumes:
  loki-data:
  grafana-data:
```

Create `loki-config.yml`:

```yaml
auth_enabled: false

server:
  http_listen_port: 3100

common:
  path_prefix: /loki
  storage:
    filesystem:
      chunks_directory: /loki/chunks
      rules_directory: /loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

schema_config:
  configs:
    - from: 2020-10-24
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

limits_config:
  retention_period: 30d

compactor:
  working_directory: /loki/compactor
  retention_enabled: true
  delete_request_store: filesystem
```

Create `promtail-config.yml`:

```yaml
server:
  http_listen_port: 9080

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  # Collect Docker container logs
  - job_name: docker
    static_configs:
      - targets:
          - localhost
        labels:
          job: docker
          __path__: /var/lib/docker/containers/*/*-json.log
    pipeline_stages:
      - docker: {}
      - labeldrop:
          - filename

  # Collect system logs
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: system
          __path__: /var/log/{syslog,auth.log,kern.log}
```

Start the stack:

```bash
docker compose up -d
```

### Connecting Grafana to Loki

1. Open Grafana at `http://your-server-ip:3000`
2. Log in with the admin credentials from the Compose file
3. Go to **Connections > Data Sources > Add data source**
4. Select **Loki**
5. Set the URL to `http://loki:3100`
6. Click **Save & Test**

Now go to **Explore**, select the Loki data source, and query your logs using LogQL:

```
{job="docker"} |= "error"
{job="system", filename="/var/log/auth.log"} |= "Failed password"
{job="docker"} | json | level = "error"
```

### Resource Requirements

The Loki stack is lightweight compared to Elasticsearch-based alternatives:

| Component | RAM (idle) | RAM (under query) | Disk |
|-----------|-----------|-------------------|------|
| Loki | ~50 MB | ~200 MB | Depends on retention (30 days ~1-5 GB) |
| Promtail | ~30 MB | ~50 MB | Negligible |
| Grafana | ~80 MB | ~150 MB | ~100 MB |
| **Total** | **~160 MB** | **~400 MB** | **~1-5 GB** |

## Log Levels and Filtering

Understanding log levels lets you cut through noise and find what matters.

### Standard Levels (most apps follow this hierarchy)

| Level | Severity | When to Care |
|-------|----------|-------------|
| `TRACE` | Extremely verbose internal state | Almost never -- developer debugging only |
| `DEBUG` | Detailed operational information | When actively troubleshooting a specific issue |
| `INFO` | Normal operations (startup, shutdown, requests) | Baseline monitoring |
| `WARN` | Something unexpected but recoverable | Investigate recurring warnings -- they predict failures |
| `ERROR` | Something failed | Investigate immediately |
| `FATAL` / `CRITICAL` | Service cannot continue | Immediate action required |

### Configuring Log Levels

Most self-hosted apps let you set the level via environment variables:

```yaml
environment:
  # Common patterns (varies by app -- check the docs)
  - LOG_LEVEL=warn
  - LOGLEVEL=WARNING
  - RUST_LOG=info
  - NODE_ENV=production  # Many Node apps reduce logging in production
```

**Recommendation:** Run production containers at `info` or `warn`. Only switch to `debug` when actively troubleshooting, and switch back immediately after. Debug logging can increase log volume 10-50x.

### Filtering with grep

```bash
# Errors and fatals only
docker compose logs 2>&1 | grep -iE "error|fatal|panic|exception"

# Exclude noisy lines
docker compose logs 2>&1 | grep -v "healthcheck"

# Show context around errors (3 lines before and after)
docker compose logs 2>&1 | grep -B3 -A3 -i "error"
```

### Filtering with LogQL (Loki)

```
# All errors from Docker containers
{job="docker"} |= "error" != "healthcheck"

# Parse JSON logs and filter by level
{job="docker"} | json | level = "error"

# Rate of errors per minute
rate({job="docker"} |= "error" [1m])

# Top 10 containers by error count
topk(10, count_over_time({job="docker"} |= "error" [1h]))
```

## Searching and Analyzing Logs

### Quick CLI Searches

```bash
# Find when a container last restarted
docker compose logs --tail=500 myservice 2>&1 | grep -i "starting\|started\|ready"

# Count errors per service in the last hour
for svc in $(docker compose ps --format '{{.Service}}'); do
  count=$(docker compose logs --since=1h "$svc" 2>&1 | grep -ci "error")
  echo "$svc: $count errors"
done

# Find slow database queries (PostgreSQL)
docker compose logs db 2>&1 | grep "duration:" | awk '{print $NF, $0}' | sort -rn | head -20

# Track a request through multiple services (by ID or correlation token)
docker compose logs 2>&1 | grep "req-abc123"
```

### Using jq for JSON Logs

Many modern apps output structured JSON. Parse these efficiently:

```bash
# Extract error messages from JSON logs
docker logs mycontainer 2>&1 | jq -r 'select(.level == "error") | .msg'

# Get timestamps and messages for errors
docker logs mycontainer 2>&1 | jq -r 'select(.level == "error") | "\(.time) \(.msg)"'

# Count errors by message
docker logs mycontainer 2>&1 | jq -r 'select(.level == "error") | .msg' | sort | uniq -c | sort -rn
```

### Grafana Dashboards for Logs

In Grafana, create a dashboard with these panels for a solid overview:

- **Error rate over time:** `rate({job="docker"} |= "error" [5m])` as a time series
- **Recent errors table:** `{job="docker"} |= "error"` as a logs panel, limit 50
- **Failed SSH attempts:** `{job="system"} |= "Failed password"` as a logs panel
- **Log volume by container:** `sum by (container) (rate({job="docker"} [5m]))` as a bar chart

## Disk Space Management for Logs

Logs are the most common cause of unexpected disk full conditions on home servers. Here is a comprehensive strategy.

### Check Current Log Disk Usage

```bash
# Docker container logs
sudo du -sh /var/lib/docker/containers/*/

# Total Docker log usage
sudo du -sh /var/lib/docker/containers/ 2>/dev/null

# System journal
journalctl --disk-usage

# Traditional log files
sudo du -sh /var/log/

# Grand total
echo "Docker logs: $(sudo du -sh /var/lib/docker/containers/ 2>/dev/null | cut -f1)"
echo "Journal: $(journalctl --disk-usage 2>&1 | grep -oP '[\d.]+[GMK]')"
echo "/var/log: $(sudo du -sh /var/log/ | cut -f1)"
```

### Set Budgets by Server Size

| Server Disk | Docker Logs Budget | Journal Budget | /var/log Budget | Total |
|-------------|-------------------|----------------|-----------------|-------|
| 20 GB | 500 MB | 200 MB | 300 MB | ~1 GB |
| 50 GB | 1 GB | 500 MB | 500 MB | ~2 GB |
| 100 GB+ | 2 GB | 1 GB | 1 GB | ~4 GB |

### Emergency Cleanup

When your disk is full right now:

```bash
# 1. Check what's consuming space
sudo du -sh /var/lib/docker/containers/*/ | sort -rh | head -10

# 2. Truncate the largest container log
BIGGEST=$(sudo du -s /var/lib/docker/containers/*/  | sort -rn | head -1 | awk '{print $2}')
sudo truncate -s 0 "${BIGGEST}"*-json.log

# 3. Trim the journal
sudo journalctl --vacuum-size=100M

# 4. Clean old rotated logs
sudo rm /var/log/*.gz 2>/dev/null
sudo rm /var/log/*.1 2>/dev/null

# 5. THEN configure rotation so this doesn't happen again
```

**After cleanup:** Immediately configure Docker log rotation in `/etc/docker/daemon.json` and journald limits in `/etc/systemd/journald.conf`. Emergency cleanup without prevention is a cycle.

## Alerting on Log Patterns

Logs are most useful when they tell you about problems before you notice them yourself.

### Alerting with Grafana (if running Loki stack)

In Grafana, go to **Alerting > Alert rules > New alert rule**:

1. Set the data source to Loki
2. Use a LogQL query like: `count_over_time({job="docker"} |= "error" [5m]) > 10`
3. Set evaluation interval (e.g., every 1 minute)
4. Configure a contact point (email, Discord webhook, Telegram, etc.)

Useful alert patterns:

| Alert | LogQL Query | Threshold |
|-------|-----------|-----------|
| Error spike | `count_over_time({job="docker"} \|= "error" [5m])` | > 10 in 5 min |
| Failed SSH logins | `count_over_time({job="system"} \|= "Failed password" [10m])` | > 5 in 10 min |
| OOM kills | `{job="system"} \|= "Out of memory"` | Any occurrence |
| Disk warnings | `{job="docker"} \|= "no space left"` | Any occurrence |

### Simple Alerting Without Loki

If you are not running the Loki stack, a cron job with a script works:

```bash
#!/bin/bash
# /opt/scripts/check-errors.sh
# Run via cron every 5 minutes

THRESHOLD=10
ERROR_COUNT=$(docker compose -f /opt/mystack/docker-compose.yml logs --since=5m 2>&1 | grep -ci "error")

if [ "$ERROR_COUNT" -gt "$THRESHOLD" ]; then
  echo "High error count detected: $ERROR_COUNT errors in the last 5 minutes" | \
    curl -X POST -H "Content-Type: application/json" \
    -d "{\"content\": \"Alert: $ERROR_COUNT errors in the last 5 minutes on $(hostname)\"}" \
    "https://discord.com/api/webhooks/YOUR_WEBHOOK_URL"
fi
```

```bash
# Add to crontab
crontab -e
# */5 * * * * /opt/scripts/check-errors.sh
```

## Common Mistakes

### 1. Not Configuring Any Log Rotation

The most common logging mistake on home servers. Docker's default `json-file` driver has no size limit. A chatty container generates gigabytes within weeks. Configure `/etc/docker/daemon.json` with `max-size` and `max-file` on day one.

### 2. Setting Log Level to Debug in Production and Forgetting

Debug logging generates 10-50x more output than info level. It slows down the application and burns through disk space. Set `debug` only while actively investigating, then revert.

### 3. Only Checking Logs After Failures

By the time something crashes, the logs that explain why may have been rotated away. Set up alerts on error patterns so you catch problems early. Review warnings weekly.

### 4. Ignoring Host System Logs

Docker container logs get all the attention, but host-level issues (disk failures, OOM kills, network errors, failed SSH attempts) only appear in journalctl and `/var/log/`. Monitor both layers.

### 5. Using `docker logs` Without `--tail` on Long-Running Containers

Running `docker logs mycontainer` on a container that has been up for months dumps millions of lines to your terminal. Always use `--tail=N` or `--since`.

### 6. Storing Logs on the Same Partition as Data

If logs fill the disk, your applications and databases go down too. On servers with large disks, consider mounting `/var/log` and Docker's data directory on a separate partition so runaway logs can't take down the whole system.

## Next Steps

- [Container Logging Deep Dive](/foundations/container-logging) -- Docker-specific logging details including structured logging and per-container configuration
- [Monitoring Your Home Server](/foundations/monitoring-basics) -- track uptime and resource usage alongside logs
- [Docker Troubleshooting](/foundations/docker-troubleshooting) -- use logs to debug common container issues
- [Storage Planning](/foundations/storage-planning) -- plan disk allocation for logs, data, and backups

## Related

- [Container Logging](/foundations/container-logging)
- [Monitoring Your Home Server](/foundations/monitoring-basics)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Linux Systemd Fundamentals](/foundations/linux-systemd)
- [Storage Planning](/foundations/storage-planning)
- [Docker Troubleshooting](/foundations/docker-troubleshooting)

## FAQ

### How much disk space should I budget for logs?

With Docker log rotation set to 10 MB x 3 files per container, each container uses at most 30 MB. Twenty containers is 600 MB. Add 200-500 MB for the system journal and another 300-500 MB for `/var/log`. Total: 1-2 GB is a reasonable budget for a small to medium home server. If you add Loki with 30-day retention, budget another 1-5 GB depending on container volume.

### Should I use Loki or the ELK stack (Elasticsearch, Logstash, Kibana)?

Loki. The ELK stack requires 2-4 GB of RAM at minimum and is designed for large-scale enterprise deployments. Loki was built specifically to be lightweight and pairs naturally with Grafana, which you likely already run for monitoring. Unless you have specific Elasticsearch requirements, Loki is the right choice for home servers.

### Do Docker logs persist across container restarts?

They persist across `docker compose restart` and `docker compose stop / start`. They do not persist across `docker compose down` and `up`, because `down` removes the container and its logs. If you need logs to survive recreation, use centralized logging (Loki) or configure a logging driver that writes to a persistent location.

### How do I forward Docker logs to journald instead of JSON files?

Set the logging driver in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "journald"
}
```

Then restart Docker: `sudo systemctl restart docker`. Container logs now appear in `journalctl CONTAINER_NAME=mycontainer`. The advantage is unified system + container logs. The disadvantage is that `docker compose logs` still works but now reads from journald, which can be slower for large volumes.

### Can I send log alerts to my phone?

Yes. The simplest path is Grafana alerting (if you run the Loki stack) with a notification channel that reaches your phone -- Telegram bot, Discord webhook to a server with mobile notifications, Pushover, or Ntfy (which you can self-host). For a lightweight approach without Loki, a cron script that checks error counts and sends a notification via webhook works well for basic monitoring.
