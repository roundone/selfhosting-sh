---
title: "Cron Jobs for Self-Hosting"
description: "Set up cron jobs on Linux to automate backups, updates, cleanup, and maintenance tasks for your self-hosted server and Docker containers."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["linux", "cron", "automation", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Cron Jobs?

Cron is Linux's built-in task scheduler. It runs commands on a schedule — every minute, every hour, every Tuesday at 3 AM, or whatever interval you need. For self-hosting, cron handles automated backups, certificate renewals, Docker cleanup, log rotation, and maintenance scripts.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- SSH access with sudo privileges ([SSH Setup Guide](/foundations/ssh-setup))
- Basic command line familiarity ([Linux Basics](/foundations/linux-basics-self-hosting))

## Cron Schedule Syntax

A cron schedule has five fields:

```
┌───────────── minute (0–59)
│ ┌───────────── hour (0–23)
│ │ ┌───────────── day of month (1–31)
│ │ │ ┌───────────── month (1–12)
│ │ │ │ ┌───────────── day of week (0–7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * * command
```

### Examples

| Schedule | Meaning |
|----------|---------|
| `0 2 * * *` | Every day at 2:00 AM |
| `*/15 * * * *` | Every 15 minutes |
| `0 */6 * * *` | Every 6 hours |
| `0 3 * * 0` | Every Sunday at 3:00 AM |
| `0 0 1 * *` | First day of every month at midnight |
| `30 4 * * 1-5` | Weekdays at 4:30 AM |
| `0 2 * * 1,4` | Monday and Thursday at 2:00 AM |
| `@reboot` | Once at startup |
| `@hourly` | Every hour (same as `0 * * * *`) |
| `@daily` | Every day at midnight (same as `0 0 * * *`) |
| `@weekly` | Every Sunday at midnight |
| `@monthly` | First of every month at midnight |

## Managing Cron Jobs

### Editing Your Crontab

```bash
# Edit current user's crontab
crontab -e

# Edit root's crontab (for system tasks)
sudo crontab -e

# Edit another user's crontab
sudo crontab -u backup -e

# List current cron jobs
crontab -l

# List root's cron jobs
sudo crontab -l

# Remove all cron jobs (be careful)
crontab -r
```

When you run `crontab -e` for the first time, it asks which editor to use. Choose `nano` (option 1) unless you prefer `vim`.

### System-Wide Cron Directories

For scripts that should run as root, drop them in the appropriate directory:

```
/etc/cron.d/        — custom schedule files
/etc/cron.hourly/   — scripts run every hour
/etc/cron.daily/    — scripts run every day
/etc/cron.weekly/   — scripts run every week
/etc/cron.monthly/  — scripts run every month
```

Scripts in these directories must be executable and should NOT have a file extension:

```bash
sudo cp myscript.sh /etc/cron.daily/myscript
sudo chmod +x /etc/cron.daily/myscript
```

## Practical Self-Hosting Cron Jobs

### Docker System Cleanup

Docker accumulates unused images, containers, and volumes over time. Clean up weekly:

```bash
# Add to root crontab: sudo crontab -e
0 3 * * 0 /usr/bin/docker system prune -af --volumes >> /var/log/docker-cleanup.log 2>&1
```

**Warning:** `--volumes` removes unused volumes. Only use this if you're confident all important data is in actively-used volumes or bind mounts.

A safer version without volume cleanup:

```bash
0 3 * * 0 /usr/bin/docker system prune -af >> /var/log/docker-cleanup.log 2>&1
```

### Database Backup

Back up a PostgreSQL database running in Docker every night:

```bash
# /opt/scripts/backup-db.sh
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y-%m-%d_%H%M)
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

# Dump database from Docker container
docker exec postgres-container pg_dumpall -U postgres | gzip > "$BACKUP_DIR/dump-$DATE.sql.gz"

# Remove backups older than $KEEP_DAYS
find "$BACKUP_DIR" -name "dump-*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "$(date): Backup completed - dump-$DATE.sql.gz" >> /var/log/backup-db.log
```

```bash
chmod +x /opt/scripts/backup-db.sh

# Run nightly at 2 AM
# sudo crontab -e
0 2 * * * /opt/scripts/backup-db.sh 2>&1
```

### Docker Compose Stack Health Check

Restart containers that have exited unexpectedly:

```bash
# /opt/scripts/healthcheck.sh
#!/bin/bash
set -euo pipefail

COMPOSE_DIR="/opt/myapp"

cd "$COMPOSE_DIR"
EXITED=$(docker compose ps --filter "status=exited" -q)

if [ -n "$EXITED" ]; then
    echo "$(date): Restarting exited containers in $COMPOSE_DIR" >> /var/log/healthcheck.log
    docker compose up -d
fi
```

```bash
chmod +x /opt/scripts/healthcheck.sh

# Check every 5 minutes
# sudo crontab -e
*/5 * * * * /opt/scripts/healthcheck.sh 2>&1
```

### SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Certbot handles renewal, but you need a cron job to trigger it:

```bash
# Run renewal check twice daily (certbot only renews when needed)
0 3,15 * * * /usr/bin/certbot renew --quiet --deploy-hook "docker exec nginx-proxy nginx -s reload" >> /var/log/certbot-renew.log 2>&1
```

### Disk Space Alert

Get notified when disk usage exceeds 85%:

```bash
# /opt/scripts/disk-alert.sh
#!/bin/bash
THRESHOLD=85
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "ALERT: Disk usage at ${USAGE}% on $(hostname)" | \
        mail -s "Disk Space Alert" admin@example.com
fi
```

```bash
# Check every hour
0 * * * * /opt/scripts/disk-alert.sh 2>&1
```

### Log Rotation for Docker Containers

Docker container logs can grow unbounded. Configure log rotation via the Docker daemon instead of cron (add to `/etc/docker/daemon.json`):

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Then restart Docker:

```bash
sudo systemctl restart docker
```

This is better than a cron-based approach because Docker handles it atomically.

## Cron Environment Gotchas

Cron runs commands in a minimal environment. This causes most cron debugging headaches.

### PATH Is Minimal

Cron's default PATH is usually just `/usr/bin:/bin`. Commands that work in your terminal may fail in cron.

**Fix:** Use absolute paths for everything:

```bash
# Bad — may fail in cron
docker compose up -d

# Good — absolute paths
/usr/bin/docker compose up -d
```

Or set PATH at the top of your crontab:

```bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

0 2 * * * /opt/scripts/backup.sh
```

### No Terminal, No Output

Cron doesn't have a terminal. Commands that produce output send it as email to the crontab owner (if a mail system is configured). Otherwise, output is silently discarded.

**Fix:** Redirect output to a log file:

```bash
# Redirect stdout and stderr to a log file
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1

# Discard output entirely (if you don't care)
0 2 * * * /opt/scripts/cleanup.sh > /dev/null 2>&1
```

### Environment Variables Not Available

Environment variables from your shell profile (`.bashrc`, `.profile`) are not loaded in cron.

**Fix:** Source them explicitly or set them in the crontab:

```bash
# Option 1: Set in crontab
RESTIC_PASSWORD=your-backup-password
0 2 * * * /usr/bin/restic backup /opt/data

# Option 2: Source an env file in the script
#!/bin/bash
source /opt/myapp/.env
# ... rest of script
```

## Common Mistakes

### 1. Not Using Absolute Paths

```bash
# Bad — cron can't find docker
0 2 * * * docker system prune -af

# Good
0 2 * * * /usr/bin/docker system prune -af
```

### 2. Not Redirecting Output

Without output redirection, you won't see errors and cron may try to send emails (filling up mail queues):

```bash
# Always redirect output
0 2 * * * /opt/scripts/backup.sh >> /var/log/backup.log 2>&1
```

### 3. Overlapping Jobs

A long-running cron job might still be running when the next execution starts. Use `flock` to prevent overlap:

```bash
# Only run if not already running
*/5 * * * * /usr/bin/flock -n /tmp/healthcheck.lock /opt/scripts/healthcheck.sh
```

### 4. Editing /etc/crontab Instead of Using crontab -e

`/etc/crontab` has a different format (includes a username field). User crontabs don't. Mixing them up causes failures. Use `crontab -e` for user jobs.

### 5. Forgetting to Make Scripts Executable

```bash
# This will fail silently
0 2 * * * /opt/scripts/backup.sh

# Fix: make it executable
chmod +x /opt/scripts/backup.sh
```

## Monitoring Cron Jobs

### Check Cron Logs

```bash
# Ubuntu/Debian
grep CRON /var/log/syslog

# Or with journalctl
journalctl -u cron --since "1 hour ago"
```

### Verify a Job Ran

Add timestamps to your log files:

```bash
# In your script
echo "$(date '+%Y-%m-%d %H:%M:%S') — Backup started" >> /var/log/backup.log
```

### Test Before Scheduling

Always run your script manually before adding it to cron:

```bash
# Run manually first
sudo /opt/scripts/backup.sh

# Check the exit code
echo $?  # 0 = success
```

## FAQ

### Should I use cron or systemd timers?

For simple, one-off scheduled tasks, cron is fine. For tasks that need dependency ordering, resource limits, automatic logging, or catch-up after missed runs, use [systemd timers](/foundations/linux-systemd). Both work well for self-hosting.

### How do I schedule a job to run every 30 seconds?

Cron's minimum interval is 1 minute. For sub-minute scheduling, use a systemd timer with `OnUnitActiveSec=30s`, or run a loop in a script with `sleep 30`.

### My cron job works manually but fails in cron. Why?

Almost always a PATH or environment issue. Use absolute paths for all commands and source any needed environment files. Check cron logs with `grep CRON /var/log/syslog`.

### How do I run a cron job as a different user?

Use `sudo crontab -u username -e` to edit that user's crontab. Or in `/etc/crontab`, specify the user in the sixth field.

### Can Docker containers have their own cron jobs?

Yes, but it's generally better to run cron on the host and use `docker exec` to run commands inside containers. This keeps scheduling centralized and visible.

## Next Steps

- [Systemd Services](/foundations/linux-systemd) — manage long-running services
- [Backup Strategy](/foundations/backup-3-2-1-rule) — what to automate with cron
- [Docker Compose Basics](/foundations/docker-compose-basics) — container management

## Related

- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
- [Systemd Services](/foundations/linux-systemd)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [SSH Setup Guide](/foundations/ssh-setup)
- [Getting Started with Self-Hosting](/foundations/getting-started)
