---
title: "DNS Explained for Self-Hosting"
description: "Understand how DNS works and how to configure it for your self-hosted services — A records, CNAME, split DNS, and local resolution."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: ["pi-hole", "adguard-home", "technitium"]
tags: ["foundations", "dns", "networking", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is DNS?

DNS (Domain Name System) translates human-readable domain names like `immich.example.com` into IP addresses like `192.168.1.50`. Every time you access a self-hosted service by name instead of IP, DNS makes it work.

For self-hosting, DNS matters in three situations: pointing a public domain at your server, resolving local hostnames on your network, and running your own DNS server for ad blocking or privacy. Understanding DNS basics saves hours of debugging when services are unreachable.

## Prerequisites

- A Linux server running on your network ([Getting Started](/foundations/getting-started))
- Basic terminal familiarity ([Linux Basics](/foundations/linux-basics-self-hosting))
- A domain name (optional but recommended for remote access)

## How DNS Resolution Works

When you type `photos.example.com` in a browser, this happens:

1. **Browser cache** — checks if it already knows the IP
2. **OS resolver** — checks `/etc/hosts` and the system DNS cache
3. **Configured DNS server** — your router or ISP's DNS server
4. **Recursive resolution** — the DNS server queries root servers → `.com` TLD servers → `example.com`'s authoritative nameserver
5. **Response** — the IP address comes back, gets cached at every level, and the browser connects

The entire process takes milliseconds for cached entries and under 200ms for uncached lookups.

### DNS Record Types That Matter

| Record Type | Purpose | Example |
|-------------|---------|---------|
| **A** | Maps a domain to an IPv4 address | `server.example.com → 203.0.113.50` |
| **AAAA** | Maps a domain to an IPv6 address | `server.example.com → 2001:db8::1` |
| **CNAME** | Alias — points one domain to another | `photos.example.com → server.example.com` |
| **TXT** | Text data, often for verification | `_acme-challenge.example.com → "validation-token"` |
| **MX** | Mail server for the domain | `example.com → mail.example.com` |
| **NS** | Nameservers for the domain | `example.com → ns1.cloudflare.com` |

For self-hosting, you will use **A records** (pointing your domain to your server's IP) and **CNAME records** (creating subdomains that point to your main server record) most often.

## Configuring DNS for Self-Hosted Services

### Option 1: Public Domain with Cloudflare (Recommended)

The simplest approach: buy a domain, use Cloudflare for DNS, and create records pointing to your server.

```bash
# Check your server's public IP
curl -4 ifconfig.me
```

In Cloudflare's DNS dashboard, create:

| Type | Name | Content | Proxy Status |
|------|------|---------|-------------|
| A | `@` | `203.0.113.50` (your public IP) | Proxied or DNS only |
| CNAME | `photos` | `@` | Proxied or DNS only |
| CNAME | `files` | `@` | Proxied or DNS only |
| CNAME | `music` | `@` | Proxied or DNS only |

Now `photos.example.com`, `files.example.com`, and `music.example.com` all resolve to your server. Your [reverse proxy](/foundations/reverse-proxy-explained) routes each subdomain to the correct container.

**Proxied vs DNS Only:** Cloudflare's proxy hides your real IP and adds DDoS protection. Use "Proxied" for web services. Use "DNS Only" for non-HTTP services (SSH, WireGuard, game servers) because the proxy only handles HTTP/HTTPS traffic.

### Option 2: Split DNS (Local + Public)

When you access `photos.example.com` from inside your home network, the DNS resolves to your public IP, then your router has to route traffic back inside — called "hairpin NAT." Some routers handle this poorly or not at all.

Split DNS solves this: devices on your LAN resolve your domains to the local IP directly.

**Using Pi-hole or AdGuard Home:**

Add local DNS records in the Pi-hole admin panel under **Local DNS → DNS Records**:

| Domain | IP |
|--------|----|
| `photos.example.com` | `192.168.1.50` |
| `files.example.com` | `192.168.1.50` |
| `music.example.com` | `192.168.1.50` |

Or in AdGuard Home under **Filters → DNS rewrites**:

| Domain | Answer |
|--------|--------|
| `*.example.com` | `192.168.1.50` |

AdGuard Home supports wildcard DNS rewrites, which is cleaner — one rule covers all subdomains.

**Using /etc/hosts on the server itself:**

```bash
# Add to /etc/hosts
echo "192.168.1.50 photos.example.com files.example.com music.example.com" | sudo tee -a /etc/hosts
```

This only affects the machine where you edit the file. Not a network-wide solution, but useful for testing.

### Option 3: Local-Only DNS (No Public Domain)

If your services are only accessible on your LAN, you can skip buying a domain entirely. Use a local DNS server to resolve custom hostnames.

With Pi-hole or Technitium DNS, create local records mapping names like `photos.home`, `files.home`, or `nas.home` to your server's IP. Then configure your DHCP server to hand out your DNS server's IP to all clients.

**Caveat:** HTTPS certificates from Let's Encrypt require a real domain. Local-only setups need self-signed certificates, which trigger browser warnings. For most people, a cheap domain ($8-12/year) is worth the convenience.

## DNS Tools for Debugging

### dig

The best DNS debugging tool. Available in the `dnsutils` package on Debian/Ubuntu.

```bash
sudo apt install dnsutils

# Query A record for a domain
dig photos.example.com

# Query a specific DNS server
dig @8.8.8.8 photos.example.com

# Get just the answer, no extra info
dig +short photos.example.com

# Query a specific record type
dig photos.example.com CNAME
dig example.com MX
dig example.com TXT
```

### nslookup

Simpler than `dig`, available everywhere:

```bash
nslookup photos.example.com
nslookup photos.example.com 8.8.8.8  # Query specific DNS server
```

### Testing DNS propagation

After changing DNS records, check if the change has propagated:

```bash
# Check multiple public DNS servers
dig +short photos.example.com @8.8.8.8       # Google
dig +short photos.example.com @1.1.1.1       # Cloudflare
dig +short photos.example.com @9.9.9.9       # Quad9
```

DNS changes propagate globally within minutes to hours, depending on the TTL (Time to Live) of the old record. Cloudflare DNS updates take effect within 5 minutes for most resolvers.

## Running Your Own DNS Server

Self-hosting a DNS server gives you ad blocking, privacy (no DNS queries going to Google/Cloudflare), and full control over local name resolution.

**Best options:**

| DNS Server | Best For | Resource Usage |
|------------|----------|---------------|
| [Pi-hole](/apps/pi-hole) | Ad blocking + local DNS, great web UI | ~100 MB RAM |
| [AdGuard Home](/apps/adguard-home) | Ad blocking + DNS rewrites with wildcard support | ~80 MB RAM |
| [Technitium](/apps/technitium) | Full-featured DNS server with advanced features | ~150 MB RAM |
| [Blocky](/apps/blocky) | Lightweight, config-file-based DNS proxy | ~30 MB RAM |

**The recommendation:** Pi-hole if you want the most mature ecosystem and community support. AdGuard Home if you want wildcard DNS rewrite support out of the box. Both run in Docker and are easy to configure.

Set your router's DHCP settings to hand out your DNS server's IP address so all devices on your network use it automatically.

## Common Mistakes

### Not waiting for DNS propagation
After changing DNS records, the old records may be cached by your ISP's DNS resolver for up to 24 hours (depending on TTL). Lower your TTL to 300 seconds (5 minutes) before making changes, wait for the old TTL to expire, then make the change.

### Forgetting split DNS
Your phone works on mobile data but not on Wi-Fi? Your router probably does not support hairpin NAT. Set up split DNS with Pi-hole or AdGuard Home to resolve your domains to the local IP when on your LAN.

### Using `.local` as a domain suffix
The `.local` suffix is reserved for mDNS (Bonjour/Avahi). Using it for custom DNS records causes conflicts. Use `.home`, `.lan`, or a real domain you own instead.

### Not setting a fallback DNS server
If your self-hosted DNS server goes down, your entire network loses DNS resolution. Configure a secondary DNS server (like `1.1.1.1`) on your router as a fallback. Some DNS servers like Pi-hole can also be deployed as a pair for redundancy.

### Hardcoding IPs in Docker Compose
Use hostnames in Docker Compose configs instead of IP addresses when possible. Docker's internal DNS resolves container names automatically within the same network. See [Docker Networking](/foundations/docker-networking).

## Next Steps

- Set up a [reverse proxy](/foundations/reverse-proxy-explained) to route subdomains to containers
- Install [Pi-hole](/apps/pi-hole) or [AdGuard Home](/apps/adguard-home) for network-wide DNS
- Secure your connections with [SSL certificates](/foundations/ssl-certificates)
- Learn about [port forwarding](/foundations/ports-explained) if exposing services to the internet
- Set up [SSH](/foundations/ssh-setup) for remote server management

## FAQ

### Do I need a domain name to self-host?
No, but it makes everything easier. A domain lets you use proper SSL certificates, access services by name (not IP), and set up remote access cleanly. Domains cost $8-12/year from registrars like Cloudflare, Namecheap, or Porkbun.

### Should I use Cloudflare's proxy for self-hosted services?
For web services (anything accessed via a browser), Cloudflare's proxy hides your home IP and adds basic DDoS protection at no cost. Turn it off for non-HTTP services like WireGuard or SSH.

### How do I access my services by name on my local network?
Set up split DNS. Run Pi-hole or AdGuard Home on your server and configure it to resolve your domain names to your server's local IP (e.g., `192.168.1.50`). Set your router's DHCP to hand out the DNS server's IP.

### What TTL should I set for my DNS records?
For stable records, 3600 (1 hour) is fine. Before making changes, lower it to 300 (5 minutes) and wait for the old TTL to expire first. Cloudflare's "Auto" TTL works well for most setups.

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Docker Networking](/foundations/docker-networking)
- [SSH Setup Guide](/foundations/ssh-setup)
- [SSL Certificates Guide](/foundations/ssl-certificates)
- [Port Forwarding Explained](/foundations/ports-explained)
