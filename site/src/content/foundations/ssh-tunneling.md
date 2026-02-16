---
title: "SSH Tunneling Guide for Self-Hosting"
description: "Use SSH tunnels to securely access self-hosted services — local forwarding, remote forwarding, and SOCKS proxies explained."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "ssh", "tunneling", "remote-access", "security"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is SSH Tunneling?

SSH tunneling (port forwarding) encrypts and forwards network traffic through an SSH connection. It lets you securely access services on a remote server as if they were running locally — without opening additional ports or setting up a VPN.

For self-hosting, SSH tunnels are useful when:
- You need to access a web UI (Portainer, Grafana, database admin) that isn't exposed through your reverse proxy
- You're debugging a service and need temporary access to an internal port
- You want to access your server securely from a coffee shop without a full VPN
- You need to bypass restrictive firewalls

SSH tunneling requires SSH access to your server — see [SSH Setup](/foundations/ssh-setup) if you haven't configured that yet.

## Prerequisites

- SSH access to your server with key-based authentication — see [SSH Setup](/foundations/ssh-setup)
- OpenSSH client on your local machine (built into Linux, macOS, and Windows 10+)
- A service running on your server that you want to access

## Local Port Forwarding

Local forwarding maps a port on your local machine to a port on the remote server. Traffic to `localhost:LOCAL_PORT` gets tunneled through SSH to `REMOTE_HOST:REMOTE_PORT`.

### Syntax

```bash
ssh -L LOCAL_PORT:REMOTE_HOST:REMOTE_PORT user@server
```

### Example: Access Portainer

Portainer runs on port 9443 on your server but isn't exposed through your reverse proxy. Forward it to your local machine:

```bash
ssh -L 9443:localhost:9443 user@yourserver.com
```

Now open `https://localhost:9443` in your browser. The traffic is encrypted through the SSH tunnel to Portainer on the server.

### Example: Access a Database

PostgreSQL runs on port 5432 on your server, only listening on localhost (not exposed to the network). Connect to it from your local machine:

```bash
ssh -L 5432:localhost:5432 user@yourserver.com
```

Now your local database tools (pgAdmin, DBeaver, `psql`) can connect to `localhost:5432` and reach the remote database.

If you already have PostgreSQL running locally on 5432, use a different local port:

```bash
ssh -L 15432:localhost:5432 user@yourserver.com
```

Connect your tools to `localhost:15432` instead.

### Example: Access a Service on a Different Host

SSH tunnels can forward to any host reachable from the SSH server, not just localhost. If your server can reach a NAS at `192.168.1.20`:

```bash
ssh -L 5000:192.168.1.20:5000 user@yourserver.com
```

This forwards `localhost:5000` through the SSH server to port 5000 on the NAS. Useful when the NAS isn't directly reachable from your current network.

## Remote Port Forwarding

Remote forwarding is the reverse — it makes a port on your local machine accessible from the remote server. Traffic to `SERVER:REMOTE_PORT` gets tunneled back to `LOCAL_HOST:LOCAL_PORT`.

### Syntax

```bash
ssh -R REMOTE_PORT:LOCAL_HOST:LOCAL_PORT user@server
```

### Example: Expose a Local Development Server

You're developing a web app locally on port 3000 and want to test it from your server or share it temporarily:

```bash
ssh -R 8080:localhost:3000 user@yourserver.com
```

On the server, `localhost:8080` now reaches your local development server. By default, remote forwarding only binds to the server's localhost. To make it accessible on the server's network, the SSH server must have `GatewayPorts yes` in `/etc/ssh/sshd_config`.

### Example: Expose a Service Behind CGNAT

If your home server is behind CGNAT (no public IP), you can expose a service through a VPS:

```bash
# On your home server, create a tunnel to your VPS
ssh -R 8080:localhost:8096 user@your-vps.com
```

Now `your-vps.com:8080` reaches Jellyfin on your home server. For a more robust version of this, consider [Cloudflare Tunnel](/foundations/cloudflare-tunnel) or [Tailscale](/foundations/tailscale-setup).

## Dynamic Port Forwarding (SOCKS Proxy)

Dynamic forwarding creates a SOCKS proxy on your local machine. All traffic routed through the proxy gets tunneled through the SSH server. This is useful for routing browser traffic through your server.

### Syntax

```bash
ssh -D LOCAL_PORT user@server
```

### Example: Browse Through Your Server

```bash
ssh -D 1080 user@yourserver.com
```

Configure your browser to use `localhost:1080` as a SOCKS5 proxy. All browser traffic now goes through your server's network. This lets you access internal services by their local IPs and hostnames.

In Firefox: Settings → Network Settings → Manual proxy → SOCKS Host: `localhost`, Port: `1080`, SOCKS v5.

## Useful Flags

| Flag | Purpose |
|------|---------|
| `-N` | Don't open a shell, just forward ports |
| `-f` | Run in the background after connecting |
| `-L` | Local port forwarding |
| `-R` | Remote port forwarding |
| `-D` | Dynamic (SOCKS) forwarding |
| `-o ServerAliveInterval=60` | Keep the connection alive |
| `-o ExitOnForwardFailure=yes` | Exit if port forwarding fails |

### Combining Flags

Run a tunnel in the background without a shell:

```bash
ssh -fN -L 9443:localhost:9443 user@yourserver.com
```

This starts the tunnel and returns you to your terminal. The SSH process runs in the background.

To stop a background tunnel:

```bash
# Find the SSH process
ps aux | grep "ssh -fN"

# Kill it
kill <PID>
```

## Persistent Tunnels with autossh

Plain SSH tunnels break when the network drops. `autossh` monitors the connection and automatically reconnects.

```bash
# Install autossh
sudo apt install -y autossh

# Start a persistent tunnel
autossh -M 0 -fN -o "ServerAliveInterval=30" -o "ServerAliveCountMax=3" \
  -L 9443:localhost:9443 user@yourserver.com
```

The `-M 0` flag uses SSH's built-in keepalive (`ServerAliveInterval`) instead of autossh's monitoring port. `ServerAliveCountMax=3` means disconnect after 3 missed keepalives (90 seconds).

### autossh as a systemd Service

For tunnels that should survive reboots:

```ini
# /etc/systemd/system/ssh-tunnel-portainer.service
[Unit]
Description=SSH Tunnel to Portainer
After=network-online.target
Wants=network-online.target

[Service]
User=tunneluser
ExecStart=/usr/bin/autossh -M 0 -N -o "ServerAliveInterval=30" -o "ServerAliveCountMax=3" -L 9443:localhost:9443 user@yourserver.com
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable --now ssh-tunnel-portainer
```

## SSH Config for Easier Tunneling

Add tunnel configurations to `~/.ssh/config` to avoid typing long commands:

```
# ~/.ssh/config
Host server-portainer
    HostName yourserver.com
    User myuser
    LocalForward 9443 localhost:9443
    IdentityFile ~/.ssh/id_ed25519

Host server-db
    HostName yourserver.com
    User myuser
    LocalForward 5432 localhost:5432
    LocalForward 6379 localhost:6379
    IdentityFile ~/.ssh/id_ed25519

Host server-proxy
    HostName yourserver.com
    User myuser
    DynamicForward 1080
    IdentityFile ~/.ssh/id_ed25519
```

Now connect with just:

```bash
ssh -fN server-portainer
```

## Common Mistakes

### Forgetting -N (Opening an Interactive Shell)

Without `-N`, SSH opens a shell session alongside the tunnel. If you only need the tunnel, add `-N` to avoid an unnecessary shell.

### Port Already in Use

If the local port is already in use, the tunnel silently fails to bind. Check with:

```bash
ss -tlnp | grep :9443
```

Use a different local port if needed: `-L 19443:localhost:9443`.

### Tunnel Drops Without Keepalive

Network interruptions or idle timeouts kill SSH connections. Always use `ServerAliveInterval`:

```bash
ssh -o ServerAliveInterval=60 -L 9443:localhost:9443 user@server
```

Or set it globally in `~/.ssh/config`:

```
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### Using SSH Tunnels for Everything

SSH tunnels are great for ad-hoc access and debugging. For permanent remote access to multiple services, use a proper solution: [Tailscale](/foundations/tailscale-setup), [WireGuard](/foundations/wireguard-setup), or a [reverse proxy](/foundations/reverse-proxy-explained) with [Cloudflare Tunnel](/foundations/cloudflare-tunnel).

## Next Steps

- Set up SSH properly — [SSH Setup](/foundations/ssh-setup)
- For permanent remote access — [Tailscale Setup](/foundations/tailscale-setup) or [WireGuard VPN Setup](/foundations/wireguard-setup)
- Secure your server — [Firewall Setup with UFW](/foundations/firewall-ufw)
- Learn about reverse proxies — [Reverse Proxy Explained](/foundations/reverse-proxy-explained)

## FAQ

### Is SSH tunneling secure?

Yes. Traffic through an SSH tunnel is encrypted end-to-end with the same algorithms used for your SSH session. It's as secure as your SSH connection — use key-based authentication and disable password auth for best security.

### Can I forward multiple ports at once?

Yes. Add multiple `-L` flags:

```bash
ssh -L 9443:localhost:9443 -L 3000:localhost:3000 -L 5432:localhost:5432 user@server
```

Or define multiple `LocalForward` lines in `~/.ssh/config`.

### SSH tunnel vs VPN — when to use which?

SSH tunnels are per-port and ad-hoc — good for accessing specific services temporarily. A VPN (Tailscale, WireGuard) gives your device full network access to the remote network — better for permanent access to multiple services. Use SSH tunnels for quick access; use a VPN for daily use.

## Related

- [SSH Setup](/foundations/ssh-setup)
- [Tailscale Setup](/foundations/tailscale-setup)
- [WireGuard VPN Setup](/foundations/wireguard-setup)
- [Cloudflare Tunnel Setup](/foundations/cloudflare-tunnel)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
