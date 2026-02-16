---
title: "Proxmox VE Basics for Self-Hosting"
description: "Get started with Proxmox VE — install, configure VMs and containers, and run self-hosted services on a proper hypervisor."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "proxmox", "virtualization", "containers", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is Proxmox VE?

Proxmox Virtual Environment (VE) is a free, open-source hypervisor that runs virtual machines (VMs) and Linux containers (LXC) on bare metal. It gives you a web-based management interface to create, configure, snapshot, and monitor your virtual infrastructure.

For self-hosting, Proxmox sits between running everything on bare metal and running everything in Docker. It lets you isolate workloads into separate VMs — one VM for your Docker stack, another for network services, a third for experiments you can blow away without affecting production. If a VM breaks, your other services keep running.

Proxmox is overkill if you have a single mini PC running a handful of Docker containers. It's worth it if you have a capable server (16GB+ RAM, 4+ cores) and want proper isolation, snapshots before upgrades, and the ability to run different operating systems side by side.

## Prerequisites

- A dedicated machine for Proxmox (it replaces the OS — it IS the OS)
- 64-bit CPU with VT-x/AMD-V virtualization support (almost all modern CPUs)
- 8GB RAM minimum, 16GB+ recommended (each VM needs its own allocation)
- 128GB+ SSD for the Proxmox OS and VM storage (NVMe preferred)
- A USB drive (8GB+) for the installer
- Wired Ethernet connection

## Installation

### Download and Flash

1. Download the Proxmox VE ISO from `proxmox.com/en/downloads`
2. Flash it to a USB drive using Etcher, Rufus, or `dd`:

```bash
# On Linux/macOS — replace /dev/sdX with your USB drive
sudo dd if=proxmox-ve_8.3-1.iso of=/dev/sdX bs=4M status=progress
```

3. Boot the target machine from the USB drive (change boot order in BIOS if needed)

### Install Wizard

The installer is straightforward:

1. **Accept the EULA**
2. **Select the target disk** — Proxmox installs on this drive. It uses ZFS by default (recommended) or ext4. All data on this drive is erased.
3. **Set location and timezone**
4. **Set the root password** — use a strong password, this is your admin account
5. **Configure networking** — assign a static IP to the Proxmox host. Pick an IP on your LAN that won't conflict (e.g., `192.168.1.50`). Set your gateway (router IP) and DNS server.
6. **Review and install**

The machine reboots after installation. Remove the USB drive.

### Post-Install Access

Access the Proxmox web interface from any browser on your network:

```
https://192.168.1.50:8006
```

Log in with:
- **Username:** `root`
- **Realm:** `PAM`
- **Password:** the one you set during install

You'll see a warning about not having a valid subscription. Proxmox VE is free to use, but they sell support subscriptions. Dismiss the warning — it doesn't affect functionality.

### Remove the Enterprise Repository

By default, Proxmox configures the enterprise (paid) package repository. Without a subscription, updates will fail. Switch to the free no-subscription repository:

```bash
# SSH into Proxmox or use the web console (Shell button in the UI)

# Disable the enterprise repo
sed -i 's/^deb/# deb/' /etc/apt/sources.list.d/pve-enterprise.list

# Add the no-subscription repo
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list

# Update packages
apt update && apt full-upgrade -y
```

## Creating a Virtual Machine

VMs are fully isolated — each runs its own OS kernel, its own memory space, and its own virtual hardware.

### Upload an ISO

1. In the Proxmox web UI, go to **Datacenter → Storage → local → ISO Images**
2. Click **Upload** and select an ISO (e.g., Ubuntu Server 24.04 LTS)

Or download directly on the Proxmox host:

```bash
cd /var/lib/vz/template/iso/
wget https://releases.ubuntu.com/24.04/ubuntu-24.04.1-live-server-amd64.iso
```

### Create the VM

1. Click **Create VM** (top right)
2. **General:** Name your VM (e.g., `docker-host`)
3. **OS:** Select the uploaded ISO
4. **System:** Leave defaults (BIOS: SeaBIOS, SCSI Controller: VirtIO SCSI Single)
5. **Disks:** Set disk size (32GB+ for OS, more if storing data). Use VirtIO Block for best performance.
6. **CPU:** Assign cores (2-4 for a Docker host). Set Type to `host` for full CPU feature passthrough.
7. **Memory:** Assign RAM in MB (4096-8192 for a Docker host)
8. **Network:** Select your bridge (default `vmbr0`), Model: VirtIO
9. **Confirm and create**

Start the VM and complete the OS installation through the console (click the VM → Console tab).

### Recommended VM Settings for Docker Host

For a VM that runs Docker containers:

| Setting | Recommended Value |
|---------|------------------|
| CPU cores | 2-4 (depends on workload) |
| CPU type | `host` |
| RAM | 4-8GB |
| Disk | 32GB OS + additional virtual disk for Docker data |
| Network | VirtIO, bridge `vmbr0` |
| Start at boot | Yes (Options → Start at boot) |
| Boot order | Disk first (after OS install) |

After OS installation, install Docker using the official method — see [Docker Compose Basics](/foundations/docker-compose-basics).

## Creating an LXC Container

LXC containers share the host kernel — they're lighter than VMs but less isolated. They're ideal for single-purpose services like Pi-hole, DNS servers, or lightweight apps that don't need Docker.

### Download a Template

1. Go to **Datacenter → Storage → local → CT Templates**
2. Click **Templates** and download one (e.g., `ubuntu-24.04-standard`)

### Create the Container

1. Click **Create CT** (top right)
2. **General:** Set hostname and root password. Check **Unprivileged container** (more secure).
3. **Template:** Select the downloaded template
4. **Disks:** Set root disk size (8-16GB for lightweight services)
5. **CPU:** Assign cores (1-2 for lightweight)
6. **Memory:** Assign RAM (512MB-2GB)
7. **Network:** Set a static IP or DHCP
8. **DNS:** Use host settings or specify your own
9. **Confirm and create**

Start the container and access it via the Console tab or SSH.

### LXC vs VM — When to Use Which

| Use Case | LXC | VM |
|----------|-----|-----|
| Pi-hole / AdGuard Home | Yes | Overkill |
| Docker host | Possible but tricky | Yes (recommended) |
| Database server | Yes | Yes |
| Home Assistant | No (needs hardware access) | Yes |
| NAS/file server | Yes | Yes |
| Testing/experiments | Yes (fast to create) | Yes (full isolation) |
| Windows apps | No | Yes |

**The recommendation:** Use VMs for Docker hosts and anything needing full isolation or hardware passthrough. Use LXC for lightweight, single-purpose Linux services.

## Storage Management

Proxmox supports multiple storage backends:

| Storage Type | Good For | Performance |
|-------------|----------|-------------|
| Local (LVM) | VM disks | Fast (native block) |
| Local (ZFS) | VM disks, snapshots | Fast, with compression and checksums |
| Local (Directory) | ISOs, backups, CT templates | Standard filesystem speed |
| NFS | Backups, shared ISOs, media | Network-limited |
| CIFS/SMB | Backups, media | Network-limited |

### Adding a Data Disk

If you have a second drive for VM storage:

```bash
# Find the drive
lsblk

# Create a ZFS pool (replace /dev/sdb with your drive)
zpool create -f datapool /dev/sdb

# The pool appears automatically in Proxmox storage
```

Or use the web UI: **Datacenter → Storage → Add → ZFS**.

### ZFS Best Practices

ZFS is the recommended filesystem for Proxmox. Key points:
- **Never use less than 8GB RAM for ZFS** — ZFS uses RAM aggressively for caching (ARC)
- **Use mirrors for redundancy** — `zpool create datapool mirror /dev/sdb /dev/sdc`
- **Enable compression** — `zfs set compression=lz4 datapool` (virtually free performance gain)
- **Leave 20% free space** — ZFS performance degrades significantly above 80% capacity
- **Schedule regular scrubs** — `zpool scrub datapool` weekly to detect silent data corruption

## Snapshots and Backups

### VM Snapshots

Snapshots capture the exact state of a VM at a point in time — disk, RAM, and configuration. Perfect for taking before upgrades.

```
Web UI → Select VM → Snapshots → Take Snapshot
```

Or via command line:

```bash
qm snapshot 100 pre-upgrade --description "Before Docker upgrade"
```

To roll back:

```bash
qm rollback 100 pre-upgrade
```

Snapshots are not backups — they're stored on the same disk as the VM. Use Proxmox Backup Server or the built-in `vzdump` for actual backups.

### Automated Backups with vzdump

Schedule backups in the web UI:

1. **Datacenter → Backup → Add**
2. Select which VMs/CTs to back up
3. Set schedule (e.g., daily at 2 AM)
4. Set storage destination (local or NFS share)
5. Set retention policy (e.g., keep last 7 daily backups)

Or manually:

```bash
vzdump 100 --storage local --mode snapshot --compress zstd
```

For off-site backups, back up to an NFS share on your [NAS](/foundations/nas-basics) and ensure your NAS has its own off-site backup — see [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule).

## Networking

### Default Bridge (vmbr0)

Proxmox creates a network bridge `vmbr0` during installation. All VMs and CTs connect to this bridge, giving them access to your LAN. This works for most self-hosting setups.

### VLANs

To segment traffic between VMs, enable VLAN awareness on the bridge:

1. **Datacenter → Node → Network → vmbr0 → Edit**
2. Check **VLAN Aware**

Then assign VLAN tags to VM network interfaces:

```
Web UI → VM → Hardware → Network Device → VLAN Tag: 10
```

For VLAN concepts, see [Subnets and VLANs Explained](/foundations/subnets-vlans).

### Firewall

Proxmox includes a built-in firewall. Enable it per-VM:

1. **VM → Firewall → Options → Enable: Yes**
2. Add rules to allow needed traffic

Default policy is DROP for incoming — you must explicitly allow ports. At minimum, allow SSH (22) and whatever ports your services use.

## GPU Passthrough

Passing a GPU through to a VM enables hardware-accelerated transcoding in [Jellyfin](/apps/jellyfin), machine learning in [Immich](/apps/immich), and other GPU-intensive workloads.

### Intel iGPU Passthrough

For Intel CPUs with integrated graphics (common in mini PCs):

1. Enable IOMMU in BIOS (often labeled VT-d)
2. Edit GRUB:

```bash
# /etc/default/grub
GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt"
```

3. Update GRUB and reboot:

```bash
update-grub
reboot
```

4. Add the GPU to your VM: **VM → Hardware → Add → PCI Device** → select the Intel GPU

For full transcoding support in Jellyfin, the VM needs the GPU device and the `i915` driver.

## Common Mistakes

### Allocating All RAM to VMs

Leave at least 2-4GB RAM for the Proxmox host itself. If you have 16GB total, don't allocate more than 12GB across all VMs. ZFS needs RAM for its ARC cache, and the host needs RAM for its own operations.

### Not Enabling Start at Boot

By default, VMs and CTs don't start when Proxmox boots. After a power outage or reboot, your services stay down until you manually start each VM.

Fix: **VM → Options → Start at boot: Yes**. Set boot order and startup delay if VMs depend on each other (e.g., NAS VM starts before Docker VM).

### Skipping Backups

Snapshots are convenient but not durable. If the disk fails, both the VM and its snapshots are gone. Set up automated `vzdump` backups to a separate drive or NAS.

### Using Privileged LXC Containers

Always create **unprivileged** containers unless you have a specific reason not to. Privileged containers share the host's UID space — a root breakout from the container gives root on the Proxmox host.

## Next Steps

- Set up Docker inside a Proxmox VM — [Docker Compose Basics](/foundations/docker-compose-basics)
- Configure networking and VLANs — [Home Network Setup](/foundations/home-network-setup)
- Plan your storage — [RAID Explained](/foundations/raid-explained) and [NAS Basics](/foundations/nas-basics)
- Back up your VMs — [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)

## FAQ

### Is Proxmox really free?

Yes. Proxmox VE is open-source (AGPL v3). The paid subscription gets you access to the enterprise package repository and support. The no-subscription repository has the same packages, just tested slightly less. For home use, the free version is fully functional.

### How much RAM do I need for Proxmox?

8GB is the minimum for running Proxmox with 1-2 lightweight VMs. 16GB is comfortable for 3-4 VMs. 32GB+ is ideal for running a full self-hosting stack with Docker VMs, a NAS VM, and test environments. If you're using ZFS, plan for 1GB ARC cache per TB of storage plus your VM allocations.

### Should I run Docker directly on Proxmox or inside a VM?

Inside a VM. Running Docker directly on the Proxmox host is possible but discouraged — it complicates updates, clutters the host, and means a Docker issue can affect your hypervisor. Create a dedicated Ubuntu/Debian VM, install Docker there, and keep Proxmox clean.

### Can I run Proxmox on a mini PC?

Yes, but check that the mini PC supports VT-x/VT-d in BIOS (needed for virtualization). Most Intel N100 and 12th-gen+ mini PCs support it. You'll want at least 16GB RAM for a useful Proxmox setup. Mini PCs with a single NVMe slot work well — use that for the OS and VM storage, and mount NAS shares for bulk data.

### Proxmox vs ESXi — which is better for home use?

Proxmox. VMware ESXi's free tier was discontinued, and the full product requires expensive licensing. Proxmox is fully free, open-source, actively developed, has LXC container support (ESXi doesn't), and has a strong community. There's no reason to use ESXi for home self-hosting in 2026.

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [NAS Basics](/foundations/nas-basics)
- [RAID Configurations Explained](/foundations/raid-explained)
- [Home Network Setup](/foundations/home-network-setup)
- [Subnets and VLANs Explained](/foundations/subnets-vlans)
- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting)
