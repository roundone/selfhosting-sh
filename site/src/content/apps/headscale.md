---
title: "How to Self-Host Headscale with Docker"
description: "Deploy Headscale as a self-hosted Tailscale control server with Docker Compose for a fully private mesh VPN network."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "vpn-remote-access"
apps:
  - headscale
tags:
  - self-hosted
  - vpn
  - headscale
  - tailscale
  - mesh-vpn
  - docker
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Headscale?

[Headscale](https://github.com/juanfont/headscale) is a self-hosted, open-source implementation of the Tailscale coordination server. Tailscale builds encrypted mesh VPN networks using WireGuard under the hood, but the coordination server — the component that manages device registration, key exchange, and network policy — is proprietary and runs on Tailscale's infrastructure. Headscale replaces that server entirely. You run it on your own hardware, and all official Tailscale clients (Linux, macOS, Windows, iOS, Android) connect to it instead of Tailscale's servers. Your network topology, device keys, and access policies never leave your control.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended) with a public IP address
- Docker and Docker Compose installed ([guide](/foundations/docker-compose-basics))
- 256 MB of free RAM
- A domain name pointing to your server (required for clients to connect over HTTPS)
- A reverse proxy with SSL configured ([guide](/foundations/reverse-proxy-explained))

## Docker Compose Configuration

Create a project directory:

```bash
mkdir -p /opt/headscale && cd /opt/headscale
```

Create the required directories for Headscale's data and configuration:

```bash
mkdir -p ./config ./data
```

Create a `docker-compose.yml` file:

```yaml
services:
  headscale:
    image: headscale/headscale:v0.28.0
    container_name: headscale
    restart: unless-stopped
    command: serve
    ports:
      - "8080:8080"   # HTTP API and web traffic
      - "9090:9090"   # gRPC API and metrics
    volumes:
      - ./config:/etc/headscale:ro           # Configuration (read-only)
      - headscale-data:/var/lib/headscale     # SQLite database and state
      - headscale-run:/var/run/headscale      # Runtime socket
    tmpfs:
      - /tmp                                  # Temporary files
    healthcheck:
      test: ["CMD", "headscale", "health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s

volumes:
  headscale-data:
  headscale-run:
```

Port 8080 serves the HTTP API that Tailscale clients connect to. Port 9090 exposes the gRPC API used by the `headscale` CLI for management operations and optional Prometheus metrics. If you only manage Headscale from within the container (via `docker exec`), you can omit the 9090 port mapping.

Start the stack:

```bash
docker compose up -d
```

Verify it is running:

```bash
docker compose logs -f headscale
```

You should see Headscale report that it is listening on the configured addresses. Press `Ctrl+C` to exit the log view.

## Configuration File

Headscale does not use environment variables for configuration. All settings live in a YAML configuration file.

Download the example configuration for your version:

```bash
curl -o ./config/config.yaml \
  https://raw.githubusercontent.com/juanfont/headscale/v0.28.0/config-example.yaml
```

Then edit `./config/config.yaml`. Here are the key settings you must review and change:

```yaml
# The URL clients use to reach your Headscale instance.
# Must match your reverse proxy domain with HTTPS.
server_url: https://headscale.example.com

# Address and port Headscale listens on inside the container.
listen_addr: 0.0.0.0:8080

# Metrics listener (Prometheus-compatible). Set to empty string to disable.
metrics_listen_addr: 0.0.0.0:9090

# gRPC API listener — used by the headscale CLI for remote management.
grpc_listen_addr: 0.0.0.0:9090
grpc_allow_insecure: false

# Private key storage location (auto-generated on first run).
private_key_path: /var/lib/headscale/private.key
noise:
  private_key_path: /var/lib/headscale/noise_private.key

# IP address prefixes allocated to Tailscale nodes.
# These are from the Carrier-Grade NAT range — do not change unless
# they conflict with your existing network.
prefixes:
  v4: 100.64.0.0/10
  v6: fd7a:115c:a1e0::/48

# Database configuration — SQLite by default (recommended).
database:
  type: sqlite
  sqlite:
    path: /var/lib/headscale/db.sqlite3

# DERP (relay) map configuration.
# DERP servers relay traffic when direct connections fail (strict NAT, firewalls).
# By default, Headscale uses Tailscale's public DERP servers.
derp:
  server:
    enabled: false           # Set to true to run an embedded DERP server
    region_id: 999
    stun_listen_addr: 0.0.0.0:3478
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  auto_update_enabled: true
  update_frequency: 24h

# DNS configuration pushed to all connected clients.
dns:
  magic_dns: true
  base_domain: mesh.example.com    # Your internal mesh domain
  nameservers:
    global:
      - 1.1.1.1
      - 9.9.9.9

# Disable TLS on Headscale itself — your reverse proxy handles HTTPS.
tls_cert_path: ""
tls_key_path: ""

# Log level — set to "warn" in production after initial setup works.
log:
  level: info
```

**Critical settings to change:**
- `server_url` — must match your public-facing HTTPS domain exactly
- `dns.base_domain` — the domain used for MagicDNS names within your mesh (e.g., `device.mesh.example.com`)
- `dns.nameservers.global` — upstream DNS resolvers your mesh nodes will use

Save the file and restart the container to apply changes:

```bash
docker compose restart headscale
```

## Initial Setup

### Create a User

Headscale organizes devices under users (formerly called namespaces). Create your first user:

```bash
docker exec headscale headscale users create myuser
```

### Generate a Pre-Authentication Key

Pre-auth keys let devices register without manual approval:

```bash
docker exec headscale headscale preauthkeys create --user myuser --reusable --expiration 1h
```

This outputs a key like `hskey-auth-abc123...`. Copy it — you will use it when connecting clients. The `--reusable` flag allows multiple devices to use the same key. The `--expiration 1h` flag means the key expires after one hour (devices already registered remain connected).

For a one-time use key (more secure for single device enrollment):

```bash
docker exec headscale headscale preauthkeys create --user myuser --expiration 24h
```

### Verify the Server Is Reachable

```bash
curl -s https://headscale.example.com/health
```

This should return a 200 status. If it does not, check your reverse proxy configuration and DNS records.

## Connecting Clients

Headscale works with the standard Tailscale client on all platforms. The only difference is pointing the client at your server instead of Tailscale's.

### Linux

Install the Tailscale client:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
```

Connect to your Headscale instance:

```bash
sudo tailscale up --login-server https://headscale.example.com --authkey hskey-auth-abc123...
```

Verify the connection:

```bash
tailscale status
```

### macOS

Install Tailscale from the App Store or via Homebrew (`brew install tailscale`). Open a terminal:

```bash
tailscale up --login-server https://headscale.example.com --authkey hskey-auth-abc123...
```

If using the App Store version, you may need to use the `tailscale login` command instead and approve the node manually on the server side:

```bash
# On the client:
tailscale login --login-server https://headscale.example.com

# On the server (after the client requests registration):
docker exec headscale headscale nodes register --user myuser --key mkey:abc123...
```

### Windows

Install Tailscale from [tailscale.com/download](https://tailscale.com/download/windows). Before signing in, open a PowerShell terminal as Administrator:

```powershell
tailscale up --login-server https://headscale.example.com --authkey hskey-auth-abc123...
```

### iOS and Android

The official Tailscale mobile apps support custom control servers. On iOS, navigate to the "three dots" menu and select "Use an alternate server." Enter your Headscale URL. On Android, use the "Custom control server" option in Settings. Then authenticate with a pre-auth key or approve the node from the server.

### List Connected Nodes

After registering devices, verify they appear on the server:

```bash
docker exec headscale headscale nodes list
```

You should see each device with its assigned IP address, hostname, and last-seen timestamp.

## Advanced Configuration

### Access Control Lists (ACLs)

Headscale supports Tailscale-compatible ACL policies. Create an ACL file at `./config/acl.yaml`:

```yaml
# Example: allow all traffic between all users
acls:
  - action: accept
    src: ["*"]
    dst: ["*:*"]
```

A more restrictive example:

```yaml
# Only allow SSH and HTTPS between devices
acls:
  - action: accept
    src: ["myuser"]
    dst: ["myuser:22,443"]

  # Allow ICMP (ping) everywhere
  - action: accept
    src: ["*"]
    dst: ["*:*"]
    proto: "icmp"
```

Reference the ACL file in `config.yaml`:

```yaml
policy:
  path: /etc/headscale/acl.yaml
  mode: file
```

Restart the container to apply ACL changes.

### Custom DERP Servers

If you want all relay traffic to stay on your own infrastructure, run a custom DERP server. Enable the embedded DERP server in `config.yaml`:

```yaml
derp:
  server:
    enabled: true
    region_id: 900
    region_code: "myderp"
    region_name: "My DERP Server"
    stun_listen_addr: 0.0.0.0:3478
  urls: []                              # Remove public DERP servers
  auto_update_enabled: false
```

You will also need to expose the STUN port in your Docker Compose:

```yaml
ports:
  - "8080:8080"
  - "9090:9090"
  - "3478:3478/udp"   # STUN for DERP relay
```

### OIDC Authentication

Headscale supports OpenID Connect for user authentication, allowing integration with identity providers like Keycloak, Authentik, or Authelia:

```yaml
oidc:
  issuer: https://auth.example.com
  client_id: headscale
  client_secret: your-client-secret
  scope: ["openid", "profile", "email"]
  allowed_domains:
    - example.com
```

With OIDC enabled, users authenticate through your identity provider instead of using pre-auth keys. This is the recommended approach for teams.

### Multiple Users

Create additional users to organize devices by person or purpose:

```bash
docker exec headscale headscale users create workdevices
docker exec headscale headscale users create homelab
```

Devices within the same user can see each other by default. Cross-user access is controlled by ACLs.

### API Keys

Generate an API key for external automation or integration with management UIs:

```bash
docker exec headscale headscale apikeys create --expiration 90d
```

The API key authenticates against the gRPC API on port 9090. Use it with tools like [headscale-ui](https://github.com/gurucomputing/headscale-ui) for a web-based management interface.

## Reverse Proxy

Headscale requires HTTPS — Tailscale clients refuse plaintext connections. Your reverse proxy terminates TLS and forwards traffic to Headscale on port 8080.

**Nginx Proxy Manager setup:**

1. Add a new Proxy Host for `headscale.example.com`
2. Set the Forward Hostname to `127.0.0.1` (or your Docker host IP) and Forward Port to `8080`
3. Enable "Websockets Support" — Headscale uses long-lived HTTP connections for client coordination
4. Under the SSL tab, request a Let's Encrypt certificate and enable "Force SSL"

**Caddy configuration** (if using [Caddy](/apps/caddy) instead):

```
headscale.example.com {
    reverse_proxy localhost:8080
}
```

Caddy handles HTTPS automatically with Let's Encrypt. No additional TLS configuration is needed.

Make sure the `server_url` in your `config.yaml` matches the domain on your reverse proxy exactly. A mismatch causes clients to fail authentication.

For full reverse proxy setup instructions, see [Reverse Proxy Setup](/foundations/reverse-proxy-explained).

## Backup

All Headscale state lives in the `/var/lib/headscale` volume. This contains:

- `db.sqlite3` — the SQLite database with all users, nodes, keys, routes, and ACL state
- `private.key` — the server's private key
- `noise_private.key` — the Noise protocol key used for client communication

Losing the database means all devices must re-register. Losing the private keys means rebuilding the entire network from scratch.

### Backup Script

```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/backups/headscale"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATA_DIR=$(docker volume inspect headscale-data --format '{{ .Mountpoint }}')

mkdir -p "$BACKUP_DIR"

# Use sqlite3 .backup for a consistent snapshot while Headscale runs
docker exec headscale sqlite3 /var/lib/headscale/db.sqlite3 ".backup '/var/lib/headscale/db-backup.sqlite3'"

tar czf "$BACKUP_DIR/headscale-$TIMESTAMP.tar.gz" \
  -C "$DATA_DIR" \
  db-backup.sqlite3 \
  private.key \
  noise_private.key

docker exec headscale rm /var/lib/headscale/db-backup.sqlite3

# Keep the last 30 daily backups
find "$BACKUP_DIR" -name "headscale-*.tar.gz" -mtime +30 -delete

echo "Backup complete: headscale-$TIMESTAMP.tar.gz"
```

Schedule it with cron to run daily. Follow the [3-2-1 backup strategy](/foundations/backup-3-2-1-rule): three copies, two media types, one offsite.

## Troubleshooting

### Client won't connect — "unexpected server response"

**Symptom:** Running `tailscale up --login-server https://headscale.example.com` fails with a connection error or an unexpected server response.

**Fix:**
1. Verify `server_url` in `config.yaml` matches the exact URL you are using, including the `https://` prefix and no trailing slash
2. Confirm your reverse proxy forwards to port 8080 and has WebSocket support enabled
3. Check that the SSL certificate is valid: `curl -v https://headscale.example.com/health`
4. Review Headscale logs for errors: `docker compose logs headscale`
5. Ensure the Tailscale client version is compatible — Headscale v0.28.0 supports Tailscale clients v1.56+

### config.yaml syntax errors

**Symptom:** Headscale container starts and immediately exits. Logs show a YAML parsing error.

**Fix:** Validate your configuration file:
```bash
docker run --rm -v $(pwd)/config:/etc/headscale:ro headscale/headscale:v0.28.0 configtest
```

Common YAML mistakes: using tabs instead of spaces, incorrect indentation, missing colons after keys, or unquoted strings that contain special characters. Use a YAML linter if unsure.

### Database locked errors

**Symptom:** Logs show `database is locked` or `SQLITE_BUSY` errors.

**Fix:** This happens when multiple processes try to write to the SQLite database simultaneously. Ensure:
1. Only one Headscale container is running — do not accidentally start multiple instances
2. Your backup script uses `sqlite3 .backup` (which handles locking properly), not direct file copies
3. The data volume is not mounted by another container

If the error persists after confirming a single instance, restart the container:
```bash
docker compose restart headscale
```

### DERP connectivity issues — traffic relaying fails

**Symptom:** Devices register and get IP addresses but cannot reach each other. `tailscale ping` shows timeouts or only works via relay with high latency.

**Fix:**
1. Check that your DERP configuration in `config.yaml` is valid. If using Tailscale's public DERP servers, ensure the URL `https://controlplane.tailscale.com/derpmap/default` is accessible from your server
2. If running an embedded DERP server, verify port 3478/udp (STUN) is exposed in Docker Compose and open in your firewall
3. Run `tailscale netcheck` on a client to diagnose connectivity — it reports which DERP regions are reachable and latency to each
4. For direct connections, ensure UDP port 41641 is open on both ends (or the port shown by `tailscale status --json`)

### DNS not resolving MagicDNS names

**Symptom:** Devices have Tailscale IPs and can ping by IP, but MagicDNS names like `device.mesh.example.com` do not resolve.

**Fix:**
1. Verify `dns.magic_dns` is set to `true` in `config.yaml`
2. Check that `dns.base_domain` is set to a domain you control
3. Confirm `dns.nameservers.global` contains working upstream resolvers
4. On the client, run `tailscale dns status` to see if the DNS configuration was pushed
5. Restart the Tailscale client: `sudo tailscale down && sudo tailscale up --login-server https://headscale.example.com`
6. Some client OS configurations override Tailscale's DNS settings — check `/etc/resolv.conf` on Linux or DNS settings on macOS/Windows

## Resource Requirements

- **RAM:** ~100-200 MB depending on the number of registered nodes
- **CPU:** Minimal — Headscale is written in Go and is very efficient. A single core handles hundreds of nodes.
- **Disk:** Under 50 MB for the application. The SQLite database grows slowly — expect a few MB even with dozens of devices.

Headscale is light enough to run on a Raspberry Pi or alongside other services on a small VPS.

## Verdict

Headscale is the answer if you want a Tailscale-compatible mesh VPN without depending on Tailscale Inc. for your coordination server. You get the same excellent client apps, the same WireGuard encryption, and the same mesh networking — but your device registry, keys, and network policy stay on hardware you control.

The trade-off is real: Headscale requires more setup than signing up for Tailscale. You need a server with a public IP, a domain, HTTPS, and comfort with YAML configuration. There is no web dashboard out of the box (though third-party UIs exist). Features like Tailscale Funnel and some MagicDNS features are not fully supported.

For most people, the right path is to start with Tailscale's free tier (up to 100 devices, 3 users). Move to Headscale when you hit Tailscale's limits, want to avoid vendor lock-in, or need full sovereignty over your network metadata. If you are running infrastructure for a homelab, small team, or privacy-sensitive environment, Headscale is production-ready and actively maintained.

## Frequently Asked Questions

### What is the difference between Headscale and Tailscale?

Tailscale is a commercial product with a hosted coordination server, polished web dashboard, and managed infrastructure. Headscale is a community-built, open-source reimplementation of that coordination server. Both use the same Tailscale clients and WireGuard protocol. The difference is who controls the server that manages your network — Tailscale Inc. or you. See [Headscale vs Tailscale](/compare/headscale-vs-tailscale) for a full comparison.

### Is Headscale compatible with official Tailscale clients?

Yes. Headscale implements the Tailscale coordination protocol. Official Tailscale clients on Linux, macOS, Windows, iOS, and Android all work by pointing them at your Headscale server URL with the `--login-server` flag. No custom or forked clients are needed.

### How many devices can Headscale handle?

Headscale can handle hundreds of devices without difficulty. The SQLite database and coordination overhead are minimal. Performance depends more on your network conditions and DERP relay capacity than on Headscale itself. For large deployments (500+ nodes), consider enabling the embedded DERP server to keep relay traffic on your own infrastructure.

### Is Headscale stable enough for production?

Headscale is used in production by individuals, homelabs, and small organizations. It is actively maintained with regular releases. However, it is not at feature parity with Tailscale — some features (Funnel, certain MagicDNS capabilities, SSH) may be missing or incomplete. Check the [GitHub repository](https://github.com/juanfont/headscale) for the current feature status. For critical infrastructure, test upgrades in a staging environment before applying to production.

## Related

- [Best Self-Hosted VPN Solutions](/best/vpn)
- [How to Self-Host Tailscale](/apps/tailscale)
- [How to Self-Host WireGuard](/apps/wireguard)
- [Headscale vs Tailscale](/compare/headscale-vs-tailscale)
- [Tailscale vs WireGuard](/compare/tailscale-vs-wireguard)
- [Replace NordVPN](/replace/nordvpn)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Reverse Proxy Setup](/foundations/reverse-proxy-explained)
- [Backup Strategy](/foundations/backup-3-2-1-rule)
