---
title: "How to Self-Host AdGuard Home with Docker Compose"
type: "app-guide"
app: "adguard-home"
category: "ad-blocking"
replaces: "Paid ad blockers"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "Set up AdGuard Home for network-wide ad blocking with built-in encrypted DNS support."
officialUrl: "https://adguard.com/adguard-home/overview.html"
githubUrl: "https://github.com/AdguardTeam/AdGuardHome"
defaultPort: 3000
minRam: "128MB"
---

## What is AdGuard Home?

AdGuard Home is a network-wide ad and tracker blocker that works as a DNS sinkhole — like Pi-hole, but with a more modern feature set. It includes built-in support for encrypted DNS (DNS-over-HTTPS, DNS-over-TLS, DNS-over-QUIC), per-client filtering, parental controls, and safe search enforcement. One instance protects every device on your network.

## Prerequisites

- Docker and Docker Compose installed ([Docker Compose basics](/foundations/docker-compose-basics/))
- Any server — runs on minimal hardware, even a Raspberry Pi ([Raspberry Pi guide](/hardware/raspberry-pi-guide/))
- Access to your router's DHCP/DNS settings

## Docker Compose Configuration

```yaml
# docker-compose.yml for AdGuard Home
# Tested with AdGuard Home 0.107+

services:
  adguardhome:
    container_name: adguardhome
    image: adguard/adguardhome:latest
    ports:
      # DNS
      - "53:53/tcp"
      - "53:53/udp"
      # Admin panel (initial setup)
      - "3000:3000/tcp"
      # Admin panel (after setup)
      - "8080:80/tcp"
      # DNS-over-TLS
      # - "853:853/tcp"
      # DNS-over-QUIC
      # - "853:853/udp"
      # DNS-over-HTTPS
      # - "443:443/tcp"
    volumes:
      - ./work:/opt/adguardhome/work
      - ./conf:/opt/adguardhome/conf
    restart: unless-stopped
```

## Step-by-Step Setup

1. **Create a directory:**
   ```bash
   mkdir ~/adguard && cd ~/adguard
   ```

2. **Handle port 53 conflicts** (Ubuntu with systemd-resolved):
   ```bash
   sudo systemctl disable systemd-resolved
   sudo systemctl stop systemd-resolved
   echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
   ```

3. **Create the `docker-compose.yml`** with the config above.

4. **Start the container:**
   ```bash
   docker compose up -d
   ```

5. **Run the setup wizard** at `http://your-server-ip:3000` — choose admin port, DNS listen address, create admin account.

6. **After setup**, access the admin panel at `http://your-server-ip:8080`

7. **Point your network to AdGuard Home** — set your router's DHCP DNS to the server's IP.

## Configuration Tips

- **Upstream DNS:** Settings → DNS settings → Upstream DNS servers. Use encrypted upstreams like `https://dns.cloudflare.com/dns-query` or `tls://1.1.1.1`.
- **Blocklists:** Filters → DNS blocklists → Add blocklist. AdGuard provides its own lists plus compatibility with most Pi-hole lists.
- **Per-client settings:** Settings → Client settings lets you apply different filtering rules per device (useful for kids' devices vs adults).
- **Safe search:** Force safe search on Google, YouTube, and other search engines from Filters → General settings.
- **DHCP:** AdGuard Home can act as your DHCP server (Settings → DHCP settings), giving you device-level control without changing your router.

## Backup & Migration

- **Backup:** The `conf` folder contains `AdGuardHome.yaml` with all your settings. Back it up.
- **Migration from Pi-hole:** Export your Pi-hole lists and import them as custom filter lists in AdGuard Home.

## Troubleshooting

- **DNS not resolving:** Check upstream DNS servers are accessible. Test with `nslookup google.com your-server-ip`.
- **Some sites broken:** Check the Query Log to find blocked queries, then whitelist the domain.
- **Encrypted DNS not working:** Ensure you have a valid SSL certificate configured for DoH/DoT.

## Alternatives

[Pi-hole](/apps/pihole/) is the main alternative with a larger community and more third-party integrations. See our [Pi-hole vs AdGuard Home comparison](/compare/pihole-vs-adguard-home/) or the full [Best Self-Hosted Ad Blockers](/best/ad-blocking/) roundup.

## Verdict

AdGuard Home is the most feature-complete self-hosted DNS ad blocker available. The built-in encrypted DNS support, per-client settings, and parental controls put it ahead of Pi-hole for new installations. If you're choosing your first DNS ad blocker in 2026, go with AdGuard Home.
