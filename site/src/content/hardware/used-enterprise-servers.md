---
title: "Used Enterprise Servers for Self-Hosting"
description: "Guide to buying used enterprise servers for self-hosting. Dell PowerEdge, HP ProLiant, and Supermicro compared with pricing and what to avoid."
date: "2026-02-16"
dateUpdated: "2026-02-16"
category: "hardware"
apps: []
tags: ["hardware", "home-server", "enterprise", "used", "homelab"]
author: "selfhosting.sh"
draft: false
image: ""
imageAlt: ""
affiliateDisclosure: true
---

## Quick Recommendation

**Best value: Dell PowerEdge R730xd** (~$150-250 used, dual Xeon E5 v3/v4, up to 768GB RAM, 12x 3.5" bays). It's the homelab workhorse — massive storage capacity, cheap to buy, and well-supported. The trade-off is noise (40-50 dBA) and power draw (150-300W idle).

**If noise and power matter more than raw capacity:** Skip enterprise rack servers entirely. A [used Dell OptiPlex](/hardware/used-dell-optiplex/) or [mini PC](/hardware/best-mini-pc/) at 15-30W idle is a better fit for most homes.

**Enterprise servers make sense when:** You need 100TB+ storage, 128GB+ RAM, multiple CPUs, or you're running a serious [Proxmox](/hardware/proxmox-hardware-guide/) virtualization cluster. They do NOT make sense when a $150 mini PC handles your workload at 1/10th the power draw.

## The Used Enterprise Market

Data centers refresh hardware every 3-5 years. Perfectly functional servers hit the used market at 80-95% off original price. A server that cost $8,000 new in 2018 sells for $150-300 in 2026.

### Where to Buy

| Source | Pros | Cons | Typical Prices |
|--------|------|------|---------------|
| eBay | Largest selection, buyer protection | Variable seller quality | $100-400 |
| LabGopher.com | Aggregates eBay listings, filters by spec | eBay-sourced (same inventory) | $100-400 |
| r/homelabsales | Good deals from knowledgeable sellers | Small inventory, competitive | $80-300 |
| Local IT surplus | Inspect before buying, no shipping | Limited selection | $50-200 |
| SaveMyServer | Tested, warranty available | Higher prices | $200-600 |
| ServerMonkey | Tested, warranty available | Higher prices | $200-600 |

**LabGopher.com** is the best starting point — it indexes eBay listings and lets you filter by CPU, RAM, drive bays, and form factor.

### What Generation to Buy

| Generation | CPU | Year | Status | Recommendation |
|-----------|-----|------|--------|---------------|
| Dell R620/R720 (Gen 12) | Xeon E5 v1/v2 | 2012-2014 | Avoid | Too old, no AES-NI on v1, power hungry |
| Dell R630/R730 (Gen 13) | Xeon E5 v3/v4 | 2015-2017 | **Best value** | Sweet spot of price vs performance |
| Dell R640/R740 (Gen 14) | Xeon Scalable 1st/2nd | 2018-2020 | Good but pricier | Better efficiency, higher cost |
| Dell R650/R750 (Gen 15) | Xeon Scalable 3rd | 2021+ | Too expensive used | Wait 1-2 years for prices to drop |

**The E5 v3/v4 generation (R730 era) is the sweet spot in 2026.** Prices have bottomed out, parts are plentiful, and the CPUs are still capable. DDR4 ECC RDIMMs are dirt cheap used ($15-25 for 16GB sticks).

## Top Picks

### Dell PowerEdge R730xd — Best Storage Server

| Spec | Value |
|------|-------|
| CPU | Dual Xeon E5-2600 v3/v4 (up to 2x 22 cores) |
| RAM | Up to 768 GB DDR4 ECC RDIMM (24 slots) |
| Drive bays | 12x 3.5" + 2x 2.5" rear |
| Networking | 4x 1GbE (iDRAC dedicated) |
| RAID | PERC H730P (2GB cache) |
| Power | Dual 750W/1100W redundant PSUs |
| Noise | 40-50 dBA under load |
| Used price | $150-300 (barebones), $300-500 (configured) |

**Why this server:** 12 LFF (3.5") bays hold 12x 20TB drives = 240TB raw storage. That's enough for a lifetime of media, backups, and every self-hosted app's data. The dual CPUs handle [Proxmox](/hardware/proxmox-hardware-guide/) virtualization, [Plex](/apps/plex/) transcoding, and dozens of Docker containers simultaneously.

**Typical config for homelab:**
- 2x E5-2680 v4 (14 cores each, 28 total) — ~$30 for the pair
- 128 GB RAM (8x 16GB DDR4 RDIMM) — ~$120
- PERC H730P RAID controller — included
- Total: ~$300-400 complete

### HP ProLiant DL380 Gen9 — Best All-Rounder

| Spec | Value |
|------|-------|
| CPU | Dual Xeon E5-2600 v3/v4 |
| RAM | Up to 768 GB DDR4 ECC |
| Drive bays | 8x 2.5" SFF (or 12x 3.5" LFF model) |
| Networking | 4x 1GbE + dedicated iLO |
| RAID | Smart Array P440ar |
| Power | Dual 500W/800W redundant |
| Noise | 35-45 dBA |
| Used price | $150-250 |

HP's equivalent to the R730. The SFF (Small Form Factor) model with 8x 2.5" bays is popular for SSD-only builds — quieter and more power-efficient than the LFF version.

### Supermicro X10DRi — Best for DIY Builds

| Spec | Value |
|------|-------|
| CPU | Dual Xeon E5-2600 v3/v4 |
| RAM | Up to 1 TB DDR4 ECC (16 slots per CPU) |
| Form factor | E-ATX motherboard |
| Networking | 2x 1GbE onboard |
| IPMI | Built-in BMC |
| Used price | $80-150 (board only) |

Buy the board and build it into whatever case you want. Supermicro boards are the foundation of most custom NAS and storage server builds. Put it in a [quiet case](/hardware/server-case-guide/) with [Noctua fans](/hardware/home-server-noise-reduction/) and you get enterprise features without enterprise noise.

### Dell PowerEdge T620 — Best Tower

| Spec | Value |
|------|-------|
| CPU | Dual Xeon E5-2600 v1/v2 |
| RAM | Up to 768 GB DDR3 ECC |
| Drive bays | Up to 12x 3.5" or 32x 2.5" |
| Noise | 30-40 dBA (quieter than rack servers) |
| Used price | $100-200 |

Tower form factor = larger fans = quieter. The T620 is the quietest option if you don't have a rack. DDR3 platform is older but DDR3 RDIMMs are even cheaper ($8-12 for 16GB).

## What to Check Before Buying

### Critical Checks

1. **iDRAC/iLO/IPMI version** — Remote management is essential for headless servers. Ensure it works and has a license (Dell iDRAC Enterprise, HP iLO Advanced). License keys are often $10-15 on eBay.

2. **RAID controller mode** — For TrueNAS/ZFS, you need the RAID card in **IT mode** (HBA passthrough), not RAID mode. Dell PERC H310/H710 can be flashed to IT mode. The PERC H730 CANNOT be flashed to IT mode — buy a separate LSI 9211-8i HBA (~$20 used) for TrueNAS.

3. **Drive caddies** — Servers ship without caddies. Budget $5-8 per caddy. Verify the caddy generation matches your server (Gen 13, Gen 14, etc.).

4. **Power supplies** — Test both PSUs. Redundant PSUs mean the server runs on one if the other fails. Replace any PSU with a burnt smell or bulging capacitors.

5. **RAM errors** — Run MemTest86 for at least one pass. Enterprise servers with [ECC RAM](/hardware/ecc-vs-non-ecc-ram/) will log correctable errors in the BIOS/iDRAC — a few is normal, hundreds indicate a failing DIMM.

### Nice to Have

- **10GbE NIC** — Some servers come with onboard 10GbE or a PCIe 10GbE card. Check before buying separately.
- **NVMe support** — R740/DL380 Gen10 have NVMe bay support. Older servers need a PCIe NVMe adapter.
- **GPU slot** — Full-height PCIe x16 for [GPU passthrough](#gpu-use-cases) (Plex transcoding, AI workloads).

## Power Consumption and Costs

This is where enterprise servers hurt. Electricity is an ongoing cost that often exceeds the purchase price within a year.

| Server | Idle Power | Loaded | Annual Cost (@$0.12/kWh) |
|--------|-----------|--------|--------------------------|
| Dell R730xd (2x E5-2680 v4, 128GB, 12 HDDs) | 180W | 350W | $190-370 |
| Dell R730xd (1x E5-2650 v4, 64GB, 4 HDDs) | 120W | 200W | $126-210 |
| HP DL380 Gen9 (2x E5-2640 v4, 64GB, 8 SSDs) | 100W | 250W | $105-263 |
| Dell T620 (2x E5-2650 v2, 64GB, 6 HDDs) | 150W | 300W | $158-315 |
| For comparison: Intel N100 mini PC | 8W | 25W | $8-26 |

**The math is brutal.** A R730xd at 180W idle costs $190/year in electricity. An [N100 mini PC](/hardware/intel-n100-mini-pc/) at 8W idle costs $8/year. Over 3 years, the N100 saves $546 in electricity — more than both devices cost to buy.

### Power Reduction Tips

1. **Remove one CPU** — If you don't need all cores, pull one CPU and its DIMMs. Saves 40-60W idle.
2. **Use only needed RAM** — Each DIMM draws 3-5W. 64GB (4x16GB) vs 256GB (16x16GB) saves 36-60W.
3. **Spin down idle HDDs** — Configure RAID controller or OS to spin down disks after 15-30 minutes of inactivity. Saves 6-8W per drive.
4. **Enable C-states in BIOS** — Allow the CPU to enter deep sleep states when idle. Can save 20-40W.
5. **Use SSDs where possible** — SSDs draw 2-3W vs HDDs at 6-8W.

## What Can You Run?

An enterprise server with dual Xeons and 128GB RAM handles massive workloads:

| Workload | CPU Cores Used | RAM Used | Notes |
|----------|---------------|----------|-------|
| [Proxmox](/hardware/proxmox-hardware-guide/) with 10+ VMs | 10-20 | 64-128 GB | The primary use case |
| [TrueNAS](/hardware/synology-vs-truenas/) with ZFS | 4-8 | 32-64 GB | 1GB RAM per TB of storage is a myth, but more helps |
| [Plex](/apps/plex/) transcoding (4 streams) | 8 | 4 GB | Quick Sync not available — CPU transcode only |
| [Nextcloud](/apps/nextcloud/) + [Immich](/apps/immich/) + 20 more containers | 8-12 | 16-32 GB | Barely touching the available resources |
| Kubernetes cluster (single-node) | All of them | All of it | Enterprise servers are where K8s starts to make sense |
| AI/ML inference (with GPU) | 4-8 + GPU | 16-32 GB | GPU passthrough to VM, run Ollama/LLaMA |

## Noise Management

Enterprise rack servers are designed for data centers, not bedrooms. Expect 40-50 dBA under load — louder than a refrigerator.

**Options:**
1. **Put it somewhere you can't hear it** — basement, garage, closet with ventilation. Run Ethernet to your main network.
2. **Fan mod** — Replace stock fans with Noctua equivalents. Works on some servers (Dell T620, Supermicro towers) but many rack servers have proprietary fan connectors.
3. **IPMI fan control** — Some Supermicro boards allow fan speed control via `ipmitool`:
   ```bash
   # Set fans to manual mode
   ipmitool raw 0x30 0x45 0x01 0x01
   # Set fan speed to 30% (0x1E = 30 in hex)
   ipmitool raw 0x30 0x70 0x66 0x01 0x00 0x1E
   ```
4. **Accept it** — If it's in a garage or basement, the noise doesn't matter.

See the [noise reduction guide](/hardware/home-server-noise-reduction/) for detailed strategies.

## Enterprise vs Consumer: Decision Matrix

| Factor | Enterprise Server | Consumer Mini PC / Desktop |
|--------|------------------|---------------------------|
| Purchase cost | $150-400 | $150-400 |
| Electricity (annual) | $120-370 | $8-50 |
| Noise | 35-50 dBA | 0-30 dBA |
| Max RAM | 256-768 GB | 32-64 GB |
| Max storage bays | 8-24 | 1-2 internal |
| CPU power | 20-44 cores | 4-8 cores |
| Remote management | iDRAC/iLO/IPMI | None (SSH only) |
| Physical size | 2U-4U rack | Fits on a shelf |
| Redundancy | Dual PSU, ECC, hot-swap | None |

**Choose enterprise when:** You need more than 64GB RAM, more than 4 drive bays, run Proxmox with many VMs, or need IPMI remote management.

**Choose consumer when:** Your workload fits in 32GB RAM, you value silence and low power, and you don't need hot-swap drive bays.

## FAQ

### Are used enterprise servers reliable?

Very. These servers ran 24/7 in climate-controlled data centers with UPS power. They're designed for 5-7 years of continuous operation. The biggest failure points are HDDs (replace with your own) and PSU fans (replace if noisy). CPUs, motherboards, and RAM rarely fail.

### Should I buy a server with or without drives?

Without. Data center pulls often include old, worn drives with thousands of power-on hours. Buy new NAS-grade drives ([WD Red Plus, Seagate IronWolf](/hardware/best-hard-drives-nas/)) for reliability.

### Can I use a PERC H730 with TrueNAS/ZFS?

Not well. The H730 can't be flashed to IT mode (HBA passthrough). ZFS needs direct access to drives — RAID controllers that hide individual drives behind a virtual disk are incompatible. Buy a Dell H310 Mini Mono (flashable to IT mode, ~$15) or an LSI 9211-8i (~$20) and use it instead of or alongside the H730.

### Is DDR3 too old?

For self-hosting workloads, DDR3 performs within 10-15% of DDR4 in real-world applications. The main downside is DDR3 uses more power per DIMM (~4-5W vs 3-4W for DDR4). For a 10-year-old used server at $100, the RAM generation is the least of your concerns.

### What about AMD EPYC servers?

Used EPYC 7001/7002 servers are starting to appear at reasonable prices ($300-600). They offer better performance per watt than Xeon E5, with more PCIe lanes and memory channels. If you find a deal on an EPYC 7302 (16 cores, 128MB L3 cache) system, it's excellent for self-hosting.

## Related

- [Used Dell OptiPlex Guide](/hardware/used-dell-optiplex/)
- [Used Lenovo ThinkCentre Guide](/hardware/used-lenovo-thinkcentre/)
- [Best Mini PCs for Home Servers](/hardware/best-mini-pc/)
- [Home Server Power Consumption Guide](/hardware/power-consumption-guide/)
- [Home Server Noise Reduction Guide](/hardware/home-server-noise-reduction/)
- [ECC vs Non-ECC RAM](/hardware/ecc-vs-non-ecc-ram/)
- [RAID Levels Explained](/hardware/raid-explained/)
- [Proxmox Hardware Guide](/hardware/proxmox-hardware-guide/)
