---
title: "NAS Basics for Self-Hosting"
description: "Understand network-attached storage for self-hosting — NAS vs server, prebuilt vs DIY, file sharing protocols, and storage planning."
date: 2026-02-16
dateUpdated: 2026-02-16
category: "foundations"
apps: []
tags: ["foundations", "nas", "storage", "hardware", "self-hosting"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: false
---

## What Is a NAS?

A NAS (Network-Attached Storage) is a dedicated device that provides file storage accessible over your network. It sits on your LAN and serves files to every device — computers, phones, media players, and other servers. Think of it as your personal cloud storage.

For self-hosting, a NAS fills two roles:

1. **Storage backend** — media libraries for [Jellyfin](/apps/jellyfin), photo collections for [Immich](/apps/immich), file sync for [Nextcloud](/apps/nextcloud), and backups for everything
2. **Docker host** — many NAS devices run Docker containers directly, doubling as both storage and application server

## NAS vs General-Purpose Server

| Aspect | NAS | General-Purpose Server |
|--------|-----|----------------------|
| Primary purpose | File storage and sharing | Running applications |
| CPU | Low-power (ARM or Celeron) | Varies (N100, i5, Xeon) |
| Drive bays | 2-8+ hot-swap bays | Depends on case |
| Power consumption | 15-40W | 20-100W+ |
| Noise | Usually quiet | Varies |
| Docker support | Most modern NAS OS support it | Full support |
| Cost (4-bay) | $300-600 (diskless) | $200-400 (mini PC) + case |
| RAID support | Built-in, GUI-managed | Software RAID (mdadm, ZFS) |

**The recommendation:** If you primarily need file storage with light Docker workloads, get a NAS. If you primarily run applications and need some storage, get a mini PC and add drives. If you need both, get both — a mini PC for compute and a NAS for storage.

## Prebuilt NAS Options

### Synology

Synology is the most popular consumer NAS brand. DSM (DiskStation Manager) is their proprietary Linux-based OS with a polished web interface for managing storage, Docker containers, backups, and networking.

**Recommended models:**
- **DS224+** (2-bay) — good for beginners, Intel Celeron J4125, 2GB RAM (expandable to 6GB). Runs Docker containers and handles media serving.
- **DS423+** (4-bay) — the sweet spot for self-hosters. Intel Celeron J4125, 2GB RAM (expandable to 6GB). Enough bays for redundancy.
- **DS923+** (4-bay) — AMD Ryzen R1600, 4GB RAM (expandable to 32GB). Better CPU for heavier Docker workloads.

**Pros:** Best software ecosystem, excellent mobile apps, good Docker support via Container Manager, strong community.
**Cons:** Expensive (you're paying for the software), locked to Synology hardware, slower CPU than a comparable mini PC.

### QNAP

QNAP is Synology's main competitor. QTS is their OS — more feature-rich than DSM but also more complex and historically had more security issues.

**Pros:** Often cheaper than Synology for equivalent specs, more powerful hardware at each price point.
**Cons:** Software is less polished, history of security vulnerabilities, more complex interface.

### Asustor

A budget alternative with decent hardware. ADM (Asustor Data Master) is straightforward and supports Docker.

**Pros:** Good value, often includes HDMI output for direct media playback.
**Cons:** Smaller community, fewer apps in the ecosystem.

## DIY NAS

Building your own NAS gives you full control over hardware and software. It's usually cheaper than prebuilt at equivalent specs, and you can run any NAS operating system.

### Recommended DIY Hardware

For a budget 4-bay NAS:

- **CPU:** Intel N100 (low power, good for NAS duties) or used Intel i3/i5
- **RAM:** 8-16GB DDR4 (16GB minimum if running ZFS)
- **Motherboard:** Mini-ITX with 4+ SATA ports, or use a SATA expansion card
- **Case:** Jonsbo N1/N2/N3, Fractal Design Node 304, or any case with multiple 3.5" drive bays
- **PSU:** 200-300W (NAS hardware draws very little power)
- **Boot drive:** 128GB+ NVMe SSD for the OS (separate from data drives)

### NAS Operating Systems

#### TrueNAS (Recommended for DIY)

TrueNAS is the go-to open-source NAS OS. Two versions:

- **TrueNAS SCALE** (Linux-based) — supports Docker containers natively, ZFS for storage. This is the better choice for self-hosting because Docker support is first-class.
- **TrueNAS CORE** (FreeBSD-based) — more mature ZFS implementation, but limited Docker support (jails instead).

Use SCALE unless you specifically need FreeBSD.

#### Unraid

Unraid is a paid NAS OS ($59-129 one-time) with a unique approach: drives don't need to be the same size, and you can add/remove drives without rebuilding the array. It has excellent Docker and VM support.

**Pros:** Flexible drive management, strong Docker integration, easy to use.
**Cons:** Not free, parity is slower than RAID, proprietary.

#### OpenMediaVault

OpenMediaVault (OMV) is a Debian-based NAS OS. Lightweight, free, and straightforward. Good for simple file sharing setups.

**Pros:** Free, runs on anything, Debian-based (familiar to Linux users).
**Cons:** Fewer features than TrueNAS, Docker support via plugin.

#### Just Linux

You can run Ubuntu Server or Debian and set up file sharing manually. Maximum flexibility, but you manage everything yourself — ZFS/mdadm, Samba, NFS, Docker, monitoring. Good if you already know Linux administration.

See [Choosing a Linux Distro](/foundations/choosing-linux-distro) for server OS recommendations.

## Storage Planning

### How Much Storage Do You Need?

| Use Case | Typical Storage | Notes |
|----------|----------------|-------|
| Documents, configs, backups | 500GB - 1TB | Small but critical |
| Photo library (Immich) | 500GB - 5TB | ~5MB per photo, video much larger |
| Music library (Navidrome) | 200GB - 2TB | ~10MB per FLAC track |
| Media library (Jellyfin) | 2TB - 50TB+ | ~5-15GB per movie, 1-3GB per TV episode |
| Surveillance cameras | 2TB - 10TB+ | Depends on retention and resolution |

### RAID Levels for NAS

RAID (Redundant Array of Independent Disks) protects your data from drive failures. The key levels for home NAS:

| RAID Level | Min Drives | Usable Capacity | Fault Tolerance | Best For |
|------------|-----------|-----------------|-----------------|----------|
| RAID 1 | 2 | 50% | 1 drive | 2-bay NAS, simple mirror |
| RAID 5 | 3 | (n-1) drives | 1 drive | 3-4 bay, good balance |
| RAID 6 | 4 | (n-2) drives | 2 drives | 5+ bay, maximum safety |
| RAID 10 | 4 | 50% | 1 per mirror | Performance-critical |

For a deeper explanation, see [RAID Configurations Explained](/foundations/raid-explained).

**The recommendation:** For a 2-bay NAS, use RAID 1 (mirror). For 4+ bays, use RAID 5 or RAID 6. If using ZFS, the equivalents are `mirror`, `raidz1`, and `raidz2`.

### Drive Recommendations

- **NAS-rated drives** (WD Red Plus, Seagate IronWolf) are designed for 24/7 NAS operation — vibration-resistant, higher MTBF rating
- **Desktop drives** (WD Blue, Seagate BarraCuda) work fine in low-bay NAS setups but may fail sooner under constant use
- **Don't use SMR drives** for NAS RAID arrays — they have terrible random write performance during rebuilds. Check the drive specs for "CMR" (conventional magnetic recording)
- **For the OS/boot drive:** Use a small NVMe SSD separate from the data drives

## File Sharing Protocols

### SMB/CIFS (Windows/Mac/Linux)

The most universal file sharing protocol. Works with Windows, macOS, Linux, and most mobile apps. Use SMB for general file access.

```bash
# Mount an SMB share on Linux
sudo mount -t cifs //nas-ip/share /mnt/nas -o username=youruser,password=yourpass
```

Or add to `/etc/fstab` for persistent mounting:

```
//192.168.1.20/media /mnt/media cifs credentials=/etc/samba/credentials,uid=1000,gid=1000,iocharset=utf8 0 0
```

### NFS (Linux-to-Linux)

NFS (Network File System) is the native Linux file sharing protocol. Lower overhead than SMB and better for Docker volume mounting between a NAS and a Linux server.

```bash
# Mount an NFS share
sudo mount -t nfs nas-ip:/volume1/media /mnt/media
```

NFS v4 is the current standard. Use it over v3 — it's faster and supports encryption.

### When to Use Which

- **Docker volumes from NAS:** NFS (lower overhead, better permission handling)
- **Desktop file access (Windows/Mac):** SMB
- **Linux-only environment:** NFS
- **Cross-platform sharing:** SMB

## Using a NAS with Docker on a Separate Server

A common self-hosting setup: mini PC runs Docker containers, NAS provides storage. Mount NAS shares on the Docker host and bind-mount them into containers.

### NFS Mount for Jellyfin

On the Docker host:

```bash
# Install NFS client
sudo apt install -y nfs-common

# Create mount point
sudo mkdir -p /mnt/media

# Mount the NAS share
sudo mount -t nfs 192.168.1.20:/volume1/media /mnt/media
```

Add to `/etc/fstab` for persistence:

```
192.168.1.20:/volume1/media /mnt/media nfs defaults,_netdev 0 0
```

Then in your `docker-compose.yml`:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    volumes:
      - /mnt/media:/media:ro  # NAS-backed storage
      - jellyfin-config:/config
```

### Important Considerations

- **`_netdev` mount option** tells Linux to wait for the network before mounting — prevents boot failures if the NAS is slow to start
- **Performance:** Gigabit Ethernet is sufficient for most self-hosting workloads. 2.5GbE is ideal for 4K media streaming from a NAS
- **Docker host should mount NFS, not containers directly** — this is simpler and more reliable

## Common Mistakes

### Not Having a Backup

RAID is not a backup. RAID protects against drive failure. It does not protect against accidental deletion, ransomware, filesystem corruption, or fire/theft. You still need an off-site backup.

Follow the [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule): 3 copies, 2 different media types, 1 off-site.

### Using Desktop Drives in a RAID Array

Desktop drives (WD Blue, Seagate BarraCuda) lack the vibration resistance and error recovery firmware of NAS drives. In a multi-drive enclosure, vibration from neighboring drives can cause read errors and RAID degradation. Use NAS-rated drives (WD Red Plus, Seagate IronWolf) for multi-bay setups.

### Overbuying Storage

Start with what you need now, plus room to grow. A 2-bay NAS with 2x 4TB drives in RAID 1 gives you 4TB usable — enough for most beginners. You can upgrade drives later (most NAS OS support online capacity expansion).

### Ignoring Power Protection

A sudden power loss during a RAID write can corrupt your array. Connect your NAS to a UPS (uninterruptible power supply) and configure the NAS to shut down gracefully when battery is low.

## Next Steps

- Set up Docker to run apps on your NAS or server — [Docker Compose Basics](/foundations/docker-compose-basics)
- Understand RAID configurations — [RAID Explained](/foundations/raid-explained)
- Plan your backup strategy — [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- Choose server hardware — [Getting Started with Self-Hosting](/foundations/getting-started)

## FAQ

### Can I run Docker on a Synology NAS?

Yes. Synology DSM includes Container Manager (formerly Docker), which lets you run Docker Compose stacks through a GUI or SSH. Most popular self-hosted apps run fine on Synology, though CPU-intensive tasks like video transcoding in Jellyfin may be slow on the lower-end Celeron models.

### How much RAM do I need for a NAS?

For basic file sharing: 2-4GB is fine. For ZFS: 8GB minimum, with 1GB per TB of storage as a rule of thumb. For running Docker containers: 8-16GB depending on workload.

### Is a NAS or mini PC better for self-hosting?

A mini PC gives you more CPU power per dollar and full Linux flexibility. A NAS gives you better drive management, hot-swap bays, and purpose-built storage software. The best setup is a mini PC for compute and a NAS for storage — but if you can only have one device, a 4-bay NAS with a decent CPU (Synology DS923+ or DIY with N100) handles both roles.

### How loud is a NAS?

Prebuilt NAS devices from Synology and QNAP are generally quiet (20-30 dB) when idle. Drive noise is the main factor — HDDs produce a gentle hum and occasional seek noise. SSDs are silent. Fan noise depends on the model and temperature. Most are suitable for a living room or home office.

## Related

- [Getting Started with Self-Hosting](/foundations/getting-started)
- [RAID Configurations Explained](/foundations/raid-explained)
- [3-2-1 Backup Rule](/foundations/backup-3-2-1-rule)
- [Docker Compose Basics](/foundations/docker-compose-basics)
- [Docker Volumes](/foundations/docker-volumes)
- [Home Network Setup](/foundations/home-network-setup)
- [Choosing a Linux Distro](/foundations/choosing-linux-distro)
