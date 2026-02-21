---
title: "Dynamic DNS Setup for Self-Hosting"
description: "Set up Dynamic DNS so your domain always points to your home server, even when your ISP changes your public IP address automatically."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["dns", "networking", "ddns", "remote-access", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Dynamic DNS?

Most residential ISPs assign a dynamic public IP address that changes periodically — anywhere from daily to monthly. Dynamic DNS (DDNS) automatically updates your DNS records when your IP changes, so your domain always points to your home server.

Without DDNS, your self-hosted services become unreachable when your IP changes because `yourdomain.com` still points to the old address.

## Prerequisites

- A domain name with DNS managed by a supported provider
- A self-hosted server ([Getting Started](/foundations/getting-started/))
- Port forwarding or Cloudflare Tunnel configured ([Port Forwarding Guide](/foundations/port-forwarding/))

## Do You Need Dynamic DNS?

**You need DDNS if:**
- Your ISP assigns a dynamic IP (most residential ISPs)
- You use port forwarding to expose services

**You don't need DDNS if:**
- You use Cloudflare Tunnel (it works regardless of your IP)
- You use Tailscale (it uses its own addressing)
- Your ISP provides a static IP (some do for an extra $5–15/month)
- You host on a VPS (VPS providers assign static IPs)

Check if your IP is static:

```bash
# Note your current public IP
curl -s ifconfig.me
# Check again in a week — if it changed, you need DDNS
```

## Option 1: Cloudflare DDNS (Recommended)

If your domain's DNS is on Cloudflare (free tier), this is the best approach. A script updates the A record via Cloudflare's API whenever your IP changes.

### Using a Simple Script

```bash
#!/bin/bash
# /opt/scripts/cloudflare-ddns.sh

# Configuration
CF_API_TOKEN="your-cloudflare-api-token"
CF_ZONE_ID="your-zone-id"
DOMAIN="home.yourdomain.com"
LOG="/var/log/cloudflare-ddns.log"

# Get current public IP
CURRENT_IP=$(curl -s https://api.ipify.org)

# Get current DNS record IP
RECORD=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records?type=A&name=$DOMAIN" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json")

RECORD_IP=$(echo "$RECORD" | grep -o '"content":"[^"]*"' | head -1 | cut -d'"' -f4)
RECORD_ID=$(echo "$RECORD" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$CURRENT_IP" = "$RECORD_IP" ]; then
    exit 0  # IP hasn't changed
fi

# Update the record
curl -s -X PUT \
    "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records/$RECORD_ID" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"type\":\"A\",\"name\":\"$DOMAIN\",\"content\":\"$CURRENT_IP\",\"ttl\":300,\"proxied\":false}"

echo "$(date): Updated $DOMAIN from $RECORD_IP to $CURRENT_IP" >> "$LOG"
```

```bash
chmod 700 /opt/scripts/cloudflare-ddns.sh

# Run every 5 minutes via cron
# sudo crontab -e
*/5 * * * * /opt/scripts/cloudflare-ddns.sh
```

### Using cloudflare-ddns Docker Container

A simpler approach — run a container that handles everything:

```yaml
# docker-compose.yml
services:
  cloudflare-ddns:
    image: favonia/cloudflare-ddns:1.14.1
    environment:
      - CF_API_TOKEN=your-cloudflare-api-token
      - DOMAINS=home.yourdomain.com
      - PROXIED=false
      - IP4_PROVIDER=cloudflare.trace
    restart: unless-stopped
    network_mode: host
```

```bash
docker compose up -d
```

This container checks your IP periodically and updates Cloudflare automatically. No cron job needed.

**Getting your Cloudflare API token:**
1. Go to Cloudflare dashboard → My Profile → API Tokens
2. Create Token → Edit zone DNS (template)
3. Select your zone → Create Token
4. Copy the token

**Getting your Zone ID:**
1. Go to your domain's Overview page in Cloudflare
2. Zone ID is in the right sidebar under "API"

## Option 2: DuckDNS (Free, No Domain Required)

DuckDNS provides free subdomains with DDNS built in. Good for getting started without buying a domain.

```bash
# One-line updater
echo url="https://www.duckdns.org/update?domains=your-subdomain&token=your-token&ip=" | curl -k -o /dev/null -K -
```

```bash
# Add to cron (every 5 minutes)
*/5 * * * * echo url="https://www.duckdns.org/update?domains=your-subdomain&token=your-token&ip=" | curl -k -o /dev/null -K - >> /var/log/duckdns.log 2>&1
```

Or with Docker:

```yaml
services:
  duckdns:
    image: lscr.io/linuxserver/duckdns:version-34e22733
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=America/New_York
      - SUBDOMAINS=your-subdomain
      - TOKEN=your-duckdns-token
    restart: unless-stopped
```

**Your services would be at:** `your-subdomain.duckdns.org`

**Limitations:** No custom domain (it's always `.duckdns.org`), and some Let's Encrypt rate limits apply to DuckDNS subdomains.

## Option 3: ddclient (Multi-Provider)

`ddclient` is a traditional DDNS client that supports many providers:

```bash
sudo apt install ddclient
```

```ini
# /etc/ddclient.conf
daemon=300                  # Check every 5 minutes
syslog=yes
pid=/var/run/ddclient.pid
ssl=yes

# Cloudflare example
use=web, web=https://api.ipify.org
protocol=cloudflare
zone=yourdomain.com
login=token
password=your-cloudflare-api-token
home.yourdomain.com
```

```bash
sudo systemctl enable --now ddclient
```

ddclient supports Cloudflare, DynDNS, No-IP, Namecheap, Google Domains, and many others.

## Option 4: Router Built-In DDNS

Many routers have DDNS clients built in. Check your router's settings for DDNS support. Common supported providers:

- No-IP
- DynDNS
- DuckDNS
- ASUS DDNS (ASUS routers only)

**Advantage:** No software to run on your server.
**Disadvantage:** Limited provider choices, and if the router reboots, there may be a delay.

## Choosing a TTL

TTL (Time to Live) controls how long DNS resolvers cache your record. Lower TTL = faster propagation when your IP changes, but more DNS queries.

| TTL | Propagation Time | Best For |
|-----|-----------------|----------|
| 60 seconds | ~1 minute | Frequently changing IPs |
| 300 seconds (5 min) | ~5 minutes | **Recommended for DDNS** |
| 3600 seconds (1 hour) | ~1 hour | Static or rarely changing IPs |
| 86400 seconds (1 day) | ~1 day | Static IPs only |

Set your A record TTL to 300 seconds (5 minutes) when using DDNS.

## Testing Your DDNS Setup

```bash
# Check current DNS resolution
dig +short home.yourdomain.com

# Check your current public IP
curl -s ifconfig.me

# They should match
# If they don't, your DDNS hasn't updated yet — check logs

# Force a manual update (for the script approach)
/opt/scripts/cloudflare-ddns.sh

# Check logs
cat /var/log/cloudflare-ddns.log
```

## Common Mistakes

### 1. Setting TTL Too High

If your TTL is 24 hours and your IP changes, your domain is unreachable for up to 24 hours. Use 300 seconds for DDNS records.

### 2. Not Monitoring DDNS Updates

Your DDNS script might silently fail (expired API token, network issue). Add monitoring:

```bash
# Check if DDNS is working — add to a separate cron job
RESOLVED_IP=$(dig +short home.yourdomain.com)
ACTUAL_IP=$(curl -s ifconfig.me)
if [ "$RESOLVED_IP" != "$ACTUAL_IP" ]; then
    echo "$(date): DDNS mismatch! DNS=$RESOLVED_IP Actual=$ACTUAL_IP" >> /var/log/ddns-alert.log
fi
```

### 3. Using DDNS When Cloudflare Tunnel Would Work Better

If your services are web-based (HTTP/HTTPS), Cloudflare Tunnel is superior to DDNS + port forwarding. No ports to open, no IP changes to track, built-in DDoS protection.

### 4. Forgetting to Update DDNS After Router Reboot

Some routers get a new IP after reboot. Ensure your DDNS update runs frequently enough to catch this (every 5 minutes is standard).

### 5. Using an Unreliable IP Detection Service

If the IP detection API goes down, your DDNS stops updating. Use multiple fallbacks:

```bash
CURRENT_IP=$(curl -s https://api.ipify.org || curl -s https://ifconfig.me || curl -s https://icanhazip.com)
```

## FAQ

### How often should I check for IP changes?

Every 5 minutes is the standard. More frequent is unnecessary (your IP rarely changes more than once a day). Less frequent means longer downtime when it does change.

### Can I use DDNS with Cloudflare Proxy (orange cloud)?

Yes, but when Cloudflare Proxy is enabled, visitors connect to Cloudflare's IP, not yours. DDNS still updates the origin IP that Cloudflare forwards to. This actually hides your home IP — a security benefit.

### What if my ISP uses CGNAT?

DDNS can't help with CGNAT because your router doesn't have a public IP. Use Cloudflare Tunnel or Tailscale instead — they work regardless of CGNAT.

### Will DDNS cause downtime when my IP changes?

Brief downtime (up to your TTL value) is possible while DNS propagates. With a 300-second TTL and 5-minute update interval, maximum downtime is roughly 10 minutes.

### Can I use DDNS for multiple subdomains?

Yes. Either update multiple A records in your DDNS script, or create one A record and point other subdomains to it with CNAME records: `cloud.yourdomain.com CNAME home.yourdomain.com`.

## Next Steps

- [Port Forwarding Guide](/foundations/port-forwarding/) — expose services to the internet
- [DNS Explained](/foundations/dns-explained/) — understand DNS records and resolution
- [SSL Certificates](/foundations/ssl-certificates/) — set up HTTPS for your services

## Related

- [DNS Explained for Self-Hosting](/foundations/dns-explained/)
- [Port Forwarding Guide](/foundations/port-forwarding/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [SSL Certificates for Self-Hosting](/foundations/ssl-certificates/)
- [Static IP and DHCP](/foundations/dhcp-static-ip/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
