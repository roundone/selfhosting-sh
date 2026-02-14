---
title: "How to Self-Host WireGuard with Docker Compose"
type: "app-guide"
app: "wireguard"
category: "vpn"
replaces: "NordVPN"
difficulty: "intermediate"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up WireGuard VPN with Docker Compose for secure remote access to your home network."
officialUrl: "https://www.wireguard.com"
githubUrl: "https://github.com/WireGuard"
defaultPort: 51820
minRam: "128MB"
---

## What is WireGuard?

WireGuard is a modern VPN protocol that's faster, simpler, and more secure than OpenVPN or IPSec. It uses state-of-the-art cryptography, has a tiny codebase (~4,000 lines), and establishes connections almost instantly. Self-hosting WireGuard lets you securely access your home network and all your self-hosted services from anywhere.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- A server with a static local IP ([static IP guide](/foundations/static-ip/))
- Port 51820/UDP forwarded on your router ([port forwarding guide](/foundations/port-forwarding/))
- Your public IP or a dynamic DNS hostname

## Docker Compose Configuration

```yaml
# docker-compose.yml for WireGuard
# Using linuxserver/wireguard for easy peer management
# Tested with linuxserver/wireguard 1.0.20210914+

services:
  wireguard:
    container_name: wireguard
    image: lscr.io/linuxserver/wireguard:latest
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      # Your server's public IP or dynamic DNS hostname
      - SERVERURL=your-public-ip-or-hostname
      - SERVERPORT=51820
      # Number of client configs to generate
      - PEERS=phone,laptop,tablet
      - PEERDNS=auto
      # Your home subnet (so clients can access LAN devices)
      - ALLOWEDIPS=0.0.0.0/0
      # Internal VPN subnet
      - INTERNAL_SUBNET=10.13.13.0
    ports:
      - "51820:51820/udp"
    volumes:
      - ./config:/config
      - /lib/modules:/lib/modules
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/wireguard && cd ~/wireguard
   ```

2. **Create the `docker-compose.yml`** — replace `SERVERURL` with your public IP or Dynamic DNS hostname. Set `PEERS` to a comma-separated list of client names.

3. **Forward port 51820/UDP** on your router to your server's local IP.

4. **Start the container:**
   ```bash
   docker compose up -d
   ```

5. **Get the client configs:**
   ```bash
   # View QR code for mobile devices
   docker exec wireguard /app/show-peer phone

   # Or find config files in
   ls config/peer_phone/ config/peer_laptop/ config/peer_tablet/
   ```

6. **Install WireGuard on your devices:**
   - **Phone:** Install the WireGuard app (iOS/Android), scan the QR code.
   - **Laptop:** Install the WireGuard client, import the `.conf` file from `config/peer_laptop/peer_laptop.conf`.

7. **Test the connection** — connect from your phone on mobile data. You should be able to access your home network services by their local IP addresses.

## Configuration Tips

- **Split tunnel vs full tunnel:** `ALLOWEDIPS=0.0.0.0/0` routes ALL traffic through the VPN (full tunnel). To only route home network traffic, set it to your home subnet: `ALLOWEDIPS=192.168.1.0/24,10.13.13.0/24`.
- **Add more peers:** Change the `PEERS` list and restart. New config files will be generated.
- **Dynamic DNS:** If your ISP changes your public IP, use a dynamic DNS service (DuckDNS, Cloudflare DDNS) and set `SERVERURL` to your DDNS hostname.
- **DNS:** `PEERDNS=auto` uses the container's DNS. Set it to your Pi-hole's IP to get ad blocking over VPN: `PEERDNS=192.168.1.100`.
- **Performance:** WireGuard is extremely fast. On modern hardware, expect near-line-speed throughput with minimal CPU usage.

## Backup & Migration

- **Backup:** The `config` folder contains server keys and all peer configurations. Back it up — regenerating means reconfiguring all clients.
- **Migration:** Copy the `config` folder to a new server. Update `SERVERURL` if the IP changed. Clients need no reconfiguration if the server keys stay the same.

## Troubleshooting

- **Can't connect:** Verify port 51820/UDP is forwarded correctly. Test with an online port checker.
- **Connected but can't access LAN:** Check that IP forwarding is enabled on the host (`sysctl net.ipv4.ip_forward=1`) and that `ALLOWEDIPS` includes your home subnet.
- **Connection drops frequently:** Usually a firewall issue. Some routers have ALG settings that interfere with UDP traffic.

## Alternatives

[Tailscale](/apps/tailscale/) is easier to set up (no port forwarding needed) but routes through a coordination server. [Cloudflare Tunnel](/apps/cloudflare-tunnel/) is good for exposing specific services without a VPN. See our [WireGuard vs Tailscale comparison](/compare/wireguard-vs-tailscale/) or the full [Best Self-Hosted VPN Solutions](/best/vpn/) roundup.

## Verdict

WireGuard is the best self-hosted VPN for remote access. It's fast, lightweight, and rock-solid. The linuxserver.io container makes setup and peer management easy. If you want secure access to your home network from anywhere, WireGuard is the answer.
