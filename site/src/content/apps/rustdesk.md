---
title: "How to Self-Host RustDesk with Docker Compose"
description: "Set up RustDesk Server for self-hosted remote desktop access with Docker Compose, replacing TeamViewer and AnyDesk."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - rustdesk
tags:
  - self-hosted
  - rustdesk
  - remote-desktop
  - docker
  - teamviewer-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is RustDesk?

RustDesk is an open-source remote desktop application that works like TeamViewer or AnyDesk, but you control the infrastructure. The server component handles connection brokering and relay traffic, while clients connect through it for remote desktop sessions. Self-hosting eliminates dependency on third-party relay servers and keeps all connection data under your control.

[Official site: rustdesk.com](https://rustdesk.com)

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 1 GB of free disk space
- 512 MB of RAM (minimum)
- A public IP address or domain name (clients need to reach the server)
- Ports 21115-21119 open on your firewall

## Docker Compose Configuration

RustDesk Server has two components:
- **hbbs** — the ID/rendezvous server (handles connection brokering, NAT traversal)
- **hbbr** — the relay server (relays traffic when direct P2P connections fail)

Create a `docker-compose.yml` file:

```yaml
services:
  hbbs:
    container_name: rustdesk-hbbs
    image: rustdesk/rustdesk-server:1.1.15
    command: hbbs -r your-server-ip:21117
    volumes:
      - ./data:/root
    ports:
      - "21115:21115"
      - "21116:21116"
      - "21116:21116/udp"
      - "21118:21118"
    depends_on:
      - hbbr
    restart: unless-stopped

  hbbr:
    container_name: rustdesk-hbbr
    image: rustdesk/rustdesk-server:1.1.15
    command: hbbr
    volumes:
      - ./data:/root
    ports:
      - "21117:21117"
      - "21119:21119"
    restart: unless-stopped
```

Replace `your-server-ip` in the hbbs command with your server's public IP address or domain name.

**Port reference:**

| Port | Protocol | Purpose |
|------|----------|---------|
| 21115 | TCP | NAT type testing |
| 21116 | TCP + UDP | ID registration, heartbeat, hole punching |
| 21117 | TCP | Relay traffic |
| 21118 | TCP | Web client support (hbbs) |
| 21119 | TCP | Web client support (hbbr) |

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

On first startup, RustDesk Server generates a keypair in the `data/` directory:

```bash
ls data/
# id_ed25519  id_ed25519.pub
```

The public key (`id_ed25519.pub`) is your server's identity. Clients must be configured with this key to connect securely.

Get your public key:

```bash
cat data/id_ed25519.pub
```

### Configuring Clients

1. Install the RustDesk client on each device ([rustdesk.com/download](https://rustdesk.com))
2. Open Settings → Network
3. Set **ID Server** to your server's IP or domain
4. Set **Relay Server** to the same address
5. Paste your public key into the **Key** field
6. Save and restart the client

The client's ID should now register against your server instead of the public RustDesk infrastructure.

## Configuration

### Using a Domain Name

If you have a domain, point it to your server's IP and use it in the hbbs command:

```yaml
command: hbbs -r remote.example.com:21117
```

Clients then use `remote.example.com` as both the ID and Relay server.

### Forcing Relay Mode

To force all traffic through your relay (no direct P2P), set the environment variable:

```yaml
  hbbs:
    environment:
      - ALWAYS_USE_RELAY=Y
```

This increases bandwidth usage on your server but ensures all traffic is encrypted through your infrastructure.

### Network Mode Alternative

For simpler networking (avoids port mapping issues), use host networking:

```yaml
services:
  hbbs:
    container_name: rustdesk-hbbs
    image: rustdesk/rustdesk-server:1.1.15
    command: hbbs -r your-server-ip:21117
    volumes:
      - ./data:/root
    network_mode: host
    depends_on:
      - hbbr
    restart: unless-stopped

  hbbr:
    container_name: rustdesk-hbbr
    image: rustdesk/rustdesk-server:1.1.15
    command: hbbr
    volumes:
      - ./data:/root
    network_mode: host
    restart: unless-stopped
```

## Reverse Proxy

RustDesk uses raw TCP/UDP connections, not HTTP. A standard HTTP reverse proxy won't work for the main service. However, ports 21118/21119 (web client) can be reverse-proxied.

For the main service, expose ports 21115-21117 directly. If you need to change default ports, use the `-p` flag:

```yaml
command: hbbs -r your-server-ip:21117 -p 21116
```

For web client access through [Nginx Proxy Manager](/apps/nginx-proxy-manager) or [Caddy](/apps/caddy), proxy to port 21118.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained) for general guidance.

## Backup

Back up the `data/` directory. The critical file is the keypair:
- `id_ed25519` — private key (if lost, all clients must be reconfigured)
- `id_ed25519.pub` — public key
- `db_v2.sqlite3` — connection logs and peer data

```bash
tar czf rustdesk-backup-$(date +%Y%m%d).tar.gz data/
```

See [Backup Strategy](/foundations/backup-3-2-1-rule) for a comprehensive approach.

## Troubleshooting

### Clients Show "Connecting..." But Never Connect

**Symptom:** Client displays the connection spinner indefinitely.
**Fix:** Verify all required ports are open on your firewall. Port 21116 must be open on both TCP and UDP. Check with:

```bash
sudo ufw status
# Ensure 21115:21119/tcp and 21116/udp are ALLOW
```

### Client ID Shows as 0

**Symptom:** The RustDesk client shows ID `000000000`.
**Fix:** The client cannot reach the hbbs server. Verify the ID Server address in client settings matches your server's public IP. Check that port 21116 is reachable.

### "Key Mismatch" Error

**Symptom:** Client refuses to connect, showing a key error.
**Fix:** The public key in the client settings doesn't match the server's key. Re-copy the contents of `data/id_ed25519.pub` and paste it into the client's Key field. Restart the client after updating.

### High Relay Bandwidth Usage

**Symptom:** Server bandwidth usage is higher than expected.
**Fix:** This happens when P2P connections fail and traffic routes through hbbr. Check if clients are behind restrictive NATs. If bandwidth is a concern, don't set `ALWAYS_USE_RELAY=Y`.

### Slow Performance Over Relay

**Symptom:** Remote sessions are laggy when relayed.
**Fix:** Ensure the server has sufficient bandwidth. RustDesk v1.1.15 increased default bandwidth settings, but relay performance depends on your server's network capacity. Consider placing the server geographically close to your users.

## Resource Requirements

- **RAM:** ~50 MB idle per service (100 MB total), scales with concurrent connections
- **CPU:** Low — connection brokering is lightweight
- **Disk:** Minimal — keypair and SQLite database, under 100 MB
- **Bandwidth:** Variable — relay traffic depends on usage patterns and whether P2P succeeds

## Verdict

RustDesk is the best self-hosted remote desktop solution available. It's lightweight, easy to deploy, and the client apps work across Windows, macOS, Linux, Android, and iOS. If you're currently paying for TeamViewer or AnyDesk licenses, switching to a self-hosted RustDesk server is a straightforward way to eliminate that cost while gaining full control over your connection infrastructure.

The only limitation is that the web console (port 21114) is exclusive to the Pro version. For most personal and small-team use, the open-source server is more than sufficient.

## FAQ

### Do I need the Pro version?

No. The open-source server handles all core functionality: ID registration, NAT traversal, and relay. The Pro version adds a web console, LDAP/OIDC auth, and an address book server. For personal or small-team use, the OSS version works well.

### Can I use RustDesk without self-hosting?

Yes. RustDesk clients work with the public relay servers by default. Self-hosting gives you privacy, control, and potentially better performance if the server is close to your network.

### Does RustDesk support file transfer?

Yes. The client supports file transfer, clipboard sharing, and remote audio. These features work through both P2P and relay connections.

### How many concurrent connections can the server handle?

The server is lightweight and can handle hundreds of concurrent connections on modest hardware. The bottleneck is typically bandwidth for relayed connections, not CPU or memory.

## Related

- [RustDesk vs Guacamole](/compare/rustdesk-vs-guacamole)
- [Self-Hosted Alternatives to TeamViewer](/replace/teamviewer)
- [Self-Hosted Alternatives to ngrok](/replace/ngrok)
- [Best Self-Hosted VPN Solutions](/best/vpn)
- [Tailscale Setup Guide](/apps/tailscale)
- [WireGuard Docker Setup](/apps/wireguard)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Linux Security Basics](/foundations/security-hardening)
