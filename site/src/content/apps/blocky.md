---
title: "How to Self-Host Blocky with Docker"
description: "Deploy Blocky — a lightweight DNS proxy and ad blocker configured entirely via YAML. Complete Docker Compose setup guide."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "ad-blocking"
apps:
  - blocky
tags:
  - self-hosted
  - dns
  - ad-blocking
  - blocky
  - docker
  - privacy
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Blocky?

[Blocky](https://0xerr0r.github.io/blocky/) is a DNS proxy and ad blocker written in Go. It sits between your devices and upstream DNS servers, blocking ads, trackers, and malware domains at the DNS level. Unlike Pi-hole or AdGuard Home, Blocky has no web UI by default — it's configured entirely through a YAML file, making it ideal for infrastructure-as-code setups. It supports DNS-over-HTTPS (DoH), DNS-over-TLS (DoT), conditional forwarding, client-specific rules, and caching out of the box. It replaces cloud DNS services like Google DNS, Cloudflare DNS, and NextDNS.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 64 MB of free RAM (Blocky is extremely lightweight)
- Port 53 available (not used by another DNS resolver — check with `sudo lsof -i :53`)
- Basic familiarity with YAML configuration

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/blocky && cd /opt/blocky
```

Create a `docker-compose.yml` file:

```yaml
services:
  blocky:
    image: spx01/blocky:v0.28.2
    container_name: blocky
    restart: unless-stopped
    ports:
      - "53:53/tcp"
      - "53:53/udp"
      - "4000:4000/tcp"   # HTTP API / Prometheus metrics
    volumes:
      - ./config.yml:/app/config.yml:ro
    environment:
      - TZ=America/New_York   # Change to your timezone
    healthcheck:
      test: ["/app/blocky", "healthcheck"]
      interval: 30s
      timeout: 3s
      start_period: 60s
      retries: 3
```

Create a `config.yml` file alongside the Compose file:

```yaml
# Upstream DNS resolvers — queries go here when not blocked
upstreams:
  groups:
    default:
      - 1.1.1.1             # Cloudflare
      - 8.8.8.8             # Google
      - 9.9.9.9             # Quad9
      - tcp-tls:1.1.1.1:853 # Cloudflare DNS-over-TLS
  strategy: parallel_best    # Query all, use fastest response
  timeout: 2s

# Ad/tracker blocking
blocking:
  denylists:
    ads:
      - https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
      - https://s3.amazonaws.com/lists.disconnect.me/simple_ad.txt
      - https://s3.amazonaws.com/lists.disconnect.me/simple_tracking.txt
      - https://raw.githubusercontent.com/hagezi/dns-blocklists/main/hosts/pro.txt
  allowlists:
    ads: []
  clientGroupsBlock:
    default:
      - ads
  blockType: zeroIp     # Return 0.0.0.0 for blocked domains
  blockTTL: 1m
  loading:
    refreshPeriod: 24h   # Refresh blocklists daily
    downloads:
      timeout: 60s
      attempts: 3
      cooldown: 10s
    strategy: failOnError

# DNS response caching
caching:
  minTime: 5m
  maxTime: 30m
  prefetching: true        # Preload frequently queried domains
  prefetchExpires: 2h
  prefetchThreshold: 5
  cacheTimeNegative: 30m   # Cache NXDOMAIN responses

# Custom DNS entries (optional — for local network devices)
# customDNS:
#   mapping:
#     printer.lan: 192.168.1.100
#     nas.lan: 192.168.1.50

# Conditional forwarding (optional — resolve local hostnames via your router)
# conditional:
#   mapping:
#     lan: 192.168.1.1       # Forward .lan queries to your router
#     168.192.in-addr.arpa: 192.168.1.1  # Reverse DNS for local IPs

# Ports
ports:
  dns: 53        # Standard DNS
  http: 4000     # HTTP API, Prometheus metrics

# Logging
log:
  level: info
  format: text
  timestamp: true
  privacy: false   # Set to true to anonymize client IPs in logs
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. **Verify Blocky is running:**

```bash
docker compose logs blocky
```

Look for `"blocky is up and running"` in the output.

2. **Test DNS resolution:**

```bash
# Should resolve normally
dig @127.0.0.1 google.com

# Should be blocked (returns 0.0.0.0)
dig @127.0.0.1 ads.google.com
```

3. **Point your devices to Blocky** — set your router's DNS to the server's IP address, or change DNS on individual devices. See our [guide to replacing Google DNS](/replace/google-dns) for detailed instructions.

## Configuration

All configuration is in `config.yml`. After making changes, restart the container:

```bash
docker compose restart blocky
```

### Adding More Blocklists

Add URLs to the `denylists` section. Popular lists:

```yaml
blocking:
  denylists:
    ads:
      - https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
      - https://raw.githubusercontent.com/hagezi/dns-blocklists/main/hosts/pro.txt
    malware:
      - https://raw.githubusercontent.com/hagezi/dns-blocklists/main/hosts/tif.txt
    adult:
      - https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn/hosts
  clientGroupsBlock:
    default:
      - ads
      - malware
    kids-tablet:
      - ads
      - malware
      - adult
```

### Per-Client Rules

Apply different blocklists to different clients by IP or hostname:

```yaml
blocking:
  clientGroupsBlock:
    default:
      - ads
    192.168.1.100:
      - ads
      - malware
    kids-*:
      - ads
      - malware
      - adult
```

### Allowlisting Domains

If a domain is falsely blocked:

```yaml
blocking:
  allowlists:
    ads:
      - |
        # Inline allowlist
        example.com
        *.example.com
```

## Advanced Configuration (Optional)

### Encrypted DNS Upstream

Use DNS-over-TLS or DNS-over-HTTPS for upstream queries:

```yaml
upstreams:
  groups:
    default:
      - tcp-tls:1.1.1.1:853         # Cloudflare DoT
      - tcp-tls:dns.quad9.net:853    # Quad9 DoT
      - https://dns.cloudflare.com/dns-query  # Cloudflare DoH
```

### Prometheus Metrics

Blocky exposes metrics on the HTTP port:

```yaml
prometheus:
  enable: true
  path: /metrics
```

Access at `http://your-server:4000/metrics`. Pair with Grafana for dashboards — the Blocky project provides a [Grafana dashboard template](https://0xerr0r.github.io/blocky/latest/prometheus_grafana/).

### DNSSEC Validation (v0.28+)

```yaml
dnssec:
  validate: true
  maxChainDepth: 10
```

### Query Logging to Database

For persistent query logs beyond container restarts:

```yaml
queryLog:
  type: postgresql
  target: postgres://user:password@db:5432/blocky_logs
  logRetentionDays: 30
```

## Reverse Proxy

The HTTP API on port 4000 can be proxied for remote management. Only expose this internally — it has no authentication.

For DNS, no reverse proxy is needed — clients connect directly on port 53.

See our [reverse proxy setup guide](/foundations/reverse-proxy-explained).

## Backup

Blocky is **stateless** — all configuration is in `config.yml`. To back up:

1. Back up `config.yml` and `docker-compose.yml`
2. That's it — there's no database or persistent state to back up

If you're using query logging to a database, back up that database separately.

See our [backup strategy guide](/foundations/backup-3-2-1-rule).

## Troubleshooting

### Port 53 already in use

**Symptom:** Container fails to start with "address already in use" on port 53.
**Fix:** On Ubuntu, `systemd-resolved` listens on port 53 by default. Disable it:
```bash
sudo systemctl disable systemd-resolved
sudo systemctl stop systemd-resolved
sudo rm /etc/resolv.conf
echo "nameserver 1.1.1.1" | sudo tee /etc/resolv.conf
```

### Blocklists not loading

**Symptom:** Ads aren't being blocked. Logs show download failures.
**Fix:** Check if the blocklist URLs are accessible from inside the container:
```bash
docker compose exec blocky wget -q -O /dev/null https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
```
If blocked by your network, add bootstrap DNS:
```yaml
bootstrapDns:
  - tcp+udp:1.1.1.1
```

### DNS resolution slow after switching

**Symptom:** Websites load slower after pointing DNS to Blocky.
**Fix:** The first query for each domain takes longer (upstream resolution). Subsequent queries are cached. Enable prefetching for frequently used domains. If latency is still high, check your upstream resolvers — try switching to Cloudflare (`1.1.1.1`) or Google (`8.8.8.8`).

### No web UI?

**Symptom:** You expected a web dashboard but Blocky doesn't have one.
**Fix:** Blocky is intentionally UI-less — configure via YAML. If you want a web UI, use the HTTP API (port 4000) or pair with Grafana + Prometheus. If you need a built-in UI, consider [AdGuard Home](/apps/adguard-home) or [Pi-hole](/apps/pi-hole).

## Resource Requirements

- **RAM:** 30-50 MB idle, ~100 MB with large blocklists loaded
- **CPU:** Minimal — handles thousands of queries per second on a single core
- **Disk:** Negligible (stateless — config file only)

Blocky is the most lightweight DNS ad blocker available. It runs comfortably on a Raspberry Pi Zero.

## Verdict

Blocky is the best DNS ad blocker for infrastructure-as-code enthusiasts who prefer YAML configuration over web UIs. It's absurdly lightweight, supports encrypted DNS natively, and the per-client filtering is more flexible than Pi-hole's. If you want a web dashboard for monitoring and configuration, use [AdGuard Home](/apps/adguard-home) instead. If you want the largest community and most third-party integrations, use [Pi-hole](/apps/pi-hole). But if you're comfortable with config files and want the smallest, fastest DNS blocker possible, Blocky is the right choice.

## FAQ

### Can Blocky replace Pi-hole?

Yes. Blocky does everything Pi-hole does (DNS proxying, ad blocking, caching, conditional forwarding) without the web UI. It adds native DoH/DoT support that Pi-hole requires add-ons for.

### Does Blocky support DNS-over-HTTPS?

Yes, both as a client (querying upstream via DoH) and as a server (serving DoH to your devices on the HTTPS port).

### How do I see what's being blocked?

Check the container logs (`docker compose logs -f blocky`) or enable Prometheus metrics and view them in Grafana. The HTTP API also provides query/blocking statistics at `http://your-server:4000/api/`.

## Related

- [How to Self-Host Pi-hole](/apps/pi-hole)
- [How to Self-Host AdGuard Home](/apps/adguard-home)
- [How to Self-Host Technitium DNS](/apps/technitium)
- [Pi-hole vs Blocky](/compare/pi-hole-vs-blocky)
- [AdGuard Home vs Blocky](/compare/adguard-home-vs-blocky)
- [Pi-hole vs AdGuard Home](/compare/pi-hole-vs-adguard-home)
- [Best Self-Hosted Ad Blockers](/best/ad-blocking)
- [Self-Hosted Alternatives to Google DNS](/replace/google-dns)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [DNS Explained](/foundations/dns-explained)
