---
title: "How to Self-Host Technitium DNS with Docker"
description: "Self-host Technitium DNS Server with Docker Compose — browser-based DNS management with ad blocking, DoH/DoT/DoQ, zone hosting, DHCP, and clustering."
date: 2026-02-16
dateUpdated: 2026-02-20
category: "ad-blocking"
apps:
  - technitium
tags:
  - self-hosted
  - dns
  - ad-blocking
  - technitium
  - docker
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Technitium DNS?

[Technitium DNS Server](https://technitium.com/dns/) is a full-featured authoritative and recursive DNS server with a comprehensive web UI. It goes far beyond ad blocking — you can host DNS zones, configure split-horizon DNS, set up DNS failover, use DNS-over-HTTPS/TLS/QUIC, and manage advanced DNS features. It's built on .NET and runs on Linux, Windows, and macOS. Technitium serves as both a DNS server for your network and an ad blocker, replacing cloud DNS services like Google DNS, Cloudflare DNS, and NextDNS.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 256 MB of free RAM
- 500 MB of free disk space
- Port 53 available (not used by another DNS resolver)

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/technitium && cd /opt/technitium
```

Create a `docker-compose.yml` file:

```yaml
services:
  dns-server:
    image: technitium/dns-server:14.3.0
    container_name: dns-server
    hostname: dns-server
    restart: unless-stopped
    ports:
      - "5380:5380/tcp"    # Web console (HTTP)
      - "53:53/udp"        # DNS
      - "53:53/tcp"        # DNS (TCP)
      # Uncomment for encrypted DNS:
      # - "853:853/udp"    # DNS-over-QUIC
      # - "853:853/tcp"    # DNS-over-TLS
      # - "443:443/udp"    # DNS-over-HTTPS (HTTP/3)
      # - "443:443/tcp"    # DNS-over-HTTPS
    environment:
      # Admin password for web console — CHANGE THIS
      - DNS_SERVER_DOMAIN=dns-server
      - DNS_SERVER_ADMIN_PASSWORD=CHANGE_ME_STRONG_PASSWORD
      - DNS_SERVER_PREFER_IPV6=false
      - DNS_SERVER_RECURSION=AllowOnlyForPrivateNetworks
      - DNS_SERVER_FORWARDERS=1.1.1.1,8.8.8.8
      - DNS_SERVER_FORWARDER_PROTOCOL=Tcp
      - DNS_SERVER_ENABLE_BLOCKING=true
      - DNS_SERVER_LOG_USING_LOCAL_TIME=true
    volumes:
      - config:/etc/dns
    sysctls:
      - net.ipv4.ip_local_port_range=1024 65535

volumes:
  config:
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Access the web console** at `http://your-server-ip:5380`

2. **Log in** with username `admin` and the password you set in `DNS_SERVER_ADMIN_PASSWORD`.

3. **Add blocklists** — go to **Settings** → **Blocking** → **Block List URLs**. Add these popular lists:
   - `https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts`
   - `https://raw.githubusercontent.com/hagezi/dns-blocklists/main/hosts/pro.txt`
   - `https://adaway.org/hosts.txt`

4. **Click "Update Now"** to download the blocklists.

5. **Point your network's DNS** to the server's IP address. Change your router's DHCP DNS settings or configure individual devices.

6. **Verify blocking works:**

```bash
dig @your-server-ip ads.google.com
```

Blocked domains should return `0.0.0.0` or NXDOMAIN.

## Browser-Based DNS Management

Technitium's entire configuration is managed through its built-in web UI — no command-line editing or config files required after initial Docker setup. Access it at `http://your-server-ip:5380` from any browser.

| Management Feature | Available in Browser UI |
|-------------------|------------------------|
| DNS zone management (A, AAAA, CNAME, MX, etc.) | Yes |
| Blocklist management (add/remove/update) | Yes |
| Upstream forwarder configuration | Yes |
| Custom DNS records for local network | Yes |
| Query log viewer with search/filter | Yes |
| Dashboard with real-time statistics | Yes |
| DHCP server configuration | Yes |
| DNS-over-HTTPS/TLS/QUIC setup | Yes |
| Cluster management (multi-server) | Yes |
| Backup and restore | Yes |
| User and access management | Yes |

This makes Technitium the most capable browser-managed DNS server you can self-host. [Pi-hole](/apps/pi-hole/) and [AdGuard Home](/apps/adguard-home/) also have web UIs for ad blocking, but neither offers full authoritative DNS zone management or clustering from the browser.

## Configuration

All configuration is managed through the web UI at port 5380. Environment variables only apply on first startup — after that, the web UI persists settings to `/etc/dns`.

### Changing the Admin Password

After first login, go to **Settings** → **General** → change the admin password. The environment variable password is only used for initial setup.

### Upstream DNS Forwarders

Go to **Settings** → **Proxy & Forwarders** → **Forwarders**. Configure which upstream DNS servers handle non-blocked queries:

- **Cloudflare:** `1.1.1.1` (UDP/TCP), `1.1.1.1:853` (TLS), `https://cloudflare-dns.com/dns-query` (HTTPS)
- **Quad9:** `9.9.9.9` (UDP/TCP), `dns.quad9.net:853` (TLS)
- **Google:** `8.8.8.8` (UDP/TCP), `dns.google:853` (TLS)

Set the protocol to **DNS-over-TLS** or **DNS-over-HTTPS** for encrypted upstream queries.

### Custom DNS Records

Go to **Zones** → **Add Zone** to create custom DNS records for your local network. This is useful for mapping hostnames to internal IP addresses (e.g., `nas.home.lan` → `192.168.1.50`).

## Advanced Configuration (Optional)

### DNS-over-HTTPS / DNS-over-TLS

Technitium supports serving encrypted DNS to your devices:

1. Uncomment the ports in the Docker Compose file (853 for DoT, 443 for DoH)
2. In the web UI, go to **Settings** → **Optional Protocols**
3. Enable DNS-over-TLS and/or DNS-over-HTTPS
4. Upload or generate a TLS certificate, or enable self-signed certificates

### Clustering (v14+)

Technitium v14 supports clustering multiple instances:

1. Deploy a second Technitium container on a different server
2. In the web UI, go to **Settings** → **Clustering**
3. Add the secondary server as a cluster node
4. Manage both from a single admin console

### DHCP Server

Uncomment port `67/udp` in Docker Compose and enable DHCP in **Settings** → **DHCP**. This replaces your router's DHCP server, automatically assigning your DNS server to all clients.

**Important:** Disable your router's DHCP server first to avoid conflicts.

### Two-Factor Authentication (v14+)

Enable TOTP-based 2FA for the admin account in **Settings** → **General** → **Two-Factor Authentication**.

## Reverse Proxy

The web console on port 5380 can be reverse-proxied for remote HTTPS access. For DNS (port 53), clients connect directly.

**Caddy:**
```
dns-admin.example.com {
    reverse_proxy localhost:5380
}
```

**Important:** Restrict web console access to trusted networks. It has full control over your DNS server. See our [reverse proxy setup guide](/foundations/reverse-proxy-explained/).

## Backup

All Technitium data is stored in `/etc/dns` inside the container (the `config` volume):

```bash
# Stop the container to ensure consistent backup
docker compose stop dns-server

# Back up the volume
docker run --rm -v technitium_config:/data -v $(pwd):/backup alpine \
  tar czf /backup/technitium-backup.tar.gz -C /data .

# Restart
docker compose start dns-server
```

Alternatively, use the built-in backup feature in the web UI: **Settings** → **Backup** → **Create Backup**. This generates a downloadable `.zip` file.

See our [backup strategy guide](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Port 53 already in use

**Symptom:** Container fails to start with "address already in use."
**Fix:** On Ubuntu, `systemd-resolved` uses port 53. Disable it:
```bash
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
sudo rm /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
```

### Web console not accessible

**Symptom:** Can't reach the admin UI at port 5380.
**Fix:** Check if the container is running (`docker compose ps`). Verify port 5380 isn't blocked by your firewall. Try accessing from the server itself: `curl http://localhost:5380`.

### Slow DNS resolution

**Symptom:** DNS queries take several seconds.
**Fix:** Technitium's cache is cold on first start. Resolution improves as the cache warms up. Check your upstream forwarders — try switching to Cloudflare (`1.1.1.1`) or using DNS-over-TLS for more consistent performance. Also check **Dashboard** → **Query Logs** for patterns.

### High memory usage

**Symptom:** Technitium uses more RAM than expected.
**Fix:** Large blocklists consume memory. If you've added many lists, consider consolidating to a single comprehensive list like [Hagezi's Pro](https://github.com/hagezi/dns-blocklists). Also check if query logging is filling up — set a retention period in **Settings** → **Logging**.

## Resource Requirements

- **RAM:** ~150 MB idle, ~300 MB with large blocklists and active caching
- **CPU:** Low — .NET is efficient for DNS serving. Handles thousands of queries/second
- **Disk:** ~200 MB for application + logs/cache growth

## Verdict

Technitium DNS is the most feature-complete self-hosted DNS server available. If you want a full DNS infrastructure tool — authoritative zones, split-horizon DNS, DNSSEC, clustering, DHCP — Technitium is the only choice that covers it all with a web UI. For pure ad blocking, [AdGuard Home](/apps/adguard-home/) has a cleaner interface and simpler setup. For minimal resource usage with config-as-code, [Blocky](/apps/blocky/) is lighter. But if you're running a homelab and want one DNS server that does everything, Technitium is the answer.

## FAQ

### Is Technitium DNS an ad blocker?

Yes, among other things. It has a built-in domain blocking feature that works like Pi-hole or AdGuard Home. But it's also a full recursive and authoritative DNS server, which Pi-hole and AdGuard Home are not.

### Can I use Technitium as my only DNS server?

Yes. Technitium is a full recursive DNS server — it can resolve queries by talking directly to root nameservers without forwarding to Google or Cloudflare. Set recursion mode to "Allow" and remove all forwarders for full recursive operation.

### How does it compare to Pi-hole?

Technitium is a complete DNS server; Pi-hole is a DNS proxy with ad blocking. Technitium can host your own DNS zones, act as an authoritative nameserver, and cluster across multiple servers. Pi-hole has a larger community and more third-party integrations for ad blocking specifically.

## Related

- [How to Self-Host Pi-hole](/apps/pi-hole/)
- [How to Self-Host AdGuard Home](/apps/adguard-home/)
- [How to Self-Host Blocky](/apps/blocky/)
- [Pi-hole vs Technitium](/compare/pi-hole-vs-technitium/)
- [Blocky vs Technitium](/compare/blocky-vs-technitium/)
- [AdGuard Home vs Technitium](/compare/adguard-home-vs-technitium/)
- [Pi-hole vs AdGuard Home](/compare/pi-hole-vs-adguard-home/)
- [Best Self-Hosted Ad Blockers](/best/ad-blocking/)
- [Self-Hosted Alternatives to Google DNS](/replace/google-dns/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [DNS Explained](/foundations/dns-explained/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [CoreDNS vs Technitium](/compare/coredns-vs-technitium/)
- [Technitium vs Unbound](/compare/technitium-vs-unbound/)
