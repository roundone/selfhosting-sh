---
title: "How to Self-Host ZeroTier with Docker"
description: "Set up a self-hosted ZeroTier network controller with ZTNET and Docker Compose for unlimited nodes, networks, and full control."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - zerotier
tags:
  - self-hosted
  - vpn
  - zerotier
  - docker
  - mesh-network
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ZeroTier?

[ZeroTier](https://www.zerotier.com) is a peer-to-peer virtual networking platform that creates encrypted Layer 2 Ethernet networks between your devices. Think of it as a software-defined WAN that connects devices anywhere in the world as if they were on the same local network. It replaces commercial VPN services by providing mesh connectivity without port forwarding, firewall changes, or a central gateway bottleneck.

ZeroTier's free tier (via my.zerotier.com) limits you to 10 devices and 1 network. Self-hosting the network controller removes these limits entirely — unlimited nodes, unlimited networks, full control.

## Why Self-Host?

ZeroTier 1.16.0 (September 2024) moved the network controller code to a commercial source-available license. Default packages no longer include the controller. Self-hosting via [ZTNET](https://github.com/sinamics/ztnet) gives you:

- **Unlimited devices and networks** — no 10-device cap
- **Full network control** — manage members, routes, and flow rules yourself
- **No account dependency** — your network works even if ZeroTier, Inc. goes offline
- **Web dashboard** — ZTNET provides a modern UI for managing everything

## Prerequisites

- A Linux server with a public IP (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 1 GB RAM minimum
- 5 GB free disk space
- A domain name (optional, for remote dashboard access)

## Docker Compose Configuration

The recommended self-hosted setup uses [ZTNET](https://github.com/sinamics/ztnet) — a Next.js-based web UI that bundles ZeroTier's controller. It requires three services: PostgreSQL, ZeroTier, and ZTNET.

Create a `docker-compose.yml` file:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ztnet-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ztnet
      POSTGRES_PASSWORD: change-this-strong-password  # CHANGE THIS
      POSTGRES_DB: ztnet
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      ztnet:
        ipv4_address: 172.31.255.2

  zerotier:
    image: zyclonite/zerotier:1.14.2
    container_name: ztnet-zerotier
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - SYS_ADMIN
    devices:
      - /dev/net/tun:/dev/net/tun
    ports:
      - "9993:9993/udp"  # ZeroTier peer communication
    volumes:
      - zerotier:/var/lib/zerotier-one
    networks:
      ztnet:
        ipv4_address: 172.31.255.3

  ztnet:
    image: sinamics/ztnet:v0.7.14
    container_name: ztnet
    restart: unless-stopped
    depends_on:
      - postgres
      - zerotier
    environment:
      NEXTAUTH_URL: "http://localhost:3000"             # Change to your domain URL
      NEXTAUTH_SECRET: "change-this-to-random-string"   # CHANGE THIS — generate with: openssl rand -hex 32
      NEXTAUTH_URL_INTERNAL: "http://ztnet:3000"
      POSTGRES_HOST: postgres
      POSTGRES_PORT: "5432"
      POSTGRES_USER: ztnet
      POSTGRES_PASSWORD: change-this-strong-password     # Must match postgres service
      POSTGRES_DB: ztnet
      ZT_ADDR: http://zerotier:9993                      # ZeroTier API endpoint
    ports:
      - "3000:3000"  # ZTNET web UI
    volumes:
      - zerotier:/var/lib/zerotier-one
    networks:
      ztnet:
        ipv4_address: 172.31.255.4

networks:
  ztnet:
    driver: bridge
    ipam:
      config:
        - subnet: 172.31.255.0/29

volumes:
  postgres-data:
  zerotier:
```

Create a `.env` file:

```bash
# Generate secrets before first run:
# openssl rand -hex 32
NEXTAUTH_SECRET=your-generated-secret-here
POSTGRES_PASSWORD=your-strong-database-password
```

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

1. Open `http://your-server-ip:3000` in your browser
2. Create an admin account on the registration page
3. Log in to the ZTNET dashboard
4. Click **Create Network** to create your first ZeroTier network
5. ZTNET generates a 16-digit network ID — you'll need this to join clients

### Joining Clients

Install ZeroTier on each client device:

```bash
# Linux
curl -s https://install.zerotier.com | sudo bash

# Join your network
sudo zerotier-cli join <network-id>
```

Back in the ZTNET dashboard, authorize the new member by toggling the checkbox next to the device.

**macOS/Windows:** Download the ZeroTier client from [zerotier.com/download](https://www.zerotier.com/download/), install it, and join using the network ID.

## Configuration

### Network Settings

In the ZTNET dashboard, each network has:

- **IP Assignment Pool** — the IP range assigned to members (default: `10.147.x.x/16`)
- **Flow Rules** — ZeroTier's firewall rules (default allows all traffic between members)
- **Routes** — managed routes for reaching subnets behind members
- **Members** — authorize, name, and manage connected devices

### Custom Routes

To access a subnet behind a ZeroTier member (e.g., your home LAN `192.168.1.0/24`):

1. In the network settings, add a managed route: `192.168.1.0/24` via the ZeroTier IP of the gateway member
2. On the gateway member, enable IP forwarding:
   ```bash
   sudo sysctl -w net.ipv4.ip_forward=1
   echo "net.ipv4.ip_forward = 1" | sudo tee -a /etc/sysctl.conf
   ```
3. Add a NAT rule on the gateway:
   ```bash
   sudo iptables -t nat -A POSTROUTING -o eth0 -s 10.147.0.0/16 -j MASQUERADE
   ```

### Flow Rules

ZeroTier uses a custom rule language for network-level firewall rules. The default rule allows all traffic:

```
accept;
```

To restrict traffic (e.g., allow only SSH and HTTP):

```
drop
  not ipprotocol tcp
;
accept
  dport 22 or dport 80 or dport 443
;
drop;
```

## Advanced Configuration

### Moon Servers (Self-Hosted Root Servers)

Moon servers reduce latency and decrease dependency on ZeroTier's planet infrastructure. They don't replace the controller — they optimize connection establishment.

1. On a VPS with a static IP, identify the ZeroTier identity:
   ```bash
   docker exec ztnet-zerotier cat /var/lib/zerotier-one/identity.public
   ```

2. Generate the moon configuration:
   ```bash
   docker exec ztnet-zerotier zerotier-idtool initmoon /var/lib/zerotier-one/identity.public > moon.json
   ```

3. Edit `moon.json` to add your server's public IP:
   ```json
   "stableEndpoints": ["1.2.3.4/9993"]
   ```

4. Generate the moon file:
   ```bash
   docker exec ztnet-zerotier zerotier-idtool genmoon moon.json
   ```

5. Move the `.moon` file into the moons directory:
   ```bash
   docker exec ztnet-zerotier mkdir -p /var/lib/zerotier-one/moons.d
   docker cp 000000*.moon ztnet-zerotier:/var/lib/zerotier-one/moons.d/
   docker compose restart zerotier
   ```

6. On clients, orbit the moon:
   ```bash
   sudo zerotier-cli orbit <moon-id> <moon-id>
   ```

ZTNET also supports configuring private root servers (moons) through its web UI.

## Reverse Proxy

To access ZTNET over HTTPS with a domain:

```nginx
server {
    listen 443 ssl http2;
    server_name ztnet.example.com;

    ssl_certificate /etc/letsencrypt/live/ztnet.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ztnet.example.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Update `NEXTAUTH_URL` in your Docker Compose to match the public URL (e.g., `https://ztnet.example.com`).

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) guide for Nginx Proxy Manager or Traefik configuration.

## Backup

Back up these volumes:

- **postgres-data** — ZTNET database (networks, members, settings)
- **zerotier** — ZeroTier identity and controller state

```bash
# Stop services for consistent backup
docker compose stop

# Back up volumes
docker run --rm -v ztnet_postgres-data:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/postgres-data.tar.gz -C /data .

docker run --rm -v ztnet_zerotier:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/zerotier.tar.gz -C /data .

# Restart
docker compose up -d
```

**Critical:** The `zerotier` volume contains the controller's cryptographic identity. Losing it means all existing networks and member authorizations are lost.

## Troubleshooting

### Clients Can't Connect After Joining

**Symptom:** Client joins the network but gets no IP address.
**Fix:** Authorize the member in the ZTNET dashboard. New members are not auto-authorized by default.

### Peers Not Establishing Direct Connections

**Symptom:** Traffic routes through ZeroTier's planet servers (high latency).
**Fix:** Ensure UDP port 9993 is open on both sides. ZeroTier uses UDP hole-punching for direct connections. Symmetric NAT prevents direct connections — set up a moon server on a VPS to improve connectivity.

### ZTNET Dashboard Shows "Connection Error"

**Symptom:** ZTNET can't communicate with the ZeroTier service.
**Fix:** Verify the `ZT_ADDR` environment variable points to the correct address (`http://zerotier:9993`). Check that both containers are on the same Docker network.

### "Identity collision" Error

**Symptom:** Two nodes report the same identity.
**Fix:** Never copy the `identity.secret` file between nodes. Each node must have a unique identity. Delete `/var/lib/zerotier-one/identity.*` on the duplicate node and restart.

### ZeroTier Container Fails to Start

**Symptom:** Container exits immediately with permission errors.
**Fix:** Ensure `NET_ADMIN` and `SYS_ADMIN` capabilities are granted and `/dev/net/tun` device is available. On some hosts, you may need to run `sudo modprobe tun` first.

## Resource Requirements

- **RAM:** 256 MB idle (ZTNET + PostgreSQL + ZeroTier), 512 MB under active use
- **CPU:** Low — ZeroTier is lightweight; ZTNET uses minimal CPU except during page loads
- **Disk:** 1 GB for application data; grows slowly with network size

## Verdict

ZeroTier with ZTNET is the best choice for users who need a **Layer 2 mesh network** with self-hosted control. The L2 architecture means you can run protocols that Tailscale and WireGuard can't handle — multicast, broadcast, non-IP protocols. The self-hosted controller eliminates the 10-device limit and gives you full network sovereignty.

For simpler VPN needs (site-to-site, remote access), [Tailscale](/apps/tailscale/) or [WireGuard](/apps/wireguard/) are easier to set up. ZeroTier's sweet spot is complex networking scenarios: bridging multiple LANs, gaming networks, IoT deployments, or environments where L2 connectivity matters.

## FAQ

### Do I still need ZeroTier's planet servers?

Yes. Planet servers handle initial peer discovery and NAT traversal. Your self-hosted controller manages network membership and authorization, but the underlying transport still uses planet for rendezvous. You can supplement with moon servers to reduce dependence on planet.

### Is ZeroTier's controller license change a problem?

For personal and non-profit use, no — the commercial source-available license is free. For commercial use, you need a license from ZeroTier, Inc. Using ZTNET (which bundles ZeroTier) avoids the build-from-source complexity.

### Can ZeroTier replace Tailscale?

For mesh networking, yes. ZeroTier's Layer 2 approach is more flexible than Tailscale's Layer 3. However, Tailscale is simpler to set up, has better SSO integration, and doesn't require a self-hosted controller for basic use. See our [ZeroTier vs Tailscale](/compare/zerotier-vs-tailscale/) comparison.

### How many devices can a self-hosted controller handle?

Thousands. The controller is lightweight — ZTNET users report running 500+ members without issues. The bottleneck is typically your server's network bandwidth, not the controller itself.

### What version of ZeroTier should I use?

Use ZeroTier 1.14.2 with ZTNET — this is the version ZTNET is tested against and includes the controller. The `zyclonite/zerotier:1.14.2` Docker image includes the controller binary.

## Related

- [ZeroTier vs Tailscale](/compare/zerotier-vs-tailscale/)
- [How to Self-Host Tailscale (Headscale)](/apps/headscale/)
- [How to Self-Host WireGuard](/apps/wireguard/)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard/)
- [Best Self-Hosted VPN Solutions](/best/vpn/)
- [Self-Hosted Alternatives to NordVPN](/replace/nordvpn/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
