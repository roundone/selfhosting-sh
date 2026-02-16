---
title: "Homelab Network Topology Guide"
description: "How to design your homelab network. VLANs, subnets, firewall rules, and network topology for self-hosting with security and performance."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "networking", "vlan", "topology", "firewall"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Start with a flat network and add VLANs when you have a reason.** A single subnet with all devices on it works fine for most self-hosters. When you add IoT devices, a separate network for untrusted devices, or expose services to the internet, VLANs add meaningful security.

You need a managed switch ($30–60) and a router/firewall that supports VLANs (OPNsense, pfSense, or a prosumer router like MikroTik/Ubiquiti). Consumer routers from ISPs usually don't support VLANs.

## Network Topologies

### Topology 1: Simple Flat Network (Start Here)

```
Internet ─── ISP Router/Modem ─── Switch ─┬── Server
                                           ├── Desktop
                                           ├── Laptop (Wi-Fi)
                                           └── Other devices
```

**Everything on one subnet:** 192.168.1.0/24. All devices can see all other devices. Simple, zero configuration.

**When this is enough:**
- Single home server running Docker containers
- No IoT devices you don't trust
- No services exposed to the internet
- Fewer than 20 devices total

**Pros:** Zero complexity. Everything just works.
**Cons:** No isolation. A compromised IoT device can access your NAS.

### Topology 2: Segmented with VLANs (Recommended)

```
Internet ─── OPNsense Router ─── Managed Switch ─┬── VLAN 1 (Management): Router, Switch, APs
                                                   ├── VLAN 10 (Trusted): Desktop, Laptop
                                                   ├── VLAN 20 (Servers): Home server, NAS
                                                   ├── VLAN 30 (IoT): Smart home, cameras
                                                   └── VLAN 40 (Guest): Guest Wi-Fi
```

**Four VLANs** with firewall rules controlling traffic between them:

| VLAN | Subnet | Purpose | Can Access |
|------|--------|---------|------------|
| 1 (Management) | 192.168.1.0/24 | Network infrastructure | Everything (admin only) |
| 10 (Trusted) | 10.0.10.0/24 | Your personal devices | Servers, Internet |
| 20 (Servers) | 10.0.20.0/24 | Home server, NAS | Internet (for updates), limited |
| 30 (IoT) | 10.0.30.0/24 | Smart home devices | Home Assistant only, Internet |
| 40 (Guest) | 10.0.40.0/24 | Guest devices | Internet only |

**Key firewall rules:**
- Trusted → Servers: Allow (you access your services)
- Servers → Trusted: Block (server can't initiate connections to your laptop)
- IoT → Servers: Allow to Home Assistant only (port 8123)
- IoT → Trusted: Block (IoT can't see your personal devices)
- IoT → Internet: Allow (for cloud-dependent IoT devices) or Block (for fully local IoT)
- Guest → Everything: Block except Internet
- Management → Everything: Allow (admin access)

### Topology 3: DMZ for Public Services

```
Internet ─── OPNsense ─┬── WAN (public IP)
                        ├── DMZ (VLAN 50): Reverse proxy, public services
                        ├── LAN (VLANs 1-40): Internal network
                        └── (firewall between DMZ and LAN)
```

Add a DMZ VLAN if you expose services to the internet (via port forwarding or a public IP). The reverse proxy sits in the DMZ, forwarding requests to internal servers via strict firewall rules.

**DMZ rules:**
- Internet → DMZ: Allow ports 80, 443 only
- DMZ → Servers: Allow specific ports to specific services
- DMZ → Trusted/IoT: Block everything
- LAN → DMZ: Allow (for management)

This is the most secure topology for public-facing self-hosted services. An attacker compromising the reverse proxy can't reach your internal network without bypassing the firewall.

## Hardware Required

### Router/Firewall

| Device | CPU | RAM | Ports | VPN Throughput | Price |
|--------|-----|-----|-------|---------------|-------|
| Protectli VP2420 | Celeron J6412 | 4–16 GB | 4x 2.5G | ~1 Gbps | $230–350 |
| Qotom Mini PC (OPNsense) | N100 | 8–16 GB | 4x 2.5G | ~2.5 Gbps | $180–250 |
| MikroTik hEX S | MT7621A | 256 MB | 5x 1G + SFP | ~500 Mbps | ~$60 |
| Old PC + OPNsense | Any x86 | 4+ GB | 2+ NICs | Varies | $0 (repurpose) |
| Ubiquiti Dream Machine Pro | ARM Cortex-A57 | 4 GB | 8x 1G + SFP+ | ~800 Mbps | ~$380 |

**Recommendation:** A Qotom or Protectli mini PC running OPNsense. Dedicated firewall appliance with 4 NICs, runs OPNsense or pfSense, handles VLANs + firewall + VPN. $200–300 total.

**Budget option:** MikroTik hEX S at $60. RouterOS supports VLANs, firewalling, and most features. Steeper learning curve than OPNsense but incredibly capable for the price.

### Managed Switch

| Switch | Ports | PoE | Speed | VLAN Support | Price |
|--------|-------|-----|-------|-------------|-------|
| TP-Link TL-SG108E | 8 | No | 1G | Yes (802.1Q) | ~$30 |
| TP-Link TL-SG2210MP | 10 | Yes (8 PoE+) | 1G | Yes | ~$120 |
| MikroTik CSS610-8G-2S+IN | 8+2 SFP+ | No | 1G + 10G | Yes | ~$80 |
| Ubiquiti USW-24-POE | 24 | Yes (16 PoE+) | 1G | Yes | ~$300 |
| Netgear MS108EUP | 8 | Yes (4 PoE++) | 2.5G | Yes | ~$150 |

**For VLANs:** The TP-Link TL-SG108E at $30 is the cheapest managed switch that supports 802.1Q VLANs. Enough for most homelabs.

**For PoE (access points, cameras):** TP-Link TL-SG2210MP at $120 gives you 8 PoE+ ports. Powers access points and PoE cameras without separate power adapters.

### Access Points

For VLAN-tagged SSIDs (different Wi-Fi networks per VLAN):

| AP | Wi-Fi | VLAN SSIDs | PoE | Price |
|----|-------|-----------|-----|-------|
| TP-Link EAP245 | Wi-Fi 5 | Yes (up to 8) | Yes | ~$70 |
| TP-Link EAP670 | Wi-Fi 6 | Yes (up to 16) | Yes | ~$120 |
| Ubiquiti U6 Lite | Wi-Fi 6 | Yes | Yes | ~$100 |
| Ubiquiti U6 Pro | Wi-Fi 6 | Yes | Yes | ~$150 |

**VLAN-tagged SSIDs** let you create separate Wi-Fi networks that map to VLANs:
- "Home" SSID → VLAN 10 (Trusted)
- "IoT" SSID → VLAN 30 (IoT devices)
- "Guest" SSID → VLAN 40 (Guest)

## Setting Up VLANs

### On OPNsense

1. **Create VLAN interfaces:** Interfaces → Other Types → VLAN. Create VLANs 10, 20, 30, 40 on the LAN parent interface.
2. **Assign interfaces:** Interfaces → Assignments. Assign each VLAN as an OPT interface.
3. **Configure DHCP:** Services → DHCPv4 → each VLAN interface. Set subnet and range.
4. **Create firewall rules:** Firewall → Rules → each VLAN interface. Define allowed traffic.

### On the Switch

1. **Create VLANs:** Admin panel → VLAN → 802.1Q. Create VLANs 10, 20, 30, 40.
2. **Tag the trunk port** (uplink to router): All VLANs tagged.
3. **Set access ports:** Each device port is untagged on its VLAN.

Example port assignment:

| Port | Mode | VLAN | Connected To |
|------|------|------|-------------|
| 1 | Trunk | All tagged | OPNsense LAN |
| 2 | Access | 10 | Desktop |
| 3 | Access | 20 | Home server |
| 4 | Access | 20 | NAS |
| 5 | Access | 30 | IoT hub |
| 6 | Trunk | 10,30,40 tagged | Access point |
| 7–8 | Access | 10 | Available |

### On Access Points

Configure SSIDs with VLAN tags:
- SSID "HomeNet" → VLAN 10 (untagged default)
- SSID "IoT" → VLAN 30 (tagged)
- SSID "Guest" → VLAN 40 (tagged)

The AP sends traffic for each SSID with the appropriate VLAN tag to the switch via the trunk port.

## DNS for Your Homelab

### Local DNS with Pi-hole or AdGuard Home

Run [Pi-hole](/apps/pi-hole) or [AdGuard Home](/apps/adguard-home) as your network's DNS server. Benefits:
- Ad blocking for all devices
- Local DNS records (server.home → 10.0.20.10)
- DNS query logging

Set your DHCP server (OPNsense or router) to distribute Pi-hole's IP as the DNS server to all VLANs.

### Local Domain Names

Instead of remembering IPs, create local DNS entries:

| Hostname | IP | Service |
|----------|-----|---------|
| nas.home | 10.0.20.10 | TrueNAS / NAS |
| docker.home | 10.0.20.11 | Docker host |
| ha.home | 10.0.20.12 | Home Assistant |
| plex.home | 10.0.20.11 | Plex (same Docker host) |

Configure in Pi-hole: Local DNS → DNS Records. Or in AdGuard Home: Filters → DNS Rewrites.

## IP Address Planning

| Subnet | Range | DHCP Pool | Static Reservations |
|--------|-------|-----------|-------------------|
| Management (VLAN 1) | 192.168.1.0/24 | .100–.200 | .1 router, .2 switch, .3–.10 APs |
| Trusted (VLAN 10) | 10.0.10.0/24 | .100–.200 | .10–.30 for fixed devices |
| Servers (VLAN 20) | 10.0.20.0/24 | .100–.200 | .10–.30 for servers |
| IoT (VLAN 30) | 10.0.30.0/24 | .100–.250 | As needed |
| Guest (VLAN 40) | 10.0.40.0/24 | .100–.250 | None (all DHCP) |

**Use static IPs for servers.** Either set them on the server itself or use DHCP reservations on your router. Servers should have predictable IPs for DNS records, firewall rules, and Docker configurations.

## FAQ

### Do I need VLANs if I don't have IoT devices?

Probably not. VLANs add complexity. If your network is just your computers and a home server, a flat network with a good firewall (deny inbound, allow outbound) is fine. Add VLANs when you add untrusted devices or expose services publicly.

### Can I do VLANs with a consumer router?

Most consumer routers (Netgear Nighthawk, TP-Link Archer, ISP-provided) don't support 802.1Q VLANs. You need either a prosumer router (MikroTik, Ubiquiti) or a dedicated firewall (OPNsense on a mini PC). Some consumer routers support "guest networks" which are a simplified form of VLAN.

### Is a managed switch the same as a "smart" switch?

"Smart managed" or "easy smart" switches (like the TP-Link TL-SG108E) support basic VLANs and QoS. "Fully managed" switches (like Cisco Catalyst) support advanced features like STP, LACP, ACLs. For homelab VLANs, a smart managed switch is sufficient and much cheaper.

### How do I access devices across VLANs?

Through firewall rules on your router. Create rules that allow specific traffic between VLANs. For example: allow VLAN 10 (Trusted) to access VLAN 20 (Servers) on any port, but block VLAN 30 (IoT) from accessing VLAN 10.

### What's the difference between inter-VLAN routing and a firewall?

Inter-VLAN routing means the router forwards traffic between VLANs. A firewall adds rules about *which* traffic is allowed. You want both — the router handles routing, and its firewall inspects and permits/denies traffic between VLANs based on your rules.

## Related

- [Best Routers for Self-Hosting](/hardware/best-router-self-hosting)
- [Best Managed Switches for Homelab](/hardware/managed-switch-home-lab)
- [PoE Explained](/hardware/poe-explained)
- [Best Access Points for Homelab](/hardware/best-access-points)
- [Network Cables Guide](/hardware/network-cables-guide)
- [VLANs and Subnets for Self-Hosting](/foundations/subnets-vlans)
- [Getting Started with Self-Hosting](/foundations/getting-started)
