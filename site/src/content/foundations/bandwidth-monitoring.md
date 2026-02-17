---
title: "Bandwidth Monitoring for Home Servers"
description: "Monitor network bandwidth on your self-hosted server. Track per-container usage, set alerts, and identify bandwidth hogs."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["networking", "bandwidth", "monitoring", "server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Monitor Bandwidth?

Bandwidth monitoring answers critical questions for self-hosters: Which container is using all your upload bandwidth? Is your VPS approaching its monthly transfer cap? Why is your internet slow when Nextcloud is syncing? Is someone unauthorized accessing your services?

Without monitoring, bandwidth issues are invisible until something breaks or your ISP throttles you.

## Prerequisites

- A running Linux server ([Getting Started](/foundations/getting-started))
- SSH access ([SSH Setup](/foundations/ssh-setup))
- Docker installed for container-level monitoring ([Docker Compose Basics](/foundations/docker-compose-basics))

## Quick Bandwidth Check Tools

### iftop — Real-Time Traffic by Connection

```bash
# Install
sudo apt install iftop

# Monitor all traffic on the primary interface
sudo iftop -i eth0

# Filter to a specific port (e.g., HTTP)
sudo iftop -i eth0 -f "port 80 or port 443"
```

iftop shows a live display of connections sorted by bandwidth. You'll see which IP addresses are sending/receiving the most data. Press `q` to quit.

### nload — Simple Bandwidth Graph

```bash
# Install
sudo apt install nload

# Monitor the primary interface
nload eth0
```

nload shows incoming and outgoing bandwidth as a simple ASCII graph. Good for a quick check during file transfers or sync operations.

### vnstat — Long-Term Traffic Statistics

vnstat runs as a daemon, collecting traffic data continuously. It's the best tool for tracking monthly bandwidth usage — essential if your VPS has a transfer cap.

```bash
# Install
sudo apt install vnstat

# Start the daemon
sudo systemctl enable --now vnstat

# View hourly traffic
vnstat -h

# View daily traffic
vnstat -d

# View monthly traffic
vnstat -m

# View live traffic rate
vnstat -l
```

vnstat stores data persistently, so you can check last month's usage or compare months:

```bash
# Show this month vs last month
vnstat -m

# Output example:
#    month        rx      |     tx      |    total
#  2026-01     145.23 GiB |   32.56 GiB |  177.79 GiB
#  2026-02      89.41 GiB |   21.33 GiB |  110.74 GiB
```

### bmon — Per-Interface Bandwidth Monitor

```bash
# Install
sudo apt install bmon

# Run
bmon
```

bmon shows bandwidth per network interface with sparkline graphs. Useful when you have multiple interfaces (LAN, WAN, Docker bridges).

## Docker Container Bandwidth

### Per-Container Network Usage

Docker tracks network I/O per container:

```bash
# Real-time stats for all containers
docker stats --format "table {{.Name}}\t{{.NetIO}}"

# Example output:
# NAME            NET I/O
# nextcloud       245MB / 1.2GB
# jellyfin        12GB / 890MB
# postgres        45MB / 120MB
# wireguard       3.4GB / 5.1GB
```

The first number is received (RX), the second is transmitted (TX). These are cumulative since container start — restart the container to reset.

### Identifying Bandwidth Hogs

```bash
# Sort containers by network I/O (snapshot)
docker stats --no-stream --format "{{.Name}}: {{.NetIO}}" | sort -t/ -k2 -h -r
```

Common bandwidth-heavy containers:
- **Jellyfin/Plex** — Media streaming to multiple clients
- **Nextcloud** — Large file sync operations
- **WireGuard/Tailscale** — All tunneled traffic passes through here
- **Immich** — Mobile photo backup uploads
- **qBittorrent** — Download and upload torrent traffic

### Docker Network Traffic with iptables

For more granular Docker network monitoring:

```bash
# See traffic per Docker network
sudo iptables -L DOCKER -v -n

# Traffic counters per container chain
sudo iptables -L DOCKER-USER -v -n
```

## Setting Up Persistent Monitoring

### vnstat for VPS Transfer Caps

If your VPS has a monthly transfer limit (common: 1-20 TB), set up vnstat alerts:

```bash
# Check monthly usage
vnstat -m --oneline | cut -d';' -f11

# Simple bash script for alerts (add to cron)
#!/bin/bash
LIMIT_GB=1000
USED_GB=$(vnstat -m --oneline | cut -d';' -f11 | grep -oP '[\d.]+')
if (( $(echo "$USED_GB > $LIMIT_GB" | bc -l) )); then
  echo "Bandwidth limit approaching: ${USED_GB} GB used of ${LIMIT_GB} GB" | \
    mail -s "Bandwidth Warning" admin@example.com
fi
```

### Monitoring with Prometheus + Grafana

For self-hosted monitoring stacks, use node_exporter to expose bandwidth metrics:

```bash
# node_exporter exposes these metrics:
# node_network_receive_bytes_total
# node_network_transmit_bytes_total
```

Create Grafana dashboards showing:
- Bandwidth per interface over time
- Daily/weekly/monthly totals
- Alerts when usage exceeds thresholds

See [Monitoring Basics](/foundations/monitoring-basics) for setting up the Prometheus + Grafana stack.

### NetFlow / sFlow Analysis

For detailed traffic analysis (which hosts, protocols, and services generate the most traffic), use `softflowd` with `nfcapd`:

```bash
# Install
sudo apt install softflowd nfdump

# Start collecting on eth0
sudo softflowd -i eth0 -n localhost:9995

# Analyze collected flows
nfdump -R /var/cache/nfdump -s ip/bytes
```

This is more complex but gives protocol-level visibility — useful for diagnosing exactly what's consuming bandwidth.

## Practical Scenarios

### Checking if Nextcloud Sync Is Hogging Bandwidth

```bash
# Monitor port 443 traffic in real time
sudo iftop -i eth0 -f "port 443"

# Or check the Nextcloud container specifically
docker stats nextcloud --no-stream
```

### Monitoring WireGuard Tunnel Traffic

All traffic through your WireGuard tunnel appears on the `wg0` interface:

```bash
# Monitor WireGuard traffic
sudo iftop -i wg0

# Or track with vnstat
vnstat -i wg0 -l
```

### Tracking Jellyfin Streaming Bandwidth

```bash
# Check how much bandwidth Jellyfin is using
docker stats jellyfin --no-stream --format "{{.NetIO}}"

# If streaming to external clients, monitor the WAN interface
sudo iftop -i eth0 -f "port 8096"
```

## Reducing Bandwidth Usage

| Strategy | Savings | How |
|----------|---------|-----|
| Transcode media to lower quality | 50-80% | Jellyfin transcoding settings |
| Enable compression in Nextcloud | 10-30% | Server-side compression |
| Limit upload speed in torrent client | Direct | qBittorrent speed limits |
| Use Cloudflare Tunnel | Saves upload | Clients connect to Cloudflare edge |
| Cache DNS locally | Minimal | Pi-hole / AdGuard Home |
| Schedule large syncs off-peak | 0% less, but better UX | Cron-based sync triggers |

## Common Mistakes

### Monitoring the Wrong Interface

Docker containers use bridge networks. Traffic between containers on the same bridge doesn't appear on `eth0`. Monitor `docker0` or the specific bridge interface to see inter-container traffic.

```bash
# List Docker network interfaces
ip link show | grep docker
```

### Ignoring Upload Bandwidth

Home internet connections are asymmetric — upload is typically 5-20x slower than download. Running a public Jellyfin instance or Nextcloud with large file sharing can saturate your upload easily. Monitor upload separately.

### Not Setting Up vnstat Before You Need It

vnstat only tracks data from when it starts running. If you set it up after hitting your VPS limit, you have no historical data. Install and start vnstat on day one.

### Forgetting Docker Overlay Traffic

In Docker Swarm or when using overlay networks, traffic is encapsulated. The actual network usage is higher than what application-level monitoring shows due to encapsulation overhead.

## Next Steps

- Set up comprehensive monitoring with [Monitoring Basics](/foundations/monitoring-basics)
- Configure your firewall to control traffic with [Firewall Setup](/foundations/firewall-ufw)
- Understand network concepts at [Networking Concepts](/foundations/ports-explained)
- Manage power costs with [Power Management](/foundations/power-management)

## FAQ

### How much bandwidth does a typical self-hosted server use?

It varies enormously. A server running Pi-hole + Vaultwarden + Nextcloud (personal use) might use 50-100 GB/month. Add Jellyfin streaming to external users and it could be 1+ TB/month. Monitor first, then plan.

### Will bandwidth monitoring slow down my server?

No. Tools like vnstat use negligible resources — they read kernel counters that exist regardless. iftop and nload use slightly more CPU but only while running interactively.

### My VPS has a 1 TB transfer limit. How do I avoid exceeding it?

Install vnstat immediately. Set up a weekly cron job that checks usage and alerts you at 75% and 90% thresholds. Disable large bandwidth services (media streaming to external clients) if you're approaching the limit.

### Can I monitor bandwidth per Docker container without extra tools?

Yes. `docker stats` shows cumulative network I/O per container. For historical data and graphs, you'll need Prometheus + cAdvisor or a similar monitoring stack.

## Related

- [Monitoring Basics](/foundations/monitoring-basics)
- [Firewall Setup (UFW)](/foundations/firewall-ufw)
- [Ports Explained](/foundations/ports-explained)
- [Docker Networking](/foundations/docker-networking)
- [Power Management](/foundations/power-management)
- [Home Network Setup](/foundations/home-network-setup)
