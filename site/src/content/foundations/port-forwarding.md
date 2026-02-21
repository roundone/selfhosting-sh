---
title: "Port Forwarding for Self-Hosting"
description: "Set up port forwarding on your router to access self-hosted services from the internet — plus safer alternatives like Cloudflare Tunnel."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["networking", "port-forwarding", "remote-access", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Port Forwarding?

Port forwarding tells your router to send incoming internet traffic on a specific port to a specific device on your local network. Without it, your self-hosted services are only accessible from inside your home.

When someone visits `yourdomain.com:443` from the internet, the request hits your router's public IP. Port forwarding routes that request to your server at `192.168.1.50:443`.

**Important:** Port forwarding exposes your server to the internet. Only do this with proper security in place — [firewall](/foundations/firewall-ufw/), [fail2ban](/foundations/fail2ban/), HTTPS via [reverse proxy](/foundations/reverse-proxy-explained/), and strong passwords.

## Prerequisites

- A self-hosted server with a static local IP ([Static IP Guide](/foundations/dhcp-static-ip/))
- A reverse proxy configured ([Reverse Proxy Explained](/foundations/reverse-proxy-explained/))
- Access to your router's admin panel
- Understanding of [network ports](/foundations/ports-explained/)

## How Port Forwarding Works

```
Internet → Your Public IP:443 → Router → Port Forward Rule → 192.168.1.50:443
```

1. A user visits `https://cloud.yourdomain.com`
2. DNS resolves to your public IP (e.g., 203.0.113.50)
3. The browser connects to 203.0.113.50 on port 443
4. Your router has a rule: "port 443 → 192.168.1.50:443"
5. The router forwards the request to your server
6. Your reverse proxy routes it to the correct Docker container

## Setting Up Port Forwarding

### Step 1: Find Your Router's Admin Page

Usually at one of these addresses:
- `192.168.1.1`
- `192.168.0.1`
- `10.0.0.1`

Check your gateway address:

```bash
ip route | grep default
# default via 192.168.1.1 dev eth0
```

### Step 2: Find the Port Forwarding Section

The location varies by router brand:

| Brand | Typical Location |
|-------|-----------------|
| ASUS | WAN → Virtual Server / Port Forwarding |
| TP-Link | Advanced → NAT Forwarding → Port Forwarding |
| Netgear | Advanced → Advanced Setup → Port Forwarding |
| Linksys | Security → Apps and Gaming → Port Range Forwarding |
| pfSense | Firewall → NAT → Port Forward |
| OPNsense | Firewall → NAT → Port Forward |
| UniFi | Settings → Firewall & Security → Port Forwarding |

### Step 3: Create Rules

For a typical self-hosting setup with a reverse proxy, you only need two rules:

| Service | Protocol | External Port | Internal IP | Internal Port |
|---------|----------|--------------|-------------|---------------|
| HTTP | TCP | 80 | 192.168.1.50 | 80 |
| HTTPS | TCP | 443 | 192.168.1.50 | 443 |

That's it. Your reverse proxy on the server handles routing to individual services based on the domain name.

Additional ports if needed:

| Service | Protocol | External Port | Internal Port |
|---------|----------|--------------|---------------|
| SSH | TCP | 22 (or custom) | 22 |
| WireGuard VPN | UDP | 51820 | 51820 |
| Plex | TCP | 32400 | 32400 |

### Step 4: Verify

From outside your network (use your phone on cellular data, or an online tool):

```bash
# From a different network
curl -I https://yourdomain.com

# Or use an online port checker
# Search "port checker online" and test your public IP on port 443
```

Find your public IP:

```bash
curl -s ifconfig.me
```

## DNS Configuration

Port forwarding alone isn't enough — you need DNS records pointing your domain to your public IP:

```
Type: A
Name: cloud (or @ for root domain)
Value: 203.0.113.50 (your public IP)
```

If your IP changes (most residential ISPs), set up [Dynamic DNS](/foundations/dynamic-dns/).

## Safer Alternatives to Port Forwarding

Port forwarding exposes your server directly to the internet. These alternatives are more secure:

### Cloudflare Tunnel (Recommended for Web Services)

Cloudflare Tunnel creates an outbound-only connection from your server to Cloudflare's network. No ports need to be open on your router.

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Authenticate
cloudflared tunnel login

# Create a tunnel
cloudflared tunnel create homelab

# Configure the tunnel
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: your-tunnel-id
credentials-file: /root/.cloudflared/your-tunnel-id.json

ingress:
  - hostname: cloud.yourdomain.com
    service: https://localhost:443
    originRequest:
      noTLSVerify: true
  - hostname: media.yourdomain.com
    service: http://localhost:8096
  - service: http_status:404
EOF

# Run the tunnel
cloudflared tunnel run homelab
```

**Advantages:** No open ports, DDoS protection, free for personal use, hides your IP.
**Disadvantages:** Cloudflare sees your traffic (MITM by design), adds latency, doesn't work for non-HTTP protocols (SSH, WireGuard).

### Tailscale (Recommended for Personal Access)

Tailscale creates a WireGuard VPN mesh between your devices. Access your server from anywhere without port forwarding.

```bash
# Install on server
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Install on your phone/laptop
# Access your server via its Tailscale IP (100.x.x.x)
```

**Advantages:** Zero configuration, encrypted, no open ports, works for all protocols.
**Disadvantages:** Only you (and your Tailscale network members) can access the services. Not suitable for public-facing services.

### WireGuard (DIY VPN)

Run your own VPN server. Requires port 51820 forwarded, but all other services stay behind the VPN.

**Advantages:** Full control, fast, open source.
**Disadvantages:** More setup work, need to manage keys.

### Comparison

| Method | Open Ports | Public Access | Setup Difficulty | Best For |
|--------|-----------|---------------|-----------------|----------|
| Port forwarding | 80, 443 | Yes | Easy | Full control, public services |
| Cloudflare Tunnel | None | Yes | Medium | Web services, DDoS protection |
| Tailscale | None | No (private) | Easy | Personal access to all services |
| WireGuard | 51820 | No (VPN only) | Medium | Personal access, full control |

**Recommendation:** Use Cloudflare Tunnel for public web services and Tailscale for personal access. Only use direct port forwarding if you need full control or can't use either alternative.

## Security Checklist for Port Forwarding

If you do port forward, ensure these are in place:

- [ ] Reverse proxy with HTTPS (Let's Encrypt) on ports 80/443
- [ ] [Firewall](/foundations/firewall-ufw/) allowing only necessary ports
- [ ] [Fail2ban](/foundations/fail2ban/) blocking brute-force attempts
- [ ] [SSH key authentication](/foundations/ssh-setup/) (disable password auth)
- [ ] Strong passwords on all services
- [ ] Regular updates on OS and Docker containers
- [ ] No database ports (3306, 5432, 6379) exposed to the internet
- [ ] No management ports (Portainer 9443, Docker socket) exposed

## Common Mistakes

### 1. Forwarding Too Many Ports

Only forward ports 80 and 443 (and 22 for SSH if needed). Your reverse proxy handles routing to individual services. Don't forward individual app ports — it bypasses HTTPS and access control.

### 2. Not Using a Reverse Proxy

Forwarding port 8096 directly to Jellyfin means no HTTPS and the URL has an ugly port number. Always put a reverse proxy in front.

### 3. Exposing SSH on Port 22

Port 22 gets hammered by bots. If you must expose SSH:
- Use key-based authentication only
- Run [fail2ban](/foundations/fail2ban/)
- Consider changing to a non-standard port (reduces noise, not a security measure)
- Better: use Tailscale for SSH access and don't forward port 22 at all

### 4. Not Checking ISP Restrictions

Some ISPs block ports 80 and 443 on residential connections (common with CGNAT). Check by running a service on port 80 and testing from outside. If blocked:
- Use Cloudflare Tunnel (bypasses port blocks entirely)
- Use a non-standard port (e.g., 8443)
- Call your ISP and request port unblocking

### 5. Forgetting About CGNAT

If your public IP starts with 100.64.x.x or you can't find port forwarding options, you're behind CGNAT (Carrier-Grade NAT). Port forwarding is impossible. Solutions:
- Cloudflare Tunnel (best option)
- Tailscale (for private access)
- Request a public IP from your ISP (some charge $5–10/month)

## FAQ

### Do I need port forwarding if I use Cloudflare Tunnel?

No. Cloudflare Tunnel eliminates the need for port forwarding entirely. Your server makes outbound connections to Cloudflare — no inbound ports needed.

### Can I use port forwarding and Cloudflare Tunnel together?

Yes, but there's no reason to. If you're using Cloudflare Tunnel for web services, you only need port forwarding for non-HTTP protocols (like WireGuard VPN).

### Why does my port show as closed even after forwarding?

Common causes: ISP blocking the port (CGNAT), firewall on the server blocking it, service not running, or port forwarding rule configured incorrectly. Test each layer: is the service running? Is the local firewall open? Is the router rule correct? Is the ISP blocking it?

### Is it safe to forward port 22 for SSH?

It's acceptable with key-based authentication, fail2ban, and no password auth. But Tailscale is safer and easier — it gives you SSH access without opening any ports.

### How many ports can I forward?

There's no practical limit. But for self-hosting, you should only need 2–3 (80, 443, and maybe 51820 for WireGuard). More forwarded ports = more attack surface.

## Next Steps

- [Dynamic DNS](/foundations/dynamic-dns/) — handle changing public IPs
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/) — route traffic to services
- [Firewall Setup with UFW](/foundations/firewall-ufw/) — secure your server

## Related

- [Network Ports Explained](/foundations/ports-explained/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [DNS Explained](/foundations/dns-explained/)
- [Firewall Setup with UFW](/foundations/firewall-ufw/)
- [Fail2ban Setup](/foundations/fail2ban/)
- [SSH Setup Guide](/foundations/ssh-setup/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
