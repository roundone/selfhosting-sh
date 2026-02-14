---
title: "How to Self-Host Pi-hole with Docker Compose"
type: "app-guide"
app: "pihole"
category: "ad-blocking"
replaces: "Paid ad blockers"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up Pi-hole for network-wide ad blocking with Docker Compose. Block ads on every device."
officialUrl: "https://pi-hole.net"
githubUrl: "https://github.com/pi-hole/pi-hole"
defaultPort: 8053
minRam: "256MB"
---

## What is Pi-hole?

Pi-hole is a network-wide ad blocker that works as a DNS sinkhole. Instead of installing ad blockers on every device, Pi-hole blocks ads at the DNS level — meaning every device on your network (phones, tablets, smart TVs, IoT devices) gets ad blocking automatically. It also blocks trackers and telemetry, giving you a privacy boost across your entire home.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server, mini PC, or even a Raspberry Pi ([Raspberry Pi for self-hosting](/hardware/raspberry-pi-guide/))
- Access to your router's DHCP/DNS settings

## Docker Compose Configuration

```yaml
# docker-compose.yml for Pi-hole
# Tested with Pi-hole 2024.07+

services:
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    ports:
      # DNS ports
      - "53:53/tcp"
      - "53:53/udp"
      # Web admin interface
      - "8053:80/tcp"
    volumes:
      - ./etc-pihole:/etc/pihole
      - ./etc-dnsmasq.d:/etc/dnsmasq.d
    environment:
      - TZ=${TZ}
      - WEBPASSWORD=${WEBPASSWORD}
      # Upstream DNS (Cloudflare + Google)
      - PIHOLE_DNS_=1.1.1.1;8.8.8.8
      # Optional: set your server's IP if auto-detection fails
      # - FTLCONF_LOCAL_IPV4=192.168.1.100
    cap_add:
      - NET_ADMIN
    restart: unless-stopped
```

Create a `.env` file:

```bash
# .env file for Pi-hole
TZ=America/New_York
WEBPASSWORD=your-admin-password
```

## Step-by-Step Setup

1. **Create a directory for Pi-hole:**
   ```bash
   mkdir ~/pihole && cd ~/pihole
   ```

2. **Check for port 53 conflicts** — if another DNS service (like `systemd-resolved`) is using port 53:
   ```bash
   sudo lsof -i :53
   # If systemd-resolved is listening, disable it:
   sudo systemctl disable systemd-resolved
   sudo systemctl stop systemd-resolved
   # Set a manual DNS in /etc/resolv.conf:
   echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
   ```

3. **Create the `docker-compose.yml` and `.env` files** with the configs above.

4. **Start the container:**
   ```bash
   docker compose up -d
   ```

5. **Access the admin panel** at `http://your-server-ip:8053/admin`

6. **Point your network to Pi-hole** — in your router's DHCP settings, set the DNS server to your Pi-hole server's IP address. All devices on your network will now use Pi-hole for DNS.

7. **Alternative: per-device setup** — if you can't change router settings, manually set each device's DNS to the Pi-hole IP.

## Configuration Tips

- **Add more blocklists:** Go to Adlists in the admin panel and add community blocklists. Popular choices: Steven Black's unified hosts, OISD, and HaGeZi's lists.
- **Whitelist false positives:** Some legitimate services break with aggressive blocking. Use the Whitelist page to unblock them.
- **Local DNS:** Use Pi-hole as a local DNS server to access your services by name (e.g., `jellyfin.local`). Go to Local DNS → DNS Records.
- **Upstream DNS:** The config uses Cloudflare and Google. For more privacy, consider Quad9 (`9.9.9.9`) or run your own recursive resolver with Unbound.
- **Conditional forwarding:** Enable this in Settings → DNS if you want Pi-hole to show device names from your router's DHCP.

## Backup & Migration

- **Backup:** Pi-hole's Teleporter feature (Settings → Teleporter) exports all settings, blocklists, whitelists, and custom DNS records as a single file.
- **Restore:** Upload the Teleporter backup file to a new Pi-hole instance.

## Troubleshooting

- **Not blocking ads:** Verify your devices are actually using Pi-hole as DNS (check in the admin panel's Query Log). See our [Pi-hole not blocking ads guide](/troubleshooting/pihole/not-blocking-ads/).
- **DNS not resolving:** Check that the upstream DNS servers are reachable and that port 53 isn't being blocked by a firewall.
- **Slow DNS:** Pi-hole adds negligible latency (~2-5ms). If DNS feels slow, check your upstream DNS servers or consider adding a local Unbound resolver.

## Alternatives

[AdGuard Home](/apps/adguard-home/) is the main alternative — it has a more modern UI, built-in DHCP, and encrypted DNS support out of the box. See our [Pi-hole vs AdGuard Home comparison](/compare/pihole-vs-adguard-home/) or the [Best Self-Hosted Ad Blockers](/best/ad-blocking/) roundup.

## Verdict

Pi-hole is the easiest self-hosting win with the most immediate impact. Ads disappear from every device on your network — including devices that can't run ad blockers, like smart TVs and IoT gadgets. Setup takes 10 minutes. If you're new to self-hosting, start here.
