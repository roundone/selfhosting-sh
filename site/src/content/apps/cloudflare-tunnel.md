---
title: "How to Set Up Cloudflare Tunnel with Docker"
description: "Expose self-hosted services to the internet securely using Cloudflare Tunnel without opening ports or configuring a reverse proxy."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - cloudflare-tunnel
tags:
  - self-hosted
  - cloudflare
  - tunnel
  - remote-access
  - docker
  - zero-trust
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Cloudflare Tunnel?

[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) (formerly Argo Tunnel) creates an encrypted outbound-only connection from your server to Cloudflare's edge network, letting you expose self-hosted services to the internet without opening any inbound ports on your firewall. The `cloudflared` daemon runs on your server and initiates the connection — no port forwarding, no dynamic DNS, no public IP required. It is completely free.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
- A domain name with DNS managed by Cloudflare (Cloudflare must be your authoritative DNS provider)
- At least one self-hosted service running locally that you want to expose

## Creating a Tunnel

Set up the tunnel through the Cloudflare Zero Trust dashboard before touching Docker.

1. Go to [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) and log in
2. In the left sidebar, navigate to **Networks > Tunnels**
3. Click **Create a tunnel**
4. Select **Cloudflared** as the connector type and click **Next**
5. Give your tunnel a name (e.g., `homelab` or `my-server`) and click **Save tunnel**
6. Cloudflare displays a tunnel token — a long base64-encoded string. **Copy this token.** You will not be shown it again without re-generating it.
7. Skip the connector installation step — you will run it via Docker instead
8. Click **Next** to proceed to the route configuration (you can configure routes now or later)

The token encodes your tunnel credentials. Anyone with this token can connect to your tunnel, so treat it like a password.

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:2026.2.0
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    networks:
      - tunnel

networks:
  tunnel:
    name: tunnel
```

Create a `.env` file in the same directory:

```bash
# Cloudflare Tunnel token from the Zero Trust dashboard
# Get this from: Zero Trust > Networks > Tunnels > [your tunnel] > Configure
TUNNEL_TOKEN=eyJhIjoiYWJjZGVmMTIzNDU2Nzg5MCIsInQiOiIxMjM0NTY3OC1hYmNkLTEyMzQtYWJjZC0xMjM0NTY3ODkwYWIiLCJzIjoiTXpJeE16...
```

**Replace** the `TUNNEL_TOKEN` value with your actual token from the Cloudflare dashboard.

Start the tunnel:

```bash
docker compose up -d
```

Verify the tunnel is connected:

```bash
docker logs cloudflared
```

You should see output containing `Connection registered` and `Registered tunnel connection`. The tunnel status in the Cloudflare dashboard should show **Healthy**.

**No ports are exposed.** The container makes outbound-only connections to Cloudflare's edge on ports 443 and 7844. Your firewall does not need any inbound rules.

## Adding Services

Once the tunnel is running, route traffic to your local services through the Cloudflare dashboard.

1. Go to **Zero Trust > Networks > Tunnels**
2. Click your tunnel name, then **Configure**
3. Go to the **Public Hostname** tab
4. Click **Add a public hostname**
5. Configure the route:
   - **Subdomain:** e.g., `jellyfin`
   - **Domain:** select your Cloudflare-managed domain
   - **Service Type:** `HTTP` (or `HTTPS` if the local service uses TLS)
   - **URL:** `host.docker.internal:8096` (or the container name if on the same Docker network)

For services running in Docker on the same host, use one of these as the service URL:

| Service Location | URL to Use |
|-----------------|------------|
| Docker container on the `tunnel` network | `http://container-name:port` |
| Docker container on a different network | `http://host.docker.internal:port` |
| Non-Docker service on the host | `http://host.docker.internal:port` |
| Service on another machine | `http://192.168.1.x:port` |

**Recommended approach:** Put your services on the same Docker network as `cloudflared`. Add the `tunnel` network to your other Compose files:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.11.6
    container_name: jellyfin
    # ... other config ...
    networks:
      - tunnel

networks:
  tunnel:
    external: true
```

Then set the service URL in Cloudflare to `http://jellyfin:8096`. This avoids exposing ports on the host entirely.

Cloudflare automatically provisions a DNS record for each public hostname and handles TLS termination at the edge. Your local service does not need its own SSL certificate.

## Configuration

### Multiple Services on One Tunnel

A single tunnel supports unlimited public hostnames. You do not need a separate tunnel per service. Add each service as a new public hostname in the dashboard:

| Hostname | Service URL | What It Reaches |
|----------|------------|----------------|
| `jellyfin.example.com` | `http://jellyfin:8096` | Jellyfin media server |
| `nextcloud.example.com` | `http://nextcloud:80` | Nextcloud file sync |
| `vaultwarden.example.com` | `http://vaultwarden:80` | Vaultwarden passwords |
| `grafana.example.com` | `http://grafana:3000` | Grafana dashboards |

### Catch-All and Path-Based Routing

You can route specific paths on a single hostname to different services. Under the public hostname configuration, set the **Path** field:

- `example.com/grafana` routes to `http://grafana:3000`
- `example.com/api` routes to `http://api-server:8080`

Path-based routing is useful when you want to consolidate services under one domain, but most self-hosted apps work better with dedicated subdomains.

### Private Network Routing

Cloudflare Tunnel can also route traffic to private RFC 1918 networks (e.g., `192.168.1.0/24`, `10.0.0.0/8`). This lets you access your entire LAN from anywhere using the Cloudflare WARP client, similar to a VPN.

1. In the tunnel configuration, go to the **Private Network** tab
2. Add your LAN CIDR (e.g., `192.168.1.0/24`)
3. Install the [Cloudflare WARP client](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/download-warp/) on your remote devices
4. Enroll the device in your Zero Trust organization

Traffic to your private network routes through the tunnel without exposing any services publicly.

## Advanced Configuration

### Access Policies (Zero Trust)

By default, public hostnames are accessible to anyone on the internet. Lock them down with Cloudflare Access policies:

1. Go to **Zero Trust > Access > Applications**
2. Click **Add an application** > **Self-hosted**
3. Set the application domain to match your public hostname (e.g., `jellyfin.example.com`)
4. Create a policy:
   - **Allow** emails ending in `@yourdomain.com`
   - **Allow** specific email addresses
   - **Require** one-time PIN authentication
   - **Require** a specific country or IP range

Cloudflare Access inserts an authentication layer in front of your service. Users must authenticate through Cloudflare before reaching your app. This is free for up to 50 users.

### Service Tokens (API Access)

For services that need machine-to-machine access (webhooks, APIs), create a service token:

1. Go to **Zero Trust > Access > Service Auth**
2. Create a service token
3. Use the `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers in API requests

### WARP Client for Private Access

For full LAN access from remote devices without exposing services publicly:

1. Enable the **Gateway with WARP** integration in Zero Trust settings
2. Create a device enrollment rule under **Settings > WARP Client > Device enrollment**
3. Install WARP on your devices and enroll them in your organization
4. Configure split tunneling to route only your private IP ranges through the tunnel (avoids routing all internet traffic through Cloudflare)

This gives you VPN-like access to your home network without running your own VPN server.

### Local Configuration File (Alternative to Dashboard)

Instead of managing routes in the Cloudflare dashboard, you can use a local config file:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:2026.2.0
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    environment:
      - TUNNEL_TOKEN=${TUNNEL_TOKEN}
    volumes:
      - ./cloudflared-config.yml:/etc/cloudflared/config.yml:ro
    networks:
      - tunnel

networks:
  tunnel:
    name: tunnel
```

The dashboard approach is simpler for most users and allows changes without restarting the container. The config file approach is better for infrastructure-as-code setups where you want tunnel configuration version-controlled.

## Comparison with Reverse Proxy

Cloudflare Tunnel and a traditional [reverse proxy](/foundations/reverse-proxy-explained/) solve similar problems differently.

| | Cloudflare Tunnel | Reverse Proxy (e.g., [Nginx Proxy Manager](/apps/nginx-proxy-manager/)) |
|---|---|---|
| Port forwarding required | No | Yes (80, 443) |
| SSL certificates | Automatic (Cloudflare-managed) | Automatic (Let's Encrypt) but you manage renewal |
| Public IP required | No | Yes |
| DDoS protection | Built-in (Cloudflare edge) | None (unless you add it) |
| Traffic routing | Through Cloudflare servers | Direct to your server |
| Privacy | Cloudflare can inspect traffic | Traffic goes direct, no middleman |
| Latency | Slightly higher (extra hop) | Lower (direct connection) |
| Works behind CGNAT | Yes | No |
| Vendor lock-in | Cloudflare-dependent | Self-controlled |

**Use Cloudflare Tunnel when:** you are behind CGNAT, do not have a static IP, want zero firewall configuration, or want built-in DDoS protection and Access policies.

**Use a reverse proxy when:** you want full control over your traffic, do not want a third party inspecting your data, need the lowest possible latency, or run services that conflict with Cloudflare's terms of service (e.g., serving large media files — check their ToS section 2.8).

You can use both together: Cloudflare Tunnel as the external entry point, and a reverse proxy internally to manage routing between containers.

## Backup

Cloudflare Tunnel configuration lives almost entirely in the Cloudflare dashboard. There is very little to back up locally.

**What to preserve:**

- Your tunnel token (store it in a password manager or secrets vault)
- Your `.env` file containing the token
- Your `docker-compose.yml`

If the container is destroyed, recreate it with the same token and all tunnel routes resume automatically. If you lose the token, generate a new one from the Cloudflare dashboard under **Tunnels > [your tunnel] > Configure > Token**.

Tunnel routes, Access policies, and DNS records are all stored in Cloudflare's infrastructure and do not need local backup.

## Troubleshooting

### Tunnel not connecting

**Symptom:** `cloudflared` logs show `failed to connect` or `ERR` messages. Dashboard shows tunnel as **Inactive**.

**Fix:**
1. Verify the token is correct — copy it again from the dashboard and update your `.env` file
2. Check outbound connectivity: `cloudflared` needs to reach Cloudflare on ports 443 and 7844. Some corporate firewalls or VPS providers block port 7844.
3. Check DNS resolution: the container must resolve `region1.v2.argotunnel.com` and `region2.v2.argotunnel.com`
4. Restart the container:
```bash
docker compose restart cloudflared
```

### Service unreachable (502 or connection refused)

**Symptom:** Cloudflare shows a 502 Bad Gateway or "Unable to connect to origin" error when accessing a public hostname.

**Fix:**
1. Verify the service URL in the dashboard points to the correct host and port
2. If using container names (e.g., `http://jellyfin:8096`), confirm both containers are on the same Docker network
3. If using `host.docker.internal`, ensure your Docker version supports it (Docker Desktop does by default; on Linux, add `extra_hosts: ["host.docker.internal:host-gateway"]` to the `cloudflared` service)
4. Test connectivity from inside the `cloudflared` container:
```bash
docker exec cloudflared wget -qO- http://jellyfin:8096 2>&1 | head -5
```

### SSL/TLS errors

**Symptom:** Browser shows SSL errors, or `cloudflared` logs show TLS handshake failures.

**Fix:**
1. In the Cloudflare dashboard under **SSL/TLS**, set the encryption mode to **Full** (not **Full (Strict)**) if your origin service uses a self-signed certificate
2. If the local service runs on HTTP (no TLS), set the service type to `HTTP` in the tunnel's public hostname config, not `HTTPS`
3. If the local service requires HTTPS, set the service type to `HTTPS` and enable **No TLS Verify** under the public hostname's advanced settings

### DNS propagation delay

**Symptom:** The hostname returns a DNS resolution error immediately after adding a public hostname.

**Fix:** Cloudflare creates DNS records automatically when you add a public hostname, but propagation takes 1-5 minutes. Wait and retry. If the record does not appear after 10 minutes:
1. Check **DNS > Records** in the Cloudflare dashboard — there should be a CNAME record pointing to your tunnel UUID
2. If missing, delete the public hostname and re-add it
3. Ensure the domain's nameservers are actually pointing to Cloudflare

### Tunnel goes offline intermittently

**Symptom:** The tunnel alternates between Healthy and Degraded/Down status.

**Fix:**
1. Check server resource usage — `cloudflared` itself uses minimal resources, but if the host is under heavy load, connections may drop
2. Check for network instability between your server and Cloudflare:
```bash
docker logs cloudflared --tail 50
```
Look for `Retrying connection` messages. Frequent retries indicate network issues.
3. Ensure `--no-autoupdate` is in the command — without it, `cloudflared` may attempt to update itself inside the container and fail
4. If running on a VPS with unreliable networking, consider adding `restart: unless-stopped` (already in our Compose file) to recover automatically

## Resource Requirements

- **RAM:** 30-50 MB under normal operation
- **CPU:** Minimal. The daemon proxies traffic but does not process it. CPU usage scales linearly with throughput — negligible for typical self-hosting traffic.
- **Disk:** No persistent storage required for token-based auth. The container image itself is approximately 35 MB.
- **Network:** Outbound-only. Uses ports 443 (HTTPS) and 7844 (QUIC) to Cloudflare's edge. No inbound ports needed.

## Verdict

Cloudflare Tunnel is the easiest way to expose self-hosted services to the internet. No port forwarding, no dynamic DNS, no SSL certificate management, no firewall rules. It works behind CGNAT, which eliminates the biggest barrier for self-hosters on residential ISPs. It is free with no usage limits.

The trade-off is straightforward: all your traffic routes through Cloudflare. They terminate TLS at their edge, which means they can technically inspect your traffic. For most self-hosting use cases — a Jellyfin server, a Nextcloud instance, a wiki — this is an acceptable trade-off in exchange for the simplicity. If the idea of a third party in the middle of your traffic bothers you, run [WireGuard](/apps/wireguard/) or [Tailscale](/apps/tailscale/) instead and access services directly over a VPN.

For LAN-only access (you only need to reach services from your own devices), Cloudflare Tunnel is overkill. Use [Tailscale](/apps/tailscale/) or [WireGuard](/apps/wireguard/) — they create a private mesh network without exposing anything to the public internet.

For public-facing services where you want anyone on the internet to reach them, Cloudflare Tunnel is the best free option available.

## FAQ

### Is Cloudflare Tunnel free?

Yes. Cloudflare Tunnel is free with no bandwidth limits, no connection limits, and no time limits. Cloudflare Access (the authentication layer) is also free for up to 50 users. There is no paid tier required for basic tunnel functionality.

### Can Cloudflare see my traffic?

Cloudflare terminates TLS at their edge and re-encrypts the connection to your origin. This means they technically *can* inspect unencrypted traffic between their edge and your server. For self-hosted services over HTTP internally, Cloudflare can see the data in transit. For most users this is acceptable, but if you handle highly sensitive data, consider end-to-end encryption or a direct VPN like [WireGuard](/apps/wireguard/).

### Cloudflare Tunnel vs Tailscale — which should I use?

They solve different problems. Cloudflare Tunnel makes services available to **anyone on the internet** (with optional access controls). [Tailscale](/apps/tailscale/) makes services available only to **your devices** on a private mesh network. Use Cloudflare Tunnel when you want public access (a blog, a file sharing link, a public-facing app). Use Tailscale when you want private access (your personal Jellyfin, your Home Assistant dashboard). You can use both simultaneously.

### Can I run multiple services on one tunnel?

Yes. A single tunnel supports unlimited public hostnames. Each hostname maps to a different local service. You do not need a separate tunnel or `cloudflared` instance per service. One container handles all of them.

### Does Cloudflare Tunnel work with non-HTTP services?

Yes. Cloudflare Tunnel supports TCP and UDP services in addition to HTTP/HTTPS. You can tunnel SSH, RDP, databases, and other protocols. Non-HTTP services require the WARP client or `cloudflared access` on the client side — they cannot be accessed through a browser directly.

## Related

- [Best Self-Hosted VPN & Remote Access](/best/vpn/)
- [How to Self-Host WireGuard](/apps/wireguard/)
- [How to Self-Host Tailscale](/apps/tailscale/)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard/)
- [How to Set Up Nginx Proxy Manager](/apps/nginx-proxy-manager/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Replace NordVPN with Self-Hosted VPN](/replace/nordvpn/)
