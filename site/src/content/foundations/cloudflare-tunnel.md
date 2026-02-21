---
title: "Cloudflare Tunnel Setup Guide"
description: "Expose self-hosted services to the internet securely with Cloudflare Tunnel — no port forwarding, free DDoS protection, and automatic HTTPS."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["cloudflare", "tunnel", "remote-access", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Cloudflare Tunnel?

Cloudflare Tunnel (formerly Argo Tunnel) creates an encrypted outbound connection from your server to Cloudflare's edge network. External users connect to Cloudflare, which proxies traffic to your server through the tunnel. No inbound ports need to be open on your router.

This solves the three biggest problems with traditional port forwarding: you don't need to open ports, your home IP stays hidden, and you get free DDoS protection.

## Prerequisites

- A domain name with DNS managed by Cloudflare (free tier works)
- A self-hosted server running Linux ([Getting Started](/foundations/getting-started/))
- Docker installed ([Docker Compose Basics](/foundations/docker-compose-basics/))
- At least one web service running to expose

## Cloudflare Tunnel vs Alternatives

| Feature | Port Forwarding | Cloudflare Tunnel | Tailscale |
|---------|----------------|-------------------|-----------|
| Public access | Yes | Yes | No (private only) |
| Open ports needed | Yes | No | No |
| Hides home IP | No | Yes | N/A |
| DDoS protection | No | Yes (free) | N/A |
| HTTPS | You manage (Let's Encrypt) | Automatic | Automatic (private) |
| Non-HTTP support | Yes | Limited (SSH, RDP via WARP) | Yes (all protocols) |
| Speed | Direct | Via Cloudflare (+10-30ms) | Direct |
| Cost | Free | Free | Free (personal) |

**Use Cloudflare Tunnel for:** Public-facing web services (Nextcloud, Gitea, blogs).
**Use Tailscale for:** Private access to all services. See [Tailscale Setup](/foundations/tailscale-setup/).

## Setup: Docker Method (Recommended)

### Step 1: Create a Tunnel

1. Go to [Cloudflare Zero Trust dashboard](https://one.dash.cloudflare.com/)
2. Navigate to Networks → Tunnels
3. Click "Create a tunnel"
4. Choose "Cloudflared" connector
5. Name your tunnel (e.g., "homelab")
6. Copy the tunnel token

### Step 2: Run cloudflared in Docker

```yaml
# docker-compose.yml
services:
  cloudflared:
    image: cloudflare/cloudflared:2024.12.2
    command: tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN
    restart: unless-stopped
    network_mode: host
```

Replace `YOUR_TUNNEL_TOKEN` with the token from step 1.

```bash
docker compose up -d
```

Using `network_mode: host` lets cloudflared reach services on `localhost`. Alternatively, connect it to Docker networks:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:2024.12.2
    command: tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN
    networks:
      - webapps
    restart: unless-stopped

networks:
  webapps:
    external: true
```

### Step 3: Configure Public Hostnames

In the Cloudflare Zero Trust dashboard, under your tunnel's configuration:

1. Click "Public Hostname"
2. Add entries for each service:

| Subdomain | Domain | Service | URL |
|-----------|--------|---------|-----|
| cloud | yourdomain.com | HTTP | `localhost:8080` |
| media | yourdomain.com | HTTP | `localhost:8096` |
| git | yourdomain.com | HTTP | `localhost:3000` |

Cloudflare automatically:
- Creates DNS records for these subdomains
- Provides HTTPS certificates
- Routes traffic through the tunnel

### Step 4: Verify

```bash
# Check tunnel is connected
docker compose logs cloudflared

# Test from outside your network
curl -I https://cloud.yourdomain.com
```

## Setup: CLI Method (Alternative)

If you prefer configuring via files instead of the dashboard:

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create homelab

# Configure
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: cloud.yourdomain.com
    service: http://localhost:8080
  - hostname: media.yourdomain.com
    service: http://localhost:8096
  - hostname: git.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
EOF

# Create DNS records
cloudflared tunnel route dns homelab cloud.yourdomain.com
cloudflared tunnel route dns homelab media.yourdomain.com
cloudflared tunnel route dns homelab git.yourdomain.com

# Run
cloudflared tunnel run homelab
```

## Configuration Tips

### Connecting to Docker Services

If cloudflared runs in Docker (not host network mode), connect it to the same Docker network as your services:

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:2024.12.2
    command: tunnel --no-autoupdate run --token YOUR_TOKEN
    networks:
      - proxy
    restart: unless-stopped

  nextcloud:
    image: nextcloud:29.0
    networks:
      - proxy
    restart: unless-stopped

networks:
  proxy:
```

In the tunnel config, use the Docker service name: `http://nextcloud:80` instead of `http://localhost:8080`.

### Handling HTTPS Backend Services

If your service already uses HTTPS (self-signed cert):

In the dashboard, set the service URL to `https://localhost:PORT` and enable "No TLS Verify" under Additional Application Settings → TLS.

### WebSocket Support

Cloudflare Tunnel supports WebSockets automatically. Apps like Nextcloud, Vaultwarden, and code servers work without additional configuration.

### Access Policies (Zero Trust)

Add authentication before Cloudflare forwards traffic to your services:

1. In Zero Trust dashboard → Access → Applications
2. Add an application
3. Set a policy (e.g., only allow your email address)
4. Users must authenticate via Cloudflare before reaching your service

This adds an authentication layer in front of your self-hosted apps — useful for services that don't have strong built-in auth.

## Multiple Services, One Tunnel

A single tunnel handles many services. Each gets its own subdomain:

| Subdomain | Service |
|-----------|---------|
| cloud.yourdomain.com | Nextcloud |
| vault.yourdomain.com | Vaultwarden |
| media.yourdomain.com | Jellyfin |
| git.yourdomain.com | Gitea |
| dash.yourdomain.com | Homepage |

All routes through one cloudflared container. Add more services in the dashboard at any time.

## Monitoring Tunnel Health

```bash
# Check tunnel status via API
cloudflared tunnel info homelab

# Check connector logs
docker compose logs -f cloudflared

# Verify from Cloudflare dashboard
# Zero Trust → Networks → Tunnels → Status should show "Healthy"
```

## Common Mistakes

### 1. Not Using network_mode: host When Services Are on Localhost

If cloudflared runs in a Docker container with default networking, `localhost` means the container itself — not the host. Either use `network_mode: host` or connect cloudflared to the same Docker network as your services.

### 2. Forgetting the Catch-All Ingress Rule

The CLI config file requires a catch-all rule at the bottom:

```yaml
ingress:
  - hostname: cloud.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404   # ← Required catch-all
```

### 3. Not Realizing Cloudflare Sees Your Traffic

Cloudflare terminates TLS. They decrypt, inspect, and re-encrypt traffic to your server. This is by design (it's how CDN/proxy works). For most self-hosters this is fine, but for maximum privacy, use Tailscale or direct WireGuard.

### 4. Exposing Services That Shouldn't Be Public

Don't expose database management tools (Adminer, phpMyAdmin), Docker management (Portainer), or anything without authentication through a tunnel. Use Cloudflare Access policies or Tailscale for admin interfaces.

### 5. Using Cloudflare Tunnel for Non-HTTP Services

Cloudflare Tunnel is optimized for HTTP/HTTPS. For SSH access, use Tailscale or WireGuard. For gaming servers, media streaming (RTSP), or other non-HTTP protocols, use port forwarding or a VPN.

## FAQ

### Is Cloudflare Tunnel free?

Yes. The tunnel itself is completely free. You need a domain on Cloudflare (also free to add). Cloudflare Access (authentication layer) has a free tier of 50 users.

### Does it work with CGNAT?

Yes. Since the tunnel is outbound-only, CGNAT doesn't matter. This is one of the biggest advantages over port forwarding.

### Will Cloudflare slow down my services?

Slightly. Traffic goes through Cloudflare's nearest data center, adding 10–30ms latency. For web apps, this is barely noticeable. For real-time streaming, it may matter.

### Can I use Cloudflare Tunnel without a custom domain?

No. You need a domain with DNS on Cloudflare. Domains cost ~$10/year. There's no equivalent of DuckDNS for Cloudflare Tunnel.

### What happens if Cloudflare has an outage?

Your services become unreachable from the internet. This is the trade-off of routing through a third party. For critical services, consider having Tailscale as a backup access method.

## Next Steps

- [Tailscale Setup](/foundations/tailscale-setup/) — private access alternative
- [Port Forwarding Guide](/foundations/port-forwarding/) — direct access comparison
- [SSL Certificates](/foundations/ssl-certificates/) — understand HTTPS

## Related

- [Port Forwarding for Self-Hosting](/foundations/port-forwarding/)
- [Tailscale Setup](/foundations/tailscale-setup/)
- [DNS Explained](/foundations/dns-explained/)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained/)
- [Dynamic DNS Setup](/foundations/dynamic-dns/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
