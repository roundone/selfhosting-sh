---
title: "Proxmox Hardware Requirements Guide"
description: "Minimum and recommended hardware for Proxmox VE. CPU, RAM, storage, and networking specs for running virtual machines and containers."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "proxmox", "virtualization", "vm"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**An Intel N305 mini PC with 32 GB RAM and a 500 GB NVMe SSD is the sweet spot for a Proxmox homelab.** It gives you 8 cores, hardware transcoding via QuickSync, VT-d for PCI passthrough, and enough RAM for 3–5 lightweight VMs alongside LXC containers. Total cost: $300–400.

If you need serious Proxmox power (10+ VMs, GPU passthrough, ZFS storage), get a used Dell OptiPlex 7080/7090 with an i7, upgrade to 64 GB RAM, and add an NVMe boot drive. Total: $300–400 used.

## Minimum vs Recommended Specs

| Component | Minimum (Functional) | Recommended (Comfortable) | Heavy Use |
|-----------|---------------------|--------------------------|-----------|
| **CPU** | 4 cores, VT-x | 8 cores, VT-x + VT-d | 12+ cores, VT-x + VT-d + IOMMU |
| **RAM** | 8 GB | 32 GB | 64–128 GB |
| **Boot Storage** | 32 GB SSD | 256 GB NVMe | 500 GB+ NVMe |
| **VM Storage** | Same as boot | Separate SSD/NVMe | NVMe pool or SSD array |
| **Network** | 1 Gbps | 2.5 Gbps | 10 Gbps (dual NIC ideal) |
| **IOMMU/VT-d** | Not required | Recommended | Required for GPU passthrough |

### CPU Requirements Explained

**VT-x (Intel Virtualization Technology):** Required for running VMs. Almost all Intel CPUs since 2008 and AMD CPUs since 2006 support this. Non-negotiable.

**VT-d / AMD-Vi (Directed I/O):** Required for PCI passthrough — giving a VM direct access to a physical device (GPU, NIC, USB controller). Not all CPUs support this:

| CPU | VT-d/AMD-Vi Support |
|-----|---------------------|
| Intel N100/N150 | Yes |
| Intel N305 | Yes |
| Intel Core i3/i5/i7 (12th+ gen) | Yes |
| AMD Ryzen 5000/7000 | Yes (AMD-Vi) |
| Intel Celeron J-series (older) | Some models, check ARK |

**Verify before buying:** Check [ark.intel.com](https://ark.intel.com) for Intel CPUs or AMD's product pages. "VT-d" must be listed as "Yes."

### RAM: The Most Important Spec

Proxmox is a hypervisor — it runs other operating systems inside VMs. Each VM needs its own RAM allocation. This is why RAM is the most constrained resource.

| VM/Container | Typical RAM Allocation |
|-------------|----------------------|
| LXC container (lightweight) | 256 MB – 1 GB |
| Ubuntu Server VM | 2–4 GB |
| Windows 11 VM | 8–16 GB |
| Home Assistant OS VM | 2–4 GB |
| TrueNAS VM | 8–16 GB (+ 1 GB/TB for ZFS ARC) |
| Docker host VM (running containers) | 4–8 GB |
| Proxmox host overhead | 2–4 GB |

**Example allocation on 32 GB:**
- Proxmox host: 2 GB
- Docker VM (running 15 containers): 8 GB
- Home Assistant VM: 3 GB
- Ubuntu VM (dev/testing): 4 GB
- 3 LXC containers: 3 GB
- **Free:** 12 GB for new VMs or memory pressure

**Example allocation on 64 GB:**
- Proxmox host: 4 GB
- TrueNAS VM (with ZFS): 16 GB
- Docker VM: 8 GB
- Windows 11 VM: 16 GB
- Home Assistant VM: 4 GB
- 5 LXC containers: 6 GB
- **Free:** 10 GB

### Storage: Boot vs VM Storage

**Boot drive:** Proxmox itself needs minimal storage (8 GB installed). But the boot drive also stores:
- ISO images (1–5 GB each)
- CT templates (100–500 MB each)
- VM snapshots
- Backup files

A 256 GB NVMe boot drive is the minimum for comfort. 500 GB gives room for snapshots and backups.

**VM storage:** VMs need fast storage. A VM's virtual disk I/O is the biggest performance bottleneck.

| Storage Type | Performance | Use Case |
|-------------|-------------|----------|
| NVMe SSD (local) | Excellent | VM boot drives, database VMs |
| SATA SSD (local) | Good | General VM storage |
| HDD (local) | Poor | Bulk data, backup |
| ZFS mirror (2x SSD) | Good + redundancy | Production VMs |
| Ceph (3+ nodes) | Good + distributed | Proxmox cluster |

**Recommended layout:**
1. **NVMe 1:** Proxmox boot + local VM storage (256–500 GB)
2. **NVMe 2 or SATA SSDs:** Additional VM storage if needed
3. **HDDs:** Data storage passed through to TrueNAS VM or mounted as directories

## Recommended Hardware Builds

### Budget Proxmox Box — $250

| Component | Pick | Price |
|-----------|------|-------|
| Mini PC | Beelink EQ12 Pro (N305, 8C/8T) | $200 |
| RAM | 32 GB DDR4 SO-DIMM (upgrade) | $40 |
| Storage | 500 GB NVMe (included or upgrade) | $10 |
| **Total** | | **$250** |

**What you can run:** 2–3 lightweight VMs + 5–10 LXC containers. Home Assistant VM, Docker host, Pi-hole container. No GPU passthrough (no PCIe slots), limited storage expansion.

**Power consumption:** 8–12W idle. ~$10–13/year electricity.

### Mid-Range Proxmox Server — $400

| Component | Pick | Price |
|-----------|------|-------|
| Mini PC | Beelink SER5 Max (Ryzen 7 5800H, 8C/16T) | $350 |
| RAM | 64 GB DDR4 SO-DIMM (2x32 GB upgrade) | $45 |
| Storage | 1 TB NVMe | $10 |
| **Total** | | **$405** |

**What you can run:** 5+ VMs including Windows, heavy Docker host, simultaneous workloads. Strong multi-threaded performance. No PCIe expansion.

**Power consumption:** 15–25W idle. ~$16–26/year electricity.

### Full-Size Proxmox Server — $500

| Component | Pick | Price |
|-----------|------|-------|
| PC | Used Dell OptiPlex 7080 SFF (i7-10700) | $200 |
| RAM | 64 GB DDR4 (upgrade or add) | $50 |
| Boot SSD | 500 GB NVMe | $30 |
| VM SSD | 1 TB SATA SSD | $50 |
| HBA (optional) | LSI SAS 9207-8i | $20 |
| HDDs (optional) | 2× 8 TB shucked | $150 |
| **Total** | | **$500** |

**What you can run:** Everything. 10+ VMs, GPU passthrough (low-profile GPU fits SFF), TrueNAS VM with HDD pass-through, full homelab. PCIe slot for HBA or GPU.

**Power consumption:** 25–40W idle. ~$26–42/year electricity.

### Proxmox Cluster (3 Nodes) — $750

| Component | Pick | Price |
|-----------|------|-------|
| 3× Mini PCs | Beelink EQ12 Pro (N305) | $600 |
| RAM upgrade | 32 GB each | $120 |
| Network | 2.5G switch (already have) | $30 |
| **Total** | | **$750** |

**What you get:** High availability — if one node fails, VMs migrate to another. Live migration between nodes. Distributed storage with Ceph (minimum 3 nodes).

**When a cluster makes sense:** When uptime matters more than raw performance. Each individual node is weaker than one beefy server, but you gain fault tolerance.

## Storage Configuration in Proxmox

### Local Storage (Default)

Proxmox creates `local` (for ISOs, templates, backups) and `local-lvm` (for VM disks) on the boot drive by default. Fine for getting started.

### ZFS on Proxmox

Proxmox has built-in ZFS support. You can create a ZFS pool during installation or add one later:

```bash
# Create a ZFS mirror from two drives
zpool create mypool mirror /dev/sdb /dev/sdc

# Add to Proxmox storage configuration
pvesm add zfspool local-zfs -pool mypool -content images,rootdir
```

**ZFS RAM overhead:** ZFS uses RAM for the ARC cache. Budget 1–2 GB of RAM for ZFS overhead plus whatever the ARC uses (adjustable). On a 32 GB system, ZFS might use 4–8 GB for ARC — tune with `zfs_arc_max`.

### Passing Through Drives to a TrueNAS VM

If you want TrueNAS managing your storage inside a Proxmox VM:

1. Use an HBA card in IT mode
2. Pass the entire HBA through to the TrueNAS VM via PCI passthrough
3. TrueNAS sees the drives directly — full SMART access, ZFS works properly

This requires VT-d support and correct IOMMU grouping. Check your motherboard's IOMMU groups before buying.

## Network Configuration

### Single NIC Setup

Most mini PCs and desktops have one NIC. Proxmox can use VLANs on a single NIC to separate management, VM, and storage traffic:

- VLAN 1: Management (Proxmox web UI)
- VLAN 10: VM network
- VLAN 20: Storage network

Requires a managed switch that supports VLANs.

### Dual NIC Setup (Recommended)

| NIC | Purpose |
|-----|---------|
| NIC 1 (onboard) | Management + VM network |
| NIC 2 (add-in) | Storage network or second VM network |

For Proxmox clusters: dedicate one NIC to Corosync (cluster communication) and one to VM/storage traffic.

### 10GbE for Proxmox

Worth it if:
- Running a TrueNAS VM with storage passed through (NAS → workstation transfers)
- Proxmox cluster with live migration (migrating VMs between nodes)
- Ceph distributed storage (needs fast inter-node networking)

A used Intel X520-DA2 ($20) + DAC cable ($10) is the cheapest path to 10GbE.

## BIOS Settings Checklist

Before installing Proxmox, configure these BIOS settings:

| Setting | Required | Where |
|---------|----------|-------|
| VT-x (Intel) / SVM (AMD) | Yes | Advanced → CPU Configuration |
| VT-d (Intel) / AMD-Vi | For passthrough | Advanced → CPU Configuration |
| IOMMU | For passthrough | Advanced → CPU Configuration (some boards: Chipset) |
| ACS Override | If IOMMU groups are bad | Boot parameter: `pcie_acs_override=downstream,multifunction` |
| SR-IOV | For NIC virtualization | Advanced → PCIe Configuration (if available) |
| Boot from NVMe | If using NVMe boot | Boot → Boot Priority |
| Wake-on-LAN | For remote power-on | Advanced → Power Management |
| Restore on AC Power Loss | For auto-restart | Advanced → Power Management → set to "Power On" |

## FAQ

### Can I run Proxmox on a Raspberry Pi?

No. Proxmox VE requires x86_64 hardware. It does not run on ARM (Raspberry Pi, Apple Silicon). For ARM-based virtualization, use QEMU directly or consider Armbian with LXC.

### How many VMs can I run on 32 GB RAM?

Depends on what's inside each VM. With 2–4 GB per lightweight Linux VM: 5–8 VMs comfortably. With a Windows VM taking 8–16 GB: 2–3 VMs total. LXC containers are lighter — you can run 15–20 lightweight containers on 32 GB.

### Do I need ECC RAM for Proxmox?

Not required, but recommended if running ZFS for VM storage or hosting important data. ECC prevents silent memory corruption from propagating into ZFS pools. Consumer Proxmox homelabs run non-ECC without issues — but serious data servers should use ECC.

### Is an Intel N100 enough for Proxmox?

Barely. 4 cores and 8 GB max RAM (in most N100 mini PCs) limits you to 1–2 lightweight VMs. The N305 (8 cores) is a much better choice. If you only want LXC containers (no full VMs), the N100 works fine.

### Can I run Proxmox on a laptop?

Technically yes, but not recommended. Laptops have limited RAM expansion, no PCIe slots, and aren't designed for 24/7 operation. A used desktop or mini PC is better in every way for this use case.

## Related

- [Best Mini PCs for Home Servers](/hardware/best-mini-pc/)
- [Intel vs AMD for Home Servers](/hardware/intel-vs-amd-home-server/)
- [Best RAM for Home Servers](/hardware/best-ram-home-server/)
- [PCIe and M.2 Expansion Guide](/hardware/pcie-expansion-home-server/)
- [GPU Passthrough Guide](/hardware/gpu-passthrough-guide/)
- [10GbE Networking Guide](/hardware/10gbe-networking/)
- [Used Dell OptiPlex as a Home Server](/hardware/used-dell-optiplex/)
