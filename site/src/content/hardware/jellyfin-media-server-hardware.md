---
title: "Best Hardware for Jellyfin Media Server"
description: "Best hardware for running Jellyfin media server. CPU requirements for transcoding, RAM needs, storage options, and recommended builds at every budget."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: ["jellyfin"]
tags: ["hardware", "jellyfin", "media-server", "transcoding", "home-server"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**For most households, an Intel N100 or N305 mini PC is the best Jellyfin hardware.** Intel QuickSync handles hardware transcoding efficiently, power consumption stays under 15W, and the total cost is $150-350. If you only direct-play media (no transcoding), even a [Raspberry Pi 5](/hardware/raspberry-pi-home-server/) works.

## What Jellyfin Needs from Your Hardware

Jellyfin's hardware requirements depend entirely on **how your clients play media**:

- **Direct play** (client supports the video codec natively): Near-zero CPU usage. Almost any hardware works.
- **Transcoding** (converting video format in real-time): Significant CPU/GPU usage. Hardware transcoding support is critical.

Most users need transcoding at least sometimes — when streaming to a phone on cellular, using a web browser that doesn't support HEVC, or reducing quality for a slow connection.

### Transcoding: CPU vs GPU

**Software transcoding** (CPU only) is slow, power-hungry, and limits you to 1-2 streams on consumer hardware. Avoid this.

**Hardware transcoding** (GPU-accelerated) is what you want. Three options:

| Technology | GPUs | Performance | Jellyfin Support |
|-----------|------|-------------|-----------------|
| Intel QuickSync | Intel iGPUs (6th gen+) | Excellent efficiency | Full (recommended) |
| NVIDIA NVENC | GeForce/Quadro GPUs | Highest throughput | Full |
| AMD AMF/VCN | Radeon iGPUs/dGPUs | Good (improving) | Partial (Linux drivers maturing) |

**Intel QuickSync is the default recommendation** for Jellyfin. It's built into every Intel CPU with integrated graphics, uses minimal power, and Jellyfin's support is mature. NVIDIA NVENC is better for high-stream-count scenarios but costs more and draws more power.

## Hardware Tiers

### Tier 1: Direct Play Only — Under $100

If every client in your house can direct-play your media (modern smart TVs, Apple TV 4K, NVIDIA Shield), you barely need any compute power.

**Recommended:** [Raspberry Pi 5](/hardware/raspberry-pi-home-server/) (8GB, ~$80) or any leftover PC.

| Spec | Minimum |
|------|---------|
| CPU | Any (quad-core ARM or x86) |
| RAM | 2GB+ |
| Storage | External USB HDD for media |
| Network | Gigabit Ethernet (1GbE) |
| Transcoding streams | 0 (direct play only) |

### Tier 2: Light Transcoding (1-2 streams) — $150-250

For a household where 1-2 people might transcode simultaneously.

**Recommended:** [Intel N100 mini PC](/hardware/intel-n100-mini-pc/) (~$150-200)

| Spec | Recommended |
|------|------------|
| CPU | Intel N100 (4C/4T, QuickSync) |
| RAM | 8-16GB |
| Storage | 256GB NVMe (OS) + external/NAS for media |
| Network | 2.5GbE preferred |
| Transcoding streams | 1-2 simultaneous 4K, 3-4 simultaneous 1080p |

The N100's 24 GPU execution units handle QuickSync transcoding efficiently. At 6W TDP, it costs under $10/year in electricity.

### Tier 3: Multi-Stream Transcoding (3-5 streams) — $250-400

For larger households or remote access with multiple concurrent viewers.

**Recommended:** [Intel N305 mini PC](/hardware/intel-n305-mini-pc/) (~$300-400)

| Spec | Recommended |
|------|------------|
| CPU | Intel N305 (8C/8T, 32 EU QuickSync) |
| RAM | 16-32GB |
| Storage | 512GB NVMe (OS) + NAS for media |
| Network | 2.5GbE (dual preferred) |
| Transcoding streams | 2-3 simultaneous 4K, 4-6 simultaneous 1080p |

The N305's 32 execution units and 8 cores give meaningful headroom over the N100 for concurrent transcoding.

### Tier 4: Heavy Transcoding (5+ streams) — $400-800

For sharing your library with extended family/friends or running a large multi-user setup.

**Recommended:** Intel 12th/13th Gen i5 system or add a dedicated GPU

| Spec | Recommended |
|------|------------|
| CPU | Intel i5-12400 / i5-13500 (QuickSync) |
| GPU | Or NVIDIA Quadro P2000 / T400 (~$100 used) |
| RAM | 16-32GB |
| Storage | NVMe OS + NAS for media |
| Network | 2.5GbE or 10GbE |
| Transcoding streams | 8-15+ simultaneous with NVENC |

If you need 10+ streams, an NVIDIA GPU (even a used Quadro P2000 for ~$60-80) outperforms any iGPU. The P2000 handles 15-20 simultaneous 1080p transcodes. Consumer GeForce cards work too but are limited to 3 NVENC sessions unless you apply the [driver patch](https://github.com/keylase/nvidia-patch).

## Transcoding Performance by Hardware

| Hardware | 4K HDR → 1080p | 1080p → 720p | Max Concurrent | Power Draw |
|----------|---------------|-------------|----------------|-----------|
| Raspberry Pi 5 | Not possible | Software only (1 max) | 1 | 5-8W |
| Intel N100 | 1-2 streams | 3-4 streams | ~4 total | 6-15W |
| Intel N305 | 2-3 streams | 4-6 streams | ~6 total | 10-25W |
| Intel i5-12400 | 4-6 streams | 8-10 streams | ~12 total | 30-65W |
| NVIDIA Quadro P2000 | 3-5 streams | 15-20 streams | ~20 total | 75W GPU |
| NVIDIA T400 | 2-4 streams | 8-12 streams | ~15 total | 30W GPU |

## HDR Tone Mapping

4K HDR content needs **tone mapping** to look correct when transcoded to SDR (for clients that don't support HDR). Without it, colors look washed out.

Jellyfin supports hardware tone mapping on:
- **Intel QuickSync** (10th gen+): Full support via VPP. This is the easiest path.
- **NVIDIA NVENC**: Supported via OpenCL/CUDA filters.
- **AMD**: Limited support, improving with recent drivers.

For the best HDR tone mapping experience, use Intel 10th gen or newer. The N100 and N305 both support this.

## Storage Recommendations

### OS Drive
256-512GB NVMe SSD. Jellyfin's metadata and database live here. An SSD makes library scans and UI navigation snappy.

### Media Storage

| Library Size | Recommended Storage |
|-------------|-------------------|
| Under 2TB | USB 3.0 external HDD |
| 2-8TB | Internal SATA HDD (if your case has a bay) |
| 8-20TB | [DAS enclosure](/hardware/das-vs-nas/) or 2-bay NAS |
| 20TB+ | [4+ bay NAS](/hardware/best-nas/) or [DIY NAS](/hardware/diy-nas-build/) |

Use [NAS-rated drives](/hardware/best-hard-drives-nas/) (WD Red Plus, Seagate IronWolf) for 24/7 operation. Desktop drives work but have shorter lifespans under continuous use.

### Network Storage (NAS)
Jellyfin can read media from NFS or SMB network shares. This is the cleanest setup: keep your Jellyfin compute node separate from your storage. Mount the NAS share and point Jellyfin at it.

```yaml
# Docker Compose with NFS media volume
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    volumes:
      - jellyfin-config:/config
      - type: volume
        source: media
        target: /media
        volume:
          nocopy: true
    devices:
      - /dev/dri:/dev/dri  # Intel QuickSync
    restart: unless-stopped

volumes:
  jellyfin-config:
  media:
    driver: local
    driver_opts:
      type: nfs
      o: addr=192.168.1.100,nfsvers=4,rw
      device: ":/volume1/media"
```

## RAM Requirements

Jellyfin itself uses 200-500MB of RAM. The rest depends on your library and concurrent users:

| Scenario | RAM Needed |
|----------|-----------|
| Small library (<1,000 items), 1-2 users | 4GB total system |
| Medium library (1,000-10,000 items), 2-4 users | 8GB total system |
| Large library (10,000+ items), 5+ users | 16GB total system |
| Running alongside other containers | 16-32GB total system |

## Networking

Streaming 4K requires roughly 80-120 Mbps per stream (original bitrate). For multiple concurrent streams:

- **1GbE (125 MB/s):** Fine for 1-2 4K streams or 5-8 1080p streams
- **2.5GbE (312 MB/s):** Comfortable for 3-5 4K streams
- **10GbE:** Overkill for most home setups, useful for NAS-to-server connections with large libraries

If your media lives on a NAS, the NAS-to-Jellyfin link is the bottleneck. Use at least 2.5GbE between the NAS and the Jellyfin server.

## Recommended Builds

### Budget Build (~$200)

| Component | Choice | Price |
|-----------|--------|-------|
| Computer | [Intel N100 mini PC](/hardware/intel-n100-mini-pc/) (16GB/512GB) | ~$180 |
| Media storage | Existing USB HDD or NAS | $0+ |
| **Total** | | **~$180** |

Handles a household of 2-3 with occasional transcoding. Silent, tiny, draws 8-10W.

### Mid-Range Build (~$400)

| Component | Choice | Price |
|-----------|--------|-------|
| Computer | [Intel N305 mini PC](/hardware/intel-n305-mini-pc/) (16GB/500GB) | ~$350 |
| Media storage | 4TB WD Red Plus (internal SATA bay) | ~$90 |
| **Total** | | **~$440** |

Handles 3-5 concurrent streams, runs 10+ other containers alongside Jellyfin.

### Power User Build (~$600-800)

| Component | Choice | Price |
|-----------|--------|-------|
| Computer | [Used Dell OptiPlex](/hardware/used-dell-optiplex/) Micro (i5-12500T) | ~$200-300 |
| GPU | NVIDIA Quadro P2000 (used) or T400 | ~$60-120 |
| RAM | 32GB DDR4 | ~$60 |
| Media storage | [Synology DS923+](/hardware/best-nas/) or NFS share | ~$600+ |
| **Total** | | **~$600-1,000** |

Handles 10-15+ concurrent transcodes. Dedicated GPU removes any transcoding ceiling. Pair with a NAS for storage.

## Enabling Hardware Transcoding in Jellyfin

### Intel QuickSync (Docker)

Pass through the GPU device and ensure the container user has access:

```bash
# Check that your Intel GPU is detected
ls -la /dev/dri
# Should show renderD128

# Add the Jellyfin user to the render group
# In Docker, set JELLYFIN_PublishedServerUrl and device passthrough
```

```yaml
# docker-compose.yml snippet
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    devices:
      - /dev/dri:/dev/dri
    environment:
      - JELLYFIN_PublishedServerUrl=http://your-server-ip
    restart: unless-stopped
```

In Jellyfin's Dashboard → Playback → Transcoding, select **Intel QuickSync (QSV)** and enable hardware decoding for all supported codecs.

### NVIDIA (Docker)

Install the NVIDIA Container Toolkit, then:

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:10.10.6
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    restart: unless-stopped
```

Select **NVIDIA NVENC** in Jellyfin's transcoding settings.

## FAQ

### Do I need a GPU for Jellyfin?
Not if all your clients direct-play. If any client needs transcoding (web browsers, mobile on cellular, older devices), you need either an Intel CPU with QuickSync or a dedicated NVIDIA GPU.

### Is Intel or NVIDIA better for Jellyfin?
Intel QuickSync is better for most home users — it's built-in, power-efficient, and handles 2-5 streams easily. NVIDIA is better for high-stream scenarios (8+ concurrent transcodes) but costs more and uses more power.

### Can I run Jellyfin on a Raspberry Pi?
Yes, for direct play only. The Pi 5 can handle 1-2 direct-play 4K streams over a wired connection. It cannot do hardware transcoding — any transcode request will software-encode on the ARM CPU, which is painfully slow for anything above 720p.

### How much storage do I need?
A typical 4K movie is 20-60GB. A 1080p movie is 5-15GB. A 100-movie library at mixed quality needs roughly 1-3TB. Plan for growth — media libraries only get bigger.

### Should I store media locally or on a NAS?
A NAS is cleaner — it separates compute from storage, and you can share the same media with multiple services. If budget is tight, start with a local USB drive and migrate to a NAS later.

## Related

- [Best Mini PC for Home Server](/hardware/best-mini-pc/)
- [Intel N100 Mini PC](/hardware/intel-n100-mini-pc/)
- [Intel N305 Mini PC](/hardware/intel-n305-mini-pc/)
- [How to Self-Host Jellyfin](/apps/jellyfin/)
- [Plex Transcoding Hardware Guide](/hardware/plex-transcoding-hardware/)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas/)
- [Best NAS for Home Server](/hardware/best-nas/)
- [Used Dell OptiPlex Home Server](/hardware/used-dell-optiplex/)
- [DAS vs NAS](/hardware/das-vs-nas/)
