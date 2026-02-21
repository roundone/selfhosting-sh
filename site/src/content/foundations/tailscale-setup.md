---
title: "Tailscale Setup for Self-Hosting"
description: "Set up Tailscale to securely access your self-hosted services from anywhere — zero port forwarding, automatic encryption, and easy device mesh."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["tailscale", "vpn", "remote-access", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Tailscale?

Tailscale creates a WireGuard-based mesh VPN between your devices. Every device gets a stable IP address (100.x.x.x) and can reach every other device on your Tailscale network — regardless of firewalls, NAT, or network location.

For self-hosting, Tailscale lets you access your server from anywhere without opening ports or configuring port forwarding. Your services stay invisible to the internet while remaining accessible to you on any device.

## Prerequisites

- A self-hosted server running Linux ([Getting Started](/foundations/getting-started/))
- A Tailscale account (free for personal use, up to 100 devices)

## Why Tailscale for Self-Hosting?

| Feature | Port Forwarding | Cloudflare Tunnel | Tailscale |
|---------|----------------|-------------------|-----------|
| Open ports required | Yes (80, 443) | No | No |
| Public access | Yes | Yes | No (private) |
| Setup complexity | Medium | Medium | Easy |
| Works with CGNAT | No | Yes | Yes |
| Works for non-HTTP | Limited | No | Yes (all protocols) |
| Mobile access | Yes | Yes | Yes |
| Speed | Direct | Via Cloudflare | Direct (usually) |

**Use Tailscale when:** You want private access to your services from your own devices. No public access needed.

**Use Cloudflare Tunnel when:** You need public access (sharing with others, hosting a website). See [Port Forwarding](/foundations/port-forwarding/) for alternatives comparison.

## Installation

### On Your Server

```bash
# Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# Start and authenticate
sudo tailscale up

# A URL will be printed — open it in your browser to authenticate
# After auth, the server gets a Tailscale IP (100.x.x.x)

# Check your Tailscale IP
tailscale ip -4
# 100.x.x.x
```

### On Your Other Devices

Install the Tailscale app on every device you want to access your server from:
- **macOS/Windows/Linux:** Download from tailscale.com
- **iOS/Android:** Install from App Store / Google Play
- **Browser:** Tailscale works via native apps, not browser extensions

After installing and signing in with the same account, all devices can reach each other.

### Verify Connectivity

```bash
# From your laptop (with Tailscale running)
ping 100.x.x.x  # Your server's Tailscale IP

# SSH to your server via Tailscale
ssh user@100.x.x.x

# Access a web service
# http://100.x.x.x:8096  (Jellyfin)
# http://100.x.x.x:3000  (Gitea)
```

## MagicDNS

MagicDNS gives your devices human-readable names instead of 100.x.x.x addresses.

Enable in the Tailscale admin console (admin.tailscale.com → DNS → Enable MagicDNS).

```bash
# After enabling MagicDNS
ssh user@my-server         # Instead of ssh user@100.x.x.x
http://my-server:8096      # Access Jellyfin by hostname
```

Device names come from the machine's hostname. Set a good hostname on your server:

```bash
sudo hostnamectl set-hostname homelab
# Now accessible as: homelab (via MagicDNS)
```

## Subnet Router: Access Your Entire LAN

By default, Tailscale only lets you reach devices with Tailscale installed. A subnet router advertises your entire local network, letting you access devices without Tailscale (printers, IoT, NAS).

```bash
# On your server — advertise your local subnet
sudo tailscale up --advertise-routes=192.168.1.0/24

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
echo 'net.ipv6.conf.all.forwarding = 1' | sudo tee -a /etc/sysctl.d/99-tailscale.conf
sudo sysctl -p /etc/sysctl.d/99-tailscale.conf
```

Then approve the route in the Tailscale admin console (admin.tailscale.com → Machines → your server → approve routes).

Now from any Tailscale device, you can reach `192.168.1.x` addresses on your home network — even from your phone on cellular.

## Exit Node: Route All Traffic Through Home

Use your server as an exit node to route all internet traffic through your home connection (like a traditional VPN):

```bash
# On your server
sudo tailscale up --advertise-exit-node --advertise-routes=192.168.1.0/24
```

Approve in admin console, then on your client device, select your server as the exit node.

**Use cases:**
- Access geo-restricted content while traveling
- Use your home's DNS (Pi-hole) from anywhere
- Encrypt traffic on untrusted WiFi

## Tailscale + Docker Services

Your Docker services are already accessible via the server's Tailscale IP. If Jellyfin runs on port 8096:

```
http://100.x.x.x:8096     ← from any Tailscale device
http://homelab:8096        ← with MagicDNS
```

For services bound to `127.0.0.1` (localhost only), they won't be accessible via Tailscale. Either bind to `0.0.0.0` or use Tailscale's serve/funnel features.

### Tailscale Serve (HTTPS for Tailscale Devices)

Tailscale Serve proxies a local service and gives it a valid HTTPS certificate:

```bash
# Serve Jellyfin on https://homelab.tailnet-name.ts.net
sudo tailscale serve https / http://localhost:8096
```

Now access `https://homelab.tailnet-name.ts.net` from any Tailscale device — with a valid HTTPS certificate, no reverse proxy needed.

### Running Tailscale in Docker

Alternative to installing on the host:

```yaml
services:
  tailscale:
    image: tailscale/tailscale:v1.76.6
    hostname: homelab
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - TS_AUTHKEY=tskey-auth-xxxxx  # Pre-auth key from admin console
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_EXTRA_ARGS=--advertise-routes=192.168.1.0/24
    volumes:
      - tailscale-state:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
    restart: unless-stopped

volumes:
  tailscale-state:
```

Generate a pre-auth key at admin.tailscale.com → Settings → Keys → Generate auth key.

## ACLs: Access Control

Tailscale's ACL policy controls which devices can reach which services. Edit at admin.tailscale.com → Access Controls.

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:personal"],
      "dst": ["tag:server:*"]
    }
  ],
  "tagOwners": {
    "tag:server": ["autogroup:admin"],
    "tag:personal": ["autogroup:admin"]
  }
}
```

This restricts access so only devices tagged `personal` can reach devices tagged `server`.

## Common Mistakes

### 1. Forgetting to Enable IP Forwarding for Subnet Routes

Without `net.ipv4.ip_forward = 1`, subnet routing doesn't work. The server receives packets but doesn't forward them.

### 2. Not Approving Routes in Admin Console

Advertising routes from the CLI is step 1. You must also approve them in the admin console — this is a security measure.

### 3. Using Tailscale When You Need Public Access

Tailscale is for private access. If you want others to reach your services (a blog, a shared Nextcloud), use Cloudflare Tunnel or port forwarding instead.

### 4. Running Both Tailscale and a Local VPN on the Same Device

Tailscale and other VPN clients (WireGuard, OpenVPN) can conflict on routing. If you need both, configure split tunneling carefully.

### 5. Not Setting a Descriptive Hostname

Default hostnames like `ubuntu-server` make MagicDNS useless. Set a meaningful hostname: `sudo hostnamectl set-hostname homelab`.

## FAQ

### Is Tailscale free?

The Personal plan is free for up to 100 devices and 3 users. This is more than enough for a homelab.

### Is Tailscale secure?

Tailscale uses WireGuard encryption (state of the art). The Tailscale coordination server handles key exchange but never sees your traffic. For maximum security, use Headscale (self-hosted control server) instead of Tailscale's cloud.

### What's the difference between Tailscale and WireGuard?

Tailscale is built on WireGuard but adds automatic key management, NAT traversal, and a management layer. WireGuard alone requires manual key exchange and static endpoints. Tailscale is significantly easier to set up.

### Can I access my server from my phone?

Yes. Install the Tailscale app, sign in with the same account, and your server is reachable from anywhere — coffee shop, airport, cellular data.

### What about latency?

Tailscale establishes direct connections between devices when possible (no relay). On the same local network, latency is negligible. Across the internet, it's the same as a direct connection — WireGuard adds ~1ms overhead.

## Next Steps

- [Port Forwarding Guide](/foundations/port-forwarding/) — comparison of remote access methods
- [WireGuard Setup](/foundations/wireguard-setup/) — DIY VPN alternative
- [Docker Compose Basics](/foundations/docker-compose-basics/) — deploy services to access

## Related

- [Port Forwarding for Self-Hosting](/foundations/port-forwarding/)
- [Dynamic DNS Setup](/foundations/dynamic-dns/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [SSH Setup Guide](/foundations/ssh-setup/)
- [Docker Networking](/foundations/docker-networking/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
