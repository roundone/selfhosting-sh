---
title: "How to Self-Host AdGuard Home with Docker"
description: "Set up AdGuard Home as a network-wide ad blocker and DNS server with Docker Compose. Modern Pi-hole alternative."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "ad-blocking"
apps:
  - adguard-home
tags: ["self-hosted", "ad-blocking", "adguard-home", "docker", "dns"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is AdGuard Home?

[AdGuard Home](https://adguard.com/en/adguard-home/overview.html) is a network-wide ad blocker and DNS server. Point your router or devices at it and every DNS query passes through AdGuard Home first -- ads, trackers, malware domains, and telemetry get blocked before the connection is ever made. No per-device software required. Phones, smart TVs, IoT devices, laptops -- everything on the network benefits immediately.

What sets AdGuard Home apart from [Pi-hole](/apps/pi-hole/) is built-in support for encrypted DNS protocols (DNS-over-HTTPS, DNS-over-TLS, DNS-over-QUIC), a cleaner web interface, and a more modern codebase written in Go. It replaces browser-based ad blockers, cloud DNS filtering services, and commercial "secure DNS" subscriptions.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM (80 MB typical idle usage)
- 500 MB of free disk space
- A static IP address or DHCP reservation for your server -- your network depends on this IP for DNS resolution
- Port 53 available (see Troubleshooting if `systemd-resolved` is using it)

## Docker Compose Configuration

Create a directory for AdGuard Home:

```bash
mkdir -p ~/adguardhome && cd ~/adguardhome
```

Create a `docker-compose.yml` file:

```yaml
services:
  adguardhome:
    container_name: adguardhome
    image: adguard/adguardhome:v0.107.71
    ports:
      # DNS
      - "53:53/tcp"      # Plain DNS over TCP
      - "53:53/udp"      # Plain DNS over UDP
      # Admin panel
      - "3000:3000/tcp"  # Initial setup wizard (only needed on first run)
      - "80:80/tcp"      # Web UI (HTTP) after setup is complete
      - "443:443/tcp"    # Web UI (HTTPS) and DNS-over-HTTPS
      - "443:443/udp"    # HTTP/3 (QUIC) for web UI
      # Encrypted DNS
      - "853:853/tcp"    # DNS-over-TLS
      - "853:853/udp"    # DNS-over-QUIC
      # Optional
      # - "67:67/udp"    # DHCP server (uncomment if using AdGuard Home as DHCP)
      # - "68:68/udp"    # DHCP client (uncomment if using AdGuard Home as DHCP)
      # - "5443:5443/tcp"  # DNSCrypt (uncomment if needed)
      # - "5443:5443/udp"  # DNSCrypt (uncomment if needed)
    volumes:
      - ./conf:/opt/adguardhome/conf   # Configuration files (AdGuardHome.yaml, TLS certs)
      - ./work:/opt/adguardhome/work   # Runtime data (query logs, statistics, filters)
    restart: unless-stopped
```

There are no required environment variables. AdGuard Home manages all configuration through its web interface and the `AdGuardHome.yaml` config file stored in the `conf` volume.

Start the stack:

```bash
docker compose up -d
```

### Resolving the Port 53 Conflict

On most Ubuntu and Debian systems, `systemd-resolved` occupies port 53. AdGuard Home cannot bind to port 53 until you disable the stub listener.

Create a drop-in config:

```bash
sudo mkdir -p /etc/systemd/resolved.conf.d
```

```bash
sudo tee /etc/systemd/resolved.conf.d/adguardhome.conf > /dev/null <<EOF
[Resolve]
DNS=127.0.0.1
DNSStubListener=no
EOF
```

Update the resolv.conf symlink and restart the service:

```bash
sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
sudo systemctl restart systemd-resolved
```

Now restart AdGuard Home:

```bash
docker compose restart
```

## Initial Setup

Open your browser and navigate to `http://<server-ip>:3000`. The setup wizard walks you through four steps:

1. **Welcome screen** -- click "Get Started."
2. **Admin web interface** -- choose the listen address and port. The defaults (all interfaces, port 80 for HTTP) work for most setups. If port 80 is taken by another service, pick a different port.
3. **DNS server** -- configure the DNS listen address. Leave as all interfaces, port 53.
4. **Authentication** -- set an admin username and password. Pick something strong -- this controls your entire network's DNS.

Click "Next" and then "Open Dashboard." The setup wizard on port 3000 is no longer needed after this step. The web UI is now accessible at `http://<server-ip>` (port 80).

## Configuration

### Upstream DNS Servers

Go to **Settings > DNS settings**. Under **Upstream DNS servers**, enter the resolvers AdGuard Home queries for non-blocked domains. Good options:

```
# Cloudflare (fast, privacy-focused)
1.1.1.1
1.0.0.1

# Quad9 (malware-blocking)
9.9.9.9
149.112.112.112

# Google (reliable, fast)
8.8.8.8
8.8.4.4
```

For encrypted upstream queries, use DNS-over-HTTPS or DNS-over-TLS format:

```
# Cloudflare DoH
https://dns.cloudflare.com/dns-query

# Quad9 DoT
tls://dns.quad9.net
```

Set **Bootstrap DNS servers** to plain IP addresses (these resolve the hostnames of your upstream DoH/DoT servers):

```
1.1.1.1
9.9.9.9
```

Enable **Parallel requests** to query all upstream servers simultaneously and use the fastest response.

### Filters and Blocklists

Go to **Filters > DNS blocklists**. AdGuard Home ships with a default filter (AdGuard DNS filter). Add more for broader coverage:

- **Hagezi Multi Pro** -- `https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt` -- aggressive, comprehensive blocking with low false positives
- **Steven Black's Unified Hosts** -- `https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts` -- well-maintained, conservative
- **OISD Big** -- `https://big.oisd.nl/` -- large blocklist with careful false-positive management
- **AdGuard Tracking Protection** -- available in the built-in filter list under "Add blocklist > Choose from the list"

Start with the default AdGuard filter and one additional list (Hagezi Multi Pro is the best all-around choice). Adding too many overlapping lists wastes memory without meaningfully improving blocking.

### DNS Rewrites

Go to **Filters > DNS rewrites**. This is one of AdGuard Home's most useful features for self-hosters. Create local DNS records so you can access your services by hostname instead of IP:

| Domain | Answer |
|--------|--------|
| `nextcloud.home.lan` | `192.168.1.100` |
| `jellyfin.home.lan` | `192.168.1.100` |
| `grafana.home.lan` | `192.168.1.100` |

This works like a local DNS zone. Combined with a [reverse proxy](/foundations/reverse-proxy-explained/), you get clean URLs for every self-hosted service without running a separate DNS server.

### DHCP Server

AdGuard Home includes a built-in DHCP server (**Settings > DHCP settings**). Enabling it means AdGuard Home handles both DNS and IP assignment for your network.

**Trade-offs:** Using AdGuard Home as your DHCP server lets it see device hostnames in the query log (instead of just IP addresses), which makes monitoring much easier. However, if AdGuard Home goes down, your network loses both DNS and DHCP. Most users should keep DHCP on their router and only use AdGuard Home for DNS.

If you do enable DHCP, uncomment the DHCP ports (67, 68) in the Docker Compose file and disable DHCP on your router first.

### Rate Limiting

Under **Settings > DNS settings > Rate limit**, the default is 20 requests per second per client. This is fine for home networks. If you run a large network or see rate limiting errors in logs, increase it to 50-100.

## Advanced Configuration

### DNS-over-HTTPS and DNS-over-TLS

AdGuard Home can serve encrypted DNS to your clients, not just query encrypted upstream servers. This protects DNS queries between your devices and AdGuard Home -- useful when devices connect from outside your LAN via [VPN](/foundations/remote-access/).

Go to **Settings > Encryption settings**:

1. Enable encryption.
2. Set the server name (e.g., `dns.yourdomain.com`).
3. Provide TLS certificates -- either paste your certificate and key, or point to files on disk (mount them into the container via the `conf` volume).
4. The HTTPS port defaults to 443, DNS-over-TLS to 853, and DNS-over-QUIC to 853/UDP.

If you use Let's Encrypt with a reverse proxy, you can share the certificates by mounting them read-only into the AdGuard Home container.

### Safe Search Enforcement

Go to **Filters > Safe search**. Toggle enforcement for Google, Bing, YouTube, and other search engines. This forces SafeSearch on at the DNS level -- users cannot disable it in their browser. Useful for networks with children.

### Parental Controls

Under **Filters > Blocked services**, you can block access to specific services (TikTok, Instagram, Facebook, gaming platforms) network-wide. This is a blunt instrument -- it blocks the entire service, not specific content. For more granular control, use AdGuard Home's client-specific settings to apply different rules per device.

### Custom Filtering Rules

Go to **Filters > Custom filtering rules**. AdGuard Home supports standard ad-blocker syntax:

```
# Block a specific domain
||ads.example.com^

# Allow a domain (override blocklist)
@@||allowed.example.com^

# Block a domain only for a specific client
||social-media.com^$ctag=kid-device

# Rewrite a domain to a specific IP
|example.local^$dnsrewrite=192.168.1.50
```

This is more powerful than the GUI-based DNS rewrites and supports pattern matching, client tags, and conditional rules.

## Reverse Proxy

If you want to access the AdGuard Home dashboard through a reverse proxy with HTTPS, point your proxy to port 80 on the AdGuard Home container. Do not proxy the DNS ports -- DNS traffic (port 53) must go directly to AdGuard Home.

See the full [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for Nginx Proxy Manager, Traefik, and Caddy configurations.

## Backup

AdGuard Home stores everything you need to back up in two directories:

- **`./conf/`** -- contains `AdGuardHome.yaml` (all settings, filters, DNS rewrites, client configs) and any TLS certificates
- **`./work/`** -- contains query log databases and statistics (optional to back up; can be regenerated)

Back up at minimum the `conf` directory. A simple cron job works:

```bash
tar czf ~/backups/adguardhome-$(date +%Y%m%d).tar.gz -C ~/adguardhome conf
```

For a comprehensive backup approach, see [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Port 53 Already in Use

**Symptom:** Container fails to start with `bind: address already in use` on port 53.
**Fix:** `systemd-resolved` is the usual culprit. Follow the "Resolving the Port 53 Conflict" instructions above. Verify the port is free with `sudo lsof -i :53`.

### DNS Queries Not Resolving After Setup

**Symptom:** Devices pointed at AdGuard Home get no DNS resolution.
**Fix:** Check that your upstream DNS servers are configured correctly in Settings > DNS settings. Test from the server itself: `docker exec adguardhome nslookup google.com 127.0.0.1`. If that works, the issue is network routing -- verify your devices are using the server's IP as their DNS server and that port 53 is not blocked by a firewall.

### Setup Wizard Keeps Appearing

**Symptom:** Navigating to the web UI always shows the setup wizard on port 3000.
**Fix:** The `AdGuardHome.yaml` config file was not persisted. Verify your volume mounts point to existing directories. Check `docker inspect adguardhome` to confirm `./conf` is correctly mounted to `/opt/adguardhome/conf`. If the conf directory is empty, the setup wizard runs on every container start.

### High Memory Usage

**Symptom:** AdGuard Home uses 300+ MB of RAM.
**Fix:** Too many blocklists. Each loaded blocklist consumes RAM proportional to its size. Remove redundant lists -- two to three well-curated lists (AdGuard DNS filter + Hagezi Multi Pro) cover 95% of ads. Also check **Settings > DNS settings** and reduce the query log retention period from 90 days to 7 or 30 days.

### Slow DNS Queries

**Symptom:** Page loads feel sluggish after switching to AdGuard Home.
**Fix:** Enable **Optimistic caching** under Settings > DNS settings. This serves stale cache entries immediately while refreshing them in the background, eliminating perceived latency. Also enable **Parallel requests** so AdGuard Home queries all upstream servers simultaneously instead of sequentially.

### Clients Show as Single IP Instead of Individual Devices

**Symptom:** All queries appear to come from the Docker gateway IP (172.17.0.1) instead of individual client IPs.
**Fix:** This happens because Docker's NAT rewrites source IPs. Use `network_mode: host` in your Docker Compose file instead of publishing ports. Alternatively, if you want to keep bridge networking, configure your router to send DNS to the Docker host IP and use AdGuard Home's "Client settings" to identify devices by their MAC address or CIDR range.

## Resource Requirements

- **RAM:** ~80 MB idle with the default blocklist, ~150 MB with 3-4 blocklists loaded
- **CPU:** Very low -- DNS resolution is not compute-intensive. Any modern CPU handles it effortlessly.
- **Disk:** ~200 MB for the application and default filter data. Query logs grow over time depending on retention settings (default 90 days can reach 1-2 GB on busy networks).

## Verdict

AdGuard Home is the better choice for anyone setting up network-wide ad blocking today. Its web UI is significantly cleaner than Pi-hole's, encrypted DNS (DoH/DoT/DoQ) works out of the box without bolting on Unbound or Cloudflared, and the DNS rewrites feature is genuinely useful for self-hosters managing multiple services.

[Pi-hole](/apps/pi-hole/) still has a larger community, more third-party integrations (like the PADD terminal dashboard), and a deeper ecosystem of community-maintained blocklists. If you want maximum community support and are comfortable with a more manual encrypted DNS setup, Pi-hole is a solid alternative.

For a new deployment, go with AdGuard Home. The built-in encrypted DNS, simpler Docker setup, and modern interface make it the pragmatic choice.

## Related

- [Best Self-Hosted Ad Blockers](/best/ad-blocking/)
- [Pi-hole vs AdGuard Home](/compare/pi-hole-vs-adguard-home/)
- [How to Self-Host Pi-hole](/apps/pi-hole/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Remote Access with VPN](/foundations/remote-access/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
