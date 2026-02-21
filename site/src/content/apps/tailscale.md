---
title: "How to Set Up Tailscale with Docker"
description: "Add your Docker host to a Tailscale mesh network for secure remote access to self-hosted services without port forwarding."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - tailscale
tags:
  - self-hosted
  - vpn
  - tailscale
  - wireguard
  - mesh-vpn
  - docker
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Tailscale?

[Tailscale](https://tailscale.com) is a mesh VPN built on top of WireGuard that connects your devices into a private network without opening ports, configuring firewalls, or managing encryption keys. Unlike a traditional VPN server where all traffic funnels through a single gateway, Tailscale creates direct peer-to-peer connections between every device in your network. Each device gets a stable 100.x.y.z IP address that works regardless of which physical network it is on. NAT traversal is automatic — Tailscale punches through firewalls and CGNATs without any router configuration. The coordination servers handle key exchange and device discovery, while actual traffic flows directly between your devices using WireGuard encryption. For users who want to eliminate the coordination server dependency entirely, [Headscale](/apps/headscale/) is a self-hosted drop-in replacement.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics/))
- A free Tailscale account at [login.tailscale.com](https://login.tailscale.com)
- 128 MB of free RAM
- An auth key generated from the Tailscale admin console

## Docker Compose Configuration

Create a `docker-compose.yml` file:

```yaml
services:
  tailscale:
    image: tailscale/tailscale:v1.94.2
    container_name: tailscale
    hostname: docker-server
    restart: unless-stopped
    environment:
      TS_AUTHKEY: ${TS_AUTHKEY}              # Auth key from Tailscale admin console
      TS_STATE_DIR: /var/lib/tailscale        # Persist node state across restarts
      TS_USERSPACE: "true"                    # Run in userspace mode (no kernel module needed)
      TS_EXTRA_ARGS: ""                       # Additional flags (e.g., --advertise-exit-node)
    volumes:
      - tailscale-state:/var/lib/tailscale    # Node identity and state (must persist)
    healthcheck:
      test: tailscale status --json | grep -q '"Online": true' || exit 1
      interval: 1m
      timeout: 10s
      retries: 3

volumes:
  tailscale-state:
```

Create a `.env` file alongside your `docker-compose.yml`:

```bash
# Generate at: https://login.tailscale.com/admin/settings/keys
# Use a reusable key if you want the container to re-authenticate after recreation
# Use an ephemeral key if you want the node to auto-remove when it goes offline
TS_AUTHKEY=tskey-auth-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Start the stack:

```bash
docker compose up -d
```

### Kernel Networking Mode

The default userspace mode works for most setups. If you need subnet routing or exit node functionality with better performance, use kernel networking mode instead:

```yaml
services:
  tailscale:
    image: tailscale/tailscale:v1.94.2
    container_name: tailscale
    hostname: docker-server
    restart: unless-stopped
    cap_add:
      - NET_ADMIN                             # Required for kernel networking
      - SYS_MODULE                            # Required for loading tun module
    devices:
      - /dev/net/tun:/dev/net/tun             # TUN device for WireGuard
    environment:
      TS_AUTHKEY: ${TS_AUTHKEY}
      TS_STATE_DIR: /var/lib/tailscale
      TS_USERSPACE: "false"                   # Use kernel networking
      TS_EXTRA_ARGS: ""
    volumes:
      - tailscale-state:/var/lib/tailscale
    sysctls:
      - net.ipv4.ip_forward=1                 # Required for subnet routing / exit node
      - net.ipv6.conf.all.forwarding=1        # Required for IPv6 forwarding
    healthcheck:
      test: tailscale status --json | grep -q '"Online": true' || exit 1
      interval: 1m
      timeout: 10s
      retries: 3

volumes:
  tailscale-state:
```

No port mappings are needed. Tailscale creates an overlay network — all traffic flows through encrypted WireGuard tunnels, not exposed ports.

## Initial Setup

1. **Generate an auth key.** Go to the [Tailscale admin console](https://login.tailscale.com/admin/settings/keys) and click **Generate auth key**. Choose:
   - **Reusable** if you want the container to re-authenticate after being recreated
   - **Ephemeral** if you want the node removed automatically when the container stops
   - Set an expiry (or check "No expiry" for long-running servers)

2. **Paste the key into your `.env` file** as the `TS_AUTHKEY` value.

3. **Start the container:**
   ```bash
   docker compose up -d
   ```

4. **Verify the device appears.** Check the [Tailscale admin console](https://login.tailscale.com/admin/machines) — your new device should appear within seconds with the hostname you set.

5. **Note the assigned IP.** Each device gets a stable 100.x.y.z address. This address never changes, regardless of the underlying network. You can now reach your server at this IP from any other device on your Tailnet.

6. **Test connectivity** from another device on your Tailnet:
   ```bash
   tailscale ping docker-server
   ```

## Configuration

### TS_EXTRA_ARGS

The `TS_EXTRA_ARGS` environment variable passes flags directly to `tailscale up`. Common flags:

| Flag | Purpose |
|------|---------|
| `--advertise-routes=192.168.1.0/24` | Expose your LAN to the Tailnet (subnet router) |
| `--advertise-exit-node` | Offer this server as a VPN exit point |
| `--accept-dns=false` | Disable MagicDNS on this node |
| `--accept-routes` | Accept routes advertised by other nodes |
| `--hostname=my-server` | Override the hostname shown in admin console |
| `--shields-up` | Block incoming connections to this node |
| `--advertise-tags=tag:server` | Apply ACL tags to this node |

Example with multiple flags:

```yaml
environment:
  TS_EXTRA_ARGS: "--advertise-routes=192.168.1.0/24 --advertise-exit-node --accept-dns=true"
```

### Auth Key Types

| Key Type | Behavior | Use Case |
|----------|----------|----------|
| **One-off** | Works once, node stays registered | Permanent server you rarely recreate |
| **Reusable** | Works multiple times, node stays registered | Containers rebuilt often (CI, updates) |
| **Ephemeral** | Node auto-removed when offline | Temporary containers, testing |
| **Pre-approved** | Skips manual admin approval | Automated deployments |

For Docker, **reusable + pre-approved** is the most practical combination. The container can restart or be recreated without manual intervention.

## Subnet Router

A subnet router exposes your entire LAN to your Tailscale network. Devices on your Tailnet can reach machines on the LAN even if those machines do not have Tailscale installed.

1. **Use kernel networking mode** (see the kernel networking Compose above). Subnet routing requires packet forwarding.

2. **Set the advertise-routes flag:**
   ```yaml
   environment:
     TS_EXTRA_ARGS: "--advertise-routes=192.168.1.0/24"
     TS_USERSPACE: "false"
   ```
   Replace `192.168.1.0/24` with your actual LAN subnet. You can advertise multiple subnets separated by commas: `--advertise-routes=192.168.1.0/24,10.0.0.0/24`.

3. **Approve the routes in the admin console.** Go to [Machines](https://login.tailscale.com/admin/machines), find your device, click the three-dot menu, and select **Edit route settings**. Enable the advertised subnets.

4. **Enable route acceptance on client devices.** On each device that should use the subnet routes, run:
   ```bash
   tailscale up --accept-routes
   ```

Now any device on your Tailnet can reach `192.168.1.x` addresses directly — your NAS, printer, or any other LAN device.

## Exit Node

An exit node routes all internet traffic from your devices through this server. This is equivalent to a traditional VPN — your public IP becomes the exit node's IP.

1. **Use kernel networking mode** with IP forwarding enabled (see kernel networking Compose above).

2. **Advertise this server as an exit node:**
   ```yaml
   environment:
     TS_EXTRA_ARGS: "--advertise-exit-node"
     TS_USERSPACE: "false"
   ```

3. **Approve the exit node** in the [Tailscale admin console](https://login.tailscale.com/admin/machines) under the device's route settings.

4. **Select the exit node on client devices.** On the device you want to route through the server:
   ```bash
   tailscale up --exit-node=docker-server
   ```
   Or select the exit node in the Tailscale app on mobile/desktop.

You can combine exit node with subnet routing:

```yaml
environment:
  TS_EXTRA_ARGS: "--advertise-exit-node --advertise-routes=192.168.1.0/24"
```

## Advanced Configuration

### MagicDNS

Tailscale assigns DNS names to every device automatically. With MagicDNS enabled (default), you can reach your Docker server at `docker-server` or `docker-server.your-tailnet-name.ts.net` from any device on your Tailnet. No DNS configuration required.

MagicDNS also supports HTTPS certificates — Tailscale provisions Let's Encrypt certificates for `*.your-tailnet-name.ts.net` domains automatically.

### Tailscale Serve

Tailscale Serve exposes a local service to your Tailnet with automatic HTTPS:

```bash
docker exec tailscale tailscale serve https / http://localhost:8080
```

This makes `https://docker-server.your-tailnet-name.ts.net` route to port 8080 on the host. HTTPS is handled automatically — no reverse proxy, no certificate management.

### Tailscale Funnel

Funnel extends Serve to the public internet. It makes a service accessible from outside your Tailnet:

```bash
docker exec tailscale tailscale funnel https / http://localhost:8080
```

Your service is now publicly available at `https://docker-server.your-tailnet-name.ts.net`. Tailscale handles TLS termination, DNS, and DDoS protection. Funnel must be enabled in the [ACL policy](https://login.tailscale.com/admin/acls) first.

### ACLs (Access Control Lists)

By default, every device on your Tailnet can reach every other device. ACLs restrict this. Define them in the [admin console ACL editor](https://login.tailscale.com/admin/acls):

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:admin"],
      "dst": ["tag:server:*"]
    },
    {
      "action": "accept",
      "src": ["tag:user"],
      "dst": ["tag:server:80,443"]
    }
  ],
  "tagOwners": {
    "tag:admin": ["autogroup:admin"],
    "tag:server": ["autogroup:admin"],
    "tag:user": ["autogroup:admin"]
  }
}
```

Tag your Docker container:

```yaml
environment:
  TS_EXTRA_ARGS: "--advertise-tags=tag:server"
```

### Sidecar Mode

Run Tailscale as a sidecar container to give another container a Tailscale IP directly:

```yaml
services:
  tailscale:
    image: tailscale/tailscale:v1.94.2
    container_name: ts-sidecar
    restart: unless-stopped
    environment:
      TS_AUTHKEY: ${TS_AUTHKEY}
      TS_STATE_DIR: /var/lib/tailscale
      TS_USERSPACE: "true"
      TS_EXTRA_ARGS: "--hostname=my-app"
    volumes:
      - ts-sidecar-state:/var/lib/tailscale

  my-app:
    image: your-app:latest
    network_mode: service:tailscale    # Share Tailscale's network stack
    depends_on:
      - tailscale

volumes:
  ts-sidecar-state:
```

The app container is now accessible only via Tailscale — no ports exposed to the public internet.

## Reverse Proxy

Tailscale changes the reverse proxy equation. With a traditional VPN, you still need a reverse proxy to handle HTTPS and route traffic. With Tailscale, you have two options:

**Option 1: Use Tailscale Serve (recommended).** Tailscale Serve handles HTTPS termination and proxying to local services. No Nginx, Traefik, or Caddy needed. Run:

```bash
docker exec tailscale tailscale serve https /app http://localhost:3000
docker exec tailscale tailscale serve https /files http://localhost:8080
```

Each path routes to a different local service with automatic HTTPS certificates.

**Option 2: Keep a traditional reverse proxy.** If you already have [Nginx Proxy Manager](/apps/nginx-proxy-manager/) or [Traefik](/apps/traefik/) set up, Tailscale works alongside it. Your services are accessible via the Tailscale IP, and the reverse proxy handles routing and TLS as usual.

See [Reverse Proxy Setup](/foundations/reverse-proxy-explained/) for general reverse proxy guidance.

## Backup

Back up the Tailscale state volume:

```bash
docker compose stop tailscale
docker run --rm -v tailscale-state:/state -v $(pwd):/backup alpine tar czf /backup/tailscale-state-backup.tar.gz /state
docker compose start tailscale
```

The `/var/lib/tailscale` volume contains the node's WireGuard keys and identity. Losing it means the node gets a new identity and a new IP address on the next startup.

That said, Tailscale state is low-stakes compared to application data. If you lose the state, generate a new auth key and restart the container. The node re-registers with a new IP, and you update any references to the old IP. No data is stored in the Tailscale container.

See [Backup Strategy](/foundations/backup-3-2-1-rule/) for a comprehensive approach.

## Troubleshooting

### Auth key expired or invalid

**Symptom:** Container logs show `auth key invalid` or `auth key expired` and the device does not appear in the admin console.

**Fix:** Auth keys have an expiration date set at creation time. Generate a new key from the [admin console](https://login.tailscale.com/admin/settings/keys), update your `.env` file, and recreate the container:

```bash
docker compose down
# Update TS_AUTHKEY in .env
docker compose up -d
```

If using a one-off key that already registered this node, the container may fail to re-auth after recreation. Use a reusable key for Docker containers.

### Device not appearing in admin console

**Symptom:** Container starts without errors but the device is not listed in the admin console.

**Fix:**
1. Check the container logs: `docker compose logs tailscale`
2. Look for connection errors or DNS resolution failures
3. Verify the auth key is correct and not expired
4. Check that outbound HTTPS (port 443) is not blocked by your firewall — Tailscale needs outbound access to `controlplane.tailscale.com`
5. If behind a restrictive corporate firewall, Tailscale falls back to DERP relays over HTTPS, but the control plane connection must succeed first

### Subnet routes not working

**Symptom:** Routes are advertised but other devices cannot reach the LAN subnet.

**Fix:**
1. Confirm you are using kernel networking mode (`TS_USERSPACE: "false"`) with `NET_ADMIN` capability and `/dev/net/tun`
2. Verify IP forwarding is enabled: check `sysctl net.ipv4.ip_forward` on the host — it must return `1`
3. Approve the routes in the admin console (advertised routes are not active until approved)
4. On client devices, run `tailscale up --accept-routes`
5. Check that no host firewall (iptables/nftables/ufw) is blocking forwarded traffic

### DNS resolution fails for Tailnet names

**Symptom:** `docker-server.your-tailnet-name.ts.net` does not resolve, or MagicDNS names do not work.

**Fix:**
1. Verify MagicDNS is enabled in the [DNS settings](https://login.tailscale.com/admin/dns) of your admin console
2. On the client device, check that Tailscale is managing DNS: `tailscale status` should show the DNS configuration
3. If the client is a Linux server, check `/etc/resolv.conf` — it should point to `100.100.100.100` (Tailscale's DNS resolver)
4. Some Docker setups override container DNS. If running apps in sidecar mode, ensure the app container does not set custom DNS servers

### Container restart loses Tailscale connection temporarily

**Symptom:** After `docker compose restart`, the node takes 30-60 seconds to reconnect and briefly shows as offline in the admin console.

**Fix:** This is expected behavior. WireGuard handshakes have a keepalive interval, and the coordination server needs to detect the node is back. To minimize downtime:
1. Ensure the state volume is persisted (not an anonymous volume) so the node retains its identity
2. Use `restart: unless-stopped` to handle crashes automatically
3. The health check in the Compose file will report unhealthy during the brief reconnection window — orchestrators should wait for it to recover rather than restarting again

## Resource Requirements

- **RAM:** 50-100 MB depending on the size of your Tailnet
- **CPU:** Minimal. WireGuard encryption is handled in kernel space (kernel mode) or uses very efficient userspace implementation. Negligible CPU usage unless routing high-bandwidth traffic as an exit node.
- **Disk:** Under 10 MB for the application and state

Tailscale is one of the lightest services you can run. It adds negligible overhead to any server.

## Verdict

Tailscale is the easiest way to connect all your devices and self-hosted services into a secure private network. Zero port forwarding, zero firewall configuration, zero certificate management. The mesh architecture means traffic flows directly between devices at WireGuard speeds rather than through a central server. The free tier supports up to 100 devices and 3 users, which is more than enough for personal self-hosting.

The main trade-off is dependency on Tailscale's coordination servers. Your traffic does not flow through Tailscale (it is peer-to-peer), but device discovery and key exchange do. If that dependency bothers you, [Headscale](/apps/headscale/) is a self-hosted implementation of the Tailscale control server that is fully compatible with official Tailscale clients.

For users who want a raw [WireGuard](/apps/wireguard/) server with no external dependencies, that remains an option — but you lose automatic NAT traversal, MagicDNS, and the zero-config experience. Tailscale is WireGuard made effortless.

## Frequently Asked Questions

### What is the difference between Tailscale and WireGuard?

Tailscale is built on top of WireGuard. WireGuard is the encryption protocol — fast, modern, and minimal. Tailscale adds automatic key management, NAT traversal, device discovery, MagicDNS, and a coordination layer on top. Think of WireGuard as the engine and Tailscale as the car. If you want full control and no dependencies, use [WireGuard directly](/apps/wireguard/). If you want things to work without configuration, use Tailscale.

### Is Tailscale free?

Yes, for personal use. The free plan includes up to 100 devices, 3 users, and all core features including subnet routing, exit nodes, MagicDNS, and Tailscale Serve. Paid plans add more users, team features, and enterprise controls. For a solo self-hoster, the free tier is more than sufficient.

### What is Headscale and should I use it?

[Headscale](/apps/headscale/) is an open-source, self-hosted implementation of the Tailscale coordination server. It is compatible with official Tailscale clients. Use Headscale if you want to eliminate the dependency on Tailscale's servers entirely and run the complete stack yourself. The trade-off is more setup complexity and maintaining the coordination server yourself. For most self-hosters, Tailscale's free tier is the pragmatic choice.

### Can I expose services to the public internet with Tailscale?

Yes, using Tailscale Funnel. Funnel makes a local service publicly accessible at `https://your-node.your-tailnet.ts.net` with automatic TLS. Enable Funnel in your ACL policy, then run `tailscale funnel https / http://localhost:8080`. This is an alternative to Cloudflare Tunnel or port forwarding for exposing services without a static IP.

### Does Tailscale work with Docker containers?

Yes, in two ways. First, you can run Tailscale as a standalone container to give the Docker host a Tailscale IP — all services on that host become reachable via the Tailscale network. Second, you can run Tailscale as a sidecar container using `network_mode: service:tailscale`, which gives an individual container its own Tailscale identity and IP. The sidecar approach is more secure because the app is only reachable through Tailscale, with no ports exposed to the public internet.

## Related

- [Best Self-Hosted VPN Solutions](/best/vpn/)
- [How to Self-Host WireGuard](/apps/wireguard/)
- [How to Self-Host Headscale](/apps/headscale/)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard/)
- [Headscale vs Tailscale](/compare/headscale-vs-tailscale/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Replace NordVPN with Self-Hosted VPN](/replace/nordvpn/)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained/)
- [Backup Strategy](/foundations/backup-3-2-1-rule/)
