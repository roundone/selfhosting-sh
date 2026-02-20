---
title: "NIC Bonding and Link Aggregation for Home Servers"
description: "Set up NIC bonding and link aggregation on your home server. Covers LACP, active-passive, and multi-NIC configurations for self-hosting."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "networking", "nic-bonding", "lacp"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Verdict

**For most home servers, NIC bonding isn't necessary.** A single gigabit connection handles typical self-hosting workloads. If you need more bandwidth, upgrade to [2.5 GbE](/hardware/2.5gbe-networking) or [10 GbE](/hardware/10gbe-networking) instead of bonding two 1 GbE ports. Bonding makes sense when you need **failover** (redundancy) or when you're serving **many concurrent clients** and want aggregate throughput.

## What Is NIC Bonding?

NIC bonding (also called NIC teaming or link aggregation) combines two or more physical network interfaces into a single logical interface. The result is either increased aggregate bandwidth, failover protection, or both — depending on the bonding mode you choose.

**Common misconception:** Bonding two 1 Gbps NICs does **not** give you 2 Gbps to a single client. A single TCP connection between two devices is limited to the speed of one physical link (1 Gbps). Bonding increases throughput for **multiple simultaneous connections** — think of it as adding lanes to a highway, not increasing the speed limit.

## Bonding Modes

Linux supports seven bonding modes. These four are relevant for home servers:

### Mode 1: Active-Passive (Failover)

One NIC handles all traffic. The second NIC stays idle as a standby. If the active NIC or its cable fails, traffic automatically switches to the backup.

- **Switch support required:** No
- **Bandwidth increase:** None
- **Use case:** Redundancy for services that must stay online

### Mode 2: Balance-XOR

Distributes traffic across NICs based on a hash of source/destination MAC or IP addresses. Different clients hit different NICs, spreading the load.

- **Switch support required:** No
- **Bandwidth increase:** Yes (aggregate, not per-connection)
- **Use case:** Servers with many concurrent clients

### Mode 4: LACP (802.3ad)

The industry standard for link aggregation. Both ends (server and switch) negotiate a Link Aggregation Group (LAG). Traffic is distributed across all member links. If a link fails, traffic rebalances to the remaining links.

- **Switch support required:** Yes (managed switch with 802.3ad support)
- **Bandwidth increase:** Yes (aggregate, not per-connection)
- **Use case:** Best overall — bandwidth + failover

### Mode 6: Adaptive Load Balancing

Distributes outgoing traffic across NICs based on load. Does not require switch support. Incoming traffic goes to one NIC only.

- **Switch support required:** No
- **Bandwidth increase:** Outbound only
- **Use case:** Asymmetric workloads (serving files to many clients)

## When to Use Bonding

| Scenario | Recommendation |
|----------|---------------|
| Single user accessing NAS | Skip bonding — one 1 GbE link is enough |
| 3+ users streaming simultaneously | Bonding helps distribute load |
| Server uptime is critical | Active-passive for failover |
| You have a managed switch with LACP | Use LACP for aggregate bandwidth + failover |
| You want faster single-client transfers | Upgrade to 2.5/10 GbE instead |

## Setup: Linux (Bond Two NICs with LACP)

### Prerequisites

- Two Ethernet NICs on your server (built-in + PCIe card, or dual-port NIC)
- A managed switch that supports 802.3ad LACP
- Two Ethernet cables

### Step 1: Install bonding tools

```bash
sudo apt install ifenslave    # Debian/Ubuntu
sudo modprobe bonding
```

### Step 2: Configure the bond

Edit `/etc/network/interfaces`:

```
# Disable individual NICs from getting IP addresses
auto eth0
iface eth0 inet manual
    bond-master bond0

auto eth1
iface eth1 inet manual
    bond-master bond0

# Create the bond interface
auto bond0
iface bond0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.1
    bond-mode 802.3ad
    bond-miimon 100
    bond-lacp-rate fast
    bond-xmit-hash-policy layer3+4
    bond-slaves eth0 eth1
```

**Configuration explained:**
- `bond-mode 802.3ad` — LACP mode
- `bond-miimon 100` — check link status every 100ms
- `bond-lacp-rate fast` — exchange LACP packets every second (vs. every 30s)
- `bond-xmit-hash-policy layer3+4` — distribute traffic based on IP + port (best distribution for typical workloads)

### Step 3: Configure the switch

On your managed switch, create a LAG (Link Aggregation Group) with the two ports connected to your server. Enable 802.3ad/LACP on those ports. The exact steps vary by switch manufacturer:

- **Ubiquiti UniFi:** Settings → Port Management → select both ports → Create Link Aggregate
- **Netgear:** Switching → LAG → Add LAG → Select ports → Set to LACP
- **TP-Link:** L2 Features → Link Aggregation → Create Group → Enable LACP

### Step 4: Activate and verify

```bash
sudo systemctl restart networking
```

Check bond status:

```bash
cat /proc/net/bonding/bond0
```

You should see both interfaces listed as active with "MII Status: up."

## Setup: Active-Passive (No Switch Config Needed)

If you don't have a managed switch or just want failover:

```
auto bond0
iface bond0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    bond-mode active-backup
    bond-miimon 100
    bond-primary eth0
    bond-slaves eth0 eth1
```

`bond-primary eth0` makes eth0 the default active NIC. eth1 takes over only if eth0 goes down.

## Setup: Proxmox

Proxmox supports bonding through the web UI or `/etc/network/interfaces`:

```
auto eth0
iface eth0 inet manual

auto eth1
iface eth1 inet manual

auto bond0
iface bond0 inet manual
    bond-slaves eth0 eth1
    bond-mode 802.3ad
    bond-miimon 100
    bond-xmit-hash-policy layer3+4

auto vmbr0
iface vmbr0 inet static
    address 192.168.1.100/24
    gateway 192.168.1.1
    bridge-ports bond0
    bridge-stp off
    bridge-fd 0
```

The bridge (`vmbr0`) sits on top of the bond, and VMs use the bridge as normal.

## Setup: Unraid

Unraid supports bonding through Settings → Network Settings:

1. Set "Bonding members" to your two NICs
2. Choose bonding mode (balance-alb for no switch config, 802.3ad if your switch supports it)
3. Apply and reboot

## Alternative: Multiple Subnets (No Bonding)

Instead of bonding, assign each NIC to a different purpose:

| NIC | Network | Purpose |
|-----|---------|---------|
| eth0 | 192.168.1.0/24 | LAN services (Nextcloud, Jellyfin) |
| eth1 | 10.0.0.0/24 | Storage network (NAS, backups) |

This gives you dedicated bandwidth for storage traffic without the complexity of bonding. It's commonly used in Proxmox setups where VM traffic and storage traffic are separated.

## Hardware: Adding a Second NIC

### PCIe NIC Cards

| Card | Speed | Ports | Price |
|------|-------|-------|-------|
| Intel I350-T2 | 1 GbE | 2 | $15–25 (used) |
| Intel I350-T4 | 1 GbE | 4 | $25–40 (used) |
| Intel X550-T2 | 10 GbE | 2 | $60–90 (used) |
| Mellanox ConnectX-3 | 10 GbE | 2 | $25–40 (used) |

For 1 GbE bonding, the Intel I350-T2 is the standard recommendation — dual-port, enterprise-grade, and dirt cheap on eBay.

### USB Ethernet Adapters

If your server lacks a PCIe slot (mini PCs, thin clients), USB 3.0 Ethernet adapters work for bonding:

- Realtek RTL8153-based adapters: ~$15, 1 GbE
- USB 3.0 to 2.5 GbE adapters: ~$20

USB adapters introduce some CPU overhead and latency, but they're functional for active-passive failover.

## Performance Expectations

| Configuration | Single-Client Max | Multi-Client Aggregate |
|---------------|-------------------|----------------------|
| 1x 1 GbE | ~940 Mbps | ~940 Mbps |
| 2x 1 GbE bonded (LACP) | ~940 Mbps | ~1,880 Mbps |
| 1x 2.5 GbE | ~2,350 Mbps | ~2,350 Mbps |
| 2x 2.5 GbE bonded | ~2,350 Mbps | ~4,700 Mbps |
| 1x 10 GbE | ~9,400 Mbps | ~9,400 Mbps |

A single 2.5 GbE NIC gives more bandwidth to a single client than two bonded 1 GbE NICs. If your bottleneck is single-client speed (one person copying files), upgrade the NIC speed. If your bottleneck is many clients simultaneously (family streaming, multiple backup jobs), bonding helps.

## FAQ

### Do I need bonding for a home NAS?
Probably not. A single 1 GbE connection saturates at ~110 MB/s, which is faster than most consumer HDDs write. For faster single-client transfers, upgrade to 2.5 GbE ($20–30 for a NIC) rather than bonding.

### Can I bond different speed NICs?
Technically yes, but the bond runs at the speed of the slowest member in most modes. Bonding a 1 GbE and a 2.5 GbE NIC wastes the 2.5 GbE NIC's capacity. Use matching NICs.

### Does bonding require a managed switch?
Only for LACP (mode 4). Active-passive (mode 1) and adaptive load balancing (mode 6) work with any unmanaged switch.

### What happens if one NIC fails?
In all bonding modes, the bond continues operating with the remaining NIC(s). Traffic is redirected automatically — no manual intervention needed.

## Related

- [2.5 GbE Networking Guide](/hardware/2.5gbe-networking)
- [10 GbE Networking Guide](/hardware/10gbe-networking)
- [Best Managed Switches for Homelab](/hardware/managed-switch-home-lab)
- [Homelab Network Topology](/hardware/homelab-network-topology)
- [Home Server Networking](/hardware/home-server-networking)
- [Best USB Ethernet Adapters](/hardware/best-usb-ethernet-adapters)
