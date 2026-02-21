---
title: "RAID Explained for Self-Hosting"
description: "Understand RAID levels for your home server — RAID 0, 1, 5, 6, 10, and ZFS. Which to use, which to avoid, and why RAID isn't a backup."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["storage", "raid", "hardware", "foundations"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is RAID?

RAID (Redundant Array of Independent Disks) combines multiple drives into a single logical volume for redundancy, performance, or both. If a drive fails in a RAID array, your data survives — you replace the dead drive and the array rebuilds.

**RAID is not a backup.** RAID protects against hardware failure (a drive dying). It does NOT protect against accidental deletion, ransomware, file corruption, fire, theft, or software bugs. You need both RAID and backups. See [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/).

## Prerequisites

- Multiple drives (2+ for most RAID levels)
- Basic Linux knowledge ([Linux Basics](/foundations/linux-basics-self-hosting/))
- Understanding of your storage needs

## RAID Levels Compared

| Level | Minimum Drives | Usable Capacity | Drive Failures Tolerated | Performance | Best For |
|-------|---------------|-----------------|-------------------------|-------------|----------|
| RAID 0 | 2 | 100% | 0 (none!) | Fastest read/write | Scratch space, caches (NOT important data) |
| RAID 1 | 2 | 50% | 1 | Fast reads, normal writes | Boot drives, small critical storage |
| RAID 5 | 3 | (N-1)/N | 1 | Good reads, slower writes | General storage, NAS |
| RAID 6 | 4 | (N-2)/N | 2 | Good reads, slow writes | Large arrays where dual failure is a concern |
| RAID 10 | 4 | 50% | 1 per mirror pair | Fast read/write | Databases, high-performance workloads |

### RAID 0: Striping (No Redundancy)

Data is split across drives for speed. If any drive fails, all data is lost.

```
Drive 1: [A1][A3][A5]
Drive 2: [A2][A4][A6]
```

**Capacity:** 2 × 4 TB = 8 TB usable
**Redundancy:** None. Worse than a single drive — double the failure risk.
**Use case:** Temporary files, build caches, scratch space. Never for important data.

### RAID 1: Mirroring

Identical copies on each drive. Simple and reliable.

```
Drive 1: [A1][A2][A3][A4]
Drive 2: [A1][A2][A3][A4]  ← exact copy
```

**Capacity:** 2 × 4 TB = 4 TB usable (50% efficiency)
**Redundancy:** 1 drive can fail
**Use case:** Boot drives, small but critical data. Simple and reliable.
**Recommendation:** Best choice for 2-drive setups.

### RAID 5: Striping with Distributed Parity

Data and parity information distributed across all drives. Balances capacity, performance, and redundancy.

```
Drive 1: [A1][B2][Cp]
Drive 2: [A2][Bp][C1]
Drive 3: [Ap][B1][C2]
(p = parity)
```

**Capacity:** 3 × 4 TB = 8 TB usable (67% efficiency)
**Redundancy:** 1 drive can fail
**Use case:** The standard for NAS storage with 3+ drives. Good balance of capacity and safety.

**Warning:** Rebuild times for large drives (8 TB+) can take 12–24+ hours. During rebuild, a second drive failure destroys the array. For large drives, consider RAID 6.

### RAID 6: Double Parity

Like RAID 5 but with two parity blocks. Survives two simultaneous drive failures.

**Capacity:** 4 × 4 TB = 8 TB usable (50% efficiency with 4 drives, improves with more)
**Redundancy:** 2 drives can fail simultaneously
**Use case:** Large arrays (6+ drives) where rebuild times are long and a second failure during rebuild is a real risk.

### RAID 10: Mirrored Stripes

Combines RAID 1 (mirroring) and RAID 0 (striping). Fast and redundant, but expensive on capacity.

```
Mirror 1: Drive 1 [A1][A3] ←→ Drive 2 [A1][A3]
Mirror 2: Drive 3 [A2][A4] ←→ Drive 4 [A2][A4]
```

**Capacity:** 4 × 4 TB = 8 TB usable (50% efficiency)
**Redundancy:** 1 drive per mirror pair
**Use case:** Databases, VMs, anything needing both speed and redundancy. Common in enterprise.

## RAID for Self-Hosting: Recommendations

| Setup | Recommendation |
|-------|---------------|
| 2 drives, data matters | RAID 1 |
| 2 drives, speed over safety | RAID 0 (accept the risk) |
| 3-4 drives, NAS storage | RAID 5 |
| 5+ drives, NAS storage | RAID 6 |
| 4+ drives, database/VM server | RAID 10 |
| Single drive + backups | No RAID (use a good backup strategy) |

**For most homelabs:** RAID 1 (2 drives) or RAID 5 (3-4 drives) covers the common case. Add offsite backups regardless.

## Software vs Hardware RAID

### Software RAID (mdadm on Linux)

The OS manages the array. No special hardware needed.

```bash
# Create a RAID 1 array
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc

# Format and mount
sudo mkfs.ext4 /dev/md0
sudo mkdir /mnt/raid
sudo mount /dev/md0 /mnt/raid

# Save the config
sudo mdadm --detail --scan >> /etc/mdadm/mdadm.conf
sudo update-initramfs -u

# Add to fstab for auto-mount
echo '/dev/md0 /mnt/raid ext4 defaults 0 0' | sudo tee -a /etc/fstab
```

**Check array status:**
```bash
cat /proc/mdstat
sudo mdadm --detail /dev/md0
```

**Advantages:** Free, works on any hardware, portable between systems, well-tested.
**Disadvantages:** Uses CPU (negligible on modern hardware).

### Hardware RAID

A dedicated RAID controller manages the array. The OS sees a single disk.

**Advantages:** Offloads RAID from CPU, battery-backed cache protects against power loss.
**Disadvantages:** Expensive, vendor lock-in (array tied to that controller model), harder to recover if controller dies.

**Recommendation:** Use software RAID (mdadm) or ZFS for homelabs. Hardware RAID controllers are expensive and the benefits are minimal for home workloads.

## ZFS: The Modern Alternative

ZFS isn't traditional RAID — it's a combined filesystem and volume manager that handles redundancy, checksums, compression, and snapshots.

### ZFS RAID Equivalents

| ZFS Name | Equivalent To | Drives |
|----------|--------------|--------|
| Mirror | RAID 1 | 2 |
| RAIDZ1 | RAID 5 | 3+ |
| RAIDZ2 | RAID 6 | 4+ |
| RAIDZ3 | Triple parity | 5+ |

### Basic ZFS Setup

```bash
# Install ZFS (Ubuntu)
sudo apt install zfsutils-linux

# Create a mirror (RAID 1)
sudo zpool create mypool mirror /dev/sdb /dev/sdc

# Create RAIDZ1 (RAID 5)
sudo zpool create mypool raidz1 /dev/sdb /dev/sdc /dev/sdd

# Enable compression (recommended)
sudo zfs set compression=lz4 mypool

# Create datasets (like partitions)
sudo zfs create mypool/docker
sudo zfs create mypool/media
sudo zfs create mypool/backups

# Check pool status
sudo zpool status
```

### Why ZFS Over mdadm

| Feature | mdadm + ext4 | ZFS |
|---------|-------------|-----|
| Data checksums | No | Yes (detects bit rot) |
| Self-healing | No | Yes (fixes corrupted data from good copy) |
| Snapshots | No (need LVM) | Built-in, instant, free |
| Compression | No (need filesystem-level) | Built-in, transparent |
| Expansion | Add drives, grow array | Add vdevs (can't expand existing vdevs easily) |
| RAM usage | Low | Wants 1 GB+ per TB of storage |

**Recommendation:** ZFS if you have 8+ GB RAM and want data integrity features. mdadm + ext4 if you want simplicity and lower RAM usage.

**ZFS RAM rule of thumb:** 1 GB base + 1 GB per TB of storage. A 4 TB pool wants ~5 GB RAM for ZFS. If your server has 8 GB total and runs many containers, this may be too much.

## Monitoring Your Array

### mdadm Monitoring

```bash
# Check status
cat /proc/mdstat
sudo mdadm --detail /dev/md0

# Set up email alerts
sudo mdadm --monitor --mail=admin@example.com --delay=300 /dev/md0 --daemonise
```

### ZFS Monitoring

```bash
# Pool status (shows drive health)
sudo zpool status

# Scrub (verify data integrity — run monthly)
sudo zpool scrub mypool

# Check scrub results
sudo zpool status mypool
```

Add to cron for monthly scrubs:
```bash
0 2 1 * * /usr/sbin/zpool scrub mypool
```

## Common Mistakes

### 1. Using RAID as a Backup

RAID protects against drive failure only. Deleted a file? RAID deletes it on all drives simultaneously. Got ransomware? RAID encrypts all copies. Always maintain separate backups.

### 2. Using RAID 5 with Very Large Drives

8 TB+ drives take 12–24 hours to rebuild. During that time, a second failure destroys the array. With large drives, use RAID 6 or RAIDZ2.

### 3. Mixing Drive Sizes

In RAID 1/5/6, all drives' usable capacity equals the smallest drive. A 4 TB + 8 TB RAID 1 gives you 4 TB usable (the 8 TB drive's extra space is wasted). Use matching drives.

### 4. Not Monitoring Array Health

A degraded array (one drive failed) looks normal from the outside — services keep running. Without monitoring, you won't know until the second drive fails. Set up alerts.

### 5. Buying Drives from the Same Batch

Drives from the same batch were manufactured at the same time and may fail at the same time. Buy from different vendors or at different times to reduce correlated failure risk.

## FAQ

### Do I need RAID for a home server?

Not necessarily. A single drive with good offsite backups is fine for many setups. RAID adds uptime — your server keeps running when a drive fails. Without RAID, a drive failure means downtime while you restore from backup.

### RAID 1 or RAID 5 for a NAS?

RAID 1 for 2 drives. RAID 5 for 3+. If you only have 2 drive bays, RAID 1 is your only redundancy option. RAID 5 gives better capacity efficiency with 3+ drives.

### Should I use ZFS or mdadm?

ZFS if you have RAM to spare (8+ GB) and want checksums, snapshots, and self-healing. mdadm if you want simplicity, lower RAM usage, or easier drive expansion. Both are production-ready.

### Can I add drives to an existing RAID array?

mdadm RAID 5/6: yes, you can grow the array by adding drives (slow rebuild). ZFS: you can add new vdevs (mirror or raidz groups) to a pool, but you can't expand an existing vdev without replacing all drives with larger ones.

### How often should I scrub/verify my array?

Monthly. Scrubbing reads all data and verifies integrity. For ZFS, it also fixes bit rot from the redundant copy. Schedule it during low-usage hours.

## Next Steps

- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/) — RAID is not a backup
- [Home Server Cost Breakdown](/foundations/home-server-cost/) — hardware costs including drives
- [Disaster Recovery](/foundations/disaster-recovery/) — recover when things go wrong

## Related

- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Disaster Recovery](/foundations/disaster-recovery/)
- [Home Server Cost Breakdown](/foundations/home-server-cost/)
- [Docker Volumes](/foundations/docker-volumes/)
- [Linux Basics for Self-Hosting](/foundations/linux-basics-self-hosting/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
