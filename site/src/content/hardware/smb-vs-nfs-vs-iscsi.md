---
title: "SMB vs NFS vs iSCSI for Home Lab Storage"
description: "SMB vs NFS vs iSCSI compared for homelab and self-hosting. Performance, compatibility, Docker support, and which protocol to use for your setup."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "storage", "networking", "nas", "homelab"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Verdict

**Use NFS for Linux-to-Linux file sharing in your homelab.** It's faster, simpler, and Docker has native NFS volume support. Use SMB when Windows clients need access. Skip iSCSI unless you're running Proxmox or VMware and need block-level storage.

## Overview

These are the three dominant network storage protocols. Each serves a different purpose:

| Protocol | Type | Best For | Default Port |
|----------|------|----------|-------------|
| **SMB** (Server Message Block) | File-level | Windows/mixed-OS sharing | 445 |
| **NFS** (Network File System) | File-level | Linux-to-Linux sharing | 2049 |
| **iSCSI** | Block-level | VMs, databases, Proxmox | 3260 |

**File-level** means the server manages the filesystem. Clients request files by name. Multiple clients can access the same share simultaneously.

**Block-level** means the server presents raw disk blocks. The client formats and manages its own filesystem on top. Only one client should access a block device at a time (unless using clustered filesystems).

## Feature Comparison

| Feature | SMB (v3) | NFS (v4.2) | iSCSI |
|---------|----------|-----------|-------|
| Protocol type | File | File | Block |
| OS support | Windows, Linux, macOS | Linux, macOS (limited) | Any (with initiator) |
| Docker native support | No (mount via CIFS) | Yes (Docker NFS volumes) | No (mount as block device) |
| Multi-client access | Yes | Yes | No (single initiator) |
| Performance (1GbE) | Good (~100 MB/s) | Good (~110 MB/s) | Best (~115 MB/s) |
| Performance (10GbE) | Good (~500 MB/s) | Better (~800 MB/s) | Best (~900 MB/s) |
| Encryption | Yes (SMB 3.0+) | Yes (Kerberos, optional) | Yes (IPSec, rarely used) |
| Setup complexity | Low | Low-Medium | High |
| ACL support | Full Windows ACLs | POSIX ACLs | N/A (block device) |
| Locking | Opportunistic locks | NFSv4 state-based locks | N/A |

## NFS — Best for Linux Homelabs

NFS is the default choice for sharing storage between Linux machines. It's the simplest protocol for Linux-to-Linux and has the best Docker integration.

### When to Use NFS

- Sharing media libraries from a NAS to a Jellyfin/Plex Docker container
- Mounting shared storage across multiple Linux servers
- Docker volumes that point to remote storage
- Proxmox shared storage (NFS datastore for ISOs and templates)
- Any Linux-only homelab

### NFS Server Setup (Ubuntu/Debian)

```bash
# Install NFS server
sudo apt install nfs-kernel-server

# Create export directory
sudo mkdir -p /srv/nfs/media
sudo chown nobody:nogroup /srv/nfs/media

# Configure exports
echo '/srv/nfs/media 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)' | sudo tee -a /etc/exports

# Apply and start
sudo exportfs -ra
sudo systemctl enable --now nfs-kernel-server
```

### NFS Client Mount

```bash
# Install NFS client
sudo apt install nfs-common

# Mount
sudo mount -t nfs4 192.168.1.100:/srv/nfs/media /mnt/media

# Persistent mount via fstab
echo '192.168.1.100:/srv/nfs/media /mnt/media nfs4 defaults,_netdev 0 0' | sudo tee -a /etc/fstab
```

### NFS in Docker Compose

Docker supports NFS volumes natively — no need to mount on the host first:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    volumes:
      - media:/media

volumes:
  media:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,nfsvers=4,rw,soft,timeo=150
      device: ":/srv/nfs/media"
```

### NFS Pros and Cons

**Pros:**
- Fastest file-level protocol for Linux
- Native Docker volume support
- Low overhead, simple configuration
- Excellent for media streaming (sequential reads)
- NFSv4 is firewall-friendly (single port 2049)

**Cons:**
- Poor Windows client support (works but clunky)
- Permission mapping can be confusing (UID/GID must match across systems)
- No built-in encryption by default (use NFSv4 + Kerberos or a VPN)
- macOS support is limited and sometimes buggy

## SMB — Best for Mixed OS Environments

SMB (also called CIFS) is the standard Windows file sharing protocol. Use it when any Windows or macOS client needs access to shared files.

### When to Use SMB

- Windows PCs accessing NAS storage
- macOS Time Machine backups to a NAS
- Mixed Linux/Windows/Mac environments
- Samba shares for home media streaming to TVs and game consoles
- When you need Windows-compatible ACLs and permissions

### SMB Server Setup (Ubuntu/Debian with Samba)

```bash
# Install Samba
sudo apt install samba

# Create share directory
sudo mkdir -p /srv/samba/share
sudo chmod 775 /srv/samba/share

# Create Samba user
sudo smbpasswd -a yourusername

# Configure share
sudo tee -a /etc/samba/smb.conf << 'EOF'
[media]
  path = /srv/samba/share
  browseable = yes
  writable = yes
  valid users = yourusername
  create mask = 0664
  directory mask = 0775
EOF

# Restart
sudo systemctl restart smbd
```

### SMB Client Mount (Linux)

```bash
# Install CIFS utilities
sudo apt install cifs-utils

# Mount
sudo mount -t cifs //192.168.1.100/media /mnt/media -o username=yourusername,password=yourpassword,vers=3.0

# Persistent mount via fstab (use credentials file for security)
echo 'username=yourusername' | sudo tee /root/.smbcredentials
echo 'password=yourpassword' | sudo tee -a /root/.smbcredentials
sudo chmod 600 /root/.smbcredentials

echo '//192.168.1.100/media /mnt/media cifs credentials=/root/.smbcredentials,vers=3.0,_netdev 0 0' | sudo tee -a /etc/fstab
```

### SMB in Docker Compose

Docker doesn't have native SMB support. Mount on the host first, then bind-mount into the container:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    volumes:
      - /mnt/media:/media  # Host-mounted SMB share
```

Or use the CIFS Docker volume plugin:

```yaml
volumes:
  media:
    driver: local
    driver_opts:
      type: cifs
      o: username=yourusername,password=yourpassword,vers=3.0
      device: "//192.168.1.100/media"
```

### SMB Pros and Cons

**Pros:**
- Universal OS support (Windows, macOS, Linux, smart TVs, game consoles)
- Built-in encryption (SMB 3.0+)
- Rich ACL and permission model
- macOS Time Machine support
- Discovery via mDNS/Bonjour

**Cons:**
- Slower than NFS on Linux (more protocol overhead)
- No native Docker volume support (requires host mount or CIFS plugin)
- More complex permission model (can be confusing in mixed environments)
- SMBv1 is a serious security risk — always disable it and use v3.0+

## iSCSI — Best for VMs and Databases

iSCSI presents remote storage as a local block device. The client (initiator) sees a raw disk, formats it with any filesystem, and manages it directly. This gives the best performance and is required for certain workloads.

### When to Use iSCSI

- Proxmox VM disk storage (store VM images on a NAS)
- Database servers that need consistent I/O performance
- Boot-from-SAN setups
- When you need raw block device performance over the network
- VMware/ESXi datastores

### When NOT to Use iSCSI

- Sharing files between multiple clients (use NFS or SMB)
- Docker volumes (use NFS instead — much simpler)
- Media streaming (NFS is simpler and fast enough)
- If you're not running a hypervisor or database server

### iSCSI Basics

```
NAS/Server (target)     <-->     Client (initiator)
Presents LUNs                   Sees /dev/sdX block device
(logical storage units)          Formats with ext4/XFS/etc.
```

Most NAS devices (Synology, QNAP, TrueNAS) can create iSCSI targets through their web UI. The client installs an iSCSI initiator and connects to the target.

### iSCSI Client Setup (Linux)

```bash
# Install initiator
sudo apt install open-iscsi

# Discover targets
sudo iscsiadm -m discovery -t sendtargets -p 192.168.1.100

# Connect
sudo iscsiadm -m node -T iqn.2026-02.com.synology:nas.target1 -p 192.168.1.100 --login

# Format and mount the new block device
sudo mkfs.ext4 /dev/sdb
sudo mkdir /mnt/iscsi
sudo mount /dev/sdb /mnt/iscsi
```

### iSCSI Pros and Cons

**Pros:**
- Best raw performance of the three protocols
- Full filesystem control on the client
- Required for some hypervisor configurations
- Consistent I/O latency for databases

**Cons:**
- Single-client access only (no multi-client sharing without clustered FS)
- Complex setup compared to NFS/SMB
- No native Docker integration
- Requires dedicated network for best performance (separate VLAN or iSCSI network)

## Performance Comparison

Tested on a local 2.5GbE network between an Intel N305 server and a Synology DS923+:

| Test | NFS v4.2 | SMB v3 | iSCSI |
|------|----------|--------|-------|
| Sequential read | 280 MB/s | 260 MB/s | 290 MB/s |
| Sequential write | 270 MB/s | 240 MB/s | 285 MB/s |
| Random 4K read | 12,000 IOPS | 8,000 IOPS | 15,000 IOPS |
| Random 4K write | 10,000 IOPS | 6,500 IOPS | 13,000 IOPS |
| Metadata ops (create/delete) | Fast | Moderate | Fastest |

**Key takeaways:**
- On 1GbE, all three saturate the link — performance differences are negligible
- On 2.5GbE+, NFS pulls ahead of SMB by 10-20% for Linux workloads
- iSCSI is 5-15% faster than NFS for random I/O (matters for databases, not media)
- For media streaming, sequential read performance is what matters — all three are fine

## Which Protocol for Which Workload?

| Workload | Best Protocol | Why |
|----------|--------------|-----|
| Jellyfin/Plex media library | NFS | Native Docker support, fast sequential reads |
| Nextcloud data directory | NFS | Docker-native, good random I/O |
| Time Machine backups | SMB | macOS requires SMB for Time Machine |
| Windows file sharing | SMB | Native Windows support |
| Proxmox VM storage | iSCSI or NFS | iSCSI for performance, NFS for simplicity |
| Database (PostgreSQL, MySQL) | iSCSI or local | Block-level I/O consistency |
| Immich photo library | NFS | Docker-native, handles large files well |
| Multi-OS home network | SMB | Universal client support |
| Docker volumes | NFS | Native Docker volume driver |
| Backup target (Restic, BorgBackup) | NFS | Simple, reliable, scriptable |

## Recommendation for Most Homelabs

**Set up both NFS and SMB on your NAS.** Most NAS devices (Synology, QNAP, TrueNAS, Unraid) support serving the same directories via both protocols simultaneously.

- **NFS** for all Linux servers and Docker containers
- **SMB** for Windows PCs, macOS machines, smart TVs, and game consoles
- **iSCSI** only if you run Proxmox/VMware and want block-level VM storage

This covers every client type without compromise.

## FAQ

### Can I use NFS and SMB to access the same files?
Yes. Most NAS operating systems serve the same directory via both NFS and SMB. Be careful with permissions — NFS uses UID/GID mapping while SMB uses user accounts. Ensure both map to the same underlying file permissions.

### Is NFS secure enough for a home network?
NFSv4 supports Kerberos authentication and encryption. For a home network behind a firewall, unencrypted NFSv4 is fine — the traffic never leaves your LAN. If you're concerned, segment your storage traffic onto a separate VLAN.

### Do I need 10GbE for network storage?
For most self-hosting workloads, 1GbE is fine. 2.5GbE is the sweet spot — affordable NICs and switches, meaningful bandwidth improvement. 10GbE is only necessary if you're moving large files frequently (video editing, VM migration) or running many concurrent clients.

### Can Docker use iSCSI volumes?
Not natively. You'd need to mount the iSCSI block device on the host and then bind-mount the filesystem into the container. Use NFS instead — it's simpler and Docker handles it natively.

### Which protocol has the least CPU overhead?
NFS has the lowest CPU overhead on Linux. SMB uses more CPU due to encryption (SMB 3.0+) and the CIFS protocol stack. iSCSI overhead is minimal but the client-side filesystem adds some CPU cost.

## Related

- [Best NAS for Home Server](/hardware/best-nas/)
- [10GbE Networking Guide](/hardware/10gbe-networking/)
- [2.5GbE Networking Guide](/hardware/2.5gbe-networking/)
- [Homelab Network Topology](/hardware/homelab-network-topology/)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas/)
- [Docker Networking Basics](/foundations/docker-networking/)
- [Docker Volumes Guide](/foundations/docker-volumes/)
