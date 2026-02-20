---
title: "How to Self-Host PairDrop with Docker Compose"
description: "Deploy PairDrop with Docker Compose — a self-hosted AirDrop alternative for instant peer-to-peer file transfers on any device."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "file-sharing"
apps:
  - pairdrop
tags:
  - self-hosted
  - pairdrop
  - docker
  - file-sharing
  - airdrop-alternative
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is PairDrop?

[PairDrop](https://github.com/schlagmichdoch/PairDrop) is a self-hosted, peer-to-peer file sharing tool that works like Apple's AirDrop — but across every platform. Open the web UI on two devices on the same network, and they discover each other automatically. Select files, click send, done. Files transfer directly between browsers via WebRTC and never touch the server.

PairDrop is a fork of Snapdrop with major improvements: persistent device pairing, room-based sharing, text message support, and a cleaner UI. It replaces [AirDrop](/replace/airdrop) for cross-platform use and works on any device with a modern browser.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM (minimum)
- Negligible disk space (files don't touch the server)

## Docker Compose Configuration

Create a directory for PairDrop:

```bash
mkdir -p ~/pairdrop && cd ~/pairdrop
```

Create a `docker-compose.yml` file:

```yaml
services:
  pairdrop:
    image: ghcr.io/schlagmichdoch/pairdrop:v1.11.2
    container_name: pairdrop
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      # Enable rate limiting in production
      RATE_LIMIT: "true"
      # Enable WebSocket fallback for VPN/restrictive network users
      WS_FALLBACK: "false"
      # Debug mode — logs peer IPs to stdout
      DEBUG_MODE: "false"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
```

That's the entire stack. No database, no volumes, no dependent services. PairDrop is a signaling server — files transfer peer-to-peer and never touch your server.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:3000` in a browser on one device.
2. Open the same URL on another device on the same network.
3. Both devices appear automatically in each other's UI.
4. Click a peer device, select files, and send.

No account creation, no configuration, no setup wizard. It works immediately.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT` | `false` | Enable rate limiting (1000 requests per 5 minutes per IP) |
| `WS_FALLBACK` | `false` | WebSocket fallback when WebRTC is unavailable |
| `DEBUG_MODE` | `false` | Log peer IP addresses to stdout |
| `RTC_CONFIG` | `false` | Path to custom STUN/TURN server configuration |
| `IPV6_LOCALIZE` | `false` | IPv6 subnet matching depth (1-7) for peer grouping |

### Persistent Pairing

PairDrop supports pairing devices across sessions using a shared room code:

1. Click the menu (⋮) on the PairDrop UI
2. Select "Create Room"
3. Share the room link or code with the other device
4. Paired devices find each other even across different networks (requires a TURN server for NAT traversal)

## Advanced Configuration (Optional)

### TURN Server for Cross-Network Transfers

By default, PairDrop only discovers devices on the same local network. For transfers between different networks (e.g., home to office), you need a TURN server to relay WebRTC connections.

Create a `rtc_config.json` file:

```json
[
  {
    "urls": "turn:your-server-ip:3478",
    "username": "pairdrop",
    "credential": "your-turn-password"
  },
  {
    "urls": "stun:stun.l.google.com:19302"
  }
]
```

Add a coturn service to your Compose file:

```yaml
services:
  pairdrop:
    image: ghcr.io/schlagmichdoch/pairdrop:v1.11.2
    container_name: pairdrop
    ports:
      - "127.0.0.1:3000:3000"
    environment:
      RATE_LIMIT: "true"
      RTC_CONFIG: /home/node/app/rtc_config.json
    volumes:
      - ./rtc_config.json:/home/node/app/rtc_config.json:ro
    restart: unless-stopped
    depends_on:
      - coturn

  coturn:
    image: coturn/coturn:4.6
    container_name: pairdrop-turn
    network_mode: host
    volumes:
      - ./turnserver.conf:/etc/coturn/turnserver.conf:ro
    restart: unless-stopped
```

Create `turnserver.conf`:

```
listening-port=3478
tls-listening-port=5349
realm=pairdrop
server-name=pairdrop
user=pairdrop:your-turn-password
lt-cred-mech
fingerprint
no-cli
no-tlsv1
no-tlsv1_1
```

### WebSocket Fallback

Enable `WS_FALLBACK=true` if users connect through VPNs or corporate networks that block WebRTC. This routes file data through the server as a fallback — files will touch the server in this mode, so only enable it if needed.

## Reverse Proxy

Behind [Nginx Proxy Manager](/apps/nginx-proxy-manager) or Caddy ([Reverse Proxy Setup](/foundations/reverse-proxy)):

```
pairdrop.example.com {
    reverse_proxy localhost:3000
}
```

**Critical:** The reverse proxy must forward `X-Forwarded-For` headers correctly. Without proper headers, PairDrop groups all users as the same peer (they all appear to come from the proxy's IP). Nginx Proxy Manager handles this automatically. For custom Nginx configs, add:

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
```

## Backup

PairDrop is stateless — there is nothing to back up. No database, no persistent storage, no user data. If you lose the container, recreate it with the same Compose file.

## Troubleshooting

### Devices don't discover each other

**Symptom:** Two devices on the same network don't appear in each other's PairDrop UI.
**Fix:** Check that both devices reach PairDrop through the same IP path. If one uses the LAN IP and the other uses a domain through a reverse proxy, they may appear to be on different networks. Ensure `X-Forwarded-For` is configured correctly on your reverse proxy.

### File transfer fails or is extremely slow

**Symptom:** Transfer starts but drops or crawls.
**Fix:** WebRTC transfers depend on direct connectivity between devices. If both are behind restrictive NAT, add a TURN server (see Advanced Configuration). Also check that the browsers support WebRTC — some privacy-focused browsers disable it by default.

### All users see each other (privacy concern)

**Symptom:** Users on different subnets or networks can see and send files to each other.
**Fix:** PairDrop groups peers by IP. Behind a reverse proxy, all users may share the same IP. Ensure `X-Forwarded-For` is forwarded correctly so PairDrop sees real client IPs.

### Mobile browser issues

**Symptom:** PairDrop doesn't work on iOS Safari or Android Chrome.
**Fix:** Ensure your PairDrop instance uses HTTPS. WebRTC requires a secure context on most mobile browsers. Use a reverse proxy with SSL or Cloudflare Tunnel.

## Resource Requirements

- **RAM:** ~30 MB idle, barely increases under load
- **CPU:** Negligible — the server only handles signaling, not file data
- **Disk:** ~50 MB for the container image. Zero runtime storage.

## Verdict

PairDrop is the easiest self-hosted app you'll ever deploy. One container, zero configuration, works instantly across every platform. It's the definitive [AirDrop replacement](/replace/airdrop) — faster to set up, works on Windows/Linux/Android, and your files never touch a third-party server.

The only limitation is LAN-only transfers without a TURN server. For sharing files with people outside your network, use [Send](/apps/send) instead. For local device-to-device transfers, nothing beats PairDrop.

## Frequently Asked Questions

### Does PairDrop store my files?
No. Files transfer directly between browsers via WebRTC. The server only handles peer discovery (signaling). Your files never touch the server.

### Can I use PairDrop on my phone?
Yes. PairDrop works in any modern mobile browser — Safari on iOS, Chrome on Android, Firefox, etc. No app installation needed.

### How large can transferred files be?
No limit. Since files transfer peer-to-peer, the only constraint is the sender's and receiver's available memory and connection speed. Multi-gigabyte transfers work fine on a fast LAN.

## Related

- [PairDrop vs Send](/compare/pairdrop-vs-send)
- [How to Self-Host Send](/apps/send)
- [Self-Hosted Alternatives to AirDrop](/replace/airdrop)
- [Self-Hosted Alternatives to WeTransfer](/replace/wetransfer)
- [Best Self-Hosted File Sharing Tools](/best/file-sharing)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy)
