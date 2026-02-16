---
title: "HTTPS for Every Self-Hosted Service"
description: "Complete https setup self-hosted guide — reverse proxy auto-SSL, Cloudflare Tunnel, Let's Encrypt, and local CA options to encrypt every service."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "https", "ssl", "tls", "security"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why HTTPS Matters

Every self-hosted service you run should use HTTPS. No exceptions. HTTP sends passwords, session tokens, and personal data in plain text across the network. Anyone on the same network segment — or between you and the server — can read it.

Beyond security, HTTPS is a practical requirement. Modern browsers flag HTTP sites as "Not Secure." Progressive Web Apps, WebAuthn (passkeys), clipboard access, and geolocation APIs all require a secure context. Some self-hosted apps refuse to function over plain HTTP. Google uses HTTPS as a ranking signal.

The excuse that "it's only on my local network" does not hold up. Other devices on your LAN can sniff traffic. Guest Wi-Fi users, compromised IoT devices, and anyone with temporary network access can see everything sent over HTTP. Encrypt it all.

## Prerequisites

- A Linux server with Docker and Docker Compose installed ([Docker Compose Basics](/foundations/docker-compose-basics))
- At least one self-hosted service running that you want to secure
- A domain name (for public-facing services) with DNS records configured ([DNS Explained](/foundations/dns-explained))
- Basic terminal familiarity ([Getting Started](/foundations/getting-started))

For internal-only services, you do not need a public domain — see the "HTTPS for Internal Services" section below.

## How HTTPS Works

HTTPS wraps HTTP inside a TLS (Transport Layer Security) encrypted connection. Here is the handshake, simplified:

1. **Client Hello** — your browser connects to `https://photos.example.com` and sends supported TLS versions and cipher suites
2. **Server Hello** — the server responds with its [SSL certificate](/foundations/ssl-certificates) and chosen cipher suite
3. **Certificate Verification** — the browser checks that the certificate is signed by a trusted Certificate Authority (CA), is not expired, and matches the domain name
4. **Key Exchange** — browser and server perform a Diffie-Hellman key exchange to agree on a shared encryption key without transmitting it
5. **Encrypted Session** — all subsequent data is encrypted with the shared key

This happens in milliseconds. The performance cost is negligible on modern hardware.

Certificates expire — 90 days for [Let's Encrypt](/foundations/lets-encrypt-explained), up to 13 months for paid CAs. Automation handles renewal so you never think about it.

## Option 1: Reverse Proxy with Auto-SSL (Recommended)

The best approach for public-facing services: run a [reverse proxy](/foundations/reverse-proxy-explained) that handles HTTPS termination and automatic certificate management for all your apps. One proxy, one certificate workflow, every service secured.

### Caddy — Simplest Option

[Caddy](/foundations/caddy-setup) obtains and renews Let's Encrypt certificates automatically with zero SSL configuration. Specify a domain name and Caddy does the rest.

Create a `Caddyfile`:

```
photos.example.com {
    reverse_proxy immich-server:2283
}

cloud.example.com {
    reverse_proxy nextcloud:80
}

media.example.com {
    reverse_proxy jellyfin:8096
}
```

Docker Compose for Caddy:

```yaml
services:
  caddy:
    image: caddy:2.9.1-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"    # Required for HTTP-01 challenge and HTTP→HTTPS redirect
      - "443:443"
      - "443:443/udp"  # HTTP/3 (QUIC)
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data       # Certificate storage
      - caddy-config:/config
    networks:
      - proxy

volumes:
  caddy-data:
  caddy-config:

networks:
  proxy:
    external: true
```

Start it:

```bash
docker compose up -d
```

Caddy detects the domain names, issues Let's Encrypt certificates via HTTP-01 challenge, redirects HTTP to HTTPS, and renews certificates before expiry. That is the entire setup.

For DNS-01 challenges (wildcards, or when port 80 is blocked), use the Cloudflare module:

```
*.example.com {
    tls {
        dns cloudflare {env.CF_API_TOKEN}
    }
    @photos host photos.example.com
    handle @photos {
        reverse_proxy immich-server:2283
    }
    @cloud host cloud.example.com
    handle @cloud {
        reverse_proxy nextcloud:80
    }
}
```

See the full [Caddy setup guide](/foundations/caddy-setup) for details.

### Nginx Proxy Manager — Best GUI Option

[Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup) handles HTTPS through a web interface. No config files to write.

```yaml
services:
  npm:
    image: jc21/nginx-proxy-manager:2.13.7
    container_name: npm
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"   # Admin UI
    volumes:
      - npm-data:/data
      - npm-letsencrypt:/etc/letsencrypt
    networks:
      - proxy

volumes:
  npm-data:
  npm-letsencrypt:

networks:
  proxy:
    external: true
```

After deploying, access `http://your-server-ip:81`, log in (default: `admin@example.com` / `changeme`), add a proxy host for each service, and enable SSL in the SSL tab. Check "Force SSL" and "HTTP/2 Support." NPM handles certificate issuance and renewal.

See the full [Nginx Proxy Manager guide](/foundations/nginx-proxy-manager-setup).

### Traefik — Docker-Native Auto-Discovery

Traefik detects services via Docker labels. Add labels to each app's `docker-compose.yml` and Traefik automatically creates routes and obtains certificates.

Core Traefik config (`traefik.yml`):

```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    exposedByDefault: false

certificatesResolvers:
  letsencrypt:
    acme:
      email: you@example.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

Label a service to enable HTTPS routing:

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/server:v1.134.0
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.immich.rule=Host(`photos.example.com`)"
      - "traefik.http.routers.immich.entrypoints=websecure"
      - "traefik.http.routers.immich.tls.certresolver=letsencrypt"
      - "traefik.http.services.immich.loadbalancer.server.port=2283"
```

Traefik is more complex upfront but powerful for large deployments. Each new service only needs labels — no proxy config changes.

### Which Reverse Proxy to Pick

| Factor | Caddy | Nginx Proxy Manager | Traefik |
|--------|-------|-------------------|---------|
| Simplest config | Yes | GUI-based | No |
| Auto HTTPS | Zero-config | Click SSL tab | Labels + resolver config |
| Learning curve | Low | Lowest | Moderate |
| Best for | Config file users | GUI users | Docker-heavy setups |
| Wildcard certs | DNS plugin | DNS challenge UI | DNS resolver config |

**The recommendation:** Use Caddy if you are comfortable with config files. Use Nginx Proxy Manager if you want a GUI. Use Traefik if you run dozens of containers and want label-based auto-discovery. All three handle HTTPS automatically — the difference is operational preference.

## Option 2: Cloudflare Tunnel (Zero Port Forwarding)

[Cloudflare Tunnel](/foundations/cloudflare-tunnel) creates an outbound encrypted connection from your server to Cloudflare's edge. No ports need to be open on your router. Cloudflare handles HTTPS on the public side and proxies traffic to your server through the tunnel.

```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:2025.2.1
    container_name: cloudflared
    restart: unless-stopped
    command: tunnel run
    environment:
      - TUNNEL_TOKEN=your-tunnel-token-here  # From Cloudflare Zero Trust dashboard
    networks:
      - proxy

networks:
  proxy:
    external: true
```

Configure public hostnames in the Cloudflare Zero Trust dashboard:

| Public hostname | Service | URL |
|----------------|---------|-----|
| photos.example.com | HTTP | immich-server:2283 |
| cloud.example.com | HTTP | nextcloud:80 |
| media.example.com | HTTP | jellyfin:8096 |

Cloudflare handles SSL on the public side. Traffic between Cloudflare and your `cloudflared` daemon is encrypted through the tunnel. Traffic from `cloudflared` to your containers can be plain HTTP because it stays on the Docker network.

**When to use this:** You are behind CGNAT (carrier-grade NAT) and cannot forward ports. Your ISP blocks ports 80/443. You want to hide your home IP. You want free DDoS protection.

**Trade-offs:** Your traffic routes through Cloudflare's servers. You depend on Cloudflare's availability. Some self-hosted purists object to this on principle. Cloudflare's free tier works for personal use but has Terms of Service restrictions on serving large media files.

See the full [Cloudflare Tunnel guide](/foundations/cloudflare-tunnel).

## Option 3: Let's Encrypt with Certbot (Manual)

If you run services directly on the host (not behind a reverse proxy), you can use Certbot standalone to obtain and renew certificates.

Install Certbot:

```bash
sudo apt update
sudo apt install certbot
```

Obtain a certificate (HTTP-01 challenge — port 80 must be open and available):

```bash
sudo certbot certonly --standalone -d photos.example.com --agree-tos -m you@example.com
```

Certbot creates certificates at:
- **Certificate:** `/etc/letsencrypt/live/photos.example.com/fullchain.pem`
- **Private key:** `/etc/letsencrypt/live/photos.example.com/privkey.pem`

Set up automatic renewal:

```bash
# Certbot installs a systemd timer by default. Verify it:
sudo systemctl status certbot.timer

# Test renewal:
sudo certbot renew --dry-run
```

Mount the certificates into your Docker container:

```yaml
services:
  myapp:
    image: myapp:latest
    volumes:
      - /etc/letsencrypt/live/photos.example.com/fullchain.pem:/certs/cert.pem:ro
      - /etc/letsencrypt/live/photos.example.com/privkey.pem:/certs/key.pem:ro
    environment:
      - SSL_CERT=/certs/cert.pem
      - SSL_KEY=/certs/key.pem
```

**This approach is not recommended for most people.** A reverse proxy with auto-SSL is simpler, handles multiple services, and does not require you to manage certificate paths and renewal hooks per application. Use Certbot standalone only if you have a single service and a specific reason to avoid a reverse proxy.

For a deep dive on Let's Encrypt, see [Let's Encrypt Explained](/foundations/lets-encrypt-explained).

## Option 4: Self-Signed Certificates (Internal Only)

Self-signed certificates encrypt traffic but are not trusted by browsers — users see a full-page security warning. Use them only for internal services where installing a custom CA is impractical and you need encryption without trust verification.

Generate a self-signed certificate with OpenSSL:

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/CN=myservice.local" \
  -addext "subjectAltName=DNS:myservice.local,IP:192.168.1.50"
```

The `-addext` flag adds a Subject Alternative Name, which modern browsers require. Without it, the certificate is rejected even after trusting it.

**Do not use self-signed certificates for anything you access regularly.** The browser warnings train you to click through security prompts, which is the opposite of good security practice. Use a local CA (next section) or a real domain with Let's Encrypt instead.

## HTTPS for Internal Services

Services that never face the internet still benefit from HTTPS. Two good approaches:

### Tailscale HTTPS (Easiest)

[Tailscale](/foundations/tailscale-setup) provides built-in HTTPS for devices on your tailnet. Enable the HTTPS feature and Tailscale issues certificates from its own CA, trusted by Let's Encrypt.

```bash
# Enable HTTPS certificates on a Tailscale node
tailscale cert myserver.tail-abcde.ts.net
```

This generates valid certificates for `myserver.tail-abcde.ts.net`. No port forwarding, no public DNS, no manual CA installation. Services accessible over Tailscale get free, trusted HTTPS.

Use Tailscale HTTPS when: you already use Tailscale for remote access and want HTTPS on internal services without managing certificates.

### Local CA with mkcert (Best for Homelab)

[mkcert](https://github.com/FiloSottile/mkcert) creates a local Certificate Authority and issues certificates trusted by your machine. Install the CA on every device that accesses your services.

```bash
# Install mkcert
curl -L https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-linux-amd64 \
  -o /usr/local/bin/mkcert
chmod +x /usr/local/bin/mkcert

# Create and install the local CA
mkcert -install

# Generate certificates for your local domain
mkcert "*.home.lab" "home.lab"
# Creates: _wildcard.home.lab+1.pem and _wildcard.home.lab+1-key.pem
```

Point your reverse proxy at these certificates. Caddy example:

```
photos.home.lab {
    tls /certs/_wildcard.home.lab+1.pem /certs/_wildcard.home.lab+1-key.pem
    reverse_proxy immich-server:2283
}

cloud.home.lab {
    tls /certs/_wildcard.home.lab+1.pem /certs/_wildcard.home.lab+1-key.pem
    reverse_proxy nextcloud:80
}
```

To trust these certificates on other devices, copy the CA root certificate (`mkcert -CAROOT` shows the directory) and install it:
- **macOS:** Double-click the cert, add to System keychain, mark as Always Trust
- **Windows:** Double-click, Install Certificate, Trusted Root Certification Authorities
- **iOS:** AirDrop/email the cert, install profile, enable full trust in Settings > General > About > Certificate Trust Settings
- **Android:** Settings > Security > Install certificate from storage

Use mkcert when: you have a homelab with a local domain (like `*.home.lab`) and want trusted HTTPS without a public domain or internet access.

### Local DNS Setup

Both approaches above work best with a local DNS server that resolves your internal domain to your server's LAN IP. Use [Pi-hole](https://pi-hole.net/) or AdGuard Home as your DNS server and add local DNS records:

```
photos.home.lab  → 192.168.1.50
cloud.home.lab   → 192.168.1.50
media.home.lab   → 192.168.1.50
```

This keeps all internal traffic on the LAN instead of routing through the internet and back.

## Mixed Content Issues

After enabling HTTPS, you may encounter mixed content errors. This happens when an HTTPS page loads resources (scripts, images, API calls) over plain HTTP. Browsers block mixed active content (JavaScript, CSS) and warn about mixed passive content (images).

**Symptoms:**
- Broken functionality on an otherwise working app
- Browser console shows "Mixed Content" warnings
- Padlock icon shows a warning triangle

**Fixes:**

1. **Force HTTPS at the reverse proxy.** Redirect all HTTP to HTTPS so no HTTP URLs exist. Every reverse proxy option above does this by default.

2. **Configure the app's base URL.** Many self-hosted apps have a setting for their external URL. Set it to `https://`:

```
# Nextcloud: config/config.php
'overwrite.cli.url' => 'https://cloud.example.com',
'overwriteprotocol' => 'https',

# Immich: .env
IMMICH_SERVER_URL=https://photos.example.com

# Jellyfin: Dashboard > Networking
# Set "Known proxies" and "Public HTTPS port" to 443
```

3. **Set X-Forwarded-Proto header.** Your reverse proxy should send this header to tell the backend app that the original request was HTTPS. Caddy and Traefik do this automatically. For Nginx, add:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

## Testing Your HTTPS Setup

After configuring HTTPS, verify it works correctly.

### Browser Check

Visit your service URL. The browser should show a padlock icon with no warnings. Click the padlock to inspect the certificate — confirm it shows your domain, a valid expiry date, and the correct issuer (Let's Encrypt, Cloudflare, or your local CA).

### Command-Line Check

```bash
# Check certificate details
openssl s_client -connect photos.example.com:443 -servername photos.example.com </dev/null 2>/dev/null | openssl x509 -noout -dates -subject -issuer

# Expected output:
# notBefore=Feb 16 00:00:00 2026 GMT
# notAfter=May 17 00:00:00 2026 GMT
# subject=CN = photos.example.com
# issuer=C = US, O = Let's Encrypt, CN = R11
```

```bash
# Test HTTP→HTTPS redirect
curl -I http://photos.example.com
# Should return 301 or 308 with Location: https://photos.example.com/
```

```bash
# Test TLS version and cipher suite
nmap --script ssl-enum-ciphers -p 443 photos.example.com
```

### SSL Labs Test (Public Services)

For public-facing services, run the [SSL Labs Server Test](https://www.ssllabs.com/ssltest/). It checks your certificate chain, TLS versions, cipher suites, and known vulnerabilities. Aim for an A or A+ grade. All three reverse proxy options above score A+ with default settings.

## Common Mistakes

### Exposing services on HTTP "temporarily"

There is no temporary HTTP. You configure it, forget about it, and months later realize your Nextcloud login has been sending passwords in plain text. Set up HTTPS first, then deploy services behind it.

### Configuring HTTPS inside each container

Do not configure SSL certificates inside individual containers. Terminate TLS at your reverse proxy, then forward plain HTTP to containers on the internal Docker network. One certificate workflow, one renewal process, every service covered.

### Not redirecting HTTP to HTTPS

Having HTTPS available is not enough. If `http://photos.example.com` still works, users (and search engines) will use it. Configure your reverse proxy to redirect all HTTP requests to HTTPS. Caddy does this automatically. NPM has a "Force SSL" toggle. Traefik needs an entrypoint redirect (shown in the config above).

### Ignoring certificate renewal

Let's Encrypt certificates expire after 90 days. If renewal fails silently, your services break. After initial setup, verify renewal works:

```bash
# For Certbot:
sudo certbot renew --dry-run

# For reverse proxies: check logs for renewal activity
docker logs caddy 2>&1 | grep -i "certificate"
```

Set up monitoring with [Uptime Kuma](/apps/uptime-kuma) to alert you if HTTPS certificates are nearing expiry.

### Using port 8443 or other non-standard HTTPS ports

Browsers default to port 443 for HTTPS. Using non-standard ports means typing `https://photos.example.com:8443` every time. Use a reverse proxy on port 443 to avoid this.

## Next Steps

- Set up a [reverse proxy](/foundations/reverse-proxy-explained) if you have not already
- Learn about [SSL certificates](/foundations/ssl-certificates) in depth
- Understand [Let's Encrypt challenges and automation](/foundations/lets-encrypt-explained)
- Configure [Caddy](/foundations/caddy-setup) or [Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup) for your services
- Set up [Cloudflare Tunnel](/foundations/cloudflare-tunnel) if you cannot forward ports
- Use [Tailscale](/foundations/tailscale-setup) for secure internal access

## Related

- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [SSL Certificates for Self-Hosting](/foundations/ssl-certificates)
- [Let's Encrypt Explained](/foundations/lets-encrypt-explained)
- [Caddy Reverse Proxy Setup](/foundations/caddy-setup)
- [Nginx Proxy Manager Setup](/foundations/nginx-proxy-manager-setup)
- [Cloudflare Tunnel Setup](/foundations/cloudflare-tunnel)
- [Tailscale Setup](/foundations/tailscale-setup)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Firewall Setup with UFW](/foundations/firewall-ufw)

## FAQ

### Do I need a domain name to use HTTPS?

For public-facing services, yes — Let's Encrypt and other CAs issue certificates for domain names, not IP addresses. For internal-only services, no — use mkcert with a local domain (like `*.home.lab`) or Tailscale's built-in HTTPS, neither of which require a publicly registered domain.

### Can I use HTTPS without opening ports on my router?

Yes. Cloudflare Tunnel provides HTTPS with zero inbound ports. Tailscale provides HTTPS over its VPN mesh with zero port forwarding. Both are viable for self-hosters behind CGNAT or restrictive ISPs.

### Is the free Cloudflare plan enough for HTTPS on self-hosted services?

Yes. The free plan includes Cloudflare Tunnel, SSL termination, and DDoS protection. The main limitation is Cloudflare's Terms of Service, which restricts serving large amounts of non-HTML content (video streaming, large file downloads) through their proxy. For typical self-hosted apps — Nextcloud, Immich, Vaultwarden — the free plan works fine.

### Should I use HTTP between my reverse proxy and backend containers?

Yes. This is called SSL termination — the reverse proxy handles HTTPS on the public side and forwards plain HTTP to containers on the internal Docker network. This is standard practice. The Docker bridge network is isolated, so unencrypted traffic between the proxy and the container never leaves the host. Configuring HTTPS on both the proxy and the backend is unnecessary complexity.

### How do I handle HTTPS for services on non-standard ports?

Put them behind a reverse proxy. If Jellyfin runs on port 8096 and Immich runs on 2283, your reverse proxy maps `media.example.com:443` to `jellyfin:8096` and `photos.example.com:443` to `immich:2283`. Users only ever see standard HTTPS on port 443.
