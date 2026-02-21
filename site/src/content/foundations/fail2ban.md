---
title: "Fail2ban Setup for Self-Hosting"
description: "Install and configure fail2ban to protect your self-hosted server from brute-force attacks on SSH, web apps, and Docker services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "fail2ban", "security", "ssh", "linux"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Fail2ban?

Fail2ban monitors log files for repeated failed authentication attempts and temporarily bans the offending IP addresses. Point a server at the internet and within hours you will see thousands of automated SSH login attempts from botnets. Fail2ban detects these patterns and adds firewall rules to block the attackers.

It works with SSH, web applications, mail servers, and any service that logs authentication failures. For self-hosting, fail2ban is essential on any server with ports exposed to the internet.

## Prerequisites

- A Linux server running Ubuntu 22.04+ or Debian 12+ ([Getting Started](/foundations/getting-started/))
- [SSH access](/foundations/ssh-setup/) to your server
- [UFW firewall](/foundations/firewall-ufw/) configured (recommended but not required)
- Root or sudo access

## Installing Fail2ban

```bash
sudo apt update && sudo apt install fail2ban -y
```

Fail2ban starts automatically after installation. Check the status:

```bash
sudo systemctl status fail2ban
```

## Configuration

Fail2ban's config files:
- `/etc/fail2ban/jail.conf` — default configuration (never edit this — it gets overwritten on updates)
- `/etc/fail2ban/jail.local` — your overrides (create this file)
- `/etc/fail2ban/jail.d/` — additional config files (alternative to `jail.local`)

Create your configuration:

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
# Ban duration: 1 hour
bantime = 3600

# Detection window: 10 minutes
findtime = 600

# Max failures before ban
maxretry = 5

# Ban action — use UFW if you have it, iptables otherwise
banaction = ufw
# banaction = iptables-multiport  # Use this if not using UFW

# Email notifications (optional — requires mail setup)
# destemail = your@email.com
# sender = fail2ban@example.com
# action = %(action_mwl)s

# Ignore local network
ignoreip = 127.0.0.1/8 ::1 192.168.1.0/24

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
```

Restart fail2ban to apply:

```bash
sudo systemctl restart fail2ban
```

### Key Settings Explained

| Setting | What It Does | Recommended Value |
|---------|-------------|------------------|
| `bantime` | How long an IP stays banned | `3600` (1 hour) for SSH, longer for repeated offenders |
| `findtime` | Time window for counting failures | `600` (10 minutes) |
| `maxretry` | Failures allowed before ban | `3` for SSH, `5` for web apps |
| `ignoreip` | IPs that are never banned | Your local subnet + localhost |
| `banaction` | Firewall backend to use | `ufw` if using UFW, `iptables-multiport` otherwise |

## Protecting SSH

The SSH jail is the most important. Most bots target SSH on port 22 with dictionary attacks.

```ini
[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600
```

Combined with [SSH key authentication](/foundations/ssh-setup/) (which disables password login), this makes SSH extremely secure. The bots still get banned quickly, reducing log noise and server load.

### Aggressive Mode for Repeat Offenders

Use `recidive` jail to escalate bans for IPs that get banned repeatedly:

```ini
[recidive]
enabled = true
bantime = 604800    # 1 week
findtime = 86400    # 1 day
maxretry = 3        # Banned 3 times in a day = week-long ban
logpath = /var/log/fail2ban.log
```

## Protecting Web Applications

If you expose web applications directly (without Cloudflare proxy), add jails for common attacks:

### Nginx (behind your reverse proxy)

```ini
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-botsearch]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
```

### Vaultwarden (Password Manager)

Vaultwarden logs failed login attempts. Create a custom filter:

```bash
sudo nano /etc/fail2ban/filter.d/vaultwarden.conf
```

```ini
[Definition]
failregex = ^.*Username or password is incorrect\. Try again\. IP: <HOST>\. Username:.*$
ignoreregex =
```

Add the jail:

```ini
[vaultwarden]
enabled = true
port = 80,443
filter = vaultwarden
logpath = /path/to/vaultwarden/vaultwarden.log
maxretry = 5
bantime = 3600
```

**Note:** Vaultwarden must be configured to log to a file (`LOG_FILE` environment variable) and to log failed attempts (`LOG_LEVEL=warn`).

### Nextcloud

```bash
sudo nano /etc/fail2ban/filter.d/nextcloud.conf
```

```ini
[Definition]
failregex = ^.*Login failed: '.*' \(Remote IP: '<HOST>'\).*$
ignoreregex =
```

```ini
[nextcloud]
enabled = true
port = 80,443
filter = nextcloud
logpath = /path/to/nextcloud/data/nextcloud.log
maxretry = 5
bantime = 3600
```

## Docker Considerations

Fail2ban reads log files, but Docker containers write logs to Docker's logging driver, not to host files. You have two options:

**Option 1: Map container logs to host files**

```yaml
services:
  myapp:
    image: myapp:1.0
    volumes:
      - ./logs:/var/log/myapp  # Map log directory to host
    restart: unless-stopped
```

Then point fail2ban's `logpath` to the mapped host directory.

**Option 2: Use Docker's json-file logging driver with a known path**

Docker stores container logs at `/var/lib/docker/containers/<id>/<id>-json.log`. This path is not human-friendly and changes with container recreation. Option 1 is more reliable.

**Important:** If your services are behind a reverse proxy, the IP addresses in application logs may all be the reverse proxy's IP (usually `172.x.x.x`). Configure your reverse proxy to pass the real client IP via `X-Forwarded-For` or `X-Real-IP` headers, and configure the application to log the real IP.

## Monitoring Fail2ban

```bash
# Show status of all jails
sudo fail2ban-client status

# Show status of a specific jail (banned IPs, total bans)
sudo fail2ban-client status sshd

# Manually unban an IP
sudo fail2ban-client set sshd unbanip 203.0.113.50

# Manually ban an IP
sudo fail2ban-client set sshd banip 203.0.113.50

# Check fail2ban log
sudo tail -f /var/log/fail2ban.log
```

Example output of `fail2ban-client status sshd`:

```
Status for the jail: sshd
|- Filter
|  |- Currently failed: 2
|  |- Total failed:     847
|  `- File list:        /var/log/auth.log
`- Actions
   |- Currently banned: 15
   |- Total banned:     312
   `- Banned IP list:   203.0.113.1 198.51.100.5 ...
```

## Common Mistakes

### Banning yourself
If you mistype your SSH password 3 times, you get banned. Always set `ignoreip` to include your local subnet (`192.168.1.0/24`) and any static IP you connect from. If you do get banned, access the server via your VPS provider's web console and run `sudo fail2ban-client set sshd unbanip YOUR_IP`.

### Not checking the logpath
Fail2ban silently does nothing if the logpath does not exist. Verify the log file path exists and contains the expected failure messages:

```bash
# Check if the log file exists
ls -la /var/log/auth.log

# Check if it contains SSH failures
grep "Failed password" /var/log/auth.log | tail -5
```

### Using iptables banaction with UFW
If you use UFW, set `banaction = ufw` in your jail.local. Using `iptables-multiport` alongside UFW creates conflicting firewall rules.

### Setting bantime too short
A 5-minute ban barely slows down bots. They cycle through IPs and come back immediately. Use at least 1 hour (`bantime = 3600`) for SSH, and enable the `recidive` jail for repeat offenders.

### Not restarting after config changes
Fail2ban does not auto-reload configuration. After editing `jail.local`:

```bash
sudo systemctl restart fail2ban
```

## Next Steps

- Harden [SSH with key-based authentication](/foundations/ssh-setup/) to make password brute-force irrelevant
- Configure your [firewall with UFW](/foundations/firewall-ufw/) for static port rules
- Set up [SSL certificates](/foundations/ssl-certificates/) to encrypt all connections
- Learn about [Docker networking](/foundations/docker-networking/) for container security
- Set up [monitoring](/foundations/monitoring-basics/) to track banned IPs and attack patterns

## FAQ

### Do I need fail2ban if I use SSH keys and disable password login?
It is still useful. Fail2ban reduces log noise and server load from bots hammering your SSH port. Without it, bots still consume CPU and bandwidth trying (and failing) to authenticate. Fail2ban bans them after a few attempts, stopping the traffic entirely.

### Does fail2ban work with Cloudflare proxy?
Not directly for web jails. Cloudflare's proxy means all traffic comes from Cloudflare's IP ranges, not the real client IP. Use Cloudflare's built-in WAF and rate limiting instead. Fail2ban still works for SSH and non-proxied services.

### How many IPs will fail2ban typically ban?
A server with SSH on port 22 open to the internet typically bans 50-200+ unique IPs per day. This is normal. The internet is full of bots scanning every IP for open SSH ports.

### Can fail2ban permanently ban IPs?
Set `bantime = -1` for permanent bans. Be careful — this grows the ban list indefinitely and can slow down firewall rule processing over time. The `recidive` jail with week-long bans for repeat offenders is a better approach.

## Related

- [SSH Setup Guide](/foundations/ssh-setup/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Docker Networking](/foundations/docker-networking/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
