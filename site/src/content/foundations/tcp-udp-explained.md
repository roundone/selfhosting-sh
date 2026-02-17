---
title: "TCP vs UDP for Self-Hosting"
description: "Understand TCP and UDP protocols, when each is used in self-hosted services, and how to configure ports and firewalls correctly."
date: "2026-02-17"
dateUpdated: "2026-02-17"
category: "foundations"
apps: []
tags: ["networking", "tcp", "udp", "protocols", "ports"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are TCP and UDP?

TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are the two transport protocols that carry virtually all internet traffic. Every self-hosted service uses one or both. Understanding the difference matters when configuring Docker port mappings, firewall rules, and reverse proxies.

**TCP** guarantees delivery. Data arrives in order, complete, and without errors. If a packet is lost, TCP retransmits it. This reliability comes at the cost of some latency.

**UDP** is fire-and-forget. Packets are sent without confirmation. Some may arrive out of order, duplicated, or not at all. This makes UDP faster and lower-latency than TCP, but less reliable.

## Prerequisites

- Basic understanding of [ports](/foundations/ports-explained)
- Familiarity with [Docker Compose](/foundations/docker-compose-basics)

## TCP vs UDP Comparison

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection | Connection-oriented (handshake first) | Connectionless (send immediately) |
| Delivery guarantee | Yes — retransmits lost packets | No — packets can be lost |
| Order guarantee | Yes — data arrives in order | No — packets may arrive out of order |
| Speed | Slower (overhead from reliability) | Faster (no overhead) |
| Latency | Higher (handshake + acknowledgments) | Lower (send and forget) |
| Overhead | Higher (headers, state tracking) | Lower (minimal headers) |
| Use case | Web, email, file transfer, databases | DNS, VPN, streaming, gaming |

## Which Self-Hosted Services Use What?

### TCP Services

Most self-hosted applications use TCP exclusively:

| Service | Port | Protocol | Why TCP |
|---------|------|----------|---------|
| Web servers (HTTP/HTTPS) | 80, 443 | TCP | Web pages must arrive complete and in order |
| Nextcloud | 443 | TCP | File sync requires reliable delivery |
| Jellyfin (web UI) | 8096 | TCP | HTTP-based interface |
| Vaultwarden | 80/443 | TCP | Password data must be perfect |
| PostgreSQL | 5432 | TCP | Database queries need guaranteed delivery |
| MariaDB | 3306 | TCP | Same as PostgreSQL |
| Redis | 6379 | TCP | Cache commands must complete reliably |
| SSH | 22 | TCP | Terminal sessions need ordered, reliable data |
| SMTP email | 25, 465, 587 | TCP | Email must arrive intact |
| Git | 22, 443 | TCP | Code transfers must be exact |

### UDP Services

A smaller set of services rely on UDP:

| Service | Port | Protocol | Why UDP |
|---------|------|----------|---------|
| Pi-hole / AdGuard Home (DNS) | 53 | UDP (and TCP) | DNS queries are small, latency-sensitive |
| WireGuard | 51820 | UDP | VPN tunnel — speed over reliability |
| Tailscale / Headscale | 41641 | UDP | Same VPN reasoning as WireGuard |
| Jellyfin (DLNA discovery) | 1900 | UDP | Device discovery broadcasts |
| Plex (GDM discovery) | 32410-32414 | UDP | Network device discovery |
| NTP (time sync) | 123 | UDP | Time packets are small and time-sensitive |
| mDNS | 5353 | UDP | Local network service discovery |
| TURN/STUN (video calling) | 3478 | UDP | Real-time media prefers lower latency |

### Services Using Both

| Service | TCP Port | UDP Port | Why Both |
|---------|----------|----------|---------|
| DNS (Pi-hole, AdGuard) | 53 | 53 | Small queries use UDP; large responses fall back to TCP |
| Jitsi Meet | 443 (web) | 10000 (media) | Web interface via TCP, video/audio via UDP |
| BigBlueButton | 443 (web) | 16384-32768 (media) | Same pattern as Jitsi |

## Docker Port Mappings

By default, Docker maps TCP ports. To map UDP, you must specify it explicitly:

```yaml
services:
  pihole:
    image: pihole/pihole:2024.02.2
    ports:
      - "53:53/tcp"      # DNS over TCP
      - "53:53/udp"      # DNS over UDP
      - "80:80/tcp"      # Web admin interface
    restart: unless-stopped

  wireguard:
    image: lscr.io/linuxserver/wireguard:1.0.20210914
    ports:
      - "51820:51820/udp" # WireGuard tunnel (UDP only)
    restart: unless-stopped
```

**Common shorthand:** `"53:53"` without a protocol suffix maps TCP only. Always specify `/udp` when you need UDP.

```yaml
ports:
  - "8080:8080"          # TCP only (default)
  - "8080:8080/tcp"      # TCP only (explicit)
  - "51820:51820/udp"    # UDP only
  - "53:53/tcp"          # TCP for DNS
  - "53:53/udp"          # UDP for DNS (separate line)
```

## Firewall Rules

Firewalls also distinguish between TCP and UDP. You must open the correct protocol:

### UFW

```bash
# Open TCP port
sudo ufw allow 443/tcp

# Open UDP port
sudo ufw allow 51820/udp

# Open both TCP and UDP on the same port
sudo ufw allow 53

# Open a port range (UDP)
sudo ufw allow 10000:10100/udp
```

### iptables

```bash
# Allow TCP
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow UDP
sudo iptables -A INPUT -p udp --dport 51820 -j ACCEPT
```

See [Firewall Setup](/foundations/firewall-ufw) for complete firewall configuration.

## Reverse Proxies and Protocols

Standard reverse proxies ([Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup), [Traefik](/foundations/traefik-setup), [Caddy](/foundations/caddy-setup)) handle TCP traffic. They proxy HTTP/HTTPS connections to your backend containers.

UDP traffic **cannot** be proxied through standard HTTP reverse proxies. Services that use UDP (WireGuard, DNS) need direct port exposure:

```yaml
services:
  # This goes through the reverse proxy (TCP/HTTP)
  nextcloud:
    image: nextcloud:29.0
    # No port mapping needed — reverse proxy routes to it
    restart: unless-stopped

  # This needs direct port exposure (UDP)
  wireguard:
    image: lscr.io/linuxserver/wireguard:1.0.20210914
    ports:
      - "51820:51820/udp"  # Direct exposure, no reverse proxy
    restart: unless-stopped
```

Nginx can proxy UDP with the `stream` module, but this is rarely needed for self-hosting.

## Troubleshooting Protocol Issues

### Service Not Reachable

If a service uses UDP but you only opened TCP (or vice versa), it won't work:

```bash
# Test TCP connectivity
nc -zv server-ip 53

# Test UDP connectivity
nc -zuv server-ip 53

# Check what's listening
sudo ss -tulnp | grep :53
# t = TCP, u = UDP
```

### DNS Not Working Through Docker

Pi-hole or AdGuard not resolving DNS? Verify both TCP and UDP port 53 are mapped:

```yaml
ports:
  - "53:53/tcp"
  - "53:53/udp"  # This line is often forgotten
```

### WireGuard Can't Connect

WireGuard is UDP-only. Check:
1. Docker port mapping includes `/udp`
2. Firewall allows UDP on the WireGuard port
3. Router port forwards UDP (not just TCP)

## Common Mistakes

### Forgetting /udp in Docker Port Mappings

The default protocol in Docker is TCP. Writing `"53:53"` only maps TCP. DNS queries from clients use UDP by default and will fail. Always explicitly map UDP ports.

### Blocking UDP in Firewall

Many firewall guides focus on TCP. If you set up `ufw default deny` and only allow TCP ports, UDP services (DNS, VPN) won't work. Check your rules with `sudo ufw status verbose`.

### Port Forwarding Only TCP on Router

Home routers often separate TCP and UDP port forwarding. If you forward TCP port 51820 but not UDP port 51820, WireGuard won't accept connections from outside your network.

### Using a Reverse Proxy for UDP Services

HTTP reverse proxies don't handle UDP. WireGuard, DNS, and media streaming (Jitsi's UDP port) need direct port exposure, not reverse proxy routing.

## Next Steps

- Learn about ports in detail at [Ports Explained](/foundations/ports-explained)
- Set up your firewall with [UFW Firewall Setup](/foundations/firewall-ufw)
- Configure a reverse proxy with [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- Set up a VPN with [WireGuard Setup](/foundations/wireguard-setup)

## FAQ

### Can I force a UDP service to use TCP instead?

Generally no. The application determines which protocol it uses. WireGuard is UDP-only. DNS can use either (TCP fallback for large responses), but clients default to UDP. Some VPN protocols (OpenVPN) support both and can be configured for TCP, usually at the cost of performance.

### Is UDP less secure than TCP?

No. Security is handled by the application layer (TLS, encryption), not the transport protocol. WireGuard uses UDP and is one of the most secure VPN protocols. Both TCP and UDP traffic should be encrypted at the application level.

### Why does DNS use UDP instead of TCP?

DNS queries are small (typically under 512 bytes) and latency-sensitive. UDP's lack of connection setup overhead makes DNS queries faster. If a response is too large for a single UDP packet, DNS falls back to TCP automatically.

### Do I need to open both TCP and UDP for every service?

No. Most services only use one protocol. Check the service's documentation for which ports and protocols it needs. Opening unnecessary ports increases your attack surface.

## Related

- [Ports Explained](/foundations/ports-explained)
- [Firewall Setup (UFW)](/foundations/firewall-ufw)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [WireGuard Setup](/foundations/wireguard-setup)
- [DNS Explained](/foundations/dns-explained)
