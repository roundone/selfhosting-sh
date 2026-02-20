---
title: "Best HBA Cards for NAS and Home Server"
description: "The best HBA cards for NAS builds and home servers. LSI SAS controllers, IT mode flashing, and which card to buy for TrueNAS and ZFS."
date: "2026-02-20"
dateUpdated: "2026-02-20"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "nas", "hba", "storage", "zfs"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Buy a used LSI SAS 9207-8i (IT mode) from eBay for $25-40.** It gives you 8 SAS/SATA ports via two SFF-8087 connectors, works with every NAS OS, and is the most battle-tested HBA in the homelab community. Flash it to IT mode firmware (or buy one pre-flashed) so it passes drives directly to the OS — exactly what TrueNAS, Unraid, and ZFS want.

If you need more than 8 ports, the LSI 9305-16i ($60-90 used) gives you 16 ports. If your board only has a PCIe x4 slot, the LSI 9207-4i4e or a Dell H310 Mini works.

## What Is an HBA?

A Host Bus Adapter (HBA) connects additional SATA or SAS drives to your server beyond what your motherboard provides. Most motherboards have 4-6 SATA ports. If you're building a NAS with 8-12 drives, you need an HBA.

**HBA vs RAID card:** A RAID card manages drives in hardware RAID arrays. An HBA in IT (Initiator Target) mode passes drives directly to the operating system with no hardware RAID. **For ZFS, TrueNAS, Unraid, and mdadm — you want IT mode.** These software RAID systems need direct drive access. A hardware RAID card actually gets in the way.

## What to Look For

### IT Mode Firmware

The #1 requirement. IT mode (sometimes called "JBOD passthrough") presents each drive individually to the OS. IR mode (Integrated RAID) presents drives as RAID arrays managed by the card. You want IT mode for:

- TrueNAS (ZFS needs direct drive access)
- Unraid (manages drives itself)
- Proxmox with ZFS
- Any software RAID (mdadm, Btrfs RAID)
- SnapRAID + mergerfs

Most LSI cards can be cross-flashed between IT and IR mode. Buy pre-flashed to IT mode to save yourself the headache.

### Port Count

| Ports | Drives Supported | Connector | Typical Card |
|-------|-----------------|-----------|-------------|
| 4 | 4 SATA/SAS | 1x SFF-8087 | LSI 9207-4i4e |
| 8 | 8 SATA/SAS | 2x SFF-8087 | LSI 9207-8i |
| 16 | 16 SATA/SAS | 4x SFF-8087 | LSI 9305-16i |

Each SFF-8087 (mini-SAS) connector splits into 4 SATA ports via a breakout cable. You'll need SFF-8087 to SATA breakout cables (~$8-12 each).

### PCIe Interface

| PCIe Version | Slot Size | Bandwidth | Cards |
|-------------|-----------|-----------|-------|
| PCIe 2.0 x8 | x8 slot | 4 GB/s | LSI 9207-8i, Dell H310 |
| PCIe 3.0 x8 | x8 slot | 8 GB/s | LSI 9305-16i, 9300-8i |
| PCIe 3.0 x4 | x4 slot | 4 GB/s | LSI 9300-4i4e |

**Most ITX NAS boards have only one x16 slot.** An x8 card works fine in an x16 slot. If your board has only x4 or x1 slots, you need a card that fits — the Dell H310 Mini Mono is a popular choice for limited-slot boards.

### SAS vs SATA

SAS (Serial Attached SCSI) ports are backwards compatible with SATA drives. A SAS HBA can connect both SAS enterprise drives and regular SATA drives. SATA HBAs can only connect SATA drives. **Buy a SAS HBA** — it handles both, and the price is the same on the used market.

## Top Picks

### 1. LSI SAS 9207-8i — Best Overall

| Spec | Detail |
|------|--------|
| Ports | 8 (2x SFF-8087 internal) |
| Interface | PCIe 3.0 x8 |
| Chipset | LSI SAS 2308 |
| Max drives | 8 SATA/SAS (256 with expander) |
| Firmware | IT mode (P20 recommended) |
| Price (used) | $25-40 |

The community standard. Virtually every TrueNAS and Unraid build guide recommends this card. Buy one pre-flashed to IT mode with P20 firmware from eBay.

**You also need:** 2x SFF-8087 to 4x SATA breakout cables (~$8 each). Total: $40-55.

**Pros:** Cheap, universally supported, rock-solid, huge community.

**Cons:** PCIe 3.0 x8 — needs a board with an x8 or x16 slot. Runs warm under load (add a small heatsink fan if your case has poor airflow).

### 2. Dell PERC H310 (IT Mode) — Best Budget

| Spec | Detail |
|------|--------|
| Ports | 8 (2x SFF-8087 internal) |
| Interface | PCIe 2.0 x8 |
| Chipset | LSI SAS 2008 |
| Firmware | Cross-flash to LSI 9211-8i IT mode |
| Price (used) | $15-25 |

The Dell H310 uses the same LSI SAS 2008 chipset as the venerable 9211-8i. Cross-flash it to LSI 9211-8i IT mode firmware and it's functionally identical. Available in full-height, low-profile, and Mini Mono form factors.

**The Mini Mono variant** is popular for ITX NAS builds — it fits in tight spaces and can work in x4 PCIe slots with a riser.

**Pros:** Cheapest option, multiple form factors, well-documented flash procedure.

**Cons:** Older PCIe 2.0 (still fast enough for spinning drives), requires cross-flashing (30-minute process with guides available).

### 3. LSI SAS 9305-16i — Best High Port Count

| Spec | Detail |
|------|--------|
| Ports | 16 (4x SFF-8643 internal) |
| Interface | PCIe 3.0 x8 |
| Chipset | LSI SAS 3008 |
| Max drives | 16 SATA/SAS |
| Price (used) | $60-90 |

For builds with 12+ drives. Uses SFF-8643 (mini-SAS HD) connectors instead of SFF-8087 — you need SFF-8643 to SATA breakout cables.

**Pros:** 16 ports from one card, PCIe 3.0 bandwidth.

**Cons:** Higher power draw (~12W), SFF-8643 cables are slightly more expensive, overkill for most home builds.

### 4. LSI SAS 9300-8i — Best for Future-Proofing

| Spec | Detail |
|------|--------|
| Ports | 8 (2x SFF-8643 internal) |
| Interface | PCIe 3.0 x8 |
| Chipset | LSI SAS 3008 |
| Firmware | IT mode native |
| Price (used) | $35-50 |

The PCIe 3.0 successor to the 9207-8i. Native IT mode firmware (no cross-flashing needed). Uses newer SFF-8643 connectors. A good choice if you want a drop-in card with no firmware work.

**Pros:** PCIe 3.0, native IT mode, newer chipset.

**Cons:** Slightly more expensive than the 9207-8i, SFF-8643 cables needed.

## Cables You'll Need

| Cable | Use | Price |
|-------|-----|-------|
| SFF-8087 to 4x SATA | For 9207-8i, H310 | ~$8-12 |
| SFF-8643 to 4x SATA | For 9300-8i, 9305-16i | ~$10-15 |
| SFF-8087 to SFF-8087 | Connecting to SAS expander | ~$10 |

**Buy quality cables.** Cheap breakout cables can cause drive dropouts and CRC errors. MonoPrice and Cable Matters make reliable options.

## How to Flash IT Mode Firmware

If you buy a card in IR (RAID) mode, you'll need to cross-flash it to IT mode. The process varies by card, but the general steps are:

1. Boot from a UEFI shell USB drive
2. Clear the existing firmware with `sas2flash -o -e 7`
3. Flash the IT mode firmware: `sas2flash -o -f 2118it.bin -b mptsas2.rom`
4. Reboot and verify in the HBA BIOS

**Detailed guides exist for every card.** Search "[your card model] IT mode flash guide" — the r/homelab and TrueNAS forums have step-by-step instructions for every variant.

**Or buy pre-flashed.** Many eBay sellers sell cards pre-flashed to IT mode for $5-10 more. Worth it if you don't want to deal with firmware flashing.

## Power and Thermals

| Card | Idle | Load | Heatsink |
|------|------|------|----------|
| LSI 9207-8i | 4W | 8W | Passive |
| Dell H310 | 3W | 7W | Passive |
| LSI 9305-16i | 6W | 12W | Passive |

These cards run warm. In a well-ventilated NAS case like the [Jonsbo N3](/hardware/server-case-guide), passive cooling is fine. In a compact or poorly-ventilated enclosure, stick a 40mm fan on the heatsink with zip ties.

## FAQ

### Do I need an HBA if my motherboard has 6 SATA ports?

Only if you need more than 6 drives. If your NAS build has 4 drives, your motherboard's SATA ports are sufficient. HBAs are for expanding beyond what your board provides.

### Can I use an HBA with SSDs?

Yes, but you won't get full SSD speed. SATA SSDs work fine. NVMe SSDs require a different type of expansion card (NVMe adapter, not an HBA). For SSD caching on TrueNAS, use an M.2 NVMe slot on your motherboard instead.

### LSI 9207-8i vs 9211-8i?

Same SAS 2008 chipset. The 9207-8i has a newer firmware version with slightly better performance. Both work identically for home NAS use. Buy whichever is cheaper.

### Why not use a hardware RAID card?

Software RAID (ZFS, Unraid, mdadm) is better for home servers because:
- You can move drives to a different machine and the array still works
- ZFS checksums catch silent data corruption — hardware RAID doesn't
- No single point of failure (the RAID card itself)
- No vendor lock-in to a specific RAID card firmware

## Related

- [DIY NAS Build Guide](/hardware/diy-nas-build)
- [Best NAS for Home Servers](/hardware/best-nas)
- [RAID Levels Explained](/hardware/raid-explained)
- [Best Hard Drives for NAS](/hardware/best-hard-drives-nas)
- [TrueNAS Hardware Guide](/hardware/truenas-hardware-guide)
- [ZFS Hardware Requirements](/hardware/zfs-hardware-requirements)
- [Server Case Guide](/hardware/server-case-guide)
- [PCIe Expansion for Home Servers](/hardware/pcie-expansion-home-server)
