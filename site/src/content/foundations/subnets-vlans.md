---
title: "VLANs and Subnets for Self-Hosting"
description: "Understand VLANs, subnets, and network segmentation for your homelab — isolate IoT devices, secure self-hosted services, and organize traffic."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["networking", "vlans", "subnets", "security", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Are Subnets and VLANs?

A **subnet** is a logical division of an IP network. Your home network is typically one subnet (192.168.1.0/24), where all devices can talk to each other. Subnetting divides this into smaller, isolated networks.

A **VLAN** (Virtual Local Area Network) creates separate logical networks on the same physical switch. Devices on VLAN 10 can't communicate with devices on VLAN 20 without a router explicitly allowing it.

For self-hosting, VLANs and subnets let you isolate IoT devices from your server, separate guest WiFi from your homelab, and keep your management network locked down.

## Prerequisites

- A managed switch that supports VLANs (unmanaged switches don't)
- A router or firewall that supports VLANs (pfSense, OPNsense, or a VLAN-aware consumer router)
- Basic networking knowledge ([Network Ports](/foundations/ports-explained), [Static IP](/foundations/dhcp-static-ip))
- Understanding of IP addressing

## Subnets Explained

### CIDR Notation

Subnets are written in CIDR notation: `192.168.1.0/24`. The `/24` indicates how many bits are used for the network portion.

| CIDR | Subnet Mask | Available Hosts | Range |
|------|-------------|-----------------|-------|
| /24 | 255.255.255.0 | 254 | 192.168.1.1 – 192.168.1.254 |
| /25 | 255.255.255.128 | 126 | 192.168.1.1 – 192.168.1.126 |
| /16 | 255.255.0.0 | 65,534 | 192.168.0.1 – 192.168.255.254 |
| /8 | 255.0.0.0 | 16 million+ | 10.0.0.1 – 10.255.255.254 |

For home networks, /24 subnets (254 hosts) are the standard. One per VLAN.

### Private IP Ranges

Use these for internal networks. They're not routable on the internet.

| Range | Typical Use |
|-------|-------------|
| 10.0.0.0/8 | Large networks, often split into /24s per VLAN |
| 172.16.0.0/12 | Less common at home, used by Docker internally |
| 192.168.0.0/16 | Most home routers default to this |

**Convention for homelab VLANs:**

| VLAN ID | Subnet | Purpose |
|---------|--------|---------|
| 1 | 192.168.1.0/24 | Default / Management |
| 10 | 10.10.10.0/24 | Servers / Homelab |
| 20 | 10.10.20.0/24 | IoT Devices |
| 30 | 10.10.30.0/24 | Guest WiFi |
| 40 | 10.10.40.0/24 | Work / Trusted Devices |

## Why Segment Your Network?

### Security Isolation

Without VLANs, a compromised smart light bulb can scan your entire network — including your Nextcloud server with all your files. With VLANs, IoT devices are on a separate network with no access to your servers.

### Traffic Management

Separate heavy traffic (media streaming, backups) from latency-sensitive traffic (VoIP, gaming). VLANs + QoS rules prevent one type of traffic from overwhelming another.

### Access Control

Control which networks can reach your self-hosted services:

- Trusted devices (VLAN 40) → Full access to all services
- IoT devices (VLAN 20) → Internet only, no access to other VLANs
- Guest WiFi (VLAN 30) → Internet only, no local access
- Server VLAN (VLAN 10) → Accessible from VLAN 40, not from 20 or 30

## Setting Up VLANs

### Step 1: Configure the Managed Switch

This varies by switch manufacturer. The general process:

1. Log into your switch's web interface
2. Create VLANs (10, 20, 30, 40)
3. Assign ports:
   - **Tagged (trunk) ports:** Carry multiple VLANs. Connect these to your router and VLAN-aware access points.
   - **Untagged (access) ports:** Carry one VLAN. Connect end devices here.

Example port assignment:

| Port | Mode | VLANs | Connected Device |
|------|------|-------|-----------------|
| 1 | Trunk (tagged) | 1, 10, 20, 30, 40 | Router |
| 2 | Trunk (tagged) | 1, 30, 40 | WiFi Access Point |
| 3 | Access (untagged) | 10 | Server |
| 4 | Access (untagged) | 10 | NAS |
| 5 | Access (untagged) | 20 | IoT Hub |

### Step 2: Configure the Router/Firewall

Your router needs VLAN interfaces to route between subnets. With pfSense or OPNsense:

1. Create VLAN interfaces on the LAN port for each VLAN ID
2. Assign each VLAN interface an IP address (the gateway for that subnet)
3. Set up DHCP for each VLAN subnet
4. Create firewall rules to control inter-VLAN traffic

Example interface configuration:

| Interface | VLAN | IP Address | DHCP Range |
|-----------|------|------------|------------|
| LAN | 1 | 192.168.1.1/24 | .100 – .254 |
| SERVERS | 10 | 10.10.10.1/24 | .100 – .254 |
| IOT | 20 | 10.10.20.1/24 | .100 – .254 |
| GUEST | 30 | 10.10.30.1/24 | .100 – .254 |
| TRUSTED | 40 | 10.10.40.1/24 | .100 – .254 |

### Step 3: Firewall Rules

The critical part — controlling which VLANs can talk to each other:

```
# SERVERS (VLAN 10) rules:
ALLOW — SERVERS → Internet (all ports)
ALLOW — SERVERS → SERVERS (internal communication)
DENY  — SERVERS → all other VLANs

# IOT (VLAN 20) rules:
ALLOW — IOT → Internet (ports 80, 443, 53, 123 only)
DENY  — IOT → all local networks (including SERVERS)

# GUEST (VLAN 30) rules:
ALLOW — GUEST → Internet (ports 80, 443, 53 only)
DENY  — GUEST → all local networks

# TRUSTED (VLAN 40) rules:
ALLOW — TRUSTED → SERVERS (all ports)
ALLOW — TRUSTED → Internet (all ports)
DENY  — TRUSTED → IOT
DENY  — TRUSTED → GUEST
```

**Key principle:** Only VLAN 40 (trusted devices) can access VLAN 10 (servers). IoT and guests can only reach the internet.

### Step 4: WiFi VLAN Integration

If your access point supports multiple SSIDs with VLAN tagging:

| SSID | VLAN | Purpose |
|------|------|---------|
| HomeNet | 40 | Trusted devices |
| IoT-Net | 20 | Smart home devices |
| Guest | 30 | Visitors |

Configure the AP's uplink port as a trunk port carrying VLANs 20, 30, and 40.

## VLANs with Linux

Your Linux server can be VLAN-aware, connecting to multiple VLANs from a single physical interface.

### Netplan Configuration (Ubuntu)

```yaml
# /etc/netplan/00-vlans.yaml
network:
  version: 2
  ethernets:
    eth0:
      dhcp4: false
  vlans:
    vlan10:
      id: 10
      link: eth0
      addresses:
        - 10.10.10.50/24
      routes:
        - to: default
          via: 10.10.10.1
      nameservers:
        addresses:
          - 10.10.10.1
    vlan20:
      id: 20
      link: eth0
      addresses:
        - 10.10.20.50/24
```

```bash
sudo netplan apply
```

This puts your server on both VLAN 10 (as 10.10.10.50) and VLAN 20 (as 10.10.20.50). Useful if your server needs to communicate with IoT devices (e.g., Home Assistant managing smart devices on VLAN 20).

## Docker and VLANs

Docker containers can be connected to VLANs using macvlan networks:

```yaml
# docker-compose.yml
services:
  pihole:
    image: pihole/pihole:2024.07.0
    networks:
      vlan10:
        ipv4_address: 10.10.10.53

networks:
  vlan10:
    driver: macvlan
    driver_opts:
      parent: eth0.10    # VLAN 10 interface
    ipam:
      config:
        - subnet: 10.10.10.0/24
          gateway: 10.10.10.1
          ip_range: 10.10.10.48/29   # Small range for containers
```

This gives the container its own IP on VLAN 10, visible to all devices on that VLAN. Useful for DNS servers (Pi-hole) that need to be reachable by all devices.

**Note:** The host cannot communicate with macvlan containers by default. Create a macvlan bridge interface on the host if you need host-to-container communication.

## Common Mistakes

### 1. Buying an Unmanaged Switch

Unmanaged switches don't support VLANs. If you want network segmentation, you need a managed switch. Entry-level options: TP-Link TL-SG108E, Netgear GS308E.

### 2. Blocking DNS on IoT VLAN

IoT devices need DNS (port 53) to function. If you block all traffic from the IoT VLAN, smart home devices can't resolve domain names and stop working. Always allow DNS traffic to your DNS server or the internet.

### 3. Not Planning IP Addressing First

Decide your VLAN IDs, subnets, and IP ranges before configuring anything. Changing them later requires reconfiguring every device.

### 4. Trunk Port Instead of Access Port for End Devices

End devices (servers, IoT) should connect to access (untagged) ports. Only routers, switches, and VLAN-aware access points need trunk (tagged) ports. Connecting a regular device to a trunk port results in no connectivity.

### 5. Forgetting to Allow Return Traffic

Firewall rules are often stateful — if you allow VLAN 40 to reach VLAN 10, return traffic is automatically allowed. But if you're using stateless rules, you need explicit rules in both directions.

## When NOT to Use VLANs

VLANs add complexity. Skip them if:

- You have fewer than 10 devices and no IoT
- You're just starting with self-hosting (get your services working first)
- You don't have a managed switch or VLAN-capable router
- Your threat model doesn't require network isolation

Start with a flat network, add VLANs later when you understand your traffic patterns and security needs.

## FAQ

### Do I need VLANs for self-hosting?

No. VLANs are a security and organization measure, not a requirement. Many successful homelabs run on flat networks. Add VLANs when you have IoT devices you don't trust or want to enforce access controls between network segments.

### Can I set up VLANs with a consumer router?

Some consumer routers support VLANs (ASUS, Ubiquiti). Most don't. For proper VLAN support, use pfSense, OPNsense, or a Ubiquiti UniFi setup. These can run on a mini PC or dedicated appliance.

### What's the difference between a VLAN and a subnet?

A subnet is an IP addressing concept — a range of IP addresses. A VLAN is a Layer 2 switching concept — a way to isolate network segments on the same physical switch. In practice, each VLAN gets its own subnet. They work together but are different layers.

### How many VLANs should I create?

Start with 3-4: management, servers, IoT, and guest. Add more only when you have a clear reason. More VLANs = more firewall rules to maintain.

### Can Docker containers be on different VLANs?

Yes, using macvlan Docker networks. Each container gets its own IP on the VLAN. This is most useful for network services like DNS (Pi-hole) or DHCP servers.

## Next Steps

- [Firewall Setup with UFW](/foundations/firewall-ufw) — secure each VLAN
- [DNS Explained](/foundations/dns-explained) — set up DNS per VLAN
- [Static IP and DHCP](/foundations/dhcp-static-ip) — assign addresses on each subnet

## Related

- [Network Ports Explained](/foundations/ports-explained)
- [Static IP and DHCP](/foundations/dhcp-static-ip)
- [DNS Explained for Self-Hosting](/foundations/dns-explained)
- [Firewall Setup with UFW](/foundations/firewall-ufw)
- [Docker Networking](/foundations/docker-networking)
- [Getting Started with Self-Hosting](/foundations/getting-started)
