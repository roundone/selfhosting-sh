---
title: "Self-Hosted Alternatives to ngrok"
description: "Replace ngrok with self-hosted tunneling. Compare Cloudflare Tunnel, frp, and Tailscale Funnel for exposing local services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - cloudflare-tunnel
  - tailscale
tags:
  - alternative
  - ngrok
  - self-hosted
  - replace
  - tunneling
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Why Replace ngrok?

**Cost.** ngrok's free tier limits you to one agent, one domain (random subdomain), and rate-limited connections. The personal plan is $8/month, and the pro plan is $20/month. Self-hosted tunneling alternatives are free.

**Ephemeral URLs.** Free ngrok URLs change every time you restart the tunnel. Paid plans get stable domains, but you're paying for what self-hosted tools provide for free.

**Rate limits.** The free tier limits connections per minute and bandwidth. Hit the limit during a demo or webhook test and your tunnel goes down at the worst possible time.

**Privacy.** ngrok routes all traffic through their servers. They can see your traffic metadata and enforce content policies. Cloudflare Tunnel and self-hosted alternatives keep more control in your hands.

**Vendor lock-in.** ngrok's proprietary protocol means your configuration is tied to their service. Self-hosted alternatives use standard protocols and can be swapped without changing your application.

## Best Alternatives

### Cloudflare Tunnel — Best Overall Replacement

[Cloudflare Tunnel](/apps/cloudflare-tunnel) creates an encrypted outbound connection from your server to Cloudflare's edge network. It provides a stable public URL for any local service — no port forwarding, no dynamic DNS, no public IP required. Completely free for unlimited tunnels and bandwidth.

**What you get:** Stable public URLs with your own domain, automatic SSL, DDoS protection, Cloudflare Access integration for authentication, web application firewall. All free.

**Best for:** Anyone exposing self-hosted services to the internet permanently. Webhooks, web apps, APIs — with a custom domain and enterprise-grade protection at no cost.

**Requirements:** A Cloudflare account and a domain managed by Cloudflare (free plan works).

[Read our full guide: [How to Set Up Cloudflare Tunnel](/apps/cloudflare-tunnel)]

### frp (Fast Reverse Proxy) — Best Fully Self-Hosted

[frp](https://github.com/fatedier/frp) is a self-hosted reverse proxy that exposes local services through a server you control. You run `frps` (server) on a VPS with a public IP and `frpc` (client) on your local machine. It supports TCP, UDP, HTTP, and HTTPS tunneling with custom domains.

**What you get:** Full control over the tunnel infrastructure. Custom domains, TCP/UDP tunneling, dashboard UI, authentication, and encryption. 85,000+ GitHub stars.

**Best for:** Users who want zero dependency on any third-party service (not even Cloudflare). Ideal for TCP/UDP tunneling that Cloudflare Tunnel doesn't support.

**Docker setup (server):**

```yaml
services:
  frps:
    image: snowdreamtech/frps:0.62.1
    container_name: frps
    restart: unless-stopped
    ports:
      - "7000:7000"     # frp server port
      - "7500:7500"     # Dashboard
      - "80:80"         # HTTP proxy
      - "443:443"       # HTTPS proxy
    volumes:
      - ./frps.toml:/etc/frp/frps.toml
```

### Tailscale Funnel — Best for Quick Sharing

Tailscale Funnel allows you to expose a local service to the public internet through Tailscale's network. It assigns a stable `https://[hostname].[tailnet].ts.net` URL to your service. No server setup required — just enable Funnel on your Tailscale node.

**What you get:** Instant public HTTPS URLs for local services. No configuration beyond enabling the feature. Uses Tailscale's infrastructure for hosting.

**Best for:** Quick demos, webhook testing, temporary public access. Not ideal for production workloads due to bandwidth limits and the ts.net domain.

**Trade-offs:** Tailscale-specific domain (not custom domains). Bandwidth limitations on free tier. Requires Tailscale installed.

### Rathole — Best Lightweight Alternative

[Rathole](https://github.com/rapiz1/rathole) is a lightweight, high-performance reverse proxy tunnel written in Rust. It's designed as a simpler, faster alternative to frp with lower resource usage. Supports TCP and UDP tunneling with noise protocol encryption.

**What you get:** Minimal resource usage (~2 MB binary, ~5 MB RAM), noise protocol encryption, hot-reload configuration. No dashboard — pure CLI configuration.

**Best for:** Users who want the simplest possible tunneling solution with minimal overhead. Great for embedded devices or VPS with very limited resources.

## Migration Guide

### For Permanent Service Exposure

1. Set up [Cloudflare Tunnel](/apps/cloudflare-tunnel) (30 minutes)
2. Point your domain's DNS to Cloudflare (if not already)
3. Create a tunnel and configure routes to your local services
4. Update any webhook URLs or DNS records to your new domain
5. Remove ngrok configuration

### For Development/Testing Tunnels

1. Install Tailscale and enable Funnel, or deploy frp
2. Update webhook configurations to use your new tunnel URL
3. Remove ngrok from your development environment

### For TCP/UDP Tunneling (Game Servers, Custom Protocols)

1. Deploy frp or Rathole on a VPS
2. Configure the client on your local machine
3. Update connection endpoints to your VPS IP/domain
4. Remove ngrok

## Cost Comparison

| | ngrok (Pro) | Cloudflare Tunnel | frp (Self-Hosted) | Tailscale Funnel |
|---|------------|------------------|-------------------|-----------------|
| Monthly cost | $20/mo | $0 | $3-5/mo (VPS) | $0 |
| Annual cost | $240/yr | $0 | $36-60/yr | $0 |
| Custom domain | Yes (paid) | Yes (free) | Yes | No (ts.net only) |
| SSL/TLS | Automatic | Automatic | Manual or via proxy | Automatic |
| Bandwidth | Limited (plan) | Unlimited | Your VPS bandwidth | Limited |
| TCP tunneling | Yes | No (HTTP/HTTPS only) | Yes | No |
| UDP tunneling | Yes | No | Yes | No |
| DDoS protection | No | Yes (Cloudflare) | No | No |
| Auth integration | Yes (paid) | Yes (Cloudflare Access) | Basic | Tailscale ACLs |
| Concurrent tunnels | Plan-limited | Unlimited | Unlimited | Limited |

## What You Give Up

- **ngrok's inspect/replay UI.** ngrok's web inspector lets you see, replay, and modify HTTP requests. It's an excellent debugging tool. Cloudflare Tunnel doesn't have this — use browser dev tools or a local proxy instead.
- **One-line setup.** `ngrok http 3000` is hard to beat for simplicity. Cloudflare Tunnel requires initial domain setup; frp requires server deployment.
- **ngrok's edge features.** Request/response transformation, OAuth integration, IP restrictions — all built into ngrok's paid plans. Cloudflare offers some of these through Cloudflare Access.
- **Wildcard domains on free tier.** ngrok's paid plans support wildcard subdomains. Cloudflare Tunnel supports this too, but frp requires more configuration.

## FAQ

### Can Cloudflare Tunnel replace ngrok for development?

For HTTP/HTTPS services, yes. It provides stable URLs with your own domain, automatic SSL, and no bandwidth limits. For TCP/UDP tunneling or the inspect/replay features, you'll need frp or a dedicated tool.

### Is frp hard to set up?

Not particularly. Deploy the server on a VPS (single Docker container), configure your `frpc.toml` client config, and you're running. The main effort is the initial VPS setup.

### Can I use Cloudflare Tunnel without a domain?

No. You need a domain managed by Cloudflare. Domains are cheap ($10-15/year for a .com) and Cloudflare's domain registration is at-cost (no markup).

### What about Bore, Localtunnel, or Serveo?

These are simpler alternatives to ngrok but share the same fundamental issue — dependency on someone else's infrastructure. If you're replacing ngrok for reliability and control, go self-hosted with Cloudflare Tunnel or frp.

## Related

- [How to Set Up Cloudflare Tunnel](/apps/cloudflare-tunnel)
- [How to Set Up Tailscale with Docker](/apps/tailscale)
- [How to Self-Host WireGuard](/apps/wireguard)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard)
- [Best Self-Hosted VPN Solutions](/best/vpn)
- [Self-Hosted Alternatives to NordVPN](/replace/nordvpn)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
