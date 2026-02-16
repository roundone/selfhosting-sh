---
title: "Self-Hosting Security Checklist"
description: "A complete security checklist for self-hosted servers — SSH hardening, firewalls, Docker security, updates, and monitoring."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "security", "checklist", "hardening", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why a Security Checklist?

When you self-host, you're responsible for securing everything. There's no cloud provider handling patches, no managed firewall, no security team. A misconfigured server gets compromised — often within hours of being exposed to the internet.

This checklist covers every layer of security for a self-hosted server. Work through it from top to bottom. The items are ordered by impact — do the top ones first, they block the most common attacks.

## The Checklist

### SSH Hardening (Critical)

SSH is the primary target for automated attacks. Thousands of bots scan the internet for weak SSH configurations.

- [ ] **Disable password authentication** — use key-based auth only
  ```bash
  # /etc/ssh/sshd_config
  PasswordAuthentication no
  PubkeyAuthentication yes
  ```
  See [SSH Setup](/foundations/ssh-setup) for the complete guide.

- [ ] **Disable root login over SSH**
  ```bash
  # /etc/ssh/sshd_config
  PermitRootLogin no
  ```

- [ ] **Use Ed25519 keys** (not RSA)
  ```bash
  ssh-keygen -t ed25519 -C "your-email@example.com"
  ```

- [ ] **Change the default SSH port** (optional but reduces noise)
  ```bash
  # /etc/ssh/sshd_config
  Port 2222
  ```

- [ ] **Install and configure fail2ban**
  ```bash
  sudo apt install -y fail2ban
  ```
  See [Fail2ban Setup](/foundations/fail2ban) for configuration.

- [ ] **Limit SSH access to specific users**
  ```bash
  # /etc/ssh/sshd_config
  AllowUsers yourusername
  ```

### Firewall (Critical)

A firewall blocks all traffic except what you explicitly allow. Without one, every service on your server is reachable from the internet.

- [ ] **Enable UFW and set default deny**
  ```bash
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh    # or your custom SSH port
  sudo ufw enable
  ```
  See [Firewall Setup with UFW](/foundations/firewall-ufw) for the full guide.

- [ ] **Only open ports you actually use** — every open port is an attack surface
- [ ] **Review open ports regularly**
  ```bash
  sudo ss -tlnp
  ```

### System Updates (Critical)

Unpatched software is the most common way servers get compromised after weak SSH.

- [ ] **Enable automatic security updates**
  ```bash
  sudo apt install -y unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

- [ ] **Update the system regularly**
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Update Docker images regularly** — see [Updating Docker Containers](/foundations/docker-updating)

- [ ] **Subscribe to security advisories** for software you run (GitHub watch → releases)

### Docker Security (High Priority)

Docker containers add their own security considerations.

- [ ] **Don't run containers as root** where possible
  ```yaml
  services:
    myapp:
      user: "1000:1000"
  ```

- [ ] **Use read-only filesystems** for containers that don't need to write
  ```yaml
  services:
    myapp:
      read_only: true
      tmpfs:
        - /tmp
  ```

- [ ] **Limit container capabilities**
  ```yaml
  services:
    myapp:
      cap_drop:
        - ALL
      cap_add:
        - NET_BIND_SERVICE  # Only add what's needed
  ```

- [ ] **Don't expose the Docker socket** to containers unless absolutely necessary (like Traefik or Portainer). If you must, mount it read-only: `/var/run/docker.sock:/var/run/docker.sock:ro`

- [ ] **Pin image versions** — never use `:latest`

- [ ] **Use non-root container images** when available (many images support this)

- [ ] **Don't use `--privileged`** unless the app genuinely requires it (very few do)

- [ ] **Review Docker network exposure** — use internal networks for service-to-service communication
  ```yaml
  networks:
    internal:
      internal: true  # Not accessible from host network
  ```

See [Docker Security Best Practices](/foundations/docker-security) for the complete guide.

### Reverse Proxy Security (High Priority)

Your reverse proxy is the front door to all services.

- [ ] **Force HTTPS everywhere** — redirect all HTTP to HTTPS
- [ ] **Use automatic SSL certificates** from Let's Encrypt — see [Let's Encrypt Explained](/foundations/lets-encrypt-explained)
- [ ] **Set security headers**
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  ```
- [ ] **Don't expose admin interfaces** (Portainer, database admin tools) to the internet — use SSH tunnels or VPN instead. See [SSH Tunneling](/foundations/ssh-tunneling)
- [ ] **Rate-limit authentication endpoints**
- [ ] **Use basic auth or IP restriction** for sensitive dashboards

### Authentication (High Priority)

- [ ] **Use strong, unique passwords** for every service — generate with:
  ```bash
  openssl rand -base64 32
  ```

- [ ] **Enable two-factor authentication** on every service that supports it — see [Two-Factor Authentication](/foundations/two-factor-auth)

- [ ] **Use a self-hosted password manager** like [Vaultwarden](/apps/vaultwarden) to manage credentials

- [ ] **Change default credentials immediately** after deploying any service

- [ ] **Don't reuse passwords** between services — if one is compromised, others remain safe

### Network Security (Medium Priority)

- [ ] **Disable UPnP on your router** — prevents devices from opening ports without your knowledge
- [ ] **Use VLANs to segment your network** — see [Subnets and VLANs](/foundations/subnets-vlans)
  - Servers on one VLAN
  - IoT devices on another (they can't reach your server)
  - Personal devices on a third
- [ ] **Use Tailscale or WireGuard for remote access** instead of port forwarding — see [Tailscale Setup](/foundations/tailscale-setup) or [WireGuard Setup](/foundations/wireguard-setup)
- [ ] **Disable IPv6 if you're not using it** — it can bypass your IPv4 firewall rules
- [ ] **Minimize port forwarding** — prefer Cloudflare Tunnel for web services. See [Cloudflare Tunnel](/foundations/cloudflare-tunnel)

### Data Protection (Medium Priority)

- [ ] **Follow the 3-2-1 backup rule** — see [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- [ ] **Encrypt backups** — especially off-site backups
- [ ] **Test backup restores** — a backup you can't restore is not a backup
- [ ] **Use full-disk encryption** on your server (LUKS) if physical theft is a concern
- [ ] **Store secrets in `.env` files**, not in `docker-compose.yml` — and ensure `.env` is in `.gitignore`
- [ ] **Never commit credentials to git**

### Monitoring and Detection (Medium Priority)

- [ ] **Monitor system resources** — see [Monitoring Basics](/foundations/monitoring-basics)
- [ ] **Set up uptime monitoring** — use [Uptime Kuma](/apps/uptime-kuma) to alert on service failures
- [ ] **Review logs regularly**
  ```bash
  # Check auth logs for suspicious activity
  sudo journalctl -u sshd --since "24 hours ago"

  # Check fail2ban bans
  sudo fail2ban-client status sshd
  ```
- [ ] **Monitor for unauthorized containers**
  ```bash
  docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
  ```
- [ ] **Set up alerts for critical events** — disk full, service down, unusual CPU/memory usage

### DNS Security (Lower Priority)

- [ ] **Use encrypted DNS** (DoH or DoT) — see [Encrypted DNS](/foundations/encrypted-dns)
- [ ] **Run your own DNS resolver** — [Pi-hole](/apps/pi-hole) or [AdGuard Home](/apps/adguard-home)
- [ ] **Enable DNSSEC** on your domain if your registrar supports it

## Quick-Start: Minimum Viable Security

If you're setting up a new server, do these 5 things first:

1. **SSH keys only** — disable password auth
2. **Firewall on** — UFW with default deny, allow only SSH + needed ports
3. **Automatic updates** — unattended-upgrades enabled
4. **Fail2ban** — installed and running
5. **Strong passwords** — unique, generated, stored in a password manager

Everything else can be added incrementally.

## Common Mistakes

### Security Through Obscurity

Changing your SSH port to 2222 reduces log noise from bots, but it's not real security. A determined attacker scans all ports. Focus on key-based auth and fail2ban first — those actually stop attacks.

### Exposing Admin Interfaces

Portainer, phpMyAdmin, Adminer, Grafana — these should never be directly accessible from the internet. Use SSH tunnels, Tailscale, or IP-restricted reverse proxy rules. A compromised admin panel gives full control of your infrastructure.

### Set and Forget

Security isn't a one-time task. Software gets new vulnerabilities, containers need updates, configs drift. Review this checklist monthly. Check your firewall rules. Review what's running. Update everything.

### Oversharing in Error Pages

Default error pages from reverse proxies and web servers can leak software versions and internal paths. Configure custom error pages that don't reveal server details.

## Next Steps

- Start with SSH — [SSH Setup](/foundations/ssh-setup)
- Set up your firewall — [Firewall Setup with UFW](/foundations/firewall-ufw)
- Harden Docker — [Docker Security Best Practices](/foundations/docker-security)
- Plan your backups — [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)

## FAQ

### How often should I update my server?

Enable unattended-upgrades for automatic security patches. For Docker images, check for updates weekly. For major OS upgrades, plan and test — don't auto-upgrade between major versions.

### Do I need a VPN if I use Cloudflare Tunnel?

Cloudflare Tunnel handles web services well. But for non-web access (SSH, database connections, internal tools), you still benefit from a VPN like Tailscale or WireGuard. They complement each other.

### Is self-hosting less secure than cloud services?

It depends entirely on your configuration. A properly secured self-hosted server can be more secure than a cloud service — you control the data, the access, and the encryption. A poorly secured one is much worse. This checklist helps you get it right.

### Should I use SELinux or AppArmor?

Both add mandatory access control that limits what processes can do. Ubuntu ships with AppArmor enabled by default. For most self-hosters, the default AppArmor profiles plus Docker's built-in seccomp profiles provide good protection without additional configuration. Advanced users can create custom AppArmor profiles for high-risk services.

## Related

- [SSH Setup](/foundations/ssh-setup)
- [Fail2ban Setup](/foundations/fail2ban)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [Docker Security Best Practices](/foundations/docker-security)
- [Two-Factor Authentication](/foundations/two-factor-auth)
- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- [Tailscale Setup](/foundations/tailscale-setup)
- [Monitoring Basics](/foundations/monitoring-basics)
