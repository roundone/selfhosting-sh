---
title: "WireGuard VPN Setup for Self-Hosting"
description: "Set up WireGuard VPN on your server for encrypted remote access to your self-hosted services — fast, modern, and simple to configure."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["wireguard", "vpn", "remote-access", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is WireGuard?

WireGuard is a modern VPN protocol built into the Linux kernel. It's faster, simpler, and more secure than OpenVPN or IPSec. A WireGuard tunnel encrypts all traffic between your devices and your home server, giving you secure access to self-hosted services from anywhere.

Unlike Tailscale (which uses WireGuard under the hood with automated management), raw WireGuard requires manual key exchange and configuration. You get full control at the cost of more setup work.

## Prerequisites

- A Linux server with a public IP or port forwarding ([Port Forwarding Guide](/foundations/port-forwarding))
- SSH access to your server ([SSH Setup Guide](/foundations/ssh-setup))
- Port 51820/UDP forwarded from your router to your server
- A client device (phone, laptop) to connect from

## WireGuard vs Tailscale

| Feature | WireGuard (raw) | Tailscale |
|---------|----------------|-----------|
| Key management | Manual | Automatic |
| NAT traversal | Requires port forwarding | Built-in |
| Works behind CGNAT | No | Yes |
| Config complexity | Medium | Low |
| Control | Full | Tailscale manages coordination |
| Cost | Free | Free (personal, up to 100 devices) |
| Dependencies | None (kernel module) | Tailscale service + account |

**Use raw WireGuard if:** You want full control, have a public IP, or don't want to depend on Tailscale's infrastructure.
**Use Tailscale if:** You want zero-config setup, are behind CGNAT, or need mesh networking. See [Tailscale Setup](/foundations/tailscale-setup).

## Method 1: Docker with wg-easy (Recommended)

wg-easy provides WireGuard with a web management UI. Easiest setup.

```yaml
# docker-compose.yml
services:
  wg-easy:
    image: ghcr.io/wg-easy/wg-easy:14
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
    environment:
      - WG_HOST=vpn.yourdomain.com    # Your public domain or IP
      - PASSWORD_HASH=$$2a$$12$$hashgoeshere  # bcrypt hash of admin password
      - WG_DEFAULT_DNS=1.1.1.1,8.8.8.8
      - WG_ALLOWED_IPS=0.0.0.0/0      # Route all traffic through VPN
    volumes:
      - wg-easy-data:/etc/wireguard
    ports:
      - "51820:51820/udp"
      - "127.0.0.1:51821:51821/tcp"   # Web UI — localhost only
    restart: unless-stopped

volumes:
  wg-easy-data:
```

Generate the password hash:

```bash
docker run -it ghcr.io/wg-easy/wg-easy:14 wgpw 'YourStrongPassword'
# Copy the output hash (escape $ as $$ in docker-compose.yml)
```

```bash
docker compose up -d
```

Access the web UI at `http://your-server:51821` (via SSH tunnel or Tailscale). Add clients through the UI — it generates QR codes you can scan with the WireGuard mobile app.

## Method 2: Native WireGuard (Manual)

### Install WireGuard

```bash
# Ubuntu/Debian
sudo apt install wireguard

# Verify kernel module
sudo modprobe wireguard
lsmod | grep wireguard
```

### Generate Keys

```bash
# Server keys
wg genkey | tee server_private.key | wg pubkey > server_public.key
chmod 600 server_private.key

# Client keys (repeat per client)
wg genkey | tee client1_private.key | wg pubkey > client1_public.key
chmod 600 client1_private.key
```

### Server Configuration

```ini
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.200.200.1/24
ListenPort = 51820
PrivateKey = SERVER_PRIVATE_KEY
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

# Client 1 — phone
[Peer]
PublicKey = CLIENT1_PUBLIC_KEY
AllowedIPs = 10.200.200.2/32

# Client 2 — laptop
[Peer]
PublicKey = CLIENT2_PUBLIC_KEY
AllowedIPs = 10.200.200.3/32
```

Replace `eth0` with your server's actual network interface name (check with `ip addr`).

### Enable IP Forwarding

```bash
echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Start WireGuard

```bash
# Start
sudo wg-quick up wg0

# Enable on boot
sudo systemctl enable wg-quick@wg0

# Check status
sudo wg show
```

### Client Configuration

```ini
# Client config (client1.conf)
[Interface]
Address = 10.200.200.2/24
PrivateKey = CLIENT1_PRIVATE_KEY
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = vpn.yourdomain.com:51820
AllowedIPs = 0.0.0.0/0    # Route all traffic (full tunnel)
# AllowedIPs = 10.200.200.0/24, 192.168.1.0/24  # Split tunnel (only LAN traffic)
PersistentKeepalive = 25
```

### Install Client

- **macOS/Windows/Linux:** Download from wireguard.com
- **iOS/Android:** Install WireGuard from App Store / Google Play
- Import the config file or scan a QR code

Generate a QR code for mobile:

```bash
sudo apt install qrencode
qrencode -t ansiutf8 < client1.conf
```

## Full Tunnel vs Split Tunnel

### Full Tunnel (Route All Traffic)

```ini
# Client config
AllowedIPs = 0.0.0.0/0
```

All internet traffic goes through your home server. Use this to:
- Use your home's Pi-hole DNS from anywhere
- Encrypt all traffic on untrusted WiFi
- Appear to be at home (geo-restrictions)

### Split Tunnel (Route Only LAN Traffic)

```ini
# Client config
AllowedIPs = 10.200.200.0/24, 192.168.1.0/24
```

Only traffic to your home network goes through the VPN. Internet traffic uses the local connection. Better battery life on mobile, lower latency for general browsing.

**Recommendation:** Split tunnel for daily use, full tunnel on untrusted networks.

## Firewall Configuration

```bash
# Allow WireGuard port
sudo ufw allow 51820/udp

# Allow forwarding from VPN to LAN
sudo ufw route allow in on wg0 out on eth0
```

See [Firewall Setup with UFW](/foundations/firewall-ufw) for more details.

## Common Mistakes

### 1. Forgetting IP Forwarding

Without `net.ipv4.ip_forward = 1`, the server receives VPN traffic but doesn't route it to the LAN or internet. Clients connect but can't reach anything.

### 2. Wrong AllowedIPs on Server

The server's `AllowedIPs` for each peer must be the client's VPN IP only (e.g., `10.200.200.2/32`). Setting it to `0.0.0.0/0` would route all server traffic to that client.

### 3. Firewall Blocking UDP 51820

WireGuard uses UDP, not TCP. `sudo ufw allow 51820/udp` — don't forget the `/udp`.

### 4. Not Using PersistentKeepalive Behind NAT

If the client is behind NAT (common on mobile), add `PersistentKeepalive = 25` to keep the connection alive. Without it, the NAT table entry expires and the tunnel drops.

### 5. Using the Same Key Pair for Multiple Clients

Each client needs its own key pair. Reusing keys between clients causes routing conflicts.

## FAQ

### Is WireGuard secure?

Yes. WireGuard uses state-of-the-art cryptography (ChaCha20, Poly1305, Curve25519). Its small codebase (~4,000 lines) has been formally verified. It's included in the Linux kernel since version 5.6.

### Can I run WireGuard and Tailscale simultaneously?

Not recommended. Both create WireGuard interfaces and can conflict. Use one or the other.

### How do I add a new client?

Generate a new key pair, add a `[Peer]` section to the server config, create a client config file, and restart WireGuard: `sudo wg-quick down wg0 && sudo wg-quick up wg0`.

### What's the performance overhead?

Negligible. WireGuard adds ~1ms latency and achieves near-line-rate throughput. It's significantly faster than OpenVPN.

### Can I access my LAN devices through WireGuard?

Yes. Include your LAN subnet in the client's `AllowedIPs` (e.g., `192.168.1.0/24`) and ensure the server has IP forwarding enabled and proper routing/NAT rules.

## Next Steps

- [Tailscale Setup](/foundations/tailscale-setup) — managed WireGuard alternative
- [Port Forwarding Guide](/foundations/port-forwarding) — expose WireGuard to the internet
- [Firewall Setup with UFW](/foundations/firewall-ufw) — secure your VPN server

## Related

- [Tailscale Setup](/foundations/tailscale-setup)
- [Port Forwarding for Self-Hosting](/foundations/port-forwarding)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [DNS Explained](/foundations/dns-explained)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Getting Started with Self-Hosting](/foundations/getting-started)
