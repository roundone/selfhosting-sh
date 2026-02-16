---
title: "ZFS Basics for Self-Hosting"
description: "Understand ZFS for your home server — pools, datasets, snapshots, compression, and why ZFS is the best filesystem for self-hosting."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "zfs", "storage", "filesystem", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is ZFS?

ZFS is a combined filesystem and volume manager originally developed by Sun Microsystems. It handles the entire storage stack — from raw disks to the filesystem your applications read and write. Unlike traditional setups where you layer mdadm (RAID) + LVM (volume management) + ext4 (filesystem), ZFS does all three in one integrated system.

For self-hosting, ZFS provides:
- **Data integrity** — checksums every block and detects silent corruption (bit rot)
- **Snapshots** — instant, space-efficient point-in-time copies
- **Compression** — transparent compression that saves disk space with negligible CPU cost
- **RAID equivalents** — mirrors and raidz levels built in
- **Copy-on-write** — data is never overwritten in place, preventing corruption during power loss

ZFS is the recommended filesystem for [Proxmox](/foundations/proxmox-basics), [TrueNAS](/foundations/nas-basics), and any serious self-hosting storage setup.

## Prerequisites

- A Linux server (Ubuntu 22.04+ or Debian 12+ recommended)
- At least 8GB RAM (ZFS uses RAM aggressively for caching)
- One or more dedicated disks for ZFS (separate from your OS drive)
- Root access

## Installation

### Ubuntu 22.04+

```bash
sudo apt install -y zfsutils-linux
```

Ubuntu has ZFS support in its default repositories.

### Debian 12+

```bash
sudo apt install -y linux-headers-$(uname -r) zfsutils-linux
```

Verify installation:

```bash
zfs version
```

## Core Concepts

### Pools (zpools)

A pool is ZFS's equivalent of a RAID array. It combines one or more disks into a single storage unit. All data in the pool is distributed across the disks according to the pool's redundancy configuration.

### Datasets

Datasets are like partitions, but more flexible. Each dataset is a separate filesystem with its own mount point, quota, compression settings, and snapshot schedule. Datasets don't need a fixed size — they share the pool's storage dynamically.

### VDEVs (Virtual Devices)

A vdev is a group of disks within a pool. A pool can contain multiple vdevs. Data is striped across vdevs, and each vdev provides its own redundancy.

**Types of vdevs:**

| Type | Disks | Redundancy | Usable Space | Use Case |
|------|-------|-----------|--------------|----------|
| Single disk | 1 | None | 100% | Testing only |
| Mirror | 2+ | n-1 disks can fail | 50% (with 2 disks) | Small setups, best performance |
| raidz1 | 3+ | 1 disk can fail | (n-1)/n | General use, 3-4 disks |
| raidz2 | 4+ | 2 disks can fail | (n-2)/n | Larger arrays, safer |
| raidz3 | 5+ | 3 disks can fail | (n-3)/n | Very large arrays |

For more context on RAID levels, see [RAID Configurations Explained](/foundations/raid-explained).

## Creating a Pool

### Identify Your Disks

```bash
lsblk
```

Look for the disks you want to use. Common names: `/dev/sda`, `/dev/sdb`, etc. Use `/dev/disk/by-id/` paths for stability — device names can change between reboots.

```bash
ls -la /dev/disk/by-id/ | grep -v part
```

### Mirror Pool (2 Disks)

```bash
sudo zpool create -o ashift=12 datapool mirror \
  /dev/disk/by-id/ata-WDC_WD40EFRX-68WT0N0_WD-WCC4E1234567 \
  /dev/disk/by-id/ata-WDC_WD40EFRX-68WT0N0_WD-WCC4E7654321
```

- `ashift=12` sets the sector size to 4K (correct for modern drives)
- `mirror` makes a RAID 1 equivalent
- Use `/dev/disk/by-id/` paths, not `/dev/sdX`

### raidz1 Pool (3+ Disks)

```bash
sudo zpool create -o ashift=12 datapool raidz1 \
  /dev/disk/by-id/disk1 \
  /dev/disk/by-id/disk2 \
  /dev/disk/by-id/disk3
```

### Verify the Pool

```bash
sudo zpool status datapool
```

The pool is automatically mounted at `/datapool`.

## Working with Datasets

### Create Datasets

Create separate datasets for different purposes:

```bash
sudo zfs create datapool/media
sudo zfs create datapool/backups
sudo zfs create datapool/docker
sudo zfs create datapool/photos
```

Each dataset is mounted automatically at `/datapool/media`, `/datapool/backups`, etc.

### Set Properties

```bash
# Enable compression (LZ4 — fast with good ratio)
sudo zfs set compression=lz4 datapool

# Set a quota on a dataset
sudo zfs set quota=500G datapool/media

# Reserve space for a dataset (guaranteed minimum)
sudo zfs set reservation=100G datapool/backups

# Set record size for specific workloads
sudo zfs set recordsize=1M datapool/media     # Large files (video, photos)
sudo zfs set recordsize=16K datapool/docker    # Database-like workloads
```

### View Dataset Usage

```bash
sudo zfs list
```

```
NAME               USED  AVAIL     REFER  MOUNTPOINT
datapool           1.2T  2.5T       128K  /datapool
datapool/media     800G  2.5T       800G  /datapool/media
datapool/backups   300G  2.5T       300G  /datapool/backups
datapool/docker     50G  2.5T        50G  /datapool/docker
datapool/photos     50G  2.5T        50G  /datapool/photos
```

## Compression

ZFS transparent compression is one of its best features. Data is compressed before writing to disk and decompressed on read. With LZ4 (default), the CPU overhead is negligible — you effectively get more storage for free.

```bash
# Enable LZ4 compression on the entire pool
sudo zfs set compression=lz4 datapool
```

Check compression ratio:

```bash
sudo zfs get compressratio datapool
```

A ratio of `1.50x` means your data takes 33% less disk space than uncompressed. Text-heavy data (configs, logs, documents) often compresses 2-3x. Already-compressed media (video, JPEG, MP3) barely compresses at all.

**Always enable compression.** There's no reason not to. LZ4 is so fast that reading compressed data from disk is often faster than reading uncompressed data because less I/O is needed.

## Snapshots

Snapshots are instant, read-only copies of a dataset at a point in time. They use almost no space initially — only the blocks that change after the snapshot consume additional space.

### Take a Snapshot

```bash
sudo zfs snapshot datapool/photos@2026-02-16
```

### List Snapshots

```bash
sudo zfs list -t snapshot
```

### Roll Back to a Snapshot

```bash
sudo zfs rollback datapool/photos@2026-02-16
```

This reverts the dataset to the exact state at snapshot time. Any data written after the snapshot is lost.

### Automated Snapshots

Install `zfs-auto-snapshot` for automatic scheduled snapshots:

```bash
sudo apt install -y zfs-auto-snapshot
```

By default, it takes snapshots at these intervals:
- Every 15 minutes (keep 4)
- Hourly (keep 24)
- Daily (keep 31)
- Weekly (keep 8)
- Monthly (keep 12)

Disable automatic snapshots on datasets that don't need them (like temp data):

```bash
sudo zfs set com.sun:auto-snapshot=false datapool/docker
```

### Send/Receive (Offsite Backup)

ZFS can send snapshots to another pool — locally or over the network:

```bash
# Send a snapshot to a remote server over SSH
sudo zfs send datapool/photos@2026-02-16 | ssh user@backupserver sudo zfs receive backuppool/photos

# Incremental send (only changed blocks since last snapshot)
sudo zfs send -i datapool/photos@2026-02-15 datapool/photos@2026-02-16 | \
  ssh user@backupserver sudo zfs receive backuppool/photos
```

Incremental sends are extremely efficient — only the changed blocks since the previous snapshot are transferred. This makes ZFS send/receive one of the best backup mechanisms for large datasets.

## ZFS and Docker

Docker works well on ZFS. Two approaches:

### Option 1: Docker Data on a ZFS Dataset

Store Docker's data directory on a ZFS dataset:

```bash
sudo zfs create datapool/docker

# Stop Docker
sudo systemctl stop docker

# Move existing Docker data
sudo mv /var/lib/docker /var/lib/docker.bak
sudo mkdir /var/lib/docker

# Mount the ZFS dataset
sudo zfs set mountpoint=/var/lib/docker datapool/docker

# Start Docker
sudo systemctl start docker
```

### Option 2: Bind Mounts from ZFS Datasets

Keep Docker on the OS drive but mount ZFS datasets into containers:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    volumes:
      - /datapool/media:/media:ro
      - jellyfin-config:/config
```

This is simpler and more common. Docker manages its own storage, but large data lives on ZFS.

## Monitoring

### Check Pool Health

```bash
sudo zpool status
```

A healthy pool shows `ONLINE` for all devices. Watch for `DEGRADED` (disk failure), `FAULTED`, or `CHECKSUM` errors (data corruption detected).

### Scrub (Check for Corruption)

```bash
sudo zpool scrub datapool
```

A scrub reads every block in the pool and verifies its checksum. If corruption is found and the pool has redundancy, ZFS automatically repairs it. Run scrubs weekly.

Set up a weekly cron job:

```bash
# /etc/cron.d/zfs-scrub
0 2 * * 0 root /sbin/zpool scrub datapool
```

### Check I/O Statistics

```bash
zpool iostat datapool 5
```

Shows read/write operations and bandwidth, refreshing every 5 seconds.

## Common Mistakes

### Not Enough RAM

ZFS uses an ARC (Adaptive Replacement Cache) in RAM for caching. The minimum is 8GB for a basic setup. For large pools, allocate 1GB ARC per TB of storage. Starving ZFS of RAM causes terrible performance.

If RAM is tight, limit the ARC:

```bash
# /etc/modprobe.d/zfs.conf
options zfs zfs_arc_max=4294967296  # 4GB limit
```

### Using raidz1 with Large Drives

With drives larger than 4TB, the rebuild time after a failure is long enough that a second drive could fail during rebuild. Use raidz2 (double parity) for arrays with large drives.

### Not Using disk/by-id Paths

Using `/dev/sda`, `/dev/sdb` paths is dangerous — these can change between reboots. Always use `/dev/disk/by-id/` for pool creation.

### Filling the Pool Above 80%

ZFS performance degrades significantly above 80% capacity due to how copy-on-write allocates blocks. Keep at least 20% free space. Set alerts at 80% usage.

### Ignoring Scrub Errors

If `zpool status` shows checksum errors after a scrub, investigate immediately. On a redundant pool, ZFS auto-repairs. On a single-disk pool, checksum errors mean data corruption — restore from backup.

## Next Steps

- Set up a NAS with ZFS — [NAS Basics](/foundations/nas-basics)
- Understand RAID choices — [RAID Configurations Explained](/foundations/raid-explained)
- Plan your backup strategy — [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- Run ZFS on Proxmox — [Proxmox VE Basics](/foundations/proxmox-basics)

## FAQ

### ZFS vs ext4 — when should I use ZFS?

Use ext4 for single-disk OS drives and simple setups. Use ZFS when you have multiple drives, need data integrity guarantees, want snapshots, or need RAID. ZFS is more complex to set up but dramatically better at protecting your data.

### Can I add a disk to an existing ZFS pool?

You can add a new vdev to a pool (e.g., add a new mirror pair), but you cannot add a single disk to an existing vdev (e.g., add a third disk to a 2-disk mirror or a fourth disk to a 3-disk raidz1). Plan your vdev layout carefully.

### Does ZFS work on SSDs?

Yes. ZFS works well on SSDs. You can also use an SSD as a cache device (L2ARC for reads, SLOG for sync writes) in front of HDD-based pools. This gives you SSD-like performance for frequently accessed data with HDD capacity.

### How do I check if ZFS is repairing corrupted data?

Run `zpool status` and look for lines showing `CKSUM` errors being repaired. ZFS logs repairs during scrubs. If you see `(repairing)` in the status, ZFS is actively fixing corrupted blocks using redundant copies.

## Related

- [RAID Configurations Explained](/foundations/raid-explained)
- [NAS Basics](/foundations/nas-basics)
- [Proxmox VE Basics](/foundations/proxmox-basics)
- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- [Docker Volumes](/foundations/docker-volumes)
- [Choosing a Linux Distro](/foundations/choosing-linux-distro)
