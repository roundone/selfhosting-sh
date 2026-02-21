---
title: "How to Self-Host WireGuard with Docker"
description: "Deploy WireGuard VPN server with Docker Compose for fast, secure remote access to your home network and self-hosted services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - wireguard
tags:
  - self-hosted
  - vpn
  - wireguard
  - docker
  - remote-access
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is WireGuard?

[WireGuard](https://www.wireguard.com) is a modern VPN protocol that is faster, simpler, and more secure than OpenVPN or IPSec. It runs as a kernel module with roughly 4,000 lines of code — compared to OpenVPN's 100,000+ — which makes it easier to audit and harder to exploit. WireGuard replaces commercial VPN services like NordVPN or ExpressVPN by letting you run your own VPN server, giving you encrypted remote access to your home network and all your self-hosted services from anywhere.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- A public IP address or dynamic DNS domain pointing to your server
- Port 51820/UDP forwarded on your router to the server's LAN IP
- 128 MB of free RAM
- WireGuard kernel module available (included in Linux 5.6+; Ubuntu 22.04 has it by default)

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  wireguard:
    image: lscr.io/linuxserver/wireguard:1.0.20250521-ls102
    container_name: wireguard
    restart: unless-stopped
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      PUID: "1000"                    # Your user ID (run: id -u)
      PGID: "1000"                    # Your group ID (run: id -g)
      TZ: "America/New_York"          # Your timezone
      SERVERURL: "vpn.example.com"    # Your public IP or domain — CHANGE THIS
      SERVERPORT: "51820"             # External port clients connect to
      PEERS: "3"                      # Number of peer configs to generate
      PEERDNS: "auto"                 # DNS for peers (auto uses host DNS)
      INTERNAL_SUBNET: "10.13.13.0"   # VPN subnet — change only if it conflicts
      ALLOWEDIPS: "0.0.0.0/0"         # Route all traffic through VPN
      LOG_CONFS: "true"               # Print peer configs (inc. QR codes) to logs
    ports:
      - "51820:51820/udp"
    volumes:
      - wireguard-config:/config
      - /lib/modules:/lib/modules:ro  # Kernel modules (read-only)
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1

volumes:
  wireguard-config:
```

Create a `.env` file if you prefer to keep secrets out of the Compose file:

```bash
# .env
TZ=America/New_York
SERVERURL=vpn.example.com
PEERS=3
```

Then reference them in the Compose file with `${VARIABLE}` syntax.

**You must change `SERVERURL`** to your server's public IP address or a domain/DDNS hostname that resolves to it. This value is baked into every peer config file. If it is wrong, clients cannot connect.

Start the stack:

```bash
docker compose up -d
```

## Initial Setup

WireGuard generates peer configuration files automatically on first start. Each peer gets its own directory under `/config/peerX/` (or `/config/peer_name/` if you used named peers).

View the generated configs and QR codes in the container logs:

```bash
docker compose logs wireguard
```

Each peer's section in the logs includes a QR code you can scan directly with the WireGuard mobile app. The logs also show the path to each peer's `.conf` file.

To retrieve a specific peer's config file:

```bash
docker compose exec wireguard cat /config/peer1/peer1.conf
```

If you set `LOG_CONFS: "true"`, the QR codes are printed to the logs on every container start. Set it to `"false"` after initial setup if you consider this a security concern.

## Configuration

### SERVERURL

The public IP or hostname that clients use to reach your server. For a static IP, use the IP directly (e.g., `203.0.113.50`). For a dynamic IP, use a DDNS hostname. This value is written into every peer config — changing it later requires regenerating peer configs.

### PEERS

Number of peer configs to generate. Set to an integer (`"3"`) to create numbered peers (peer1, peer2, peer3). Set to a comma-separated list of names (`"phone,laptop,tablet"`) to create named peers with readable directory names.

### PEERDNS

The DNS server peers will use when connected to the VPN. `auto` uses the host's DNS servers. Set to a specific IP to use a custom DNS — for example, your [Pi-hole](/apps/pi-hole/) instance at `10.13.13.1` or `192.168.1.100`.

### ALLOWEDIPS

Controls what traffic routes through the VPN tunnel on the client side:

- `0.0.0.0/0` — route **all** traffic through the VPN (full tunnel). This is the default and the most secure option for public Wi-Fi.
- `10.13.13.0/24, 192.168.1.0/24` — route only VPN subnet and home LAN traffic through the tunnel (split tunnel). Internet traffic goes directly from the client.

### INTERNAL_SUBNET

The private subnet for the VPN network. Default is `10.13.13.0`. Only change this if it conflicts with your existing LAN subnet. The server gets `.1` (e.g., `10.13.13.1`), peers get `.2`, `.3`, and so on.

## Client Setup

Install the WireGuard app on each client device:

- **iOS:** [WireGuard on the App Store](https://apps.apple.com/us/app/wireguard/id1441195209)
- **Android:** [WireGuard on Google Play](https://play.google.com/store/apps/details?id=com.wireguard.android)
- **Windows:** [Download from wireguard.com](https://www.wireguard.com/install/)
- **macOS:** [WireGuard on the Mac App Store](https://apps.apple.com/us/app/wireguard/id1451685025)
- **Linux:** `sudo apt install wireguard` (Ubuntu/Debian) or `sudo dnf install wireguard-tools` (Fedora)

### Import Configuration

**Mobile (iOS/Android):** Open the WireGuard app, tap **+**, select **Create from QR code**, and scan the QR code from the container logs.

**Desktop (Windows/macOS):** Open the WireGuard app, click **Import tunnel(s) from file**, and select the `.conf` file. Copy the file from the server:

```bash
# From your local machine
scp user@your-server:/var/lib/docker/volumes/wireguard-config/_data/peer1/peer1.conf ~/wireguard-peer1.conf
```

**Linux:** Copy the config to `/etc/wireguard/` and bring it up:

```bash
sudo cp peer1.conf /etc/wireguard/wg0.conf
sudo wg-quick up wg0
```

To connect on boot:

```bash
sudo systemctl enable wg-quick@wg0
```

## Advanced Configuration

### Split Tunneling

By default, `ALLOWEDIPS: "0.0.0.0/0"` routes all client traffic through the VPN. For split tunneling — where only traffic to your home network goes through the VPN — set `ALLOWEDIPS` to your specific subnets:

```yaml
ALLOWEDIPS: "10.13.13.0/24, 192.168.1.0/24"
```

This keeps internet browsing fast (direct connection) while still giving access to your self-hosted services. You can also edit `AllowedIPs` directly in individual peer `.conf` files after generation.

### DNS via Pi-hole or AdGuard Home

Route all VPN client DNS through your ad-blocking DNS server:

```yaml
PEERDNS: "10.13.13.1"  # If Pi-hole runs on the WireGuard host
```

Or if your DNS server is on a different machine on your LAN:

```yaml
PEERDNS: "192.168.1.100"  # Your Pi-hole/AdGuard Home LAN IP
```

Make sure the DNS server is accessible from the WireGuard subnet. If [Pi-hole](/apps/pi-hole/) or [AdGuard Home](/apps/adguard-home/) runs on the same host, use the WireGuard gateway IP (`10.13.13.1`) so traffic stays inside the VPN tunnel.

### Named Peers

Instead of numbered peers, use descriptive names:

```yaml
PEERS: "phone,laptop,tablet,work-pc"
```

This creates `/config/peer_phone/`, `/config/peer_laptop/`, etc. Easier to manage when you need to revoke a specific device — just delete its directory and restart the container.

### Adding More Peers

To add peers after initial setup, increase the `PEERS` count (or add names to the comma-separated list) and restart:

```bash
docker compose down && docker compose up -d
```

Existing peer configs are preserved. Only new peers are generated.

### Multiple LAN Subnets

If your home network spans multiple subnets (e.g., IoT VLAN, management VLAN), add them all to `ALLOWEDIPS` so clients can reach every subnet:

```yaml
ALLOWEDIPS: "10.13.13.0/24, 192.168.1.0/24, 192.168.10.0/24, 172.16.0.0/24"
```

Ensure the WireGuard server host has routes to all these subnets and IP forwarding is enabled (the container handles this via the `NET_ADMIN` capability and sysctl).

## Reverse Proxy

WireGuard uses UDP on port 51820. Reverse proxies like [Nginx Proxy Manager](/apps/nginx-proxy-manager/), [Traefik](/apps/traefik/), and [Caddy](/apps/caddy/) operate on HTTP/HTTPS (TCP). You cannot put WireGuard behind a standard reverse proxy.

Port 51820/UDP must be forwarded directly from your router to the WireGuard container. There is no SSL certificate to manage — WireGuard handles its own encryption using Curve25519 key pairs.

For general reverse proxy setup for your other self-hosted services, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained/).

## Backup

Back up the entire `/config` volume. It contains all server and peer private keys, public keys, and peer configuration files. Losing this data means regenerating all keys and reconfiguring every client device.

```bash
docker compose stop wireguard
docker run --rm -v wireguard-config:/config -v $(pwd):/backup alpine tar czf /backup/wireguard-backup.tar.gz /config
docker compose start wireguard
```

Restore from backup:

```bash
docker compose stop wireguard
docker run --rm -v wireguard-config:/config -v $(pwd):/backup alpine sh -c "cd / && tar xzf /backup/wireguard-backup.tar.gz"
docker compose start wireguard
```

Store backups securely — the `/config` directory contains private keys. Anyone with these keys can connect to your VPN. See [Backup Strategy](/foundations/backup-3-2-1-rule/).

## Troubleshooting

### Port not forwarded — clients time out

**Symptom:** WireGuard client shows "handshake did not complete" and never connects.

**Fix:** Verify port 51820/UDP is forwarded on your router to the server's LAN IP. Test from outside your network:

```bash
# From a remote machine
nc -uzv your-server-ip 51820
```

Also check your server's firewall:

```bash
sudo ufw allow 51820/udp
```

If you use a cloud VPS, check the provider's firewall/security group settings — Hetzner, AWS, and others have their own firewalls outside the OS.

### Kernel module not available

**Symptom:** Container logs show `FATAL: Module wireguard not found` or `Unable to access interface: Protocol not supported`.

**Fix:** The WireGuard kernel module must be available on the host. On Ubuntu 22.04+, it is built in. On older kernels:

```bash
sudo apt install linux-headers-$(uname -r) wireguard-dkms
sudo modprobe wireguard
```

Verify the module loaded:

```bash
lsmod | grep wireguard
```

If you are on a VPS where you cannot load kernel modules (some OpenVZ/LXC providers), WireGuard in Docker will not work. Use a KVM-based VPS instead.

### Peer connects but cannot reach LAN resources

**Symptom:** VPN handshake succeeds (you see a handshake timestamp in the WireGuard app) but you cannot ping or access devices on your home LAN.

**Fix:** Ensure IP forwarding is enabled on the host:

```bash
sudo sysctl net.ipv4.ip_forward
# Should output: net.ipv4.ip_forward = 1
```

If it shows `0`, enable it:

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
```

Also verify that the server's LAN gateway (your router) has a return route for the VPN subnet (`10.13.13.0/24`) pointing to the WireGuard server's LAN IP. Without this, LAN devices receive packets from VPN clients but cannot reply.

### DNS leaks when connected

**Symptom:** Connected to VPN but DNS queries still go to your ISP's DNS servers, or ad blocking via Pi-hole does not work.

**Fix:** Check the `DNS` line in the peer's `.conf` file. It should point to your intended DNS server:

```ini
[Interface]
DNS = 10.13.13.1
```

If `PEERDNS` was set to `auto`, the container uses the host's resolv.conf, which may point to a public resolver. Set `PEERDNS` explicitly to your DNS server IP and regenerate peer configs by restarting the container.

On Android, also check that the WireGuard app is not being overridden by Private DNS settings in the system network configuration.

### Handshake succeeds but no internet traffic

**Symptom:** WireGuard shows a recent handshake timestamp, but browsing the internet does not work when `ALLOWEDIPS` is `0.0.0.0/0`.

**Fix:** The server needs NAT (masquerade) rules to forward VPN client traffic to the internet. The LinuxServer.io container sets these up automatically, but they require the `NET_ADMIN` capability and the sysctl `net.ipv4.conf.all.src_valid_mark=1`. Verify both are in your Compose file.

If the issue persists, check the iptables rules inside the container:

```bash
docker compose exec wireguard iptables -t nat -L POSTROUTING
```

You should see a `MASQUERADE` rule. If not, restart the container — the rules are set during startup.

## Resource Requirements

- **RAM:** ~50 MB idle. WireGuard is a kernel module — the Docker container is primarily a management wrapper.
- **CPU:** Negligible. WireGuard uses ChaCha20 for encryption, which is extremely fast even without hardware AES support.
- **Disk:** ~15 MB for the application. Peer configs are a few KB each.
- **Bandwidth:** WireGuard adds roughly 60 bytes of overhead per packet. Throughput is limited by your network connection, not by WireGuard.

## Verdict

WireGuard is the VPN protocol you should use. It is faster than OpenVPN, simpler than IPSec, and has a smaller attack surface than both. The LinuxServer.io Docker image makes deployment trivial — define your peers, start the container, scan a QR code, and you are connected.

The one limitation: WireGuard has no built-in web UI. If you want a browser-based admin panel to manage peers, look at [wg-easy](/apps/wg-easy/) — it wraps WireGuard with a clean web interface. If you want automatic mesh networking without port forwarding, [Tailscale](/apps/tailscale/) or [Headscale](/apps/headscale/) build on WireGuard with NAT traversal and device management built in.

For a raw VPN server with maximum performance and minimum overhead, WireGuard is the clear winner.

## Frequently Asked Questions

### WireGuard vs OpenVPN — which is better?

WireGuard is better for nearly every use case. It is 3-4x faster in throughput benchmarks, connects in under 100ms (vs seconds for OpenVPN), uses less battery on mobile, and has a far smaller codebase. OpenVPN's only advantage is TCP support for restrictive networks that block UDP — WireGuard is UDP-only. If your network blocks UDP, use [Cloudflare Tunnel](/apps/cloudflare-tunnel/) instead.

### Is WireGuard safe to expose to the internet?

Yes. WireGuard is designed for direct internet exposure. It uses Curve25519 for key exchange, ChaCha20 for encryption, and Poly1305 for authentication — all modern, audited primitives. Unauthenticated packets are silently dropped with no response, making port scanning ineffective. The attack surface is minimal.

### Can I use WireGuard as an exit node for all my traffic?

Yes. Set `ALLOWEDIPS: "0.0.0.0/0"` (the default in this guide). All client traffic — web browsing, DNS, everything — routes through the VPN tunnel and exits from your server's internet connection. This is useful on public Wi-Fi or in countries with restricted internet access.

### How do I set up split tunneling?

Change `ALLOWEDIPS` from `0.0.0.0/0` to only the subnets you want to reach through the VPN. For example, `ALLOWEDIPS: "10.13.13.0/24, 192.168.1.0/24"` routes only home network traffic through the tunnel. Internet traffic goes directly from the client. See the [Advanced Configuration](#advanced-configuration) section above.

### Can I run WireGuard on a Raspberry Pi?

Yes. WireGuard runs well on a Raspberry Pi 4 or 5. The kernel module is available in Raspberry Pi OS, and the encryption is lightweight enough that the Pi can handle hundreds of Mbps of VPN throughput. The LinuxServer.io Docker image supports ARM64.

## Related

- [Best Self-Hosted VPN Solutions](/best/vpn/)
- [How to Self-Host wg-easy](/apps/wg-easy/)
- [How to Self-Host Tailscale](/apps/tailscale/)
- [How to Self-Host Headscale](/apps/headscale/)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard/)
- [WireGuard vs OpenVPN](/compare/wireguard-vs-openvpn/)
- [Replace NordVPN](/replace/nordvpn/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
