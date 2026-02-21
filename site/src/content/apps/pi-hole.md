---
title: "How to Self-Host Pi-hole with Docker"
description: "Step-by-step guide to self-hosting Pi-hole with Docker Compose — set up network-wide ad blocking for every device on your network in under 10 minutes."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "ad-blocking"
apps:
  - pi-hole
tags: ["self-hosted", "ad-blocking", "pi-hole", "docker", "dns"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Pi-hole?

[Pi-hole](https://pi-hole.net/) is a network-wide ad blocker that acts as a DNS sinkhole. Instead of installing ad blockers on every browser and device, you point your network's DNS to Pi-hole and it filters out ad-serving domains before they ever reach your devices. Phones, smart TVs, IoT gadgets, every device on your network gets ad blocking with zero client-side configuration.

Pi-hole is often called the "gateway drug to self-hosting" for good reason. It delivers immediate, tangible value (faster page loads, no ads on every device), runs on minimal hardware, and takes about 10 minutes to set up. If you've never self-hosted anything, start here.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 512 MB of free RAM (100 MB typical usage)
- 1 GB of free disk space
- A static IP address or DHCP reservation for your server (critical — your entire network depends on this IP for DNS)

## Docker Compose Configuration

Create a directory for Pi-hole and add a `docker-compose.yml` file:

```bash
mkdir -p ~/pihole && cd ~/pihole
```

Create a `docker-compose.yml` file:

```yaml
services:
  pihole:
    container_name: pihole
    image: pihole/pihole:2025.11.1
    ports:
      - "53:53/tcp"    # DNS over TCP
      - "53:53/udp"    # DNS over UDP
      - "80:80/tcp"    # Web admin interface (HTTP)
      - "443:443/tcp"  # Web admin interface (HTTPS)
    environment:
      TZ: "${TZ}"
      FTLCONF_webserver_api_password: "${PIHOLE_PASSWORD}"
      FTLCONF_dns_upstreams: "${DNS_UPSTREAMS}"
      FTLCONF_dns_listeningMode: "ALL"
    volumes:
      - ./etc-pihole:/etc/pihole    # Pi-hole config and databases
    cap_add:
      - NET_ADMIN    # Required for DHCP server and IPv6 RA
      - SYS_TIME     # Required for NTP client
      - SYS_NICE     # Allows process priority optimization
    restart: unless-stopped
```

Create a `.env` file alongside it:

```bash
# Timezone — use your IANA timezone
# Full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
TZ=America/New_York

# Web interface password — CHANGE THIS to something strong
# If left empty, a random password is generated and printed in container logs
PIHOLE_PASSWORD=change-me-to-a-strong-password

# Upstream DNS servers, separated by semicolons
# These are queried for domains that aren't blocked
# Options: Cloudflare (1.1.1.1), Google (8.8.8.8), Quad9 (9.9.9.9)
DNS_UPSTREAMS=1.1.1.1;1.0.0.1
```

A few things worth noting about this configuration:

- **`FTLCONF_dns_listeningMode: "ALL"`** is required when using Docker's default bridge network. Without it, Pi-hole only listens on the container's loopback interface and ignores DNS queries from your network.
- **`FTLCONF_dns_upstreams`** sets where Pi-hole forwards non-blocked queries. Cloudflare (`1.1.1.1`) is a solid default — fast and supports DNS-over-HTTPS. Separate multiple servers with semicolons.
- **`cap_add: NET_ADMIN`** is needed if you want to use Pi-hole as a DHCP server. You can omit it if you only need DNS filtering, but it's safer to include it.
- **Environment variables set via `FTLCONF_` become read-only** in the web interface. You can still change other settings through the UI, but anything defined in your Compose file is locked to that value. This is intentional — your Compose file is the single source of truth.

Start the stack:

```bash
docker compose up -d
```

Verify it's running:

```bash
docker compose logs -f pihole
```

You should see Pi-hole's FTL engine start up and begin listening on port 53. Press `Ctrl+C` to exit the log view.

## Initial Setup

Open your browser and navigate to `http://<your-server-ip>/admin`. Log in with the password you set in the `.env` file.

The dashboard shows:

- **Total queries** — DNS requests processed
- **Queries blocked** — ads and trackers stopped
- **Percent blocked** — your block rate (typically 15-30% on a home network)
- **Domains on blocklists** — how many domains are in your block database

At this point Pi-hole is running, but nothing is using it yet. You need to point your devices or router at it.

## Configuration

### Setting Pi-hole as Your DNS Server

There are two approaches. The router method is strongly recommended.

**Option 1: Router-Level DNS (Recommended)**

This covers every device on your network automatically, including phones, smart TVs, and IoT devices that you can't install ad blockers on.

1. Log into your router's admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Find the DHCP/DNS settings (location varies by router)
3. Set the **primary DNS server** to your Pi-hole server's IP address
4. Set the **secondary DNS server** to your Pi-hole server's IP as well (or leave it blank)
5. Save and reboot the router

Do not set a non-Pi-hole address as the secondary DNS. Devices will randomly use the secondary server and bypass Pi-hole entirely, giving you inconsistent blocking.

After changing router DNS, devices pick up the new settings when they renew their DHCP lease. Force a renewal by disconnecting and reconnecting to Wi-Fi, or wait up to 24 hours for all devices to cycle.

**Option 2: Per-Device DNS**

On individual devices, set the DNS server to your Pi-hole's IP in the network settings. This is useful for testing before committing at the router level, but doesn't scale.

### Adding Blocklists

Pi-hole ships with a default blocklist (Steven Black's unified hosts list) that blocks around 100,000 domains. That's a reasonable starting point, but you can do better.

To add more blocklists:

1. Go to **Adlists** in the web UI sidebar
2. Paste a blocklist URL and click **Add**
3. Go to **Tools > Gravity > Update** to pull in the new list

Recommended additional lists:

| List | Domains | Focus |
|------|---------|-------|
| [Hagezi Multi Pro](https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt) | ~300K | Ads, tracking, malware |
| [OISD Big](https://big.oisd.nl/) | ~200K | Comprehensive, low false positives |
| [Steven Black Unified](https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts) | ~100K | Ads and malware (included by default) |

Start with one or two lists beyond the default. More lists means more blocked domains, but also more potential false positives. Add gradually and monitor.

### Whitelisting

Some domains get blocked that shouldn't be. When a site or service breaks after enabling Pi-hole, whitelist the offending domain:

1. Go to **Domains** in the web UI
2. Enter the domain and select **Whitelist (Exact)** or **Whitelist (Regex)**
3. Click **Add**

Commonly whitelisted domains:

- `s.youtube.com` — YouTube history
- `video-stats.l.google.com` — YouTube playback
- `connectivitycheck.gstatic.com` — Android connectivity checks
- `officeclient.microsoft.com` — Microsoft Office activation
- `v10.events.data.microsoft.com` — Microsoft Office telemetry (breaks some features if blocked)
- `dl.delivery.mp.microsoft.com` — Windows Update

Check Pi-hole's query log (**Long term data > Query Log**) to find which domain is being blocked when something breaks.

## Advanced Configuration

### Conditional Forwarding

If you want Pi-hole to resolve local hostnames (e.g., `nas.local` or `printer.home`), enable conditional forwarding:

1. Go to **Settings > DNS**
2. Under **Conditional forwarding**, check **Use Conditional Forwarding**
3. Enter your router's IP and your local domain (e.g., `192.168.1.1` and `local` or `home`)

Pi-hole will forward reverse DNS lookups for local IP ranges to your router, so you see device hostnames instead of bare IPs in the query log.

### Custom DNS Records

Pi-hole can serve as a local DNS server for your other self-hosted apps. Instead of remembering IP addresses, create DNS records:

1. Go to **Local DNS > DNS Records**
2. Add entries like:
   - `jellyfin.home` -> `192.168.1.50`
   - `nextcloud.home` -> `192.168.1.50`
   - `grafana.home` -> `192.168.1.50`

This is especially useful if you run multiple services on the same server — you can use different hostnames with a [reverse proxy](/foundations/reverse-proxy-explained/) to route traffic.

### DHCP Server

Pi-hole can replace your router's DHCP server. This gives Pi-hole direct knowledge of every device on your network, showing hostnames in logs instead of bare IPs.

To enable it:

1. **Disable DHCP on your router first** — two DHCP servers on the same network cause conflicts
2. In Pi-hole, go to **Settings > DHCP**
3. Enable the DHCP server and configure the IP range
4. The `NET_ADMIN` capability in the Docker Compose config is required for this

The trade-off: if Pi-hole goes down, devices can't get new IP addresses until it comes back. For most home setups, this is fine. For critical environments, keep DHCP on your router.

## Reverse Proxy

If you want to access Pi-hole's admin interface over HTTPS with a proper domain name (e.g., `pihole.yourdomain.com`), put it behind a reverse proxy. With [Nginx Proxy Manager](/foundations/reverse-proxy-explained/):

1. Add a new proxy host pointing to your server's IP on port 80
2. Set the domain to `pihole.yourdomain.com`
3. Enable SSL with Let's Encrypt
4. Under **Advanced**, add:
   ```
   proxy_hide_header Content-Security-Policy;
   proxy_hide_header X-Frame-Options;
   ```

Keep in mind that the DNS service itself (port 53) should not go through the reverse proxy — only the web admin interface on port 80/443.

For more reverse proxy options, see the [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) foundation guide.

## Backup

Pi-hole stores everything you care about in the `/etc/pihole` volume mount. Back up these files:

- **`gravity.db`** — your blocklists, whitelists, and domain data
- **`pihole.toml`** — Pi-hole v6 configuration file
- **`custom.list`** — custom DNS records (if used)
- **`pihole-FTL.db`** — long-term query statistics (can be large, optional to back up)

The simplest backup approach:

```bash
# Stop Pi-hole to ensure database consistency
docker compose stop pihole

# Back up the volume
tar -czf pihole-backup-$(date +%Y%m%d).tar.gz ./etc-pihole

# Start Pi-hole again
docker compose start pihole
```

For automated backups, Pi-hole also has a built-in Teleporter tool: **Settings > Teleporter > Export**. This creates a downloadable archive of your settings, blocklists, and whitelists.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive backup approach.

## Troubleshooting

### DNS Resolution Stops Working

**Symptom:** No internet access after setting Pi-hole as your DNS server. Websites fail to load with "DNS_PROBE_FINISHED_NXDOMAIN" or similar errors.

**Fix:**

1. Check that the Pi-hole container is running:
   ```bash
   docker compose ps
   ```
2. Verify Pi-hole is listening on port 53:
   ```bash
   docker compose logs pihole | grep "listening"
   ```
3. Test DNS resolution directly against Pi-hole:
   ```bash
   dig @<your-server-ip> google.com
   ```
4. If the container is running but DNS isn't working, check your upstream DNS settings in the `.env` file. Try switching to `8.8.8.8;8.8.4.4` to rule out upstream issues.

### systemd-resolved Conflict (Ubuntu)

**Symptom:** Pi-hole fails to start with "address already in use" on port 53. This is the most common issue on Ubuntu servers.

**Fix:** Ubuntu's `systemd-resolved` service runs a local DNS stub listener on port 53. You need to disable it:

```bash
# Disable the stub listener
sudo sed -i 's/#DNSStubListener=yes/DNSStubListener=no/' /etc/systemd/resolved.conf

# Update the resolv.conf symlink
sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf

# Restart systemd-resolved
sudo systemctl restart systemd-resolved
```

After this, port 53 is free for Pi-hole. Restart the container:

```bash
docker compose restart pihole
```

### High Memory Usage

**Symptom:** Pi-hole is using significantly more than 100-200 MB of RAM.

**Fix:** This usually means you have too many blocklists loaded. The `gravity.db` database grows with each list.

1. Check your gravity database size:
   ```bash
   ls -lh ./etc-pihole/gravity.db
   ```
2. Remove blocklists you don't need: **Adlists** > delete low-value lists
3. Run **Tools > Gravity > Update** to rebuild the database
4. Target 300K-500K total blocked domains. Going beyond 1M rarely improves blocking but significantly increases memory usage.

### Slow DNS Queries

**Symptom:** Websites load noticeably slower after enabling Pi-hole (more than 50ms added latency).

**Fix:**

1. Check your upstream DNS servers. Use fast, nearby servers. Run a comparison:
   ```bash
   dig @1.1.1.1 google.com | grep "Query time"
   dig @8.8.8.8 google.com | grep "Query time"
   dig @9.9.9.9 google.com | grep "Query time"
   ```
2. Enable Pi-hole's built-in caching (enabled by default, but verify the cache size in **Settings > DNS**)
3. If using conditional forwarding, ensure your router responds quickly to reverse DNS queries
4. For the best performance, consider running [Unbound](https://docs.pi-hole.net/guides/dns/unbound/) as a local recursive DNS resolver alongside Pi-hole, which eliminates reliance on upstream providers entirely

### Web Interface Not Loading

**Symptom:** Can't access `http://<server-ip>/admin` in the browser.

**Fix:**

1. Check the container is running and healthy:
   ```bash
   docker compose ps
   docker compose logs pihole | tail -20
   ```
2. Verify port 80 isn't used by another service:
   ```bash
   sudo ss -tlnp | grep :80
   ```
3. If another service uses port 80, remap Pi-hole's web port in `docker-compose.yml`:
   ```yaml
   ports:
     - "8080:80/tcp"  # Access admin at http://server-ip:8080/admin
   ```
4. Check firewall rules allow traffic on port 80:
   ```bash
   sudo ufw status
   ```

## Resource Requirements

- **RAM:** ~100 MB idle, ~200 MB under load with default blocklists. Heavy blocklists (1M+ domains) can push this to 300-400 MB.
- **CPU:** Negligible. Any modern CPU handles Pi-hole without breaking a sweat. Even a Raspberry Pi Zero handles a household's DNS traffic.
- **Disk:** ~500 MB for application, databases, and blocklists. The long-term query database (`pihole-FTL.db`) can grow over time — configure retention in **Settings > Privacy** if disk is limited.

## Verdict

Pi-hole is the single best first self-hosted app you can run. It provides immediate, tangible value — every device on your network gets ad-free browsing without installing anything on individual devices. Smart TVs stop showing ads. Phones stop loading trackers. Pages load faster because ad content is never fetched.

Setup takes 10 minutes. Resource usage is trivial. Maintenance is nearly zero once configured.

If you self-host only one thing, make it Pi-hole.

The main alternative is [AdGuard Home](/apps/adguard-home/), which has a more modern UI, built-in DNS-over-HTTPS support, and slightly easier initial setup. But Pi-hole's community is larger, its blocklist ecosystem is more mature, and its query log and filtering tools are more powerful. For most people, Pi-hole is the better choice.

## Related

- [Best Self-Hosted Ad Blockers](/best/ad-blocking/)
- [Pi-hole vs AdGuard Home](/compare/pi-hole-vs-adguard-home/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Docker Networking](/foundations/docker-networking/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
