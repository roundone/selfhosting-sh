---
title: "Static IP and DHCP for Self-Hosting"
description: "Configure a static IP address on your Linux server and understand DHCP — essential for reliable self-hosted services that don't change addresses."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["networking", "static-ip", "dhcp", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are DHCP and Static IPs?

DHCP (Dynamic Host Configuration Protocol) automatically assigns IP addresses to devices on your network. Your router runs a DHCP server that hands out addresses like 192.168.1.100, 192.168.1.101, etc. This works fine for laptops and phones, but self-hosted servers need a fixed address.

A static IP is an address that never changes. Your server is always at 192.168.1.50, so bookmarks, DNS records, reverse proxy configs, and other devices can always find it.

**Every self-hosted server needs a static IP.** Without one, your services break whenever the DHCP lease renews with a different address.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- SSH access ([SSH Setup Guide](/foundations/ssh-setup))
- Access to your router's admin interface
- Knowledge of your current network configuration

## Two Approaches to Static IPs

### Option 1: DHCP Reservation (Recommended)

Configure your router to always assign the same IP to your server's MAC address. The server still uses DHCP, but the router guarantees it gets the same address every time.

**Advantages:**
- Central management — all IP assignments in one place (the router)
- No server-side configuration needed
- Easy to change later from the router interface

**How to set it up:**

1. Find your server's MAC address:
```bash
ip link show
# 2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500
#     link/ether aa:bb:cc:dd:ee:ff
```

2. Find your server's current IP:
```bash
ip addr show eth0
# inet 192.168.1.100/24
```

3. Log into your router's admin page (usually `192.168.1.1`)
4. Find the DHCP reservation or "static lease" section (varies by router)
5. Add a reservation: MAC `aa:bb:cc:dd:ee:ff` → IP `192.168.1.50`

Most routers support this in the DHCP or LAN settings section. If yours doesn't, use Option 2.

### Option 2: Server-Side Static IP (Netplan)

Configure the static IP directly on the server. Ubuntu 18.04+ uses Netplan for network configuration.

1. Find your current network details:

```bash
# Current IP and interface name
ip addr show
# Look for your main interface (eth0, ens18, enp0s3, etc.)

# Current gateway (router IP)
ip route | grep default
# default via 192.168.1.1 dev eth0

# Current DNS servers
resolvectl status | grep "DNS Servers"
```

2. Edit the Netplan configuration:

```bash
# Find existing config
ls /etc/netplan/
# Usually: 00-installer-config.yaml or 01-netcfg.yaml

sudo nano /etc/netplan/00-installer-config.yaml
```

3. Set the static IP:

```yaml
# /etc/netplan/00-installer-config.yaml
network:
  version: 2
  ethernets:
    eth0:                    # Replace with your interface name
      dhcp4: false
      addresses:
        - 192.168.1.50/24   # Your chosen static IP
      routes:
        - to: default
          via: 192.168.1.1   # Your router's IP
      nameservers:
        addresses:
          - 192.168.1.1      # Router DNS (or use 1.1.1.1, 8.8.8.8)
          - 1.1.1.1           # Fallback DNS
```

4. Apply the configuration:

```bash
sudo netplan apply
```

**Warning:** If you're connected via SSH, you may lose connection if you change the IP. Connect via console or ensure the new IP is in the same subnet.

5. Verify:

```bash
ip addr show eth0
# Should show 192.168.1.50/24

ping -c 3 192.168.1.1
# Should reach your router

ping -c 3 1.1.1.1
# Should reach the internet
```

### Debian Without Netplan

Debian uses `/etc/network/interfaces` instead of Netplan:

```bash
sudo nano /etc/network/interfaces
```

```
# /etc/network/interfaces
auto eth0
iface eth0 inet static
    address 192.168.1.50
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.1 1.1.1.1
```

```bash
sudo systemctl restart networking
```

## Choosing an IP Address

### Rules for Picking a Static IP

1. **Must be in your subnet.** If your router is 192.168.1.1 with subnet mask 255.255.255.0, your server must be 192.168.1.x (where x is 2–254).

2. **Must be outside the DHCP range.** If your router assigns DHCP addresses from 192.168.1.100–192.168.1.254, pick an address below 100 for static devices.

3. **Common convention:**
   - Router: `.1`
   - Servers: `.2` – `.49`
   - Network devices (switches, APs): `.50` – `.99`
   - DHCP range: `.100` – `.254`

4. **Check it's not already in use:**

```bash
ping -c 1 192.168.1.50
# If "Destination Host Unreachable" — it's available
# If you get a reply — something else is using it
```

### Common Private IP Ranges

| Range | Subnet | Addresses | Typical Use |
|-------|--------|-----------|-------------|
| 192.168.1.0/24 | 255.255.255.0 | 254 hosts | Most home routers |
| 192.168.0.0/24 | 255.255.255.0 | 254 hosts | Some home routers |
| 10.0.0.0/24 | 255.255.255.0 | 254 hosts | Some routers, VPN networks |
| 172.16.0.0/12 | 255.240.0.0 | 1M+ hosts | Corporate/advanced setups |

## Verifying Your Configuration

After setting a static IP, verify everything works:

```bash
# Check IP assignment
ip addr show

# Check default route
ip route

# Check DNS resolution
nslookup google.com

# Check internet connectivity
ping -c 3 1.1.1.1

# Check local network
ping -c 3 192.168.1.1
```

## DNS Considerations

Once your server has a static IP, point local DNS records at it. If you run [Pi-hole](/apps/pi-hole) or [AdGuard Home](/apps/adguard-home), add local DNS entries:

```
server.local      → 192.168.1.50
jellyfin.local    → 192.168.1.50
gitea.local       → 192.168.1.50
```

For external access with a domain name, create A records in your DNS provider pointing to your public IP, and set up a reverse proxy to route traffic to the correct service. See [DNS Explained](/foundations/dns-explained) and [Reverse Proxy Explained](/foundations/reverse-proxy-explained).

## Common Mistakes

### 1. Choosing an IP Inside the DHCP Range

If your router's DHCP assigns 192.168.1.100–254 and you set your server to 192.168.1.150, the router might assign that same address to another device. Always pick an address outside the DHCP range, or use a DHCP reservation.

### 2. Wrong Subnet Mask

Using `/32` instead of `/24` (or `255.255.255.255` instead of `255.255.255.0`) makes the server think it's the only device in the network. It won't be able to reach your router.

```yaml
# Wrong
addresses:
  - 192.168.1.50/32

# Right
addresses:
  - 192.168.1.50/24
```

### 3. Forgetting the Gateway

Without a default route (gateway), the server can reach local devices but not the internet:

```yaml
routes:
  - to: default
    via: 192.168.1.1   # Don't forget this
```

### 4. Not Setting DNS Servers

Without DNS configuration, the server can ping IP addresses but can't resolve domain names. `apt update` and `docker pull` will fail.

### 5. Setting Static IP Via SSH and Getting Locked Out

If you change the IP address while connected via SSH, your connection drops. Either:
- Connect via physical console or IPMI/KVM
- Set the new IP and add a temporary second IP so you can reach the server on both addresses

```yaml
# Temporary dual-IP during migration
addresses:
  - 192.168.1.50/24   # New address
  - 192.168.1.100/24  # Old address (remove later)
```

## FAQ

### Do I need a static IP for Docker containers?

No. Docker containers communicate via Docker networks using container names as hostnames. The static IP is for the host server, not individual containers. See [Docker Networking](/foundations/docker-networking).

### Should I use DHCP reservation or server-side static IP?

DHCP reservation is simpler and keeps all IP management in one place (your router). Use server-side static IP only if your router doesn't support reservations, or if you need the server to work correctly even without a DHCP server.

### Can I have multiple static IPs on one server?

Yes. Add multiple addresses in Netplan. This is useful for running services on different IPs or during IP migrations.

### What if I need to change my server's IP later?

Update the IP in Netplan (or your router's DHCP reservation), then update all DNS records, reverse proxy configs, firewall rules, and any hardcoded references to the old IP. This is why using hostnames instead of IPs in configurations is a good practice.

### My VPS already has a static IP. Do I need to do anything?

No. Cloud VPS providers (Hetzner, DigitalOcean, Linode) assign static public IPs automatically. This guide is primarily for home servers on local networks.

## Next Steps

- [DNS Explained](/foundations/dns-explained) — point domain names at your server
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained) — route traffic to services
- [Firewall Setup with UFW](/foundations/firewall-ufw) — secure your server's network

## Related

- [DNS Explained for Self-Hosting](/foundations/dns-explained)
- [Network Ports Explained](/foundations/ports-explained)
- [Docker Networking](/foundations/docker-networking)
- [Reverse Proxy Explained](/foundations/reverse-proxy-explained)
- [Getting Started with Self-Hosting](/foundations/getting-started)
- [SSH Setup Guide](/foundations/ssh-setup)
