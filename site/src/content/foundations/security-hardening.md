---
title: "Server Security Hardening Guide"
description: "Harden your self-hosting server — SSH lockdown, firewall rules, automatic updates, Docker security, intrusion detection, and audit logging."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["security", "hardening", "ssh", "firewall", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Hardening Matters

A self-hosting server exposed to the internet gets probed within minutes of going online. Automated bots scan for default credentials, open ports, and known vulnerabilities. Hardening reduces your attack surface so that only intended services are accessible and everything else is locked down.

This guide covers the essential hardening steps. Apply them in order — each builds on the previous one.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- Root or sudo access ([SSH Setup](/foundations/ssh-setup))
- Basic command line familiarity ([Linux Basics](/foundations/linux-basics-self-hosting))

## 1. SSH Hardening

SSH is the most attacked service on any server. Lock it down first.

### Disable Root Login

```bash
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
```

### Disable Password Authentication

Use SSH keys only. Passwords are brute-forceable; keys are not.

```bash
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
```

### Change Default Port (Optional)

Moving SSH off port 22 eliminates 99% of automated attacks:

```bash
# /etc/ssh/sshd_config
Port 2222  # Choose a port above 1024
```

### Limit SSH Access to Specific Users

```bash
# /etc/ssh/sshd_config
AllowUsers yourusername
```

### Apply Changes

```bash
sudo systemctl restart sshd
```

**Test SSH access in a NEW terminal before closing the current session.** If you lock yourself out, you'll need console access to fix it.

See [SSH Setup](/foundations/ssh-setup) for the complete guide including key generation.

## 2. Firewall Configuration

Allow only the ports you need. Block everything else.

### UFW (Recommended for Simplicity)

```bash
# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (adjust port if you changed it)
sudo ufw allow 2222/tcp comment 'SSH'

# Allow HTTP and HTTPS for reverse proxy
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# Allow WireGuard (if using)
sudo ufw allow 51820/udp comment 'WireGuard'

# Enable the firewall
sudo ufw enable

# Verify
sudo ufw status verbose
```

**Important:** Docker bypasses UFW by default. See the Docker-specific firewall section below.

See [Firewall Setup](/foundations/firewall-ufw) for the full guide.

## 3. Automatic Security Updates

Security patches should install automatically. You don't want a server compromised because a critical patch sat uninstalled.

### Ubuntu/Debian: unattended-upgrades

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Verify the configuration:

```bash
# /etc/apt/apt.conf.d/50unattended-upgrades
# These should be uncommented:
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};

# Optional: auto-reboot when needed (for kernel updates)
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "03:00";
```

### Check It's Working

```bash
# View unattended-upgrades log
cat /var/log/unattended-upgrades/unattended-upgrades.log

# Test (dry run)
sudo unattended-upgrade --dry-run --debug
```

## 4. User Account Security

### Create a Non-Root User

Never use root directly. Use a regular user with sudo.

```bash
# Create user
sudo adduser selfhost

# Grant sudo access
sudo usermod -aG sudo selfhost

# Switch to the new user
su - selfhost
```

### Set Strong sudo Defaults

```bash
# /etc/sudoers.d/hardening
Defaults    timestamp_timeout=5    # Re-prompt after 5 minutes
Defaults    passwd_tries=3         # Lock after 3 wrong attempts
Defaults    logfile="/var/log/sudo.log"  # Log sudo usage
```

```bash
sudo visudo -f /etc/sudoers.d/hardening
```

## 5. fail2ban — Intrusion Prevention

fail2ban monitors logs for repeated failed login attempts and temporarily bans the offending IP.

```bash
sudo apt install fail2ban
```

```bash
# /etc/fail2ban/jail.local
sudo tee /etc/fail2ban/jail.local > /dev/null <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port = 2222
maxretry = 3
bantime = 24h
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban
```

Check status:

```bash
sudo fail2ban-client status sshd
# Shows number of currently banned IPs
```

See [fail2ban Guide](/foundations/fail2ban) for detailed configuration.

## 6. Docker Security

### Don't Expose Ports Unnecessarily

```yaml
# BAD — every port is accessible from the internet
ports:
  - "8080:8080"

# BETTER — only accessible from localhost (use reverse proxy)
ports:
  - "127.0.0.1:8080:8080"

# BEST — no host port, only Docker network
expose:
  - "8080"
```

### Docker Bypasses UFW — Fix It

Docker adds iptables rules that bypass UFW. Published ports are accessible even if UFW denies them.

**Fix: Bind sensitive containers to localhost and use a reverse proxy.**

```yaml
services:
  # Reverse proxy gets public ports
  caddy:
    ports:
      - "80:80"
      - "443:443"

  # Everything else is localhost-only or internal
  nextcloud:
    ports:
      - "127.0.0.1:8080:80"

  postgres:
    # No ports section — only accessible on Docker network
    expose:
      - "5432"
```

### Run Containers as Non-Root

```yaml
services:
  myapp:
    user: "1000:1000"
    read_only: true  # Read-only filesystem where possible
    security_opt:
      - no-new-privileges:true  # Prevent privilege escalation
```

### Limit Container Capabilities

```yaml
services:
  myapp:
    cap_drop:
      - ALL          # Drop all Linux capabilities
    cap_add:
      - NET_BIND_SERVICE  # Only add what's needed
```

### Don't Mount the Docker Socket

Mounting `/var/run/docker.sock` gives a container full control over Docker (and effectively root on the host).

```yaml
# AVOID unless absolutely necessary
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

Only Portainer, Traefik, and similar management tools need socket access. For these, consider using a Docker socket proxy.

See [Docker Security](/foundations/docker-security) for the complete guide.

## 7. Network Security

### Disable Unused Services

```bash
# List all listening services
sudo ss -tlnp

# Disable anything you don't need
sudo systemctl disable --now service_name
```

### Rate Limit with iptables

```bash
# Rate limit new SSH connections (if not using fail2ban)
sudo iptables -A INPUT -p tcp --dport 2222 -m conntrack --ctstate NEW -m limit --limit 3/min --limit-burst 3 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 2222 -m conntrack --ctstate NEW -j DROP
```

### Enable SYN Cookies

Protects against SYN flood attacks:

```bash
echo 'net.ipv4.tcp_syncookies = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Disable ICMP Redirects

```bash
sudo tee -a /etc/sysctl.conf > /dev/null <<'EOF'
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
EOF
sudo sysctl -p
```

## 8. File System Security

### Set Proper Permissions

```bash
# Restrict cron access
sudo chmod 700 /etc/crontab
sudo chmod 700 /etc/cron.d
sudo chmod 700 /etc/cron.daily

# Restrict SSH config
sudo chmod 600 /etc/ssh/sshd_config
```

### Enable audit logging (Optional)

```bash
sudo apt install auditd
sudo systemctl enable auditd

# Log all authentication events
sudo auditctl -w /etc/passwd -p wa -k identity
sudo auditctl -w /etc/shadow -p wa -k identity
sudo auditctl -w /var/log/auth.log -p wa -k auth
```

## 9. DNS Security

### Use Encrypted DNS

Prevent DNS snooping by using DNS over HTTPS or DNS over TLS.

```bash
# Configure systemd-resolved to use DNS over TLS
sudo tee /etc/systemd/resolved.conf.d/dns-tls.conf > /dev/null <<'EOF'
[Resolve]
DNS=1.1.1.1#cloudflare-dns.com 8.8.8.8#dns.google
DNSOverTLS=yes
EOF
sudo systemctl restart systemd-resolved
```

See [Encrypted DNS](/foundations/encrypted-dns) for full setup.

## 10. Regular Maintenance

### Security Checklist (Monthly)

```bash
# Check for available updates
sudo apt update && apt list --upgradable

# Review failed login attempts
sudo journalctl -u sshd | grep "Failed password" | tail -20

# Check fail2ban bans
sudo fail2ban-client status sshd

# Review open ports
sudo ss -tlnp

# Check running Docker containers
docker ps

# Review Docker images for updates
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedSince}}"

# Check disk usage
df -h
docker system df
```

See [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist) for the complete checklist.

## Hardening Summary

| Layer | Action | Priority |
|-------|--------|----------|
| SSH | Key-only auth, disable root, fail2ban | Critical |
| Firewall | UFW deny-all, allow only needed ports | Critical |
| Updates | Automatic security updates | Critical |
| Docker | Bind to localhost, no unnecessary ports | High |
| Users | Non-root user, strong sudo config | High |
| Network | Disable unused services, sysctl hardening | Medium |
| Monitoring | Audit logs, log review | Medium |

## FAQ

### Is self-hosting less secure than cloud services?

Not inherently. Cloud services have dedicated security teams, but they're also massive targets. A properly hardened self-hosted server has a tiny attack surface. The key is actually applying hardening measures — most breaches exploit missing basics like default passwords and unpatched software.

### How often should I review my security configuration?

Monthly for the checklist above. Immediately when you add a new service or change network configuration. Subscribe to security mailing lists for your OS (Ubuntu Security Notices, Debian Security Advisories).

### Should I use a VPN to access my server instead of exposing SSH?

Yes, if you can. Using Tailscale or WireGuard to access your server, then closing SSH's public port, is the most secure approach. See [Tailscale Setup](/foundations/tailscale-setup) and [WireGuard Setup](/foundations/wireguard-setup).

### Is Docker's default security enough?

Docker provides good isolation by default (namespaces, cgroups, seccomp profiles). The main risk is misconfiguration — mounting sensitive host paths, running containers as root with unnecessary capabilities, or exposing the Docker socket. Apply the Docker security measures in this guide and you're well ahead of most setups.

## Related

- [SSH Setup](/foundations/ssh-setup)
- [Firewall Setup](/foundations/firewall-ufw)
- [fail2ban Guide](/foundations/fail2ban)
- [Docker Security](/foundations/docker-security)
- [Self-Hosting Security Checklist](/foundations/selfhosting-security-checklist)
- [Two-Factor Authentication](/foundations/two-factor-auth)
- [Encrypted DNS](/foundations/encrypted-dns)
