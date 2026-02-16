---
title: "How to Self-Host wg-easy with Docker"
description: "Deploy wg-easy for a WireGuard VPN server with a simple web UI to manage clients, using Docker Compose."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - wg-easy
tags:
  - self-hosted
  - vpn
  - wireguard
  - wg-easy
  - docker
  - web-ui
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is wg-easy?

[wg-easy](https://github.com/wg-easy/wg-easy) (WireGuard Easy) is a web-based management UI for WireGuard VPN. Instead of manually editing WireGuard config files, generating key pairs, and juggling client configurations from the command line, wg-easy gives you a clean web interface to create, disable, and revoke VPN clients with a single click. Each client gets a downloadable config file and a QR code for mobile devices. With over 12 million Docker pulls, it is the most popular way to run a WireGuard VPN server with a GUI. It stores all configuration as local JSON files — no database required.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) with a public IP address
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 50 MB of free RAM
- UDP port 51820 forwarded from your router to the server (required for VPN tunnel traffic)
- A domain name pointing to your server's public IP (optional but recommended)

Port forwarding for UDP 51820 is non-negotiable. WireGuard tunnel traffic must reach your server directly — this cannot go through a reverse proxy or CDN.

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  wg-easy:
    image: ghcr.io/wg-easy/wg-easy:15
    container_name: wg-easy
    restart: unless-stopped
    ports:
      - "51820:51820/udp"  # WireGuard tunnel — must be publicly accessible
      - "51821:51821/tcp"  # Web UI — restrict to LAN or use reverse proxy
    volumes:
      - wg-easy-config:/etc/wireguard  # Client configs, keys, and JSON state
      - /lib/modules:/lib/modules:ro   # Kernel modules for WireGuard
    cap_add:
      - NET_ADMIN     # Required for creating WireGuard interfaces
      - SYS_MODULE    # Required for loading kernel modules
    sysctls:
      - net.ipv4.ip_forward=1              # Enable IPv4 forwarding for VPN routing
      - net.ipv6.conf.all.forwarding=1     # Enable IPv6 forwarding
      - net.ipv4.conf.default.rp_filter=2  # Loose reverse path filtering
    networks:
      wg-network:
        ipv4_address: 10.42.42.2

networks:
  wg-network:
    driver: bridge
    ipam:
      config:
        - subnet: 10.42.42.0/24

volumes:
  wg-easy-config:
```

Start the stack:

```bash
docker compose up -d
```

Verify the container is running:

```bash
docker compose logs -f wg-easy
```

You should see wg-easy start up and listen on both ports. If you see errors about kernel modules, ensure your host kernel has WireGuard support (Linux 5.6+ has it built in; older kernels need the `wireguard` package installed on the host).

## Initial Setup

1. Open your browser and go to `http://YOUR_SERVER_IP:51821`
2. wg-easy presents a first-time setup wizard — create an admin account with a strong password
3. After account creation, log in to reach the client management dashboard
4. The dashboard shows your WireGuard server status and an empty client list

The web UI is where all management happens from this point forward. No command-line interaction needed.

## Configuration

wg-easy is configured primarily through its web UI after deployment. The following environment variables can be added to the `docker-compose.yml` under the `environment:` key to adjust server behavior before startup:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `51821` | TCP port the web UI listens on inside the container |
| `HOST` | `0.0.0.0` | IP address the web UI binds to |
| `INSECURE` | `false` | Set to `true` to disable HTTPS requirement on the web UI — necessary when running behind a reverse proxy that terminates TLS |
| `DISABLE_IPV6` | `false` | Set to `true` to disable IPv6 support entirely if your network does not support it |

Example with environment variables:

```yaml
    environment:
      PORT: "51821"
      HOST: "0.0.0.0"
      INSECURE: "true"          # Set true only behind a TLS-terminating reverse proxy
      DISABLE_IPV6: "true"      # Disable if your network has no IPv6
```

All VPN-specific configuration — client management, DNS settings, allowed IPs, and address ranges — is handled through the web UI after initial setup. Settings are persisted in JSON files inside the `/etc/wireguard` volume.

## Managing Clients

The web UI is the primary interface for client management. No config file editing required.

### Creating a Client

1. Click **New Client** in the dashboard
2. Enter a name for the client (e.g., "Phone", "Laptop", "Work PC")
3. Click **Create** — wg-easy generates the key pair and assigns an IP automatically
4. The client appears in the list with download options

### Getting the Client Config

Each client row in the dashboard offers:

- **Download** — saves a `.conf` file you can import into any WireGuard client app (Windows, macOS, Linux, Android, iOS)
- **QR Code** — displays a scannable QR code for the official WireGuard mobile app on Android or iOS. Point your phone camera at it and the tunnel configures itself

### Disabling and Deleting Clients

- **Disable** — temporarily revokes a client's access without deleting its config. The client stays in the list and can be re-enabled later. Useful when a device is lost or temporarily untrusted.
- **Delete** — permanently removes the client and its keys. The client config becomes invalid and cannot be reused.

### Client Status

The dashboard shows each client's connection status in real time: last handshake time, data transferred, and whether the client is currently connected. This visibility is one of the main advantages over raw WireGuard.

## Advanced Configuration

### Running Behind a Reverse Proxy

If you want to access the web UI through a domain with TLS (e.g., `https://vpn.example.com`), put a reverse proxy in front of port 51821 and set the `INSECURE` environment variable to `true`:

```yaml
    environment:
      INSECURE: "true"
```

This tells wg-easy to serve the web UI over plain HTTP, letting your reverse proxy handle TLS termination. Without this flag, wg-easy may reject connections that arrive without HTTPS.

The WireGuard tunnel port (51820/udp) cannot be proxied. It must remain directly accessible on the host.

### Custom DNS for Clients

By default, wg-easy assigns DNS settings to clients through the web UI configuration panel. You can point clients at a self-hosted DNS server like [Pi-hole](/apps/pi-hole) or [AdGuard Home](/apps/adguard-home) to get ad blocking across all VPN-connected devices. Set the DNS server address in the wg-easy web UI settings to your Pi-hole or AdGuard Home IP.

### IPv6 Configuration

wg-easy supports IPv6 out of the box when `DISABLE_IPV6` is not set to `true`. The `net.ipv6.conf.all.forwarding=1` sysctl in the Docker Compose config enables IPv6 forwarding at the container level. If your server has a public IPv6 address and your ISP supports it, clients can tunnel IPv6 traffic through the VPN.

If you have no IPv6 connectivity or experience issues with IPv6 DNS resolution, set `DISABLE_IPV6: "true"` to avoid problems.

## Reverse Proxy

You can reverse-proxy the wg-easy web UI (port 51821) but **not** the WireGuard tunnel (port 51820/udp). UDP traffic cannot pass through HTTP reverse proxies.

### Nginx Proxy Manager

1. Add a new proxy host in [Nginx Proxy Manager](/apps/nginx-proxy-manager)
2. Set the domain to your chosen subdomain (e.g., `vpn.example.com`)
3. Forward to `http://YOUR_SERVER_IP:51821`
4. Enable SSL with Let's Encrypt
5. Enable WebSocket support (wg-easy uses WebSockets for real-time status updates)

Make sure `INSECURE: "true"` is set in your Docker Compose environment, or the UI will not load behind the proxy.

For more reverse proxy options, see the [Reverse Proxy Setup](/foundations/reverse-proxy-explained) guide.

### Firewall Considerations

Port 51821 (web UI) should not be exposed to the public internet without authentication. Either:

- Access it only from your LAN
- Put it behind a reverse proxy with TLS
- Use a firewall rule to restrict access to trusted IPs

Port 51820 (WireGuard tunnel) must be publicly accessible on UDP for clients to connect.

## Backup

All wg-easy state lives in the `/etc/wireguard` volume. This includes:

- Server private and public keys
- All client configurations and key pairs
- JSON state files tracking client metadata

Back up the named volume:

```bash
docker run --rm \
  -v wg-easy-config:/source:ro \
  -v $(pwd):/backup \
  alpine tar czf /backup/wg-easy-backup-$(date +%Y%m%d).tar.gz -C /source .
```

Restore from backup:

```bash
docker compose down
docker run --rm \
  -v wg-easy-config:/target \
  -v $(pwd):/backup \
  alpine sh -c "rm -rf /target/* && tar xzf /backup/wg-easy-backup-YYYYMMDD.tar.gz -C /target"
docker compose up -d
```

If you lose this volume, all client configurations become invalid. Every client would need new configs generated and redistributed. Back this up regularly — see [Backup Strategy](/foundations/backup-strategy) for a comprehensive approach.

## Troubleshooting

### Web UI Not Loading

**Symptom:** Browser shows connection refused or timeout on port 51821.

**Fix:** Check the container is running with `docker compose ps`. Verify port 51821 is not blocked by a firewall (`sudo ufw status`). Check container logs with `docker compose logs wg-easy` for startup errors. If running behind a reverse proxy, confirm `INSECURE: "true"` is set in the environment.

### Clients Cannot Connect

**Symptom:** WireGuard client shows "handshake did not complete" or no connectivity after connecting.

**Fix:** Verify UDP port 51820 is forwarded from your router to the server. Test with `sudo ss -ulnp | grep 51820` on the host to confirm the port is listening. Check that your ISP does not block UDP traffic on non-standard ports. If behind CGNAT (common with some ISPs), port forwarding will not work — consider [Cloudflare Tunnel](/apps/cloudflare-tunnel) or [Tailscale](/apps/tailscale) as alternatives.

### Port Forwarding Not Working

**Symptom:** Port 51820 is configured in the router but external connections still fail.

**Fix:** Confirm the forwarding rule points to your server's LAN IP, not the public IP. Verify the protocol is set to UDP (not TCP). Test from outside your network using a mobile hotspot — hairpin NAT issues can make local testing unreliable. Use `nmap -sU -p 51820 YOUR_PUBLIC_IP` from an external machine to verify the port is reachable.

### IPv6 Connection Problems

**Symptom:** Clients experience DNS failures or cannot reach IPv6 destinations through the tunnel.

**Fix:** If your server or network does not have IPv6, set `DISABLE_IPV6: "true"` in your Docker Compose environment. Verify `net.ipv6.conf.all.forwarding=1` is set in the sysctl configuration. Some ISPs provide IPv6 but with restrictions that break tunneling — disabling IPv6 in wg-easy eliminates these issues without affecting IPv4 VPN functionality.

### Container Will Not Start

**Symptom:** Container exits immediately with permission errors or module loading failures.

**Fix:** Ensure `cap_add: NET_ADMIN` and `cap_add: SYS_MODULE` are present in the Compose file. Verify your kernel supports WireGuard — run `modprobe wireguard` on the host. On Linux kernels older than 5.6, install the `wireguard` package on the host first (`apt install wireguard` on Debian/Ubuntu). Check that `/lib/modules` exists on the host and is mounted read-only into the container.

## Resource Requirements

- **RAM:** ~50 MB idle. Stays low even with dozens of connected clients.
- **CPU:** Minimal. WireGuard runs in kernel space, so encryption overhead is negligible compared to OpenVPN or IPSec.
- **Disk:** Under 10 MB for the application and configs. Storage grows marginally with each client added.

wg-easy is one of the lightest self-hosted applications you can run. It works comfortably on a Raspberry Pi or any low-end VPS.

## Verdict

wg-easy is the best way to run a WireGuard VPN server if you want a GUI. Raw [WireGuard](/apps/wireguard) is faster to deploy for a single user who is comfortable with config files, but the moment you need to manage multiple clients — family members, multiple devices, friends — wg-easy saves significant time. Creating a client, handing someone a QR code, and having them connected in 30 seconds is hard to beat.

The trade-off is minimal. You get the same WireGuard performance (kernel-level encryption, sub-millisecond overhead) with the convenience of a web dashboard for client management. Over 12 million Docker pulls confirm this is the community's preferred approach.

If you want a managed mesh VPN instead of a traditional hub-and-spoke server, look at [Tailscale](/apps/tailscale) or [Headscale](/apps/headscale). If you prefer full CLI control with no web UI, use raw [WireGuard](/apps/wireguard) directly.

For most self-hosters running a VPN for personal or family use, wg-easy is the right choice.

## FAQ

### What is the difference between wg-easy and raw WireGuard?

Raw WireGuard requires you to generate key pairs, write config files, and manage clients manually through the command line. wg-easy wraps WireGuard with a web UI that automates all of this. The underlying VPN protocol is identical — wg-easy just makes management easier. Performance is the same because WireGuard runs in kernel space either way.

### How many clients can wg-easy handle?

There is no hard limit imposed by wg-easy. WireGuard itself supports thousands of peers on a single interface. In practice, a small VPS can handle 50+ simultaneous clients without breaking a sweat. The bottleneck is your server's network bandwidth, not wg-easy or WireGuard.

### Is wg-easy secure?

Yes. The VPN tunnel uses WireGuard's Noise protocol framework with Curve25519, ChaCha20, and Poly1305 — the same battle-tested cryptography as raw WireGuard. The web UI is the only additional attack surface. Protect it by running it behind a reverse proxy with TLS, restricting access to your LAN, or both. The admin account you create on first setup guards access to client management.

### Can I migrate from a raw WireGuard setup to wg-easy?

Not directly. wg-easy manages its own key pairs and client configs in a specific JSON format. If you have existing WireGuard clients, the simplest migration path is to set up wg-easy fresh, create new clients, and distribute the new configs. The process takes minutes per client.

### Does wg-easy work behind CGNAT?

No. WireGuard requires a publicly reachable UDP port. If your ISP uses CGNAT (carrier-grade NAT), incoming connections cannot reach your server. Alternatives for CGNAT situations include [Tailscale](/apps/tailscale), which uses relay servers, or [Cloudflare Tunnel](/apps/cloudflare-tunnel) for HTTP-based access.

## Related

- [Best Self-Hosted VPN Solutions](/best/vpn)
- [How to Self-Host WireGuard with Docker](/apps/wireguard)
- [How to Self-Host Tailscale with Docker](/apps/tailscale)
- [wg-easy vs WireGuard: Which Should You Self-Host?](/compare/wg-easy-vs-wireguard)
- [Tailscale vs WireGuard Comparison](/compare/tailscale-vs-wireguard)
- [Self-Hosted Alternatives to NordVPN](/replace/nordvpn)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-strategy)
