---
title: "Crontab Examples for Self-Hosting"
description: "Practical crontab examples for automating backups, updates, cleanup, and monitoring on your self-hosted server."
date: "2026-02-19"
dateUpdated: "2026-02-19"
category: "foundations"
apps: []
tags: ["foundations", "cron", "automation", "linux", "maintenance"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Crontab?

Crontab is the configuration file for cron, Linux's built-in task scheduler. Every self-hosted server needs automated maintenance — backups, log rotation, certificate renewal, container cleanup. Crontab handles all of it.

If you need a refresher on cron syntax, read [Cron Jobs for Maintenance](/foundations/linux-cron-jobs) first. This guide focuses on practical, copy-paste-ready examples for self-hosting.

## Prerequisites

- A Linux server with [SSH access](/foundations/ssh-setup)
- Basic [Linux command line](/foundations/linux-basics-self-hosting) knowledge
- `cron` installed (present on virtually all Linux distributions)

## Crontab Syntax Refresher

```
┌───────── minute (0-59)
│ ┌─────── hour (0-23)
│ │ ┌───── day of month (1-31)
│ │ │ ┌─── month (1-12)
│ │ │ │ ┌─ day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │
* * * * * command
```

Edit your crontab with:

```bash
crontab -e
```

## Backup Examples

### Daily Docker Volume Backup

Back up all named Docker volumes to a timestamped tarball every night at 2 AM:

```bash
0 2 * * * /usr/bin/docker run --rm -v backup_data:/data -v /backups:/backup alpine tar czf /backup/volumes-$(date +\%Y\%m\%d).tar.gz -C /data . >> /var/log/backup.log 2>&1
```

### Weekly Database Dump

Export a PostgreSQL database from a Docker container every Sunday at 3 AM:

```bash
0 3 * * 0 /usr/bin/docker exec postgres-db pg_dump -U postgres myapp > /backups/db/myapp-$(date +\%Y\%m\%d).sql 2>> /var/log/backup.log
```

For MySQL/MariaDB:

```bash
0 3 * * 0 /usr/bin/docker exec mariadb-server mysqldump -u root -p"${MYSQL_ROOT_PASSWORD}" --all-databases > /backups/db/all-$(date +\%Y\%m\%d).sql 2>> /var/log/backup.log
```

### Restic Backup Every 6 Hours

If you use [restic](https://restic.net) for incremental backups:

```bash
0 */6 * * * /usr/bin/restic -r /mnt/backup-drive/restic-repo backup /srv/data --exclude-caches --tag automated >> /var/log/restic.log 2>&1
```

### Backup Rotation — Delete Files Older Than 30 Days

```bash
30 3 * * * find /backups -name "*.tar.gz" -mtime +30 -delete >> /var/log/backup-cleanup.log 2>&1
```

## Docker Maintenance

### Prune Unused Docker Resources Weekly

Dangling images, stopped containers, and unused networks waste disk space:

```bash
0 4 * * 0 /usr/bin/docker system prune -af --volumes >> /var/log/docker-prune.log 2>&1
```

Remove the `--volumes` flag if you want to keep unused volumes.

### Prune Only Dangling Images Daily

Less aggressive — only removes untagged images:

```bash
0 4 * * * /usr/bin/docker image prune -f >> /var/log/docker-prune.log 2>&1
```

### Restart a Container Every Night

Some apps develop memory leaks. Restart them during low-traffic hours:

```bash
0 5 * * * /usr/bin/docker restart jellyfin >> /var/log/container-restart.log 2>&1
```

### Check for Docker Image Updates

Using [Diun](https://crazymax.dev/diun/) or a simple script:

```bash
0 8 * * * /usr/bin/docker pull ghcr.io/immich-app/server:v1.99.0 2>&1 | grep -q "Status: Downloaded newer image" && echo "$(date): immich update available" >> /var/log/updates.log
```

## SSL Certificate Renewal

### Certbot Auto-Renewal

Certbot installs its own cron/systemd timer, but if you need to set it up manually:

```bash
0 0,12 * * * /usr/bin/certbot renew --quiet --deploy-hook "docker restart nginx-proxy" >> /var/log/certbot.log 2>&1
```

Runs twice daily (Let's Encrypt recommends this). Only renews certificates within 30 days of expiry.

## Monitoring and Health Checks

### Check if a Container Is Running Every 5 Minutes

```bash
*/5 * * * * /usr/bin/docker ps --filter "name=nextcloud" --filter "status=running" -q | grep -q . || (/usr/bin/docker start nextcloud && echo "$(date): Restarted nextcloud" >> /var/log/container-health.log)
```

### Disk Space Alert

Send a notification when disk usage exceeds 85%:

```bash
0 */4 * * * df -h / | awk 'NR==2 {gsub(/%/,"",$5); if($5 > 85) print strftime("%Y-%m-%d %H:%M") " ALERT: Disk usage at " $5 "%"}' >> /var/log/disk-alert.log
```

### Check HTTP Endpoint Health

Verify your services are responding:

```bash
*/10 * * * * curl -sf --max-time 10 https://cloud.yourdomain.com/status.php > /dev/null || echo "$(date): Nextcloud DOWN" >> /var/log/health-check.log
```

## Log Management

### Compress Logs Older Than 7 Days

```bash
0 1 * * * find /var/log -name "*.log" -mtime +7 -not -name "*.gz" -exec gzip {} \; 2>/dev/null
```

### Truncate Large Log Files Monthly

For application logs that grow unbounded:

```bash
0 0 1 * * for f in /srv/*/logs/*.log; do [ $(stat -f%z "$f" 2>/dev/null || stat -c%s "$f") -gt 104857600 ] && truncate -s 0 "$f" && echo "$(date): Truncated $f" >> /var/log/log-rotation.log; done
```

This truncates any log file over 100 MB.

## System Maintenance

### Update Package Lists Weekly

```bash
0 6 * * 1 apt-get update >> /var/log/apt-update.log 2>&1
```

Don't auto-upgrade — just update the package index so you know what's available. Review and apply updates manually or with [unattended-upgrades](https://wiki.debian.org/UnattendedUpgrades) for security patches only.

### Security Updates Only — Automatic

On Debian/Ubuntu with unattended-upgrades configured:

```bash
0 6 * * * /usr/bin/unattended-upgrade -d >> /var/log/unattended-upgrades/cron.log 2>&1
```

### Sync Time with NTP

Most modern systems use `systemd-timesyncd`, but if you need manual sync:

```bash
0 */6 * * * /usr/sbin/ntpdate pool.ntp.org >> /var/log/ntp-sync.log 2>&1
```

## Dynamic DNS Update

If your home IP changes and you use [Dynamic DNS](/foundations/dynamic-dns):

```bash
*/5 * * * * /usr/local/bin/update-ddns.sh >> /var/log/ddns.log 2>&1
```

## Crontab Best Practices

### Always Redirect Output

Without redirection, cron sends output as email (which usually fails on servers without a mail system configured):

```bash
# Bad — output goes nowhere useful
0 2 * * * /backup.sh

# Good — output goes to a log file
0 2 * * * /backup.sh >> /var/log/backup.log 2>&1
```

### Use Full Paths

Cron runs with a minimal PATH. Always use absolute paths for commands:

```bash
# Bad — docker might not be in cron's PATH
0 2 * * * docker system prune -f

# Good
0 2 * * * /usr/bin/docker system prune -f
```

Find the full path with `which docker`.

### Escape Percent Signs

In crontab, `%` is a special character (newline). Escape it with `\%`:

```bash
# Bad — breaks
0 2 * * * echo $(date +%Y%m%d)

# Good
0 2 * * * echo $(date +\%Y\%m\%d)
```

### Stagger Jobs

Don't schedule everything at the same time:

```bash
# Bad — everything at 2 AM
0 2 * * * /backup.sh
0 2 * * * /docker-prune.sh
0 2 * * * /cert-renew.sh

# Good — spread across the night
0 2 * * * /backup.sh
30 3 * * * /docker-prune.sh
0 4 * * * /cert-renew.sh
```

### Test Before Scheduling

Run the command manually first to verify it works:

```bash
# Test the command
/usr/bin/docker system prune -af --volumes

# Then add to crontab
crontab -e
```

## Common Mistakes

### Job Runs But Nothing Happens

Most common cause: wrong PATH. Cron's default PATH is minimal. Use full paths to all binaries.

### Job Doesn't Run At All

Check cron is running:

```bash
systemctl status cron
```

Check the cron log:

```bash
grep CRON /var/log/syslog
```

Verify your crontab is saved:

```bash
crontab -l
```

### "No MTA installed" Warnings

Cron tries to email command output. Either redirect output to a file (recommended) or install a mail system.

### Timezone Issues

Cron uses the system timezone. Check with `timedatectl`. If your server is in UTC but you want jobs at 2 AM local time, convert the hour.

## Next Steps

Crontab covers most scheduling needs for self-hosting. For more complex scheduling (dependencies between jobs, retry logic, conditional execution), consider [systemd timers](/foundations/linux-systemd) or self-hosted automation tools like [n8n](/apps/n8n).

## FAQ

### Should I use cron or systemd timers?

Cron for simple, recurring jobs. [Systemd timers](/foundations/linux-systemd) for jobs that need dependency management, better logging, or resource controls. For most self-hosting maintenance tasks, cron is simpler and sufficient.

### How do I see what cron jobs are scheduled?

Run `crontab -l` for your user's jobs. Check `/etc/crontab` and `/etc/cron.d/` for system-level jobs. Some packages install their own cron jobs in `/etc/cron.daily/`, `/etc/cron.weekly/`, etc.

### Can I run a cron job as a specific user?

Yes. Edit that user's crontab with `sudo crontab -u username -e`. Or use the system crontab `/etc/crontab` which has a user field.

### How do I debug a failing cron job?

Redirect both stdout and stderr to a log file (`>> /var/log/myjob.log 2>&1`), then check the log after the scheduled time. Also check `/var/log/syslog` for cron execution records.

## Related

- [Cron Jobs for Maintenance](/foundations/linux-cron-jobs)
- [Systemd Service Basics](/foundations/linux-systemd)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule)
- [Backing Up Docker Volumes](/foundations/backup-docker-volumes)
- [Docker Automatic Updates](/foundations/docker-automatic-updates)
- [Log Management for Home Servers](/foundations/log-management)
