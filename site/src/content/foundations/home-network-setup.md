---
title: "Home Network Setup for Self-Hosting"
description: "Configure your home network for self-hosting — router settings, static IPs, DNS, VLANs, and port forwarding for reliable services."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "networking", "home-network", "router", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Home Network Setup for Self-Hosting?

Running self-hosted services on your home network requires more than plugging in a server. Your router, DNS, IP addressing, and network segmentation all affect reliability, security, and remote access. A poorly configured home network leads to services going offline after router reboots, IP conflicts, and security exposure.

This guide walks through the network configuration changes you need to make your home server setup production-grade — without enterprise hardware.

## Prerequisites

- A home router with admin access (most consumer routers work)
- A server or mini PC for hosting — see [Getting Started with Self-Hosting](/foundations/getting-started)
- Basic understanding of IP addresses — see [DHCP and Static IPs](/foundations/dhcp-static-ip)
- SSH access to your server — see [SSH Setup](/foundations/ssh-setup)

## Step 1: Assign a Static IP to Your Server

DHCP assigns random IPs that change over time. Your server needs a fixed address so other devices and services can always reach it.

You have two options:

### Option A: DHCP Reservation (Recommended)

Configure your router to always assign the same IP to your server's MAC address. This keeps DHCP management centralized on the router.

1. Log into your router admin panel (usually `192.168.1.1` or `192.168.0.1`)
2. Find **DHCP Reservations**, **Static Leases**, or **Address Reservation** (varies by router)
3. Add your server's MAC address and the IP you want to assign
4. Save and reboot the router

Find your server's MAC address:

```bash
ip link show
```

Look for the `link/ether` line on your primary network interface (usually `eth0` or `enp0s3`).

### Option B: Static IP on the Server

Configure the IP directly on the server using Netplan (Ubuntu 22.04+):

```yaml
# /etc/netplan/01-static.yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 192.168.1.1
          - 1.1.1.1
```

Apply the configuration:

```bash
sudo netplan apply
```

Pick an IP outside your router's DHCP range to avoid conflicts. Most routers use `192.168.1.100-254` for DHCP — assign your server something like `192.168.1.10`.

For a deeper dive on this topic, see [DHCP and Static IPs Explained](/foundations/dhcp-static-ip).

## Step 2: Configure DNS

Your server needs reliable DNS resolution, and ideally your local devices should resolve your server's hostname without memorizing IPs.

### Local DNS with Pi-hole or AdGuard Home

Running [Pi-hole](/apps/pi-hole) or [AdGuard Home](/apps/adguard-home) gives you:

- Ad blocking for all devices on your network
- Local DNS records so you can access services by name (e.g., `immich.home` instead of `192.168.1.100:2283`)
- DNS query logging for troubleshooting

Point your router's DHCP DNS setting to your Pi-hole/AdGuard Home IP. All devices on the network will then use it automatically.

### Without a Local DNS Server

At minimum, configure your server to use reliable upstream DNS:

```bash
# /etc/systemd/resolved.conf
[Resolve]
DNS=1.1.1.1 9.9.9.9
FallbackDNS=8.8.8.8
```

Restart the resolver:

```bash
sudo systemctl restart systemd-resolved
```

For more about DNS, see [DNS Explained](/foundations/dns-explained).

## Step 3: Port Forwarding for External Access

If you want to access services from outside your home network, you need to forward ports from your router to your server. This is required for hosting public-facing services like websites, email, or file sharing.

### Basic Port Forwarding

1. Log into your router admin panel
2. Find **Port Forwarding** or **NAT/Virtual Server**
3. Create rules:

| Service | External Port | Internal IP | Internal Port | Protocol |
|---------|--------------|-------------|---------------|----------|
| HTTP | 80 | 192.168.1.100 | 80 | TCP |
| HTTPS | 443 | 192.168.1.100 | 443 | TCP |
| WireGuard | 51820 | 192.168.1.100 | 51820 | UDP |

Only forward ports you actually need. Every open port is a potential attack surface.

### Better Alternative: Cloudflare Tunnel or Tailscale

Port forwarding exposes your home IP and requires a firewall. For most self-hosters, a tunnel-based approach is safer:

- **[Cloudflare Tunnel](/foundations/cloudflare-tunnel)** — exposes web services through Cloudflare's network without opening ports
- **[Tailscale](/foundations/tailscale-setup)** — creates a private mesh VPN for accessing services remotely without any port forwarding
- **[WireGuard](/foundations/wireguard-setup)** — a fast VPN for encrypted remote access

For the full guide on port forwarding, see [Port Forwarding Guide](/foundations/port-forwarding).

## Step 4: Network Segmentation (Optional but Recommended)

Putting your server on the same network as your family's phones, laptops, and IoT devices is a security risk. If your server is compromised, the attacker has access to everything. VLANs isolate traffic between segments.

### Simple Segmentation with VLANs

If your router supports VLANs (most aftermarket firmware like OpenWrt, pfSense, or OPNsense do):

| VLAN | Purpose | Subnet |
|------|---------|--------|
| VLAN 1 | Personal devices | 192.168.1.0/24 |
| VLAN 10 | Servers | 192.168.10.0/24 |
| VLAN 20 | IoT devices | 192.168.20.0/24 |

Create firewall rules to control inter-VLAN traffic:
- Personal devices can access servers (to use services)
- IoT devices cannot access servers or personal devices
- Servers can access the internet (for updates and external APIs)

For a detailed VLAN walkthrough, see [Subnets and VLANs Explained](/foundations/subnets-vlans).

### Without VLAN Support

If your router doesn't support VLANs, at minimum:
- Use a strong firewall on your server — see [Firewall Setup with UFW](/foundations/firewall-ufw)
- Disable UPnP on your router (it allows devices to open ports without your permission)
- Keep your server's SSH hardened — see [SSH Setup](/foundations/ssh-setup)

## Step 5: Set Up a Reverse Proxy

A reverse proxy sits in front of your self-hosted services and routes traffic based on domain names. Instead of accessing `192.168.1.100:8096` for Jellyfin and `192.168.1.100:2283` for Immich, you access `jellyfin.yourdomain.com` and `immich.yourdomain.com`.

Benefits:
- Clean URLs instead of port numbers
- Automatic SSL/TLS certificates (HTTPS)
- Single entry point for all services

The most popular options for self-hosters:

- **[Nginx Proxy Manager](/foundations/nginx-proxy-manager-setup)** — web-based GUI, easiest for beginners
- **[Traefik](/foundations/traefik-setup)** — automatic Docker integration, config-as-code
- **[Caddy](/foundations/caddy-setup)** — automatic HTTPS, simple config syntax

For the conceptual overview, see [Reverse Proxy Explained](/foundations/reverse-proxy-explained).

## Step 6: Dynamic DNS

Most home internet connections have a dynamic public IP that changes periodically. Dynamic DNS maps a hostname (like `home.yourdomain.com`) to your current IP and updates automatically when it changes.

You need this if you're using port forwarding for external access. You don't need it if you're using Cloudflare Tunnel or Tailscale exclusively.

For the full setup guide, see [Dynamic DNS Setup](/foundations/dynamic-dns).

## Step 7: UPS (Uninterruptible Power Supply)

A UPS keeps your server running during short power outages and gives it time to shut down gracefully during longer ones. Without a UPS, power loss can corrupt databases and filesystems.

For a home server, a 600-1000VA UPS is sufficient. Connect the UPS to your server via USB, then install NUT (Network UPS Tools) to monitor battery status and trigger automatic shutdown:

```bash
sudo apt install -y nut

# Check that the UPS is detected
sudo nut-scanner -U
```

Configure `/etc/nut/ups.conf` with your UPS details and set up automatic shutdown at 20% battery.

## Recommended Network Topology

Here's a solid home network layout for self-hosting:

```
Internet
  │
  ▼
[Modem/ONT]
  │
  ▼
[Router/Firewall] ─── VLAN 1: Personal Devices
  │                    (laptops, phones)
  │
  ├── VLAN 10: Servers
  │    ├── Main Server (192.168.10.10)
  │    │    ├── Reverse Proxy (ports 80, 443)
  │    │    ├── Docker containers
  │    │    └── Pi-hole / AdGuard Home (DNS)
  │    └── NAS (192.168.10.20) — optional
  │
  └── VLAN 20: IoT Devices
       (smart home devices, cameras)
```

## Common Mistakes

### Using Wi-Fi for the Server

Always use a wired Ethernet connection for your server. Wi-Fi adds latency, drops packets under load, and is unreliable for 24/7 services. Even a cheap USB-to-Ethernet adapter is better than Wi-Fi.

### Not Disabling UPnP

UPnP lets devices on your network open ports on your router without your knowledge. IoT devices and malware exploit this. Disable it in your router settings and manually configure port forwarding for the services you need.

### Forgetting About Hairpin NAT

If you port-forward a service and try to access it from inside your network using your public IP or domain, it may not work. This is a hairpin NAT (or NAT loopback) issue. Solutions:
- Use local DNS (Pi-hole/AdGuard Home) to resolve your domain to the server's local IP
- Enable hairpin NAT in your router (if supported)
- Use split-horizon DNS

### Ignoring IPv6

Your ISP may provide IPv6. If it does, your server might be directly reachable from the internet on IPv6 without any port forwarding — which means without any firewall rules too. Either configure your firewall for IPv6 or disable it on your server if you're not using it.

## Next Steps

- Set up Docker to run self-hosted apps — [Docker Compose Basics](/foundations/docker-compose-basics)
- Deploy your first app — [Getting Started with Self-Hosting](/foundations/getting-started)
- Secure your server — [Firewall Setup with UFW](/foundations/firewall-ufw)
- Set up encrypted remote access — [Tailscale Setup](/foundations/tailscale-setup) or [WireGuard VPN Setup](/foundations/wireguard-setup)

## FAQ

### Do I need a domain name to self-host?

No. You can access everything by IP address on your local network. But a domain name makes things much easier — you get clean URLs, automatic SSL certificates, and remote access. Domains cost around $10/year.

### Can I self-host behind CGNAT?

CGNAT (Carrier-Grade NAT) means your ISP shares a public IP among multiple customers. Port forwarding won't work. Use [Cloudflare Tunnel](/foundations/cloudflare-tunnel) or [Tailscale](/foundations/tailscale-setup) instead — both work behind CGNAT without opening any ports.

### How much bandwidth do I need?

For personal use (1-5 users), a standard home internet connection (50+ Mbps download, 10+ Mbps upload) is fine. Upload speed is what matters for serving content. If you're streaming media externally via Jellyfin, you'll want at least 20 Mbps upload per concurrent stream.

### Should I use my ISP's router or buy my own?

ISP routers are usually limited in features — poor VLAN support, no advanced firewall, limited DHCP options. A dedicated router running pfSense, OPNsense, or OpenWrt gives you full control. Even a $50 used mini PC running OPNsense is a significant upgrade.

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started)
- [DHCP and Static IPs Explained](/foundations/dhcp-static-ip)
- [DNS Explained](/foundations/dns-explained)
- [Port Forwarding Guide](/foundations/port-forwarding)
- [Subnets and VLANs Explained](/foundations/subnets-vlans)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Cloudflare Tunnel Setup](/foundations/cloudflare-tunnel)
- [Tailscale Setup](/foundations/tailscale-setup)
