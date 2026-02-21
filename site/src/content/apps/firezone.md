---
title: "How to Self-Host Firezone Gateway with Docker"
description: "Deploy a Firezone Gateway with Docker Compose for zero-trust remote access to your network resources using WireGuard."
date: 2026-02-20
dateUpdated: 2026-02-20
category: "vpn-remote-access"
apps:
  - firezone
tags:
  - self-hosted
  - vpn
  - wireguard
  - zero-trust
  - firezone
  - docker
  - remote-access
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Firezone?

[Firezone](https://www.firezone.dev/) is a zero-trust remote access platform built on WireGuard. It replaces traditional VPNs with a modern approach: instead of granting full network access, Firezone lets you define granular policies that control which users can access which resources. It uses peer-to-peer encrypted tunnels, automatic NAT traversal, and ephemeral WireGuard keys that rotate constantly.

Firezone 1.x uses a split architecture: the admin portal and control plane run as a managed service at `app.firezone.dev`, while **Gateways** — the components that connect users to your resources — run on your infrastructure. You self-host the gateways; Firezone manages the control plane. This is different from traditional self-hosted VPN solutions like [WireGuard](/apps/wireguard/) or [wg-easy](/apps/wg-easy/) where you own the entire stack.

If you need a fully self-hosted VPN with no cloud dependency, look at [wg-easy](/apps/wg-easy/), [Headscale](/apps/headscale/), or [NetBird](/apps/netbird/) instead. Firezone is the right choice when you want enterprise-grade zero-trust access policies without building that infrastructure yourself.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- 128 MB of free RAM (per gateway)
- A [Firezone account](https://app.firezone.dev/) (free tier available)
- A Firezone Site and Gateway token from the admin portal

Firezone Gateways need outbound internet access to connect to the control plane at `api.firezone.dev`. No inbound ports need to be opened — the gateway establishes outbound connections and uses NAT traversal for client tunnels.

## Architecture Overview

Before deploying, understand how the pieces fit together:

- **Admin Portal** (cloud-hosted at `app.firezone.dev`): Where you configure Sites, Resources, Groups, Policies, and Users.
- **Gateways** (self-hosted on your infrastructure): Linux processes that create WireGuard tunnels to clients and route traffic to your Resources. You deploy one or more per Site.
- **Clients** (on user devices): Official apps for macOS, Windows, Linux, iOS, and Android that connect to Gateways.
- **Relays** (Firezone-managed): STUN/TURN servers that help establish connections when direct peer-to-peer isn't possible. All traffic remains end-to-end encrypted — relays cannot decrypt it.

The data plane (actual traffic) flows directly between clients and gateways over WireGuard. The control plane (configuration, auth, key distribution) goes through Firezone's managed API.

## Getting a Gateway Token

Before writing the Docker Compose file, you need a token:

1. Sign up or log in at [app.firezone.dev](https://app.firezone.dev/)
2. Create a **Site** (a logical grouping of Gateways and Resources — e.g., "Home Lab" or "Office")
3. Click **Deploy Gateway** within the Site
4. Select **Docker** as the deployment method
5. Copy the `FIREZONE_TOKEN` value — you'll need it for the Compose file

Each Site can have multiple Gateways for redundancy and load balancing. If one Gateway goes down, clients automatically failover to another in the same Site.

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  firezone-gateway:
    image: ghcr.io/firezone/gateway:1
    container_name: firezone-gateway
    restart: unless-stopped
    environment:
      # Required: token from Firezone admin portal
      - FIREZONE_TOKEN=${FIREZONE_TOKEN}
      # Optional: unique ID for this gateway (auto-generated if omitted)
      - FIREZONE_ID=${FIREZONE_ID:-}
      # Optional: human-readable name shown in admin portal
      - FIREZONE_NAME=${FIREZONE_NAME:-gateway-1}
      # Logging level: trace, debug, info, warn, error, off
      - RUST_LOG=${RUST_LOG:-info}
      # Enable flow logs for debugging (disable in production for performance)
      - FIREZONE_ENABLE_MASQUERADE=1
    cap_add:
      - NET_ADMIN       # Required for creating WireGuard interfaces and managing routes
    sysctls:
      - net.ipv4.ip_forward=1                # Enable IPv4 forwarding for routing VPN traffic
      - net.ipv4.conf.all.src_valid_mark=1   # Required for WireGuard routing
      - net.ipv6.conf.all.forwarding=1       # Enable IPv6 forwarding
    devices:
      - /dev/net/tun:/dev/net/tun  # TUN device for WireGuard tunnel
    volumes:
      - firezone-gateway:/var/lib/firezone  # Persistent state
    healthcheck:
      test: ["CMD", "ip", "link", "show", "tun-firezone"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - firezone

networks:
  firezone:
    driver: bridge

volumes:
  firezone-gateway:
```

Create a `.env` file alongside it:

```bash
# Required: paste your token from the Firezone admin portal
FIREZONE_TOKEN=your-token-from-admin-portal

# Optional: unique identifier for this gateway instance
# Leave empty to auto-generate. Set explicitly if you want stable identity across restarts.
FIREZONE_ID=

# Optional: display name in admin portal
FIREZONE_NAME=gateway-1

# Log level: trace, debug, info, warn, error, off
RUST_LOG=info
```

Start the gateway:

```bash
docker compose up -d
```

## Initial Setup

1. After starting the gateway, verify it connected to the control plane:

```bash
docker compose logs firezone-gateway
```

You should see output indicating a successful connection to `api.firezone.dev` and tunnel interface creation.

2. In the Firezone admin portal, confirm your gateway shows as **Online** in the Site view.

3. **Create Resources** — define what the gateway should provide access to:
   - A specific IP address (e.g., `192.168.1.100`)
   - A CIDR range (e.g., `192.168.1.0/24`)
   - A DNS name (e.g., `nas.local`)

4. **Create a Group** and add users to it.

5. **Create a Policy** linking the Group to the Resource. This is the zero-trust part — only users in the Group can access the Resource, and only through an authenticated client.

6. Install the [Firezone Client](https://www.firezone.dev/kb/client-apps) on your devices and sign in with your account.

## Configuration

### Multiple Gateways for High Availability

Deploy two or more gateways in the same Site for automatic failover. Each gateway needs its own unique `FIREZONE_ID`:

```yaml
services:
  firezone-gateway-1:
    image: ghcr.io/firezone/gateway:1
    container_name: firezone-gw-1
    restart: unless-stopped
    environment:
      - FIREZONE_TOKEN=${FIREZONE_TOKEN}
      - FIREZONE_ID=gateway-1
      - FIREZONE_NAME=gateway-primary
      - RUST_LOG=info
      - FIREZONE_ENABLE_MASQUERADE=1
    cap_add:
      - NET_ADMIN
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
      - net.ipv6.conf.all.forwarding=1
    devices:
      - /dev/net/tun:/dev/net/tun
    volumes:
      - firezone-gw1:/var/lib/firezone
    networks:
      - firezone

  firezone-gateway-2:
    image: ghcr.io/firezone/gateway:1
    container_name: firezone-gw-2
    restart: unless-stopped
    environment:
      - FIREZONE_TOKEN=${FIREZONE_TOKEN}
      - FIREZONE_ID=gateway-2
      - FIREZONE_NAME=gateway-secondary
      - RUST_LOG=info
      - FIREZONE_ENABLE_MASQUERADE=1
    cap_add:
      - NET_ADMIN
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv4.conf.all.src_valid_mark=1
      - net.ipv6.conf.all.forwarding=1
    devices:
      - /dev/net/tun:/dev/net/tun
    volumes:
      - firezone-gw2:/var/lib/firezone
    networks:
      - firezone

networks:
  firezone:
    driver: bridge

volumes:
  firezone-gw1:
  firezone-gw2:
```

Both gateways use the same `FIREZONE_TOKEN` (tied to the Site), but different `FIREZONE_ID` values. Firezone automatically load-balances and fails over between them.

### DNS Resources

Firezone can intercept DNS queries and route them through gateways. When you define a DNS-based Resource (like `*.internal.company.com`), clients automatically resolve and route traffic for matching domains through the gateway — no split-DNS configuration needed on the client side.

### Telemetry

Firezone gateways send anonymous crash reports by default. To disable:

```bash
FIREZONE_NO_TELEMETRY=true
```

## Reverse Proxy

Firezone Gateways don't serve a web UI — the admin interface is the cloud-hosted portal at `app.firezone.dev`. No reverse proxy configuration is needed for the gateway itself.

If you're using Firezone to provide access to services behind a reverse proxy like [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Traefik](/apps/traefik/), define those services as Resources in the admin portal and create policies to control access. For general reverse proxy setup, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

The gateway's persistent state in `/var/lib/firezone` contains cached configuration and WireGuard keys. Backing it up is optional — if lost, the gateway re-syncs from the control plane on next startup.

What you should back up is your Firezone account configuration (Sites, Resources, Policies). That lives in Firezone's managed service, which handles its own backups.

For general backup strategies, see [Backup Strategy](/foundations/backup-strategy/).

## Troubleshooting

### Gateway Shows as Offline

**Symptom:** The gateway appears offline in the admin portal even though the container is running.

**Fix:** Check that the gateway can reach `api.firezone.dev` on port 443 (WSS):

```bash
docker compose exec firezone-gateway curl -s https://api.firezone.dev
```

If this fails, check your firewall rules for outbound HTTPS. Also verify your `FIREZONE_TOKEN` is correct — an invalid token causes silent connection failures.

### Clients Can't Reach Resources

**Symptom:** Client connects but can't access defined Resources.

**Fix:** Verify the gateway can reach the Resource from its network:

```bash
docker compose exec firezone-gateway ping 192.168.1.100
```

If the gateway can't reach it, the issue is networking — not Firezone. Ensure the Docker network has access to your LAN. You may need `network_mode: host` instead of bridge networking for LAN access:

```yaml
services:
  firezone-gateway:
    # ... other config ...
    network_mode: host
```

### TUN Device Not Available

**Symptom:** Error about `/dev/net/tun` not being available.

**Fix:** Ensure the TUN kernel module is loaded:

```bash
sudo modprobe tun
```

If running on a VPS, some providers disable TUN devices. Check with your host or use a provider that supports it (Hetzner, DigitalOcean, and Linode all support TUN).

### High Latency Through Gateway

**Symptom:** Connections through Firezone are slower than expected.

**Fix:** Firezone uses peer-to-peer connections by default. If direct connectivity isn't possible, traffic routes through Firezone's relay servers (TURN), adding latency. Check the connection type in the client app — if it shows "relayed," the issue is NAT traversal. Deploying the gateway on a host with a public IP or enabling UPnP can help establish direct connections.

### Gateway Keeps Restarting

**Symptom:** Container restarts repeatedly, logs show token or authentication errors.

**Fix:** Regenerate the gateway token in the admin portal. Tokens can be invalidated if you delete and recreate the Site, or if the token was generated for a different Site.

## Resource Requirements

- **RAM:** ~50-128 MB per gateway depending on the number of connected clients
- **CPU:** Low — WireGuard is efficient. A single core handles hundreds of clients.
- **Disk:** <100 MB for the gateway itself
- **Network:** Outbound HTTPS to `api.firezone.dev`. WireGuard traffic on UDP (port negotiated dynamically via control plane).

## Verdict

Firezone occupies a unique niche: it brings enterprise-grade zero-trust access to self-hosters, but with a trade-off — the control plane is cloud-hosted. You can't run the admin portal on your own server.

**Choose Firezone if:** You want granular, policy-based access control (specific users can access specific resources), built-in SSO/identity provider integration, and multi-site gateway management. It's the best option for teams and organizations where access policies matter more than full infrastructure ownership.

**Look elsewhere if:** You want a fully self-hosted VPN with zero cloud dependencies. [wg-easy](/apps/wg-easy/) gives you a simple WireGuard server with a web UI. [Headscale](/apps/headscale/) gives you a self-hosted Tailscale control plane. [NetBird](/apps/netbird/) offers a fully self-hostable zero-trust platform including the control plane.

For most home lab users who just need remote access to their services, [Tailscale](/apps/tailscale/) or [wg-easy](/apps/wg-easy/) are simpler choices. Firezone shines when you need real access policies.

## Frequently Asked Questions

### Is Firezone fully self-hostable?

No. As of Firezone 1.x, the admin portal and control plane are cloud-managed services. You self-host the Gateways (the data plane). The source code is open and you can technically build the entire stack yourself, but it's not officially supported for production self-hosting. If you need full self-hosting, look at [NetBird](/apps/netbird/) or [Headscale](/apps/headscale/).

### Is there a free tier?

Yes. Firezone offers a free tier that includes up to 6 users and basic features. Check [firezone.dev/pricing](https://www.firezone.dev/pricing) for current limits.

### How does Firezone compare to a traditional VPN?

Traditional VPNs grant full network access once connected. Firezone uses zero-trust principles — each resource requires explicit policy authorization. Traffic flows peer-to-peer and is encrypted end-to-end. There's no central chokepoint like a traditional VPN gateway.

### Can I use Firezone alongside other VPN solutions?

Yes. Firezone Gateways are isolated — they create their own WireGuard interfaces and don't interfere with existing VPN setups. You can run Firezone alongside [WireGuard](/apps/wireguard/) or [Tailscale](/apps/tailscale/) on the same host.

### What happens if Firezone's cloud goes down?

Existing tunnels continue to work — the data plane is peer-to-peer. However, new connections and policy changes won't propagate until the control plane is back. This is the inherent risk of the split architecture.

## Related

- [Best Self-Hosted VPN Solutions](/best/vpn/)
- [How to Self-Host wg-easy](/apps/wg-easy/)
- [How to Self-Host Headscale](/apps/headscale/)
- [How to Self-Host NetBird](/apps/netbird/)
- [How to Self-Host WireGuard](/apps/wireguard/)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard/)
- [Self-Hosted NordVPN Alternatives](/replace/nordvpn/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Firezone vs WG-Easy](/compare/firezone-vs-wg-easy/)
- [Backup Strategy](/foundations/backup-strategy/)
