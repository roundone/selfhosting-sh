---
title: "Server Storage Planning for Self-Hosting"
description: "Plan your server storage planning for self-hosting — estimate capacity by use case, choose drives and file systems, configure RAID, and mount volumes."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "foundations"
apps: []
tags: ["foundations", "storage", "nas", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## Why Storage Planning Matters

Running out of disk space is the most common preventable failure in self-hosting. Your [Jellyfin](/apps/jellyfin/) media library grows. Your [Immich](/apps/immich/) photo backups accumulate. Your [Nextcloud](/apps/nextcloud/) file sync eats gigabytes without warning. One day, a Docker container crashes because `/var` is full, and half your services go down.

Server storage planning prevents this. Before you install a single container, you should know how much space you need, where your data will live, what file system to use, and how you will expand when you outgrow your initial setup. Getting this right upfront saves you from painful data migrations later.

The core rule: **separate your OS drive from your data storage.** Your operating system and Docker images belong on a small, fast SSD. Your media, photos, files, and database volumes belong on separate, larger drives. This separation makes backups simpler, upgrades cleaner, and disk-full failures less catastrophic.

## Prerequisites

- A Linux server (Ubuntu 22.04+ recommended)
- Basic terminal comfort ([Linux Basics](/foundations/linux-basics-self-hosting/))
- Understanding of Docker volumes ([Docker Volumes](/foundations/docker-volumes/))
- Familiarity with your planned self-hosted applications

## Estimating Your Storage Needs

Storage needs vary wildly depending on what you self-host. Here are realistic estimates by use case.

### Media Server (Jellyfin, Plex, Emby)

Media libraries are the largest storage consumers in self-hosting. Plan generously.

| Content Type | Average Size | Example |
|-------------|-------------|---------|
| Movie (1080p) | 4-8 GB | 100 movies = 400-800 GB |
| Movie (4K HDR) | 20-60 GB | 100 movies = 2-6 TB |
| TV episode (1080p) | 1-3 GB | 500 episodes = 500 GB - 1.5 TB |
| Music album (FLAC) | 300-500 MB | 1,000 albums = 300-500 GB |
| Music album (MP3 320kbps) | 80-120 MB | 1,000 albums = 80-120 GB |
| Audiobook | 200-500 MB | 200 books = 40-100 GB |

**Starting recommendation:** 4 TB minimum for a modest media library. 8-12 TB if you collect 4K content. Plan for growth — media libraries only get bigger.

### Photo Management (Immich, PhotoPrism)

Photos add up faster than most people expect, especially with modern phone cameras shooting 12-50 MP images and 4K video.

| Content Type | Average Size | Example |
|-------------|-------------|---------|
| Smartphone photo | 3-8 MB | 10,000 photos = 30-80 GB |
| RAW photo (DSLR) | 25-60 MB | 10,000 RAW files = 250-600 GB |
| 4K video (1 min) | 300-400 MB | 100 minutes = 30-40 GB |
| Immich ML thumbnails | ~20% of originals | 80 GB originals ≈ 16 GB thumbnails |

**Starting recommendation:** 500 GB for phone photo backup of a single person. 1-2 TB for a family. Double it if you shoot RAW or lots of video.

### File Sync (Nextcloud, Seafile)

File sync storage depends entirely on how many users you have and what they store.

| Use Case | Estimate |
|----------|----------|
| Single user, documents only | 10-50 GB |
| Single user, documents + projects | 50-200 GB |
| Family (4 users) | 200 GB - 1 TB |
| Small team (10 users) | 500 GB - 2 TB |

**Starting recommendation:** 500 GB covers most home setups. Nextcloud also stores versions and trash, so expect 30-50% overhead on top of your actual file size.

### Backups (Duplicati, BorgBackup, Restic)

Your [backup strategy](/foundations/backup-3-2-1-rule/) determines backup storage needs. With deduplication and compression (which Borg and Restic handle automatically), backup storage is smaller than you might think.

| Strategy | Storage Needed |
|----------|---------------|
| Full backup, no dedup | 1x source data per copy |
| Incremental with dedup (Borg/Restic) | 1.2-1.5x source data for 30+ snapshots |
| Database dumps only | 1-10 GB per database, compressed |

**Starting recommendation:** Allocate 1.5x your total data for local backups with deduplication. Off-site backups are a separate concern — see [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/).

### The 2x Rule

Whatever you estimate, double it. Storage needs grow faster than you expect. Buying a 4 TB drive when you think you need 2 TB is cheaper than migrating data to a bigger drive six months later.

Plan for at least **2x your current needs** as a minimum. 3x is better if budget allows.

## Storage Types

### HDD vs SSD

| Factor | HDD | SSD |
|--------|-----|-----|
| Cost per TB | $15-25 | $60-100 |
| Sequential read/write | 150-250 MB/s | 500-3,500 MB/s |
| Random IOPS | 50-200 | 10,000-100,000+ |
| Power consumption | 5-10W | 2-5W |
| Noise | Audible (spinning platters) | Silent |
| Lifespan | 3-5 years typical | 5-10 years (depends on writes) |
| Best for | Large media, backups, archives | OS, databases, Docker images, app data |

**The recommendation:** Use an SSD for your OS drive and Docker root (`/var/lib/docker`). Use HDDs for bulk storage — media libraries, photo archives, backups. This gives you fast container performance where it matters and cheap bulk storage where speed is less important.

For database-heavy workloads ([Nextcloud](/apps/nextcloud/), [Immich](/apps/immich/), [BookStack](/apps/bookstack/)), put database volumes on the SSD. Database random I/O performance on an HDD is painful.

### Internal vs External

Internal drives (SATA or NVMe) are always preferred for a home server. They are faster, more reliable (no USB controller bottleneck or cable disconnection), and draw power directly from the PSU.

External USB drives are acceptable for:
- Backup destinations (not primary storage)
- Temporary overflow
- Raspberry Pi setups where internal drives are not an option

Never use an external USB drive as primary storage for Docker volumes. USB disconnections cause data corruption.

### DAS vs NAS

| Type | What It Is | Best For |
|------|-----------|----------|
| DAS (Direct-Attached Storage) | Drives connected directly to your server | Single server setups |
| NAS (Network-Attached Storage) | Dedicated storage device on your network | Multi-server setups, centralized storage |

For most self-hosting beginners: DAS. Plug drives directly into your server. Simpler, faster, fewer failure points.

Graduate to a NAS when you have multiple servers that need access to the same storage, or when you want a dedicated storage appliance with drive management features. See [NAS Basics](/foundations/nas-basics/) for a full comparison.

## File Systems

Your file system choice affects performance, data safety, and available features. Here are the options worth considering.

### ext4

The default Linux file system. Proven, stable, fast.

| Pros | Cons |
|------|------|
| Rock-solid stability (20+ years of production use) | No built-in checksumming |
| Excellent performance | No native snapshots |
| Every Linux tool supports it | No built-in compression |
| Simple to manage | Maximum volume size: 1 EiB (effectively unlimited) |
| Low overhead | |

**Use ext4 when:** You want reliability without complexity. This is the right choice for single-disk setups, OS drives, and any scenario where you do not need ZFS or Btrfs features.

Format a drive with ext4:

```bash
sudo mkfs.ext4 -L datastore /dev/sdb1
```

### XFS

High-performance file system. Default on RHEL/CentOS. Excellent for large files.

| Pros | Cons |
|------|------|
| Excellent large-file performance | Cannot shrink a partition (only grow) |
| Handles many files efficiently | Slightly more complex recovery |
| Good for media storage | |

**Use XFS when:** You primarily store large files (media, backups) and want maximum sequential throughput.

### ZFS

The most feature-rich file system available on Linux. Built-in RAID, checksumming, compression, snapshots, and self-healing. Also the most complex.

| Pros | Cons |
|------|------|
| End-to-end data integrity (checksumming) | RAM hungry (1 GB per TB of storage is the rule of thumb) |
| Built-in RAID (RAIDZ1, RAIDZ2, mirrors) | Cannot add single drives to an existing pool easily |
| Native snapshots and clones | Steeper learning curve |
| Transparent compression | License incompatibility with Linux kernel (must use DKMS/module) |
| Send/receive for backups | |

**Use ZFS when:** You have 8+ GB of RAM, multiple drives, and you value data integrity above all else. ZFS is the gold standard for NAS and storage server builds. See [ZFS Basics](/foundations/zfs-basics/) for setup details.

### Btrfs

Linux-native copy-on-write file system. Offers many of ZFS's features with less RAM overhead.

| Pros | Cons |
|------|------|
| Native snapshots and subvolumes | RAID 5/6 mode is still unreliable (do not use it) |
| Transparent compression (zstd) | Less battle-tested than ZFS for large arrays |
| Built into the Linux kernel | Performance can degrade with heavy fragmentation |
| Lower RAM requirements than ZFS | |

**Use Btrfs when:** You want snapshots and compression on a single drive or a RAID 1 mirror, without ZFS's RAM requirements.

### The Recommendation

**Use ext4 unless you have a specific reason to use something else.** It is the most reliable, best-supported, and simplest option. Graduate to ZFS when you build a multi-drive storage server and want data integrity guarantees. Avoid Btrfs RAID 5/6 entirely.

| Scenario | File System |
|----------|------------|
| Single OS drive | ext4 |
| Single data drive | ext4 |
| 2-drive mirror | ZFS mirror or ext4 + mdadm RAID 1 |
| 4+ drive storage server | ZFS (RAIDZ1 or RAIDZ2) |
| Raspberry Pi SD card / USB | ext4 |
| NAS appliance | Whatever the NAS OS defaults to (usually Btrfs or ext4) |

## RAID vs No RAID

RAID protects against drive failure. It does **not** replace backups. See [RAID Explained](/foundations/raid-explained/) for the full breakdown.

### When You Need RAID

- You have irreplaceable data that would take significant effort to restore
- You cannot tolerate downtime while restoring from backup
- You have 2+ drives available

### When You Do Not Need RAID

- You have a solid backup strategy and can tolerate restoring from backup
- You are on a tight budget (money is better spent on backup drives)
- You only have one drive

### The Recommendation

For a first home server with one or two drives: skip RAID, invest in good backups. A single drive with automated off-site backups ([Backup Strategy](/foundations/backup-3-2-1-rule/)) is more resilient than a RAID array with no backups.

For a storage server with 3+ drives: use RAID (ZFS RAIDZ1 for 3-4 drives, RAIDZ2 for 5+ drives). But still maintain backups — RAID does not protect against accidental deletion, ransomware, or fire.

## Docker Volume Storage Strategy

A well-planned directory layout makes backups, migrations, and troubleshooting vastly easier. Here is the structure that works.

### Recommended Layout

```
/                          # OS drive (SSD)
├── /var/lib/docker/       # Docker images, layers, build cache (SSD)
├── /opt/appdata/          # App configs and small databases (SSD)
│   ├── immich/
│   │   ├── db/
│   │   └── config/
│   ├── jellyfin/
│   │   ├── config/
│   │   └── cache/
│   ├── nextcloud/
│   │   ├── db/
│   │   └── config/
│   └── vaultwarden/
│       └── data/
└── /mnt/data/             # Bulk storage (HDD, mounted separately)
    ├── media/
    │   ├── movies/
    │   ├── tv/
    │   └── music/
    ├── photos/
    ├── files/
    └── backups/
```

**Key principles:**

1. **`/opt/appdata/`** on the SSD holds application configs and databases — small, frequently accessed, performance-sensitive.
2. **`/mnt/data/`** on the HDD holds bulk content — media libraries, photo originals, synced files. Large, sequential access, tolerant of slower drives.
3. **One subdirectory per app** under `/opt/appdata/`. Makes it obvious which data belongs to which container.

### Docker Compose Example

Here is how this layout looks in a [Docker Compose file](/foundations/docker-compose-basics/):

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.9.6
    volumes:
      - /opt/appdata/jellyfin/config:/config     # SSD — config and metadata
      - /opt/appdata/jellyfin/cache:/cache        # SSD — transcoding cache
      - /mnt/data/media:/media:ro                 # HDD — media library (read-only)
    restart: unless-stopped

  immich-server:
    image: ghcr.io/immich-app/server:v1.99.0
    volumes:
      - /mnt/data/photos:/usr/src/app/upload      # HDD — photo originals
    restart: unless-stopped

  immich-db:
    image: tensorchord/pgvecto-rs:pg16-v0.2.1
    volumes:
      - /opt/appdata/immich/db:/var/lib/postgresql/data  # SSD — database (IOPS-sensitive)
    restart: unless-stopped
```

Notice the pattern: database on SSD, bulk files on HDD, config on SSD. This is not accidental — it matches each data type to the storage tier where it performs best.

### Creating the Directory Structure

```bash
# Create app data directory on SSD
sudo mkdir -p /opt/appdata

# Create bulk storage mount point
sudo mkdir -p /mnt/data

# After mounting your data drive (see next section):
sudo mkdir -p /mnt/data/{media,photos,files,backups}
sudo mkdir -p /mnt/data/media/{movies,tv,music}

# Set ownership (adjust UID/GID as needed for your containers)
sudo chown -R 1000:1000 /opt/appdata
sudo chown -R 1000:1000 /mnt/data
```

## Mounting External Storage

Once you have your data drive, you need to mount it persistently so it survives reboots.

### Find Your Drive

```bash
# List all block devices
lsblk -f

# Example output:
# NAME   FSTYPE LABEL     MOUNTPOINT  SIZE
# sda                                 256G
# ├─sda1 ext4   os-root   /           250G
# └─sda2 swap             [SWAP]        6G
# sdb                                   4T
# └─sdb1 ext4   datastore             4.0T
```

### Partition and Format (New Drive)

If the drive is new and unformatted:

```bash
# Create a single partition (GPT)
sudo parted /dev/sdb mklabel gpt
sudo parted /dev/sdb mkpart primary ext4 0% 100%

# Format with ext4
sudo mkfs.ext4 -L datastore /dev/sdb1
```

### Get the UUID

Always mount by UUID, never by device name (`/dev/sdb1`). Device names can change between reboots; UUIDs do not.

```bash
sudo blkid /dev/sdb1
# Output: /dev/sdb1: LABEL="datastore" UUID="a1b2c3d4-e5f6-7890-abcd-ef1234567890" TYPE="ext4"
```

### Add to /etc/fstab

Edit `/etc/fstab` to mount the drive automatically on boot:

```bash
# /etc/fstab entry for data drive
UUID=a1b2c3d4-e5f6-7890-abcd-ef1234567890  /mnt/data  ext4  defaults,noatime  0  2
```

The `noatime` option disables access time updates, which reduces unnecessary writes — especially useful on SSDs and for Docker volume performance.

### Mount and Verify

```bash
# Mount everything in fstab
sudo mount -a

# Verify
df -h /mnt/data
# Output:
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sdb1       3.6T   28K  3.4T   1% /mnt/data
```

### Mounting NFS Shares

If your bulk storage lives on a NAS, mount it via NFS:

```bash
# Install NFS client
sudo apt install nfs-common

# /etc/fstab entry for NFS share
192.168.1.50:/volume1/docker  /mnt/data  nfs  defaults,_netdev,soft,timeo=30  0  0
```

The `_netdev` option tells Linux to wait for the network before mounting. Without it, your server can hang on boot if the NAS is unreachable.

## Monitoring Disk Usage

Running out of disk space without warning is negligent. Monitor your storage and set alerts.

### Quick Checks

```bash
# Disk usage summary for all mounted volumes
df -h

# Top 10 largest directories under /opt/appdata
du -h --max-depth=1 /opt/appdata | sort -rh | head -10

# Docker disk usage breakdown
docker system df

# Detailed Docker disk usage
docker system df -v
```

### Finding Large Files

```bash
# Find files over 1 GB in your data directory
find /mnt/data -type f -size +1G -exec ls -lh {} \; 2>/dev/null

# Find the largest Docker volumes
du -h --max-depth=2 /var/lib/docker/volumes | sort -rh | head -10
```

### Docker Cleanup

Docker accumulates unused images, stopped containers, and dangling volumes over time. Reclaim space periodically:

```bash
# Remove unused images, stopped containers, and build cache
docker system prune -a

# Remove unused volumes (CAREFUL — only if you know they're unused)
docker volume prune
```

**Warning:** `docker volume prune` deletes unnamed volumes that are not attached to any container. If you use named volumes, verify they are truly unused before pruning.

### Automated Monitoring

For persistent monitoring, set up [Uptime Kuma](/apps/uptime-kuma/) or [Beszel](/apps/beszel/) with disk usage alerts. At minimum, add a cron job that warns you:

```bash
# /etc/cron.daily/disk-check
#!/bin/bash
THRESHOLD=85
USAGE=$(df /mnt/data --output=pcent | tail -1 | tr -d ' %')
if [ "$USAGE" -gt "$THRESHOLD" ]; then
  echo "WARNING: /mnt/data is ${USAGE}% full" | mail -s "Disk Alert" admin@example.com
fi
```

Set your threshold at **85%.** This gives you time to react before hitting 100%.

## Common Mistakes

**Using `/dev/sdb` instead of UUID in fstab.** Device names shift when you add or remove drives. UUID is stable. Always use `UUID=` in your fstab entries.

**Putting everything on one drive.** When your single drive fills up, your OS, Docker, and all your apps fail simultaneously. Separate your OS drive from data storage. When the data drive fills up, your OS and Docker engine still function normally.

**Using `:latest` Docker images on a small SSD.** Docker pulls new image layers with each `:latest` update, and old layers accumulate. Pin image versions and run `docker system prune` periodically to reclaim space. See [Docker Volumes](/foundations/docker-volumes/) for more on managing Docker storage.

**Not monitoring disk usage.** A drive at 98% capacity does not send you an email. It silently corrupts your database when a write fails. Set up alerts well before you run out of space.

**Choosing ZFS on a 4 GB RAM machine.** ZFS wants memory for its ARC cache. On a low-RAM system (4 GB or less), ZFS can starve your containers of memory. Use ext4 on resource-constrained hardware.

**Mounting USB drives for primary Docker volumes.** USB drives disconnect. When they do, Docker writes to the mount point on your root filesystem instead, filling up your OS drive. Use USB drives for backups only.

**Skipping `noatime` in fstab.** Every file access updates the access timestamp, generating unnecessary write I/O. Adding `noatime` is free performance, especially for Docker volumes with frequent reads.

**Forgetting `_netdev` for network mounts.** Without this flag, your server tries to mount the NFS/CIFS share before the network is up. The boot process hangs for minutes until the mount times out.

## Next Steps

With your storage planned and mounted, you are ready to:

1. **Set up Docker volumes** that map to your storage layout — [Docker Volumes](/foundations/docker-volumes/)
2. **Configure RAID** if you have multiple drives — [RAID Explained](/foundations/raid-explained/)
3. **Deploy your first app** with proper volume mounts — [Docker Compose Basics](/foundations/docker-compose-basics/)
4. **Implement backups** so storage failure does not mean data loss — [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
5. **Explore NAS options** if you want centralized storage — [NAS Basics](/foundations/nas-basics/)
6. **Set up ZFS** for advanced data integrity — [ZFS Basics](/foundations/zfs-basics/)

## Related

- [Docker Volumes and Persistent Data](/foundations/docker-volumes/)
- [RAID Explained for Self-Hosting](/foundations/raid-explained/)
- [NAS Basics for Self-Hosting](/foundations/nas-basics/)
- [ZFS Basics](/foundations/zfs-basics/)
- [Backup Strategy: The 3-2-1 Rule](/foundations/backup-3-2-1-rule/)
- [Docker Compose Basics](/foundations/docker-compose-basics/)
- [Getting Started with Self-Hosting](/foundations/getting-started/)
- [Monitoring Basics](/foundations/monitoring-basics/)

## FAQ

### How much storage do I need to start self-hosting?

A 256 GB SSD for the OS and Docker, plus a 2-4 TB HDD for data, handles most beginner setups. This covers a media server, photo management, file sync, and backups. Apply the 2x rule — buy twice what you think you need today.

### Should I use SSDs for everything?

No. SSDs make sense for your OS drive, databases, and application configs where random I/O performance matters. Bulk media, photos, and backups are sequential workloads where HDDs perform fine at a fraction of the cost. A 4 TB SSD costs $200-400; a 4 TB HDD costs $60-100.

### Can I add more storage later without starting over?

Yes, but how easily depends on your setup. With separate mount points (`/mnt/data`, `/mnt/data2`), you can add a new drive and mount it alongside existing storage. With LVM, you can extend a logical volume across multiple drives. With ZFS, you can add new vdevs to an existing pool. The simplest approach: start with a single data drive, and when you outgrow it, add a second drive at a new mount point and move specific workloads to it.

### Is NFS reliable enough for Docker volumes?

For media streaming and file storage, NFS works well. For databases, no. Database I/O requires low latency and strong consistency guarantees that NFS cannot reliably provide. Keep database volumes on local drives and use NFS for bulk content like media libraries and photo archives.

### What happens when a drive fails?

Without RAID: the data on that drive is gone. You restore from backup. With RAID: the array continues operating in degraded mode while you replace the failed drive. Either way, you need backups. RAID buys you uptime; backups buy you recoverability. See [RAID Explained](/foundations/raid-explained/) and [Backup Strategy](/foundations/backup-3-2-1-rule/).
