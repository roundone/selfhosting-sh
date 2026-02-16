---
title: "How to Self-Host NetBird with Docker"
description: "Deploy a self-hosted NetBird mesh VPN with Docker Compose. Full setup with dashboard, signal, relay, and OIDC authentication."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - netbird
tags:
  - self-hosted
  - vpn
  - netbird
  - wireguard
  - docker
  - mesh-network
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is NetBird?

[NetBird](https://netbird.io) is a WireGuard-based mesh VPN platform that connects devices into a private network with automatic peer-to-peer connections, NAT traversal, and zero-trust access controls. It replaces commercial VPNs and competes with Tailscale — but unlike Tailscale, NetBird can be fully self-hosted with no dependency on external infrastructure.

NetBird provides a web dashboard for managing peers, routes, DNS, access control policies, and network segmentation. Clients are available for Linux, macOS, Windows, iOS, and Android.

## Prerequisites

- A Linux server with a public IP (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- A domain name pointing to your server (required — Let's Encrypt needs it)
- An OIDC identity provider (see below)
- `jq` installed (`apt install jq`)
- 1 GB RAM minimum, 2 GB recommended
- 10 GB free disk space

### Identity Provider Requirement

NetBird requires an external OIDC identity provider for authentication. **This is mandatory — there is no built-in user/password auth.** Your options:

| Provider | Self-Hosted | Complexity |
|----------|-------------|------------|
| [Zitadel](https://zitadel.com) | Yes | Medium |
| [Keycloak](https://www.keycloak.org) | Yes | High |
| [Authentik](https://goauthentik.io) | Yes | Medium |
| [Pocket ID](https://github.com/stonith404/pocket-id) | Yes | Low |
| Auth0 | No (managed) | Low |
| Google | No (managed) | Low |
| Okta | No (managed) | Low |
| Microsoft Entra | No (managed) | Medium |

For the simplest fully self-hosted setup, use **Pocket ID** (lightweight OIDC with passkey auth) or **Zitadel** (full-featured IAM). For a quick start without self-hosting the IDP, use **Auth0's free tier**.

## Docker Compose Configuration

NetBird's self-hosted setup uses a **configure script** that generates Docker Compose and configuration files from a template. You cannot simply copy-paste a compose file — the script generates cryptographic keys, TURN credentials, and OIDC configuration.

### Step 1: Clone and Configure

```bash
# Get the latest release
LATEST_TAG=$(basename $(curl -fs -o/dev/null -w %{redirect_url} \
  https://github.com/netbirdio/netbird/releases/latest))
git clone --depth 1 --branch $LATEST_TAG https://github.com/netbirdio/netbird/
cd netbird/infrastructure_files/

# Copy the environment template
cp setup.env.example setup.env
```

### Step 2: Edit setup.env

Open `setup.env` and set these required variables:

```bash
# Image tags — pin to the release version
NETBIRD_DASHBOARD_TAG="v2.9.0"
NETBIRD_SIGNAL_TAG="v0.65.1"
NETBIRD_MANAGEMENT_TAG="v0.65.1"
COTURN_TAG="4.6.3"
NETBIRD_RELAY_TAG="v0.65.1"

# Your domain — must have DNS A record pointing to this server
NETBIRD_DOMAIN="netbird.example.com"

# TURN server public IP — your server's public IP address
NETBIRD_TURN_EXTERNAL_IP="1.2.3.4"

# OIDC configuration — example for Auth0
NETBIRD_AUTH_OIDC_CONFIGURATION_ENDPOINT="https://your-tenant.auth0.com/.well-known/openid-configuration"
NETBIRD_AUTH_AUDIENCE="netbird-client"
NETBIRD_AUTH_CLIENT_ID="your-auth0-client-id"
NETBIRD_USE_AUTH0="true"

# Let's Encrypt email
NETBIRD_LETSENCRYPT_EMAIL="admin@example.com"

# IDP management — required for user sync
NETBIRD_MGMT_IDP="auth0"
NETBIRD_IDP_MGMT_CLIENT_ID="your-auth0-management-client-id"
NETBIRD_IDP_MGMT_CLIENT_SECRET="your-auth0-management-secret"
```

For self-hosted IDPs (Zitadel, Keycloak, Authentik), see the [NetBird identity provider docs](https://docs.netbird.io/selfhosted/identity-providers) for the specific OIDC configuration values.

### Step 3: Generate and Deploy

```bash
# Generate docker-compose.yml, management.json, and turnserver.conf
./configure.sh

# Deploy from generated artifacts
cd artifacts/
docker compose up -d
```

### What Gets Generated

The `configure.sh` script creates three files in `artifacts/`:

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full 5-service compose configuration |
| `management.json` | Management service config (OIDC, STUN/TURN, encryption keys) |
| `turnserver.conf` | Coturn STUN/TURN server configuration |

### Generated Architecture (5 Services)

| Service | Image | Purpose | Ports |
|---------|-------|---------|-------|
| dashboard | `netbirdio/dashboard` | Web UI for managing peers and policies | 80, 443 (TCP) |
| signal | `netbirdio/signal` | Peer signaling for connection negotiation | 10000 (TCP) |
| relay | `netbirdio/relay` | Relay for peers that can't connect directly | 33080 (TCP) |
| management | `netbirdio/management` | API backend, auth, peer registration, DNS | 33073 (TCP) |
| coturn | `coturn/coturn` | STUN/TURN for NAT traversal | 3478 (UDP), host networking |

**Note:** Coturn runs in `network_mode: host` — it binds directly to the host's network interfaces, bypassing Docker networking.

## Initial Setup

1. After deploying, open `https://netbird.example.com` in your browser
2. You'll be redirected to your OIDC provider for authentication
3. Log in with your identity provider credentials
4. The first user is automatically made an admin
5. The dashboard shows your network — no peers connected yet

### Installing Clients

```bash
# Linux
curl -fsSL https://pkgs.netbird.io/install.sh | sudo sh

# Connect to your self-hosted instance
sudo netbird up --management-url https://netbird.example.com:33073
```

**macOS/Windows/Mobile:** Download from [netbird.io/download](https://netbird.io/download). In the client settings, set the management URL to `https://netbird.example.com:33073` before connecting.

The client opens a browser window for OIDC authentication. After authenticating, the peer appears in the dashboard.

## Configuration

### Access Control Policies

NetBird uses a zero-trust model — traffic is denied by default unless a policy allows it. The default policy allows all peers to communicate with each other.

To restrict access:
1. Go to **Access Control** → **Policies** in the dashboard
2. Create a new policy with source groups, destination groups, and allowed ports/protocols
3. Remove or disable the default "All" policy

### Network Routes

To route traffic to a subnet behind a NetBird peer:
1. Go to **Network** → **Routes**
2. Add a route with the target network (e.g., `192.168.1.0/24`)
3. Select the peer that acts as the gateway
4. Enable the route

### DNS Management

NetBird includes built-in DNS for peer name resolution:
- Peers are reachable at `<hostname>.netbird.selfhosted` by default
- Custom DNS nameservers can be configured under **DNS** → **Nameservers**
- DNS domain is configurable via `NETBIRD_MGMT_DNS_DOMAIN` in `setup.env`

### Groups

Groups organize peers for policy management:
- Peers are auto-assigned to the "All" group
- Create groups based on function (servers, workstations, IoT)
- Groups are used as source/destination in access control policies

## Reverse Proxy

If you want to put NetBird behind an existing reverse proxy instead of using its built-in Let's Encrypt:

1. Set `NETBIRD_DISABLE_LETSENCRYPT=true` in `setup.env`
2. Update port variables to match your reverse proxy's backend ports
3. Re-run `./configure.sh` and redeploy

Your reverse proxy must handle TLS termination and forward to the appropriate service ports. Note that signal and management use gRPC — ensure your proxy supports HTTP/2 and gRPC passthrough.

See our [Reverse Proxy Setup](/foundations/reverse-proxy-explained) guide for details.

## Backup

```bash
cd artifacts/

# Stop management for consistent database backup
docker compose stop management

# Back up management data (SQLite database, encryption keys)
docker compose cp -a management:/var/lib/netbird/ ./backup-management/

# Restart management
docker compose start management

# Also back up configuration files
cp docker-compose.yml management.json turnserver.conf ./backup-config/
```

**Critical files to back up:**
- Management volume (`/var/lib/netbird/`) — contains the database, encryption keys, and peer state
- `management.json` — OIDC configuration and TURN credentials
- `turnserver.conf` — Coturn configuration
- `docker-compose.yml` — service definitions

## Troubleshooting

### Peers Can't Connect — TURN/STUN Failure

**Symptom:** Peers authenticate but can't establish WireGuard tunnels. Dashboard shows peers as "connected" but no traffic flows.
**Fix:** Ensure `NETBIRD_TURN_EXTERNAL_IP` is set to your server's actual public IP. Verify UDP port 3478 is open in your firewall. On Oracle Cloud, manually add: `sudo iptables -I INPUT -p udp -m udp --dport 3478 -j ACCEPT`.

### Hetzner: Coturn Relay Not Working

**Symptom:** Direct connections work but relayed connections fail on Hetzner VPS.
**Fix:** Hetzner uses stateless firewalls. Open the full local UDP port range in addition to port 3478. Check your range: `cat /proc/sys/net/ipv4/ip_local_port_range` and open those ports in the Hetzner firewall.

### OIDC Authentication Loop

**Symptom:** Browser keeps redirecting between NetBird and the identity provider without completing login.
**Fix:** Verify `NETBIRD_AUTH_OIDC_CONFIGURATION_ENDPOINT` is reachable from both the server and the client browser. Check that `NETBIRD_AUTH_CLIENT_ID` matches the client ID in your IDP. For Auth0, ensure `NETBIRD_USE_AUTH0` is `true`.

### Dashboard Shows "Management Unreachable"

**Symptom:** Dashboard loads but can't communicate with the management API.
**Fix:** Check that port 33073 is open and accessible. Verify the `NETBIRD_MGMT_API_ENDPOINT` URL is correct in the dashboard's environment. Check management logs: `docker compose logs management`.

### Upgrade Fails From Pre-v0.15.3

**Symptom:** Management service crashes after upgrading directly to v0.26.0+.
**Fix:** You must upgrade in stages: first to v0.25.9, run management to complete the rules-to-policies migration, then upgrade to v0.26.0+. Never skip the intermediate step.

## Resource Requirements

- **RAM:** 512 MB idle (5 services), 1 GB under active use with 50+ peers
- **CPU:** Low to medium — most work is connection brokering, not traffic proxying
- **Disk:** 2 GB for application data; Coturn logs can grow if relay traffic is heavy
- **Network:** Minimal — control plane only. Data flows peer-to-peer between clients, not through the server (except when relayed via Coturn)

## Verdict

NetBird is the most feature-complete self-hosted mesh VPN available. The zero-trust access controls, DNS management, network routes, and groups give you Tailscale-level functionality with full self-hosting. The web dashboard is polished and actively developed.

The significant downside is **setup complexity**. The mandatory OIDC provider requirement adds an entire service to deploy and configure before you can even start using NetBird. If you want a self-hosted mesh VPN without the OIDC dependency, use [Headscale](/apps/headscale) (Tailscale-compatible) or [WireGuard](/apps/wireguard) with [wg-easy](/apps/wg-easy) for a simpler setup.

NetBird is best for teams and organizations that already have an identity provider and want enterprise-grade network segmentation. For personal use or small homelab setups, it's overkill.

## FAQ

### Can I skip the OIDC requirement?

No. NetBird fundamentally requires OIDC for authentication. There is no built-in username/password option. The simplest self-hosted option is Pocket ID (lightweight, passkey-based). The simplest managed option is Auth0's free tier (7,000 users).

### How does NetBird compare to Tailscale?

NetBird offers similar features (mesh VPN, ACLs, DNS, routes) but can be fully self-hosted. Tailscale is easier to set up but requires Tailscale's coordination server (unless you use [Headscale](/apps/headscale)). See our [NetBird vs Tailscale](/compare/netbird-vs-tailscale) comparison.

### Is NetBird free for commercial use?

Yes. NetBird is BSD-3-Clause licensed. The self-hosted version has no usage restrictions. The managed service (app.netbird.io) has a free tier with 5 users/100 peers.

### Can I use NetBird alongside WireGuard?

NetBird uses WireGuard under the hood, but it manages its own WireGuard interfaces. Running standalone WireGuard and NetBird on the same host works but requires careful port management to avoid conflicts.

### What happens if my NetBird server goes down?

Existing peer-to-peer WireGuard tunnels continue working. New peers can't join, and policy changes can't propagate. The server is only needed for control plane operations, not data plane traffic.

## Related

- [NetBird vs Tailscale](/compare/netbird-vs-tailscale)
- [How to Self-Host Tailscale (Headscale)](/apps/headscale)
- [How to Self-Host WireGuard](/apps/wireguard)
- [How to Self-Host wg-easy](/apps/wg-easy)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard)
- [Best Self-Hosted VPN Solutions](/best/vpn)
- [Self-Hosted Alternatives to NordVPN](/replace/nordvpn)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
