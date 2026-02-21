---
title: "DNS Debugging for Self-Hosters"
description: "Diagnose and fix DNS resolution problems — local DNS, split-horizon, Docker DNS, Pi-hole issues, and domain propagation troubleshooting."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["dns", "troubleshooting", "networking", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## DNS Problems in Self-Hosting

DNS issues are the second most common self-hosting problem after permission errors. Symptoms range from "my domain doesn't resolve" to "containers can't reach the internet" to "my local DNS server broke everything." This guide gives you a systematic approach to diagnosing and fixing DNS problems.

## Prerequisites

- Basic understanding of DNS ([DNS Explained](/foundations/dns-explained/))
- Terminal access to your server ([SSH Setup](/foundations/ssh-setup/))
- `dig` installed (`sudo apt install dnsutils` on Debian/Ubuntu)

## Diagnostic Toolkit

Three commands handle 90% of DNS debugging:

```bash
# dig — the gold standard for DNS queries
dig example.com              # Query A record
dig example.com MX           # Query MX record
dig @1.1.1.1 example.com    # Query a specific DNS server
dig +short example.com       # Just the answer, no extras
dig +trace example.com       # Follow the full resolution chain

# nslookup — simpler, works everywhere
nslookup example.com
nslookup example.com 8.8.8.8

# host — quick lookups
host example.com
host -t CNAME subdomain.example.com
```

Always compare results from your local resolver vs a public DNS server:

```bash
# What YOUR system resolves
dig +short myapp.example.com

# What Cloudflare resolves
dig @1.1.1.1 +short myapp.example.com

# What Google resolves
dig @8.8.8.8 +short myapp.example.com
```

If public DNS returns the right answer but your local resolver doesn't, the problem is local. If neither works, the DNS record isn't published correctly.

## Domain Not Resolving

### Just Created the Record

DNS propagation takes time. TTL (Time To Live) determines how long resolvers cache records.

```bash
# Check the TTL on your record
dig +noall +answer example.com

# Check if the authoritative nameserver has the record
dig @ns1.example.com example.com

# Check propagation from multiple locations
# Use: https://www.whatsmydns.net/
```

If the authoritative nameserver has the correct record but public resolvers don't, wait for TTL expiration. Default TTLs:
- Cloudflare: 300 seconds (5 minutes) with proxied records
- Most registrars: 3600 seconds (1 hour) to 86400 (24 hours)

### Record Exists But Wrong IP

```bash
# Check what's actually set
dig +short myapp.example.com

# If it returns an old IP, flush your local DNS cache
# macOS
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

# Linux (systemd-resolved)
sudo resolvectl flush-caches

# Windows
ipconfig /flushdns
```

### Subdomain Not Resolving

```bash
# Check if a wildcard record exists
dig +short *.example.com

# Check the specific subdomain
dig +short sub.example.com

# Check CNAME chain
dig +short -t CNAME sub.example.com
```

Common cause: you created an A record for `example.com` but not for `sub.example.com`. Each subdomain needs its own record (A, AAAA, or CNAME) unless you have a wildcard `*` record.

## Docker DNS Issues

### Containers Can't Resolve External Domains

```bash
# Test DNS from inside the container
docker exec mycontainer nslookup google.com
# or
docker exec mycontainer dig +short google.com
```

If external DNS fails:

```bash
# Check what DNS server the container is using
docker exec mycontainer cat /etc/resolv.conf
```

Docker inherits DNS settings from the host's `/etc/resolv.conf`. If the host uses `127.0.0.53` (systemd-resolved), Docker may not resolve correctly.

Fix at the container level:

```yaml
services:
  myapp:
    dns:
      - 1.1.1.1
      - 8.8.8.8
```

Fix at the daemon level (affects all containers):

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
EOF
sudo systemctl restart docker
```

### Container-to-Container DNS Fails

Containers in the same Docker Compose file resolve each other by service name:

```yaml
services:
  app:
    environment:
      DB_HOST: db    # Resolves to the db container's IP
  db:
    image: postgres:16.2
```

If it doesn't work:

```bash
# Verify both containers are on the same network
docker network inspect $(docker compose ps -q app | head -1) --format '{{json .NetworkSettings.Networks}}' | jq

# Test resolution
docker exec app nslookup db
# or
docker exec app getent hosts db
```

Common causes:
- Using `localhost` instead of the service name
- Containers on different custom networks
- Container not fully started yet (use `depends_on` with health checks)
- Container name vs service name confusion — use the **service name** from `docker-compose.yml`

See [Docker Networking](/foundations/docker-networking/) for details.

### Docker Overrides Pi-hole/AdGuard DNS

If you run Pi-hole or AdGuard Home as your network DNS, Docker containers may bypass it because Docker sets its own DNS in `/etc/resolv.conf` inside containers.

```yaml
# Force containers to use your local DNS server
services:
  myapp:
    dns:
      - 192.168.1.2  # Your Pi-hole/AdGuard IP
```

Or set it globally:

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "dns": ["192.168.1.2"]
}
EOF
sudo systemctl restart docker
```

## Local DNS Server Problems

### Pi-hole or AdGuard Home Not Resolving

```bash
# Check if Pi-hole is running
docker compose -f /path/to/pihole/docker-compose.yml ps

# Test Pi-hole directly
dig @127.0.0.1 -p 53 google.com

# Check upstream DNS servers are reachable
dig @1.1.1.1 google.com
dig @8.8.8.8 google.com
```

If Pi-hole works via direct query but clients can't resolve:
- Verify DHCP is advertising Pi-hole as the DNS server
- Check if your router overrides DNS settings
- Verify the Pi-hole container port is mapped: `53:53/tcp` and `53:53/udp`

### Split-Horizon DNS (Hairpin NAT Problem)

You access `myapp.example.com` from outside your network and it works. From inside your network, it doesn't — you get a timeout or your router's admin page.

This is the hairpin NAT problem. Your router can't route traffic that goes out and comes back in.

**Solution 1: Local DNS override (recommended)**

If you run Pi-hole or AdGuard Home, add a local DNS record:

```
myapp.example.com → 192.168.1.100  (your server's local IP)
```

**Solution 2: Host file override**

On the client device, add to `/etc/hosts`:

```
192.168.1.100  myapp.example.com
```

**Solution 3: Use Tailscale/WireGuard**

Access services via their Tailscale IP or WireGuard IP, bypassing DNS and NAT entirely. See [Tailscale Setup](/foundations/tailscale-setup/) or [WireGuard Setup](/foundations/wireguard-setup/).

## SSL and DNS Interaction

### Let's Encrypt DNS Challenge Fails

```bash
# Check if the TXT record is published
dig +short -t TXT _acme-challenge.example.com

# If empty, the DNS record isn't set or hasn't propagated
# Wait for TTL, then check again
```

If using Cloudflare proxy (orange cloud):
- DNS challenges work regardless of proxy status
- HTTP challenges require the proxy to be enabled or disabled depending on your setup

See [SSL Certificates](/foundations/ssl-certificates/) and [Let's Encrypt Explained](/foundations/lets-encrypt-explained/).

### CNAME and SSL Conflicts

You can't set a CNAME on the root domain (`example.com`) with most DNS providers — only on subdomains. Cloudflare supports CNAME flattening, which works around this.

```bash
# Verify your CNAME is set correctly
dig +short -t CNAME myapp.example.com
# Should return the target hostname
```

## Debugging Checklist

When DNS isn't working, work through this in order:

```bash
# 1. Can the host resolve anything?
dig +short google.com
# If NO → host DNS is broken, check /etc/resolv.conf

# 2. Can the host resolve YOUR domain?
dig +short myapp.example.com
# If NO → check DNS records at your registrar/Cloudflare

# 3. Does the authoritative nameserver have the record?
dig +short @$(dig +short -t NS example.com | head -1) myapp.example.com
# If NO → record isn't created or hasn't propagated

# 4. Does a public resolver have it?
dig @1.1.1.1 +short myapp.example.com
# If NO but authoritative has it → wait for TTL

# 5. Can Docker containers resolve it?
docker exec mycontainer dig +short myapp.example.com
# If NO but host can → Docker DNS config issue

# 6. Can containers resolve each other?
docker exec app nslookup db
# If NO → check they're on the same Docker network
```

## FAQ

### How long does DNS propagation really take?

It depends on the TTL of the old record. If the previous TTL was 3600 (1 hour), resolvers may cache the old value for up to 1 hour. New records with no prior cache typically resolve within 5-30 minutes globally. Cloudflare-proxied records propagate in under 5 minutes.

### Why does my domain work on my phone (mobile data) but not on my home WiFi?

Hairpin NAT. Your router can't route traffic to its own public IP from inside the network. Use a local DNS override, hosts file entry, or VPN solution. See the Split-Horizon DNS section above.

### Can I use 127.0.0.1 as a DNS server in Docker?

No. Inside a container, `127.0.0.1` refers to the container itself, not the host. If you run a DNS server on the host, containers must use the host's LAN IP (e.g., `192.168.1.100`) or `host.docker.internal` (Docker Desktop only) or the Docker bridge IP (`172.17.0.1`).

### My DNS changes aren't taking effect. What's caching?

Multiple layers: your browser (2-5 minutes), your OS resolver cache, your local DNS server (Pi-hole caches based on TTL), and upstream resolvers. Flush each layer and test with `dig @1.1.1.1` to bypass all local caching.

## Related

- [DNS Explained](/foundations/dns-explained/)
- [Docker Networking](/foundations/docker-networking/)
- [Encrypted DNS](/foundations/encrypted-dns/)
- [Dynamic DNS](/foundations/dynamic-dns/)
- [Tailscale Setup](/foundations/tailscale-setup/)
- [SSL Certificates](/foundations/ssl-certificates/)
- [DHCP and Static IPs](/foundations/dhcp-static-ip/)
