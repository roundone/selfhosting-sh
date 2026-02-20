---
title: "PoE Camera Systems for Self-Hosted NVR"
description: "Best PoE security cameras for self-hosted surveillance with Frigate, Blue Iris, and other NVR software. No cloud required."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "poe", "cameras", "security", "surveillance", "frigate"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

Get **Reolink RLC-810A** cameras ($55 each) with a **TP-Link TL-SG1008PE** 8-port PoE switch ($70). Run **Frigate NVR** on your home server with a **Google Coral TPU** ($25-60) for AI object detection. This setup replaces Ring, Nest, or Arlo subscriptions — no monthly fees, no cloud dependency, and you keep all your footage locally.

## Why Self-Host Your Cameras

Cloud camera subscriptions add up fast:

| Service | Monthly Cost | Annual Cost | 5-Year Cost |
|---------|-------------|-------------|-------------|
| Ring Protect Plus | $13/month | $156/year | $780 |
| Nest Aware Plus | $12/month | $144/year | $720 |
| Arlo Secure+ | $18/month | $216/year | $1,080 |
| **Self-hosted (after hardware)** | **$0/month** | **$0/year** | **$0** |

A self-hosted system pays for itself within 1-2 years and gives you:
- **No monthly fees** — ever
- **No cloud dependency** — footage stays on your network
- **No arbitrary clip limits** — record 24/7 at full resolution
- **AI object detection** — person/car/animal detection without sending video to anyone's servers
- **Home Assistant integration** — automations triggered by camera AI detections

## What You Need

| Component | Purpose | Budget Option | Recommended |
|-----------|---------|---------------|-------------|
| PoE cameras | Capture video | Reolink RLC-510A (~$40) | Reolink RLC-810A (~$55) |
| PoE switch | Power + network cameras | TP-Link TL-SG1005PE 5-port (~$50) | TP-Link TL-SG1008PE 8-port (~$70) |
| NVR software | Record + detect | Frigate (free) | Frigate (free) |
| AI accelerator | Object detection | CPU-only (slow) | Google Coral USB TPU (~$35) |
| Storage | Store recordings | Any HDD, 1TB+ | WD Purple 4TB+ (~$90) |
| Server | Run everything | Existing mini PC | Any x86 with 8GB+ RAM |

**Total cost for 4 cameras:** ~$350-450 (one-time). Compare that to $600+/year for cloud subscriptions.

## Best PoE Cameras for Self-Hosting

The key requirement: **RTSP support**. Your camera must output an RTSP stream that Frigate or other NVR software can ingest. Most consumer cloud cameras (Ring, Nest, Wyze) don't support RTSP. Buy cameras designed for NVR use.

### Reolink RLC-810A — Best Overall

| Spec | Value |
|------|-------|
| Resolution | 4K (3840x2160) |
| Sensor | 1/2.7" CMOS |
| Night vision | IR, 30m range |
| AI | Person/vehicle detection (on-camera) |
| Audio | Built-in microphone + speaker |
| RTSP | Yes (main + sub stream) |
| ONVIF | Yes |
| PoE | 802.3af, ~12W max |
| Weather rating | IP66 |
| Price | ~$55 |

**Why it's the best:** 4K resolution, reliable RTSP streaming, built-in AI detection (useful as a pre-filter), excellent night vision, and solid build quality. Reolink cameras "just work" with Frigate. The on-camera AI isn't as good as Coral-based detection, but it reduces false positives when used alongside Frigate.

**RTSP URLs:**
```
Main stream: rtsp://[user]:[pass]@[ip]:554/h264Preview_01_main
Sub stream:  rtsp://[user]:[pass]@[ip]:554/h264Preview_01_sub
```

### Reolink RLC-510A — Best Budget

| Spec | Value |
|------|-------|
| Resolution | 5MP (2560x1920) |
| Night vision | IR, 30m range |
| AI | Person/vehicle detection (on-camera) |
| RTSP | Yes |
| PoE | 802.3af, ~10W max |
| Price | ~$40 |

5MP instead of 4K, but still excellent for the price. Same reliable RTSP support and Frigate compatibility.

### Amcrest IP8M-2496E — Best for Detail

| Spec | Value |
|------|-------|
| Resolution | 4K (3840x2160) |
| Sensor | 1/2.8" CMOS |
| Night vision | IR, 30m range |
| AI | None on-camera |
| RTSP | Yes |
| ONVIF | Yes |
| PoE | 802.3af |
| Price | ~$70 |

Better image quality than Reolink in some conditions, especially in mixed lighting. No on-camera AI, so you'll rely entirely on Coral/CPU detection.

### Reolink RLC-842A — Best Zoom

| Spec | Value |
|------|-------|
| Resolution | 4K (3840x2160) |
| Optical zoom | 5x (2.7-13.5mm) |
| Night vision | IR, 30m |
| AI | Person/vehicle |
| RTSP | Yes |
| PoE | 802.3af |
| Price | ~$95 |

Motorized optical zoom for covering larger areas like driveways or backyards where you need to identify distant objects.

### Dahua / Empiretech IPC-T5442TM-AS — Best Image Quality

| Spec | Value |
|------|-------|
| Resolution | 4MP |
| Sensor | 1/1.8" Starvis II |
| Night vision | Full-color night (warm LED) |
| AI | Smart detection suite |
| RTSP | Yes |
| PoE | 802.3af |
| Price | ~$90-120 |

The 1/1.8" Starvis II sensor produces stunning night footage — full color in low light without IR. Dahua cameras are the gold standard for image quality, but their firmware UI is less user-friendly than Reolink's.

## Camera Comparison

| Camera | Resolution | Night Vision | AI | RTSP | Price |
|--------|-----------|-------------|-----|------|-------|
| Reolink RLC-810A | 4K | IR 30m | Person/vehicle | Yes | ~$55 |
| Reolink RLC-510A | 5MP | IR 30m | Person/vehicle | Yes | ~$40 |
| Amcrest IP8M-2496E | 4K | IR 30m | None | Yes | ~$70 |
| Reolink RLC-842A | 4K | IR 30m | Person/vehicle | Yes | ~$95 |
| Dahua IPC-T5442TM-AS | 4MP | Color 30m | Smart suite | Yes | ~$100 |

## PoE Switches for Cameras

Your PoE switch powers and connects the cameras. Key specs: total PoE budget (watts), port count, and whether it's managed or unmanaged.

### TP-Link TL-SG1008PE — Best for Most Setups

| Spec | Value |
|------|-------|
| Ports | 8x Gigabit (all PoE+) |
| PoE standard | 802.3af/at (PoE+) |
| Total PoE budget | 124W |
| Per-port max | 30W |
| Management | Unmanaged |
| Price | ~$70 |

124W PoE budget handles 8 cameras easily (most cameras draw 10-15W). Unmanaged means zero configuration — plug in and go. Fanless and silent.

### TP-Link TL-SG1005PE — Budget 5-Port

| Spec | Value |
|------|-------|
| Ports | 5x Gigabit (4 PoE+) |
| Total PoE budget | 65W |
| Management | Unmanaged |
| Price | ~$50 |

Enough for 4 cameras. Good starter option.

### Netgear GS308EPP — Best Managed Option

| Spec | Value |
|------|-------|
| Ports | 8x Gigabit (all PoE+) |
| Total PoE budget | 123W |
| Management | Smart managed (VLAN, QoS) |
| Price | ~$80 |

If you want to put cameras on a separate VLAN (recommended for security), this is the cheapest managed PoE switch worth buying. Web UI for VLAN configuration.

## AI Accelerators for Object Detection

Running AI object detection (person, car, animal, package) on camera feeds is CPU-intensive. A dedicated AI accelerator offloads this work.

### Google Coral USB Accelerator — Best Value

| Spec | Value |
|------|-------|
| Chip | Edge TPU |
| Interface | USB 3.0 |
| Performance | ~100 inferences/second |
| Power | ~2.5W |
| Cameras supported | 10+ simultaneous |
| Price | ~$35-60 (varies with availability) |

The Coral TPU processes object detection models ~10x faster than CPU, using almost no power. One Coral handles 10+ camera streams. It's the standard accelerator for Frigate.

**Note:** Coral availability fluctuates. If the USB version is out of stock, the **Coral M.2 A+E key** ($25) or **Coral M.2 B+M key** ($25) versions work in compatible M.2 slots. Some mini PCs (like the Minisforum UM790) have accessible M.2 slots.

### CPU-Only Option

You can run Frigate without a Coral, using CPU for object detection. Expect:
- 1-2 cameras: works on any modern x86 CPU
- 3-4 cameras: needs a capable CPU (Intel i5/N100+)
- 5+ cameras: CPU-only becomes impractical, get a Coral

Intel CPUs with QuickSync (most desktop/laptop Intel chips) can use OpenVINO for hardware-accelerated detection, which is 2-5x faster than pure CPU but still slower than Coral.

## Storage for Camera Recordings

### How Much Storage You Need

| Cameras | Resolution | Retention | Detect-Only | 24/7 Recording |
|---------|-----------|-----------|-------------|----------------|
| 2 | 1080p | 30 days | ~50 GB | ~500 GB |
| 4 | 4K | 30 days | ~200 GB | ~4 TB |
| 8 | 4K | 30 days | ~400 GB | ~8 TB |
| 4 | 4K | 90 days | ~600 GB | ~12 TB |

**Detect-only** means Frigate records only when objects are detected (person, car). This cuts storage by 80-90% compared to 24/7 recording.

**Recommendation:** Start with detect-only recording. 4 cameras × 30 days of detect-only fits on a 500GB drive easily.

### Recommended Drives

- **WD Purple (CMR)** — designed for surveillance, optimized for sequential writes. 4TB (~$90), 8TB (~$150)
- **Seagate SkyHawk** — similar surveillance-optimized drive. 4TB (~$85), 8TB (~$140)
- **Any HDD works** — surveillance-rated drives are optimized for constant writes but regular drives work fine for detect-only recording

**Do NOT use SSDs** for 24/7 camera recording. The constant writes will burn through SSD endurance quickly. HDDs are the right choice here — cost per GB is much lower and sequential write performance is irrelevant for camera recording bandwidth.

## NVR Software

### Frigate — Recommended

Frigate is the gold standard for self-hosted NVR:
- Real-time AI object detection (person, car, animal, package)
- Google Coral TPU support
- Home Assistant integration (native)
- RTSP re-streaming
- Timeline and event review
- Zones, masks, and object filters
- Free and open source

[How to Self-Host Frigate](/apps/frigate) (if available)

### Other Options

- **Blue Iris** — Windows-only, $70 one-time license. Mature and feature-rich. Not open source.
- **Shinobi** — Open source, web-based. More complex setup than Frigate.
- **ZoneMinder** — The original open-source NVR. Dated UI but extremely capable.
- **AgentDVR** — Cross-platform, free for personal use.

Frigate is the clear winner for self-hosters running Home Assistant. Blue Iris is the best option if you're on Windows.

## Server Requirements

| Cameras | CPU | RAM | Coral TPU |
|---------|-----|-----|-----------|
| 1-2 | Any dual-core | 4 GB | Optional |
| 3-4 | Intel N100 or better | 8 GB | Recommended |
| 5-8 | Intel i5 or better | 16 GB | Required |
| 9-16 | Intel i5/Ryzen 5+ | 32 GB | Required |

**Frigate uses FFmpeg** for video decoding. Intel CPUs with QuickSync (built-in GPU) offload video decoding from the CPU — this is a significant advantage for camera workloads. An Intel N100 mini PC with QuickSync handles 4-6 cameras comfortably.

**Power consumption estimate for a 4-camera system:**
- Mini PC (Intel N100): ~15W
- PoE switch: ~10W + cameras
- 4x cameras: ~40-50W total (via PoE)
- **Total: ~65-75W → ~$70/year at $0.12/kWh**

## Network Design

### Recommended: Separate Camera VLAN

Put cameras on their own VLAN with no internet access:

```
[Internet] → [Router] → [Main Switch] → [Servers, PCs, etc.]
                                       → [PoE Switch (VLAN 20)] → [Cameras]
```

Rules:
- Cameras can talk to the NVR server (for RTSP streams)
- Cameras cannot access the internet (blocks firmware "phone home")
- Cameras cannot access other devices on the network
- Only the NVR server can initiate connections to cameras

This requires a managed switch or VLAN-capable router (pfSense, OPNsense, or a managed switch with VLAN support).

### Simple Setup (No VLAN)

If you're not comfortable with VLANs, just plug the PoE switch into your main network. Cameras will be on the same network as everything else. Block their internet access at the router/firewall level if possible.

## Bandwidth Considerations

| Stream | Bitrate | 4 Cameras | 8 Cameras |
|--------|---------|-----------|-----------|
| 4K main | 8 Mbps | 32 Mbps | 64 Mbps |
| 1080p sub | 1 Mbps | 4 Mbps | 8 Mbps |
| Total | | 36 Mbps | 72 Mbps |

Gigabit Ethernet handles 16+ cameras at 4K without breaking a sweat. Camera traffic stays local — it doesn't use your internet bandwidth.

## Wiring Tips

1. **Use outdoor-rated Cat6** for exterior camera runs (UV-resistant jacket)
2. **Maximum run: 100 meters** (328 feet) — PoE and Ethernet standard limit
3. **Use weatherproof RJ45 connectors** or seal regular connectors with self-fusing silicone tape
4. **Leave a drip loop** — cable should dip before entering the camera so water runs away from the connector
5. **Plan cable routes before buying** — measure actual distances, add 20% for routing around obstacles
6. **Label both ends** of every cable run

## FAQ

### Can I use WiFi cameras instead of PoE?
You can, but don't. WiFi cameras are less reliable (signal drops, interference), still need power cables (or batteries that die), and congest your WiFi network. PoE provides power and data over a single Ethernet cable. One cable per camera, maximum reliability.

### How do I access cameras remotely?
Run Frigate behind a reverse proxy with authentication, or use Tailscale/WireGuard VPN to access your home network remotely. Never expose camera feeds directly to the internet.

### Do I need a Coral TPU?
For 1-2 cameras with CPU detection, no. For 3+ cameras or if you want real-time detection without CPU overhead, yes. The Coral is the single best upgrade for Frigate.

### What about microSD recording in the camera?
Some cameras can record to microSD as a backup. It's fine as a fallback, but don't rely on it — the card will fail eventually, and you lose centralized review and AI detection.

## Related

- [Best Mini PCs for Home Servers](/hardware/best-mini-pc)
- [PoE Explained for Home Servers](/hardware/poe-explained)
- [Best Managed Switches for Homelab](/hardware/managed-switch-home-lab)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas)
- [Homelab Network Topology Guide](/hardware/homelab-network-topology)
- [Best Self-Hosted Home Automation](/best/home-automation)
