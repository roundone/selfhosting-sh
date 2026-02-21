---
title: "Firewall Setup with UFW"
description: "Set up UFW (Uncomplicated Firewall) on your Linux server to control network access and secure your self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "firewall", "ufw", "security", "linux"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is UFW?

UFW (Uncomplicated Firewall) is a user-friendly frontend for Linux's iptables firewall. It controls which network traffic can reach your server and which ports are open. On a self-hosting server exposed to the internet, a firewall is not optional — it is the first line of defense against unauthorized access.

UFW ships with Ubuntu and is the recommended firewall for self-hosting setups. It is simple to configure, hard to misconfigure, and works perfectly with Docker (with one important caveat covered below).

## Prerequisites

- A Linux server running Ubuntu 22.04+ or Debian 12+ ([Getting Started](/foundations/getting-started/))
- SSH access to your server ([SSH Setup](/foundations/ssh-setup/))
- Root or sudo access

## Installing and Enabling UFW

UFW is pre-installed on Ubuntu. On Debian, install it:

```bash
sudo apt update && sudo apt install ufw -y
```

**Before enabling UFW, allow SSH first.** If you enable the firewall without an SSH rule, you lock yourself out:

```bash
# Allow SSH (CRITICAL — do this first)
sudo ufw allow 22/tcp

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Enable the firewall
sudo ufw enable
```

The defaults mean: block all incoming connections except those you explicitly allow, and allow all outgoing connections. This is the correct starting point.

Verify the status:

```bash
sudo ufw status verbose
```

```
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
22/tcp (v6)                ALLOW IN    Anywhere (v6)
```

## Common Rules for Self-Hosting

### Allow Web Traffic (HTTP/HTTPS)

```bash
# Allow HTTP and HTTPS (required for reverse proxy)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

If you run a [reverse proxy](/foundations/reverse-proxy-explained/), these are the only ports that need to be open for web services. The reverse proxy routes traffic to individual containers internally.

### Allow Specific Ports

```bash
# WireGuard VPN
sudo ufw allow 51820/udp

# Plex (direct access, not behind reverse proxy)
sudo ufw allow 32400/tcp

# Minecraft server
sudo ufw allow 25565/tcp
```

### Allow from Specific IPs

```bash
# Allow SSH only from your local network
sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp

# Allow Portainer from local network only
sudo ufw allow from 192.168.1.0/24 to any port 9443 proto tcp
```

### Delete Rules

```bash
# List rules with numbers
sudo ufw status numbered

# Delete rule by number
sudo ufw delete 3

# Delete by specification
sudo ufw delete allow 8080/tcp
```

### Rate Limiting

UFW can rate-limit connections to prevent brute-force attacks:

```bash
# Rate-limit SSH (denies connections if 6+ attempts in 30 seconds)
sudo ufw limit 22/tcp
```

This is a lightweight alternative to [fail2ban](/foundations/fail2ban/) for SSH protection.

## The Docker and UFW Problem

**This is critical to understand.** Docker modifies iptables directly, bypassing UFW entirely. If you expose a port in Docker (`ports: "8080:80"`), that port is accessible from the internet regardless of your UFW rules.

Example: You have UFW configured to deny all incoming traffic. You run a container with `ports: "3000:3000"`. Port 3000 is now open to the entire internet. UFW did not block it.

### Solutions

**Option 1: Bind to localhost (recommended)**

In your Docker Compose files, bind exposed ports to `127.0.0.1`:

```yaml
services:
  myapp:
    image: myapp:1.0
    ports:
      - "127.0.0.1:3000:3000"  # Only accessible locally
    restart: unless-stopped
```

The service is now only reachable from the server itself. Your [reverse proxy](/foundations/reverse-proxy-explained/) (which runs on the same server) can still reach it. External traffic hits the reverse proxy on ports 80/443, which forwards to `127.0.0.1:3000`.

**Option 2: Use Docker networks without port exposure**

If the service only needs to be reached by other containers (like a reverse proxy), do not expose the port at all:

```yaml
services:
  myapp:
    image: myapp:1.0
    # No "ports:" section — not exposed to the host
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
    external: true
```

The reverse proxy connects to `myapp:3000` via the Docker network. Nothing is exposed to the host or the internet.

**Option 3: Disable Docker's iptables modification**

Add to `/etc/docker/daemon.json`:

```json
{
  "iptables": false
}
```

Then restart Docker:

```bash
sudo systemctl restart docker
```

**Warning:** This breaks Docker's default networking. Containers cannot reach the internet unless you manually configure iptables rules for NAT. Only use this if you understand iptables well.

**The recommendation:** Use Option 1 (bind to localhost) for services behind a reverse proxy. Use Option 2 for services that only talk to other containers. Only expose ports directly (`"8080:80"`) for services that specifically need direct access (WireGuard, game servers).

## Full Example: Secure Self-Hosting Firewall

```bash
# Reset UFW to defaults
sudo ufw reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH — rate-limited, from local network only
sudo ufw limit from 192.168.1.0/24 to any port 22 proto tcp

# Web traffic — for reverse proxy
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# WireGuard VPN — for remote access
sudo ufw allow 51820/udp

# Enable
sudo ufw enable

# Verify
sudo ufw status verbose
```

This setup:
- Blocks all incoming traffic by default
- Allows SSH only from your local network, rate-limited
- Allows HTTP/HTTPS for your reverse proxy
- Allows WireGuard for remote access
- Permits all outgoing connections (for updates, DNS, etc.)

## Checking and Troubleshooting

```bash
# Show current rules
sudo ufw status numbered

# Show verbose status with defaults
sudo ufw status verbose

# Check UFW logs
sudo journalctl -u ufw

# Temporarily disable UFW (for testing)
sudo ufw disable

# Re-enable
sudo ufw enable
```

## Common Mistakes

### Enabling UFW without allowing SSH first
You will lock yourself out. Always `sudo ufw allow 22/tcp` before `sudo ufw enable`. If you do lock yourself out, access the server via console (VPS provider's web console or physical keyboard).

### Trusting UFW to block Docker ports
UFW does not control Docker's port mappings. A Docker container with `ports: "3000:3000"` is accessible from the internet regardless of UFW rules. Bind to `127.0.0.1` or use Docker networks.

### Opening too many ports
Every open port is an attack surface. Use a reverse proxy for web services (only ports 80 and 443 open) and bind everything else to localhost. The fewer open ports, the smaller your attack surface.

### Not allowing outgoing traffic
Some guides suggest `default deny outgoing`. This breaks package updates (`apt`), Docker image pulls, DNS resolution, and Let's Encrypt certificate renewal. Unless you have a specific reason to restrict outbound traffic, allow it.

### Forgetting IPv6
UFW handles IPv6 by default on Ubuntu, but verify with `sudo ufw status verbose`. If your server has a public IPv6 address, ensure your rules cover both protocols.

## Next Steps

- Set up [fail2ban](/foundations/fail2ban/) for brute-force protection
- Secure SSH with [key-based authentication](/foundations/ssh-setup/)
- Configure [SSL certificates](/foundations/ssl-certificates/) for encrypted connections
- Learn about [Docker networking](/foundations/docker-networking/) to understand container connectivity
- Set up [remote access](/foundations/remote-access/) with WireGuard or Tailscale

## FAQ

### Does UFW work with Docker?
Partially. UFW controls the host firewall, but Docker bypasses UFW by modifying iptables directly. Bind container ports to `127.0.0.1` to keep UFW in control. See "The Docker and UFW Problem" section above.

### Should I use UFW or iptables directly?
Use UFW. It is a frontend for iptables that makes common configurations simple and readable. Direct iptables rules are only needed for advanced scenarios like custom NAT or complex routing.

### Do I need a firewall if my server is behind a router?
Yes. Your router's NAT provides some protection, but it is not a firewall. A device on your local network (compromised IoT device, guest's laptop) can still reach your server's open ports. UFW adds defense in depth.

### Can I use UFW and fail2ban together?
Yes, and you should. UFW sets static rules (which ports are open). Fail2ban adds dynamic rules (temporarily ban IPs after failed login attempts). They complement each other perfectly.

## Related

- [SSH Setup Guide](/foundations/ssh-setup/)
- [Fail2ban Setup](/foundations/fail2ban/)
- [Docker Networking](/foundations/docker-networking/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
