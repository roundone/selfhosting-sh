---
title: "Reverse Proxy Explained: Why You Need One for Self-Hosting"
type: "foundation"
topic: "reverse-proxy"
difficulty: "beginner"
datePublished: 2026-02-14
dateUpdated: 2026-02-14
description: "What a reverse proxy is, why self-hosting needs one, and how to set up HTTPS for your services."
prerequisites: ["docker-compose-basics"]
---

## What is a Reverse Proxy?

A reverse proxy sits between the internet and your self-hosted services. Instead of accessing `http://192.168.1.100:8096` for Jellyfin and `http://192.168.1.100:2283` for Immich, you access `https://jellyfin.yourdomain.com` and `https://immich.yourdomain.com`. One entry point, clean URLs, and HTTPS encryption for everything.

## Why You Need One

Without a reverse proxy, accessing your services means:
- Remembering IP addresses and port numbers
- No HTTPS (your traffic is unencrypted)
- Exposing multiple ports on your firewall
- Some apps (like Vaultwarden) won't work without HTTPS

With a reverse proxy:
- **HTTPS everywhere** with free Let's Encrypt certificates
- **Clean URLs** — `photos.yourdomain.com` instead of `192.168.1.100:2283`
- **One open port** — only 80 and 443, the proxy routes traffic to the right service
- **Security** — the proxy can add headers, rate limiting, and access control

## How It Works

```
Internet → Port 443 → Reverse Proxy → Service A (port 8096)
                                     → Service B (port 2283)
                                     → Service C (port 8080)
```

The proxy inspects the domain name in each request and forwards it to the correct internal service.

## The Three Main Options

### 1. Nginx Proxy Manager (Recommended for Beginners)

A web UI on top of Nginx. Point, click, get SSL certificates. No config files needed.

**Best for:** Most self-hosters. The web UI makes it accessible to anyone.

[Nginx Proxy Manager setup guide →](/apps/nginx-proxy-manager/)

### 2. Caddy

A web server with automatic HTTPS built in. Define your sites in a simple `Caddyfile`.

**Best for:** People comfortable with config files who want the simplest possible configuration.

```
jellyfin.yourdomain.com {
    reverse_proxy 192.168.1.100:8096
}

immich.yourdomain.com {
    reverse_proxy 192.168.1.100:2283
}
```

[Caddy setup guide →](/apps/caddy/)

### 3. Traefik

An advanced reverse proxy with automatic Docker service discovery. It detects new containers and configures routes via labels.

**Best for:** Advanced users with many services who want automated routing.

[Traefik setup guide →](/apps/traefik/)

See our detailed comparison: [NPM vs Traefik](/compare/nginx-proxy-manager-vs-traefik/) | [Traefik vs Caddy](/compare/traefik-vs-caddy/)

## Prerequisites for HTTPS

To get HTTPS certificates, you need:

1. **A domain name** — buy one from Cloudflare, Namecheap, or any registrar (~$10-15/year for a `.com`).
2. **DNS pointed to your server** — create an A record pointing to your public IP.
3. **Ports 80 and 443 forwarded** — on your router, forward these ports to your reverse proxy server.

### Alternative: Cloudflare Tunnel

If you can't forward ports (strict ISP, CGNAT), [Cloudflare Tunnel](/apps/cloudflare-tunnel/) lets you expose services without opening any ports. It tunnels traffic through Cloudflare's network.

### Alternative: VPN

If you don't need public access, use [WireGuard](/apps/wireguard/) or [Tailscale](/apps/tailscale/) to access services remotely over a VPN. No reverse proxy needed for VPN-only access.

## Setting Up Your First Reverse Proxy

The fastest path for beginners:

1. **Install [Nginx Proxy Manager](/apps/nginx-proxy-manager/)** via Docker Compose.
2. **Point your domain's DNS** to your public IP (A record).
3. **Forward ports 80 and 443** on your router.
4. **Add a proxy host** in NPM for each service.
5. **Request an SSL certificate** — one click in the NPM interface.

That's it. Your services are now accessible over HTTPS at clean URLs.

## Common Patterns

### Subdomain per service
```
jellyfin.yourdomain.com → Jellyfin
immich.yourdomain.com → Immich
vault.yourdomain.com → Vaultwarden
```

This is the most common approach. Each service gets its own subdomain.

### Path-based routing
```
yourdomain.com/jellyfin → Jellyfin
yourdomain.com/immich → Immich
```

Less common and not supported by all apps. Subdomain routing is preferred.

## Next Steps

- Set up your reverse proxy: [Nginx Proxy Manager](/apps/nginx-proxy-manager/) | [Caddy](/apps/caddy/) | [Traefik](/apps/traefik/)
- Get SSL certificates: [SSL guide](/foundations/ssl-certificates/)
- Secure access: [Remote access guide](/foundations/remote-access/)
- Set up a domain: [Domain setup guide](/foundations/domain-setup/)
